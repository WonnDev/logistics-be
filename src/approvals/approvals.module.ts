import { Controller, Delete, Get, Injectable, Module, Param, Patch, Post, Body } from '@nestjs/common';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { IsDateString, IsOptional, IsString } from 'class-validator';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { PartialType } from '@nestjs/mapped-types';
import { CrudService } from '../common/mongoose/crud.service';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';

@Schema({ timestamps: true })
export class Approval {
  @Prop({ required: true, trim: true })
  targetType!: string;

  @Prop({ required: true, trim: true })
  targetId!: string;

  @Prop({ required: true, trim: true, default: 'pending' })
  status!: string;

  @Prop({ trim: true })
  approver?: string;

  @Prop({ trim: true })
  comment?: string;

  @Prop({ type: Date })
  approvedAt?: Date;
}

export type ApprovalDocument = HydratedDocument<Approval>;
export const ApprovalSchema = SchemaFactory.createForClass(Approval);

export class CreateApprovalDto {
  @ApiProperty()
  @IsString()
  targetType!: string;

  @ApiProperty()
  @IsString()
  targetId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  approver?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  approvedAt?: string;
}

export class UpdateApprovalDto extends PartialType(CreateApprovalDto) {}

@Injectable()
export class ApprovalsService extends CrudService<ApprovalDocument> {
  constructor(@InjectModel(Approval.name) model: Model<ApprovalDocument>) {
    super(model, 'Approval');
  }

  async createApproval(dto: CreateApprovalDto) {
    return this.create({
      targetType: dto.targetType,
      targetId: dto.targetId,
      status: dto.status ?? 'pending',
      approver: dto.approver,
      comment: dto.comment,
      approvedAt: dto.approvedAt ? new Date(dto.approvedAt) : undefined,
    } as Partial<ApprovalDocument>);
  }

  async updateApproval(id: string, dto: UpdateApprovalDto) {
    return this.update(id, {
      targetType: dto.targetType,
      targetId: dto.targetId,
      status: dto.status,
      approver: dto.approver,
      comment: dto.comment,
      approvedAt: dto.approvedAt ? new Date(dto.approvedAt) : undefined,
    } as Partial<ApprovalDocument>);
  }
}

@ApiTags('approvals')
@ApiBearerAuth()
@Controller('approvals')
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Get()
  @ApiOperation({ summary: 'List approvals' })
  findAll() {
    return this.approvalsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get approval by id' })
  findOne(@Param('id') id: string) {
    return this.approvalsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create approval' })
  create(@Body() dto: CreateApprovalDto) {
    return this.approvalsService.createApproval(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update approval' })
  update(@Param('id') id: string, @Body() dto: UpdateApprovalDto) {
    return this.approvalsService.updateApproval(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete approval' })
  remove(@Param('id') id: string) {
    return this.approvalsService.remove(id);
  }
}

@Module({
  imports: [MongooseModule.forFeature([{ name: Approval.name, schema: ApprovalSchema }])],
  controllers: [ApprovalsController],
  providers: [ApprovalsService],
  exports: [ApprovalsService, MongooseModule],
})
export class ApprovalsModule {}
