import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';

import { ToastComponent } from '../../shared/components/toast/toast.component';
import { ConfirmComponent } from '../../shared/components/confirm/confirm.component';
import { HostListener } from '@angular/core';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, FooterComponent, ToastComponent, ConfirmComponent],
  templateUrl: './main-layout.component.html'
})
export class MainLayoutComponent {
  showScrollTop = false;

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.showScrollTop = window.scrollY > 300;
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
