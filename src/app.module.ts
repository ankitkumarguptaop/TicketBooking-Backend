import { Module } from '@nestjs/common';
import { IdentityModule } from './identity/identity.module';
import { IdentityInfraModule } from './identity/infra/identity-infra.module';
import { RepositoryActiveSessionChecker } from './identity/infra/security/repository-active-session-checker.adapter';
import { AuthModule } from './shared/infra/auth/auth.module';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    SharedModule,
    // JwtAuthGuard for every context; identity answers "is this session live?"
    AuthModule.forRoot({
      imports: [IdentityInfraModule],
      sessionChecker: RepositoryActiveSessionChecker,
    }),
    IdentityModule,
  ],
})
export class AppModule {}
