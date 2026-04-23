import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoryService } from '../../core/services/category.service';
import { CategoryRequest, CategoryResponse } from '../../core/models/category.models';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss'
})
export class CategoriesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);

  categories: CategoryResponse[] = [];
  selectedCategory: CategoryResponse | null = null;
  loadingCategories = false;
  categoryError = '';
  successMessage = '';

  categoryForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    description: [''],
    parentId: [null as number | null]
  });

  ngOnInit(): void {
    this.loadCategories();
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
        setTimeout(() => this.successMessage = '', 3000);
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
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.successMessage = '';
        this.categoryError = err?.error?.message || err?.message || 'Category deletion failed.';
      }
    });
  }
}
