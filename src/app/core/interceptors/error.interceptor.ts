import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const isAuthEndpoint = req.url.includes('/api/auth/');
      
      if (err.status === 401 && !isAuthEndpoint) {
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
      } else if (err.status === 403 && !isAuthEndpoint) {
        console.warn('Forbidden, logging out...');
        authService.logout();
      }

      const errorMsg = err.error?.message || err.statusText;
      return throwError(() => new Error(errorMsg));
    })
  );
};
