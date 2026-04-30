import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 bg-[url('https://images.unsplash.com/photo-1454165833767-027ffea9e78a?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center">
      <div class="absolute inset-0 bg-white/60 backdrop-blur-lg"></div>

      <div class="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 relative z-10">
        <div class="text-center">
          <h2 class="text-3xl font-black text-slate-950 tracking-tight mb-2">Reset Password</h2>
          <p class="text-slate-500 font-medium text-sm">Enter your new password below.</p>
        </div>

        <form [formGroup]="resetPasswordForm" (ngSubmit)="onSubmit()" class="mt-8 space-y-6">
          <div class="space-y-4">
            <div class="space-y-1.5">
              <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">New Password</label>
              <input type="password" formControlName="password"
                     class="w-full px-5 py-3 rounded-xl border-2 border-indigo-100 focus:border-indigo-500 outline-none font-bold text-sm transition-all"
                     placeholder="••••••••">
            </div>

            <div class="space-y-1.5">
              <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Confirm Password</label>
              <input type="password" formControlName="confirmPassword"
                     class="w-full px-5 py-3 rounded-xl border-2 border-indigo-100 focus:border-indigo-500 outline-none font-bold text-sm transition-all"
                     placeholder="••••••••">
              <div *ngIf="resetPasswordForm.errors?.['mismatch'] && resetPasswordForm.get('confirmPassword')?.touched" class="text-red-500 text-xs font-bold mt-1 ml-1">
                Passwords do not match.
              </div>
            </div>
          </div>

          <button type="submit" [disabled]="resetPasswordForm.invalid || isLoading"
                  class="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-black transition duration-300 shadow-xl shadow-green-100 disabled:opacity-50 flex items-center justify-center gap-2">
            <span *ngIf="!isLoading">Update Password</span>
            <span *ngIf="isLoading" class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
          </button>
        </form>
      </div>
    </div>
  `
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  isLoading = false;
  token: string | null = null;
  resetPasswordForm: FormGroup;

  constructor() {
    this.resetPasswordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token');
    if (!this.token) {
      this.toastService.error('Invalid or missing reset token');
      this.router.navigate(['/login']);
    }
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  onSubmit() {
    if (this.resetPasswordForm.valid && this.token) {
      this.isLoading = true;
      this.authService.resetPassword(this.token, this.resetPasswordForm.value.password).subscribe({
        next: (res) => {
          this.toastService.success(res.message || 'Password updated successfully');
          this.router.navigate(['/login']);
        },
        error: (err) => {
          this.toastService.error(err.error?.message || 'Failed to reset password');
          this.isLoading = false;
        }
      });
    }
  }
}
