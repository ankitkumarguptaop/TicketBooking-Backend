import { UserRole } from '../../domain/user-role.enum';

export interface AccessTokenClaims {
  sub: string;
  email: string;
  role: UserRole;
}

export interface AccessTokenIssuer {
  issue(claims: AccessTokenClaims): Promise<string>;
}

export const ACCESS_TOKEN_ISSUER = Symbol('ACCESS_TOKEN_ISSUER');
