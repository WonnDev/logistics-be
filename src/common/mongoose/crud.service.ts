import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { isValidObjectId, Model, Types } from 'mongoose';

@Injectable()
export abstract class CrudService<TDocument> {
  protected readonly logger: Logger;

  protected constructor(
    protected readonly model: Model<TDocument>,
    protected readonly entityName: string,
  ) {
    this.logger = new Logger(entityName);
  }

  async findAll() {
    this.logger.log(`Listing ${this.entityName}s`);
    return this.model.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string) {
    this.assertValidObjectId(id);
    this.logger.log(`Fetching ${this.entityName} ${id}`);
    const record = await this.model.findById(id).exec();
    if (!record) {
      throw new NotFoundException(`${this.entityName} not found`);
    }
    return record;
  }

  async create(payload: Partial<TDocument>) {
    try {
      this.logger.log(`Creating ${this.entityName}`);
      return await this.model.create(payload);
    } catch (error: any) {
      this.logger.error(`Failed to create ${this.entityName}`, error?.stack ?? error?.message ?? error);
      this.handleMongoError(error);
      throw error;
    }
  }

  async update(id: string, payload: Partial<TDocument>) {
    this.assertValidObjectId(id);
    try {
      this.logger.log(`Updating ${this.entityName} ${id}`);
      const updated = await this.model
        .findByIdAndUpdate(id, payload, { new: true, runValidators: true })
        .exec();
      if (!updated) {
        throw new NotFoundException(`${this.entityName} not found`);
      }
      return updated;
    } catch (error: any) {
      this.logger.error(`Failed to update ${this.entityName} ${id}`, error?.stack ?? error?.message ?? error);
      this.handleMongoError(error);
      throw error;
    }
  }

  async remove(id: string) {
    this.assertValidObjectId(id);
    const deleted = await this.model.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException(`${this.entityName} not found`);
    }
    this.logger.log(`Deleted ${this.entityName} ${id}`);
    return { deleted: true };
  }

  protected handleMongoError(error: any) {
    if (error?.code === 11000) {
      throw new ConflictException(`${this.entityName} already exists`);
    }
  }

  protected assertValidObjectId(id: string) {
    if (!isValidObjectId(id) || !Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`${this.entityName} not found`);
    }
  }
}
