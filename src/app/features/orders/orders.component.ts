import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
import { Order } from '../../core/models/order.models';
import { OrderStatusBadgeComponent } from '../../shared/components/order-status-badge/order-status-badge.component';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { take } from 'rxjs';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterModule, OrderStatusBadgeComponent],
  templateUrl: './orders.component.html'
})
export class OrdersComponent implements OnInit {
  private orderService = inject(OrderService);
  private toastService = inject(ToastService);
  private confirmService = inject(ConfirmService);

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
      next: (response: any) => {
        // Handle both paginated (response.content) and simple array responses
        let ordersList: Order[] = [];
        if (Array.isArray(response)) {
          ordersList = response;
          this.totalPages = 1;
        } else {
          ordersList = response.content ?? [];
          this.totalPages = response.totalPages ?? 0;
        }
        
        // Map orderId to id if needed (backend returns orderId)
        this.orders = ordersList.map((order: any) => ({
          ...order,
          id: order.id ?? order.orderId
        }));
        
        this.currentPage = page;
        this.loading = false;
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || err?.message || 'Unable to load your orders.');
        this.loading = false;
      }
    });
  }

  cancelOrder(order: Order): void {
    if (!this.canCancelOrder(order)) {
      this.toastService.error(`Cannot cancel orders with status: ${order.status}`);
      return;
    }

    this.confirmService.confirm({
      title: 'Cancel Order',
      message: `Are you sure you want to cancel order ${order.orderNumber}?`,
      confirmText: 'Yes, Cancel',
      type: 'warning'
    }).pipe(take(1)).subscribe(confirmed => {
      if (confirmed) {
        this.isCancelling = true;
        this.cancellingOrderId = order.id;

        this.orderService.cancelOrder(order.id).subscribe({
          next: (updatedOrder) => {
            const normalizedOrder = this.normalizeOrder(updatedOrder);

            this.toastService.success(`Order ${normalizedOrder.orderNumber} has been cancelled.`);
            this.orders = this.orders.map((entry) => entry.id === normalizedOrder.id ? normalizedOrder : entry);
            this.isCancelling = false;
            this.cancellingOrderId = null;
          },
          error: (err) => {
            this.toastService.error(err?.error?.message || err?.message || 'Unable to cancel the order.');
            this.isCancelling = false;
            this.cancellingOrderId = null;
          }
        });
      }
    });
  }

  canCancelOrder(order: Order): boolean {
    // Cannot cancel if order is already processing, shipped, delivered, confirmed, cancelled, or refunded
    const nonCancellableStatuses = ['PROCESSING', 'SHIPPING', 'SHIPPED', 'DELIVERED', 'CONFIRMED', 'CANCELLED', 'REFUNDED'];
    return !nonCancellableStatuses.includes(order.status);
  }

  formatCurrency(value: number | undefined | null): string {
    return (value ?? 0).toFixed(2);
  }

  private normalizeOrder(order: any): Order {
    return {
      ...order,
      id: order.id ?? order.orderId,
      createdAt: order.createdAt ?? order.orderDate
    };
  }
}
