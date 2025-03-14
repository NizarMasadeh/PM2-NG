import {
  Controller,
  Post,
  Get,
  Body,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    if (!registerDto.username || !registerDto.password) {
      throw new HttpException(
        'Username and password are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const existingUser = this.authService.getUserData();
    if (existingUser) {
      throw new HttpException(
        'A user is already registered',
        HttpStatus.BAD_REQUEST,
      );
    }

    const success = await this.authService.register(registerDto);
    if (!success) {
      throw new HttpException(
        'Error saving user data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return { success: true };
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    if (!loginDto.username || !loginDto.password) {
      throw new HttpException(
        'Username and password are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const result = await this.authService.login(loginDto);
      return result;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
    }
  }

  @Get('check-user')
  checkUser() {
    const userData = this.authService.getUserData();
    return { exists: !!userData };
  }
}
