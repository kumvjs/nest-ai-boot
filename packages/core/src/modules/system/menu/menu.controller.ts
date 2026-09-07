import { Controller } from '@nestjs/common'
import { MenuService } from './menu.service.js'

@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}
}
