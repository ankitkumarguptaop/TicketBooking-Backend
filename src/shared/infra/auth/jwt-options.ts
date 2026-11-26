import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';

const JWT_ALGORITHM = 'HS256';

/**
 * One definition of how access tokens are signed and verified. Used by
 * AuthModule (verifies, in JwtAuthGuard) and by identity (issues), so the
 * two can never disagree on secret, algorithm, issuer or audience.
 */
export function jwtModuleOptions(config: ConfigService): JwtModuleOptions {
  const secret = config.getOrThrow<string>('JWT_ACCESS_SECRET');
  if (secret.length < 32) {
    throw new Error('JWT_ACCESS_SECRET must be at least 32 characters');
  }
  const issuer = config.get<string>('JWT_ISSUER', 'ticket-booking-api');
  const audience = config.get<string>('JWT_AUDIENCE', 'ticket-booking');
  return {
    secret,
    signOptions: {
      algorithm: JWT_ALGORITHM,
      // Env values are strings; a bare string like "900" would be read
      // as 900 MILLISECONDS by jsonwebtoken, so convert explicitly.
      expiresIn: Number(config.get('JWT_ACCESS_TTL_SECONDS', 900)),
      issuer,
      audience,
    },
    verifyOptions: {
      algorithms: [JWT_ALGORITHM], // never trust the token's own "alg"
      issuer,
      audience,
    },
  };
}
