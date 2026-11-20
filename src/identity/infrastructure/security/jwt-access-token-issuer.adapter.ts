import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  AccessTokenClaims,
  AccessTokenIssuer,
} from '../../application/ports/access-token-issuer.port';

@Injectable()
export class JwtAccessTokenIssuer implements AccessTokenIssuer {
  constructor(private readonly jwt: JwtService) {}

  issue(claims: AccessTokenClaims): Promise<string> {
    return this.jwt.signAsync({ ...claims });
  }
}
