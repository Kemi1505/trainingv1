import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterUserDto } from './dto/register-user';
import * as bcrypt from 'bcrypt';
import { LoginUserDto } from './dto/login-user.dto';
import { Response } from 'express';
import { cookiesOptions } from './types/cookies-options';
import { JwtPayLoad} from './types/auth-types';
import { LoginUser, RegisterUser } from './types/return-types';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '../common/enums/role.enum';
import { UserModel } from './types/usermodel';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService
    ){}

    async register(registerUser: RegisterUserDto): Promise<RegisterUser>{
        const { password, email, confirm_password} = registerUser;
        const existingEmail = await this.prisma.user.findUnique({where: {email}})
        if (existingEmail){
            throw new BadRequestException('User with this email exists')// check proper error
        }
        if (password !== confirm_password){
            throw new BadRequestException('Password must match')
        }
        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await this.prisma.user.create({
            data: {
                email,
                password: hashedPassword
            },
            
        })
        return({
            message: "Signed Up Successfully",
            id: user.id,
            email: user.email,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        })
    }

    async login(loginUser: LoginUserDto, res: Response): Promise<LoginUser>{
        const {email, password} = loginUser;
        //check if email in database
        const user = await this.prisma.user.findUnique({where: {email}})
        if(!user){
            throw new BadRequestException('Invalid Email or Password')
        }
        if(!user.password){
          throw new BadRequestException('Please Login with Google')
        }
        //comapare password hash
        const checkPassword: boolean = await bcrypt.compare(password, user.password)
        if(!checkPassword){
            throw new BadRequestException('Invalid Email or Password')
        }
        //generate tokens
        const {accessToken, refreshToken} = await this.generateTokens(user)

        await this.prisma.refreshToken.create({
            data: {
                userId: user.id as string,
                hashedToken: refreshToken,
            }
        })

        //setcookies
        res.cookie('Authentication-AcesssToken', accessToken, { 
            ...cookiesOptions, 
            maxAge: 1000 * 60 * 60 * 3 // 3 hours in milliseconds
        });
        res.cookie('Authentication-RefreshToken', refreshToken, { 
            ...cookiesOptions, 
            maxAge: 1000 * 60 * 60 * 24 * 3 // 3 days in milliseconds
        });
        return({
            message: 'Log in Successful',
            email: user.email,
            accessToken,
            refreshToken
        })
    }

    async generateTokens(user: Partial<UserModel>){
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role
        }
        const accessToken: string = await this.jwtService.signAsync(payload)
        const refreshToken: string = await this.jwtService.signAsync(payload, {expiresIn: '3d'})

        return{
            accessToken,
            refreshToken
        }
    }

    async verifyToken(refreshToken: string): Promise<JwtPayLoad>{
        try{
            const payload: JwtPayLoad = await this.jwtService.verifyAsync(refreshToken, {
                secret: this.configService.get<string>('JWT_SECRET_KEY'),
            })
            return payload 
        }
        catch(error: any){
            throw new UnauthorizedException ('Invalid Token')
        }
    }


    async refresh(firstRefreshToken: string){
        const payload = await this.verifyToken(firstRefreshToken)
        const user = await this.prisma.user.findUnique({where: {id: payload.sub}})
        if(!user){
            throw new BadRequestException ('User not Found')
        }
        //verify user has the refresh token in db
        const tokenInDatabase = await this.prisma.refreshToken.findFirst(
            {where: {
                userId: user.id,
                hashedToken: firstRefreshToken
            }}
        )
        if(!tokenInDatabase){
            throw new BadRequestException('Invalid Token')
        }
        //generate access and refresh tokens
        const {accessToken, refreshToken} = await this.generateTokens(user)
        //update refresh db
        console.log('After gen tokens')
        await this.prisma.refreshToken.update({
            where: { id: tokenInDatabase.id },
            data: {hashedToken: refreshToken,},
        });
        console.log('After saving to db')
        console.log(`access ${accessToken}, refresh ${refreshToken}`)        
        //return both tokens
        return{
            message: 'Log in Successful',
            accessToken,
            refreshToken
        }
        
    }

    async logout(res: Response, refreshToken: string){
        //clear cookie
        res.clearCookie('Authentication-AcesssToken',cookiesOptions);
        res.clearCookie('Authentication-RefreshToken', cookiesOptions);
        //delete refresh token in db
        await this.prisma.refreshToken.delete({
            where: {hashedToken: refreshToken}
        })
        //return log out message
        return{
            message: "Logged out successfully"
        }
    }
}
