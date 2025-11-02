import { Controller, Post, Body, HttpCode, Logger } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { VoiceAnalysisResult } from '../langgraph/types/agent.types';

@Controller('api/webhook')
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name);

  constructor(private readonly whatsappService: WhatsappService) {}

  @Post('result')
  @HttpCode(200)
  async receiveResult(
    @Body()
    payload: {
      sessionId: string;
      result: VoiceAnalysisResult;
    },
  ) {
    this.logger.log(`📥 Webhook recebido: ${payload.sessionId}`);

    try {
      await this.whatsappService.handleResultWebhook(
        payload.sessionId,
        payload.result,
      );

      return {
        success: true,
        message: 'Resultado processado e enviado para o usuário',
      };
    } catch (error) {
      this.logger.error('Erro no webhook:', error);
      return {
        success: false,
        message: 'Erro ao processar resultado',
      };
    }
  }
}

