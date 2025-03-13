import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, interval, switchMap } from 'rxjs';
import { Pm2Process } from '../../models/pm2-process.model';
import { Pm2Service } from '../../services/pm2.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-process-list',
  imports: [
    CommonModule
  ],
  templateUrl: './process-list.component.html',
  styleUrl: './process-list.component.scss'
})
export class ProcessListComponent implements OnInit, OnDestroy {

  processes: Pm2Process[] = []
  loading = true
  error = ""
  refreshInterval = 5000 // 5 seconds
  private refreshSubscription?: Subscription

  constructor(
    private pm2Service: Pm2Service,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.loadProcesses()

    // Set up automatic refresh
    this.refreshSubscription = interval(this.refreshInterval)
      .pipe(switchMap(() => this.pm2Service.getProcesses()))
      .subscribe(
        (processes) => {
          this.processes = processes
        },
        (error) => {
          console.error("Error refreshing processes:", error)
        },
      )
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe()
    }
  }

  loadProcesses(): void {
    this.loading = true
    this.error = ""

    this.pm2Service.getProcesses().subscribe(
      (processes) => {
        this.processes = processes
        this.loading = false
      },
      (error) => {
        this.error = "Failed to load processes. Please try again."
        this.loading = false
        console.error("Error loading processes:", error)
      },
    )
  }

  startProcess(id: string): void {
    this.pm2Service.startProcess(id).subscribe(
      () => {
        this.loadProcesses()
      },
      (error) => {
        console.error("Error starting process:", error)
      },
    )
  }

  stopProcess(id: string): void {
    this.pm2Service.stopProcess(id).subscribe(
      () => {
        this.loadProcesses()
      },
      (error) => {
        console.error("Error stopping process:", error)
      },
    )
  }

  restartProcess(id: string): void {
    this.pm2Service.restartProcess(id).subscribe(
      () => {
        this.loadProcesses()
      },
      (error) => {
        console.error("Error restarting process:", error)
      },
    )
  }

  reloadProcess(id: string): void {
    this.pm2Service.reloadProcess(id).subscribe(
      () => {
        this.loadProcesses()
      },
      (error) => {
        console.error("Error reloading process:", error)
      },
    )
  }

  viewLogs(id: string): void {
    this.router.navigate(["/logs", id])
  }

  viewDetails(id: string): void {
    this.router.navigate(["/processes", id])
  }

  getStatusClass(status: string): string {
    switch (status) {
      case "online":
        return "status-online"
      case "stopping":
      case "stopped":
        return "status-stopped"
      case "errored":
        return "status-error"
      case "launching":
        return "status-launching"
      default:
        return "status-unknown"
    }
  }

  formatMemory(memory: number): string {
    if (memory < 1024) {
      return `${memory} B`
    } else if (memory < 1024 * 1024) {
      return `${(memory / 1024).toFixed(2)} KB`
    } else if (memory < 1024 * 1024 * 1024) {
      return `${(memory / (1024 * 1024)).toFixed(2)} MB`
    } else {
      return `${(memory / (1024 * 1024 * 1024)).toFixed(2)} GB`
    }
  }

  formatUptime(uptime: number): string {
    const seconds = Math.floor(uptime / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) {
      return `${days}d ${hours % 24}h`
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }
}

