import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop')] bg-cover bg-center">
      <div class="absolute inset-0 bg-white/60 backdrop-blur-lg"></div>

      <div class="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 relative z-10 text-center">
        <div *ngIf="status === 'verifying'" class="py-8">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600 mb-4"></div>
          <h2 class="text-2xl font-black text-slate-900 tracking-tight">Vérification en cours...</h2>
          <p class="text-slate-500 font-medium mt-2">Veuillez patienter pendant que nous activons votre compte.</p>
        </div>

        <div *ngIf="status === 'success'" class="py-8">
          <div class="bg-green-100 text-green-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 class="text-3xl font-black text-slate-900 tracking-tight">Compte Activé !</h2>
          <p class="text-slate-500 font-medium mt-4 mb-8">Votre email a été vérifié avec succès.</p>
          
          <div *ngIf="authService.getRole() === 'SELLER'" class="space-y-4">
            <p class="text-indigo-600 font-bold animate-pulse">Redirection vers la configuration de votre boutique...</p>
            <div class="w-full bg-gray-200 rounded-full h-1.5 max-w-[200px] mx-auto">
              <div class="bg-indigo-600 h-1.5 rounded-full animate-[progress_2s_ease-in-out]"></div>
            </div>
          </div>

          <a *ngIf="authService.getRole() !== 'SELLER'" routerLink="/login" class="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-3.5 rounded-xl font-black transition-all shadow-xl shadow-indigo-100">
            Se Connecter
          </a>
        </div>

        <div *ngIf="status === 'error'" class="py-8">
          <div class="bg-red-100 text-red-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 class="text-3xl font-black text-slate-900 tracking-tight">Erreur</h2>
          <p class="text-red-500 font-bold mt-4 mb-8">{{ errorMessage }}</p>
          <a routerLink="/register" class="text-indigo-600 hover:text-indigo-700 font-bold">Retour à l'inscription</a>
        </div>
      </div>
    </div>
  `
})
export class VerifyEmailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public authService = inject(AuthService);
  private toastService = inject(ToastService);

  status: 'verifying' | 'success' | 'error' = 'verifying';
  errorMessage = '';

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      this.authService.verifyEmail(token).subscribe({
        next: (response) => {
          this.status = 'success';
          this.toastService.success('Compte activé avec succès !');
          
          if (response.role === 'SELLER') {
            // Redirect to seller setup after a short delay to show success message
            setTimeout(() => {
              this.router.navigate(['/seller-setup']);
            }, 2000);
          }
        },
        error: (err) => {
          this.status = 'error';
          this.errorMessage = err.error?.message || 'Le lien de vérification est invalide ou a expiré.';
        }
      });
    } else {
      this.status = 'error';
      this.errorMessage = 'Token de vérification manquant.';
    }
  }
}
