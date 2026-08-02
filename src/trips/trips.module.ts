import {
  BadRequestException,
  ConflictException,
  Controller,
  Delete,
  Get,
  Injectable,
  Module,
  Param,
  Patch,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  Res,
} from '@nestjs/common';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { PartialType } from '@nestjs/mapped-types';
import { CrudService } from '../common/mongoose/crud.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Response } from 'express';
import { ImportExportModule, ImportExportService } from '../import-export/import-export.module';
import { SpreadsheetTripRow, TripImportResult } from '../import-export/import-export.module';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { InjectModel as InjectRelationModel } from '@nestjs/mongoose';
import { Customer } from '../customers/customers.module';
import { CustomersModule } from '../customers/customers.module';
import { Driver } from '../drivers/drivers.module';
import { DriversModule } from '../drivers/drivers.module';
import { Vehicle } from '../vehicles/vehicles.module';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { Logger } from '@nestjs/common';

export enum TripStatus {
  Draft = 'draft',
  Planned = 'planned',
  InTransit = 'in_transit',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

export enum TripCostStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
}

export enum TripPodStatus {
  Pending = 'pending',
  Uploaded = 'uploaded',
  Received = 'received',
}

@Schema({ timestamps: true })
export class Trip {
  @Prop({ required: true, unique: true, trim: true })
  tripCode!: string;

  @Prop({ trim: true })
  refCode?: string;

  @Prop({ trim: true })
  sales?: string;

  @Prop({ type: Number })
  cutoffMonth?: number;

  @Prop({ type: Number })
  month?: number;

  @Prop({ type: Date })
  deliveryDate?: Date;

  @Prop({ required: true, trim: true })
  origin!: string;

  @Prop({ required: true, trim: true })
  destination!: string;

  @Prop({ trim: true })
  vehicleId?: string;

  @Prop({ trim: true })
  vehiclePlate?: string;

  @Prop({ trim: true })
  driverId?: string;

  @Prop({ trim: true })
  driverName?: string;

  @Prop({ trim: true })
  customerId?: string;

  @Prop({ trim: true })
  customerName?: string;

  @Prop({ type: Date })
  departureAt?: Date;

  @Prop({ type: Date })
  arrivalAt?: Date;

  @Prop({ trim: true })
  vendor?: string;

  @Prop({ trim: true })
  truckType?: string;

  @Prop({ trim: true, default: TripPodStatus.Pending })
  podStatus!: TripPodStatus;

  @Prop({ trim: true, default: TripCostStatus.Pending })
  costStatus!: TripCostStatus;

  @Prop({ required: true, enum: TripStatus, default: TripStatus.Draft })
  status!: TripStatus;

  @Prop({ default: 0 })
  totalCost!: number;

  @Prop({ trim: true })
  notes?: string;
}

export type TripDocument = HydratedDocument<Trip>;
export const TripSchema = SchemaFactory.createForClass(Trip);

export class CreateTripDto {
  @ApiProperty({ example: 'TRIP-20260623-2083' })
  @IsString()
  tripCode!: string;

  @ApiPropertyOptional({ example: 'DMTLTP26060035' })
  @IsOptional()
  @IsString()
  refCode?: string;

  @ApiPropertyOptional({ example: 'ADMIN' })
  @IsOptional()
  @IsString()
  sales?: string;

  @ApiPropertyOptional({ example: 6 })
  @IsOptional()
  @IsNumber()
  cutoffMonth?: number;

  @ApiPropertyOptional({ example: 6 })
  @IsOptional()
  @IsNumber()
  month?: number;

  @ApiPropertyOptional({ example: '2026-06-23' })
  @IsOptional()
  @IsDateString()
  deliveryDate?: string;

  @ApiProperty({ example: 'Huu Nghi' })
  @IsString()
  origin!: string;

  @ApiProperty({ example: 'Bac Ninh' })
  @IsString()
  destination!: string;

  @ApiPropertyOptional({ example: '<vehicleObjectId>' })
  @IsOptional()
  @IsString()
  vehicleId?: string;

  @ApiPropertyOptional({ example: '99F00379' })
  @IsOptional()
  @IsString()
  vehiclePlate?: string;

  @ApiPropertyOptional({ example: '<driverObjectId>' })
  @IsOptional()
  @IsString()
  driverId?: string;

  @ApiPropertyOptional({ example: 'ADMIN' })
  @IsOptional()
  @IsString()
  driverName?: string;

  @ApiPropertyOptional({ example: '<customerObjectId>' })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ example: 'Arsenal' })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({ example: '2026-06-23T08:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  departureAt?: string;

  @ApiPropertyOptional({ example: '2026-06-23T12:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  arrivalAt?: string;

  @ApiPropertyOptional({ example: 'Wonn' })
  @IsOptional()
  @IsString()
  vendor?: string;

  @ApiPropertyOptional({ example: '8T' })
  @IsOptional()
  @IsString()
  truckType?: string;

  @ApiPropertyOptional({ enum: TripPodStatus, example: TripPodStatus.Pending })
  @IsOptional()
  @IsString()
  podStatus?: TripPodStatus;

  @ApiPropertyOptional({ enum: TripCostStatus, example: TripCostStatus.Approved })
  @IsOptional()
  @IsString()
  costStatus?: TripCostStatus;

  @ApiPropertyOptional({ enum: TripStatus, example: TripStatus.Completed })
  @IsOptional()
  @IsString()
  status?: TripStatus;

  @ApiPropertyOptional({ example: 1519440 })
  @IsOptional()
  @IsNumber()
  totalCost?: number;

  @ApiPropertyOptional({ example: 'refCode=DMTLTP26060035; vendor=Wonn; truckType=8T' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateTripDto extends PartialType(CreateTripDto) {}

@Injectable()
export class TripsService extends CrudService<TripDocument> {
  private readonly tripLogger = new Logger(TripsService.name);

  constructor(
    @InjectModel(Trip.name) model: Model<TripDocument>,
    private readonly importExportService: ImportExportService,
    @InjectRelationModel(Vehicle.name) private readonly vehiclesModel: Model<Vehicle>,
    @InjectRelationModel(Driver.name) private readonly driversModel: Model<Driver>,
    @InjectRelationModel(Customer.name) private readonly customersModel: Model<Customer>,
  ) {
    super(model, 'Trip');
  }

  async createTrip(dto: CreateTripDto) {
    try {
      this.tripLogger.log(`Creating trip ${dto.tripCode}`);
      return await this.create({
        tripCode: dto.tripCode,
        refCode: dto.refCode,
        sales: dto.sales,
        cutoffMonth: dto.cutoffMonth,
        month: dto.month,
        deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : undefined,
        origin: dto.origin,
        destination: dto.destination,
        vehicleId: dto.vehicleId,
        vehiclePlate: dto.vehiclePlate,
        driverId: dto.driverId,
        driverName: dto.driverName,
        customerId: dto.customerId,
        customerName: dto.customerName,
        departureAt: dto.departureAt ? new Date(dto.departureAt) : undefined,
        arrivalAt: dto.arrivalAt ? new Date(dto.arrivalAt) : undefined,
        vendor: dto.vendor,
        truckType: dto.truckType,
        podStatus: dto.podStatus ?? TripPodStatus.Pending,
        costStatus: dto.costStatus ?? TripCostStatus.Pending,
        status: dto.status ?? TripStatus.Draft,
        totalCost: dto.totalCost ?? 0,
        notes: dto.notes,
      } as Partial<TripDocument>);
    } catch (error: any) {
      if (error?.code === 11000) {
        this.tripLogger.warn(`Trip code already exists: ${dto.tripCode}`);
        throw new ConflictException('Trip code already exists');
      }
      this.tripLogger.error(`Failed to create trip ${dto.tripCode}`, error?.stack ?? error?.message ?? error);
      throw error;
    }
  }

  async updateTrip(id: string, dto: UpdateTripDto) {
    this.tripLogger.log(`Updating trip ${id}`);
    return this.update(id, {
      tripCode: dto.tripCode,
      refCode: dto.refCode,
      sales: dto.sales,
      cutoffMonth: dto.cutoffMonth,
      month: dto.month,
      deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : undefined,
      origin: dto.origin,
      destination: dto.destination,
      vehicleId: dto.vehicleId,
      vehiclePlate: dto.vehiclePlate,
      driverId: dto.driverId,
      driverName: dto.driverName,
      customerId: dto.customerId,
      customerName: dto.customerName,
      departureAt: dto.departureAt ? new Date(dto.departureAt) : undefined,
      arrivalAt: dto.arrivalAt ? new Date(dto.arrivalAt) : undefined,
      vendor: dto.vendor,
      truckType: dto.truckType,
      podStatus: dto.podStatus,
      costStatus: dto.costStatus,
      status: dto.status,
      totalCost: dto.totalCost,
      notes: dto.notes,
    } as Partial<TripDocument>);
  }

  async importTrips(buffer: Buffer): Promise<TripImportResult> {
    this.tripLogger.log(`Importing trips from Excel buffer (${buffer.length} bytes)`);
    const rows = await this.importExportService.parseTrips(buffer);
    let inserted = 0;
    let updated = 0;
    const errors: Array<{ row: number; message: string }> = [];

    for (const [index, row] of rows.entries()) {
      try {
        const [vehicle, driver, customer] = await Promise.all([
          row.vehiclePlate ? this.vehiclesModel.findOne({ plateNumber: row.vehiclePlate }).exec() : null,
          row.driverName ? this.driversModel.findOne({ fullName: row.driverName }).exec() : null,
          row.customerName ? this.customersModel.findOne({ name: row.customerName }).exec() : null,
        ]);

        if (row.vehiclePlate && !vehicle) {
          throw new BadRequestException('Vehicle plate not found');
        }

        if (row.driverName && !driver) {
          throw new BadRequestException('Driver not found');
        }

        if (row.customerName && !customer) {
          throw new BadRequestException('Customer not found');
        }

        const payload = {
          tripCode: row.tripCode,
          refCode: row.refCode,
          sales: row.sales,
          cutoffMonth: row.cutoffMonth ? Number(row.cutoffMonth) : undefined,
          month: row.month ? Number(row.month) : undefined,
          deliveryDate: row.deliveryDate ? new Date(row.deliveryDate) : undefined,
          origin: row.origin,
          destination: row.destination,
          vehicleId: vehicle?._id?.toString(),
          vehiclePlate: row.vehiclePlate,
          driverId: driver?._id?.toString(),
          driverName: row.driverName,
          customerId: customer?._id?.toString(),
          customerName: row.customerName,
          vendor: row.vendor,
          truckType: row.truckType,
          podStatus: (row.podStatus as TripPodStatus | undefined) ?? TripPodStatus.Pending,
          costStatus: (row.costStatus as TripCostStatus | undefined) ?? TripCostStatus.Pending,
          status: (row.status as TripStatus | undefined) ?? TripStatus.Draft,
        };

        const existing = await this.model.findOne({ tripCode: row.tripCode }).exec();
        if (existing) {
          this.tripLogger.log(`Updating imported trip ${row.tripCode}`);
          await this.model
            .findByIdAndUpdate(existing._id, payload, { new: true, runValidators: true })
            .exec();
          updated += 1;
        } else {
          this.tripLogger.log(`Creating imported trip ${row.tripCode}`);
          await this.createTrip(payload as unknown as CreateTripDto);
          inserted += 1;
        }
      } catch (error: any) {
        this.tripLogger.warn(`Failed to import trip row ${index + 2}: ${error?.message ?? 'Import failed'}`);
        errors.push({
          row: index + 2,
          message: error?.message ?? 'Import failed',
        });
      }
    }

    this.tripLogger.log(`Trip import completed: inserted=${inserted}, updated=${updated}, failed=${errors.length}`);
    return {
      inserted,
      updated,
      failed: errors.length,
      errors,
    };
  }

  async exportTrips() {
    this.tripLogger.log('Exporting trips to Excel');
    const trips = await this.findAll();
    return this.importExportService.exportTrips(trips as Array<Record<string, any>>);
  }
}

@ApiTags('trips')
@ApiBearerAuth()
@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Get()
  @ApiOperation({ summary: 'List trips' })
  findAll() {
    return this.tripsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get trip by id' })
  findOne(@Param('id') id: string) {
    return this.tripsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create trip' })
  create(@Body() dto: CreateTripDto) {
    return this.tripsService.createTrip(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update trip' })
  update(@Param('id') id: string, @Body() dto: UpdateTripDto) {
    return this.tripsService.updateTrip(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete trip' })
  remove(@Param('id') id: string) {
    return this.tripsService.remove(id);
  }

  @Post('import')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Import trips from Excel' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
    }),
  )
  async importTrips(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (file.size > 2 * 1024 * 1024) {
      throw new BadRequestException('File size exceeds 2MB limit');
    }
    this.tripsService['tripLogger'].log(`Received trips import file ${file.originalname} (${file.size} bytes)`);
    return this.tripsService.importTrips(file.buffer);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export trips to Excel' })
  async exportTrips(@Res({ passthrough: true }) response: Response) {
    const buffer = await this.tripsService.exportTrips();
    const exportSize = (buffer as any)?.length ?? (buffer as any)?.byteLength ?? 0;
    this.tripsService['tripLogger'].log(`Trip export ready (${exportSize} bytes)`);
    response.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    response.setHeader('Content-Disposition', 'attachment; filename="trips.xlsx"');
    return buffer as unknown as Buffer;
  }
}

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Trip.name, schema: TripSchema }]),
    ImportExportModule,
    VehiclesModule,
    DriversModule,
    CustomersModule,
  ],
  controllers: [TripsController],
  providers: [TripsService],
  exports: [TripsService, MongooseModule],
})
export class TripsModule {}
