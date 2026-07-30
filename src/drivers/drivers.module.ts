import { Controller, Delete, Get, Injectable, Module, Param, Patch, Post, Body } from '@nestjs/common';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { PartialType } from '@nestjs/mapped-types';
import { CrudService } from '../common/mongoose/crud.service';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';

export enum DriverStatus {
  Active = 'active',
  Suspended = 'suspended',
  Inactive = 'inactive',
}

@Schema({ timestamps: true })
export class Driver {
  @Prop({ required: true, trim: true })
  fullName!: string;

  @Prop({ required: true, unique: true, trim: true })
  licenseNumber!: string;

  @Prop({ required: true, trim: true })
  phone!: string;

  @Prop({ required: true, enum: DriverStatus, default: DriverStatus.Active })
  status!: DriverStatus;
}

export type DriverDocument = HydratedDocument<Driver>;
export const DriverSchema = SchemaFactory.createForClass(Driver);

export class CreateDriverDto {
  @ApiProperty({ example: 'ADMIN' })
  @IsString()
  fullName!: string;

  @ApiProperty({ example: 'DL-0001' })
  @IsString()
  licenseNumber!: string;

  @ApiProperty({ example: '0901234567' })
  @IsString()
  phone!: string;

  @ApiProperty({ enum: DriverStatus, example: DriverStatus.Active })
  @IsEnum(DriverStatus)
  status!: DriverStatus;
}

export class UpdateDriverDto extends PartialType(CreateDriverDto) {}

@Injectable()
export class DriversService extends CrudService<DriverDocument> {
  constructor(@InjectModel(Driver.name) model: Model<DriverDocument>) {
    super(model, 'Driver');
  }
}

@ApiTags('drivers')
@ApiBearerAuth()
@Controller('drivers')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Get()
  @ApiOperation({ summary: 'List drivers' })
  findAll() {
    return this.driversService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get driver by id' })
  findOne(@Param('id') id: string) {
    return this.driversService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create driver' })
  create(@Body() dto: CreateDriverDto) {
    return this.driversService.create(dto as Partial<DriverDocument>);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update driver' })
  update(@Param('id') id: string, @Body() dto: UpdateDriverDto) {
    return this.driversService.update(id, dto as Partial<DriverDocument>);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete driver' })
  remove(@Param('id') id: string) {
    return this.driversService.remove(id);
  }
}

@Module({
  imports: [MongooseModule.forFeature([{ name: Driver.name, schema: DriverSchema }])],
  controllers: [DriversController],
  providers: [DriversService],
  exports: [DriversService, MongooseModule],
})
export class DriversModule {}
