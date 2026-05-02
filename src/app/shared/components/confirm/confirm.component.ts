import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmService } from '../../../core/services/confirm.service';

@Component({
  selector: 'app-confirm',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="confirmService.confirmData$ | async as data" 
         class="fixed inset-0 z-[10000] flex items-center justify-center p-4 backdrop-blur-sm bg-slate-950/20 animate-fade-in">
      
      <div class="w-full max-w-sm rounded-[32px] bg-white p-6 shadow-[0_40px_100px_rgba(15,23,42,0.2)] border border-slate-100 animate-scale-up">
        <div class="flex flex-col items-center text-center">
          <!-- Icon circle -->
          <div [ngClass]="{
            'bg-blue-100 text-blue-600': true
          }" class="w-16 h-16 rounded-full flex items-center justify-center mb-5">
            <svg *ngIf="data.type === 'danger'" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <svg *ngIf="data.type === 'warning'" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <svg *ngIf="!data.type || data.type === 'info'" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h3 class="text-xl font-black text-slate-950 tracking-tight">{{ data.title }}</h3>
          <p class="mt-2 text-slate-500 font-medium leading-relaxed">{{ data.message }}</p>
        </div>

        <div class="mt-8 grid grid-cols-2 gap-3">
          <button (click)="confirmService.handleAction(false)" 
                  class="px-5 py-3 rounded-2xl bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 transition-colors">
            {{ data.cancelText || 'No' }}
          </button>
          <button (click)="confirmService.handleAction(true)" 
                  [ngClass]="{
                    'bg-blue-600 hover:bg-blue-700': true
                  }"
                  class="px-5 py-3 rounded-2xl text-white font-bold shadow-lg shadow-indigo-500/20 transition-all">
            {{ data.confirmText || 'Yes' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes scale-up {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
    .animate-scale-up { animation: scale-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  `]
})
export class ConfirmComponent {
  confirmService = inject(ConfirmService);
}
