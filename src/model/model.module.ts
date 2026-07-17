import { Module } from '@nestjs/common';
import { ModelController } from './model.controller.js';
import { ModelFactory } from './model.factory.js';
import { ModelService } from './model.service.js';

@Module({
  controllers: [ModelController],
  providers: [ModelFactory, ModelService],
  exports: [ModelFactory, ModelService]
})
export class ModelModule {}
