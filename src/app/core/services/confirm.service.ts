import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

export interface ConfirmData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmService {
  private confirmSubject = new Subject<boolean>();
  private dataSubject = new BehaviorSubject<ConfirmData | null>(null);
  
  confirmData$ = this.dataSubject.asObservable();

  confirm(data: ConfirmData): Observable<boolean> {
    this.dataSubject.next(data);
    return this.confirmSubject.asObservable();
  }

  handleAction(confirmed: boolean): void {
    this.confirmSubject.next(confirmed);
    this.dataSubject.next(null);
  }
}
