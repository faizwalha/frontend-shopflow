import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Product } from '../../models/models';
import { RatingStarsComponent } from '../rating-stars/rating-stars.component';
import { CartService } from '../../../core/services/cart.service';
import { AddToCartRequest } from '../../../core/models/cart.models';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule, RatingStarsComponent],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss'
})
export class ProductCardComponent {
  private cartService = inject(CartService);
  private authService = inject(AuthService);
  private router = inject(Router);

  @Input({ required: true }) product!: Product;

  isAdding = false;
  successMessage = '';
  errorMessage = '';

  getDiscountPercentage(): number {
    if (!this.product.promoPrice) {
      return 0;
    }
    return Math.round(((this.product.price - this.product.promoPrice) / this.product.price) * 100);
  }

  addToCart(): void {
    if (!this.product) {
      return;
    }

    if (!this.authService.isAuthenticated()) {
      // Save pending action to execute after login
      localStorage.setItem('pending_cart_action', JSON.stringify({
        productId: this.product.id,
        variantId: null,
        quantity: 1
      }));
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    this.isAdding = true;
    this.successMessage = '';
    this.errorMessage = '';

    const request: AddToCartRequest = {
      productId: this.product.id,
      variantId: null,
      quantity: 1
    };

    this.cartService.addItem(request).subscribe({
      next: () => {
        this.isAdding = false;
        this.successMessage = 'Added to cart.';
        setTimeout(() => this.successMessage = '', 2500);
      },
      error: (err) => {
        this.isAdding = false;
        this.errorMessage = err?.error?.message || err?.message || 'Unable to add item to cart.';
      }
    });
  }
}
