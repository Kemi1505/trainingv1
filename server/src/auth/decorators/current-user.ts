import { createParamDecorator, ExecutionContext } from "@nestjs/common"
import { JwtPayLoad } from "../types/auth-types"

export const CurrentUser = createParamDecorator(
  (data, context: ExecutionContext) => {
    // get request from context
    const request = context.switchToHttp().getRequest()
    // return req.user
    const user = request.user as JwtPayLoad
    return user.sub
  }
)