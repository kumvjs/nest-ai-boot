import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  diffSnapshots,
  extractFrontendCalls,
  mockRouteFromFile,
} from './vben-contract.mjs'

const lock = {
  sources: {
    backend: ['apps/backend-mock/api'],
    behavior: ['playground/src/views/system'],
    frontend: ['playground/src/api'],
    mockData: ['apps/backend-mock/utils/mock-data.ts'],
    types: ['packages/types'],
  },
}

function endpoint(method, path, source, requestSignature = '', responseSignature = '') {
  return {
    callers: [{
      client: 'requestClient',
      requestSignature,
      responseSignature,
      source,
    }],
    method,
    mockContracts: [],
    mockImplemented: false,
    path,
  }
}

test('extracts typed, multiline, and template-literal client calls', () => {
  const source = `
    requestClient.get<Array<Item>>(\n  '/system/item/list', { params }\n)
    requestClient.put(\`/system/item/\${id}\`, data)
    requestClient.upload('/upload', { file })
    requestClient.download('https://example.test/file')
  `

  assert.deepEqual(extractFrontendCalls(source), [
    {
      client: 'requestClient',
      method: 'GET',
      path: '/system/item/list',
      requestSignature: '{ params }',
      responseSignature: '<Array<Item>>',
    },
    {
      client: 'requestClient',
      method: 'PUT',
      path: '/system/item/:id',
      requestSignature: 'data',
      responseSignature: '',
    },
    {
      client: 'requestClient',
      method: 'POST',
      path: '/upload',
      requestSignature: '{ file }',
      responseSignature: '',
    },
  ])
})

test('normalizes Nitro hidden method files and dynamic parameters', () => {
  const root = '/source/apps/backend-mock/api'
  assert.deepEqual(
    mockRouteFromFile(root, `${root}/system/dept/.post.ts`),
    { method: 'POST', path: '/system/dept' },
  )
  assert.deepEqual(
    mockRouteFromFile(root, `${root}/system/dept/[id].delete.ts`),
    { method: 'DELETE', path: '/system/dept/:id' },
  )
})

test('classifies route, request, response, coverage, and source changes', () => {
  const baseline = {
    frontendEndpoints: [
      endpoint('GET', '/gone', 'playground/src/api/gone.ts'),
      endpoint('GET', '/method', 'playground/src/api/method.ts'),
      endpoint('GET', '/old', 'playground/src/api/rename.ts'),
      {
        ...endpoint('GET', '/stable', 'playground/src/api/stable.ts', '{ before: true }', '<Before>'),
        mockContracts: [{ hash: 'before', source: 'apps/backend-mock/api/stable.ts' }],
        mockImplemented: true,
      },
    ],
    sourceHashes: {
      'apps/backend-mock/api/stable.ts': 'before',
      'apps/backend-mock/utils/mock-data.ts': 'before',
      'playground/src/api/stable.ts': 'before',
    },
    upstream: { commit: 'a'.repeat(40), tag: 'before' },
  }
  const candidate = {
    frontendEndpoints: [
      endpoint('POST', '/method', 'playground/src/api/method.ts'),
      endpoint('POST', '/new', 'playground/src/api/new.ts'),
      endpoint('GET', '/renamed', 'playground/src/api/rename.ts'),
      {
        ...endpoint('GET', '/stable', 'playground/src/api/stable.ts', '{ after: true }', '<After>'),
        mockContracts: [],
        mockImplemented: false,
      },
    ],
    sourceHashes: {
      'apps/backend-mock/utils/mock-data.ts': 'after',
      'playground/src/api/stable.ts': 'after',
    },
    upstream: { commit: 'b'.repeat(40), tag: 'after' },
  }

  const diff = diffSnapshots(lock, baseline, candidate)

  assert.deepEqual(diff.summary, {
    added: 1,
    methodChanged: 1,
    mockCoverageChanged: 1,
    removed: 1,
    renamed: 1,
    requestChanged: 1,
    responseChanged: 1,
    sourceChanged: 3,
  })
  assert.equal(diff.hasChanges, true)
  assert.equal(diff.mockDataOnly, false)
  assert.deepEqual(diff.changes.renamed, [
    { from: '/old', method: 'GET', to: '/renamed' },
  ])
})
