import { Controller, Delete, Get, Injectable, Module, Param, Patch, Post, Body } from '@nestjs/common';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { PartialType } from '@nestjs/mapped-types';
import { CrudService } from '../common/mongoose/crud.service';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';

export enum VehicleStatus {
  Active = 'active',
  Maintenance = 'maintenance',
  Inactive = 'inactive',
}

@Schema({ timestamps: true })
export class Vehicle {
  @Prop({ required: true, unique: true, trim: true })
  plateNumber!: string;

  @Prop({ required: true, trim: true })
  brand!: string;

  @Prop({ required: true, trim: true })
  model!: string;

  @Prop({ required: true, enum: VehicleStatus, default: VehicleStatus.Active })
  status!: VehicleStatus;

  @Prop({ default: 0 })
  mileage!: number;
}

export type VehicleDocument = HydratedDocument<Vehicle>;
export const VehicleSchema = SchemaFactory.createForClass(Vehicle);

export class CreateVehicleDto {
  @ApiProperty({ example: '99F00379' })
  @IsString()
  plateNumber!: string;

  @ApiProperty({ example: 'Wonn' })
  @IsString()
  brand!: string;

  @ApiProperty({ example: '8T' })
  @IsString()
  model!: string;

  @ApiProperty({ enum: VehicleStatus, example: VehicleStatus.Active })
  @IsEnum(VehicleStatus)
  status!: VehicleStatus;

  @ApiPropertyOptional({ example: 155385 })
  @IsOptional()
  @IsNumber()
  mileage?: number;
}

export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {}

@Injectable()
export class VehiclesService extends CrudService<VehicleDocument> {
  constructor(@InjectModel(Vehicle.name) model: Model<VehicleDocument>) {
    super(model, 'Vehicle');
  }
}

@ApiTags('vehicles')
@ApiBearerAuth()
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  @ApiOperation({ summary: 'List vehicles' })
  findAll() {
    return this.vehiclesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vehicle by id' })
  findOne(@Param('id') id: string) {
    return this.vehiclesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create vehicle' })
  create(@Body() dto: CreateVehicleDto) {
    return this.vehiclesService.create(dto as Partial<VehicleDocument>);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update vehicle' })
  update(@Param('id') id: string, @Body() dto: UpdateVehicleDto) {
    return this.vehiclesService.update(id, dto as Partial<VehicleDocument>);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete vehicle' })
  remove(@Param('id') id: string) {
    return this.vehiclesService.remove(id);
  }
}

@Module({
  imports: [MongooseModule.forFeature([{ name: Vehicle.name, schema: VehicleSchema }])],
  controllers: [VehiclesController],
  providers: [VehiclesService],
  exports: [VehiclesService, MongooseModule],
})
export class VehiclesModule {}
