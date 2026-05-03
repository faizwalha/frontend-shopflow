import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { SupportService } from '../../core/services/support.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './support.component.html'
})
export class SupportComponent {
  private fb = inject(FormBuilder);
  private supportService = inject(SupportService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  showForm = false;
  submitting = false;

  supportForm = this.fb.group({
    subject: ['', [Validators.required, Validators.minLength(5)]],
    description: ['', [Validators.required, Validators.minLength(20)]]
  });

  toggleForm(): void {
    this.showForm = !this.showForm;
  }

  onSubmit(): void {
    if (this.supportForm.invalid) {
      this.toastService.warning('Veuillez remplir correctement tous les champs.');
      return;
    }

    this.submitting = true;
    const request = {
      subject: this.supportForm.value.subject || '',
      description: this.supportForm.value.description || ''
    };

    this.supportService.submitRequest(request).subscribe({
      next: (res) => {
        this.toastService.success(res.message || 'Votre message a été envoyé.');
        this.showForm = false;
        this.supportForm.reset();
      },
      error: () => {
        this.toastService.error('Erreur lors de l\'envoi du message.');
        this.submitting = false;
      }
    });
  }
}
