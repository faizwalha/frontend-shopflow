import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { ReviewService } from '../../core/services/review.service';
import { AuthService } from '../../core/services/auth.service';
import { AddToCartRequest } from '../../core/models/cart.models';
import { ProductResponse } from '../../core/models/product.models';
import { Review, PostReviewRequest } from '../../core/models/review.models';
import { ProductVariant } from '../../core/models/product.models';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.scss'
})
export class ProductDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private reviewService = inject(ReviewService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  currentUser$ = this.authService.currentUser$;
  product: ProductResponse | null = null;
  reviews: Review[] = [];
  selectedVariant: ProductVariant | null = null;
  loading = false;
  loadingReviews = false;
  isAdding = false;
  isSubmittingReview = false;
  successMessage = '';
  errorMessage = '';
  reviewError = '';

  reviewForm = this.fb.nonNullable.group({
    rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
    comment: ['', [Validators.required, Validators.minLength(3)]]
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(id)) {
      this.errorMessage = 'Invalid product identifier.';
      return;
    }

    this.loading = true;
    this.productService.getProductById(id).subscribe({
      next: (product) => {
        this.product = product;
        this.loading = false;
        this.loadReviews(id);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || err?.message || 'Unable to load product.';
      }
    });
  }

  loadReviews(productId: number): void {
    this.loadingReviews = true;
    this.reviewService.getProductReviews(productId, 0, 20).subscribe({
      next: (response) => {
        this.reviews = response.content ?? [];
        this.loadingReviews = false;
      },
      error: (err) => {
        this.loadingReviews = false;
        console.error('Failed to load reviews', err);
      }
    });
  }

  submitReview(): void {
    if (this.reviewForm.invalid || !this.product) {
      return;
    }

    this.isSubmittingReview = true;
    this.reviewError = '';

    const request: PostReviewRequest = {
      productId: this.product.id,
      rating: this.reviewForm.getRawValue().rating,
      comment: this.reviewForm.getRawValue().comment
    };

    this.reviewService.postReview(request).subscribe({
      next: (review) => {
        this.isSubmittingReview = false;
        this.reviews = [review, ...this.reviews];
        this.reviewForm.reset({ rating: 5, comment: '' });
      },
      error: (err) => {
        this.isSubmittingReview = false;
        this.reviewError = err?.error?.message || err?.message || 'Failed to submit review.';
      }
    });
  }

  selectVariant(variant: ProductVariant): void {
    this.selectedVariant = variant;
  }

  getDisplayPrice(): number {
    if (!this.product) return 0;
    const basePrice = this.product.displayPrice;
    return this.selectedVariant ? basePrice + this.selectedVariant.priceDelta : basePrice;
  }

  getDisplayStock(): number {
    if (!this.product) return 0;
    return this.selectedVariant ? this.selectedVariant.additionalStock : this.product.stock;
  }

  addToCart(): void {
    if (!this.product) {
      return;
    }

    if (this.product.variants && this.product.variants.length > 0 && !this.selectedVariant) {
      this.errorMessage = 'Please select a variant.';
      return;
    }

    this.isAdding = true;
    this.errorMessage = '';
    this.successMessage = '';

    const request: AddToCartRequest = {
      productId: this.product.id,
      variantId: this.selectedVariant?.id ?? null,
      quantity: 1
    };

    this.cartService.addItem(request).subscribe({
      next: () => {
        this.isAdding = false;
        this.successMessage = 'Item added to cart.';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.isAdding = false;
        this.errorMessage = err?.error?.message || err?.message || 'Unable to add item to cart.';
      }
    });
  }
}
