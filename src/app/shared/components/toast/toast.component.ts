import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none w-full max-w-[320px] px-4">
      <div *ngFor="let toast of toastService.toasts$ | async" 
           class="pointer-events-auto flex items-center gap-3 px-4 py-2.5 rounded-[20px] shadow-[0_15px_40px_rgba(0,0,0,0.15)] border border-white/20 backdrop-blur-2xl animate-toast-in transition-all duration-500 overflow-hidden relative group"
           [ngClass]="{
             'bg-emerald-500/80': toast.type === 'success',
             'bg-rose-500/80': toast.type === 'error',
             'bg-amber-500/80': toast.type === 'warning',
             'bg-slate-900/80': toast.type === 'info'
           }">
        <!-- Shine effect -->
        <div class="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        <div class="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
          <svg *ngIf="toast.type === 'success'" class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
          <svg *ngIf="toast.type === 'error'" class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
          <svg *ngIf="toast.type === 'info' || toast.type === 'warning'" class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        </div>
        
        <div class="flex-grow min-w-0">
          <p class="text-[0.65rem] font-black text-white leading-none tracking-wider uppercase opacity-60 mb-0.5">{{ toast.type }}</p>
          <p class="text-sm font-bold text-white leading-tight tracking-tight truncate">{{ toast.message }}</p>
        </div>

        <button (click)="toastService.remove(toast.id)" class="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center transition-all">
          <svg class="w-4 h-4 text-white/60 hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
        
        <!-- Progress bar indicator -->
        <div class="absolute bottom-0 left-0 h-1 bg-white/30 animate-progress"></div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes toast-in {
      from { transform: translateY(100%) scale(0.9); opacity: 0; filter: blur(10px); }
      to { transform: translateY(0) scale(1); opacity: 1; filter: blur(0); }
    }
    @keyframes progress {
      from { width: 100%; }
      to { width: 0%; }
    }
    .animate-toast-in {
      animation: toast-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .animate-progress {
      animation: progress 4s linear forwards;
    }
  `]
})
export class ToastComponent {
  toastService = inject(ToastService);
}
