import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { OpenAIModelService } from './services/openai-model.service';

import { ConversationAgent } from './agents/conversation.agent';
import { ResultAnalysisAgent } from './agents/result-analysis.agent';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    OpenAIModelService,

    ConversationAgent,
    ResultAnalysisAgent,
  ],
  exports: [
    OpenAIModelService,
    ConversationAgent,
    ResultAnalysisAgent,
  ],
})
export class LangGraphModule {}

