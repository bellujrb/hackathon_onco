import { Injectable } from '@nestjs/common';
import { BaseAgent } from './base/base-agent';
import { AgentContext, AgentResponse } from '../types/agent.types';
import { LANGGRAPH_SYSTEM_PROMPTS, LANGGRAPH_AI_MODELS } from '../constants/langgraph.constants';
import { OpenAIModelService } from '../services/openai-model.service';

@Injectable()
export class ConversationAgent extends BaseAgent {
  constructor(openAIService: OpenAIModelService) {
    super(openAIService, LANGGRAPH_AI_MODELS.CONTEXT_GENERATION, 0.7);
  }

  async process(input: string, context: AgentContext): Promise<AgentResponse> {
    const startTime = Date.now();

    try {
      const messages: any[] = [
        {
          role: 'system',
          content: LANGGRAPH_SYSTEM_PROMPTS.BASE_IDENTITY,
        },
      ];

      // Log do histórico para debug
      const historyCount = context.conversationHistory?.length || 0;
      console.log(`📝 Histórico de conversa: ${historyCount} mensagens`);

      if (context.conversationHistory && context.conversationHistory.length > 0) {
        const recentHistory = context.conversationHistory.slice(-8);
        messages.push(...recentHistory);
        console.log(`✅ Usando ${recentHistory.length} mensagens do histórico`);
      } else {
        console.log(`🆕 Primeira conversa (sem histórico)`);
      }

      messages.push({
        role: 'user',
        content: input,
      });

      const llmResponse = await this.llm.invoke(messages);
      const executionTime = Date.now() - startTime;

      return this.createSuccessResponse(
        String(llmResponse.content),
        context,
        'conversation',
        executionTime,
      );
    } catch (error) {
      return this.createErrorResponse(error.message, context, 'conversation');
    }
  }

  async canHandle(input: string, context: AgentContext): Promise<boolean> {
    return true;
  }

  async detectIntent(input: string, context: AgentContext): Promise<'send_test_link' | 'general'> {
    try {
      const messages: any[] = [
        {
          role: 'system',
          content: `Você é um classificador de intenções.

          Retorne APENAS uma palavra:
          • "SEND_TEST_LINK" - se a pessoa quer fazer o teste de voz AGORA
          • "GENERAL" - para qualquer outra situação

          Exemplos de SEND_TEST_LINK:
          - "quero fazer o teste"
          - "pode me enviar o link?"
          - "como faço pra testar?"
          - "vou fazer agora"

          Exemplos de GENERAL:
          - "o que é isso?"
          - "como funciona?"
          - "oi"
          - "pode explicar?"`,
        },
      ];

      if (context.conversationHistory && context.conversationHistory.length > 0) {
        const recentHistory = context.conversationHistory.slice(-4);
        messages.push(...recentHistory);
      }

      messages.push({
        role: 'user',
        content: `Classifique esta mensagem: "${input}"`,
      });

      const response = await this.llm.invoke(messages);
      const intent = String(response.content).trim().toUpperCase();

      if (intent.includes('SEND_TEST_LINK')) {
        return 'send_test_link';
      }

      return 'general';
    } catch (error) {
      return 'general';
    }
  }

  async generateTestLinkMessage(testLink: string): Promise<string> {
    try {
      const response = await this.llm.invoke([
        {
          role: 'system',
          content: `Você é um assistente de saúde vocal. Crie mensagens CURTAS, naturais e diretas.

          IMPORTANTE:
          • Use markdown do WhatsApp: *negrito*, _itálico_
          • Seja BREVE e OBJETIVO
          • Mencione que é pra gravar algumas FRASES
          • Diga que o resultado volta aqui no WhatsApp`,
        },
        {
          role: 'user',
          content: `Envie o link do teste de forma amigável e formatada:\n${testLink}`,
        },
      ] as any);

      const text = String(response.content).trim();
      return (
        text ||
        `Pronto! 😊\n\n*Link do teste:* ${testLink}\n\nÉ bem rápido: você vai gravar algumas frases faladas. Assim que terminar, o resultado chega aqui no WhatsApp!\n\nQualquer dúvida, é só chamar. 🎤`
      );
    } catch (error) {
      return `Pronto! 😊\n\n*Link do teste:* ${testLink}\n\nÉ bem rápido: você vai gravar algumas frases faladas. Assim que terminar, o resultado chega aqui no WhatsApp!\n\nQualquer dúvida, é só chamar. 🎤`;
    }
  }

  async generateProcessingMessage(): Promise<string> {
    try {
      const response = await this.llm.invoke([
        {
          role: 'system',
          content: 'Você é um assistente de saúde vocal. Seja breve, tranquilizador e coloquial.',
        },
        {
          role: 'user',
          content:
            'Crie uma mensagem curta (1-2 linhas) dizendo que recebeu o teste de voz e está analisando.',
        },
      ] as any);

      const text = String(response.content).trim();
      return text || 'Recebi seu teste! Só um momento enquanto analiso... 🔍';
    } catch (error) {
      return 'Recebi seu teste! Só um momento enquanto analiso... 🔍';
    }
  }
}

