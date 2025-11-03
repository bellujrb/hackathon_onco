import { Injectable, Logger } from '@nestjs/common';
import { VoiceAnalysisResult } from '../langgraph/types/agent.types';
const sharp = require('sharp');

@Injectable()
export class ImageGeneratorService {
  private readonly logger = new Logger(ImageGeneratorService.name);

  async generateResultImage(result: VoiceAnalysisResult): Promise<Buffer> {
    const risk = result.riskAssessment;
    const colors = this.getColorScheme(risk.color);
    const emoji = this.getRiskEmoji(risk.color);
    
    const width = 800;
    const height = 600;

    // Criar SVG com o resultado
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <!-- Background com gradiente -->
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:${colors.bgStart};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${colors.bgEnd};stop-opacity:1" />
          </linearGradient>
          
          <!-- Shadow para o card -->
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="10"/>
            <feOffset dx="0" dy="10" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.2"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <!-- Background -->
        <rect width="${width}" height="${height}" fill="url(#grad)"/>
        
        <!-- Card branco com sombra -->
        <rect x="40" y="40" width="720" height="520" rx="20" fill="white" filter="url(#shadow)"/>
        
        <!-- Título -->
        <text x="400" y="120" font-family="Arial, sans-serif" font-size="42" font-weight="bold" 
              fill="${colors.primary}" text-anchor="middle">
          🎤 Resultado da Análise
        </text>
        
        <!-- Emoji do risco -->
        <text x="400" y="240" font-size="80" text-anchor="middle">
          ${emoji}
        </text>
        
        <!-- Nível de risco -->
        <text x="400" y="320" font-family="Arial, sans-serif" font-size="56" font-weight="bold" 
              fill="${colors.primary}" text-anchor="middle">
          ${risk.riskLevel.toUpperCase()}
        </text>
        
        <!-- Score -->
        <text x="400" y="380" font-family="Arial, sans-serif" font-size="28" 
              fill="#666666" text-anchor="middle">
          Score: ${risk.riskScore}/100
        </text>
        
        <!-- Subtítulo -->
        <text x="400" y="470" font-family="Arial, sans-serif" font-size="18" 
              fill="#999999" text-anchor="middle">
          Análise de Voz para Detecção de Câncer de Laringe
        </text>
        
        <!-- Disclaimer -->
        <text x="400" y="510" font-family="Arial, sans-serif" font-size="16" font-style="italic"
              fill="#999999" text-anchor="middle">
          Este é um rastreamento inicial. Consulte um especialista.
        </text>
      </svg>
    `;

    // Converter SVG para PNG usando Sharp
    try {
      const pngBuffer = await sharp(Buffer.from(svg))
        .png()
        .toBuffer();
      
      return pngBuffer;
    } catch (error) {
      this.logger.error('Erro ao gerar imagem:', error);
      throw error;
    }
  }

  private getColorScheme(color: string): {
    primary: string;
    bgStart: string;
    bgEnd: string;
  } {
    switch (color) {
      case 'red':
        return {
          primary: '#DC2626',
          bgStart: '#FEE2E2',
          bgEnd: '#FECACA',
        };
      case 'orange':
      case 'yellow':
        return {
          primary: '#F59E0B',
          bgStart: '#FEF3C7',
          bgEnd: '#FDE68A',
        };
      case 'green':
      default:
        return {
          primary: '#10B981',
          bgStart: '#D1FAE5',
          bgEnd: '#A7F3D0',
        };
    }
  }

  private getRiskEmoji(color: string): string {
    switch (color) {
      case 'red':
        return '🔴';
      case 'orange':
      case 'yellow':
        return '🟡';
      case 'green':
      default:
        return '🟢';
    }
  }
}

