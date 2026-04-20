import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((err) => {
      // 401 Unauthorized or 403 Forbidden
      const isAuthEndpoint = req.url.includes('/api/auth/login') || req.url.includes('/api/auth/register') || req.url.includes('/api/auth/refresh');
      if ([401, 403].includes(err.status) && !isAuthEndpoint) {
        console.warn('Unauthorized request, logging out...');
        authService.logout();
      }
      const errorMsg = err.error?.message || err.statusText;
      return throwError(() => new Error(errorMsg));
    })
  );
};
