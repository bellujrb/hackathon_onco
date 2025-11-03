import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { createReadStream } from 'fs';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

@Injectable()
export class AudioTranscriptionService {
  private readonly logger = new Logger(AudioTranscriptionService.name);
  private readonly openai: OpenAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    
    if (!apiKey) {
      this.logger.warn('⚠️  OPENAI_API_KEY não configurada - transcrição de áudio desabilitada');
    }
    
    this.openai = new OpenAI({
      apiKey: apiKey || 'dummy-key',
    });
  }

  /**
   * Transcreve um áudio usando OpenAI Whisper
   * @param audioBuffer Buffer contendo o áudio
   * @param format Formato do áudio (ogg, mp4, etc)
   * @returns Texto transcrito
   */
  async transcribe(audioBuffer: Buffer, format: string = 'ogg'): Promise<string> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY não configurada');
    }

    // Criar diretório temporário se não existir
    const tempDir = join(process.cwd(), 'temp');
    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true });
      this.logger.log(`📁 Diretório temp criado: ${tempDir}`);
    }

    const tempFileName = `audio-${Date.now()}.${format}`;
    const tempFilePath = join(tempDir, tempFileName);

    try {
      this.logger.log(`📝 Transcrevendo áudio (${audioBuffer.length} bytes)...`);

      // Salvar buffer em arquivo temporário
      await writeFile(tempFilePath, audioBuffer);

      // Transcrever usando Whisper
      const transcription = await this.openai.audio.transcriptions.create({
        file: createReadStream(tempFilePath),
        model: 'whisper-1',
        language: 'pt', // Português
        response_format: 'text',
      });

      this.logger.log(`✅ Transcrição completa: "${transcription}"`);

      return transcription as string;
    } catch (error) {
      this.logger.error('❌ Erro ao transcrever áudio:', error);
      throw new Error(`Falha na transcrição: ${error.message}`);
    } finally {
      // Limpar arquivo temporário
      try {
        await unlink(tempFilePath);
      } catch (err) {
        this.logger.warn(`Erro ao deletar arquivo temporário: ${tempFilePath}`);
      }
    }
  }
}

