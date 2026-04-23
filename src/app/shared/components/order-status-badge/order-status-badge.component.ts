import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderStatus } from '../../../core/models/order.models';

@Component({
  selector: 'app-order-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-status-badge.component.html'
})
export class OrderStatusBadgeComponent {
  @Input() status: OrderStatus = 'PENDING';

  getBadgeClasses() {
    switch(this.status) {
      case 'PENDING': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'PAID': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PROCESSING': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'SHIPPED': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'DELIVERED': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'CANCELLED': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'REFUNDED': return 'bg-gray-200 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }
}
