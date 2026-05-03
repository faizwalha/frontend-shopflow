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
        this.order = this.normalizeOrder(response);
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
    // Cannot cancel if order is already processing, shipped, delivered, confirmed, cancelled, or refunded
    const nonCancellableStatuses = ['PROCESSING', 'SHIPPING', 'SHIPPED', 'DELIVERED', 'CONFIRMED', 'CANCELLED', 'REFUNDED'];
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
            this.order = this.normalizeOrder(updatedOrder);
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

  getOrderAddressLines(): string[] {
    if (!this.order?.address) {
      return ['Address not available'];
    }

    const address = this.order.address;
    const lines = [
      address.street,
      [address.city, address.postalCode].filter(Boolean).join(', '),
      address.country
    ].filter((line): line is string => Boolean(line && line.trim()));

    return lines.length > 0 ? lines : ['Address not available'];
  }

  getOrderItemName(item: any): string {
    return item.product?.name || item.productName || 'Unknown Product';
  }

  getOrderItemSellerName(item: any): string {
    const seller = item.seller || item.product?.seller || item.product?.sellerName;

    if (!seller) {
      return 'Seller: not available';
    }

    if (typeof seller === 'string') {
      return `Seller: ${seller}`;
    }

    const fullName = [seller.firstName, seller.lastName].filter(Boolean).join(' ').trim();
    return `Seller: ${fullName || seller.name || seller.email || 'not available'}`;
  }

  goBack(): void {
    this.router.navigate(['/orders']);
  }

  private normalizeOrder(order: any): Order {
    return {
      ...order,
      id: order.id ?? order.orderId,
      createdAt: order.createdAt ?? order.orderDate
    };
  }
}
