export interface AgentContext {
  chatId?: string;
  userId: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  metadata?: Record<string, any>;
}

export interface AgentResponse {
  success: boolean;
  content: string;
  context: AgentContext;
  error?: string;
  executionTime?: number;
}

export interface VoiceAnalysisResult {
  success: boolean;
  features: {
    fundamentalFrequency: { mean: number; std: number };
    jitter: { local: number; rap: number; ppq5: number };
    shimmer: { local: number; apq3: number; apq5: number };
    hnr: { mean: number; std: number };
    duration: number;
  };
  riskAssessment: {
    riskLevel: string;
    riskScore: number;
    riskFactors: string[];
    recommendation: string;
    color: string;
    confidence: number;
  };
}

