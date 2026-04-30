import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
import { Order } from '../../core/models/order.models';
import { OrderStatusBadgeComponent } from '../../shared/components/order-status-badge/order-status-badge.component';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { take } from 'rxjs';

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
  private toastService = inject(ToastService);
  private confirmService = inject(ConfirmService);

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
      next: (response: any) => {
        // Map orderId to id if needed (backend returns orderId)
        const order = {
          ...response,
          id: response.id ?? response.orderId
        };
        this.order = order;
        this.loading = false;
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || err?.message || 'Unable to load order details.');
        this.loading = false;
      }
    });
  }

  canCancelOrder(): boolean {
    if (!this.order) return false;
    // Cannot cancel if order is already shipped, delivered, confirmed, cancelled, or refunded
    const nonCancellableStatuses = ['SHIPPING', 'SHIPPED', 'DELIVERED', 'CONFIRMED', 'CANCELLED', 'REFUNDED'];
    return !nonCancellableStatuses.includes(this.order.status);
  }

  cancelOrder(): void {
    if (!this.order || !this.canCancelOrder()) {
      this.toastService.error(`Cannot cancel orders with status: ${this.order?.status}`);
      return;
    }

    this.confirmService.confirm({
      title: 'Cancel Order',
      message: `Are you sure you want to cancel order ${this.order.orderNumber}?`,
      confirmText: 'Yes, Cancel',
      type: 'warning'
    }).pipe(take(1)).subscribe(confirmed => {
      if (confirmed) {
        this.isCancelling = true;

        this.orderService.cancelOrder(this.order!.id).subscribe({
          next: (updatedOrder) => {
            this.order = updatedOrder;
            this.toastService.success('Order cancelled successfully.');
            this.isCancelling = false;
          },
          error: (err) => {
            this.toastService.error(err?.error?.message || err?.message || 'Unable to cancel order.');
            this.isCancelling = false;
          }
        });
      }
    });
  }

  formatCurrency(value: number | undefined | null): string {
    return (value ?? 0).toFixed(2);
  }

  goBack(): void {
    this.router.navigate(['/orders']);
  }
}
