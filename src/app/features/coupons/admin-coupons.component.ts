import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormControl, Validators } from '@angular/forms';
import { startWith } from 'rxjs';
import { AdminCouponService } from '../../core/services/admin-coupon.service';
import { CouponResponse, CouponRequest, CouponType } from '../../core/models/coupon.models';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-admin-coupons',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-coupons.component.html',
  styleUrls: ['./admin-coupons.component.scss']
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
    type: this.fb.nonNullable.control<CouponType>('FIXED', [Validators.required]),
    value: [0, [Validators.required, Validators.min(0.01)]],
    expiryDate: ['', [Validators.required]],
    maxUsages: new FormControl<number | null>(null),
    active: [true]
  });

  get isPercentageType(): boolean {
    return this.form.controls.type.value === 'PERCENTAGE';
  }

  ngOnInit(): void {
    this.setupValueValidationByType();
    this.load();
  }

  private setupValueValidationByType(): void {
    const typeControl = this.form.controls.type;
    const valueControl = this.form.controls.value;

    typeControl.valueChanges.pipe(startWith(typeControl.value)).subscribe(type => {
      if (type === 'PERCENTAGE') {
        valueControl.setValidators([Validators.required, Validators.min(1), Validators.max(100)]);
        const currentValue = Number(valueControl.value ?? 0);
        const normalizedValue = Number.isFinite(currentValue)
          ? Math.min(100, Math.max(1, currentValue || 1))
          : 1;

        if (normalizedValue !== currentValue) {
          valueControl.setValue(normalizedValue, { emitEvent: false });
        }
      } else {
        valueControl.setValidators([Validators.required, Validators.min(0.01)]);

        const currentValue = Number(valueControl.value ?? 0);
        const normalizedValue = Number.isFinite(currentValue)
          ? Math.max(0.01, currentValue || 0.01)
          : 0.01;

        if (normalizedValue !== currentValue) {
          valueControl.setValue(normalizedValue, { emitEvent: false });
        }
      }

      valueControl.updateValueAndValidity({ emitEvent: false });
    });
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.couponService.listCoupons().subscribe({
      next: (c) => {
        this.coupons = (c || []).map(item => ({
          ...item,
          type: (item.type ?? '').toString().toUpperCase().includes('PERC') ? 'PERCENTAGE' : 'FIXED'
        } as CouponResponse));
        this.loading = false;
      },
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
    this.form.reset({ code: '', type: 'FIXED' as CouponType, value: 0, expiryDate: '', maxUsages: null, active: true });
    this.formOpen = true;
  }

  edit(coupon: CouponResponse): void {
    this.editing = coupon;
    this.form.setValue({
      code: coupon.code,
      type: (coupon.type ?? '').toString().toUpperCase().includes('PERC') ? 'PERCENTAGE' as CouponType : 'FIXED' as CouponType,
      value: coupon.value,
      expiryDate: coupon.expiryDate ?? '',
      maxUsages: coupon.maxUsages ?? null,
      active: coupon.active
    });
    this.formOpen = true;
  }

  save(): void {
    if (this.form.invalid) return;

    if (this.isPercentageType) {
      const percentageValue = Number(this.form.controls.value.value ?? 0);
      if (!Number.isFinite(percentageValue) || percentageValue < 1 || percentageValue > 100) {
        this.toast.error('Percentage value must be between 1 and 100.');
        return;
      }
    }

    const raw = this.form.getRawValue();
    const payload: CouponRequest = {
      code: String(raw.code).trim(),
      type: raw.type,
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

  formatCouponType(type: CouponType): string {
    const t = (type ?? '').toString().toUpperCase();
    return t.includes('PERC') ? 'Percentage' : 'Fixed';
  }

  formatCouponValue(coupon: CouponResponse): string {
    const t = (coupon.type ?? '').toString().toUpperCase();
    const v = Number(coupon.value ?? 0);
    if (t.includes('PERC')) {
      return `${v}%`;
    }
    return `${v.toFixed(2)} €`;
  }

  remove(id: number): void {
    if (!confirm('Delete this coupon?')) return;
    this.couponService.deleteCoupon(id).subscribe({
      next: () => { this.toast.success('Coupon deleted'); this.load(); },
      error: (err) => this.toast.error(err?.error?.message || err?.message || 'Delete failed')
    });
  }
}