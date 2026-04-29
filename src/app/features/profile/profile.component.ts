import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/auth.models';
import { ToastService } from '../../core/services/toast.service';
import { AddressService } from '../../core/services/address.service';
import { Address, AddressRequest } from '../../core/models/address.models';

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
  private addressService = inject(AddressService);

  user: User | null = null;
  profileForm: FormGroup;
  addressForm: FormGroup;
  isEditing = false;
  isLoading = true;
  selectedFile: File | null = null;
  
  showAddressForm = false;
  editingAddressId: number | null = null;

  constructor() {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      shopName: [''],
      description: ['']
    });

    this.addressForm = this.fb.group({
      street: ['', Validators.required],
      city: ['', Validators.required],
      postalCode: ['', Validators.required],
      country: ['Tunisie', Validators.required],
      defaultAddress: [false]
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
          shopName: user.shopName,
          description: user.description
        });
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Profile load error:', err);
        this.toastService.error('Erreur lors du chargement du profil');
        this.isLoading = false;
      }
    });
  }

  // Address Management Methods
  toggleAddressForm(address?: Address): void {
    this.showAddressForm = true;
    if (address) {
      this.editingAddressId = address.id;
      this.addressForm.patchValue({
        street: address.street,
        city: address.city,
        postalCode: address.postalCode,
        country: address.country,
        defaultAddress: address.defaultAddress
      });
    } else {
      this.editingAddressId = null;
      this.addressForm.reset({ country: 'Tunisie', defaultAddress: false });
    }
  }

  cancelAddressEdit(): void {
    this.showAddressForm = false;
    this.editingAddressId = null;
    this.addressForm.reset();
  }

  saveAddress(): void {
    if (this.addressForm.valid) {
      const request: AddressRequest = this.addressForm.value;
      const operation = this.editingAddressId 
        ? this.addressService.updateAddress(this.editingAddressId, request)
        : this.addressService.addAddress(request);

      operation.subscribe({
        next: () => {
          this.toastService.success(this.editingAddressId ? 'Adresse mise à jour' : 'Adresse ajoutée');
          this.loadProfile(); // Refresh to get updated list
          this.cancelAddressEdit();
        },
        error: () => this.toastService.error('Erreur lors de la sauvegarde de l\'adresse')
      });
    }
  }

  deleteAddress(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette adresse ?')) {
      this.addressService.deleteAddress(id).subscribe({
        next: () => {
          this.toastService.success('Adresse supprimée');
          this.loadProfile();
        }
      });
    }
  }

  setAsPrincipal(id: number): void {
    this.addressService.setDefaultAddress(id).subscribe({
      next: () => {
        this.toastService.success('Adresse principale mise à jour');
        this.loadProfile();
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      // Optionnel: Prévisualisation locale
      const reader = new FileReader();
      reader.onload = () => {
        if (this.user) {
          this.user.logo = reader.result as string;
        }
      };
      reader.readAsDataURL(file);
    }
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      if (this.user) {
        this.profileForm.patchValue({
          firstName: this.user.firstName,
          lastName: this.user.lastName,
          address: this.user.address,
          shopName: this.user.shopName,
          description: this.user.description
        });
      }
    }
  }

  onSubmit(): void {
    if (this.profileForm.valid) {
      const updatedUser = this.profileForm.getRawValue();
      
      // Update personal profile
      this.authService.updateProfile(updatedUser).subscribe({
        next: (user) => {
          this.user = user;
          
          // If seller and logo/shop info needs update via Multipart
          if (this.user.role === 'SELLER' && (this.selectedFile || updatedUser.shopName)) {
            const formData = new FormData();
            formData.append('shopName', updatedUser.shopName);
            formData.append('description', updatedUser.description);
            if (this.selectedFile) {
              formData.append('logoFile', this.selectedFile);
            }

            this.authService.createSellerProfile(formData).subscribe({
              next: (sellerResp) => {
                this.user!.shopName = sellerResp.shopName;
                this.user!.description = sellerResp.description;
                this.user!.logo = sellerResp.logo;
                this.selectedFile = null;
                this.finishUpdate();
              },
              error: () => this.toastService.error('Erreur lors de la mise à jour de la boutique')
            });
          } else {
            this.finishUpdate();
          }
        },
        error: (err) => {
          this.toastService.error('Erreur lors de la mise à jour du profil');
        }
      });
    }
  }

  private finishUpdate(): void {
    this.isEditing = false;
    this.authService.refreshProfile().subscribe();
    this.toastService.success('Profil mis à jour avec succès');
  }
}

