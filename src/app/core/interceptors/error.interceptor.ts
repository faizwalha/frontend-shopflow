import { HttpInterceptorFn, HttpErrorResponse, HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap } from 'rxjs/operators';
import { throwError, of } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const http = inject(HttpClient);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const isExcludedEndpoint = req.url.includes('/api/auth/login') || 
                                req.url.includes('/api/auth/register') || 
                                req.url.includes('/api/auth/refresh');
      
      if (err.status === 401 && !isExcludedEndpoint) {
        const refreshToken = localStorage.getItem('shopflow_refresh_token');
        
        if (refreshToken) {
          return http.post<any>('/api/auth/refresh', { refreshToken }).pipe(
            switchMap((authRes) => {
              localStorage.setItem('shopflow_access_token', authRes.accessToken);
              if (authRes.refreshToken) {
                localStorage.setItem('shopflow_refresh_token', authRes.refreshToken);
              }
              
              const clonedReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${authRes.accessToken}`
                }
              });
              return next(clonedReq);
            }),
            catchError((refreshErr) => {
              console.warn('Session expired, logging out...');
              localStorage.removeItem('shopflow_access_token');
              localStorage.removeItem('shopflow_refresh_token');
              localStorage.removeItem('shopflow_role');
              localStorage.removeItem('shopflow_user_id');
              localStorage.removeItem('shopflow_user_profile');
              return throwError(() => refreshErr);
            })
          );
        } else {
          // No refresh token, clear session
          localStorage.removeItem('shopflow_access_token');
          localStorage.removeItem('shopflow_refresh_token');
          localStorage.removeItem('shopflow_role');
          localStorage.removeItem('shopflow_user_id');
          localStorage.removeItem('shopflow_user_profile');
          return throwError(() => err);
        }
      }

      const errorMsg = err.error?.message || err.statusText;
      return throwError(() => new Error(errorMsg));
    })
  );
};
