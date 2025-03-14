import { Injectable } from "@angular/core"
import { HttpClient } from "@angular/common/http"
import { Observable, of } from "rxjs"
import { map, catchError, tap } from "rxjs/operators"
import { environment } from "../../environments/environment"

@Injectable({
    providedIn: "root",
})
export class AuthService {
    private apiUrl = environment.apiUrl
    private tokenKey = "pm2_monitor_token"
    private userKey = "pm2_monitor_user"

    constructor(private http: HttpClient) { }

    login(username: string, password: string): Observable<boolean> {
        return this.http
            .post<{ token: string; username: string }>(`${this.apiUrl}/auth/login`, { username, password })
            .pipe(
                tap((response) => {
                    localStorage.setItem("token", response.token)
                    localStorage.setItem(this.userKey, response.username)
                }),
                map(() => true),
                catchError(() => of(false)),
            )
    }

    register(username: string, password: string): Observable<boolean> {
        return this.http.post<{ success: boolean }>(`${this.apiUrl}/auth/register`, { username, password }).pipe(
            map((response) => response.success),
            catchError(() => of(false)),
        )
    }

    logout(): void {
        localStorage.clear();
    }

    isLoggedIn(): boolean {
        return !!this.getToken()
    }

    getToken(): string | null {
        return localStorage.getItem("token")
    }

    getCurrentUser(): string {
        return localStorage.getItem(this.userKey) || ""
    }

    checkUserExists(): Observable<boolean> {
        return this.http.get<{ exists: boolean }>(`${this.apiUrl}/auth/check-user`).pipe(
            map((response) => response.exists),
            catchError(() => of(false)),
        )
    }
}

