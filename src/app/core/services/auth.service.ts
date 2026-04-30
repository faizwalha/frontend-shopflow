import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { AuthResponse, AuthSession, LoginRequest, RegisterRequest, User, SellerProfileResponse } from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = '/api/auth';
  private accessTokenKey = 'shopflow_access_token';
  private refreshTokenKey = 'shopflow_refresh_token';
  private roleKey = 'shopflow_role';
  private userIdKey = 'shopflow_user_id';

  private currentUserSubject = new BehaviorSubject<AuthSession | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private userProfileSubject = new BehaviorSubject<User | null>(null);
  public userProfile$ = this.userProfileSubject.asObservable();
  
  constructor() {
    this.restoreSession();
  }

  private restoreSession() {
    const accessToken = localStorage.getItem(this.accessTokenKey);
    const role = localStorage.getItem(this.roleKey) as AuthSession['role'] | null;
    if (!accessToken || !role) {
      return;
    }

    const refreshToken = localStorage.getItem(this.refreshTokenKey) || undefined;
    const userIdValue = localStorage.getItem(this.userIdKey);
    const userId = userIdValue ? Number(userIdValue) : undefined;

    this.currentUserSubject.next({
      accessToken,
      refreshToken,
      role,
      userId: Number.isFinite(userId as number) ? userId : undefined
    });

    this.refreshProfile().subscribe();
  }

  private persistSession(response: AuthResponse): void {
    if (!response.accessToken || !response.role) {
      return;
    }

    localStorage.setItem(this.accessTokenKey, response.accessToken);
    localStorage.setItem(this.roleKey, response.role);

    if (response.refreshToken) {
      localStorage.setItem(this.refreshTokenKey, response.refreshToken);
    }

    if (response.userId != null) {
      localStorage.setItem(this.userIdKey, String(response.userId));
    }

    this.currentUserSubject.next({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      role: response.role,
      userId: response.userId,
      message: response.message
    });
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        this.persistSession(response);
        this.refreshProfile().subscribe();
      })
    );
  }

  register(user: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, user).pipe(
      tap(response => {
        this.persistSession(response);
        this.refreshProfile().subscribe();
      })
    );
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem(this.refreshTokenKey);
    if (!refreshToken) {
      throw new Error('No refresh token available.');
    }

    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, null, {
      headers: {
        Authorization: `Bearer ${refreshToken}`
      }
    }).pipe(
      tap(response => this.persistSession(response))
    );
  }

  logout() {
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.roleKey);
    localStorage.removeItem(this.userIdKey);
    this.currentUserSubject.next(null);
    this.userProfileSubject.next(null);
    this.router.navigate(['/']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.accessTokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  getRole(): AuthSession['role'] | null {
    return this.currentUserSubject.value?.role ?? (localStorage.getItem(this.roleKey) as AuthSession['role'] | null);
  }

  getUserId(): number | null {
    const value = this.currentUserSubject.value?.userId ?? localStorage.getItem(this.userIdKey);
    return value == null ? null : Number(value);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): AuthSession | null {
    return this.currentUserSubject.value;
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/profile`);
  }

  updateProfile(user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/profile`, user).pipe(
      tap(updatedUser => this.userProfileSubject.next(updatedUser))
    );
  }

  createSellerProfile(profile: FormData): Observable<SellerProfileResponse> {
    return this.http.post<SellerProfileResponse>(`/api/seller-profiles`, profile).pipe(
      tap(response => {
        const currentUser = this.userProfileSubject.value;
        if (currentUser) {
          this.userProfileSubject.next({
            ...currentUser,
            shopName: response.shopName,
            description: response.description,
            logo: response.logo
          });
        }
      })
    );
  }

  refreshProfile(): Observable<User> {
    return this.getProfile().pipe(
      tap(user => this.userProfileSubject.next(user))
    );
  }

  forgotPassword(email: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/reset-password`, { token, newPassword });
  }

  verifyEmail(token: string): Observable<AuthResponse> {
    return this.http.get<AuthResponse>(`${this.apiUrl}/verify-email`, { params: { token } });
  }
}
