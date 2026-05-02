import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { AuthService } from '../../core/services/auth.service';
import { ProductResponse, ProductRequest, ProductVariantRequest, PageResponse } from '../../core/models/product.models';
import { CategoryResponse } from '../../core/models/category.models';
import { FormArray } from '@angular/forms';

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
  private authService = inject(AuthService);

  products: ProductResponse[] = [];
  categories: CategoryResponse[] = [];
  loading = false;
  submitting = false;
  successMessage = '';
  errorMessage = '';
  
  // Pagination & Search
  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  totalElements = 0;
  searchTerm = '';
  sortField = 'createdAt';
  sortDirection = 'desc';
  
  selectedProduct: ProductResponse | null = null;
  showForm = false;

  productForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    description: ['', [Validators.required]],
    price: [0, [Validators.required, Validators.min(0)]],
    promoPrice: [null as number | null],
    stock: [0, [Validators.required, Validators.min(0)]],
    images: [''],
    categoryIds: [[] as number[]],
    variants: this.fb.array([])
  });

  get variants(): FormArray {
    return this.productForm.get('variants') as FormArray;
  }

  addVariant(): void {
    const variantForm = this.fb.group({
      attribute: ['', Validators.required],
      value: ['', Validators.required],
      additionalStock: [0, [Validators.required, Validators.min(0)]],
      priceDelta: [0]
    });
    this.variants.push(variantForm);
  }

  removeVariant(index: number): void {
    this.variants.removeAt(index);
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(page = 0): void {
    this.loading = true;
    this.currentPage = page;
    const role = this.authService.getRole();
    const userId = this.authService.getUserId();

    let productRequest$: Observable<PageResponse<ProductResponse>>;

    const sort = `${this.sortField},${this.sortDirection}`;

    if (this.searchTerm) {
      productRequest$ = this.productService.searchProducts(this.searchTerm, this.currentPage, this.pageSize, sort);
    } else {
      productRequest$ = this.productService.getInventoryProducts(this.currentPage, this.pageSize, sort);
    }

    productRequest$.subscribe({
      next: (page) => {
        this.products = page.content;
        this.totalPages = page.totalPages;
        this.totalElements = page.totalElements;
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
      categoryIds: [],
      variants: []
    });
    this.variants.clear();
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
      categoryIds: product.categories.map(name => this.categories.find(c => c.name === name)?.id).filter(id => id !== undefined) as number[]
    });

    this.variants.clear();
    if (product.variants && product.variants.length > 0) {
      product.variants.forEach(v => {
        this.variants.push(this.fb.group({
          attribute: [v.attribute, Validators.required],
          value: [v.value, Validators.required],
          additionalStock: [v.additionalStock, [Validators.required, Validators.min(0)]],
          priceDelta: [v.priceDelta || 0]
        }));
      });
    }

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
      categoryIds: formValue.categoryIds || [],
      variants: formValue.variants as ProductVariantRequest[]
    };

    const request$ = this.selectedProduct 
      ? this.productService.updateProduct(this.selectedProduct.id, payload)
      : this.productService.createProduct(payload);

    request$.subscribe({
      next: (updatedProduct: ProductResponse) => {
        this.successMessage = `Product ${this.selectedProduct ? 'updated' : 'created'} successfully!`;
        this.submitting = false;
        this.showForm = false;
        this.loadData(this.currentPage);
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
        this.successMessage = 'Product deactivated successfully';
        this.loadData(this.currentPage);
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: () => this.errorMessage = 'Failed to deactivate product'
    });
  }

  toggleProductActive(product: ProductResponse): void {
    const payload: ProductRequest = {
      name: product.name,
      description: product.description,
      price: product.price,
      promoPrice: product.promoPrice ?? undefined,
      stock: product.stock,
      active: !product.active,
      images: product.images,
      categoryIds: product.categories.map(name => this.categories.find(c => c.name === name)?.id).filter(id => id !== undefined) as number[],
      variants: product.variants?.map(v => ({
        attribute: v.attribute,
        value: v.value,
        additionalStock: v.additionalStock,
        priceDelta: v.priceDelta
      }))
    };

    this.loading = true;
    this.productService.updateProduct(product.id, payload).subscribe({
      next: () => {
        this.successMessage = `Product ${!product.active ? 'activated' : 'deactivated'} successfully!`;
        this.loadData(this.currentPage);
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to update product status';
        this.loading = false;
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  cancel(): void {
    this.showForm = false;
    this.selectedProduct = null;
  }

  onSearch(): void {
    this.loadData(0);
  }

  onPageChange(page: number): void {
    this.loadData(page);
  }

  onSortChange(field: string): void {
    this.sortField = field;
    this.loadData(0);
  }
}
