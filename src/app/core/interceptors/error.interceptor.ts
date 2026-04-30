import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const isExcludedEndpoint = req.url.includes('/api/auth/login') || 
                                req.url.includes('/api/auth/register') || 
                                req.url.includes('/api/auth/refresh');
      
      if (err.status === 401 && !isExcludedEndpoint) {
        return authService.refreshToken().pipe(
          switchMap((authRes) => {
            const clonedReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${authRes.accessToken}`
              }
            });
            return next(clonedReq);
          }),
          catchError((refreshErr) => {
            console.warn('Session expired, logging out...');
            authService.logout();
            return throwError(() => refreshErr);
          })
        );
      }

      const errorMsg = err.error?.message || err.statusText;
      return throwError(() => new Error(errorMsg));
    })
  );
};
