import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
import { Order } from '../../core/models/order.models';
import { OrderStatusBadgeComponent } from '../../shared/components/order-status-badge/order-status-badge.component';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterModule, OrderStatusBadgeComponent],
  templateUrl: './orders.component.html'
})
export class OrdersComponent implements OnInit {
  private orderService = inject(OrderService);

  orders: Order[] = [];
  loading = false;
  error = '';
  successMessage = '';
  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  isCancelling = false;
  cancellingOrderId: number | null = null;

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(page = 0): void {
    this.loading = true;
    this.error = '';
    this.successMessage = '';

    this.orderService.getMyOrders(page, this.pageSize).subscribe({
      next: (response) => {
        this.orders = response.content ?? [];
        this.totalPages = response.totalPages ?? 0;
        this.currentPage = page;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || err?.message || 'Unable to load your orders.';
        this.loading = false;
      }
    });
  }

  cancelOrder(order: Order): void {
    if (order.status !== 'PENDING') {
      return;
    }

    if (!confirm(`Cancel order ${order.orderNumber}?`)) {
      return;
    }

    this.isCancelling = true;
    this.cancellingOrderId = order.id;
    this.successMessage = '';

    this.orderService.cancelOrder(order.id).subscribe({
      next: (updatedOrder) => {
        this.successMessage = `Order ${updatedOrder.orderNumber} has been cancelled.`;
        this.orders = this.orders.map((entry) => entry.id === updatedOrder.id ? updatedOrder : entry);
        this.isCancelling = false;
        this.cancellingOrderId = null;
      },
      error: (err) => {
        this.error = err?.error?.message || err?.message || 'Unable to cancel the order.';
        this.isCancelling = false;
        this.cancellingOrderId = null;
      }
    });
  }

  formatCurrency(value: number): string {
    return value.toFixed(2);
  }
}
