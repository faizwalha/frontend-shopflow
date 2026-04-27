import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { Observable, map } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent {
  private authService = inject(AuthService);
  private cartService = inject(CartService);
  
  currentUser$: Observable<any> = this.authService.currentUser$;
  
  cartItemsCount$ = this.cartService.cart$.pipe(
    map(cart => cart?.items.reduce((acc, item) => acc + item.quantity, 0) ?? 0)
  );

  logout() {
    this.authService.logout();
  }
}
