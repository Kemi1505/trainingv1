import { Role } from "../../common/enums/role.enum";
//import { Role } from '@prisma/client';
//Auth Types
export enum AuthMethod {
  EMAIL_AND_PASSWORD,
  GOOGLE
}

//Google User Request
export interface RequestWithUser extends Request{
  user: {
    email: string;
    firstName: string;
    lastName: string;
    username: string;
  }
}

export interface RequestWithJWT extends Request{
  user: JwtPayLoad
}

//JWT Payload
export interface JwtPayLoad{
  sub: string,
  email: string,
  role: Role,
  iat: number,
  exp: number,
}