import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-order-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-status-badge.component.html'
})
export class OrderStatusBadgeComponent {
  @Input() status: 'PENDING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' = 'PENDING';

  getBadgeClasses() {
    switch(this.status) {
      case 'PENDING': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'SHIPPED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DELIVERED': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'CANCELLED': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }
}
