import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { Product } from '../../shared/models/models';
import { CategoryService } from '../../core/services/category.service';
import { CategoryResponse } from '../../core/models/category.models';
import { ProductService } from '../../core/services/product.service';
import { ProductResponse } from '../../core/models/product.models';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  templateUrl: './catalog.component.html'
})
export class CatalogComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private categoryService = inject(CategoryService);
  private productService = inject(ProductService);

  filteredProducts: Product[] = [];
  categories: string[] = ['All'];
  selectedCategory = 'All';
  searchQuery = '';
  loadingCategories = false;
  categoryError = '';
  loadingProducts = false;
  productError = '';
  currentPage = 0;
  pageSize = 12;
  totalPages = 0;
  totalElements = 0;
  pageNumbers: number[] = [];

  private rootCategories: CategoryResponse[] = [];

  ngOnInit() {
    this.loadProducts();

    this.loadingCategories = true;
    this.categoryService.getRootCategories().subscribe({
      next: (categories) => {
        this.rootCategories = categories ?? [];
        this.categories = ['All', ...this.rootCategories.map(category => category.name)];
        this.loadingCategories = false;
      },
      error: () => {
        this.loadingCategories = false;
        this.categoryError = 'Unable to load categories from the backend.';
        this.categories = ['All'];
      }
    });

    this.route.queryParams.subscribe(params => {
       if (params['category']) {
         this.filterByCategory(this.resolveCategoryLabel(params['category']));
       }
       if (params['q']) {
         this.searchQuery = params['q'];
         this.currentPage = Number(params['page'] ?? 0) || 0;
         this.loadProducts();
       }
    });
  }

  private resolveCategoryLabel(categoryParam: string): string {
    const normalized = categoryParam.toLowerCase();
    const matched = this.rootCategories.find(category => category.name.toLowerCase() === normalized || category.slug?.toLowerCase() === normalized);
    return matched?.name ?? categoryParam.charAt(0).toUpperCase() + categoryParam.slice(1);
  }

  filterByCategory(category: string) {
    this.selectedCategory = category;
    this.applyFilters();
  }

  changePage(nextPage: number) {
    if (nextPage < 0 || (this.totalPages && nextPage >= this.totalPages)) {
      return;
    }
    this.currentPage = nextPage;
    this.loadProducts();
  }

  onSearch(event: Event) {
    this.searchQuery = (event.target as HTMLInputElement).value;
    this.currentPage = 0;
    this.loadProducts();
  }

  private loadProducts() {
    this.loadingProducts = true;
    this.productError = '';

    const request$ = this.searchQuery.trim()
      ? this.productService.searchProducts(this.searchQuery.trim(), this.currentPage, this.pageSize)
      : this.productService.getAllProducts(this.currentPage, this.pageSize);

    request$.subscribe({
      next: (page) => {
        const products = page.content ?? [];
        this.totalPages = page.totalPages ?? 0;
        this.pageNumbers = Array.from({ length: this.totalPages }, (_, index) => index);
        this.totalElements = page.totalElements ?? products.length;
        this.filteredProducts = this.applyLocalCategoryFilter(products.map(product => this.mapProduct(product)));
        this.loadingProducts = false;
      },
      error: () => {
        this.loadingProducts = false;
        this.productError = 'Unable to load products from the backend.';
        this.filteredProducts = [];
      }
    });
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

  private applyLocalCategoryFilter(products: Product[]): Product[] {
    if (this.selectedCategory === 'All') {
      return products;
    }

    return products.filter(product => product.category.toLowerCase() === this.selectedCategory.toLowerCase());
  }

  applyFilters() {
    this.loadProducts();
  }
}
