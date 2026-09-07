import { validate } from 'class-validator'
import { MenuStatus, MenuType } from '../menu.types.js'
import { CreateMenuDto } from './create-menu.dto.js'
import { MenuNameExistsQueryDto, MenuPathExistsQueryDto } from './menu-exists-query.dto.js'

describe('vben menu DTO', () => {
  it.each(Object.values(MenuType))('accepts the Vben %s menu type', async (type) => {
    const dto = Object.assign(new CreateMenuDto(), {
      meta: { title: 'System menu', vendorExtension: true },
      name: 'SystemMenu',
      pid: '9007199254740993',
      status: MenuStatus.ENABLED,
      type,
    })

    await expect(validate(dto)).resolves.toEqual([])
  })

  it('rejects the removed numeric type and boolean status contracts', async () => {
    const dto = Object.assign(new CreateMenuDto(), {
      name: 'SystemMenu',
      status: true,
      type: 1,
    })

    const errors = await validate(dto)
    expect(errors.map(error => error.property)).toEqual(expect.arrayContaining(['status', 'type']))
  })

  it('accepts Vben menu existence queries with an optional positive bigint edit ID', async () => {
    const nameQuery = Object.assign(new MenuNameExistsQueryDto(), {
      id: '9007199254740993',
      name: 'SystemMenu',
    })
    const pathQuery = Object.assign(new MenuPathExistsQueryDto(), {
      path: '/system/menu',
    })

    await expect(validate(nameQuery)).resolves.toEqual([])
    await expect(validate(pathQuery)).resolves.toEqual([])
  })

  it('rejects missing lookup values and non-positive edit IDs', async () => {
    const nameQuery = Object.assign(new MenuNameExistsQueryDto(), { id: '0' })
    const pathQuery = Object.assign(new MenuPathExistsQueryDto(), { id: '-1' })

    const [nameErrors, pathErrors] = await Promise.all([
      validate(nameQuery),
      validate(pathQuery),
    ])
    expect(nameErrors.map(error => error.property)).toEqual(expect.arrayContaining(['id', 'name']))
    expect(pathErrors.map(error => error.property)).toEqual(expect.arrayContaining(['id', 'path']))
  })
})
