const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/logistic-be';
const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || '123456';

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true, select: false },
    fullName: { type: String, required: true, trim: true },
    role: { type: String, required: true, enum: ['admin', 'manager', 'operator', 'viewer'] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const vehicleSchema = new mongoose.Schema(
  {
    plateNumber: { type: String, required: true, unique: true, trim: true },
    brand: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    status: { type: String, required: true, enum: ['active', 'maintenance', 'inactive'], default: 'active' },
    mileage: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const driverSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    licenseNumber: { type: String, required: true, unique: true, trim: true },
    phone: { type: String, required: true, trim: true },
    status: { type: String, required: true, enum: ['active', 'suspended', 'inactive'], default: 'active' },
  },
  { timestamps: true },
);

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
    address: { type: String, trim: true },
  },
  { timestamps: true },
);

const tripSchema = new mongoose.Schema(
  {
    tripCode: { type: String, required: true, unique: true, trim: true },
    refCode: { type: String, trim: true },
    sales: { type: String, trim: true },
    cutoffMonth: { type: Number },
    month: { type: Number },
    deliveryDate: { type: Date },
    origin: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
    vehiclePlate: { type: String, trim: true },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
    driverName: { type: String, trim: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    customerName: { type: String, trim: true },
    vendor: { type: String, trim: true },
    truckType: { type: String, trim: true },
    podStatus: { type: String, default: 'pending' },
    costStatus: { type: String, default: 'pending' },
    status: { type: String, required: true, enum: ['draft', 'planned', 'in_transit', 'completed', 'cancelled'], default: 'draft' },
    totalCost: { type: Number, default: 0 },
    notes: { type: String, trim: true },
  },
  { timestamps: true },
);

const costSchema = new mongoose.Schema(
  {
    tripCode: { type: String, required: true, trim: true },
    startKm: { type: Number, required: true },
    endKm: { type: Number, required: true },
    totalKm: { type: Number, required: true },
    fuelLiters: { type: Number, required: true },
    fuelUnitPrice: { type: Number, required: true },
    fuelInvoiceAmount: { type: Number, required: true },
    fuelTotal: { type: Number, required: true },
    maintenanceCost: { type: Number, default: 0 },
    vetcCost: { type: Number, default: 0 },
    loadingFee: { type: Number, default: 0 },
    parkingFee: { type: Number, default: 0 },
    turnaroundAllowance: { type: Number, default: 0 },
    otherFee: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 },
    status: { type: String, default: 'pending' },
    note: { type: String, trim: true },
  },
  { timestamps: true },
);

const maintenanceSchema = new mongoose.Schema(
  {
    vehiclePlate: { type: String, required: true, trim: true },
    maintenanceItem: { type: String, required: true, trim: true },
    repairDate: { type: Date },
    vehicleKm: { type: Number, default: 0 },
    garage: { type: String, trim: true },
    cost: { type: Number, default: 0 },
    note: { type: String, trim: true },
  },
  { timestamps: true },
);

const documentSchema = new mongoose.Schema(
  {
    vehiclePlate: { type: String, required: true, trim: true },
    type: { type: String, trim: true },
    expiryDate: { type: Date },
    fileId: { type: String, trim: true },
  },
  { timestamps: true },
);

const approvalSchema = new mongoose.Schema(
  {
    targetType: { type: String, required: true, trim: true },
    targetId: { type: String, required: true, trim: true },
    status: { type: String, required: true, default: 'pending' },
    approver: { type: String, trim: true },
    comment: { type: String, trim: true },
    approvedAt: { type: Date },
  },
  { timestamps: true },
);

const fileSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true, trim: true },
    tripCode: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    size: { type: Number, required: true },
    data: { type: Buffer, required: true },
    mimeType: { type: String, trim: true },
    entityId: { type: String, trim: true },
  },
  { timestamps: true },
);

const User = mongoose.model('User', userSchema);
const Vehicle = mongoose.model('Vehicle', vehicleSchema);
const Driver = mongoose.model('Driver', driverSchema);
const Customer = mongoose.model('Customer', customerSchema);
const Trip = mongoose.model('Trip', tripSchema);
const Cost = mongoose.model('Cost', costSchema);
const Maintenance = mongoose.model('Maintenance', maintenanceSchema);
const DocumentRecord = mongoose.model('DocumentRecord', documentSchema);
const Approval = mongoose.model('Approval', approvalSchema);
const FileRecord = mongoose.model('FileRecord', fileSchema);

async function resetCollections() {
  await mongoose.connection.dropDatabase();
}

async function seed() {
  await mongoose.connect(mongoUri);
  await resetCollections();

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await User.insertMany([
    {
      username: 'admin',
      email: 'admin@example.com',
      passwordHash,
      fullName: 'ADMIN',
      role: 'admin',
      isActive: true,
    },
    {
      username: 'manager1',
      email: 'manager1@example.com',
      passwordHash: await bcrypt.hash('123456', 10),
      fullName: 'Manager One',
      role: 'manager',
      isActive: true,
    },
  ]);

  const vehicles = await Vehicle.insertMany([
    { plateNumber: '99F00379', brand: 'Wonn', model: '8T', status: 'active', mileage: 155385 },
    { plateNumber: '99F00927', brand: 'Wonn', model: '10T', status: 'active', mileage: 232296 },
    { plateNumber: '29G00090', brand: 'Wonn', model: '8T', status: 'active', mileage: 232296 },
    { plateNumber: '99E01738', brand: 'Wonn', model: '6T', status: 'active', mileage: 198000 },
  ]);

  const drivers = await Driver.insertMany([
    { fullName: 'ADMIN', licenseNumber: 'DL-0001', phone: '0901234567', status: 'active' },
    { fullName: 'Tran Van Do', licenseNumber: 'DL-0002', phone: '0901111111', status: 'active' },
    { fullName: 'Nguyen Van Nhat', licenseNumber: 'DL-0003', phone: '0902222222', status: 'active' },
    { fullName: 'Dinh Quang Chi', licenseNumber: 'DL-0004', phone: '0903333333', status: 'active' },
  ]);

  const customers = await Customer.insertMany([
    { name: 'Arsenal' },
    { name: 'Everton' },
    { name: 'MU Vo Doi' },
    { name: 'Samsung Bac Ninh' },
  ]);

  const trips = await Trip.insertMany([
    {
      tripCode: 'TRIP-20260623-2083',
      refCode: 'DMTLTP26060035',
      sales: 'ADMIN',
      cutoffMonth: 6,
      month: 6,
      deliveryDate: today,
      origin: 'Huu Nghi',
      destination: 'Bac Ninh',
      vehicleId: vehicles[0]._id,
      vehiclePlate: vehicles[0].plateNumber,
      driverId: drivers[0]._id,
      driverName: drivers[0].fullName,
      customerId: customers[0]._id,
      customerName: customers[0].name,
      vendor: 'Wonn',
      truckType: '8T',
      podStatus: 'pending',
      costStatus: 'approved',
      status: 'completed',
      totalCost: 1519440,
      notes: 'seed data',
    },
    {
      tripCode: 'TRIP-20260623-2080',
      refCode: 'MUVLTP26060076',
      sales: 'ADMIN',
      cutoffMonth: 6,
      month: 6,
      deliveryDate: today,
      origin: 'Xe trong lich',
      destination: 'Bang Tuong',
      vehicleId: vehicles[2]._id,
      vehiclePlate: vehicles[2].plateNumber,
      driverId: drivers[2]._id,
      driverName: drivers[2].fullName,
      customerId: customers[2]._id,
      customerName: customers[2].name,
      vendor: 'Wonn',
      truckType: '8T',
      podStatus: 'uploaded',
      costStatus: 'pending',
      status: 'planned',
      totalCost: 0,
    },
    {
      tripCode: 'TRIP-20260623-2081',
      refCode: 'MUVLTP26060077',
      sales: 'ADMIN',
      cutoffMonth: 6,
      month: 6,
      deliveryDate: today,
      origin: 'Ha Tinh',
      destination: 'Bang Tuong',
      vehicleId: vehicles[3]._id,
      vehiclePlate: vehicles[3].plateNumber,
      driverId: drivers[3]._id,
      driverName: drivers[3].fullName,
      customerId: customers[3]._id,
      customerName: customers[3].name,
      vendor: 'Wonn',
      truckType: '8T',
      podStatus: 'pending',
      costStatus: 'pending',
      status: 'planned',
      totalCost: 0,
    },
    {
      tripCode: 'TRIP-20260623-2082',
      refCode: 'MUVLTP26060078',
      sales: 'ADMIN',
      cutoffMonth: 6,
      month: 6,
      deliveryDate: today,
      origin: 'Tu Son',
      destination: 'Hap Linh',
      vehicleId: vehicles[1]._id,
      vehiclePlate: vehicles[1].plateNumber,
      driverId: drivers[1]._id,
      driverName: drivers[1].fullName,
      customerId: customers[1]._id,
      customerName: customers[1].name,
      vendor: 'Wonn',
      truckType: '10T',
      podStatus: 'received',
      costStatus: 'approved',
      status: 'completed',
      totalCost: 0,
    },
  ]);

  await Cost.insertMany([
    {
      tripCode: trips[0].tripCode,
      startKm: 155385,
      endKm: 155865,
      totalKm: 480,
      fuelLiters: 48,
      fuelUnitPrice: 24000,
      fuelInvoiceAmount: 1152000,
      fuelTotal: 1152000,
      maintenanceCost: 0,
      vetcCost: 267440,
      loadingFee: 0,
      parkingFee: 0,
      turnaroundAllowance: 0,
      otherFee: 100000,
      totalCost: 1519440,
      status: 'approved',
      note: 'seed data',
    },
    {
      tripCode: trips[1].tripCode,
      startKm: 232296,
      endKm: 232296,
      totalKm: 0,
      fuelLiters: 0,
      fuelUnitPrice: 0,
      fuelInvoiceAmount: 0,
      fuelTotal: 0,
      maintenanceCost: 0,
      vetcCost: 0,
      loadingFee: 0,
      parkingFee: 0,
      turnaroundAllowance: 0,
      otherFee: 0,
      totalCost: 0,
      status: 'pending',
    },
  ]);

  await Maintenance.insertMany([
    {
      vehiclePlate: vehicles[1].plateNumber,
      maintenanceItem: 'Day sung hoi',
      repairDate: today,
      vehicleKm: 155385,
      garage: 'Garage Bac Ninh',
      cost: 350000,
      note: 'Thay moi day hoi',
    },
    {
      vehiclePlate: vehicles[2].plateNumber,
      maintenanceItem: 'Noi hoi + cong tho',
      repairDate: today,
      vehicleKm: 232296,
      garage: 'Garage Lang Son',
      cost: 1200000,
    },
    {
      vehiclePlate: vehicles[3].plateNumber,
      maintenanceItem: 'Bong xi nhan, cong tho',
      repairDate: today,
      vehicleKm: 198000,
      garage: 'Garage Huu Nghi',
      cost: 450000,
    },
  ]);

  await DocumentRecord.insertMany([
    {
      vehiclePlate: vehicles[0].plateNumber,
      type: 'registration',
      expiryDate: new Date('2027-03-15T00:00:00.000Z'),
      fileId: 'doc-registration-001',
    },
    {
      vehiclePlate: vehicles[0].plateNumber,
      type: 'insurance',
      expiryDate: new Date('2026-12-20T00:00:00.000Z'),
      fileId: 'doc-insurance-001',
    },
  ]);

  await Approval.insertMany([
    {
      targetType: 'trip',
      targetId: String(trips[0]._id),
      status: 'approved',
      approver: 'admin',
      comment: 'Da doi chieu hoa don dau',
      approvedAt: new Date(),
    },
  ]);

  await FileRecord.insertMany([
    {
      fileName: 'pod.jpg',
      tripCode: trips[0].tripCode,
      type: 'POD',
      size: 245120,
      data: Buffer.from('sample pod file'),
      mimeType: 'image/jpeg',
      entityId: String(trips[0]._id),
    },
  ]);

  console.log('Seed completed successfully.');
  console.log(`Users: 2`);
  console.log(`Vehicles: ${vehicles.length}`);
  console.log(`Drivers: ${drivers.length}`);
  console.log(`Customers: ${customers.length}`);
  console.log(`Trips: ${trips.length}`);

  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error('Seed failed:', error);
  try {
    await mongoose.disconnect();
  } catch (disconnectError) {
    console.error('Disconnect failed:', disconnectError);
  }
  process.exit(1);
});
