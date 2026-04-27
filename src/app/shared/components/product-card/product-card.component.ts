import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Product } from '../../models/models';
import { RatingStarsComponent } from '../rating-stars/rating-stars.component';
import { CartService } from '../../../core/services/cart.service';
import { AddToCartRequest } from '../../../core/models/cart.models';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule, RatingStarsComponent],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss'
})
export class ProductCardComponent {
  private cartService = inject(CartService);

  @Input({ required: true }) product!: Product;

  isAdding = false;
  successMessage = '';
  errorMessage = '';

  addToCart(): void {
    if (!this.product) {
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
