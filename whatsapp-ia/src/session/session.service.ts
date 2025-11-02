import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

interface Session {
  id: string;
  whatsappId: string;
  createdAt: Date;
  expiresAt: Date;
}

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private readonly sessions = new Map<string, Session>();
  private readonly SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24h
  private readonly CACHE_FILE = join(process.cwd(), 'sessions.json');

  constructor() {
    this.loadSessions();
    
    setInterval(() => this.cleanupExpiredSessions(), 60 * 60 * 1000);
    
    setInterval(() => this.saveSessions(), 30 * 1000);
  }

  private loadSessions() {
    try {
      if (existsSync(this.CACHE_FILE)) {
        const data = readFileSync(this.CACHE_FILE, 'utf-8');
        const sessionsArray = JSON.parse(data);
        
        for (const session of sessionsArray) {
          session.createdAt = new Date(session.createdAt);
          session.expiresAt = new Date(session.expiresAt);
          
          if (new Date() < session.expiresAt) {
            this.sessions.set(session.id, session);
          }
        }
        
        this.logger.log(`✅ ${this.sessions.size} sessões carregadas do cache`);
      }
    } catch (error) {
      this.logger.warn('Erro ao carregar sessões do cache:', error.message);
    }
  }

  private saveSessions() {
    try {
      const sessionsArray = Array.from(this.sessions.values());
      writeFileSync(this.CACHE_FILE, JSON.stringify(sessionsArray, null, 2));
    } catch (error) {
      this.logger.error('Erro ao salvar sessões:', error.message);
    }
  }

  createSession(whatsappId: string): string {
    const sessionId = randomUUID();
    const now = new Date();

    const session: Session = {
      id: sessionId,
      whatsappId,
      createdAt: now,
      expiresAt: new Date(now.getTime() + this.SESSION_EXPIRY_MS),
    };

    this.sessions.set(sessionId, session);
    this.saveSessions(); 
    this.logger.log(`✅ Sessão criada: ${sessionId} para ${whatsappId}`);

    return sessionId;
  }

  getSession(sessionId: string): Session | null {
    const session = this.sessions.get(sessionId);
    
    if (!session) return null;
    
    if (new Date() > session.expiresAt) {
      this.sessions.delete(sessionId);
      return null;
    }

    return session;
  }

  getSessionByWhatsappId(whatsappId: string): Session | null {
    for (const session of this.sessions.values()) {
      if (session.whatsappId === whatsappId && new Date() < session.expiresAt) {
        return session;
      }
    }
    return null;
  }

  deleteSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  private cleanupExpiredSessions(): void {
    const now = new Date();
    let count = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(sessionId);
        count++;
      }
    }

    if (count > 0) {
      this.logger.log(`🧹 Limpeza: ${count} sessões expiradas removidas`);
    }
  }
}

