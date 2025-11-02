import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { ImageGeneratorService } from './image-generator.service';
import { SessionModule } from '../session/session.module';
import { LangGraphModule } from '../langgraph/langgraph.module';

@Module({
  imports: [ConfigModule, SessionModule, LangGraphModule],
  controllers: [WhatsappController],
  providers: [WhatsappService, ImageGeneratorService],
  exports: [WhatsappService],
})
export class WhatsappModule {}

