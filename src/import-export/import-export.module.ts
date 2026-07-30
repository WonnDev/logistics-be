import { Injectable, Module } from '@nestjs/common';
import { Workbook } from 'exceljs';

export interface SpreadsheetTripRow {
  tripCode: string;
  refCode?: string;
  sales?: string;
  cutoffMonth?: string;
  month?: string;
  deliveryDate?: string;
  vehiclePlate?: string;
  driverName?: string;
  customerName?: string;
  origin: string;
  destination: string;
  status?: string;
  vendor?: string;
  truckType?: string;
  podStatus?: string;
  costStatus?: string;
}

export interface TripImportResult {
  inserted: number;
  updated: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
}

@Injectable()
export class ImportExportService {
  async exportTrips(trips: Array<Record<string, any>>) {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Trips');

    worksheet.columns = [
      { header: 'Trip Code', key: 'tripCode', width: 20 },
      { header: 'Ref Code', key: 'refCode', width: 20 },
      { header: 'Sales', key: 'sales', width: 18 },
      { header: 'Cutoff Month', key: 'cutoffMonth', width: 14 },
      { header: 'Month', key: 'month', width: 10 },
      { header: 'Delivery Date', key: 'deliveryDate', width: 16 },
      { header: 'Vehicle Plate', key: 'vehiclePlate', width: 18 },
      { header: 'Driver Name', key: 'driverName', width: 20 },
      { header: 'Customer Name', key: 'customerName', width: 20 },
      { header: 'Origin', key: 'origin', width: 20 },
      { header: 'Destination', key: 'destination', width: 20 },
      { header: 'Vendor', key: 'vendor', width: 18 },
      { header: 'Truck Type', key: 'truckType', width: 14 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Pod Status', key: 'podStatus', width: 15 },
      { header: 'Cost Status', key: 'costStatus', width: 15 },
    ];

    worksheet.addRows(
      trips.map((trip) => ({
        tripCode: trip.tripCode,
        refCode: trip.refCode,
        sales: trip.sales ?? '',
        cutoffMonth: trip.cutoffMonth ?? '',
        month: trip.month ?? '',
        deliveryDate: trip.deliveryDate ? new Date(trip.deliveryDate).toISOString().slice(0, 10) : '',
        vehiclePlate: trip.vehiclePlate ?? '',
        driverName: trip.driverName ?? '',
        customerName: trip.customerName ?? '',
        origin: trip.origin,
        destination: trip.destination,
        vendor: trip.vendor ?? '',
        truckType: trip.truckType ?? '',
        status: trip.status,
        podStatus: trip.podStatus ?? '',
        costStatus: trip.costStatus ?? '',
      })),
    );

    return workbook.xlsx.writeBuffer();
  }

  async parseTrips(buffer: Buffer | ArrayBuffer | Uint8Array): Promise<SpreadsheetTripRow[]> {
    const workbook = new Workbook();
    const normalizedBuffer =
      buffer instanceof Buffer ? buffer : buffer instanceof ArrayBuffer ? Buffer.from(new Uint8Array(buffer)) : Buffer.from(buffer);
    await workbook.xlsx.load(normalizedBuffer as any);
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return [];
    }

    const headerRow = worksheet.getRow(1);
    const headerMap = new Map<string, number>();
    headerRow.eachCell((cell, columnNumber) => {
      const value = String(cell.value ?? '').trim();
      if (value) {
        headerMap.set(value.toLowerCase(), columnNumber);
      }
    });

    const getCellValue = (row: any, header: string) => {
      const columnNumber = headerMap.get(header.toLowerCase());
      if (!columnNumber) {
        return '';
      }
      return row.getCell(columnNumber).value ?? '';
    };

    const rows: SpreadsheetTripRow[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        return;
      }

      rows.push({
        tripCode: String(getCellValue(row, 'Trip Code') || getCellValue(row, 'code') || ''),
        refCode: String(getCellValue(row, 'Ref Code') || ''),
        sales: String(getCellValue(row, 'Sales') || ''),
        cutoffMonth: String(getCellValue(row, 'Cutoff Month') || ''),
        month: String(getCellValue(row, 'Month') || ''),
        deliveryDate: String(getCellValue(row, 'Delivery Date') || ''),
        vehiclePlate: String(getCellValue(row, 'Vehicle Plate') || ''),
        driverName: String(getCellValue(row, 'Driver Name') || ''),
        customerName: String(getCellValue(row, 'Customer Name') || ''),
        origin: String(getCellValue(row, 'Origin') || ''),
        destination: String(getCellValue(row, 'Destination') || ''),
        status: String(getCellValue(row, 'Status') || ''),
        vendor: String(getCellValue(row, 'Vendor') || ''),
        truckType: String(getCellValue(row, 'Truck Type') || ''),
        podStatus: String(getCellValue(row, 'Pod Status') || ''),
        costStatus: String(getCellValue(row, 'Cost Status') || ''),
      });
    });

    return rows.filter((row) => row.tripCode && row.origin && row.destination);
  }
}

@Module({
  providers: [ImportExportService],
  exports: [ImportExportService],
})
export class ImportExportModule {}
