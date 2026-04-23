import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { Cart, CartItem } from '../../core/models/cart.models';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent implements OnInit, OnDestroy {
  private cartService = inject(CartService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  cart: Cart | null = null;
  couponCode = '';
  isLoadingCart = true;
  isApplyingCoupon = false;
  isRemovingCoupon = false;
  errorMessage = '';
  successMessage = '';

  ngOnInit() {
    this.loadCart();
    this.cartService.cart$
      .pipe(takeUntil(this.destroy$))
      .subscribe(cart => {
        this.cart = cart;
        this.isLoadingCart = false;
      });
  }

  private loadCart() {
    this.cartService.getCart().subscribe({
      next: (cart) => {
        this.cart = cart;
        this.isLoadingCart = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load cart';
        this.isLoadingCart = false;
      }
    });
  }

  onQuantityChange(itemId: number, event: Event) {
    const value = (event.target as HTMLInputElement)?.valueAsNumber;
    const quantity = Number.isFinite(value) ? value : 1;
    this.updateQuantity(itemId, quantity);
  }

  updateQuantity(itemId: number, quantity: number) {
    if (quantity <= 0) {
      this.removeItem(itemId);
      return;
    }

    this.cartService.updateItemQuantity(itemId, quantity).subscribe({
      next: () => {
        this.successMessage = 'Quantity updated';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to update quantity';
      }
    });
  }

  removeItem(itemId: number) {
    this.cartService.removeItem(itemId).subscribe({
      next: () => {
        this.successMessage = 'Item removed from cart';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to remove item';
      }
    });
  }

  applyCoupon() {
    if (!this.couponCode.trim()) {
      this.errorMessage = 'Please enter a coupon code';
      return;
    }

    this.isApplyingCoupon = true;
    this.errorMessage = '';

    this.cartService.applyCoupon(this.couponCode).subscribe({
      next: (cart) => {
        this.isApplyingCoupon = false;
        this.successMessage = `Coupon applied! Discount: $${cart.discount || 0}`;
        this.couponCode = '';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.isApplyingCoupon = false;
        this.errorMessage = err?.error?.message || 'Failed to apply coupon';
      }
    });
  }

  removeCoupon() {
    this.isRemovingCoupon = true;
    this.errorMessage = '';

    this.cartService.removeCoupon().subscribe({
      next: () => {
        this.isRemovingCoupon = false;
        this.successMessage = 'Coupon removed';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.isRemovingCoupon = false;
        this.errorMessage = err?.error?.message || 'Failed to remove coupon';
      }
    });
  }

  checkout() {
    if (!this.cart || this.cart.items.length === 0) {
      this.errorMessage = 'Your cart is empty';
      return;
    }
    this.router.navigate(['/checkout']);
  }

  continueShopping() {
    this.router.navigate(['/products']);
  }

  getProductImage(item: CartItem): string {
    return item.product?.images?.[0] || 'https://via.placeholder.com/100';
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
