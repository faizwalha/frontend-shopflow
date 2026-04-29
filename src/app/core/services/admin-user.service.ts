import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AdminUser } from '../models/user.models';

@Injectable({
  providedIn: 'root'
})
export class AdminUserService {
  private http = inject(HttpClient);
  private base = '/api/admin/users';

  listUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(this.base);
  }

  getUser(id: number): Observable<AdminUser> {
    return this.http.get<AdminUser>(`${this.base}/${id}`);
  }

  updateUser(id: number, payload: any): Observable<AdminUser> {
    return this.http.put<AdminUser>(`${this.base}/${id}`, payload);
  }

  setActive(id: number, active: boolean): Observable<AdminUser> {
    return this.http.put<AdminUser>(`${this.base}/${id}/active`, { active });
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
