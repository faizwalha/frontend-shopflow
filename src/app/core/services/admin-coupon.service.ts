import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CouponRequest, CouponResponse } from '../models/coupon.models';

@Injectable({ providedIn: 'root' })
export class AdminCouponService {
  private http = inject(HttpClient);
  private apiUrl = '/api/admin/coupons';

  listCoupons(): Observable<CouponResponse[]> {
    return this.http.get<CouponResponse[]>(this.apiUrl);
  }

  getCoupon(id: number): Observable<CouponResponse> {
    return this.http.get<CouponResponse>(`${this.apiUrl}/${id}`);
  }

  createCoupon(request: CouponRequest) {
    return this.http.post<CouponResponse>(this.apiUrl, request);
  }

  updateCoupon(id: number, request: CouponRequest) {
    return this.http.put<CouponResponse>(`${this.apiUrl}/${id}`, request);
  }

  deleteCoupon(id: number) {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
