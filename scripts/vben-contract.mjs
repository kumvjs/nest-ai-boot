#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '..')
const lockPath = join(repositoryRoot, 'contracts/vben/upstream.lock.json')
const supportedMethods = new Set(['delete', 'get', 'patch', 'post', 'put'])

function fail(message) {
  console.error(`[vben-contract] ${message}`)
  process.exitCode = 1
}

function loadJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function parseArguments(argv) {
  const [command = 'generate', ...rest] = argv
  const options = { command, source: undefined, write: false }

  for (let index = 0; index < rest.length; index += 1) {
    const argument = rest[index]
    if (argument === '--source') {
      options.source = resolve(rest[index + 1] ?? '')
      index += 1
    }
    else if (argument === '--write') {
      options.write = true
    }
    else {
      throw new Error(`Unknown argument: ${argument}`)
    }
  }

  if (!['check', 'generate'].includes(command))
    throw new Error(`Unknown command: ${command}`)

  return options
}

function runGit(arguments_, options = {}) {
  const result = spawnSync('git', arguments_, {
    cwd: options.cwd,
    encoding: 'utf8',
    stdio: options.inherit ? 'inherit' : 'pipe',
  })

  if (result.status !== 0) {
    const details = result.stderr?.trim() || result.stdout?.trim() || `exit ${result.status}`
    throw new Error(`git ${arguments_.join(' ')} failed: ${details}`)
  }

  return result.stdout?.trim() ?? ''
}

function collectedPaths(lock) {
  return [...new Set(Object.values(lock.sources).flat())]
}

function createSparseClone(lock) {
  const temporaryRoot = mkdtempSync(join(tmpdir(), 'nest-ai-boot-vben-'))
  const sourceRoot = join(temporaryRoot, 'vue-vben-admin')

  try {
    runGit([
      'clone',
      '--depth',
      '1',
      '--branch',
      lock.tag,
      '--filter=blob:none',
      '--sparse',
      lock.repository,
      sourceRoot,
    ], { inherit: true })
    runGit(['sparse-checkout', 'set', ...collectedPaths(lock)], { cwd: sourceRoot })
  }
  catch (error) {
    rmSync(temporaryRoot, { force: true, recursive: true })
    throw error
  }

  return { sourceRoot, temporaryRoot }
}

function verifySource(lock, sourceRoot) {
  if (!existsSync(sourceRoot))
    throw new Error(`Source directory does not exist: ${sourceRoot}`)

  const commit = runGit(['rev-parse', 'HEAD'], { cwd: sourceRoot })
  if (commit !== lock.commit) {
    throw new Error(
      `Source commit ${commit} does not match locked commit ${lock.commit}`,
    )
  }

  for (const path of collectedPaths(lock)) {
    const absolutePath = join(sourceRoot, path)
    if (!existsSync(absolutePath))
      throw new Error(`Locked source path is missing: ${path}`)
  }
}

function walkFiles(root, predicate) {
  const files = []
  for (const entry of readdirSync(root).sort()) {
    const absolutePath = join(root, entry)
    if (statSync(absolutePath).isDirectory())
      files.push(...walkFiles(absolutePath, predicate))
    else if (predicate(absolutePath))
      files.push(absolutePath)
  }
  return files
}

function sha256(content) {
  return createHash('sha256').update(content).digest('hex')
}

function findCallParenthesis(source, start) {
  let angleDepth = 0
  for (let index = start; index < source.length; index += 1) {
    const character = source[index]
    if (character === '<')
      angleDepth += 1
    else if (character === '>' && angleDepth > 0)
      angleDepth -= 1
    else if (character === '(' && angleDepth === 0)
      return index
    else if (!/\s/u.test(character) && angleDepth === 0)
      return -1
  }
  return -1
}

function readStringLiteral(source, start) {
  const quote = source[start]
  if (!['"', "'", '`'].includes(quote))
    return undefined

  let value = ''
  for (let index = start + 1; index < source.length; index += 1) {
    const character = source[index]
    if (character === '\\') {
      value += character + (source[index + 1] ?? '')
      index += 1
    }
    else if (character === quote) {
      return value
    }
    else {
      value += character
    }
  }
  return undefined
}

function normalizeRoutePath(path) {
  return path
    .replace(/\$\{\s*([\w.]+)\s*\}/gu, (_, expression) => `:${expression.split('.').at(-1)}`)
    .replace(/\/{2,}/gu, '/')
}

function extractFrontendCalls(source) {
  const calls = []
  const callPattern = /\b(baseRequestClient|requestClient)\s*\.\s*(delete|download|get|patch|post|put|upload)\b/gu

  for (const match of source.matchAll(callPattern)) {
    const parenthesis = findCallParenthesis(source, match.index + match[0].length)
    if (parenthesis < 0)
      continue

    let argumentStart = parenthesis + 1
    while (/\s/u.test(source[argumentStart] ?? ''))
      argumentStart += 1

    const rawPath = readStringLiteral(source, argumentStart)
    if (!rawPath || !rawPath.startsWith('/') || rawPath.startsWith('//'))
      continue

    const clientMethod = match[2]
    if (clientMethod === 'download')
      continue

    calls.push({
      client: match[1],
      method: clientMethod === 'upload' ? 'POST' : clientMethod.toUpperCase(),
      path: normalizeRoutePath(rawPath),
    })
  }

  return calls
}

function mockRouteFromFile(apiRoot, file) {
  const relativePath = relative(apiRoot, file).replaceAll('\\', '/')
  const segments = relativePath.replace(/\.ts$/u, '').split('/')
  const fileParts = segments.at(-1).split('.')
  const possibleMethod = fileParts.at(-1).toLowerCase()
  const method = supportedMethods.has(possibleMethod)
    ? possibleMethod.toUpperCase()
    : 'ANY'

  if (method !== 'ANY')
    fileParts.pop()
  segments[segments.length - 1] = fileParts.join('.')

  const path = `/${segments
    .filter(segment => segment !== '' && segment !== 'index')
    .map(segment => segment.replace(/^\[([^\.]+)\]$/u, ':$1'))
    .join('/')}`

  return { method, path }
}

function endpointCategory(path) {
  if (path.startsWith('/system/'))
    return 'system'
  if (path.startsWith('/timezone/'))
    return 'preference'
  if (['/demo/bigint', '/status', '/table/list', '/upload'].includes(path))
    return 'playground'
  return 'runtime'
}

function endpointSort(left, right) {
  return left.path.localeCompare(right.path) || left.method.localeCompare(right.method)
}

function buildSnapshot(lock, sourceRoot) {
  const frontendFiles = lock.sources.frontend
    .flatMap(path => walkFiles(join(sourceRoot, path), file => file.endsWith('.ts')))
  const apiRoot = join(sourceRoot, lock.sources.backend[0])
  const mockFiles = walkFiles(apiRoot, file => file.endsWith('.ts'))
  const endpoints = new Map()
  const sourceHashes = {}

  for (const file of [...new Set([...frontendFiles, ...mockFiles])].sort()) {
    const source = readFileSync(file, 'utf8')
    sourceHashes[relative(sourceRoot, file).replaceAll('\\', '/')] = sha256(source)
  }

  for (const file of frontendFiles) {
    const source = readFileSync(file, 'utf8')
    const caller = relative(sourceRoot, file).replaceAll('\\', '/')
    for (const call of extractFrontendCalls(source)) {
      const key = `${call.method} ${call.path}`
      const endpoint = endpoints.get(key) ?? {
        category: endpointCategory(call.path),
        callers: [],
        method: call.method,
        mockHandlers: [],
        mockImplemented: false,
        path: call.path,
      }
      endpoint.callers.push({ client: call.client, source: caller })
      endpoints.set(key, endpoint)
    }
  }

  const mockRoutes = mockFiles.map((file) => ({
    ...mockRouteFromFile(apiRoot, file),
    source: relative(sourceRoot, file).replaceAll('\\', '/'),
  }))

  for (const endpoint of endpoints.values()) {
    endpoint.callers.sort((left, right) =>
      left.source.localeCompare(right.source) || left.client.localeCompare(right.client))
    endpoint.mockHandlers = mockRoutes
      .filter(route => route.path === endpoint.path && (route.method === 'ANY' || route.method === endpoint.method))
      .map(route => route.source)
      .sort()
    endpoint.mockImplemented = endpoint.mockHandlers.length > 0
  }

  const frontendEndpoints = [...endpoints.values()].sort(endpointSort)
  const mockOnlyRoutes = mockRoutes
    .filter(route => !frontendEndpoints.some(endpoint =>
      endpoint.path === route.path && (route.method === 'ANY' || route.method === endpoint.method)))
    .sort(endpointSort)

  const summary = {
    frontendEndpoints: frontendEndpoints.length,
    frontendEndpointsMissingFromMock: frontendEndpoints.filter(endpoint => !endpoint.mockImplemented).length,
    mockImplementedFrontendEndpoints: frontendEndpoints.filter(endpoint => endpoint.mockImplemented).length,
    mockOnlyDiagnostics: mockOnlyRoutes.length,
  }

  for (const [field, expected] of Object.entries(lock.expected)) {
    if (summary[field] !== expected) {
      throw new Error(
        `Expected ${field}=${expected}, received ${summary[field]}. `
        + 'Review the upstream contract before updating the lock.',
      )
    }
  }

  return {
    schemaVersion: 1,
    upstream: {
      collectedAt: lock.collectedAt,
      commit: lock.commit,
      repository: lock.repository,
      tag: lock.tag,
    },
    summary,
    frontendEndpoints,
    mockOnlyRoutes,
    sourceHashes,
  }
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`
}

function main() {
  const options = parseArguments(process.argv.slice(2))
  const lock = loadJson(lockPath)
  const snapshotPath = join(repositoryRoot, lock.snapshot)
  let temporaryRoot
  let sourceRoot = options.source

  try {
    if (!sourceRoot) {
      const clone = createSparseClone(lock)
      temporaryRoot = clone.temporaryRoot
      sourceRoot = clone.sourceRoot
    }

    verifySource(lock, sourceRoot)
    const actual = stableJson(buildSnapshot(lock, sourceRoot))

    if (options.command === 'check') {
      if (!existsSync(snapshotPath))
        throw new Error(`Snapshot does not exist: ${relative(repositoryRoot, snapshotPath)}`)
      const expected = readFileSync(snapshotPath, 'utf8')
      if (actual !== expected)
        throw new Error('Generated snapshot differs from the committed snapshot')
      console.log(`[vben-contract] snapshot verified: ${lock.snapshot}`)
    }
    else if (options.write) {
      mkdirSync(dirname(snapshotPath), { recursive: true })
      writeFileSync(snapshotPath, actual)
      console.log(`[vben-contract] snapshot written: ${lock.snapshot}`)
    }
    else {
      process.stdout.write(actual)
    }
  }
  finally {
    if (temporaryRoot)
      rmSync(temporaryRoot, { force: true, recursive: true })
  }
}

try {
  main()
}
catch (error) {
  fail(error instanceof Error ? error.message : String(error))
}
