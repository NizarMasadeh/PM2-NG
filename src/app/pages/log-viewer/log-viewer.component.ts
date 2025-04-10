import { Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from "@angular/core"
import { ActivatedRoute, Router } from "@angular/router"
import { Subscription, interval } from "rxjs"
import { Pm2Process } from "../../models/pm2-process.model"
import { Pm2Service } from "../../services/pm2.service"
import { CommonModule } from "@angular/common"
import { DomSanitizer, SafeHtml } from "@angular/platform-browser"
import { AnsiService } from "../../services/ansi.service"

@Component({
  selector: "app-log-viewer",
  imports: [CommonModule],
  templateUrl: "./log-viewer.component.html",
  styleUrl: "./log-viewer.component.scss",
  encapsulation: ViewEncapsulation.None, 
})
export class LogViewerComponent implements OnInit, OnDestroy {
  @ViewChild("logsContainer") logsContainer!: ElementRef

  process?: Pm2Process
  logs: string[] = []
  processedLogs: SafeHtml = ""
  loading = true
  error = ""
  processId = ""
  autoRefresh = true
  refreshInterval = 500
  logType: "out" | "error" = "out"
  private refreshSubscription?: Subscription
  private shouldScrollToBottom = true
  private lastLogLength = 0
  private initialScrollDone = false

  constructor(
    private pm2Service: Pm2Service,
    private route: ActivatedRoute,
    private router: Router,
    private ansiService: AnsiService,
    private sanitizer: DomSanitizer,
  ) { }

  ngOnInit(): void {
    this.clearAutoRefresh()

    this.route.params.subscribe(async (params) => {
      this.processId = await params["id"]
      this.logs = []
      this.processedLogs = ""
      this.loading = true
      this.error = ""
      this.shouldScrollToBottom = true
      this.lastLogLength = 0
      this.initialScrollDone = false

      this.loadLogs()
    })
  }

  ngOnDestroy(): void {
    this.clearAutoRefresh()
    this.processId = ""
  }

  private scrollToBottom(): void {
    
    setTimeout(() => {
      if (this.logsContainer && this.logsContainer.nativeElement) {
        const container = this.logsContainer.nativeElement;
        container.scrollTop = container.scrollHeight;
        console.log('Scrolled to bottom, height:', container.scrollHeight);
      } else {
        console.warn('Logs container not available for scrolling');
      }
    }, 100); 
  }

  processLogs(): void {
    const htmlContent = this.ansiService.processLogs(this.logs)
    this.processedLogs = this.sanitizer.bypassSecurityTrustHtml(htmlContent)
  }

  loadLogs(): void {
    this.loading = true
    this.error = ""
    this.clearAutoRefresh()

    this.pm2Service.getProcessById(this.processId).subscribe({
      next: async (process) => {
        this.process = await process
        this.pm2Service.getLogs(this.processId, this.logType).subscribe({
          next: (logs) => {
            this.logs = logs;
            this.lastLogLength = logs.length;
            this.processLogs();
            this.loading = false;

            
            this.shouldScrollToBottom = true;
            this.initialScrollDone = false;

            
            setTimeout(() => {
              this.scrollToBottom();
            }, 150);

            if (this.autoRefresh) {
              this.setupAutoRefresh();
            }
          },
          error: (error) => {
            this.error = "Failed to load logs. Please try again."
            this.loading = false
            console.error("Error loading logs:", error)
          },
        })
      },
      error: (error) => {
        console.error("Error loading process details:", error)
      },
    })
  }

  loadLogsWithRetry(retries: number): void {
    this.loading = true
    this.error = ""

    this.pm2Service.getLogs(this.processId, this.logType).subscribe({
      next: (logs) => {
        this.logs = logs
        this.lastLogLength = logs.length
        this.processLogs()
        this.loading = false
        this.scrollToBottom()

        if (this.autoRefresh) {
          setTimeout(() => this.setupAutoRefresh(), 1000)
        }
      },
      error: (error) => {
        console.error("Error loading logs:", error)

        if (retries > 0) {
          this.error = `Loading logs, retrying... (${retries} attempts left)`
          setTimeout(() => {
            this.loadLogsWithRetry(retries - 1)
          }, 2000)
        } else {
          this.error = "Failed to load logs. Please try refreshing the page."
          this.loading = false
        }
      },
    })
  }

  toggleLogType(type: "out" | "error"): void {
    if (this.logType !== type) {
      this.logType = type
      this.clearAutoRefresh()
      this.shouldScrollToBottom = true
      this.loadLogsWithRetry(3)
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

    this.refreshSubscription = interval(this.refreshInterval).subscribe(() => {
      if (!this.loading) {
        this.pm2Service.getLogs(this.processId, this.logType).subscribe({
          next: (logs) => {
            
            if (
              logs.length !== this.lastLogLength ||
              (logs.length > 0 && this.logs.length > 0 && logs[logs.length - 1] !== this.logs[this.logs.length - 1])
            ) {
              this.logs = logs
              this.lastLogLength = logs.length
              this.processLogs()
              this.error = ""

              if (this.isNearBottom()) {
                this.scrollToBottom()
              }
            }
          },
          error: (error) => {
            console.error("Error during auto-refresh:", error)
          },
        })
      }
    })
  }

  private isNearBottom(): boolean {
    if (!this.logsContainer) return true
    const container = this.logsContainer.nativeElement
    const threshold = 100 
    return container.scrollTop + container.clientHeight >= container.scrollHeight - threshold
  }

  clearAutoRefresh(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe()
      this.refreshSubscription = undefined
    }
  }

  clearLogs(): void {
    this.pm2Service.clearLogs(this.processId).subscribe({
      next: () => {
        this.logs = []
        this.processedLogs = ""
        this.lastLogLength = 0
        this.scrollToBottom()
      },
      error: (error) => {
        console.error("Error clearing logs:", error)
      },
    })
  }

  goBack(): void {
    this.router.navigate(["/processes", this.processId])
  }

  ngAfterViewChecked() {
    
    
    if (!this.initialScrollDone && !this.loading && this.logs.length > 0 && this.logsContainer) {
      this.scrollToBottom();
      this.initialScrollDone = true;
      console.log('Initial scroll completed');
    }
  }
}
