import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LogViewerComponent } from './pages/log-viewer/log-viewer.component';
import { LoginComponent } from './pages/login/login.component';
import { ProcessDetailsComponent } from './pages/process-details/process-details.component';
import { ProcessListComponent } from './pages/process-list/process-list.component';

export const routes: Routes = [
    { path: "login", component: LoginComponent },
    {
        path: "",
        component: DashboardComponent,
        canActivate: [AuthGuard],
        children: [
            { path: "", redirectTo: "processes", pathMatch: "full" },
            { path: "processes", component: ProcessListComponent },
            { path: "processes/:id", component: ProcessDetailsComponent },
            { path: "logs/:id", component: LogViewerComponent },
        ],
    },
    { path: "**", redirectTo: "" },
];
