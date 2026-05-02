import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { ProductService } from '../../core/services/product.service';
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
  private productService = inject(ProductService);
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
        this.cart = this.ensureShippingFee(cart);
        this.isLoadingCart = false;
      });
  }

  private loadCart() {
    this.cartService.getCart().subscribe({
      next: (cart) => {
        this.cart = this.ensureShippingFee(cart);
        this.isLoadingCart = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load cart';
        this.isLoadingCart = false;
      }
    });
  }

  // Ensure cart contains a shipping fee (default £10) when backend doesn't provide one
  private ensureShippingFee(cart: Cart | null): Cart | null {
    if (!cart) return cart;
    // If shippingFee is null/undefined or equals 0, set default to 10
    if (cart.shippingFee == null || cart.shippingFee === 0) {
      return { ...cart, shippingFee: 10, total: (cart.total ?? 0) + 10 };
    }
    return cart;
  }

  onQuantityChange(item: CartItem, event: Event) {
    const value = (event.target as HTMLInputElement)?.valueAsNumber;
    const quantity = Number.isFinite(value) ? Math.max(1, Math.trunc(value)) : 1;
    const idCandidates = this.getCartItemIdCandidates(item);

    if (idCandidates.length === 0) {
      this.errorMessage = 'Invalid cart item identifier';
      return;
    }

    // Fetch product stock to validate quantity
    const productId = item.productId;
    if (!productId) {
      this.errorMessage = 'Invalid product identifier';
      return;
    }

    this.productService.getProductById(productId).subscribe({
      next: (response) => {
        const availableStock = response.stock || 0;
        if (quantity > availableStock) {
          this.errorMessage = `Stock insuffisant. Stock disponible: ${availableStock}`;
          return;
        }
        this.updateQuantity(item, quantity, idCandidates);
      },
      error: () => {
        // If we can't fetch stock info, allow the update (backend will validate)
        this.updateQuantity(item, quantity, idCandidates);
      }
    });
  }

  updateQuantity(item: CartItem, quantity: number, idCandidates = this.getCartItemIdCandidates(item)) {
    const [itemId, ...restCandidates] = idCandidates;

    if (itemId == null) {
      this.errorMessage = 'Invalid cart item identifier';
      return;
    }

    if (quantity <= 0) {
      this.removeItemWithCandidates(item, idCandidates);
      return;
    }

    this.cartService.updateItemQuantity(itemId, quantity).subscribe({
      next: () => {
        this.errorMessage = '';
        this.successMessage = 'Quantity updated';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        if (restCandidates.length > 0) {
          this.updateQuantity(item, quantity, restCandidates);
          return;
        }
        this.errorMessage = err?.error?.message || 'Failed to update quantity';
      }
    });
  }

  removeItem(item: CartItem) {
    this.removeItemWithCandidates(item, this.getCartItemIdCandidates(item));
  }

  private removeItemWithCandidates(item: CartItem, idCandidates: number[]) {
    const [itemId, ...restCandidates] = idCandidates;

    if (itemId == null) {
      this.errorMessage = 'Invalid cart item identifier';
      return;
    }

    this.cartService.removeItem(itemId).subscribe({
      next: () => {
        this.errorMessage = '';
        this.successMessage = 'Item removed from cart';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        if (restCandidates.length > 0) {
          this.removeItemWithCandidates(item, restCandidates);
          return;
        }
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

  getProductName(item: CartItem): string {
    return item.product?.name || item.productName || 'Product';
  }

  getUnitPrice(item: CartItem): number {
    return item.product?.price ?? item.unitPrice ?? item.price ?? 0;
  }

  getLineTotal(item: CartItem): number {
    return this.getUnitPrice(item) * item.quantity;
  }

  getCartItemIdCandidates(item: CartItem): number[] {
    const candidates = [item.id, item.itemId, item.cartItemId, item.productId]
      .filter((value): value is number => Number.isFinite(value))
      .map(value => Number(value));

    return Array.from(new Set(candidates));
  }

  getProductImage(item: CartItem): string {
    return item.product?.images?.[0] || item.productImage || item.imageUrl || '/assets/placeholder-product.svg';
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
