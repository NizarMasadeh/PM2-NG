import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, interval, switchMap } from 'rxjs';
import { Pm2Process } from '../../models/pm2-process.model';
import { Pm2Service } from '../../services/pm2.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-log-viewer',
  imports: [CommonModule],
  templateUrl: './log-viewer.component.html',
  styleUrl: './log-viewer.component.scss',
})
export class LogViewerComponent implements OnInit, OnDestroy {
  @ViewChild('logsContainer') logsContainer?: ElementRef;

  process?: Pm2Process;
  logs: string[] = [];
  loading = true;
  error = '';
  processId = '';
  autoRefresh = true;
  refreshInterval = 500;
  logType: 'out' | 'error' = 'out';
  private refreshSubscription?: Subscription;

  constructor(
    private pm2Service: Pm2Service,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.clearAutoRefresh();

    this.route.params.subscribe(async (params) => {
      this.processId = await params['id'];
      this.logs = [];
      this.loading = true;
      this.error = '';

      this.loadLogs();
      // this.loadLogsWithRetry(3);
      // this.loadProcessDetails();
    });
  }

  ngOnDestroy(): void {
    this.clearAutoRefresh();
    this.processId = '';
  }

  private scrollToBottom(): void {
    if (this.logsContainer) {
      setTimeout(() => {
        const container = this.logsContainer?.nativeElement;
        container.scrollTop = container.scrollHeight;
      }, 100);
    }
  }

  loadLogsWithRetry(retries: number): void {
    this.loading = true;
    this.error = '';

    this.pm2Service.getLogs(this.processId, this.logType).subscribe({
      next: (logs) => {
        console.log('Logs triggerd');

        this.logs = logs;
        this.loading = false;

        if (this.autoRefresh) {
          setTimeout(() => this.setupAutoRefresh(), 1000);
        }
      },
      error: (error) => {
        console.error('Error loading logs:', error);

        if (retries > 0) {
          this.error = `Loading logs, retrying... (${retries} attempts left)`;
          setTimeout(() => {
            this.loadLogsWithRetry(retries - 1);
          }, 2000);
        } else {
          this.error = 'Failed to load logs. Please try refreshing the page.';
          this.loading = false;
        }
      },
    });
  }

  loadProcessDetails(): void {
    this.pm2Service.getProcessById(this.processId).subscribe({
      next: async (process) => {
        this.process = await process;
      },
      error: (error) => {
        console.error('Error loading process details:', error);
      },
    });
  }

  loadLogs(): void {
    this.loading = true;
    this.error = '';

    this.clearAutoRefresh();

    this.pm2Service.getProcessById(this.processId).subscribe({
      next: async (process) => {
        this.process = await process;
        this.pm2Service.getLogs(this.processId, this.logType).subscribe({
          next: (logs) => {

            this.logs = logs;
            this.loading = false;
            this.scrollToBottom();

          },
          error: (error) => {
            this.error = 'Failed to load logs. Please try again.';
            this.loading = false;
            console.error('Error loading logs:', error);
          },
        });
      },
      error: (error) => {
        console.error('Error loading process details:', error);
      },
    });

  }

  toggleLogType(type: 'out' | 'error'): void {
    if (this.logType !== type) {
      this.logType = type;

      this.clearAutoRefresh();

      this.loadLogsWithRetry(3);
    }
  }

  toggleAutoRefresh(): void {
    this.autoRefresh = !this.autoRefresh;

    if (this.autoRefresh) {
      this.setupAutoRefresh();
    } else {
      this.clearAutoRefresh();
    }
  }

  setupAutoRefresh(): void {
    this.clearAutoRefresh();

    this.refreshSubscription = interval(this.refreshInterval).subscribe(() => {
      if (!this.loading) {
        this.pm2Service.getLogs(this.processId, this.logType).subscribe({
          next: (logs) => {
            this.logs = logs;
            this.error = '';
          },
          error: (error) => {
            console.error('Error during auto-refresh:', error);
          },
        });
      }
    });
  }

  clearAutoRefresh(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
      this.refreshSubscription = undefined;
    }
  }

  clearLogs(): void {
    this.pm2Service.clearLogs(this.processId).subscribe({
      next: () => {
        this.logs = [];
      },
      error: (error) => {
        console.error('Error clearing logs:', error);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/processes', this.processId]);
  }
}
