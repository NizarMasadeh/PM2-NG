import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import { join } from 'path';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly userDataFile: string;

  constructor(private readonly jwtService: JwtService) {
    const __dirname = process.cwd();
    this.userDataFile = join(__dirname, 'user.json');
  }

  getUserData() {
    try {
      if (fs.existsSync(this.userDataFile)) {
        const data = fs.readFileSync(this.userDataFile, 'utf8');
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error('Error reading user data:', error);
      return null;
    }
  }

  private saveUserData(userData: any): boolean {
    try {
      fs.writeFileSync(this.userDataFile, JSON.stringify(userData, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving user data:', error);
      return false;
    }
  }

  async register(registerDto: RegisterDto): Promise<boolean> {
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const userData = {
      username: registerDto.username,
      password: hashedPassword,
    };

    return this.saveUserData(userData);
  }

  async login(loginDto: LoginDto) {
    const userData = this.getUserData();

    if (!userData || userData.username !== loginDto.username) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      userData.password,
    );

    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    const payload = {
      username: loginDto.username,
      email: loginDto.username + '@example.com',
      name: loginDto.username,
      sub: Math.random().toString(36).substring(2),
      role: 'admin',
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      username: loginDto.username,
    };
  }
}
