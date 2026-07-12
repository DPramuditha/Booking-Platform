import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '../users/user.entity';

@Injectable()
export class IsAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // Check if the user is authenticated and holds the admin role
    if (!user || user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Access denied. Administrator privileges required.');
    }
    
    return true;
  }
}
