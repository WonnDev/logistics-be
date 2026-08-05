import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Injectable,
  Module,
  Param,
  Post,
  Body,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { IsOptional, IsString } from 'class-validator';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CrudService } from '../common/mongoose/crud.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Response } from 'express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';

const allowedMimeTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

@Schema({ timestamps: true })
export class FileRecord {
  @Prop({ required: true, trim: true })
  fileName!: string;

  @Prop({ required: true, trim: true })
  tripCode!: string;

  @Prop({ required: true, trim: true })
  type!: string;

  @Prop({ required: true })
  size!: number;

  @Prop({ required: true, type: Buffer })
  data!: Buffer;

  @Prop({ trim: true })
  mimeType?: string;

  @Prop({ trim: true })
  entityId?: string;
}

export type FileRecordDocument = HydratedDocument<FileRecord>;
export const FileRecordSchema = SchemaFactory.createForClass(FileRecord);

export class CreateFileDto {
  @ApiProperty({ example: 'TRIP-20260623-2083' })
  @IsString()
  tripCode!: string;

  @ApiProperty({ example: 'POD' })
  @IsString()
  type!: string;

  @ApiPropertyOptional({ example: 'pod.jpg' })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional({ example: '<tripObjectId>' })
  @IsOptional()
  @IsString()
  entityId?: string;
}

@Injectable()
export class FilesService extends CrudService<FileRecordDocument> {
  private readonly fileLogger = new Logger(FilesService.name);

  constructor(@InjectModel(FileRecord.name) model: Model<FileRecordDocument>) {
    super(model, 'File');
  }

  async uploadFile(file: Express.Multer.File, dto: CreateFileDto) {
    this.fileLogger.log(`Uploading file ${dto.fileName ?? file.originalname} for trip ${dto.tripCode}`);
    if (!allowedMimeTypes.has(file.mimetype)) {
      this.fileLogger.warn(`Rejected file upload due to mime type ${file.mimetype}`);
      throw new BadRequestException('Unsupported file type');
    }

    return this.create({
      fileName: dto.fileName ?? file.originalname,
      tripCode: dto.tripCode,
      type: dto.type,
      size: file.size,
      data: file.buffer,
      mimeType: file.mimetype,
      entityId: dto.entityId,
    } as Partial<FileRecordDocument>);
  }
}

@ApiTags('files')
@ApiBearerAuth()
@Controller('files')
export class FilesController {
  private readonly logger = new Logger(FilesController.name);

  constructor(private readonly filesService: FilesService) {}

  @Get()
  @ApiOperation({ summary: 'List files' })
  findAll() {
    return this.filesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Download file by id' })
  async download(@Param('id') id: string, @Res({ passthrough: true }) response: Response) {
    this.logger.log(`Downloading file ${id}`);
    const file = await this.filesService.findOne(id);
    response.setHeader('Content-Type', file.mimeType ?? 'application/octet-stream');
    response.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    return file.data;
  }

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload file' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        tripCode: { type: 'string', example: 'TRIP-20260623-2083' },
        type: { type: 'string', example: 'POD' },
        fileName: { type: 'string', example: 'pod.jpg' },
        entityId: { type: 'string', example: '<tripObjectId>' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File, @Body() dto: CreateFileDto) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    if (file.size > 2 * 1024 * 1024) {
      throw new BadRequestException('File size exceeds 2MB limit');
    }
    this.logger.log(`Received upload ${file.originalname} (${file.size} bytes) for trip ${dto.tripCode}`);
    return this.filesService.uploadFile(file, dto).then((record) => ({
      fileId: record.id,
      fileName: record.fileName,
      size: record.size,
      url: `/files/${record.id}`,
    }));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete file' })
  remove(@Param('id') id: string) {
    this.logger.log(`Deleting file ${id}`);
    return this.filesService.remove(id);
  }
}

@Module({
  imports: [MongooseModule.forFeature([{ name: FileRecord.name, schema: FileRecordSchema }])],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService, MongooseModule],
})
export class FilesModule {}
