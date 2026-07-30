import { Controller, Delete, Get, Injectable, Module, Param, Patch, Post, Body } from '@nestjs/common';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { PartialType } from '@nestjs/mapped-types';
import { CrudService } from '../common/mongoose/crud.service';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';

@Schema({ timestamps: true })
export class Maintenance {
  @Prop({ required: true, trim: true })
  vehiclePlate!: string;

  @Prop({ required: true, trim: true })
  maintenanceItem!: string;

  @Prop({ type: Date })
  repairDate?: Date;

  @Prop({ default: 0 })
  vehicleKm!: number;

  @Prop({ trim: true })
  garage?: string;

  @Prop({ default: 0 })
  cost!: number;

  @Prop({ trim: true })
  note?: string;
}

export type MaintenanceDocument = HydratedDocument<Maintenance>;
export const MaintenanceSchema = SchemaFactory.createForClass(Maintenance);

export class CreateMaintenanceDto {
  @ApiProperty({ example: '99F00927' })
  @IsString()
  vehiclePlate!: string;

  @ApiProperty({ example: 'Day sung hoi' })
  @IsString()
  maintenanceItem!: string;

  @ApiPropertyOptional({ example: '2026-06-23' })
  @IsOptional()
  @IsDateString()
  repairDate?: string;

  @ApiPropertyOptional({ example: 155385 })
  @IsOptional()
  @IsNumber()
  vehicleKm?: number;

  @ApiPropertyOptional({ example: 'Garage Bac Ninh' })
  @IsOptional()
  @IsString()
  garage?: string;

  @ApiPropertyOptional({ example: 350000 })
  @IsOptional()
  @IsNumber()
  cost?: number;

  @ApiPropertyOptional({ example: 'Thay moi day hoi' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateMaintenanceDto extends PartialType(CreateMaintenanceDto) {}

@Injectable()
export class MaintenanceService extends CrudService<MaintenanceDocument> {
  constructor(@InjectModel(Maintenance.name) model: Model<MaintenanceDocument>) {
    super(model, 'Maintenance');
  }

  async createMaintenance(dto: CreateMaintenanceDto) {
    return this.create({
      vehiclePlate: dto.vehiclePlate,
      maintenanceItem: dto.maintenanceItem,
      repairDate: dto.repairDate ? new Date(dto.repairDate) : undefined,
      vehicleKm: dto.vehicleKm ?? 0,
      garage: dto.garage,
      cost: dto.cost ?? 0,
      note: dto.note,
    } as Partial<MaintenanceDocument>);
  }

  async updateMaintenance(id: string, dto: UpdateMaintenanceDto) {
    return this.update(id, {
      vehiclePlate: dto.vehiclePlate,
      maintenanceItem: dto.maintenanceItem,
      repairDate: dto.repairDate ? new Date(dto.repairDate) : undefined,
      vehicleKm: dto.vehicleKm,
      garage: dto.garage,
      cost: dto.cost,
      note: dto.note,
    } as Partial<MaintenanceDocument>);
  }
}

@ApiTags('maintenance')
@ApiBearerAuth()
@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get()
  @ApiOperation({ summary: 'List maintenance records' })
  findAll() {
    return this.maintenanceService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get maintenance record by id' })
  findOne(@Param('id') id: string) {
    return this.maintenanceService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create maintenance record' })
  create(@Body() dto: CreateMaintenanceDto) {
    return this.maintenanceService.createMaintenance(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update maintenance record' })
  update(@Param('id') id: string, @Body() dto: UpdateMaintenanceDto) {
    return this.maintenanceService.updateMaintenance(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete maintenance record' })
  remove(@Param('id') id: string) {
    return this.maintenanceService.remove(id);
  }
}

@Module({
  imports: [MongooseModule.forFeature([{ name: Maintenance.name, schema: MaintenanceSchema }])],
  controllers: [MaintenanceController],
  providers: [MaintenanceService],
  exports: [MaintenanceService, MongooseModule],
})
export class MaintenanceModule {}
