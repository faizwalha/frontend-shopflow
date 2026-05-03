import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { forkJoin, of, take } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { OrderService } from '../../core/services/order.service';
import { ReviewService } from '../../core/services/review.service';
import { ToastService } from '../../core/services/toast.service';
import { Order, OrderListResponse, OrderStatus } from '../../core/models/order.models';
import { Review, ReviewListResponse } from '../../core/models/review.models';
import { OrderStatusBadgeComponent } from '../../shared/components/order-status-badge/order-status-badge.component';

type DashboardSection = 'orders' | 'reviews';

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, OrderStatusBadgeComponent],
  templateUrl: './customer-dashboard.component.html',
  styleUrl: './customer-dashboard.component.scss'
})
export class CustomerDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private orderService = inject(OrderService);
  private reviewService = inject(ReviewService);
  private toastService = inject(ToastService);
  private confirmService = inject(ConfirmService);

  readonly currentUser$ = this.authService.currentUser$;
  readonly navItems = [
    { section: 'orders' as DashboardSection, label: 'Orders', description: 'Track your purchases and delivery status' },
    { section: 'reviews' as DashboardSection, label: 'Reviews', description: 'See the reviews you wrote for products' }
  ];

  activeSection: DashboardSection = 'orders';
  orders: Order[] = [];
  reviews: Review[] = [];

  loadingOrders = false;
  loadingReviews = false;
  orderError = '';
  reviewError = '';

  ordersPage = 0;
  ordersPageSize = 6;
  ordersTotalPages = 0;

  reviewsPage = 0;
  reviewsPageSize = 6;
  reviewsTotalPages = 0;

  isCancelling = false;
  cancellingOrderId: number | null = null;
  private currentUserId: number | null = null;
  private productNameById = new Map<number, string>();

  ngOnInit(): void {
    this.currentUser$.pipe(take(1)).subscribe(user => {
      this.currentUserId = user?.userId ?? null;
      if (user) {
        this.loadOrders(0);
        this.loadReviews();
      }
    });
  }

  setActiveSection(section: DashboardSection): void {
    this.activeSection = section;
    if (section === 'reviews' && this.reviews.length === 0) {
      this.loadReviews();
    }
  }

  loadOrders(page = 0): void {
    this.loadingOrders = true;
    this.orderError = '';

    this.orderService.getMyOrders(page, this.ordersPageSize).subscribe({
      next: (response: OrderListResponse | Order[] | any) => {
        const ordersList = Array.isArray(response) ? response : (response.content ?? []);
        this.orders = ordersList.map((order: any) => this.normalizeOrder(order));
        this.ordersTotalPages = Array.isArray(response) ? 1 : (response.totalPages ?? 0);
        this.ordersPage = page;
        this.loadingOrders = false;
        this.captureProductNamesFromOrders(this.orders);
      },
      error: (err) => {
        this.orderError = err?.error?.message || err?.message || 'Unable to load your orders.';
        this.loadingOrders = false;
      }
    });
  }

  loadReviews(): void {
    if (this.currentUserId == null) {
      this.reviewError = 'Unable to identify your account.';
      return;
    }

    this.loadingReviews = true;
    this.reviewError = '';

    this.orderService.getMyOrders(0, 100).subscribe({
      next: (response: OrderListResponse | Order[] | any) => {
        const ordersList = Array.isArray(response) ? response : (response.content ?? []);
        this.captureProductNamesFromOrders(ordersList.map((order: any) => this.normalizeOrder(order)));

        const productIds: number[] = Array.from(new Set(
          ordersList.flatMap((order: any) =>
            (order.items ?? [])
              .map((item: any) => Number(item.productId))
              .filter((productId: number) => Number.isFinite(productId) && productId > 0)
          )
        ));

        if (productIds.length === 0) {
          this.reviews = [];
          this.reviewsTotalPages = 0;
          this.loadingReviews = false;
          return;
        }

        const reviewRequests = productIds.map(productId =>
          this.reviewService.getProductReviews(productId, 0, 50).pipe(
            catchError(() => of({ content: [], totalPages: 0, totalElements: 0, currentPage: 0, size: 50 } as ReviewListResponse))
          )
        );

        forkJoin(reviewRequests).subscribe({
          next: (responses) => {
            const allReviews = responses
              .flatMap(response => response.content ?? [])
              .filter(review => review.customerId === this.currentUserId)
              .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());

            this.reviews = Array.from(new Map(allReviews.map(review => [review.id, review])).values());
            this.reviewsPage = 0;
            this.reviewsTotalPages = this.reviews.length > 0 ? Math.ceil(this.reviews.length / this.reviewsPageSize) : 0;
            this.loadingReviews = false;
          },
          error: (err) => {
            this.reviewError = err?.error?.message || err?.message || 'Unable to load your reviews.';
            this.loadingReviews = false;
          }
        });
      },
      error: (err) => {
        this.reviewError = err?.error?.message || err?.message || 'Unable to load your reviews.';
        this.loadingReviews = false;
      }
    });
  }

  previousOrdersPage(): void {
    if (this.ordersPage > 0) {
      this.loadOrders(this.ordersPage - 1);
    }
  }

  nextOrdersPage(): void {
    if (this.ordersPage < this.ordersTotalPages - 1) {
      this.loadOrders(this.ordersPage + 1);
    }
  }

  previousReviewsPage(): void {
    if (this.reviewsPage > 0) {
      this.reviewsPage -= 1;
    }
  }

  nextReviewsPage(): void {
    if (this.reviewsPage < this.reviewPageCount - 1) {
      this.reviewsPage += 1;
    }
  }

  cancelOrder(order: Order): void {
    if (!this.canCancelOrder(order)) {
      this.toastService.error(`Cannot cancel orders with status: ${order.status}`);
      return;
    }

    this.confirmService.confirm({
      title: 'Cancel Order',
      message: `Are you sure you want to cancel order ${order.orderNumber}?`,
      confirmText: 'Yes',
      cancelText: 'No',
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
    const nonCancellableStatuses: OrderStatus[] = ['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
    return !nonCancellableStatuses.includes(order.status);
  }

  formatCurrency(value: number | undefined | null): string {
    return (value ?? 0).toFixed(2);
  }

  getOrderItemName(item: any): string {
    return item.product?.name || item.productName || `Product #${item.productId}`;
  }

  getOrderItemLineTotal(item: any): number {
    const quantity = Number(item.quantity ?? 0);
    const unitPrice = Number(item.unitPrice ?? 0);
    return quantity * unitPrice;
  }

  get pagedReviews(): Review[] {
    const start = this.reviewsPage * this.reviewsPageSize;
    return this.reviews.slice(start, start + this.reviewsPageSize);
  }

  get reviewPageCount(): number {
    return this.reviewsTotalPages || (this.reviews.length > 0 ? Math.ceil(this.reviews.length / this.reviewsPageSize) : 0);
  }

  getReviewProductName(review: Review): string {
    return this.productNameById.get(review.productId) || `Product #${review.productId}`;
  }

  getRatingStars(rating: number): boolean[] {
    const safeRating = Math.max(0, Math.min(5, Math.round(rating ?? 0)));
    return Array.from({ length: 5 }, (_, index) => index < safeRating);
  }

  private captureProductNamesFromOrders(orders: Order[]): void {
    for (const order of orders) {
      for (const item of order.items ?? []) {
        if (item.product?.name) {
          this.productNameById.set(item.productId, item.product.name);
        }
      }
    }
  }

  private normalizeOrder(order: any): Order {
    return {
      ...order,
      id: order.id ?? order.orderId,
      createdAt: order.createdAt ?? order.orderDate,
      items: (order.items ?? []).map((item: any) => ({
        ...item,
        id: item.id ?? item.itemId ?? item.orderItemId
      }))
    };
  }
}