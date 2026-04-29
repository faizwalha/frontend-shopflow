import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/auth.models';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private toastService = inject(ToastService);

  user: User | null = null;
  profileForm: FormGroup;
  isEditing = false;
  isLoading = true;

  constructor() {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      phoneNumber: [''],
      address: ['']
    });
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading = true;
    this.authService.getProfile().subscribe({
      next: (user) => {
        this.user = user;
        this.profileForm.patchValue({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          address: user.address
        });
        this.isLoading = false;
      },
      error: (err) => {
        this.toastService.error('Erreur lors du chargement du profil');
        this.isLoading = false;
      }
    });
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      if (this.user) {
        this.profileForm.patchValue({
          firstName: this.user.firstName,
          lastName: this.user.lastName,
          phoneNumber: this.user.phoneNumber,
          address: this.user.address
        });
      }
    }
  }

  onSubmit(): void {
    if (this.profileForm.valid) {
      const updatedUser = this.profileForm.getRawValue();
      this.authService.updateProfile(updatedUser).subscribe({
        next: (user) => {
          this.user = user;
          this.isEditing = false;
          this.toastService.success('Profil mis à jour avec succès');
        },
        error: (err) => {
          this.toastService.error('Erreur lors de la mise à jour du profil');
        }
      });
    }
  }
}

