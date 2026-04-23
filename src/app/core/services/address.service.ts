import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { Address, AddressRequest, AddressResponse } from '../models/address.models';

@Injectable({
  providedIn: 'root'
})
export class AddressService {
  private http = inject(HttpClient);
  private apiUrl = '/api/addresses';

  private addressesSubject = new BehaviorSubject<Address[]>([]);
  public addresses$ = this.addressesSubject.asObservable();

  constructor() {
    this.loadAddresses();
  }

  private loadAddresses(): void {
    this.getAddresses().subscribe({
      next: (addresses) => this.addressesSubject.next(addresses),
      error: () => this.addressesSubject.next([])
    });
  }

  getAddresses(): Observable<Address[]> {
    return this.http.get<Address[]>(this.apiUrl).pipe(
      tap(addresses => this.addressesSubject.next(addresses))
    );
  }

  addAddress(request: AddressRequest): Observable<AddressResponse> {
    return this.http.post<AddressResponse>(this.apiUrl, request).pipe(
      tap(() => this.loadAddresses())
    );
  }

  updateAddress(id: number, request: AddressRequest): Observable<AddressResponse> {
    return this.http.put<AddressResponse>(`${this.apiUrl}/${id}`, request).pipe(
      tap(() => this.loadAddresses())
    );
  }

  deleteAddress(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.loadAddresses())
    );
  }

  setDefaultAddress(id: number): Observable<AddressResponse> {
    return this.http.put<AddressResponse>(`${this.apiUrl}/${id}/default`, {}).pipe(
      tap(() => this.loadAddresses())
    );
  }
}
