import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LoginRequest } from '../../../core/models/auth.models';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cartService = inject(CartService);


  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  isLoading = false;
  errorMessage = '';

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    const credentials: LoginRequest = this.loginForm.getRawValue();

    this.authService.login(credentials).subscribe({
      next: (response) => {
        this.isLoading = false;
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        if (returnUrl && returnUrl.startsWith('/')) {
          this.router.navigateByUrl(returnUrl);
          return;
        }

        const role = response.role ?? this.authService.getRole();
        const targetRoute = role === 'ADMIN' || role === 'SELLER' ? '/dashboard' : (this.route.snapshot.queryParamMap.get('returnUrl') || '/');
        
        // Handle pending cart action
        const pendingAction = localStorage.getItem('pending_cart_action');
        if (pendingAction) {
          try {
            const action = JSON.parse(pendingAction);
            localStorage.removeItem('pending_cart_action'); // Clear early to avoid loops
            this.cartService.addItem(action).subscribe({
              next: () => this.router.navigateByUrl(targetRoute),
              error: () => this.router.navigateByUrl(targetRoute)
            });
            return;
          } catch {
            localStorage.removeItem('pending_cart_action');
          }
        }

        this.router.navigateByUrl(targetRoute);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || err?.message || 'Login failed.';
      }
    });
  }
}
