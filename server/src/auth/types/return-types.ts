export interface RegisterUser{
    message: string,
    id: string,
    email: string,
    createdAt: Date,
    updatedAt: Date
}

export interface LoginUser {
    message: string,
    email: string,
    accessToken: string,
    refreshToken: string
}