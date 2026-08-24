import { randomBytes } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { EOL } from 'node:os'
import { resolve } from 'node:path'
import { stdin, stdout } from 'node:process'
import { createInterface } from 'node:readline/promises'
import { Writable } from 'node:stream'
import dataSource, { dataSourceOptions } from '../config/database.config'
import { Roles } from '../modules/auth/auth.constant'
import { SysRoleEntity } from '../modules/system/role/entities/role.entity'
import SysUserRoleEntity from '../modules/user/entities/user-role.entity'
import { SysUserEntity } from '../modules/user/entities/user.entity'

const ADMIN_ROLE_NAME = 'Administrator'
const SECRET_KEYS = ['JWT_SECRET', 'REFRESH_TOKEN_SECRET'] as const

function setEnvValue(content: string, key: string, value: string): string {
  const lineEnding = content.includes('\r\n') ? '\r\n' : '\n'
  const pattern = new RegExp(`^(\\s*${key}\\s*=\\s*).*$`, 'm')

  if (pattern.test(content)) {
    return content.replace(pattern, (_, prefix: string) => `${prefix}${value}`)
  }

  const separator = content.length > 0 && !content.endsWith('\n') ? lineEnding : ''
  return `${content}${separator}${key}=${value}${lineEnding}`
}

async function writeJwtSecrets(envPath: string): Promise<void> {
  let envContent = await readFile(envPath, 'utf8')

  for (const key of SECRET_KEYS) {
    envContent = setEnvValue(envContent, key, randomBytes(48).toString('base64url'))
  }

  await writeFile(envPath, envContent, 'utf8')
}

async function createAdmin(username: string, password: string): Promise<void> {
  await dataSource.transaction(async (manager) => {
    const roleRepository = manager.getRepository(SysRoleEntity)
    const userRepository = manager.getRepository(SysUserEntity)
    const userRoleRepository = manager.getRepository(SysUserRoleEntity)

    const existingUser = await userRepository.findOne({
      where: { username },
      withDeleted: true,
    })
    if (existingUser) {
      throw new Error(`User "${username}" already exists.`)
    }

    let adminRole = await roleRepository.findOne({
      where: { code: Roles.ADMIN },
      withDeleted: true,
    })

    if (adminRole?.deletedAt) {
      throw new Error('The admin role exists but has been deleted. Restore it before initialization.')
    }

    if (!adminRole) {
      adminRole = await roleRepository.save(roleRepository.create({
        name: ADMIN_ROLE_NAME,
        code: Roles.ADMIN,
        remark: 'System administrator',
        status: true,
        default: false,
      }))
    }

    const psalt = randomBytes(16).toString('hex')
    const adminUser = userRepository.create({
      username,
      psalt,
      role: Roles.ADMIN,
      nickname: username,
      status: true,
    })
    adminUser.password_hash = adminUser.encryptPassword(password, psalt)
    await userRepository.save(adminUser)

    await userRoleRepository.save(userRoleRepository.create({
      userId: adminUser.id,
      roleId: adminRole.id,
    }))
  })
}

async function main(): Promise<void> {
  const environment = process.env.NODE_ENV ?? 'local'
  const envPath = resolve(process.cwd(), `.env.${environment}`)
  await readFile(envPath, 'utf8')

  stdout.write(`Environment: ${environment}${EOL}`)
  stdout.write(`Database type: ${String(dataSourceOptions.type)}${EOL}`)

  let hideInput = false
  const mutedOutput = new Writable({
    write(chunk, encoding, callback) {
      if (!hideInput)
        stdout.write(chunk, encoding)
      callback()
    },
  })
  const readline = createInterface({
    input: stdin,
    output: mutedOutput,
    terminal: true,
  })

  const askPassword = async (prompt: string): Promise<string> => {
    stdout.write(prompt)
    hideInput = true
    try {
      return await readline.question('')
    }
    finally {
      hideInput = false
      stdout.write(EOL)
    }
  }

  try {
    const username = (await readline.question('Admin username: ')).trim()
    if (!username)
      throw new Error('Admin username cannot be empty.')
    if (username.length > 100)
      throw new Error('Admin username cannot exceed 100 characters.')

    const password = await askPassword('Admin password: ')
    if (password.length < 8)
      throw new Error('Admin password must contain at least 8 characters.')

    const confirmation = await askPassword('Confirm password: ')
    if (password !== confirmation)
      throw new Error('Passwords do not match.')

    await dataSource.initialize()
    await createAdmin(username, password)
    await writeJwtSecrets(envPath)

    stdout.write(`Framework initialization completed.${EOL}`)
    stdout.write(`JWT secrets were written to ${envPath}.${EOL}`)
  }
  finally {
    readline.close()
    if (dataSource.isInitialized)
      await dataSource.destroy()
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`Initialization failed: ${message}`)
  process.exitCode = 1
})
