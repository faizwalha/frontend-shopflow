import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { take } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { CategoryService } from '../../core/services/category.service';
import { ProductService } from '../../core/services/product.service';
import { OrderService } from '../../core/services/order.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { ToastService } from '../../core/services/toast.service';
import { AdminUserService } from '../../core/services/admin-user.service';
import { AdminUser } from '../../core/models/user.models';
import { ConfirmService } from '../../core/services/confirm.service';
import { CategoryRequest, CategoryResponse } from '../../core/models/category.models';
import { ProductRequest, ProductResponse } from '../../core/models/product.models';
import { AdminDashboardResponse, SellerDashboardResponse } from '../../core/models/dashboard.models';
import { Order, OrderStatus } from '../../core/models/order.models';

type DashboardSection = 'overview' | 'products' | 'categories' | 'customers';
type ChartPeriod = 'daily' | 'weekly' | 'monthly';
type NotificationTone = 'info' | 'success' | 'warning';

interface DashboardNavItem {
  section: DashboardSection;
  label: string;
  description: string;
  icon: 'overview' | 'products' | 'categories' | 'customers';
  adminOnly?: boolean;
}

interface DashboardNotification {
  id: number;
  title: string;
  message: string;
  tone: NotificationTone;
  time: string;
  unread: boolean;
}

interface ChartPoint {
  label: string;
  value: number;
}

interface OverviewMetric {
  label: string;
  value: string;
  detail: string;
  accent: string;
}

interface CustomerSummary {
  customerId: number;
  displayName: string;
  email: string;
  orderCount: number;
  lifetimeValue: number;
  lastOrderDate: string;
  lastStatus: OrderStatus;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private categoryService = inject(CategoryService);
  private productService = inject(ProductService);
  private orderService = inject(OrderService);
  private dashboardService = inject(DashboardService);
  private toastService = inject(ToastService);
  private adminUserService = inject(AdminUserService);
  private confirmService = inject(ConfirmService);

  readonly currentUser$ = this.authService.currentUser$;
  readonly navItems: DashboardNavItem[] = [
    { section: 'overview', label: 'Overview', description: 'Daily performance snapshot', icon: 'overview' },
    { section: 'products', label: 'Products', description: 'Catalog and merchandising', icon: 'products' },
    { section: 'categories', label: 'Categories', description: 'Collection structure', icon: 'categories', adminOnly: true },
    { section: 'customers', label: 'Customers', description: 'Buyer activity summary', icon: 'customers', adminOnly: true }
  ];

  readonly orderStatuses: OrderStatus[] = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
  readonly chartPeriods: ChartPeriod[] = ['daily', 'weekly', 'monthly'];
  readonly sectionMeta: Record<DashboardSection, { title: string; description: string }> = {
    overview: {
      title: 'Overview',
      description: 'Track sales, fulfillment, inventory, and customer activity in one place.'
    },
    products: {
      title: 'Product Management',
      description: 'Search, add, edit, and remove catalog items with confidence.'
    },
    categories: {
      title: 'Category Management',
      description: 'Keep the catalog structure clean and easy to navigate.'
    },
    customers: {
      title: 'Customers',
      description: 'Review purchasing activity and high-value buyers.'
    }
  };

  categories: CategoryResponse[] = [];
  products: ProductResponse[] = [];
  orders: Order[] = [];
  selectedCategory: CategoryResponse | null = null;
  selectedProduct: ProductResponse | null = null;
  selectedOrder: Order | null = null;
  selectedOrderStatus: OrderStatus = 'PENDING';
  isProductModalOpen = false;
  isCategoryModalOpen = false;

  adminStats: AdminDashboardResponse | null = null;
  sellerStats: SellerDashboardResponse | null = null;

  activeSection: DashboardSection = 'overview';
  selectedChartPeriod: ChartPeriod = 'weekly';
  searchQuery = '';
  isDarkMode = false;
  isNotificationsOpen = false;
  productPageIndex = 0;
  categoryPageIndex = 0;
  orderPageIndex = 0;
  customerPageIndex = 0;
  selectedRoleFilter: string | null = null;

  notifications: DashboardNotification[] = [];

  loadingStats = false;
  loadingCategories = false;
  loadingProducts = false;
  loadingOrders = false;
  loadingUsers = false;

  statsError = '';
  categoryError = '';
  productError = '';
  orderError = '';
  successMessage = '';

  adminUsers: AdminUser[] = [];

  categoryForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    description: [''],
    parentId: [null as number | null]
  });

  productForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    description: ['', [Validators.required]],
    price: [0, [Validators.required, Validators.min(0)]],
    promoPrice: [null as number | null],
    stock: [0, [Validators.required, Validators.min(0)]],
    images: [''],
    categoryId: [null as number | null]
  });

  private readonly chartTemplates: Record<ChartPeriod, ChartPoint[]> = {
    daily: [
      { label: 'Mon', value: 38 },
      { label: 'Tue', value: 54 },
      { label: 'Wed', value: 46 },
      { label: 'Thu', value: 61 },
      { label: 'Fri', value: 58 },
      { label: 'Sat', value: 73 },
      { label: 'Sun', value: 64 }
    ],
    weekly: [
      { label: 'W1', value: 120 },
      { label: 'W2', value: 168 },
      { label: 'W3', value: 142 },
      { label: 'W4', value: 190 }
    ],
    monthly: [
      { label: 'Jan', value: 860 },
      { label: 'Feb', value: 920 },
      { label: 'Mar', value: 1010 },
      { label: 'Apr', value: 1240 },
      { label: 'May', value: 1120 },
      { label: 'Jun', value: 1360 }
    ]
  };

  ngOnInit(): void {
    this.restoreThemePreference();
    this.currentUser$.pipe(take(1)).subscribe(user => {
      if (user && (user.role === 'ADMIN' || user.role === 'SELLER')) {
        this.loadStats();
        this.loadCategories();
        this.loadProducts();
        this.loadOrders();
        if (this.isAdmin(user.role)) {
          this.loadAdminUsers();
        }
      } else if (user && user.role === 'CUSTOMER') {
        // For customers, we might only want to load their stats or orders if the dashboard is used as profile
        this.loadCustomerData();
      }
    });
  }

  private loadCustomerData(): void {
    this.loadingOrders = true;
    this.orderService.getMyOrders(0, 10).subscribe({
      next: (response: any) => {
        if (Array.isArray(response)) {
          this.orders = response;
        } else {
          this.orders = response.content ?? [];
        }
        this.loadingOrders = false;
      },
      error: () => {
        this.orderError = 'Unable to load your orders.';
        this.loadingOrders = false;
      }
    });
  }

  loadStats(): void {
    this.loadingStats = true;
    this.currentUser$.pipe(take(1)).subscribe(user => {
      if (!user) {
        this.loadingStats = false;
        return;
      }

      if (this.isAdmin(user.role)) {
        this.dashboardService.getAdminDashboard().subscribe({
          next: (stats: AdminDashboardResponse) => {
            this.adminStats = stats;
            this.loadingStats = false;
            this.refreshNotifications();
          },
          error: () => {
            this.statsError = 'Unable to load dashboard statistics.';
            this.loadingStats = false;
          }
        });
        return;
      }

      if (user.role === 'SELLER') {
        this.dashboardService.getSellerDashboard().subscribe({
          next: (stats: SellerDashboardResponse) => {
            this.sellerStats = stats;
            this.loadingStats = false;
            this.refreshNotifications();
          },
          error: () => {
            this.statsError = 'Unable to load dashboard statistics.';
            this.loadingStats = false;
          }
        });
        return;
      }

      this.loadingStats = false;
    });
  }

  isAdmin(role: string | null | undefined): boolean {
    return role === 'ADMIN';
  }

  canAccessSection(section: DashboardSection, role: string | null | undefined): boolean {
    if (section === 'customers') {
      return this.isAdmin(role);
    }

    return true;
  }

  setActiveSection(section: DashboardSection): void {
    this.activeSection = section;
    this.isNotificationsOpen = false;
  }

  setChartPeriod(period: ChartPeriod): void {
    this.selectedChartPeriod = period;
  }

  onSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value ?? '';
    this.searchQuery = value;
    this.productPageIndex = 0;
    this.categoryPageIndex = 0;
    this.orderPageIndex = 0;
    this.customerPageIndex = 0;
  }

  onRoleFilterChange(): void {
    this.customerPageIndex = 0;
  }

  clearSearch(): void {
    this.searchQuery = '';
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    this.persistThemePreference();
  }

  toggleNotifications(): void {
    this.isNotificationsOpen = !this.isNotificationsOpen;
  }

  markAllNotificationsRead(): void {
    this.notifications = this.notifications.map(notification => ({ ...notification, unread: false }));
  }

  markNotificationRead(id: number): void {
    this.notifications = this.notifications.map(notification => (
      notification.id === id ? { ...notification, unread: false } : notification
    ));
  }

  loadCategories(): void {
    this.loadingCategories = true;
    this.categoryService.getAllCategories().subscribe({
      next: (categories) => {
        this.categories = (categories ?? []).sort((left, right) => left.name.localeCompare(right.name));
        this.loadingCategories = false;
        this.refreshNotifications();
      },
      error: () => {
        this.toastService.error('Unable to load categories.');
        this.loadingCategories = false;
      }
    });
  }

  loadProducts(): void {
    this.loadingProducts = true;
    this.productService.getAllProducts(0, 50).subscribe({
      next: (page) => {
        this.products = (page.content ?? []).sort((left, right) => left.name.localeCompare(right.name));
        this.loadingProducts = false;
        this.refreshNotifications();
      },
      error: () => {
        this.toastService.error('Unable to load products.');
        this.loadingProducts = false;
      }
    });
  }

  loadOrders(): void {
    this.loadingOrders = true;
    const user = this.authService.getCurrentUser();

    // Use /api/orders for Admin, but /api/orders/seller for Sellers (avoids empty list)
    const request$ = ((user?.role === 'ADMIN')
      ? this.orderService.getAllOrders(0, 50)
      : this.orderService.getSellerOrders()) as any;

    request$.subscribe({
      next: (response: any) => {
        let orderList: Order[] = [];
        if (Array.isArray(response)) {
          orderList = response;
        } else if (response && response.content) {
          orderList = response.content;
        }

        this.orders = orderList.slice().sort((left, right) => this.toTime(right.createdAt) - this.toTime(left.createdAt));
        this.loadingOrders = false;
        this.refreshNotifications();
      },
      error: () => {
        this.toastService.error('Unable to load orders.');
        this.loadingOrders = false;
      }
    });
  }

  loadAdminUsers(): void {
    this.loadingUsers = true;
    this.adminUserService.listUsers().subscribe({
      next: (users) => {
        this.adminUsers = users.map(user => {
          // Build displayName from available fields
          if (!user.displayName) {
            if (user.firstName && user.lastName) {
              user.displayName = `${user.firstName} ${user.lastName}`;
            } else {
              user.displayName = `User #${user.id}`;
            }
          }
          
          // Ensure roles is an array
          if (!user.roles && user.role) {
            user.roles = [user.role];
          } else if (!user.roles) {
            user.roles = [];
          }
          
          return user;
        });
        this.loadingUsers = false;
      },
      error: () => {
        this.toastService.error('Unable to load users.');
        this.loadingUsers = false;
      }
    });
  }

  setUserActive(user: AdminUser, active: boolean): void {
    this.confirmService.confirm({
      title: `${active ? 'Activate' : 'Deactivate'} user`,
      message: `Are you sure you want to ${active ? 'activate' : 'deactivate'} ${user.email}?`,
      confirmText: active ? 'Activate' : 'Deactivate'
    }).pipe(take(1)).subscribe(confirmed => {
      if (!confirmed) return;
      this.adminUserService.setActive(user.id, active).subscribe({
        next: (updated) => {
          this.toastService.success(`User ${updated.email} updated.`);
          this.loadAdminUsers();
        },
        error: () => this.toastService.error('Unable to update user.')
      });
    });
  }

  removeUser(user: AdminUser): void {
    this.confirmService.confirm({
      title: 'Delete user',
      message: `Delete user ${user.email}? This cannot be undone.`,
      confirmText: 'Delete',
      type: 'danger'
    }).pipe(take(1)).subscribe(confirmed => {
      if (!confirmed) return;
      this.adminUserService.deleteUser(user.id).subscribe({
        next: () => {
          this.toastService.success('User deleted.');
          this.loadAdminUsers();
        },
        error: () => this.toastService.error('Unable to delete user.')
      });
    });
  }

  startEdit(category: CategoryResponse): void {
    this.selectedCategory = category;
    this.categoryForm.patchValue({
      name: category.name,
      description: category.description ?? '',
      parentId: category.parentId ?? null
    });
    this.isCategoryModalOpen = true;
    this.setActiveSection('categories');
  }

  openCreateCategoryModal(): void {
    this.clearForm();
    this.isCategoryModalOpen = true;
    this.setActiveSection('categories');
  }

  clearForm(): void {
    this.selectedCategory = null;
    this.categoryForm.reset({
      name: '',
      description: '',
      parentId: null
    });
    this.isCategoryModalOpen = false;
  }

  startEditProduct(product: ProductResponse): void {
    this.selectedProduct = product;
    let categoryId: number | null = null;

    if (product.categories.length > 0 && this.categories.length > 0) {
      const categoryName = product.categories[0];
      const foundCategory = this.categories.find(category => category.name === categoryName);
      categoryId = foundCategory?.id ?? null;
    }

    this.productForm.patchValue({
      name: product.name,
      description: product.description ?? '',
      price: product.price,
      promoPrice: product.promoPrice ?? null,
      stock: product.stock ?? 0,
      images: product.images?.join(', ') ?? '',
      categoryId
    });
    this.isProductModalOpen = true;
    this.setActiveSection('products');
  }

  openCreateProductModal(): void {
    this.clearProductForm();
    this.isProductModalOpen = true;
    this.setActiveSection('products');
  }

  clearProductForm(): void {
    this.selectedProduct = null;
    this.productForm.reset({
      name: '',
      description: '',
      price: 0,
      promoPrice: null,
      stock: 0,
      images: '',
      categoryId: null
    });
    this.isProductModalOpen = false;
  }

  saveProduct(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    const formValue = this.productForm.getRawValue();
    const payload: ProductRequest = {
      name: formValue.name,
      description: formValue.description,
      price: formValue.price,
      promoPrice: formValue.promoPrice ?? undefined,
      stock: formValue.stock,
      images: formValue.images
        ? formValue.images.split(',').map((image: string) => image.trim()).filter((image: string) => image)
        : undefined,
      categoryIds: formValue.categoryId ? [formValue.categoryId] : undefined
    };

    const request$ = this.selectedProduct
      ? this.productService.updateProduct(this.selectedProduct.id, payload)
      : this.productService.createProduct(payload);

    request$.subscribe({
      next: () => {
        this.toastService.success(this.selectedProduct ? 'Product updated.' : 'Product created.');
        this.clearProductForm();
        this.loadProducts();
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || err?.message || 'Product save failed.');
      }
    });
  }

  removeProduct(product: ProductResponse): void {
    this.confirmService.confirm({
      title: 'Delete Product',
      message: `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      type: 'danger'
    }).pipe(take(1)).subscribe(confirmed => {
      if (confirmed) {
        this.productService.deleteProduct(product.id).subscribe({
          next: () => {
            this.toastService.success('Product deleted.');
            this.loadProducts();
          },
          error: (err) => {
            this.toastService.error(err?.error?.message || err?.message || 'Product deletion failed.');
          }
        });
      }
    });
  }

  toggleProductStatus(product: ProductResponse): void {
    const payload: ProductRequest = {
      name: product.name,
      description: product.description,
      price: product.price,
      promoPrice: product.promoPrice ?? undefined,
      stock: product.stock,
      active: !product.active,
      images: product.images,
      categoryIds: this.resolveCategoryIds(product)
    };

    this.productService.updateProduct(product.id, payload).subscribe({
      next: () => {
        this.toastService.success(`${product.name} ${product.active ? 'deactivated' : 'activated'}.`);
        this.loadProducts();
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || err?.message || 'Product status update failed.');
      }
    });
  }

  updateInventoryStock(product: ProductResponse, stockInputValue: number): void {
    const stock = Number.isFinite(stockInputValue) ? Math.max(0, Math.trunc(stockInputValue)) : product.stock;
    const payload: ProductRequest = {
      name: product.name,
      description: product.description,
      price: product.price,
      promoPrice: product.promoPrice ?? undefined,
      stock,
      images: product.images,
      categoryIds: this.resolveCategoryIds(product)
    };

    this.productService.updateProduct(product.id, payload).subscribe({
      next: () => {
        this.toastService.success(`Updated stock for ${product.name}.`);
        this.loadProducts();
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || err?.message || 'Inventory update failed.');
      }
    });
  }

  saveCategory(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    const payload: CategoryRequest = this.categoryForm.getRawValue();
    const request$ = this.selectedCategory
      ? this.categoryService.updateCategory(this.selectedCategory.id, payload)
      : this.categoryService.createCategory(payload);

    request$.subscribe({
      next: () => {
        this.toastService.success(this.selectedCategory ? 'Category updated.' : 'Category created.');
        this.clearForm();
        this.loadCategories();
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || err?.message || 'Category save failed.');
      }
    });
  }

  removeCategory(category: CategoryResponse): void {
    this.confirmService.confirm({
      title: 'Delete Category',
      message: `Are you sure you want to delete "${category.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      type: 'danger'
    }).pipe(take(1)).subscribe(confirmed => {
      if (confirmed) {
        this.categoryService.deleteCategory(category.id).subscribe({
          next: () => {
            this.toastService.success('Category deleted.');
            this.loadCategories();
          },
          error: (err) => {
            this.toastService.error(err?.error?.message || err?.message || 'Category deletion failed.');
          }
        });
      }
    });
  }

  openOrderDetails(order: Order): void {
    this.selectedOrder = order;
    this.selectedOrderStatus = order.status;
    this.isNotificationsOpen = false;
  }

  closeOrderDetails(): void {
    this.selectedOrder = null;
  }

  updateSelectedOrderStatus(): void {
    if (!this.selectedOrder) {
      return;
    }

    this.orderService.updateOrderStatus(this.selectedOrder.id, this.selectedOrderStatus).subscribe({
      next: (updatedOrder) => {
        this.selectedOrder = updatedOrder;
        this.orders = this.orders.map(order => order.id === updatedOrder.id ? updatedOrder : order);
        this.toastService.success(`Order ${updatedOrder.orderNumber} updated.`);
        this.refreshNotifications();
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || err?.message || 'Order update failed.');
      }
    });
  }

  setOrderStatus(order: Order, status: OrderStatus): void {
    this.selectedOrder = order;
    this.selectedOrderStatus = status;
    this.updateSelectedOrderStatus();
  }

  get overviewMetrics(): OverviewMetric[] {
    const user = this.authService.getCurrentUser();
    const isSeller = user?.role === 'SELLER';

    const revenue = this.adminStats?.totalRevenue ?? this.sellerStats?.totalRevenue ?? this.orders.reduce((sum, order) => sum + order.totalTTC, 0);
    const orderCount = this.adminStats?.totalOrders ?? this.orders.length;

    let productsList = this.products;
    if (isSeller && user?.userId) {
      productsList = productsList.filter(p => {
        const sid = p.sellerId ?? (p as any).userId ?? (p as any).ownerId ?? (p as any).seller?.id;
        return sid == user.userId;
      });
    }
    const productCount = this.adminStats?.totalProducts ?? productsList.length;
    const customerCount = this.adminStats?.totalUsers ?? this.customerSummaries.length;

    return [
      {
        label: 'Total Sales',
        value: `$${revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        detail: this.isDarkMode ? 'Dark mode enabled for focused work.' : 'Live revenue across all sales channels.',
        accent: 'accent-violet'
      },
      {
        label: 'Orders',
        value: orderCount.toString(),
        detail: `${this.pendingOrdersCount} pending for fulfillment`,
        accent: 'accent-violet'
      },
      {
        label: 'Products',
        value: productCount.toString(),
        detail: `${this.lowStockProducts.length} low stock alerts`,
        accent: 'accent-emerald'
      },
      {
        label: 'Customers',
        value: customerCount.toString(),
        detail: `${this.customerSummaries.length} active buyers from recent orders`,
        accent: 'accent-amber'
      }
    ];
  }

  get filteredProducts(): ProductResponse[] {
    const query = this.searchQuery.trim().toLowerCase();
    const user = this.authService.getCurrentUser();
    let list = this.products;

    if (user?.role === 'SELLER' && user.userId) {
      list = list.filter(p => {
        const sid = p.sellerId ?? (p as any).userId ?? (p as any).ownerId ?? (p as any).seller?.id;
        return sid == user.userId;
      });
    }

    return list.filter(product => this.matchesProductQuery(product, query));
  }

  get filteredCategories(): CategoryResponse[] {
    const query = this.searchQuery.trim().toLowerCase();
    return this.categories.filter(category => this.matchesCategoryQuery(category, query));
  }

  get filteredOrders(): Order[] {
    const query = this.searchQuery.trim().toLowerCase();
    return this.orders.filter(order => this.matchesOrderQuery(order, query));
  }

  get customerSummaries(): CustomerSummary[] {
    const summaries = new Map<number, CustomerSummary>();

    for (const order of this.orders) {
      const current = summaries.get(order.customerId) ?? {
        customerId: order.customerId,
        displayName: `Customer #${order.customerId}`,
        email: `customer${order.customerId}@shopflow.local`,
        orderCount: 0,
        lifetimeValue: 0,
        lastOrderDate: order.createdAt,
        lastStatus: order.status
      };

      current.orderCount += 1;
      current.lifetimeValue += order.totalTTC;

      if (this.toTime(order.createdAt) >= this.toTime(current.lastOrderDate)) {
        current.lastOrderDate = order.createdAt;
        current.lastStatus = order.status;
      }

      summaries.set(order.customerId, current);
    }

    return Array.from(summaries.values())
      .sort((left, right) => right.lifetimeValue - left.lifetimeValue);
  }

  get filteredCustomerSummaries(): CustomerSummary[] {
    const query = this.searchQuery.trim().toLowerCase();
    const allSummaries = this.customerSummaries;

    if (!query) {
      return allSummaries;
    }

    return allSummaries.filter(customer =>
      customer.displayName.toLowerCase().includes(query) ||
      customer.email.toLowerCase().includes(query) ||
      customer.customerId.toString().includes(query)
    );
  }

  get filteredAdminUsers(): AdminUser[] {
    const query = this.searchQuery.trim().toLowerCase();
    let filtered = this.adminUsers;

    // Filter by role if selected
    if (this.selectedRoleFilter) {
      filtered = filtered.filter(user =>
        user.roles?.some(role => role.toUpperCase() === this.selectedRoleFilter?.toUpperCase())
      );
    }

    // Filter by search query
    if (!query) {
      return filtered;
    }

    return filtered.filter(user =>
      (user.displayName?.toLowerCase() ?? '').includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.id.toString().includes(query)
    );
  }

  get visibleAdminUsers(): AdminUser[] {
    return this.paginate(this.filteredAdminUsers, this.customerPageIndex, 8);
  }

  get lowStockProducts(): ProductResponse[] {
    const user = this.authService.getCurrentUser();
    let list = this.products.filter(product =>
      this.getProductStockStatus(product) === 'Low stock' ||
      this.getProductStockStatus(product) === 'Out of stock'
    );

    if (user?.role === 'SELLER' && user.userId) {
      list = list.filter(p => {
        const sid = p.sellerId ?? (p as any).userId ?? (p as any).ownerId ?? (p as any).seller?.id;
        return sid == user.userId;
      });
    }

    return list;
  }

  get filteredInventoryProducts(): ProductResponse[] {
    return this.filteredProducts;
  }

  get pendingOrdersCount(): number {
    return this.orders.filter(order => order.status === 'PENDING' || order.status === 'PAID' || order.status === 'PROCESSING').length;
  }

  get productPageCount(): number {
    return Math.max(1, Math.ceil(this.filteredProducts.length / 8));
  }

  get categoryPageCount(): number {
    return Math.max(1, Math.ceil(this.filteredCategories.length / 8));
  }

  get orderPageCount(): number {
    return Math.max(1, Math.ceil(this.filteredOrders.length / 6));
  }

  get customerPageCount(): number {
    const user = this.authService.getCurrentUser();
    const isAdmin = this.isAdmin(user?.role);
    const itemCount = isAdmin ? this.filteredAdminUsers.length : this.filteredCustomerSummaries.length;
    return Math.max(1, Math.ceil(itemCount / 8));
  }

  get visibleProducts(): ProductResponse[] {
    return this.paginate(this.filteredProducts, this.productPageIndex, 8);
  }

  get visibleCategories(): CategoryResponse[] {
    return this.paginate(this.filteredCategories, this.categoryPageIndex, 8);
  }

  get visibleOrders(): Order[] {
    return this.paginate(this.filteredOrders, this.orderPageIndex, 6);
  }

  get visibleCustomers(): CustomerSummary[] {
    return this.paginate(this.filteredCustomerSummaries, this.customerPageIndex, 8);
  }

  get chartSeries(): ChartPoint[] {
    const rawSeries = this.chartTemplates[this.selectedChartPeriod];
    const scaleBase = Math.max(
      this.adminStats?.totalRevenue ?? 0,
      this.sellerStats?.totalRevenue ?? 0,
      this.orders.reduce((sum, order) => sum + order.totalTTC, 0)
    );
    const scale = scaleBase > 0 ? Math.max(1, scaleBase / 1000) : 1;

    return rawSeries.map((point, index) => ({
      label: point.label,
      value: Math.max(12, Math.round(point.value * scale * (0.9 + index * 0.03)))
    }));
  }

  get chartMaxValue(): number {
    return Math.max(...this.chartSeries.map(point => point.value), 1);
  }

  get chartLinePoints(): string {
    const chartWidth = 320;
    const chartHeight = 140;
    const step = this.chartSeries.length > 1 ? chartWidth / (this.chartSeries.length - 1) : chartWidth;

    return this.chartSeries
      .map((point, index) => {
        const x = Math.round(index * step);
        const y = Math.round(chartHeight - (point.value / this.chartMaxValue) * chartHeight);
        return `${x},${y}`;
      })
      .join(' ');
  }

  getStatusBarWidth(value: number): number {
    const totalOrders = Math.max(1, this.orders.length);
    return Math.max(8, Math.round((value / totalOrders) * 100));
  }

  get orderStatusBreakdown(): Array<{ label: string; value: number; tone: string }> {
    return [
      { label: 'Pending', value: this.orders.filter(order => order.status === 'PENDING').length, tone: 'tone-amber' },
      { label: 'Processing', value: this.orders.filter(order => order.status === 'PROCESSING').length, tone: 'tone-violet' },
      { label: 'Shipped', value: this.orders.filter(order => order.status === 'SHIPPED').length, tone: 'tone-fuchsia' },
      { label: 'Delivered', value: this.orders.filter(order => order.status === 'DELIVERED').length, tone: 'tone-emerald' }
    ];
  }

  get visibleNotificationCount(): number {
    return this.notifications.filter(notification => notification.unread).length;
  }

  get activeSectionTitle(): string {
    return this.sectionMeta[this.activeSection].title;
  }

  get activeSectionDescription(): string {
    return this.sectionMeta[this.activeSection].description;
  }

  get recentOrders(): Order[] {
    return this.filteredOrders.slice(0, 5);
  }

  get topSellers(): string[] {
    return this.adminStats?.topSellers ?? [];
  }

  nextPage(target: 'products' | 'categories' | 'orders' | 'customers'): void {
    if (target === 'products' && this.productPageIndex < this.productPageCount - 1) {
      this.productPageIndex += 1;
    }

    if (target === 'categories' && this.categoryPageIndex < this.categoryPageCount - 1) {
      this.categoryPageIndex += 1;
    }

    if (target === 'orders' && this.orderPageIndex < this.orderPageCount - 1) {
      this.orderPageIndex += 1;
    }

    if (target === 'customers' && this.customerPageIndex < this.customerPageCount - 1) {
      this.customerPageIndex += 1;
    }
  }

  previousPage(target: 'products' | 'categories' | 'orders' | 'customers'): void {
    if (target === 'products' && this.productPageIndex > 0) {
      this.productPageIndex -= 1;
    }

    if (target === 'categories' && this.categoryPageIndex > 0) {
      this.categoryPageIndex -= 1;
    }

    if (target === 'orders' && this.orderPageIndex > 0) {
      this.orderPageIndex -= 1;
    }

    if (target === 'customers' && this.customerPageIndex > 0) {
      this.customerPageIndex -= 1;
    }
  }

  private matchesProductQuery(product: ProductResponse, query: string): boolean {
    if (!query) {
      return true;
    }

    const haystack = [
      product.name,
      product.description,
      product.categories.join(' '),
      product.sellerName,
      product.stock?.toString() ?? '',
      product.active ? 'active' : 'inactive'
    ].join(' ').toLowerCase();

    return haystack.includes(query);
  }

  private matchesCategoryQuery(category: CategoryResponse, query: string): boolean {
    if (!query) {
      return true;
    }

    return [category.name, category.description ?? '', category.slug ?? '', category.parentId?.toString() ?? '']
      .join(' ')
      .toLowerCase()
      .includes(query);
  }

  private matchesOrderQuery(order: Order, query: string): boolean {
    if (!query) {
      return true;
    }

    return [
      order.orderNumber,
      order.status,
      order.customerId.toString(),
      order.totalTTC.toString(),
      order.address?.city ?? '',
      order.address?.country ?? ''
    ].join(' ').toLowerCase().includes(query);
  }

  private paginate<T>(items: T[], page: number, size: number): T[] {
    return items.slice(page * size, page * size + size);
  }

  private resolveCategoryIds(product: ProductResponse): number[] | undefined {
    if (product.categories.length === 0 || this.categories.length === 0) {
      return undefined;
    }

    const categoryId = this.categories.find(category => category.name === product.categories[0])?.id;
    return categoryId ? [categoryId] : undefined;
  }

  getProductStockStatus(product: ProductResponse): 'In stock' | 'Low stock' | 'Out of stock' {
    if (product.stock <= 0) {
      return 'Out of stock';
    }

    if (product.stock <= 10) {
      return 'Low stock';
    }

    return 'In stock';
  }

  private refreshNotifications(): void {
    const notifications: DashboardNotification[] = [];
    const lowStockCount = this.lowStockProducts.length;
    const pendingOrders = this.pendingOrdersCount;
    const topSeller = this.topSellers[0];

    if (lowStockCount > 0) {
      notifications.push({
        id: 1,
        title: 'Inventory alert',
        message: `${lowStockCount} product(s) need replenishment soon.`,
        tone: 'warning',
        time: 'Just now',
        unread: true
      });
    }

    if (pendingOrders > 0) {
      notifications.push({
        id: 2,
        title: 'Orders waiting',
        message: `${pendingOrders} order(s) are ready for review or fulfillment.`,
        tone: 'info',
        time: '5 min ago',
        unread: true
      });
    }

    if (topSeller) {
      notifications.push({
        id: 3,
        title: 'Top seller updated',
        message: `${topSeller} is leading the catalog this period.`,
        tone: 'success',
        time: 'Today',
        unread: false
      });
    }

    if (notifications.length === 0) {
      notifications.push({
        id: 4,
        title: 'Dashboard ready',
        message: 'Everything looks stable. Continue managing the store.',
        tone: 'success',
        time: 'Now',
        unread: false
      });
    }

    this.notifications = notifications;
  }

  private persistThemePreference(): void {
    try {
      localStorage.setItem('shopflow-dashboard-theme', this.isDarkMode ? 'dark' : 'light');
    } catch {
      // Ignore storage failures.
    }
  }

  private restoreThemePreference(): void {
    try {
      const storedTheme = localStorage.getItem('shopflow-dashboard-theme');
      this.isDarkMode = storedTheme === 'dark';
    } catch {
      this.isDarkMode = false;
    }
  }

  private toTime(value: string | undefined): number {
    return value ? new Date(value).getTime() : 0;
  }
}
