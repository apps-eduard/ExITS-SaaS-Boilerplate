import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'ExITS-SaaS NestJS API is running! 🚀';
  }
}
