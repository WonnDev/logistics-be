import { Module, Injectable, Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { MongooseModule, InjectModel } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { PartialType } from '@nestjs/mapped-types';
import * as bcrypt from 'bcryptjs';
import { CrudService } from '../common/mongoose/crud.service';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';

export enum UserRole {
  Admin = 'admin',
  Manager = 'manager',
  Operator = 'operator',
  Viewer = 'viewer',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, trim: true })
  username!: string;

  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  email!: string;

  @Prop({ required: true, select: false })
  passwordHash!: string;

  @Prop({ required: true, trim: true })
  fullName!: string;

  @Prop({ required: true, enum: UserRole, default: UserRole.Operator })
  role!: UserRole;

  @Prop({ default: true })
  isActive!: boolean;
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  username!: string;

  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty()
  @IsString()
  fullName!: string;

  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  role!: UserRole;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@Injectable()
export class UsersService extends CrudService<UserDocument> {
  constructor(@InjectModel(User.name) model: Model<UserDocument>) {
    super(model, 'User');
  }

  async findByUsername(username: string) {
    return this.model.findOne({ $or: [{ username: username }, { email: username }] }).select('+passwordHash').exec();
  }

  async createUser(dto: CreateUserDto) {
    return this.create({
      username: dto.username,
      email: dto.email.toLowerCase(),
      fullName: dto.fullName,
      role: dto.role,
      isActive: true,
      passwordHash: await bcrypt.hash(dto.password, 10),
    } as Partial<UserDocument>);
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    const payload: Partial<User> & { passwordHash?: string } = {
      username: dto.username,
      email: dto.email?.toLowerCase(),
      fullName: dto.fullName,
      role: dto.role,
      isActive: dto.isActive,
    };

    if (dto.password) {
      payload.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    return this.update(id, payload as Partial<UserDocument>);
  }
}

@ApiTags('users')
@ApiBearerAuth()
@Roles(UserRole.Admin)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List users' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by id' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create user' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.createUser(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateUser(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, MongooseModule],
})
export class UsersModule {}
