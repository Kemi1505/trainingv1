import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtGuard } from './guards/jwt.guard';
import { JwtPayLoad, type RequestWithJWT} from './types/auth-types';
import { type Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService

  ) {}
  @Post('register')
  async create(@Body() registerUser: RegisterUserDto) {
    return this.authService.register(registerUser);
  }

  @Post('login')
  async login(
    @Body() loginUser: LoginUserDto, 
    @Res({ passthrough: true }) res: Response
  ) {
    return this.authService.login(loginUser, res)
  }

  @Post('logout')
  async logout(
    @Res({ passthrough: true }) res: Response,
    @Body('refreshToken') refreshToken: string
  ) {
    return this.authService.logout(res, refreshToken)
  }

  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string){
    return await this.authService.refresh(refreshToken)
  }

  @Get('protected')
  @UseGuards(JwtGuard)
  protected(@Req() req: RequestWithJWT){
    const user = req.user as JwtPayLoad
    return{
      message: "You have entered protected route",
      info: {
        id: user.sub,
        email: user.email,
        role: user.role
    }}
  }
}
