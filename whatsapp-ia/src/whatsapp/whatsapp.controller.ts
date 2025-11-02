import { Controller, Post, Body, HttpCode, Logger, Get, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { WhatsappService } from './whatsapp.service';
import { VoiceAnalysisResult } from '../langgraph/types/agent.types';

@Controller('api')
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name);

  constructor(private readonly whatsappService: WhatsappService) {}

  @Get('qrcode')
  async getQrCode(@Res() res: Response) {
    const qrCodeDataUrl = this.whatsappService.getQrCodeDataUrl();
    
    if (!qrCodeDataUrl) {
      if (this.whatsappService.isConnected()) {
        return res.status(HttpStatus.OK).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>WhatsApp - Conectado</title>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  margin: 0;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                }
                .container {
                  background: white;
                  border-radius: 20px;
                  padding: 60px 40px;
                  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                  text-align: center;
                  max-width: 500px;
                }
                h1 {
                  color: #25D366;
                  font-size: 32px;
                  margin-bottom: 20px;
                }
                p {
                  color: #666;
                  font-size: 18px;
                  line-height: 1.6;
                }
                .emoji {
                  font-size: 80px;
                  margin-bottom: 20px;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="emoji">✅</div>
                <h1>WhatsApp Conectado!</h1>
                <p>Seu bot do WhatsApp está online e funcionando corretamente.</p>
              </div>
            </body>
          </html>
        `);
      }
      
      return res.status(HttpStatus.NOT_FOUND).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="refresh" content="5">
            <title>Aguardando QR Code</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              }
              .container {
                background: white;
                border-radius: 20px;
                padding: 60px 40px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                text-align: center;
                max-width: 500px;
              }
              h1 {
                color: #333;
                font-size: 28px;
                margin-bottom: 20px;
              }
              p {
                color: #666;
                font-size: 16px;
                line-height: 1.6;
                margin-bottom: 30px;
              }
              .spinner {
                border: 4px solid #f3f3f3;
                border-top: 4px solid #667eea;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                animation: spin 1s linear infinite;
                margin: 0 auto;
              }
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="spinner"></div>
              <h1>Aguardando QR Code...</h1>
              <p>O WhatsApp Bot está iniciando. Esta página será atualizada automaticamente a cada 5 segundos.</p>
              <p><small>Se o QR Code não aparecer em 30 segundos, verifique os logs do servidor.</small></p>
            </div>
          </body>
        </html>
      `);
    }

    // Retorna página HTML com QR Code
    return res.status(HttpStatus.OK).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>WhatsApp QR Code</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              background: white;
              border-radius: 20px;
              padding: 40px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              text-align: center;
              max-width: 600px;
            }
            h1 {
              color: #333;
              font-size: 28px;
              margin-bottom: 10px;
            }
            .subtitle {
              color: #666;
              font-size: 16px;
              margin-bottom: 30px;
            }
            .qr-container {
              background: white;
              padding: 20px;
              border-radius: 15px;
              display: inline-block;
              box-shadow: 0 4px 15px rgba(0,0,0,0.1);
              margin-bottom: 30px;
            }
            img {
              display: block;
              max-width: 100%;
              height: auto;
              border-radius: 10px;
            }
            .instructions {
              text-align: left;
              background: #f8f9fa;
              padding: 20px;
              border-radius: 10px;
              margin-top: 20px;
            }
            .instructions h3 {
              color: #333;
              margin-top: 0;
              font-size: 18px;
            }
            .instructions ol {
              margin: 15px 0;
              padding-left: 25px;
            }
            .instructions li {
              color: #666;
              margin-bottom: 10px;
              line-height: 1.5;
            }
            .warning {
              background: #fff3cd;
              border: 1px solid #ffc107;
              color: #856404;
              padding: 15px;
              border-radius: 8px;
              margin-top: 20px;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>📱 Conectar WhatsApp</h1>
            <p class="subtitle">Escaneie o QR Code abaixo com seu WhatsApp</p>
            
            <div class="qr-container">
              <img src="${qrCodeDataUrl}" alt="QR Code do WhatsApp" />
            </div>

            <div class="instructions">
              <h3>Como conectar:</h3>
              <ol>
                <li>Abra o <strong>WhatsApp</strong> no seu celular</li>
                <li>Toque em <strong>Mais opções</strong> (⋮) ou <strong>Configurações</strong></li>
                <li>Toque em <strong>Aparelhos conectados</strong></li>
                <li>Toque em <strong>Conectar um aparelho</strong></li>
                <li>Aponte o celular para esta tela e escaneie o QR Code</li>
              </ol>
            </div>

            <div class="warning">
              ⚠️ <strong>Importante:</strong> Este QR Code expira em alguns segundos. Se expirar, recarregue esta página.
            </div>
          </div>
        </body>
      </html>
    `);
  }

  @Get('status')
  async getStatus() {
    return {
      connected: this.whatsappService.isConnected(),
      hasQrCode: this.whatsappService.hasQrCode(),
      message: this.whatsappService.isConnected() 
        ? 'WhatsApp está conectado' 
        : this.whatsappService.hasQrCode()
        ? 'Aguardando escaneamento do QR Code'
        : 'Iniciando conexão...'
    };
  }

  @Post('webhook/result')
  @HttpCode(200)
  async receiveResult(
    @Body()
    payload: {
      sessionId: string;
      result: VoiceAnalysisResult;
    },
  ) {
    this.logger.log(`📥 Webhook recebido: ${payload.sessionId}`);

    try {
      await this.whatsappService.handleResultWebhook(
        payload.sessionId,
        payload.result,
      );

      return {
        success: true,
        message: 'Resultado processado e enviado para o usuário',
      };
    } catch (error) {
      this.logger.error('Erro no webhook:', error);
      return {
        success: false,
        message: 'Erro ao processar resultado',
      };
    }
  }
}

