import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  Ip,
  UseGuards,
  Request,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Ip() ip: string) {
    const result = await this.authService.login(
      loginDto.email,
      loginDto.password,
      ip,
    );

    return {
      success: true,
      message: result.mfaRequired ? 'MFA verification required' : 'Login successful',
      data: result,
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req) {
    await this.authService.logout(req.user.id);
    
    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    const tokens = await this.authService.refreshToken(
      refreshTokenDto.refreshToken,
    );

    return {
      success: true,
      message: 'Token refreshed successfully',
      data: tokens,
    };
  }

  @Post('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async me(@Request() req) {
    return {
      success: true,
      data: {
        user: req.user,
      },
    };
  }

  @Get('me/permissions')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getMyPermissions(@Request() req) {
    const permissions = await this.authService.getUserPermissions(req.user.id);
    
    return {
      success: true,
      data: {
        permissions: permissions.map(p => p.permissionKey),
        details: permissions,
      },
    };
  }

  @Get('check-email')
  @HttpCode(HttpStatus.OK)
  async checkEmail(@Query('email') email: string, @Query('userId') userId?: string) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    const exists = await this.authService.checkEmailExists(email, userId ? parseInt(userId) : undefined);
    
    return {
      success: true,
      data: {
        exists,
        available: !exists,
      },
    };
  }
}
