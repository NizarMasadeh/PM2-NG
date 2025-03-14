import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, interval, switchMap } from 'rxjs';
import { Pm2Process } from '../../models/pm2-process.model';
import { Pm2Service } from '../../services/pm2.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-process-details',
  imports: [CommonModule],
  templateUrl: './process-details.component.html',
  styleUrl: './process-details.component.scss',
})
export class ProcessDetailsComponent implements OnInit, OnDestroy {
  process?: Pm2Process;
  loading = true;
  error = '';
  processId = '';
  refreshInterval = 5000;
  private refreshSubscription?: Subscription;

  constructor(
    private pm2Service: Pm2Service,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(async (params) => {
      this.processId = await params['id'];

      this.loadProcessDetails();
    });
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  loadProcessDetails(): void {
    this.loading = true;
    this.error = '';

    this.pm2Service.getProcessById(this.processId).subscribe({
      next: (process) => {
        this.process = process;
        this.loading = false;
        this.refreshSubscription = interval(this.refreshInterval)
          .pipe(switchMap(() => this.pm2Service.getProcessById(this.processId)))
          .subscribe({
            next: async (process) => {
              this.process = await process;
            },
            error: (error) => {
              this.loading = false;
              console.error('Error refreshing process details:', error);
            },
          });
      },
      error: (error) => {
        this.error = 'Failed to load process details. Please try again.';
        this.loading = false;
        console.error('Error loading process details:', error);
      },
    });
  }

  startProcess(): void {
    if (!this.process) return;

    this.pm2Service.startProcess(this.process.pm_id).subscribe({
      next: () => {
        this.loadProcessDetails();
      },
      error: (error) => {
        console.error('Error starting process:', error);
      },
    });
  }

  stopProcess(): void {
    if (!this.process) return;

    this.pm2Service.stopProcess(this.process.pm_id).subscribe({
      next: () => {
        this.loadProcessDetails();
      },
      error: (error) => {
        console.error('Error stopping process:', error);
      },
    });
  }

  restartProcess(): void {
    if (!this.process) return;

    this.pm2Service.restartProcess(this.process.pm_id).subscribe({
      next: () => {
        this.loadProcessDetails();
      },
      error: (error) => {
        console.error('Error restarting process:', error);
      },
    });
  }

  reloadProcess(): void {
    if (!this.process) return;

    this.pm2Service.reloadProcess(this.process.pm_id).subscribe({
      next: () => {
        this.loadProcessDetails();
      },
      error: (error) => {
        console.error('Error reloading process:', error);
      },
    });
  }

  viewLogs(): void {
    if (!this.process) return;
    this.router.navigate(['/logs', this.process.pm_id]);
  }

  goBack(): void {
    this.router.navigate(['/processes']);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'online':
        return 'status-online';
      case 'stopping':
      case 'stopped':
        return 'status-stopped';
      case 'errored':
        return 'status-error';
      case 'launching':
        return 'status-launching';
      default:
        return 'status-unknown';
    }
  }

  formatMemory(memory: number): string {
    if (memory < 1024) {
      return `${memory} B`;
    } else if (memory < 1024 * 1024) {
      return `${(memory / 1024).toFixed(2)} KB`;
    } else if (memory < 1024 * 1024 * 1024) {
      return `${(memory / (1024 * 1024)).toFixed(2)} MB`;
    } else {
      return `${(memory / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
  }

  formatUptime(uptime: number): string {
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
  }
}
