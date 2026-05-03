import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { AddressService } from '../../core/services/address.service';
import { Cart } from '../../core/models/cart.models';
import { Address } from '../../core/models/address.models';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss'
})
export class CheckoutComponent implements OnInit, OnDestroy {
  private cartService = inject(CartService);
  private orderService = inject(OrderService);
  private addressService = inject(AddressService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  cart: Cart | null = null;
  addresses: Address[] = [];
  selectedAddressId: number | null = null;
  isLoadingCart = true;
  isLoadingAddresses = true;
  isPlacingOrder = false;
  isAddressModalOpen = false;
  errorMessage = '';
  successMessage = '';
  currentStep: 'address' | 'review' | 'confirmation' = 'address';

  addressForm = this.fb.nonNullable.group({
    street: ['', [Validators.required]],
    city: ['', [Validators.required]],
    postalCode: ['', [Validators.required]],
    country: ['', [Validators.required]]
  });

  ngOnInit() {
    this.loadCartAndAddresses();
  }

  private loadCartAndAddresses() {
    // Load cart
    this.cartService.getCart().subscribe({
      next: (cart) => {
        this.cart = this.ensureShippingFee(cart);
        this.isLoadingCart = false;
        if (!cart.items || cart.items.length === 0) {
          this.errorMessage = 'Your cart is empty. Redirecting...';
          setTimeout(() => this.router.navigate(['/cart']), 2000);
        }
      },
      error: () => {
        this.errorMessage = 'Failed to load cart';
        this.isLoadingCart = false;
      }
    });

    // Load addresses
    this.addressService.getAddresses().subscribe({
      next: (addresses) => {
        this.addresses = addresses;
        const defaultAddress = addresses.find(a => a.defaultAddress);
        if (defaultAddress) {
          this.selectedAddressId = defaultAddress.id;
        }
        this.isLoadingAddresses = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load addresses';
        this.isLoadingAddresses = false;
      }
    });
  }

  // Ensure cart contains a shipping fee (default $10) when backend doesn't provide one
  private ensureShippingFee(cart: Cart | null): Cart | null {
    if (!cart) return cart;
    if (cart.shippingFee == null || cart.shippingFee === 0) {
      const shipping = 10;
      const total = (cart.total ?? 0) + shipping;
      const totalTTC = (cart.totalTTC ?? 0) + shipping;
      return { ...cart, shippingFee: shipping, total, totalTTC };
    }
    return cart;
  }

  getShippingFee(): number {
    return this.cart?.shippingFee ?? 10;
  }

  getCalculatedTotal(): number {
    if (!this.cart) return 0;
    const subtotal = this.cart.subtotal ?? 0;
    const discount = this.cart.discount ?? 0;
    const shipping = this.getShippingFee();
    return subtotal - discount + shipping;
  }

  getItemName(item: any): string {
    return item.product?.name || item.productName || 'Product';
  }

  getItemPrice(item: any): number {
    return item.product?.price ?? item.unitPrice ?? item.price ?? 0;
  }

  getItemLineTotal(item: any): number {
    const price = this.getItemPrice(item);
    const quantity = item.quantity ?? 1;
    return price * quantity;
  }

  openAddressModal() {
    this.isAddressModalOpen = true;
    this.addressForm.reset();
  }

  closeAddressModal() {
    this.isAddressModalOpen = false;
  }

  selectAddress(id: number) {
    this.selectedAddressId = id;
    this.currentStep = 'review';
  }

  addNewAddress() {
    if (this.addressForm.invalid) {
      this.errorMessage = 'Please fill in all address fields';
      return;
    }

    this.addressService.addAddress(this.addressForm.getRawValue()).subscribe({
      next: (newAddress) => {
        this.addresses = [...this.addresses, newAddress];
        this.selectedAddressId = newAddress.id;
        this.addressForm.reset();
        this.isAddressModalOpen = false;
        this.currentStep = 'review';
        this.successMessage = 'Address added successfully';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to add address';
      }
    });
  }

  goToPlaceOrder() {
    if (!this.selectedAddressId) {
      this.errorMessage = 'Please select an address';
      return;
    }
    this.placeOrder();
  }

  placeOrder() {
    if (!this.selectedAddressId || !this.cart) {
      this.errorMessage = 'Invalid order information';
      return;
    }

    this.isPlacingOrder = true;
    this.errorMessage = '';

    this.orderService.placeOrder({
      addressId: this.selectedAddressId,
      couponCode: this.cart.couponCode || undefined
    }).subscribe({
      next: (order) => {
        this.isPlacingOrder = false;
        this.currentStep = 'confirmation';
        this.successMessage = `Order ${order.orderNumber} placed successfully!`;
        this.cartService.clearCart();
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 5000);
      },
      error: (err) => {
        this.isPlacingOrder = false;
        this.errorMessage = err?.error?.message || 'Failed to place order';
      }
    });
  }

  cancelCheckout() {
    this.router.navigate(['/cart']);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
