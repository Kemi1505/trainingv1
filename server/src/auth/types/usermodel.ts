import { Role } from '@prisma/client';

export interface UserModel{
    id: string,  
    email: string,
    role: Role,  
    password: string | null,
    createdAt: Date,
    updatedAt: Date
}