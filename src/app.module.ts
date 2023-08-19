import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmConfigService } from './config/typeorm.config.service';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtConfigService } from './config/jwt.config.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChallengeModule } from './challenges/challenges.module';
import { PostModule } from './posts/posts.module';
import { RecodesModule } from './recodes/recodes.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useClass: TypeOrmConfigService,
      inject: [ConfigService],
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useClass: JwtConfigService,
      inject: [ConfigService],
    }),
    AuthModule,
    UserModule,
    ChallengeModule,
    PostModule,
    RecodesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
