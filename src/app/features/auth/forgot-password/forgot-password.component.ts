import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 bg-[url('https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center">
      <div class="absolute inset-0 bg-white/60 backdrop-blur-lg"></div>

      <div class="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 relative z-10">
        <div class="text-center">
          <h2 class="text-3xl font-black text-slate-950 tracking-tight mb-2">Forgot Password?</h2>
          <p class="text-slate-500 font-medium text-sm">Enter your email and we'll send you a link to reset your password.</p>
        </div>

        <form [formGroup]="forgotPasswordForm" (ngSubmit)="onSubmit()" class="mt-8 space-y-6">
          <div class="space-y-1.5">
            <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
            <input type="email" formControlName="email"
                   class="w-full px-5 py-3 rounded-xl border-2 border-indigo-100 focus:border-indigo-500 outline-none font-bold text-sm transition-all"
                   placeholder="you@example.com">
            <div *ngIf="forgotPasswordForm.get('email')?.touched && forgotPasswordForm.get('email')?.invalid" class="text-red-500 text-xs font-bold mt-1 ml-1">
              Please enter a valid email address.
            </div>
          </div>

          <button type="submit" [disabled]="forgotPasswordForm.invalid || isLoading"
                  class="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-black transition duration-300 shadow-xl shadow-indigo-100 disabled:opacity-50 flex items-center justify-center gap-2">
            <span *ngIf="!isLoading">Send Reset Link</span>
            <span *ngIf="isLoading" class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
          </button>

          <div class="text-center">
            <a routerLink="/login" class="text-indigo-600 hover:text-indigo-700 font-bold text-sm">Back to Login</a>
          </div>
        </form>
      </div>
    </div>
  `
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  isLoading = false;
  forgotPasswordForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  onSubmit() {
    if (this.forgotPasswordForm.valid) {
      this.isLoading = true;
      this.authService.forgotPassword(this.forgotPasswordForm.value.email).subscribe({
        next: (res) => {
          this.toastService.success(res.message || 'Reset link sent successfully');
          this.isLoading = false;
        },
        error: (err) => {
          this.toastService.error(err.error?.message || 'The email you entered is invalid');
          this.isLoading = false;
        }
      });
    }
  }
}
