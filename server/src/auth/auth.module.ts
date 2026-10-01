import { Global, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtGuard } from './guards/jwt.guard';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [JwtModule.registerAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => ({
      secret: configService.get<string>('JWT_SECRET_KEY'),
      signOptions: { 
        expiresIn: '3h',
      },
    }),
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtGuard, ConfigService,],
  exports: [JwtGuard, AuthService]
})
export class AuthModule {}
