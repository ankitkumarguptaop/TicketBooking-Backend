import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import {
  AccessTokenClaims,
  AccessTokenIssuer,
  IssuedAccessToken,
} from '../../domain/ports/access-token-issuer.port';

@Injectable()
export class JwtAccessTokenIssuer implements AccessTokenIssuer {
  constructor(private readonly jwt: JwtService) {}

  async issue(claims: AccessTokenClaims): Promise<IssuedAccessToken> {
    // alg, iss, aud and exp come from JwtModule config; jti makes every token unique.
    const token = await this.jwt.signAsync(
      { ...claims },
      { jwtid: randomUUID() },
    );
    const { exp } = this.jwt.decode<{ exp: number }>(token);
    return { token, expiresAt: new Date(exp * 1000) };
  }
}
