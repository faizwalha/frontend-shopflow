import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./features/home/home.component').then(c => c.HomeComponent),
        title: 'Home - ShopFlow'
      },
      {
        path: 'products',
        loadComponent: () => import('./features/catalog/catalog.component').then(c => c.CatalogComponent),
        title: 'Catalog - ShopFlow'
      },
      {
        path: 'products/:id',
        loadComponent: () => import('./features/product-details/product-details.component').then(c => c.ProductDetailsComponent)
      },
      {
        path: 'cart',
        loadComponent: () => import('./features/cart/cart.component').then(c => c.CartComponent),
        title: 'Shopping Cart - ShopFlow'
      },
      {
        path: 'checkout',
        canActivate: [authGuard],
        loadComponent: () => import('./features/checkout/checkout.component').then(c => c.CheckoutComponent),
        title: 'Checkout - ShopFlow'
      },
      {
        path: 'dashboard',
        canActivate: [authGuard, roleGuard],
        data: { expectedRoles: ['ADMIN', 'SELLER'] },
        loadComponent: () => import('./features/dashboard/dashboard.component').then(c => c.DashboardComponent),
        title: 'Dashboard - ShopFlow'
      },
      {
        path: 'profile',
        canActivate: [authGuard],
        loadComponent: () => import('./features/profile/profile.component').then(c => c.ProfileComponent),
        title: 'Profile - ShopFlow'
      },
      {
        path: 'seller-setup',
        canActivate: [authGuard],
        loadComponent: () => import('./features/auth/seller-setup/seller-setup.component').then(c => c.SellerSetupComponent),
        title: 'Seller Setup - ShopFlow'
      },
      {
        path: 'orders',
        canActivate: [authGuard],
        loadComponent: () => import('./features/orders/orders.component').then(c => c.OrdersComponent),
        title: 'My Orders - ShopFlow'
      },
      {
        path: 'orders/:id',
        canActivate: [authGuard],
        loadComponent: () => import('./features/orders/order-details.component').then(c => c.OrderDetailsComponent),
        title: 'Order Details - ShopFlow'
      },
      {
        path: 'categories',
        canActivate: [authGuard, roleGuard],
        data: { expectedRoles: ['ADMIN'] },
        loadComponent: () => import('./features/categories/categories.component').then(c => c.CategoriesComponent),
        title: 'Manage Categories - ShopFlow'
      },
      {
        path: 'coupons',
        canActivate: [authGuard, roleGuard],
        data: { expectedRoles: ['ADMIN'] },
        loadComponent: () => import('./features/coupons/admin-coupons.component').then(c => c.AdminCouponsComponent),
        title: 'Manage Coupons - ShopFlow'
      },
      {
        path: 'inventory',
        canActivate: [authGuard, roleGuard],
        data: { expectedRoles: ['SELLER', 'ADMIN'] },
        loadComponent: () => import('./features/products-management/products-management.component').then(c => c.ProductsManagementComponent),
        title: 'Manage Products - ShopFlow'
      }
    ]
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(c => c.LoginComponent),
    title: 'Sign In - ShopFlow'
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(c => c.RegisterComponent),
    title: 'Register - ShopFlow'
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(c => c.ForgotPasswordComponent),
    title: 'Forgot Password - ShopFlow'
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(c => c.ResetPasswordComponent),
    title: 'Reset Password - ShopFlow'
  },
  {
    path: 'verify-email',
    loadComponent: () => import('./features/auth/verify-email/verify-email.component').then(c => c.VerifyEmailComponent),
    title: 'Verify Email - ShopFlow'
  },
  {
    path: '**',
    redirectTo: ''
  }
];
