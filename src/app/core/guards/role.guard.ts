import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const expectedRoles = route.data['expectedRoles'] as Array<'ADMIN' | 'SELLER' | 'CUSTOMER'>;
  const currentRole = authService.getRole();

  if (currentRole && expectedRoles?.includes(currentRole)) {
    return true;
  }

  return router.parseUrl('/');
};
