import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
import { Order } from '../../core/models/order.models';
import { OrderStatusBadgeComponent } from '../../shared/components/order-status-badge/order-status-badge.component';

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [CommonModule, RouterModule, OrderStatusBadgeComponent],
  templateUrl: './order-details.component.html'
})
export class OrderDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private orderService = inject(OrderService);

  order: Order | null = null;
  loading = false;
  error = '';
  successMessage = '';
  isCancelling = false;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(id)) {
      this.error = 'Invalid order identifier.';
      return;
    }

    this.loadOrder(id);
  }

  loadOrder(id: number): void {
    this.loading = true;
    this.error = '';
    this.successMessage = '';

    this.orderService.getOrderById(id).subscribe({
      next: (order) => {
        this.order = order;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || err?.message || 'Unable to load order details.';
        this.loading = false;
      }
    });
  }

  cancelOrder(): void {
    if (!this.order || this.order.status !== 'PENDING') {
      return;
    }

    if (!confirm(`Cancel order ${this.order.orderNumber}?`)) {
      return;
    }

    this.isCancelling = true;
    this.successMessage = '';

    this.orderService.cancelOrder(this.order.id).subscribe({
      next: (updatedOrder) => {
        this.order = updatedOrder;
        this.successMessage = 'Order cancelled successfully.';
        this.isCancelling = false;
      },
      error: (err) => {
        this.error = err?.error?.message || err?.message || 'Unable to cancel order.';
        this.isCancelling = false;
      }
    });
  }

  formatCurrency(value: number): string {
    return value.toFixed(2);
  }

  goBack(): void {
    this.router.navigate(['/orders']);
  }
}
