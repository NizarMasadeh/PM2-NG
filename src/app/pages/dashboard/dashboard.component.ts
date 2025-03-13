import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from "../navbar/navbar.component";
import { routeAnimations } from '../../animations/route.animation';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    RouterOutlet,
    NavbarComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  animations: [routeAnimations]
})
export class DashboardComponent {
  username = ""

  constructor(
    private authService: AuthService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.username = this.authService.getCurrentUser()

    if (!this.authService.isLoggedIn()) {
      this.router.navigate(["/login"])
    }
  }

  prepareRoute(outlet: RouterOutlet) {
    return outlet?.activatedRouteData?.['animation'] ?? '';
  }


  logout(): void {
    this.authService.logout()
    this.router.navigate(["/login"])
  }
}

