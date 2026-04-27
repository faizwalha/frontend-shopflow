import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, switchMap, tap } from 'rxjs';
import { Cart, CartItem, AddToCartRequest, UpdateCartItemRequest, ApplyCouponRequest } from '../models/cart.models';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private http = inject(HttpClient);
  private apiUrl = '/api/cart';

  private cartSubject = new BehaviorSubject<Cart | null>(null);
  public cart$ = this.cartSubject.asObservable();

  constructor() {
    this.loadCart();
  }

  private loadCart(): void {
    this.getCart().subscribe({
      next: (cart) => this.cartSubject.next(cart),
      error: () => this.cartSubject.next(null)
    });
  }

  getCart(): Observable<Cart> {
    return this.http.get<Cart>(this.apiUrl).pipe(
      tap(cart => this.cartSubject.next(cart))
    );
  }

  addItem(request: AddToCartRequest): Observable<Cart> {
    return this.http.post<Cart>(`${this.apiUrl}/items`, request).pipe(
      tap(cart => this.cartSubject.next(cart))
    );
  }

  updateItemQuantity(itemId: number, quantity: number): Observable<Cart> {
    const params = new HttpParams().set('quantity', quantity.toString());
    return this.http.put(`${this.apiUrl}/items/${itemId}`, null, { params, responseType: 'text' }).pipe(
      switchMap(() => this.getCart())
    );
  }

  removeItem(itemId: number): Observable<Cart> {
    return this.http.delete(`${this.apiUrl}/items/${itemId}`, { responseType: 'text' }).pipe(
      switchMap(() => this.getCart())
    );
  }

  applyCoupon(code: string): Observable<Cart> {
    const params = new HttpParams().set('code', code);
    return this.http.post<Cart>(`${this.apiUrl}/coupon`, {}, { params }).pipe(
      tap(cart => this.cartSubject.next(cart))
    );
  }

  removeCoupon(): Observable<Cart> {
    return this.http.delete<Cart>(`${this.apiUrl}/coupon`).pipe(
      tap(cart => this.cartSubject.next(cart))
    );
  }

  clearCart(): void {
    this.cartSubject.next(null);
  }
}
