import {
  DynamicModule,
  Global,
  InjectionToken,
  Module,
  ModuleMetadata,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ACTIVE_SESSION_CHECKER } from './active-session-checker.port';
import { jwtModuleOptions } from './jwt-options';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';

/**
 * Global, so any feature module can use @UseGuards(JwtAuthGuard, RolesGuard)
 * without importing anything. The session check is plugged in from outside
 * (identity) at the composition root, keeping shared/ free of any context.
 */
@Global()
@Module({})
export class AuthModule {
  static forRoot(options: {
    imports: ModuleMetadata['imports'];
    sessionChecker: InjectionToken;
  }): DynamicModule {
    return {
      module: AuthModule,
      imports: [
        JwtModule.registerAsync({
          inject: [ConfigService],
          useFactory: jwtModuleOptions,
        }),
        ...(options.imports ?? []),
      ],
      providers: [
        {
          provide: ACTIVE_SESSION_CHECKER,
          useExisting: options.sessionChecker,
        },
        JwtAuthGuard,
        RolesGuard,
      ],
      exports: [JwtModule, ACTIVE_SESSION_CHECKER, JwtAuthGuard, RolesGuard],
    };
  }
}
