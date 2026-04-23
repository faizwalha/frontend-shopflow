import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { ProductResponse, ProductRequest } from '../../core/models/product.models';
import { CategoryResponse } from '../../core/models/category.models';

@Component({
  selector: 'app-products-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './products-management.component.html'
})
export class ProductsManagementComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);

  products: ProductResponse[] = [];
  categories: CategoryResponse[] = [];
  loading = false;
  submitting = false;
  successMessage = '';
  errorMessage = '';
  
  selectedProduct: ProductResponse | null = null;
  showForm = false;

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
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.productService.getAllProducts(0, 50).subscribe({
      next: (page) => {
        this.products = page.content;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load products';
        this.loading = false;
      }
    });

    this.categoryService.getAllCategories().subscribe({
      next: (cats) => this.categories = cats,
      error: () => console.error('Failed to load categories')
    });
  }

  openAddForm(): void {
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
    this.showForm = true;
  }

  startEdit(product: ProductResponse): void {
    this.selectedProduct = product;
    
    let categoryId: number | null = null;
    if (product.categories.length > 0) {
      const cat = this.categories.find(c => c.name === product.categories[0]);
      categoryId = cat?.id ?? null;
    }

    this.productForm.patchValue({
      name: product.name,
      description: product.description,
      price: product.price,
      promoPrice: product.promoPrice ?? null,
      stock: product.stock,
      images: product.images?.join(', ') ?? '',
      categoryId: categoryId
    });
    this.showForm = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  saveProduct(): void {
    if (this.productForm.invalid) return;

    this.submitting = true;
    const formValue = this.productForm.getRawValue();
    
    const payload: ProductRequest = {
      name: formValue.name,
      description: formValue.description,
      price: formValue.price,
      promoPrice: formValue.promoPrice ?? undefined,
      stock: formValue.stock,
      images: formValue.images ? formValue.images.split(',').map(s => s.trim()).filter(s => s) : [],
      categoryIds: formValue.categoryId ? [formValue.categoryId] : []
    };

    const request$ = this.selectedProduct 
      ? this.productService.updateProduct(this.selectedProduct.id, payload)
      : this.productService.createProduct(payload);

    request$.subscribe({
      next: () => {
        this.successMessage = `Product ${this.selectedProduct ? 'updated' : 'created'} successfully!`;
        this.submitting = false;
        this.showForm = false;
        this.loadData();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to save product';
        this.submitting = false;
      }
    });
  }

  deleteProduct(id: number): void {
    if (!confirm('Are you sure you want to delete this product?')) return;

    this.productService.deleteProduct(id).subscribe({
      next: () => {
        this.successMessage = 'Product deleted successfully';
        this.loadData();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: () => this.errorMessage = 'Failed to delete product'
    });
  }

  cancel(): void {
    this.showForm = false;
    this.selectedProduct = null;
  }
}
