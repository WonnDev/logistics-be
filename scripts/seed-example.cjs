const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/logistic-be';
const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || '123123';

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
    oilInvoiceStatus: { type: String, enum: ['has', 'no'], default: 'no' },
    paymentStatus: { type: String, enum: ['paid', 'unpaid'], default: 'unpaid' },
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

const notificationSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, enum: ['document', 'cost', 'maintenance', 'approval', 'system'] },
    read: { type: Boolean, default: false },
    visibleToRoles: { type: [String], default: [] },
    visibleToUsers: { type: [String], default: [] },
    readByUsers: { type: [String], default: [] },
    title: { type: String, required: true, trim: true },
    desc: { type: String, required: true, trim: true },
    time: { type: String, required: true, trim: true },
    iconBg: { type: String, required: true, trim: true },
    iconColor: { type: String, required: true, trim: true },
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
const Notification = mongoose.model('Notification', notificationSchema);
const FileRecord = mongoose.model('FileRecord', fileSchema);

const makeBinary = (label) => Buffer.from(label);

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
    {
      username: 'operator1',
      email: 'operator1@example.com',
      passwordHash: await bcrypt.hash('123456', 10),
      fullName: 'Operator One',
      role: 'operator',
      isActive: true,
    },
    {
      username: 'viewer1',
      email: 'viewer1@example.com',
      passwordHash: await bcrypt.hash('123456', 10),
      fullName: 'Viewer One',
      role: 'viewer',
      isActive: true,
    },
  ]);

  const vehicles = await Vehicle.insertMany([
    { plateNumber: '99H05715', brand: 'Wonn', model: '8T', status: 'active', mileage: 155385 },
    { plateNumber: '99H00771', brand: 'Wonn', model: '10T', status: 'active', mileage: 232296 },
    { plateNumber: '99H00826', brand: 'Wonn', model: '8T', status: 'active', mileage: 182296 },
    { plateNumber: '99H05791', brand: 'Wonn', model: '5T', status: 'active', mileage: 198000 },
    { plateNumber: '99H08017', brand: 'Wonn', model: '10T', status: 'maintenance', mileage: 240100 },
    { plateNumber: '29G00880', brand: 'Wonn', model: '10T', status: 'active', mileage: 226500 },
    { plateNumber: '99H08136', brand: 'Wonn', model: '5T', status: 'inactive', mileage: 210450 },
    { plateNumber: '99H08513', brand: 'Wonn', model: '8T', status: 'active', mileage: 173210 },
  ]);

  const drivers = await Driver.insertMany([
    { fullName: 'ADMIN', licenseNumber: 'DL-0001', phone: '0901234567', status: 'active' },
    { fullName: 'Tran Van Do', licenseNumber: 'DL-0002', phone: '0901111111', status: 'active' },
    { fullName: 'Nguyen Van Nhat', licenseNumber: 'DL-0003', phone: '0902222222', status: 'active' },
    { fullName: 'Dinh Quang Chi', licenseNumber: 'DL-0004', phone: '0903333333', status: 'active' },
    { fullName: 'Luong Van Thanh', licenseNumber: 'DL-0005', phone: '0904444444', status: 'suspended' },
    { fullName: 'Hoang Minh Cuong', licenseNumber: 'DL-0006', phone: '0905555555', status: 'active' },
  ]);

  const customers = await Customer.insertMany([
    { name: 'Arsenal' },
    { name: 'Everton' },
    { name: 'MU Vo Doi' },
    { name: 'Samsung Bac Ninh' },
    { name: 'Manchester City' },
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
    {
      tripCode: 'TRIP-20260623-2084',
      refCode: 'MUVLTP26060079',
      sales: 'ADMIN',
      cutoffMonth: 6,
      month: 6,
      deliveryDate: today,
      origin: 'Ha Noi',
      destination: 'Vinh Phuc',
      vehicleId: vehicles[5]._id,
      vehiclePlate: vehicles[5].plateNumber,
      driverId: drivers[5]._id,
      driverName: drivers[5].fullName,
      customerId: customers[4]._id,
      customerName: customers[4].name,
      vendor: 'Wonn',
      truckType: '10T',
      podStatus: 'pending',
      costStatus: 'rejected',
      status: 'cancelled',
      totalCost: 3600000,
    },
  ]);

  const additionalTrips = [];
  const monthlyCustomers = [customers[0], customers[1], customers[2], customers[3], customers[4]];
  const monthlyOrigins = ['Ha Noi', 'Bac Ninh', 'Huu Nghi', 'Ha Tinh', 'Tu Son'];
  const monthlyDestinations = ['Bac Ninh', 'Bang Tuong', 'Lang Son', 'Vinh Phuc', 'Hap Linh'];
  const monthlyVendors = ['Wonn', 'Wonn', 'Barca', 'Atletico'];

  for (const month of [7, 8, 9]) {
    for (let index = 0; index < 12; index += 1) {
      const sequence = String(index + 1).padStart(3, '0');
      const deliveryDate = new Date(Date.UTC(2026, month - 1, (index % 10) + 1, 8, 0, 0));
      const status = index % 5 === 0 ? 'planned' : index % 7 === 0 ? 'in_transit' : 'completed';
      const podStatus = status === 'completed' ? (index % 3 === 0 ? 'received' : 'uploaded') : 'pending';
      const costStatus = status === 'completed' ? (index % 4 === 0 ? 'pending' : 'approved') : 'pending';
      const totalCost = status === 'completed' ? 1200000 + (index * 175000) : 0;
      const vehicle = vehicles[index % vehicles.length];
      const driver = drivers[index % drivers.length];
      const customer = monthlyCustomers[index % monthlyCustomers.length];

      additionalTrips.push({
        tripCode: `TRIP-2026${String(month).padStart(2, '0')}${sequence}`,
        refCode: `REF26${String(month).padStart(2, '0')}${sequence}`,
        sales: ['ADMIN', 'CB7', 'S'][index % 3],
        cutoffMonth: month,
        month,
        deliveryDate,
        origin: monthlyOrigins[index % monthlyOrigins.length],
        destination: monthlyDestinations[index % monthlyDestinations.length],
        vehicleId: vehicle._id,
        vehiclePlate: vehicle.plateNumber,
        driverId: driver._id,
        driverName: driver.fullName,
        customerId: customer._id,
        customerName: customer.name,
        vendor: monthlyVendors[index % monthlyVendors.length],
        truckType: vehicle.model,
        podStatus,
        costStatus,
        oilInvoiceStatus: index % 2 === 0 ? 'has' : 'no',
        paymentStatus: index % 3 === 0 ? 'paid' : 'unpaid',
        status,
        totalCost,
        notes: `Sample data ${month}/2026`,
      });
    }
  }

  const generatedTrips = await Trip.insertMany(additionalTrips);
  trips.push(...generatedTrips);

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
    {
      tripCode: trips[2].tripCode,
      startKm: 182296,
      endKm: 183000,
      totalKm: 704,
      fuelLiters: 62,
      fuelUnitPrice: 24000,
      fuelInvoiceAmount: 1488000,
      fuelTotal: 1488000,
      maintenanceCost: 120000,
      vetcCost: 270000,
      loadingFee: 50000,
      parkingFee: 0,
      turnaroundAllowance: 0,
      otherFee: 80000,
      totalCost: 2008000,
      status: 'rejected',
      note: 'Need review',
    },
    {
      tripCode: trips[3].tripCode,
      startKm: 198000,
      endKm: 198620,
      totalKm: 620,
      fuelLiters: 58,
      fuelUnitPrice: 24000,
      fuelInvoiceAmount: 1392000,
      fuelTotal: 1392000,
      maintenanceCost: 0,
      vetcCost: 250000,
      loadingFee: 0,
      parkingFee: 30000,
      turnaroundAllowance: 0,
      otherFee: 0,
      totalCost: 1672000,
      status: 'approved',
    },
  ]);

  await Cost.insertMany(generatedTrips.map((trip, index) => ({
    tripCode: trip.tripCode,
    startKm: 200000 + (index * 125),
    endKm: 200350 + (index * 125),
    totalKm: 350,
    fuelLiters: 42 + (index % 8),
    fuelUnitPrice: 24000,
    fuelInvoiceAmount: (42 + (index % 8)) * 24000,
    fuelTotal: (42 + (index % 8)) * 24000,
    maintenanceCost: index % 5 === 0 ? 250000 : 0,
    vetcCost: 85000 + (index % 4) * 25000,
    loadingFee: index % 3 === 0 ? 50000 : 0,
    parkingFee: index % 6 === 0 ? 30000 : 0,
    turnaroundAllowance: index % 4 === 0 ? 100000 : 0,
    otherFee: index % 7 === 0 ? 75000 : 0,
    totalCost: trip.totalCost,
    status: trip.costStatus,
    note: `Sample cost ${trip.month}/2026`,
  })));

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
    {
      vehiclePlate: vehicles[5].plateNumber,
      maintenanceItem: 'Thay lốp trước + cân chỉnh',
      repairDate: today,
      vehicleKm: 226500,
      garage: 'Garage Tân Việt',
      cost: 2100000,
      note: 'Test record for maintenance screen',
    },
  ]);

  await Maintenance.insertMany(generatedTrips.filter((_, index) => index % 3 === 0).map((trip, index) => ({
    vehiclePlate: trip.vehiclePlate,
    maintenanceItem: ['Thay dau may', 'Bao duong phanh', 'Kiem tra lop xe'][index % 3],
    repairDate: trip.deliveryDate,
    vehicleKm: 200000 + (index * 500),
    garage: index % 2 === 0 ? 'Garage Bac Ninh' : 'Garage Tan Viet',
    cost: 450000 + (index * 85000),
    note: `Sample maintenance ${trip.month}/2026`,
  })));

  const fileRecords = await FileRecord.insertMany([
    {
      fileName: 'doc-registration-001.pdf',
      tripCode: trips[0].tripCode,
      type: 'registration',
      size: makeBinary('registration 99H05715').length,
      data: makeBinary('registration 99H05715'),
      mimeType: 'application/pdf',
      entityId: String(vehicles[0]._id),
    },
    {
      fileName: 'doc-insurance-001.pdf',
      tripCode: trips[1].tripCode,
      type: 'insurance',
      size: makeBinary('insurance 99H00771').length,
      data: makeBinary('insurance 99H00771'),
      mimeType: 'application/pdf',
      entityId: String(vehicles[1]._id),
    },
    {
      fileName: 'doc-inspection-001.pdf',
      tripCode: trips[2].tripCode,
      type: 'inspection',
      size: makeBinary('inspection 99H00826').length,
      data: makeBinary('inspection 99H00826'),
      mimeType: 'application/pdf',
      entityId: String(vehicles[2]._id),
    },
    {
      fileName: 'doc-permit-001.pdf',
      tripCode: trips[3].tripCode,
      type: 'permit',
      size: makeBinary('permit 29G00880').length,
      data: makeBinary('permit 29G00880'),
      mimeType: 'application/pdf',
      entityId: String(vehicles[5]._id),
    },
    {
      fileName: 'doc-registration-002.pdf',
      tripCode: trips[4].tripCode,
      type: 'registration',
      size: makeBinary('registration 99H08513').length,
      data: makeBinary('registration 99H08513'),
      mimeType: 'application/pdf',
      entityId: String(vehicles[7]._id),
    },
    {
      fileName: 'pod-TRIP-20260623-2083.jpg',
      tripCode: trips[0].tripCode,
      type: 'POD',
      size: makeBinary('sample pod file').length,
      data: makeBinary('sample pod file'),
      mimeType: 'image/jpeg',
      entityId: String(trips[0]._id),
    },
  ]);

  const fileByName = new Map(fileRecords.map((record) => [record.fileName, record]));

  await DocumentRecord.insertMany([
    {
      vehiclePlate: vehicles[0].plateNumber,
      type: 'registration',
      expiryDate: new Date('2027-03-15T00:00:00.000Z'),
      fileId: String(fileByName.get('doc-registration-001.pdf')?._id),
    },
    {
      vehiclePlate: vehicles[0].plateNumber,
      type: 'insurance',
      expiryDate: new Date('2026-12-20T00:00:00.000Z'),
      fileId: String(fileByName.get('doc-insurance-001.pdf')?._id),
    },
    {
      vehiclePlate: vehicles[1].plateNumber,
      type: 'inspection',
      expiryDate: new Date('2026-09-15T00:00:00.000Z'),
      fileId: String(fileByName.get('doc-inspection-001.pdf')?._id),
    },
    {
      vehiclePlate: vehicles[5].plateNumber,
      type: 'permit',
      expiryDate: new Date('2027-01-20T00:00:00.000Z'),
      fileId: String(fileByName.get('doc-permit-001.pdf')?._id),
    },
    {
      vehiclePlate: vehicles[7].plateNumber,
      type: 'registration',
      expiryDate: new Date('2026-08-25T00:00:00.000Z'),
      fileId: String(fileByName.get('doc-registration-002.pdf')?._id),
    },
  ]);

  await DocumentRecord.insertMany(generatedTrips.filter((_, index) => index % 2 === 0).map((trip, index) => ({
    vehiclePlate: trip.vehiclePlate,
    type: ['registration', 'insurance', 'inspection', 'permit'][index % 4],
    expiryDate: new Date(`2026-${String(8 + (index % 5)).padStart(2, '0')}-${String(5 + (index % 20)).padStart(2, '0')}T00:00:00.000Z`),
  })));

  await Approval.insertMany([
    {
      targetType: 'trip',
      targetId: String(trips[0]._id),
      status: 'approved',
      approver: 'admin',
      comment: 'Da doi chieu hoa don dau',
      approvedAt: new Date(),
    },
    {
      targetType: 'driver',
      targetId: String(drivers[4]._id),
      status: 'pending',
      approver: 'manager1',
      comment: 'Can xac minh lai thong tin',
    },
    {
      targetType: 'document',
      targetId: String(fileByName.get('doc-permit-001.pdf')?._id),
      status: 'rejected',
      approver: 'admin',
      comment: 'Thieu anh ban goc',
    },
  ]);

  await Notification.insertMany([
    {
      type: 'document',
      read: false,
      visibleToRoles: ['admin', 'viewer'],
      visibleToUsers: ['admin', 'viewer1'],
      readByUsers: [],
      title: 'Xe 29G00880 — Đăng ký xe quá hạn',
      desc: 'Quá hạn 25 ngày. Lái xe: Lưu Ngọc Tài — cần gia hạn ngay.',
      time: '2 giờ trước',
      iconBg: '#FFF1F2',
      iconColor: '#DC2626',
    },
    {
      type: 'cost',
      read: false,
      visibleToRoles: ['admin', 'manager'],
      visibleToUsers: ['admin', 'manager1'],
      readByUsers: [],
      title: '2 chuyến chưa nhập chi phí hôm nay',
      desc: 'TRIP-0132 (Manchester City), TRIP-0135 (Arsenal) — hạn chót: hôm nay.',
      time: '2 giờ trước',
      iconBg: '#FFF1F2',
      iconColor: '#DC2626',
    },
    {
      type: 'approval',
      read: false,
      visibleToRoles: ['admin', 'manager'],
      visibleToUsers: ['admin', 'manager1'],
      readByUsers: [],
      title: '2 lái xe đang chờ phê duyệt',
      desc: 'Nguyễn Văn Đại, Trần Văn Khái — tháng 11/2025 chưa duyệt chi phí.',
      time: '3 giờ trước',
      iconBg: '#FFFBEB',
      iconColor: '#D97706',
    },
    {
      type: 'system',
      read: false,
      visibleToRoles: ['admin', 'viewer', 'operator'],
      visibleToUsers: ['admin', 'viewer1', 'operator1'],
      readByUsers: [],
      title: 'Đồng bộ Sheet hoàn tất',
      desc: '1,046 bản ghi đã được đồng bộ từ Google Sheets lúc 08:00.',
      time: '4 giờ trước',
      iconBg: '#FFFBEB',
      iconColor: '#D97706',
    },
    {
      type: 'document',
      read: true,
      visibleToRoles: ['viewer'],
      visibleToUsers: ['viewer1'],
      readByUsers: ['viewer1'],
      title: 'Xe 99H05791 — Bảo hiểm quá hạn 15 ngày',
      desc: 'Quá hạn. Lái xe: Luân Văn Thanh — liên hệ bộ phận xe ngay.',
      time: '1 ngày trước',
      iconBg: '#FFF1F2',
      iconColor: '#DC2626',
    },
    {
      type: 'document',
      read: true,
      visibleToRoles: ['viewer'],
      visibleToUsers: ['viewer1'],
      readByUsers: ['viewer1'],
      title: 'Xe 99H05715 — Đăng kiểm còn 11 ngày',
      desc: 'Sắp hết hạn. Lái xe: Dương Tuấn Anh — lên lịch đăng kiểm.',
      time: '1 ngày trước',
      iconBg: '#FFFBEB',
      iconColor: '#D97706',
    },
    {
      type: 'maintenance',
      read: true,
      visibleToRoles: ['viewer'],
      visibleToUsers: ['viewer1'],
      readByUsers: ['viewer1'],
      title: '2 bảo dưỡng chưa khớp hóa đơn',
      desc: '99G07385: nổ hội + công thợ • 99H05424: dầu nhớt — cần xác nhận.',
      time: '2 ngày trước',
      iconBg: '#FFFBEB',
      iconColor: '#D97706',
    },
    {
      type: 'system',
      read: false,
      visibleToRoles: ['operator'],
      visibleToUsers: ['operator1'],
      readByUsers: [],
      title: 'Xe điều phối cần xác nhận lịch xuất bến',
      desc: 'Ca sáng 03/08 cần xác nhận trước 08:30 cho operator1.',
      time: '30 phút trước',
      iconBg: '#EFF6FF',
      iconColor: '#2563EB',
    },
  ]);

  console.log('Seed completed successfully.');
  console.log(`Users: 4`);
  console.log(`Vehicles: ${vehicles.length}`);
  console.log(`Drivers: ${drivers.length}`);
  console.log(`Customers: ${customers.length}`);
  console.log(`Trips: ${trips.length}`);
  console.log(`Files: ${fileRecords.length}`);
  console.log('Notifications: 8');

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
