import { PartialType } from '@nestjs/swagger';
import { CreateSysUserDto } from './create-sys-user.dto';

export class UpdateSysUserDto extends PartialType(CreateSysUserDto) {}
