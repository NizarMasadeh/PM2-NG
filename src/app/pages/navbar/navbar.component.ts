import { CommonModule, DOCUMENT } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { NavBarService } from '../../services/navbar.service';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Directive({
  selector: '[clickOutside]',
  standalone: true,
})
export class ClickOutsideDirective {
  @Output() clickOutside = new EventEmitter<void>();
  @Input() exclude: string = '';

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event.target'])
  onClick(target: any) {
    const clickedInside = this.elementRef.nativeElement.contains(target);
    const clickedExcluded = this.exclude
      ? document.querySelector(this.exclude)?.contains(target)
      : false;

    if (!clickedInside && !clickedExcluded) {
      this.clickOutside.emit();
    }
  }
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ClickOutsideDirective],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent implements OnInit {
  @Input() username = '';
  @Output() logout = new EventEmitter<void>();

  isMobileMenuOpen = false;
  isUserDropdownOpen = false;
  #document = inject(DOCUMENT);
  isDarkMode = false;
  isThemeLoading = false;

  constructor(
    private _navbarService: NavBarService,
    private _cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeTheme();

    window.addEventListener('resize', () => {
      if (window.innerWidth > 768 && this.isMobileMenuOpen) {
        this.closeMobileMenu();
      }
    });
  }

  initializeTheme(): void {
    const theme = localStorage.getItem('theme');
    const linkElement = this.#document.getElementById(
      'app-theme'
    ) as HTMLLinkElement;

    if (theme) {
      if (theme === 'light') {
        linkElement.href = 'theme-light.css';
        this.isDarkMode = false;
      } else {
        linkElement.href = 'theme-dark.css';
        this.isDarkMode = true;
      }
    } else {
      linkElement.href = 'theme-light.css';
      this.isDarkMode = false;
      localStorage.setItem('theme', 'light');
    }
    this.isThemeLoading = false;
  }

  toggleLightDark(): void {
    this._navbarService.toggleDarkMode();
    this._navbarService.isDarkMode$.subscribe((res) => {
      this.isDarkMode = res;
      this._cdr.detectChanges();
    });

    const linkElement = this.#document.getElementById(
      'app-theme'
    ) as HTMLLinkElement;

    if (linkElement.href.includes('light')) {
      linkElement.href = 'theme-dark.css';
      localStorage.setItem('theme', 'dark');
    } else {
      linkElement.href = 'theme-light.css';
      localStorage.setItem('theme', 'light');
    }
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;

    if (this.isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
    document.body.style.overflow = '';
  }

  toggleUserDropdown(event: Event): void {
    event.stopPropagation();
    this.isUserDropdownOpen = !this.isUserDropdownOpen;
  }

  closeUserDropdown(): void {
    this.isUserDropdownOpen = false;
  }

  onLogout(): void {
    this.closeMobileMenu();
    this.closeUserDropdown();
    this.logout.emit();
  }
}
