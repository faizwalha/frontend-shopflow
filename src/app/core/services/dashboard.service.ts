import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AdminDashboardResponse, SellerDashboardResponse } from '../models/dashboard.models';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = '/api/dashboard';

  getAdminDashboard(): Observable<AdminDashboardResponse> {
    return this.http.get<AdminDashboardResponse>(`${this.apiUrl}/admin`);
  }

  getSellerDashboard(): Observable<SellerDashboardResponse> {
    return this.http.get<SellerDashboardResponse>(`${this.apiUrl}/seller`);
  }
}
