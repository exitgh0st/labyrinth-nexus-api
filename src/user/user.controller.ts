import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-user-password.dto';
import { FindAllUsersDto } from './dto/find-all-users.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { FormattedSafeUser } from './utils/transform-user.util';

@Controller('users')
@UseGuards(RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('ADMIN')
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @Roles('ADMIN', 'USER')
  findAll(@Query() query: FindAllUsersDto) {
    return this.userService.findAll(query);
  }

  @Get(':id')
  @Roles('ADMIN', 'USER')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'USER')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: FormattedSafeUser,
  ) {
    // Check if user is admin or updating their own profile
    const isAdmin = currentUser.roles.some(role => role.name === 'ADMIN');
    if (!isAdmin && currentUser.id !== id) {
      throw new ForbiddenException('You can only update your own profile');
    }

    return this.userService.update(id, updateUserDto);
  }

  @Patch(':id/password')
  @Roles('ADMIN', 'USER')
  updatePassword(
    @Param('id') id: string,
    @Body() updatePasswordDto: UpdatePasswordDto,
    @CurrentUser() currentUser: FormattedSafeUser,
  ) {
    // Check if user is admin or updating their own password
    const isAdmin = currentUser.roles.some(role => role.name === 'ADMIN');
    if (!isAdmin && currentUser.id !== id) {
      throw new ForbiddenException('You can only update your own password');
    }

    return this.userService.updatePassword(id, updatePasswordDto.password);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.userService.delete(id);
  }
}