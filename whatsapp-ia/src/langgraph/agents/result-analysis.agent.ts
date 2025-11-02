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
        Você recebeu o resultado de uma análise de voz para rastreamento de câncer de laringe.

        Informações sobre o resultado:
        - Nível de risco identificado: ${risk.riskLevel}
        - Pontuação de risco: ${risk.riskScore}/100
        ${risk.riskFactors.length > 0 ? `- Foram identificados alguns sinais: ${risk.riskFactors.join(', ')}` : '- Nenhum fator de risco identificado'}
        - Recomendação: ${risk.recommendation}

        IMPORTANTE:
        • Seja DIRETO e ACOLHEDOR, como um profissional de saúde conversando pessoalmente
        • NÃO cumprimente (sem "Olá", "Oi", etc) - vá direto ao resultado
        • NÃO liste dados técnicos (HNR, F0, Jitter, Shimmer, etc)
        • NÃO mencione pontuações numéricas
        • Foque no que a pessoa precisa SABER e FAZER
        • Use linguagem simples e empática
        • Reforce que é um rastreio inicial, não um diagnóstico
        • Seja tranquilizador mas honesto
        • Use markdown do WhatsApp: *negrito*, _itálico_

        Explique o resultado de forma humana, natural e DIRETA:
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

    let explanation = [
      `${emoji} *Resultado da sua análise de voz*`,
      '',
    ];

    if (risk.riskLevel.toLowerCase().includes('alto')) {
      explanation.push(
        'Olha, sua análise mostrou alguns sinais que merecem atenção. Não é motivo pra pânico, mas é importante você procurar um otorrinolaringologista o quanto antes, ok?',
      );
    } else if (risk.riskLevel.toLowerCase().includes('moderado') || risk.riskLevel.toLowerCase().includes('médio')) {
      explanation.push(
        'Sua análise mostrou alguns aspectos que precisam de atenção. Recomendo que você marque uma consulta com um otorrino pra uma avaliação mais completa.',
      );
    } else {
      explanation.push(
        'Que bom! Sua análise não identificou sinais de preocupação. Mas lembre-se: isso é só um rastreio inicial.',
      );
    }

    if (risk.riskFactors.length > 0) {
      explanation.push('', 'O que chamou atenção:');
      risk.riskFactors.forEach((factor) => {
        explanation.push(`• ${factor}`);
      });
    }

    explanation.push('', `💡 ${risk.recommendation}`);

    explanation.push(
      '',
      '_Lembre-se: Este é um rastreamento inicial, não um diagnóstico. Apenas um médico especialista pode fazer uma avaliação completa._',
    );

    return explanation.join('\n');
  }
}

