import { Injectable, Logger } from '@nestjs/common';
import { createCanvas, registerFont } from 'canvas';
import { VoiceAnalysisResult } from '../langgraph/types/agent.types';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ImageGeneratorService {
  private readonly logger = new Logger(ImageGeneratorService.name);

  async generateResultImage(result: VoiceAnalysisResult): Promise<Buffer> {
    const risk = result.riskAssessment;
    
    const colors = this.getColorScheme(risk.color);
    
    const width = 800;
    const height = 600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, colors.bgStart);
    gradient.addColorStop(1, colors.bgEnd);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const cardPadding = 40;
    const cardX = cardPadding;
    const cardY = cardPadding;
    const cardWidth = width - cardPadding * 2;
    const cardHeight = height - cardPadding * 2;
    
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 10;
    
    ctx.fillStyle = '#FFFFFF';
    this.roundRect(ctx, cardX, cardY, cardWidth, cardHeight, 20);
    ctx.fill();
    
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    ctx.fillStyle = colors.primary;
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Resultado da Análise', width / 2, 140);

    ctx.font = 'bold 64px sans-serif';
    ctx.fillStyle = colors.primary;
    ctx.fillText(risk.riskLevel.toUpperCase(), width / 2, 320);

    ctx.fillStyle = '#999999';
    ctx.font = '20px sans-serif';
    ctx.fillText('Análise de Voz para Detecção de Câncer de Laringe', width / 2, 470);
    
    ctx.font = 'italic 18px sans-serif';
    ctx.fillText('Este é um rastreamento inicial. Consulte um especialista.', width / 2, 510);

    return canvas.toBuffer('image/png');
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

  private roundRect(
    ctx: any,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}

