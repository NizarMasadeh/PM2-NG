export interface Pm2Process {
    name: string
    pm_id: string
    pid?: number
    status: string
    cpu: number
    memory: number
    uptime: number
    restart_count?: number
    created_at: number
    updated_at: number
    started_at: number
    script_path?: string
    cwd?: string
    exec_interpreter?: string
    env: Record<string, string>
}

