import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common'
import { CreateMenuDto } from './dto/create-menu.dto.js'
import { UpdateMenuDto } from './dto/update-menu.dto.js'
import { MenuService } from './menu.service.js'

@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}
}
