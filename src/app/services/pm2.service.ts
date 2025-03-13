import { Injectable } from "@angular/core"
import { HttpClient } from "@angular/common/http"
import { Observable } from "rxjs"
import { environment } from "../../environments/environment"
import { Pm2Process } from "../models/pm2-process.model"

@Injectable({
    providedIn: "root",
})
export class Pm2Service {
    private apiUrl = environment.apiUrl

    constructor(private http: HttpClient) { }

    getProcesses(): Observable<Pm2Process[]> {
        return this.http.get<Pm2Process[]>(`${this.apiUrl}/pm2/processes`)
    }

    getProcessById(id: string): Observable<Pm2Process> {
        return this.http.get<Pm2Process>(`${this.apiUrl}/pm2/processes/${id}`)
    }

    startProcess(id: string): Observable<{ success: boolean }> {
        return this.http.post<{ success: boolean }>(`${this.apiUrl}/pm2/processes/${id}/start`, {})
    }

    stopProcess(id: string): Observable<{ success: boolean }> {
        return this.http.post<{ success: boolean }>(`${this.apiUrl}/pm2/processes/${id}/stop`, {})
    }

    restartProcess(id: string): Observable<{ success: boolean }> {
        return this.http.post<{ success: boolean }>(`${this.apiUrl}/pm2/processes/${id}/restart`, {})
    }

    reloadProcess(id: string): Observable<{ success: boolean }> {
        return this.http.post<{ success: boolean }>(`${this.apiUrl}/pm2/processes/${id}/reload`, {})
    }

    getLogs(id: string, type: "out" | "error"): Observable<string[]> {
        return this.http.get<string[]>(`${this.apiUrl}/pm2/processes/${id}/logs/${type}`)
    }

    clearLogs(id: string): Observable<{ success: boolean }> {
        return this.http.delete<{ success: boolean }>(`${this.apiUrl}/pm2/processes/${id}/logs`)
    }
}

