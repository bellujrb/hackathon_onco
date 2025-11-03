import { Injectable } from '@nestjs/common';
import { BaseAgent } from './base/base-agent';
import { AgentContext, AgentResponse, VoiceAnalysisResult } from '../types/agent.types';
import { LANGGRAPH_AI_MODELS } from '../constants/langgraph.constants';
import { OpenAIModelService } from '../services/openai-model.service';

@Injectable()
export class ResultAnalysisAgent extends BaseAgent {
  constructor(openAIService: OpenAIModelService) {
    super(openAIService, LANGGRAPH_AI_MODELS.CONTEXT_GENERATION, 0.7);
  }

  async process(input: string, context: AgentContext): Promise<AgentResponse> {
    const startTime = Date.now();

    try {
      const messages = [
        {
          role: 'system',
          content:
            'Você é um especialista em saúde vocal e otorrinolaringologia. Explique resultados de análise de voz de forma CLARA e ACOLHEDORA para pacientes leigos.',
        },
        {
          role: 'user',
          content: input,
        },
      ];

      const llmResponse = await this.llm.invoke(messages as any);
      const executionTime = Date.now() - startTime;

      return this.createSuccessResponse(
        String(llmResponse.content),
        context,
        'result_analysis',
        executionTime,
      );
    } catch (error) {
      return this.createErrorResponse(error.message, context, 'result_analysis');
    }
  }

  async canHandle(input: string, context: AgentContext): Promise<boolean> {
    return true;
  }

  async explainResult(result: VoiceAnalysisResult, context: AgentContext): Promise<string> {
    // Usar template fixo para garantir consistência
    return this.buildSimpleExplanation(result);
  }

  private buildSimpleExplanation(result: VoiceAnalysisResult): string {
    const risk = result.riskAssessment;
    const emoji = risk.color === 'red' ? '🔴' : risk.color === 'orange' ? '🟡' : '🟢';
    const riskText = risk.riskLevel.toUpperCase();

    let message = '';

    if (risk.riskLevel.toLowerCase().includes('alto')) {
      message = `${emoji} *${riskText}*\n\nSua análise identificou sinais que precisam de atenção. Procure um otorrinolaringologista o quanto antes para avaliação.\n\n_Lembre-se: este é apenas um rastreamento inicial._`;
    } else if (risk.riskLevel.toLowerCase().includes('moderado') || risk.riskLevel.toLowerCase().includes('médio')) {
      message = `${emoji} *${riskText}*\n\nSua análise mostrou alguns aspectos que precisam de avaliação médica. Agende uma consulta com um otorrinolaringologista.\n\n_Lembre-se: este é apenas um rastreamento inicial._`;
    } else {
      message = `${emoji} *${riskText}*\n\nSua análise não identificou sinais de preocupação. Continue cuidando da sua saúde vocal com hidratação e repouso quando necessário.\n\n_Lembre-se: este é apenas um rastreamento inicial._`;
    }

    // Adicionar informações sobre os dados analisados
    const dataInfo = this.buildDataSummary(result);
    return `${message}\n\n${dataInfo}`;
  }

  private buildDataSummary(result: VoiceAnalysisResult): string {
    const features = result.features;
    const risk = result.riskAssessment;

    return `📊 *Dados Analisados:*\n\n` +
      `⏱️ Duração do áudio: ${features.duration.toFixed(2)}s\n` +
      `🎵 Frequência vocal: ${features.fundamentalFrequency.mean.toFixed(1)} Hz\n` +
      `📈 Estabilidade vocal (Jitter): ${(features.jitter.local * 100).toFixed(2)}%\n` +
      `📉 Regularidade de amplitude (Shimmer): ${(features.shimmer.local * 100).toFixed(2)}%\n` +
      `🔊 Qualidade harmônica (HNR): ${features.hnr.mean.toFixed(2)} dB`;
  }
}

