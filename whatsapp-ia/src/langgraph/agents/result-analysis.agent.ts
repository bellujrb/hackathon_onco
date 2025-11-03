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
    const risk = result.riskAssessment;

    const prompt = `
Você é um médico enviando resultado de triagem de voz para câncer de laringe.

RISCO: ${risk.riskLevel}

REGRAS ESTRITAS:
❌ NÃO cumprimente
❌ NÃO use termos técnicos
❌ NÃO contradiga o nível de risco (se é baixo, NÃO fale de sinais identificados!)
❌ Máximo 5 linhas

${risk.riskLevel.toLowerCase().includes('baixo') ? `
✅ Baixo risco = "não identificou sinais de preocupação"
✅ Oriente: continue cuidando da voz
` : risk.riskLevel.toLowerCase().includes('alto') ? `
✅ Alto risco = "sinais que precisam de atenção"
✅ Oriente: procure otorrino urgente
` : `
✅ Médio risco = "alguns aspectos precisam de avaliação"  
✅ Oriente: marque consulta com otorrino
`}

Formato:
[emoji] [resultado em 2 frases]. [orientação em 2 frases].

_Lembre-se: este é apenas um rastreamento inicial._
    `;

    const response = await this.process(prompt, context);

    if (response.success) {
      return response.content;
    }

    return this.buildSimpleExplanation(result);
  }

  private buildSimpleExplanation(result: VoiceAnalysisResult): string {
    const risk = result.riskAssessment;
    const emoji = risk.color === 'red' ? '🔴' : risk.color === 'orange' ? '🟡' : '🟢';

    if (risk.riskLevel.toLowerCase().includes('alto')) {
      return `${emoji} Sua análise mostrou *sinais que merecem atenção*. Procure um otorrino o quanto antes.\n\n_Lembre-se: este é apenas um rastreamento inicial._`;
    } else if (risk.riskLevel.toLowerCase().includes('moderado') || risk.riskLevel.toLowerCase().includes('médio')) {
      return `${emoji} Sua análise mostrou alguns aspectos que precisam de atenção. Marque uma consulta com um otorrino.\n\n_Lembre-se: este é apenas um rastreamento inicial._`;
    } else {
      return `${emoji} Sua análise não identificou sinais de preocupação. Continue cuidando da sua saúde vocal!\n\n_Lembre-se: este é apenas um rastreamento inicial._`;
    }
  }
}

