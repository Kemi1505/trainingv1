import { IsEnum } from 'class-validator';
import { Role } from '../../common/enums/role.enum';

export class AssignRoleDto {
  @IsEnum(Role)
  role!: Role;
}
