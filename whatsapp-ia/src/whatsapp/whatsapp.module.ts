import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { SessionModule } from '../session/session.module';
import { LangGraphModule } from '../langgraph/langgraph.module';

@Module({
  imports: [ConfigModule, SessionModule, LangGraphModule],
  controllers: [WhatsappController],
  providers: [WhatsappService],
  exports: [WhatsappService],
})
export class WhatsappModule {}

