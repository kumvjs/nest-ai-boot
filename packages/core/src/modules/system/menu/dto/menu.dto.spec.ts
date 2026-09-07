import { validate } from 'class-validator'
import { MenuStatus, MenuType } from '../menu.types.js'
import { CreateMenuDto } from './create-menu.dto.js'

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
})
