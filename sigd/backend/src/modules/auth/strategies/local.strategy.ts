import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

/**
 * LocalStrategy — Estrategia de Passport para login con email/password.
 * Usada solo en el endpoint POST /auth/login.
 * Llama a AuthService.validateUser() y pone el usuario en request.user.
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email' }); // Usar 'email' en vez de 'username'
  }

  async validate(email: string, password: string): Promise<any> {
    return this.authService.validateUser(email, password);
  }
}
