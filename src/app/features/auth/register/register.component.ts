import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RegisterRequest } from '../../../core/models/auth.models';
import { AddressAutocompleteService, AddressSuggestion } from '../../../core/services/address-autocomplete.service';
import { Observable, debounceTime, distinctUntilChanged, of, switchMap, tap } from 'rxjs';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private addressAutocompleteService = inject(AddressAutocompleteService);

  registerForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['CUSTOMER' as 'CUSTOMER' | 'SELLER', [Validators.required]],
    street: ['', [Validators.required]],
    city: ['', [Validators.required]],
    postalCode: ['', []],
    country: ['', [Validators.required]]
  });

  isLoading = false;
  errorMessage = '';
  successMessage = '';
  suggestions: AddressSuggestion[] = [];
  countries$: Observable<string[]>;
  cities$: Observable<string[]>;
  streets$: Observable<string[]>;
  showSuggestions = false;
  isCitiesLoading = false;
  isStreetsLoading = false;

  constructor() {
    this.countries$ = this.addressAutocompleteService.getCountriesList();
    this.cities$ = of([]);
    this.streets$ = of([]);

    // When Country changes, fetch Cities
    this.registerForm.get('country')?.valueChanges.subscribe(country => {
      this.registerForm.patchValue({ city: '', street: '', postalCode: '' }, { emitEvent: false });
      if (country) {
        this.isCitiesLoading = true;
        this.cities$ = this.addressAutocompleteService.getCitiesByCountry(country).pipe(
          tap(() => this.isCitiesLoading = false)
        );
      } else {
        this.cities$ = of([]);
      }
    });

    // When City changes, fetch Streets
    this.registerForm.get('city')?.valueChanges.subscribe(city => {
      this.registerForm.patchValue({ street: '', postalCode: '' }, { emitEvent: false });
      const country = this.registerForm.get('country')?.value;
      if (country && city) {
        this.isStreetsLoading = true;
        this.streets$ = this.addressAutocompleteService.getStreetsByCity(country, city).pipe(
          tap(() => this.isStreetsLoading = false)
        );
      } else {
        this.streets$ = of([]);
      }
    });
  }

  // Street selection from dropdown
  onStreetChange(street: string) {
    if (!street) return;
    const country = this.registerForm.get('country')?.value || '';
    const city = this.registerForm.get('city')?.value || '';
    
    // Fetch postal code for the selected street
    this.addressAutocompleteService.searchStreet(street, country, city).subscribe(results => {
      if (results.length > 0) {
        this.registerForm.patchValue({
          postalCode: results[0].postalCode
        });
      }
    });
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const payload = this.registerForm.getRawValue() as RegisterRequest;

    this.authService.register(payload).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = response.message || 'Inscription réussie. Veuillez vérifier votre email.';
        this.registerForm.reset();
        // Optionnel: Rediriger vers login après 5 secondes
        setTimeout(() => this.router.navigate(['/login']), 5000);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || err?.message || 'Registration failed.';
      }
    });
  }

}
