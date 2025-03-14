export interface Pm2Env {
  status?: string;
  pm_uptime?: number;
  restart_time?: number;
  created_at?: number;
  updated_at?: number;
  pm_out_log_path?: string;
  pm_err_log_path?: string;
  pm_exec_path?: string;
  pm_cwd?: string;
  exec_interpreter?: string;
  env?: Record<string, any>;
  [key: string]: any;
}

export interface Pm2Monit {
  cpu?: number;
  memory?: number;
  [key: string]: any;
}

export interface Pm2Process {
  name?: string;
  pm_id?: number;
  pid?: number;
  pm2_env?: Pm2Env;
  monit?: Pm2Monit;
  [key: string]: any;
}
