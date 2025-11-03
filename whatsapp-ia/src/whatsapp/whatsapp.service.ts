import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  WASocket,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import * as qrcode from 'qrcode-terminal';

import { SessionService } from '../session/session.service';
import { ConversationAgent } from '../langgraph/agents/conversation.agent';
import { ResultAnalysisAgent } from '../langgraph/agents/result-analysis.agent';
import { VoiceAnalysisResult } from '../langgraph/types/agent.types';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

@Injectable()
export class WhatsappService implements OnModuleDestroy {
  private readonly logger = new Logger(WhatsappService.name);
  private socket?: WASocket;
  private readonly frontendUrl: string;
  private readonly modelApiUrl: string;
  
  private conversationHistory = new Map<string, ConversationMessage[]>();

  constructor(
    private readonly configService: ConfigService,
    private readonly sessionService: SessionService,
    private readonly conversationAgent: ConversationAgent,
    private readonly resultAnalysisAgent: ResultAnalysisAgent,
  ) {
    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    this.modelApiUrl =
      this.configService.get<string>('MODEL_API_URL') || 'http://localhost:8000';
  }

  private addToHistory(userId: string, role: 'user' | 'assistant', content: string): void {
    if (!this.conversationHistory.has(userId)) {
      this.conversationHistory.set(userId, []);
    }
    
    const history = this.conversationHistory.get(userId)!;
    history.push({ role, content, timestamp: new Date() });
    
    if (history.length > 20) {
      history.shift();
    }
  }

  private getHistory(userId: string): ConversationMessage[] {
    return this.conversationHistory.get(userId) || [];
  }

  private async simulateTyping(chatId: string, durationMs: number = 3000): Promise<void> {
    try {
      await this.socket?.sendPresenceUpdate('composing', chatId);
      await new Promise((resolve) => setTimeout(resolve, durationMs));
      await this.socket?.sendPresenceUpdate('paused', chatId);
    } catch (error) {
      this.logger.warn('Erro ao simular digitação:', error);
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private formatResultMessage(result: VoiceAnalysisResult): string {
    const { riskAssessment } = result;
    
    // Escolher emoji baseado no risco
    let emoji = '🟢';
    if (riskAssessment.color === 'red') emoji = '🔴';
    else if (riskAssessment.color === 'yellow' || riskAssessment.color === 'orange') emoji = '🟡';

    return `
✅ *Resultado da sua análise chegou!*

${emoji} *${riskAssessment.riskLevel.toUpperCase()}*

${riskAssessment.recommendation}

━━━━━━━━━━━━━━━━━━━

⚠️ _Lembre-se: este é apenas um rastreamento inicial. Para um diagnóstico completo, consulte um médico otorrinolaringologista._
`.trim();
  }

  async start(): Promise<void> {
    await this.initializeSocket();
  }

  async onModuleDestroy(): Promise<void> {
    await this.socket?.logout();
    this.socket = undefined;
  }

  private async initializeSocket(): Promise<void> {
    const { state, saveCreds } = await useMultiFileAuthState('auth');
    const { version } = await fetchLatestBaileysVersion();

    this.socket = makeWASocket({
      version,
      auth: state,
      logger: pino({ level: 'info' }),
    });

    this.socket.ev.on('creds.update', saveCreds);
    this.socket.ev.on('connection.update', (update) =>
      this.handleConnectionUpdate(update),
    );
    this.socket.ev.on('messages.upsert', (upsert) =>
      this.handleMessages(upsert).catch((error) =>
        this.logger.error('Erro ao processar mensagem:', error),
      ),
    );
  }

  private handleConnectionUpdate(update: any) {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\n📱 Escaneie o QR Code abaixo no WhatsApp:\n');
      qrcode.generate(qr, { small: true });
      this.logger.log('QR Code gerado - Escaneie para conectar');
    }

    if (connection === 'open') {
      this.logger.log('✅ Conexão com WhatsApp estabelecida');
    }

    if (connection === 'close') {
      const shouldReconnect =
        (lastDisconnect?.error as any)?.output?.statusCode !==
        DisconnectReason.loggedOut;

      if (shouldReconnect) {
        this.logger.warn('⚠️  Conexão perdida. Reconectando...');
        setTimeout(() => this.initializeSocket(), 3000);
      } else {
        this.logger.warn(
          '🔴 Conexão encerrada. Apague a pasta "auth" e reinicie.',
        );
      }
    }
  }

  private async handleMessages(upsert: any) {
    const message = upsert.messages?.[0];
    if (!message || message.key.fromMe) return;

    const sender = message.key.remoteJid;
    const textBody =
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text ||
      '';

    if (!textBody) return;

    this.logger.log(`📩 Mensagem de ${sender}: "${textBody}"`);

    this.addToHistory(sender, 'user', textBody);

    try {
      const history = this.getHistory(sender);
      
      const intent = await this.conversationAgent.detectIntent(textBody, {
        userId: sender,
        conversationHistory: history,
      });

      if (intent === 'send_test_link') {
        await this.handleTestRequest(sender);
      } else {
        await this.simulateTyping(sender, 2000);
        
        const response = await this.conversationAgent.process(textBody, {
          userId: sender,
          conversationHistory: history,
        });
        
        if (response.success) {
          await this.socket?.sendMessage(sender, { text: response.content });
          this.addToHistory(sender, 'assistant', response.content);
          
          this.logger.log(`Resposta enviada para ${sender}`);
        } else {
          throw new Error(response.error);
        }
      }
    } catch (error) {
      this.logger.error('Erro ao processar mensagem:', error);
      await this.socket?.sendMessage(sender, {
        text: 'Desculpe, tive um problema técnico. Pode tentar novamente?',
      });
    }
  }

  private async handleTestRequest(sender: string) {
    try {
      await this.simulateTyping(sender, 1500);
      
      const sessionId = this.sessionService.createSession(sender);

      const testLink = `${this.frontendUrl}/teste?session=${sessionId}`;

      const message = await this.conversationAgent.generateTestLinkMessage(testLink);

      await this.socket?.sendMessage(sender, { text: message });
      this.addToHistory(sender, 'assistant', message);

      this.logger.log(`✅ Link enviado para ${sender}: ${sessionId}`);
    } catch (error) {
      this.logger.error('Erro ao criar sessão:', error);
      const errorMsg = 'Ops, tive um problema ao gerar o link. Pode tentar de novo?';
      await this.socket?.sendMessage(sender, { text: errorMsg });
      this.addToHistory(sender, 'assistant', errorMsg);
    }
  }

  async handleResultWebhook(sessionId: string, result: VoiceAnalysisResult) {
    try {
      const session = this.sessionService.getSession(sessionId);

      if (!session) {
        this.logger.warn(`Sessão não encontrada: ${sessionId}`);
        return;
      }

      const whatsappId = session.whatsappId;

      this.logger.log(`📥 Resultado recebido para ${whatsappId}`);

      await this.simulateTyping(whatsappId, 1500);

      const processingMsg = 'Recebi seu teste! Analisando... 🔍';
      await this.socket?.sendMessage(whatsappId, { text: processingMsg });
      this.addToHistory(whatsappId, 'assistant', processingMsg);

      this.logger.log('Aguardando antes de enviar resultado...');
      await this.delay(2000);

      await this.simulateTyping(whatsappId, 3000);

      // Usar o agente de análise de resultado para gerar mensagem personalizada com LLM
      this.logger.log('Gerando explicação personalizada com LLM...');
      
      try {
        const resultMessage = await this.resultAnalysisAgent.explainResult(result, {
          userId: whatsappId,
          conversationHistory: this.getHistory(whatsappId),
        });

        await this.socket?.sendMessage(whatsappId, { text: resultMessage });
        this.addToHistory(whatsappId, 'assistant', resultMessage);
        this.logger.log(`Resultado enviado para ${whatsappId}`);
      } catch (error) {
        // Fallback se a LLM falhar
        this.logger.error('Erro na LLM, usando fallback:', error);
        const fallbackMsg = this.formatResultMessage(result);
        await this.socket?.sendMessage(whatsappId, { text: fallbackMsg });
        this.addToHistory(whatsappId, 'assistant', fallbackMsg);
      }

      this.sessionService.deleteSession(sessionId);
    } catch (error) {
      this.logger.error('Erro ao processar webhook:', error);
    }
  }
}
