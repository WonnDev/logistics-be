import { Controller, Delete, Get, Injectable, Module, Param, Patch, Post, Body } from '@nestjs/common';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { PartialType } from '@nestjs/mapped-types';
import { CrudService } from '../common/mongoose/crud.service';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';

export enum CostStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
}

@Schema({ timestamps: true })
export class Cost {
  @Prop({ required: true, trim: true })
  tripCode!: string;

  @Prop({ required: true })
  startKm!: number;

  @Prop({ required: true })
  endKm!: number;

  @Prop({ required: true })
  totalKm!: number;

  @Prop({ required: true })
  fuelLiters!: number;

  @Prop({ required: true })
  fuelUnitPrice!: number;

  @Prop({ required: true })
  fuelInvoiceAmount!: number;

  @Prop({ required: true })
  fuelTotal!: number;

  @Prop({ default: 0 })
  maintenanceCost!: number;

  @Prop({ default: 0 })
  vetcCost!: number;

  @Prop({ default: 0 })
  loadingFee!: number;

  @Prop({ default: 0 })
  parkingFee!: number;

  @Prop({ default: 0 })
  turnaroundAllowance!: number;

  @Prop({ default: 0 })
  otherFee!: number;

  @Prop({ default: 0 })
  totalCost!: number;

  @Prop({ trim: true, default: CostStatus.Pending })
  status!: CostStatus;

  @Prop({ trim: true })
  note?: string;
}

export type CostDocument = HydratedDocument<Cost>;
export const CostSchema = SchemaFactory.createForClass(Cost);

export class CreateCostDto {
  @ApiProperty({ example: 'TRIP-20260623-2083' })
  @IsString()
  tripCode!: string;

  @ApiProperty({ example: 155385 })
  @IsNumber()
  startKm!: number;

  @ApiProperty({ example: 155865 })
  @IsNumber()
  endKm!: number;

  @ApiProperty({ example: 480 })
  @IsNumber()
  totalKm!: number;

  @ApiProperty({ example: 48 })
  @IsNumber()
  fuelLiters!: number;

  @ApiProperty({ example: 24000 })
  @IsNumber()
  fuelUnitPrice!: number;

  @ApiProperty({ example: 1152000 })
  @IsNumber()
  fuelInvoiceAmount!: number;

  @ApiProperty({ example: 1152000 })
  @IsNumber()
  fuelTotal!: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  maintenanceCost?: number;

  @ApiPropertyOptional({ example: 267440 })
  @IsOptional()
  @IsNumber()
  vetcCost?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  loadingFee?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  parkingFee?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  turnaroundAllowance?: number;

  @ApiPropertyOptional({ example: 100000 })
  @IsOptional()
  @IsNumber()
  otherFee?: number;

  @ApiPropertyOptional({ enum: CostStatus, example: CostStatus.Approved })
  @IsOptional()
  @IsEnum(CostStatus)
  status?: CostStatus;

  @ApiPropertyOptional({ example: 'Phu cap quay dau + CN' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateCostDto extends PartialType(CreateCostDto) {}

@Injectable()
export class CostsService extends CrudService<CostDocument> {
  constructor(@InjectModel(Cost.name) model: Model<CostDocument>) {
    super(model, 'Cost');
  }
}

@ApiTags('costs')
@ApiBearerAuth()
@Controller('costs')
export class CostsController {
  constructor(private readonly costsService: CostsService) {}

  @Get()
  @ApiOperation({ summary: 'List costs' })
  findAll() {
    return this.costsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get cost by id' })
  findOne(@Param('id') id: string) {
    return this.costsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create cost' })
  create(@Body() dto: CreateCostDto) {
    return this.costsService.create({
      tripCode: dto.tripCode,
      startKm: dto.startKm,
      endKm: dto.endKm,
      totalKm: dto.totalKm,
      fuelLiters: dto.fuelLiters,
      fuelUnitPrice: dto.fuelUnitPrice,
      fuelInvoiceAmount: dto.fuelInvoiceAmount,
      fuelTotal: dto.fuelTotal,
      maintenanceCost: dto.maintenanceCost ?? 0,
      vetcCost: dto.vetcCost ?? 0,
      loadingFee: dto.loadingFee ?? 0,
      parkingFee: dto.parkingFee ?? 0,
      turnaroundAllowance: dto.turnaroundAllowance ?? 0,
      otherFee: dto.otherFee ?? 0,
      totalCost: dto.fuelTotal + (dto.maintenanceCost ?? 0) + (dto.vetcCost ?? 0) + (dto.loadingFee ?? 0) + (dto.parkingFee ?? 0) + (dto.turnaroundAllowance ?? 0) + (dto.otherFee ?? 0),
      status: dto.status ?? CostStatus.Pending,
      note: dto.note,
    } as Partial<CostDocument>);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update cost' })
  update(@Param('id') id: string, @Body() dto: UpdateCostDto) {
    return this.costsService.update(id, {
      tripCode: dto.tripCode,
      startKm: dto.startKm,
      endKm: dto.endKm,
      totalKm: dto.totalKm,
      fuelLiters: dto.fuelLiters,
      fuelUnitPrice: dto.fuelUnitPrice,
      fuelInvoiceAmount: dto.fuelInvoiceAmount,
      fuelTotal: dto.fuelTotal,
      maintenanceCost: dto.maintenanceCost,
      vetcCost: dto.vetcCost,
      loadingFee: dto.loadingFee,
      parkingFee: dto.parkingFee,
      turnaroundAllowance: dto.turnaroundAllowance,
      otherFee: dto.otherFee,
      totalCost:
        dto.totalKm ?? dto.fuelTotal ?? 0
          ? (dto.fuelTotal ?? 0) + (dto.maintenanceCost ?? 0) + (dto.vetcCost ?? 0) + (dto.loadingFee ?? 0) + (dto.parkingFee ?? 0) + (dto.turnaroundAllowance ?? 0) + (dto.otherFee ?? 0)
          : undefined,
      status: dto.status,
      note: dto.note,
    } as Partial<CostDocument>);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete cost' })
  remove(@Param('id') id: string) {
    return this.costsService.remove(id);
  }
}

@Module({
  imports: [MongooseModule.forFeature([{ name: Cost.name, schema: CostSchema }])],
  controllers: [CostsController],
  providers: [CostsService],
  exports: [CostsService, MongooseModule],
})
export class CostsModule {}
