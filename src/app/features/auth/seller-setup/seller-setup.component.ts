import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-seller-setup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './seller-setup.component.html',
  styles: []
})
export class SellerSetupComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  logoFileName = 'Choose a logo file';
  private selectedLogoFile: File | null = null;

  sellerForm = this.fb.nonNullable.group({
    shopName: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(500)]],
    logo: ['']
  });

  isLoading = false;
  errorMessage = '';

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      this.logoFileName = 'Choose a logo file';
      this.selectedLogoFile = null;
      return;
    }

    this.selectedLogoFile = file;
    this.logoFileName = file.name;
  }

  onSubmit() {
    if (this.sellerForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const formValue = this.sellerForm.getRawValue();
    const payload = new FormData();
    payload.append('shopName', formValue.shopName);
    payload.append('description', formValue.description ?? '');

    if (this.selectedLogoFile) {
      payload.append('logoFile', this.selectedLogoFile);
    }

    this.authService.createSellerProfile(payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        const httpError = err as HttpErrorResponse;
        if (httpError.status === 403) {
          this.errorMessage = 'The backend rejected this request with 403 Forbidden. This usually means the endpoint is protected by Spring Security (role/authority mismatch or CSRF) and must be fixed server-side.';
          return;
        }

        this.errorMessage = err?.error?.message || 'Failed to create seller profile.';
      }
    });
  }
}
