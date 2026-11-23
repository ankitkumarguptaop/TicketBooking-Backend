import { UserRole } from '../../domain/user-role.enum';

export interface AccessTokenClaims {
  sub: string;
  email: string;
  role: UserRole;
  /** Session id: ties the access token to one device login. */
  sid: string;
}

export interface IssuedAccessToken {
  token: string;
  expiresAt: Date;
}

export interface AccessTokenIssuer {
  issue(claims: AccessTokenClaims): Promise<IssuedAccessToken>;
}

export const ACCESS_TOKEN_ISSUER = Symbol('ACCESS_TOKEN_ISSUER');
