import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormControl, Validators } from '@angular/forms';
import { AdminCouponService } from '../../core/services/admin-coupon.service';
import { CouponResponse, CouponRequest, CouponType } from '../../core/models/coupon.models';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-admin-coupons',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-coupons.component.html'
})
export class AdminCouponsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private couponService = inject(AdminCouponService);
  private toast = inject(ToastService);

  coupons: CouponResponse[] = [];
  loading = false;
  formOpen = false;
  editing: CouponResponse | null = null;
  error: string = '';

  form = this.fb.group({
    code: ['', [Validators.required, Validators.maxLength(50)]],
    type: ['FIXED', [Validators.required]],
    value: [0, [Validators.required, Validators.min(0.01)]],
    expiryDate: ['', [Validators.required]],
    maxUsages: new FormControl<number | null>(null),
    active: [true]
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.couponService.listCoupons().subscribe({
      next: (c) => { this.coupons = c; this.loading = false; },
      error: (err) => { 
        const msg = err?.error?.message || err?.statusText || err?.message || 'Unable to load coupons';
        console.error('Coupon load error:', err);
        this.error = msg;
        this.toast.error(msg);
        this.loading = false;
      }
    });
  }

  openCreate(): void {
    this.editing = null;
    this.form.reset({ code: '', type: 'FIXED', value: 0, expiryDate: '', maxUsages: null, active: true });
    this.formOpen = true;
  }

  edit(coupon: CouponResponse): void {
    this.editing = coupon;
    this.form.setValue({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      expiryDate: coupon.expiryDate ?? '',
      maxUsages: coupon.maxUsages ?? null,
      active: coupon.active
    });
    this.formOpen = true;
  }

  save(): void {
    if (this.form.invalid) return;
    const raw = this.form.value;
    const payload: CouponRequest = {
      code: String(raw.code).trim(),
      type: raw.type as CouponType,
      value: Number(raw.value),
      expiryDate: raw.expiryDate as string,
      maxUsages: raw.maxUsages === null || raw.maxUsages === undefined ? null : Number(raw.maxUsages),
      active: !!raw.active
    };

    if (this.editing) {
      this.couponService.updateCoupon(this.editing.id, payload).subscribe({
        next: () => { this.toast.success('Coupon updated'); this.formOpen = false; this.load(); },
        error: (err) => this.toast.error(err?.error?.message || err?.message || 'Update failed')
      });
    } else {
      this.couponService.createCoupon(payload).subscribe({
        next: () => { this.toast.success('Coupon created'); this.formOpen = false; this.load(); },
        error: (err) => this.toast.error(err?.error?.message || err?.message || 'Create failed')
      });
    }
  }

  cancel(): void { this.formOpen = false; this.editing = null; }

  remove(id: number): void {
    if (!confirm('Delete this coupon?')) return;
    this.couponService.deleteCoupon(id).subscribe({
      next: () => { this.toast.success('Coupon deleted'); this.load(); },
      error: (err) => this.toast.error(err?.error?.message || err?.message || 'Delete failed')
    });
  }
}