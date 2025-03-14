import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as pm2 from 'pm2';
import * as fs from 'fs';
import { Pm2Process } from './interfaces/pm2.interface';

@Injectable()
export class Pm2Service {
  async getProcesses() {
    return new Promise((resolve, reject) => {
      pm2.connect((err) => {
        if (err) {
          console.error('Error connecting to PM2:', err);
          pm2.disconnect();
          return reject(
            new InternalServerErrorException('Error connecting to PM2'),
          );
        }

        pm2.list((err, processList: Pm2Process[]) => {
          pm2.disconnect();

          if (err) {
            console.error('Error getting PM2 processes:', err);
            return reject(
              new InternalServerErrorException('Error getting PM2 processes'),
            );
          }

          const processes = processList.map((process) => {
            return {
              name: process.name || 'unknown',
              pm_id: process.pm_id?.toString() || '',
              pid: process.pid || 0,
              status: process.pm2_env?.status || 'unknown',
              cpu: process.monit?.cpu || 0,
              memory: process.monit?.memory || 0,
              uptime:
                process.pm2_env?.status === 'online'
                  ? Date.now() - (process.pm2_env?.pm_uptime || 0)
                  : 0,
              restart_count: process.pm2_env?.restart_time || 0,
              created_at: process.pm2_env?.created_at || 0,
              updated_at: process.pm2_env?.updated_at || 0,
              started_at: process.pm2_env?.pm_uptime || 0,
              script_path: process.pm2_env?.pm_exec_path || '',
              cwd: process.pm2_env?.pm_cwd || '',
              exec_interpreter: process.pm2_env?.exec_interpreter || '',
              env: process.pm2_env?.env || {},
            };
          });

          resolve(processes);
        });
      });
    });
  }

  async getProcess(id: string) {
    return new Promise((resolve, reject) => {
      pm2.connect((err) => {
        if (err) {
          console.error('Error connecting to PM2:', err);
          pm2.disconnect();
          return reject(
            new InternalServerErrorException('Error connecting to PM2'),
          );
        }

        pm2.describe(id, (err, processDesc: Pm2Process[]) => {
          pm2.disconnect();

          if (err || !processDesc || processDesc.length === 0) {
            console.error('Error getting PM2 process:', err);
            return reject(new NotFoundException('Process not found'));
          }

          const process = processDesc[0];
          const processInfo = {
            name: process.name || 'unknown',
            pm_id: process.pm_id?.toString() || '',
            pid: process.pid || 0,
            status: process.pm2_env?.status || 'unknown',
            cpu: process.monit?.cpu || 0,
            memory: process.monit?.memory || 0,
            uptime:
              process.pm2_env?.status === 'online'
                ? Date.now() - (process.pm2_env?.pm_uptime || 0)
                : 0,
            restart_count: process.pm2_env?.restart_time || 0,
            created_at: process.pm2_env?.created_at || 0,
            updated_at: process.pm2_env?.updated_at || 0,
            started_at: process.pm2_env?.pm_uptime || 0,
            script_path: process.pm2_env?.pm_exec_path || '',
            cwd: process.pm2_env?.pm_cwd || '',
            exec_interpreter: process.pm2_env?.exec_interpreter || '',
            env: process.pm2_env?.env || {},
          };

          resolve(processInfo);
        });
      });
    });
  }

  async startProcess(id: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      pm2.connect((err) => {
        if (err) {
          console.error('Error connecting to PM2:', err);
          pm2.disconnect();
          return reject(
            new InternalServerErrorException('Error connecting to PM2'),
          );
        }

        pm2.start(id, (err) => {
          pm2.disconnect();

          if (err) {
            console.error('Error starting PM2 process:', err);
            return reject(
              new InternalServerErrorException('Error starting process'),
            );
          }

          resolve(true);
        });
      });
    });
  }

  async stopProcess(id: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      pm2.connect((err) => {
        if (err) {
          console.error('Error connecting to PM2:', err);
          pm2.disconnect();
          return reject(
            new InternalServerErrorException('Error connecting to PM2'),
          );
        }

        pm2.stop(id, (err) => {
          pm2.disconnect();

          if (err) {
            console.error('Error stopping PM2 process:', err);
            return reject(
              new InternalServerErrorException('Error stopping process'),
            );
          }

          resolve(true);
        });
      });
    });
  }

  async restartProcess(id: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      pm2.connect((err) => {
        if (err) {
          console.error('Error connecting to PM2:', err);
          pm2.disconnect();
          return reject(
            new InternalServerErrorException('Error connecting to PM2'),
          );
        }

        pm2.restart(id, (err) => {
          pm2.disconnect();

          if (err) {
            console.error('Error restarting PM2 process:', err);
            return reject(
              new InternalServerErrorException('Error restarting process'),
            );
          }

          resolve(true);
        });
      });
    });
  }

  async reloadProcess(id: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      pm2.connect((err) => {
        if (err) {
          console.error('Error connecting to PM2:', err);
          pm2.disconnect();
          return reject(
            new InternalServerErrorException('Error connecting to PM2'),
          );
        }

        pm2.reload(id, (err) => {
          pm2.disconnect();

          if (err) {
            console.error('Error reloading PM2 process:', err);
            return reject(
              new InternalServerErrorException('Error reloading process'),
            );
          }

          resolve(true);
        });
      });
    });
  }

  async getLogs(id: string, type: string) {
    return new Promise((resolve, reject) => {
      const CONNECTION_TIMEOUT = 15000;
      const OPERATION_TIMEOUT = 20000;

      let connectionTimeoutId: NodeJS.Timeout;
      let operationTimeoutId: NodeJS.Timeout;

      connectionTimeoutId = setTimeout(() => {
        console.error('PM2 connection timeout when fetching logs');
        reject(
          new InternalServerErrorException(
            'Connection timeout when retrieving logs',
          ),
        );
      }, CONNECTION_TIMEOUT);

      try {
        pm2.connect(async (err) => {
          if (err) {
            clearTimeout(connectionTimeoutId);
            console.error('Error connecting to PM2:', err);
            return reject(
              new InternalServerErrorException('Error connecting to PM2'),
            );
          }

          operationTimeoutId = setTimeout(() => {
            pm2.disconnect();
            console.error('PM2 describe timeout when fetching logs');
            reject(
              new InternalServerErrorException(
                'Operation timeout when retrieving logs',
              ),
            );
          }, OPERATION_TIMEOUT);

          pm2.describe(id, (err, processDesc: Pm2Process[]) => {
            clearTimeout(operationTimeoutId);
            clearTimeout(connectionTimeoutId);
            pm2.disconnect();

            if (err || !processDesc || processDesc.length === 0) {
              console.error('Error getting PM2 process:', err);
              return reject(new NotFoundException('Process not found'));
            }

            const process = processDesc[0];
            const logFile =
              type === 'out'
                ? process.pm2_env?.pm_out_log_path
                : process.pm2_env?.pm_err_log_path;

            if (!logFile || !fs.existsSync(logFile)) {
              return resolve([]);
            }

            try {
              const stats = fs.statSync(logFile);
              const fileSize = stats.size;
              const maxReadSize = 5000000;

              if (fileSize <= maxReadSize) {
                const logs = fs.readFileSync(logFile, 'utf8');
                const logLines = logs
                  .split('\n')
                  .filter((line) => line.trim() !== '');
                return resolve(logLines.slice(-1000));
              } else {
                const buffer = Buffer.alloc(maxReadSize);
                const fd = fs.openSync(logFile, 'r');
                fs.readSync(
                  fd,
                  buffer,
                  0,
                  maxReadSize,
                  Math.max(0, fileSize - maxReadSize),
                );
                fs.closeSync(fd);

                const logs = buffer.toString('utf8');
                const firstNewline = logs.indexOf('\n');
                const cleanLogs = logs.substring(firstNewline + 1);
                const logLines = cleanLogs
                  .split('\n')
                  .filter((line) => line.trim() !== '');

                return resolve(logLines.slice(-1000));
              }
            } catch (error) {
              console.error('Error reading log file:', error);
              reject(
                new InternalServerErrorException('Error reading log file'),
              );
            }
          });
        });
      } catch (outerError) {
        clearTimeout(connectionTimeoutId);
        console.error('Unhandled error in log retrieval:', outerError);
        reject(
          new InternalServerErrorException(
            'Server error while retrieving logs',
          ),
        );
      }
    });
  }

  async clearLogs(id: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      pm2.connect((err) => {
        if (err) {
          console.error('Error connecting to PM2:', err);
          pm2.disconnect();
          return reject(
            new InternalServerErrorException('Error connecting to PM2'),
          );
        }

        pm2.describe(id, (err, processDesc: Pm2Process[]) => {
          if (err || !processDesc || processDesc.length === 0) {
            pm2.disconnect();
            console.error('Error getting PM2 process:', err);
            return reject(new NotFoundException('Process not found'));
          }

          const process = processDesc[0];
          const outLogFile = process.pm2_env?.pm_out_log_path;
          const errLogFile = process.pm2_env?.pm_err_log_path;

          pm2.disconnect();

          try {
            if (outLogFile && fs.existsSync(outLogFile)) {
              fs.writeFileSync(outLogFile, '');
            }

            if (errLogFile && fs.existsSync(errLogFile)) {
              fs.writeFileSync(errLogFile, '');
            }

            resolve(true);
          } catch (error) {
            console.error('Error clearing log files:', error);
            reject(
              new InternalServerErrorException('Error clearing log files'),
            );
          }
        });
      });
    });
  }
}
