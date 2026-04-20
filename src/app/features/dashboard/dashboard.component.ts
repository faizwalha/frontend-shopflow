import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { CategoryService } from '../../core/services/category.service';
import { ProductService } from '../../core/services/product.service';
import { CategoryRequest, CategoryResponse } from '../../core/models/category.models';
import { ProductRequest, ProductResponse } from '../../core/models/product.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private categoryService = inject(CategoryService);
  private productService = inject(ProductService);

  currentUser$ = this.authService.currentUser$;
  categories: CategoryResponse[] = [];
  products: ProductResponse[] = [];
  selectedCategory: CategoryResponse | null = null;
  selectedProduct: ProductResponse | null = null;
  loadingCategories = false;
  loadingProducts = false;
  categoryError = '';
  productError = '';
  successMessage = '';

  categoryForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    description: [''],
    parentId: [null as number | null]
  });

  productForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    description: ['', [Validators.required]],
    price: [0, [Validators.required, Validators.min(0)]],
    promoPrice: [null as number | null],
    stock: [0, [Validators.required, Validators.min(0)]],
    images: [''],
    categoryId: [null as number | null]
  });

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  isAdmin(role: string | null | undefined): boolean {
    return role === 'ADMIN';
  }

  loadCategories(): void {
    this.loadingCategories = true;
    this.categoryService.getAllCategories().subscribe({
      next: (categories) => {
        this.categories = categories ?? [];
        this.loadingCategories = false;
      },
      error: () => {
        this.categoryError = 'Unable to load categories.';
        this.loadingCategories = false;
      }
    });
  }

  loadProducts(): void {
    this.loadingProducts = true;
    this.productService.getAllProducts(0, 20).subscribe({
      next: (page) => {
        this.products = page.content ?? [];
        this.loadingProducts = false;
      },
      error: () => {
        this.productError = 'Unable to load products.';
        this.loadingProducts = false;
      }
    });
  }

  startEdit(category: CategoryResponse): void {
    this.selectedCategory = category;
    this.categoryForm.patchValue({
      name: category.name,
      description: category.description ?? '',
      parentId: category.parentId ?? null
    });
  }

  clearForm(): void {
    this.selectedCategory = null;
    this.categoryForm.reset({
      name: '',
      description: '',
      parentId: null
    });
  }

  startEditProduct(product: ProductResponse): void {
    this.selectedProduct = product;
    // Get the category ID from the categories list if available
    let categoryId: number | null = null;
    if (product.categories.length > 0 && this.categories.length > 0) {
      const categoryName = product.categories[0];
      const foundCategory = this.categories.find(c => c.name === categoryName);
      categoryId = foundCategory?.id ?? null;
    }
    this.productForm.patchValue({
      name: product.name,
      description: product.description ?? '',
      price: product.price,
      promoPrice: product.promoPrice ?? null,
      stock: product.stock ?? 0,
      images: product.images?.join(', ') ?? '',
      categoryId: categoryId
    });
  }

  clearProductForm(): void {
    this.selectedProduct = null;
    this.productForm.reset({
      name: '',
      description: '',
      price: 0,
      promoPrice: null,
      stock: 0,
      images: '',
      categoryId: null
    });
  }

  saveProduct(): void {
    if (this.productForm.invalid) {
      return;
    }

    const formValue = this.productForm.getRawValue();
    const payload: ProductRequest = {
      name: formValue.name,
      description: formValue.description,
      price: formValue.price,
      promoPrice: formValue.promoPrice ?? undefined,
      stock: formValue.stock,
      images: formValue.images
        ? formValue.images.split(',').map((img: string) => img.trim()).filter((img: string) => img)
        : undefined,
      categoryIds: formValue.categoryId ? [formValue.categoryId] : undefined
    };

    const request$ = this.selectedProduct
      ? this.productService.updateProduct(this.selectedProduct.id, payload)
      : this.productService.createProduct(payload);

    request$.subscribe({
      next: () => {
        this.successMessage = this.selectedProduct ? 'Product updated.' : 'Product created.';
        this.productError = '';
        this.clearProductForm();
        this.loadProducts();
      },
      error: (err) => {
        this.successMessage = '';
        this.productError = err?.error?.message || err?.message || 'Product save failed.';
      }
    });
  }

  removeProduct(product: ProductResponse): void {
    if (!confirm(`Delete product "${product.name}"?`)) {
      return;
    }

    this.productService.deleteProduct(product.id).subscribe({
      next: () => {
        this.successMessage = 'Product deleted.';
        this.productError = '';
        this.loadProducts();
      },
      error: (err) => {
        this.successMessage = '';
        this.productError = err?.error?.message || err?.message || 'Product deletion failed.';
      }
    });
  }

  saveCategory(): void {
    if (this.categoryForm.invalid) {
      return;
    }

    const payload: CategoryRequest = this.categoryForm.getRawValue();
    const request$ = this.selectedCategory
      ? this.categoryService.updateCategory(this.selectedCategory.id, payload)
      : this.categoryService.createCategory(payload);

    request$.subscribe({
      next: () => {
        this.successMessage = this.selectedCategory ? 'Category updated.' : 'Category created.';
        this.categoryError = '';
        this.clearForm();
        this.loadCategories();
      },
      error: (err) => {
        this.successMessage = '';
        this.categoryError = err?.error?.message || err?.message || 'Category save failed.';
      }
    });
  }

  removeCategory(category: CategoryResponse): void {
    if (!confirm(`Delete category "${category.name}"?`)) {
      return;
    }

    this.categoryService.deleteCategory(category.id).subscribe({
      next: () => {
        this.successMessage = 'Category deleted.';
        this.categoryError = '';
        this.loadCategories();
      },
      error: (err) => {
        this.successMessage = '';
        this.categoryError = err?.error?.message || err?.message || 'Category deletion failed.';
      }
    });
  }

}
