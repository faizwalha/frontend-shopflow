import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { NotificationService } from '../../core/services/notification.service';
import { NotificationResponse } from '../../core/models/notification.models';
import { ThemeService } from '../../core/services/theme.service';
import { Observable, map, Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private cartService = inject(CartService);
  private themeService = inject(ThemeService);

  private router = inject(Router);

  private notificationService = inject(NotificationService);
  
  currentUser$ = this.authService.userProfile$;
  theme$ = this.themeService.theme$;
  searchQuery = '';
  
  cartItemsCount$ = this.cartService.cart$.pipe(
    map(cart => cart?.items.reduce((acc, item) => acc + item.quantity, 0) ?? 0)
  );

  unreadCount = 0;
  notifications: NotificationResponse[] = [];
  showNotifications = false;
  private authSub?: Subscription;

  ngOnInit() {
    this.authSub = this.currentUser$.subscribe(user => {
      if (user) {
        this.loadUnreadCount();
      } else {
        this.unreadCount = 0;
        this.notifications = [];
        this.showNotifications = false;
      }
    });
  }

  ngOnDestroy() {
    this.authSub?.unsubscribe();
  }

  loadUnreadCount() {
    this.notificationService.getUnreadCount().subscribe({
      next: (count) => this.unreadCount = count,
      error: () => this.unreadCount = 0
    });
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.notificationService.getNotifications(0, 10).subscribe({
        next: (res) => this.notifications = res.content || [],
        error: () => this.notifications = []
      });
    }
  }

  markAsRead(notification: NotificationResponse) {
    if (!notification.read) {
      this.notificationService.markAsRead(notification.id).subscribe(() => {
        notification.read = true;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      });
    }
  }

  markAllAsRead() {
    if (this.unreadCount > 0 || this.notifications.some(n => !n.read)) {
      this.notificationService.markAllAsRead().subscribe(() => {
        this.notifications.forEach(n => n.read = true);
        this.unreadCount = 0;
      });
    }
  }

  logout() {
    this.authService.logout();
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  searchProducts(): void {
    const query = this.searchQuery.trim();

    if (!query) {
      return;
    }

    this.router.navigate(['/products'], { queryParams: { q: query } });
  }

  onSearchKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.searchProducts();
    }
  }
}
