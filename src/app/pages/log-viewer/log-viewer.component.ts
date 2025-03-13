import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, interval, switchMap } from 'rxjs';
import { Pm2Process } from '../../models/pm2-process.model';
import { Pm2Service } from '../../services/pm2.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-log-viewer',
  imports: [
    CommonModule
  ],
  templateUrl: './log-viewer.component.html',
  styleUrl: './log-viewer.component.scss'
})
export class LogViewerComponent implements OnInit, OnDestroy {

  process?: Pm2Process
  logs: string[] = []
  loading = true
  error = ""
  processId = ""
  autoRefresh = true
  refreshInterval = 5000 // 5 seconds
  logType: "out" | "error" = "out"
  private refreshSubscription?: Subscription

  constructor(
    private pm2Service: Pm2Service,
    private route: ActivatedRoute,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.processId = params["id"]
      this.loadProcessDetails()
      this.loadLogs()

      if (this.autoRefresh) {
        this.setupAutoRefresh()
      }
    })
  }

  ngOnDestroy(): void {
    this.clearAutoRefresh()
  }

  loadProcessDetails(): void {
    this.pm2Service.getProcessById(this.processId).subscribe(
      (process) => {
        this.process = process
      },
      (error) => {
        console.error("Error loading process details:", error)
      },
    )
  }

  loadLogs(): void {
    this.loading = true
    this.error = ""

    this.pm2Service.getLogs(this.processId, this.logType).subscribe(
      (logs) => {
        this.logs = logs
        this.loading = false
      },
      (error) => {
        this.error = "Failed to load logs. Please try again."
        this.loading = false
        console.error("Error loading logs:", error)
      },
    )
  }

  toggleLogType(type: "out" | "error"): void {
    if (this.logType !== type) {
      this.logType = type
      this.loadLogs()
    }
  }

  toggleAutoRefresh(): void {
    this.autoRefresh = !this.autoRefresh

    if (this.autoRefresh) {
      this.setupAutoRefresh()
    } else {
      this.clearAutoRefresh()
    }
  }

  setupAutoRefresh(): void {
    this.clearAutoRefresh()

    this.refreshSubscription = interval(this.refreshInterval)
      .pipe(switchMap(() => this.pm2Service.getLogs(this.processId, this.logType)))
      .subscribe(
        (logs) => {
          this.logs = logs
        },
        (error) => {
          console.error("Error refreshing logs:", error)
        },
      )
  }

  clearAutoRefresh(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe()
      this.refreshSubscription = undefined
    }
  }

  clearLogs(): void {
    this.pm2Service.clearLogs(this.processId).subscribe(
      () => {
        this.logs = []
      },
      (error) => {
        console.error("Error clearing logs:", error)
      },
    )
  }

  goBack(): void {
    this.router.navigate(["/processes", this.processId])
  }
}

