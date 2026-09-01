import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common'
import { CreateRoleDto } from './dto/create-role.dto.js'
import { UpdateRoleDto } from './dto/update-role.dto.js'
import { RoleService } from './role.service.js'

@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}
}
