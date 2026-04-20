import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { Product } from '../../shared/models/models';
import { CategoryService } from '../../core/services/category.service';
import { CategoryResponse } from '../../core/models/category.models';
import { inject, OnInit } from '@angular/core';
import { ProductService } from '../../core/services/product.service';
import { ProductResponse } from '../../core/models/product.models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductCardComponent],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private productService = inject(ProductService);

  featuredProducts: Product[] = [];

  featuredCategories: CategoryResponse[] = [];

  private categoryImages: Record<string, string> = {
    electronics: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500&auto=format&fit=crop',
    furniture: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&auto=format&fit=crop',
    clothing: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=500&auto=format&fit=crop',
    watches: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop'
  };

  ngOnInit(): void {
    this.productService.getTopSellingProducts().subscribe({
      next: (products: ProductResponse[]) => {
        this.featuredProducts = products.slice(0, 4).map(product => this.mapProduct(product));
      },
      error: () => {
        this.featuredProducts = this.getFallbackProducts();
      }
    });

    this.categoryService.getRootCategories().subscribe({
      next: (categories) => {
        this.featuredCategories = (categories ?? []).slice(0, 4);
      },
      error: () => {
        this.featuredCategories = [];
      }
    });
  }

  getCategoryImage(categoryName: string): string {
    return this.categoryImages[categoryName.toLowerCase()] ?? 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop';
  }

  private mapProduct(product: ProductResponse): Product {
    return {
      id: product.id,
      name: product.name,
      description: product.description ?? '',
      price: product.displayPrice ?? product.price,
      imageUrl: product.images?.[0] ?? 'https://via.placeholder.com/300',
      category: product.categories?.[0] ?? 'Uncategorized',
      rating: product.averageRating ?? 0,
      reviewsCount: 0
    };
  }

  private getFallbackProducts(): Product[] {
    return [
      {
        id: 1,
        name: 'Wireless Noise-Cancelling Headphones',
        description: 'Premium headphones with active noise cancellation.',
        price: 299.99,
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop',
        category: 'Electronics',
        rating: 4.8,
        reviewsCount: 124
      },
      {
        id: 2,
        name: 'Minimalist Mechanical Keyboard',
        description: 'Tenkeyless layout with tactile switches.',
        price: 129.50,
        imageUrl: 'https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=2071&auto=format&fit=crop',
        category: 'Peripherals',
        rating: 4.5,
        reviewsCount: 89
      },
      {
        id: 3,
        name: 'Ergonomic Office Chair',
        description: 'Adjustable lumbar support and breathable mesh.',
        price: 450.00,
        imageUrl: 'https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?q=80&w=2069&auto=format&fit=crop',
        category: 'Furniture',
        rating: 4.9,
        reviewsCount: 302
      },
      {
        id: 4,
        name: '4K Ultra HD Smart Monitor',
        description: '32-inch display perfect for creative professionals.',
        price: 599.99,
        imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=2070&auto=format&fit=crop',
        category: 'Screens',
        rating: 4.7,
        reviewsCount: 56
      }
    ];
  }
}
