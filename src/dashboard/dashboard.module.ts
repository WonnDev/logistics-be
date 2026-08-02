import { Controller, Get, Injectable, Logger, Module } from '@nestjs/common';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Trip, TripSchema } from '../trips/trips.module';
import { Cost, CostSchema } from '../costs/costs.module';
import { Vehicle, VehicleSchema } from '../vehicles/vehicles.module';
import { Driver, DriverSchema } from '../drivers/drivers.module';
import { Customer, CustomerSchema } from '../customers/customers.module';
import { Maintenance, MaintenanceSchema } from '../maintenance/maintenance.module';
import { DocumentRecord, DocumentRecordSchema } from '../documents/documents.module';
import { Approval, ApprovalSchema } from '../approvals/approvals.module';
import { User, UserSchema } from '../users/users.module';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectModel(User.name) private readonly usersModel: Model<User>,
    @InjectModel(Vehicle.name) private readonly vehiclesModel: Model<Vehicle>,
    @InjectModel(Driver.name) private readonly driversModel: Model<Driver>,
    @InjectModel(Customer.name) private readonly customersModel: Model<Customer>,
    @InjectModel(Trip.name) private readonly tripsModel: Model<Trip>,
    @InjectModel(Cost.name) private readonly costsModel: Model<Cost>,
    @InjectModel(Maintenance.name) private readonly maintenanceModel: Model<Maintenance>,
    @InjectModel(DocumentRecord.name) private readonly documentsModel: Model<DocumentRecord>,
    @InjectModel(Approval.name) private readonly approvalsModel: Model<Approval>,
  ) {}

  async summary() {
    this.logger.log('Building dashboard summary');
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [totalTrips, pendingCosts, approvedCosts, activeVehicles, todayTrips, totalMaintenanceAgg] = await Promise.all([
      this.tripsModel.countDocuments().exec(),
      this.costsModel.countDocuments({ status: 'pending' }).exec(),
      this.costsModel.countDocuments({ status: 'approved' }).exec(),
      this.vehiclesModel.countDocuments({ status: 'active' }).exec(),
      this.tripsModel.countDocuments({ deliveryDate: { $gte: todayStart, $lte: todayEnd } }).exec(),
      this.maintenanceModel.aggregate([{ $group: { _id: null, total: { $sum: '$cost' } } }]).exec(),
    ]);

    const summary = {
      totalTrips,
      pendingCosts,
      approvedCosts,
      activeVehicles,
      todayTrips,
      totalMaintenanceCost: totalMaintenanceAgg[0]?.total ?? 0,
    };

    this.logger.log(
      `Dashboard summary ready: trips=${summary.totalTrips}, pendingCosts=${summary.pendingCosts}, approvedCosts=${summary.approvedCosts}, activeVehicles=${summary.activeVehicles}, todayTrips=${summary.todayTrips}`,
    );

    return summary;
  }
}

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  summary() {
    return this.dashboardService.summary();
  }
}

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Vehicle.name, schema: VehicleSchema },
      { name: Driver.name, schema: DriverSchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: Trip.name, schema: TripSchema },
      { name: Cost.name, schema: CostSchema },
      { name: Maintenance.name, schema: MaintenanceSchema },
      { name: DocumentRecord.name, schema: DocumentRecordSchema },
      { name: Approval.name, schema: ApprovalSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
