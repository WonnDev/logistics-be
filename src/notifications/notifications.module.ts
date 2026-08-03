import { Body, Controller, Delete, ForbiddenException, Get, Injectable, Module, NotFoundException, Param, Patch, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { CrudService } from '../common/mongoose/crud.service';
import { Logger } from '@nestjs/common';
import type { JwtPayload } from '../common/strategies/jwt.strategy';
import type { Request } from 'express';
import { ArrayNotEmpty, IsArray, IsBoolean, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

const NOTIFICATION_TYPES = ['document', 'cost', 'maintenance', 'approval', 'system'] as const;
const NOTIFICATION_ROLES = ['admin', 'manager', 'operator', 'viewer'] as const;

export type NotificationType = 'document' | 'cost' | 'maintenance' | 'approval' | 'system';
export type NotificationRole = (typeof NOTIFICATION_ROLES)[number];

@Schema({ timestamps: true, collection: 'notifications' })
export class NotificationRecord {
  @Prop({ required: true, enum: NOTIFICATION_TYPES })
  type!: NotificationType;

  @Prop({ required: true, default: false })
  read!: boolean;

  @Prop({ type: [String], default: [] })
  visibleToRoles!: string[];

  @Prop({ type: [String], default: [] })
  visibleToUsers!: string[];

  @Prop({ type: [String], default: [] })
  readByRoles!: string[];

  @Prop({ type: [String], default: [] })
  audienceUsers!: string[];

  @Prop({ type: [String], default: [] })
  readByUsers!: string[];

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true, trim: true })
  desc!: string;

  @Prop({ required: true, trim: true })
  time!: string;

  @Prop({ required: true, trim: true })
  iconBg!: string;

  @Prop({ required: true, trim: true })
  iconColor!: string;
}

export type NotificationRecordDocument = HydratedDocument<NotificationRecord>;
export const NotificationRecordSchema = SchemaFactory.createForClass(NotificationRecord);

export class NotificationBaseDto {
  @ApiProperty({ enum: NOTIFICATION_TYPES })
  @IsIn(NOTIFICATION_TYPES)
  type!: NotificationType;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  desc!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  time!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  iconBg!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  iconColor!: string;

  @ApiProperty({ enum: NOTIFICATION_ROLES, isArray: true })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  visibleToRoles!: NotificationRole[];

  @ApiPropertyOptional({ isArray: true, type: String })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  visibleToUsers?: string[];
}

export class CreateNotificationDto extends NotificationBaseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  read?: boolean;
}

export class UpdateNotificationDto extends PartialType(CreateNotificationDto) {}

@Injectable()
export class NotificationsService extends CrudService<NotificationRecordDocument> {
  private readonly notificationsLogger = new Logger(NotificationsService.name);

  constructor(@InjectModel(NotificationRecord.name) model: Model<NotificationRecordDocument>) {
    super(model, 'Notification');
  }

  async listAdmin() {
    const records = await this.model.find().sort({ createdAt: -1 }).exec();
    return records.map((record) => this.toAdminPayload(record));
  }

  async listForUser(role: string, username: string) {
    this.notificationsLogger.log(`Listing notifications for user ${username} (${role})`);
    const records = await this.model.find().sort({ createdAt: -1 }).exec();
    return records.filter((record) => this.canView(record, role, username));
  }

  async markAsRead(id: string, role: string, username: string) {
    this.notificationsLogger.log(`Marking notification ${id} as read for user ${username} (${role})`);
    const updated = await this.model.findByIdAndUpdate(
      id,
      {
        $addToSet: { readByUsers: username },
      },
      { new: true, runValidators: true },
    ).exec();

    if (!updated || !this.canView(updated, role, username)) {
      throw new NotFoundException('Notification not found');
    }

    return updated;
  }

  async markAllAsRead(role: string, username: string) {
    this.notificationsLogger.log(`Marking all notifications as read for user ${username} (${role})`);
    const records = await this.model.find().exec();
    const visibleIds = records.filter((record) => this.canView(record, role, username)).map((record) => record._id);
    const result = await this.model.updateMany(
      { _id: { $in: visibleIds } },
      { $addToSet: { readByUsers: username } },
    ).exec();
    return { updated: result.modifiedCount ?? 0 };
  }

  async createNotification(dto: CreateNotificationDto) {
    return this.create(this.buildWritePayload(dto));
  }

  async updateNotification(id: string, dto: UpdateNotificationDto) {
    return this.update(id, this.buildWritePayload(dto, true));
  }

  private buildWritePayload(dto: Partial<CreateNotificationDto>, partial = false): Partial<NotificationRecord> {
    const visibleToRoles = dto.visibleToRoles;
    const visibleToUsers = dto.visibleToUsers;

    const payload: Partial<NotificationRecord> = {};

    if (partial ? dto.type !== undefined : true) {
      payload.type = dto.type as NotificationType;
    }

    if (partial ? dto.read !== undefined : true) {
      payload.read = dto.read ?? false;
    }

    if (partial ? visibleToRoles !== undefined : true) {
      payload.visibleToRoles = visibleToRoles ?? [];
    }

    if (partial ? visibleToUsers !== undefined : true) {
      payload.visibleToUsers = visibleToUsers ?? [];
      payload.audienceUsers = visibleToUsers ?? [];
    }

    if (partial ? dto.title !== undefined : true) {
      payload.title = dto.title as string;
    }

    if (partial ? dto.desc !== undefined : true) {
      payload.desc = dto.desc as string;
    }

    if (partial ? dto.time !== undefined : true) {
      payload.time = dto.time as string;
    }

    if (partial ? dto.iconBg !== undefined : true) {
      payload.iconBg = dto.iconBg as string;
    }

    if (partial ? dto.iconColor !== undefined : true) {
      payload.iconColor = dto.iconColor as string;
    }

    return payload;
  }

  private canView(record: NotificationRecordDocument, role: string, username: string) {
    const visibleRoles = this.resolveVisibleRoles(record);
    const visibleUsers = this.resolveVisibleUsers(record);
    const roleMatched = !visibleRoles.length || visibleRoles.includes(role);
    const userMatched = !visibleUsers.length || visibleUsers.includes(username);
    return roleMatched && userMatched;
  }

  private isRead(record: NotificationRecordDocument, role: string, username: string) {
    return Boolean(record.readByUsers?.includes(username) || record.read);
  }

  formatForUser(record: NotificationRecordDocument, role: string, username: string) {
    return this.toUserPayload(record, role, username);
  }

  formatForAdmin(record: NotificationRecordDocument) {
    return this.toAdminPayload(record);
  }

  private resolveVisibleRoles(record: NotificationRecordDocument) {
    return record.visibleToRoles ?? [];
  }

  private resolveVisibleUsers(record: NotificationRecordDocument) {
    return record.visibleToUsers?.length
      ? record.visibleToUsers
      : record.audienceUsers ?? [];
  }

  private toUserPayload(record: NotificationRecordDocument, role: string, username: string) {
    return {
      id: record._id.toString(),
      type: record.type,
      read: this.isRead(record, role, username),
      title: record.title,
      desc: record.desc,
      time: record.time,
      iconBg: record.iconBg,
      iconColor: record.iconColor,
    };
  }

  private toAdminPayload(record: NotificationRecordDocument) {
    return {
      id: record._id.toString(),
      type: record.type,
      read: Boolean(record.readByUsers?.length || record.read),
      title: record.title,
      desc: record.desc,
      time: record.time,
      iconBg: record.iconBg,
      iconColor: record.iconColor,
      visibleToRoles: this.resolveVisibleRoles(record),
      visibleToUsers: this.resolveVisibleUsers(record),
      readByUsers: record.readByUsers ?? [],
      createdAt: (record as any).createdAt,
      updatedAt: (record as any).updatedAt,
    };
  }
}

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  private ensureAdmin(request: Request & { user?: JwtPayload }) {
    if (request.user?.role !== 'admin') {
      throw new ForbiddenException('Admin only');
    }
  }

  @Get()
  @ApiOperation({ summary: 'List notifications' })
  async findAll(@Req() request: Request & { user?: JwtPayload }) {
    const role = request.user?.role ?? 'viewer';
    const username = request.user?.username ?? 'unknown';
    const records = await this.notificationsService.listForUser(role, username);
    return records.map((record) => this.notificationsService.formatForUser(record, role, username));
  }

  @Get('admin')
  @ApiOperation({ summary: 'List all notifications for admin' })
  async findAllAdmin(@Req() request: Request & { user?: JwtPayload }) {
    this.ensureAdmin(request);
    return this.notificationsService.listAdmin();
  }

  @Post('admin')
  @ApiOperation({ summary: 'Create notification for admin push' })
  async createAdmin(@Req() request: Request & { user?: JwtPayload }, @Body() dto: CreateNotificationDto) {
    this.ensureAdmin(request);
    const record = await this.notificationsService.createNotification(dto);
    return this.notificationsService.formatForAdmin(record);
  }

  @Patch('admin/:id')
  @ApiOperation({ summary: 'Update notification for admin' })
  async updateAdmin(@Param('id') id: string, @Req() request: Request & { user?: JwtPayload }, @Body() dto: UpdateNotificationDto) {
    this.ensureAdmin(request);
    const record = await this.notificationsService.updateNotification(id, dto);
    return this.notificationsService.formatForAdmin(record);
  }

  @Delete('admin/:id')
  @ApiOperation({ summary: 'Delete notification for admin' })
  async deleteAdmin(@Param('id') id: string, @Req() request: Request & { user?: JwtPayload }) {
    this.ensureAdmin(request);
    return this.notificationsService.remove(id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markRead(@Param('id') id: string, @Req() request: Request & { user?: JwtPayload }) {
    const role = request.user?.role ?? 'viewer';
    const username = request.user?.username ?? 'unknown';
    const record = await this.notificationsService.markAsRead(id, role, username);
    return {
      id: record._id.toString(),
      read: Boolean(record.readByUsers?.includes(username) || record.read),
    };
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllRead(@Req() request: Request & { user?: JwtPayload }) {
    const role = request.user?.role ?? 'viewer';
    const username = request.user?.username ?? 'unknown';
    return this.notificationsService.markAllAsRead(role, username);
  }
}

@Module({
  imports: [MongooseModule.forFeature([{ name: NotificationRecord.name, schema: NotificationRecordSchema }])],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService, MongooseModule],
})
export class NotificationsModule {}