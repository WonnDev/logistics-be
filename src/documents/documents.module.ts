import { Controller, Delete, Get, Injectable, Module, Param, Patch, Post, Body } from '@nestjs/common';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { IsOptional, IsString } from 'class-validator';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { PartialType } from '@nestjs/mapped-types';
import { CrudService } from '../common/mongoose/crud.service';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';

@Schema({ timestamps: true })
export class DocumentRecord {
  @Prop({ required: true, trim: true })
  vehiclePlate!: string;

  @Prop({ trim: true })
  type?: string;

  @Prop({ type: Date })
  expiryDate?: Date;

  @Prop({ trim: true })
  fileId?: string;
}

export type DocumentRecordDocument = HydratedDocument<DocumentRecord>;
export const DocumentRecordSchema = SchemaFactory.createForClass(DocumentRecord);

export class CreateDocumentDto {
  @ApiProperty({ example: '99F00379' })
  @IsString()
  vehiclePlate!: string;

  @ApiPropertyOptional({ example: 'registration' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ example: '2027-03-15' })
  @IsOptional()
  @IsString()
  expiryDate?: string;

  @ApiPropertyOptional({ example: 'doc-registration-001' })
  @IsOptional()
  @IsString()
  fileId?: string;
}

export class UpdateDocumentDto extends PartialType(CreateDocumentDto) {}

@Injectable()
export class DocumentsService extends CrudService<DocumentRecordDocument> {
  constructor(@InjectModel(DocumentRecord.name) model: Model<DocumentRecordDocument>) {
    super(model, 'Document');
  }
}

@ApiTags('documents')
@ApiBearerAuth()
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  @ApiOperation({ summary: 'List documents' })
  findAll() {
    return this.documentsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document by id' })
  findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create document' })
  create(@Body() dto: CreateDocumentDto) {
    return this.documentsService.create({
      vehiclePlate: dto.vehiclePlate,
      type: dto.type,
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
      fileId: dto.fileId,
    } as Partial<DocumentRecordDocument>);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update document' })
  update(@Param('id') id: string, @Body() dto: UpdateDocumentDto) {
    return this.documentsService.update(id, {
      vehiclePlate: dto.vehiclePlate,
      type: dto.type,
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
      fileId: dto.fileId,
    } as Partial<DocumentRecordDocument>);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete document' })
  remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }
}

@Module({
  imports: [MongooseModule.forFeature([{ name: DocumentRecord.name, schema: DocumentRecordSchema }])],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService, MongooseModule],
})
export class DocumentsModule {}
