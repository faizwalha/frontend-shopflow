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
  selectedVariants: { [attribute: string]: ProductVariant } = {};
  loading = false;
  loadingReviews = false;
  isAdding = false;
  isSubmittingReview = false;
  successMessage = '';
  errorMessage = '';
  reviewError = '';

  get groupedVariants(): { [attribute: string]: ProductVariant[] } {
    if (!this.product || !this.product.variants) return {};
    return this.product.variants.reduce((acc, v) => {
      if (!acc[v.attribute]) acc[v.attribute] = [];
      acc[v.attribute].push(v);
      return acc;
    }, {} as { [attribute: string]: ProductVariant[] });
  }

  get attributes(): string[] {
    return Object.keys(this.groupedVariants);
  }

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
    if (this.selectedVariants[variant.attribute]?.id === variant.id) {
      delete this.selectedVariants[variant.attribute];
    } else {
      this.selectedVariants[variant.attribute] = variant;
    }
  }

  isSelected(variant: ProductVariant): boolean {
    return this.selectedVariants[variant.attribute]?.id === variant.id;
  }

  getDisplayPrice(): number {
    if (!this.product) return 0;
    let price = this.product.displayPrice;
    
    Object.values(this.selectedVariants).forEach(v => {
      price += v.priceDelta || 0;
    });
    
    return price;
  }

  getDiscountPercentage(): number {
    if (!this.product || !this.product.promoPrice) {
      return 0;
    }
    return Math.round(((this.product.price - this.product.promoPrice) / this.product.price) * 100);
  }

  getDisplayStock(): number {
    if (!this.product) return 0;
    const selectedValues = Object.values(this.selectedVariants);
    if (selectedValues.length === 0) return this.product.stock;
    
    // On prend le stock minimum parmi les variantes selectionnees
    return Math.min(...selectedValues.map(v => v.additionalStock));
  }

  addToCart(): void {
    if (!this.product) return;

    const attributesCount = this.attributes.length;
    const selectedCount = Object.keys(this.selectedVariants).length;

    if (attributesCount > 0 && selectedCount < attributesCount) {
      this.errorMessage = 'Please select all options (e.g., Color and Size).';
      return;
    }

    this.isAdding = true;
    this.errorMessage = '';
    this.successMessage = '';

    const request: AddToCartRequest = {
      productId: this.product.id,
      variantIds: Object.values(this.selectedVariants).map(v => v.id),
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
