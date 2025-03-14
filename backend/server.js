import express from "express";
import cors from "cors";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import pm2 from "pm2";
import fs from "fs";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use(express.static(join(__dirname, "../dist")));

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "default_secret_key"
    );
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Token verification error:", err);
    return res.status(403).json({ message: "Forbidden" });
  }
};

const USER_DATA_FILE = join(__dirname, "user.json");

const getUserData = () => {
  try {
    if (fs.existsSync(USER_DATA_FILE)) {
      const data = fs.readFileSync(USER_DATA_FILE, "utf8");
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error("Error reading user data:", error);
    return null;
  }
};

const saveUserData = (userData) => {
  try {
    fs.writeFileSync(USER_DATA_FILE, JSON.stringify(userData, null, 2));
    return true;
  } catch (error) {
    console.error("Error saving user data:", error);
    return false;
  }
};

app.post("/api/auth/register", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Username and password are required" });
  }

  const existingUser = getUserData();
  if (existingUser) {
    return res
      .status(400)
      .json({ success: false, message: "A user is already registered" });
  }

  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      console.error("Error hashing password:", err);
      return res
        .status(500)
        .json({ success: false, message: "Error creating user" });
    }

    const userData = {
      username,
      password: hashedPassword,
    };

    if (saveUserData(userData)) {
      res.json({ success: true });
    } else {
      res
        .status(500)
        .json({ success: false, message: "Error saving user data" });
    }
  });
});

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Username and password are required" });
  }

  const userData = getUserData();
  if (!userData || userData.username !== username) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid credentials" });
  }

  bcrypt.compare(password, userData.password, (err, result) => {
    if (err || !result) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        username,
        email: username + "@example.com",
        name: username,
        sub: Math.random().toString(36).substring(2),
        role: "admin",
      },
      process.env.JWT_SECRET || "default_secret_key",
      { expiresIn: "24h" }
    );
    res.json({ token, username });
  });
});

app.get("/api/auth/check-user", (req, res) => {
  const userData = getUserData();
  res.json({ exists: !!userData });
});

app.get("/api/pm2/processes", authenticateToken, (req, res) => {
  pm2.connect((err) => {
    if (err) {
      console.error("Error connecting to PM2:", err);
      return res.status(500).json({ message: "Error connecting to PM2" });
    }

    pm2.list((err, processList) => {
      pm2.disconnect();

      if (err) {
        console.error("Error getting PM2 processes:", err);
        return res.status(500).json({ message: "Error getting PM2 processes" });
      }

      const processes = processList.map((process) => {
        return {
          name: process.name,
          pm_id: process.pm_id.toString(),
          pid: process.pid,
          status: process.pm2_env.status,
          cpu: process.monit ? process.monit.cpu : 0,
          memory: process.monit ? process.monit.memory : 0,
          uptime:
            process.pm2_env.status === "online"
              ? Date.now() - process.pm2_env.pm_uptime
              : 0,
          restart_count: process.pm2_env.restart_time,
          created_at: process.pm2_env.created_at || 0,
          updated_at: process.pm2_env.updated_at || 0,
          started_at: process.pm2_env.pm_uptime || 0,
          script_path: process.pm2_env.pm_exec_path,
          cwd: process.pm2_env.pm_cwd,
          exec_interpreter: process.pm2_env.exec_interpreter,
          env: process.pm2_env.env || {},
        };
      });

      res.json(processes);
    });
  });
});

app.get("/api/pm2/processes/:id", authenticateToken, (req, res) => {
  const processId = req.params.id;

  pm2.connect((err) => {
    if (err) {
      console.error("Error connecting to PM2:", err);
      return res.status(500).json({ message: "Error connecting to PM2" });
    }

    pm2.describe(processId, (err, processDesc) => {
      pm2.disconnect();

      if (err || !processDesc || processDesc.length === 0) {
        console.error("Error getting PM2 process:", err);
        return res.status(404).json({ message: "Process not found" });
      }

      const process = processDesc[0];
      const processInfo = {
        name: process.name,
        pm_id: process.pm_id.toString(),
        pid: process.pid,
        status: process.pm2_env.status,
        cpu: process.monit ? process.monit.cpu : 0,
        memory: process.monit ? process.monit.memory : 0,
        uptime:
          process.pm2_env.status === "online"
            ? Date.now() - process.pm2_env.pm_uptime
            : 0,
        restart_count: process.pm2_env.restart_time,
        created_at: process.pm2_env.created_at || 0,
        updated_at: process.pm2_env.updated_at || 0,
        started_at: process.pm2_env.pm_uptime || 0,
        script_path: process.pm2_env.pm_exec_path,
        cwd: process.pm2_env.pm_cwd,
        exec_interpreter: process.pm2_env.exec_interpreter,
        env: process.pm2_env.env || {},
      };

      res.json(processInfo);
    });
  });
});

app.post("/api/pm2/processes/:id/start", authenticateToken, (req, res) => {
  const processId = req.params.id;

  pm2.connect((err) => {
    if (err) {
      console.error("Error connecting to PM2:", err);
      return res.status(500).json({ message: "Error connecting to PM2" });
    }

    pm2.start(processId, (err) => {
      pm2.disconnect();

      if (err) {
        console.error("Error starting PM2 process:", err);
        return res
          .status(500)
          .json({ success: false, message: "Error starting process" });
      }

      res.json({ success: true });
    });
  });
});

app.post("/api/pm2/processes/:id/stop", authenticateToken, (req, res) => {
  const processId = req.params.id;

  pm2.connect((err) => {
    if (err) {
      console.error("Error connecting to PM2:", err);
      return res.status(500).json({ message: "Error connecting to PM2" });
    }

    pm2.stop(processId, (err) => {
      pm2.disconnect();

      if (err) {
        console.error("Error stopping PM2 process:", err);
        return res
          .status(500)
          .json({ success: false, message: "Error stopping process" });
      }

      res.json({ success: true });
    });
  });
});

app.post("/api/pm2/processes/:id/restart", authenticateToken, (req, res) => {
  const processId = req.params.id;

  pm2.connect((err) => {
    if (err) {
      console.error("Error connecting to PM2:", err);
      return res.status(500).json({ message: "Error connecting to PM2" });
    }

    pm2.restart(processId, (err) => {
      pm2.disconnect();

      if (err) {
        console.error("Error restarting PM2 process:", err);
        return res
          .status(500)
          .json({ success: false, message: "Error restarting process" });
      }

      res.json({ success: true });
    });
  });
});

app.post("/api/pm2/processes/:id/reload", authenticateToken, (req, res) => {
  const processId = req.params.id;

  pm2.connect((err) => {
    if (err) {
      console.error("Error connecting to PM2:", err);
      return res.status(500).json({ message: "Error connecting to PM2" });
    }

    pm2.reload(processId, (err) => {
      pm2.disconnect();

      if (err) {
        console.error("Error reloading PM2 process:", err);
        return res
          .status(500)
          .json({ success: false, message: "Error reloading process" });
      }

      res.json({ success: true });
    });
  });
});

app.get("/api/pm2/processes/:id/logs/:type", authenticateToken, (req, res) => {
  const processId = req.params.id;
  const logType = req.params.type;

  const CONNECTION_TIMEOUT = 15000;
  const OPERATION_TIMEOUT = 20000;

  let hasResponded = false;

  const safeRespond = (status, data) => {
    if (!hasResponded) {
      hasResponded = true;
      res.status(status).json(data);
    }
  };

  const connectionTimeout = setTimeout(() => {
    console.error("PM2 connection timeout when fetching logs");
    safeRespond(504, { message: "Connection timeout when retrieving logs" });
  }, CONNECTION_TIMEOUT);

  try {
    pm2.connect(async (err) => {
      if (err) {
        clearTimeout(connectionTimeout);
        console.error("Error connecting to PM2:", err);
        return safeRespond(500, { message: "Error connecting to PM2" });
      }

      const describeTimeout = setTimeout(() => {
        pm2.disconnect();
        console.error("PM2 describe timeout when fetching logs");
        safeRespond(504, { message: "Operation timeout when retrieving logs" });
      }, OPERATION_TIMEOUT);

      pm2.describe(processId, (err, processDesc) => {
        clearTimeout(describeTimeout);
        clearTimeout(connectionTimeout);
        pm2.disconnect();

        if (err || !processDesc || processDesc.length === 0) {
          console.error("Error getting PM2 process:", err);
          return safeRespond(404, { message: "Process not found" });
        }

        const process = processDesc[0];
        const logFile =
          logType === "out"
            ? process.pm2_env.pm_out_log_path
            : process.pm2_env.pm_err_log_path;

        if (!logFile || !fs.existsSync(logFile)) {
          return safeRespond(200, []);
        }

        try {
          const stats = fs.statSync(logFile);
          const fileSize = stats.size;
          const maxReadSize = 5000000;

          if (fileSize <= maxReadSize) {
            const logs = fs.readFileSync(logFile, "utf8");
            const logLines = logs
              .split("\n")
              .filter((line) => line.trim() !== "");
            return safeRespond(200, logLines.slice(-1000));
          } else {
            const buffer = Buffer.alloc(maxReadSize);
            const fd = fs.openSync(logFile, "r");
            fs.readSync(
              fd,
              buffer,
              0,
              maxReadSize,
              Math.max(0, fileSize - maxReadSize)
            );
            fs.closeSync(fd);

            const logs = buffer.toString("utf8");
            const firstNewline = logs.indexOf("\n");
            const cleanLogs = logs.substring(firstNewline + 1);
            const logLines = cleanLogs
              .split("\n")
              .filter((line) => line.trim() !== "");

            return safeRespond(200, logLines.slice(-1000));
          }
        } catch (error) {
          console.error("Error reading log file:", error);
          safeRespond(500, { message: "Error reading log file" });
        }
      });
    });
  } catch (outerError) {
    clearTimeout(connectionTimeout);
    console.error("Unhandled error in log retrieval:", outerError);
    safeRespond(500, { message: "Server error while retrieving logs" });
  }
});

app.delete("/api/pm2/processes/:id/logs", authenticateToken, (req, res) => {
  const processId = req.params.id;

  pm2.connect((err) => {
    if (err) {
      console.error("Error connecting to PM2:", err);
      return res.status(500).json({ message: "Error connecting to PM2" });
    }

    pm2.describe(processId, (err, processDesc) => {
      if (err || !processDesc || processDesc.length === 0) {
        pm2.disconnect();
        console.error("Error getting PM2 process:", err);
        return res.status(404).json({ message: "Process not found" });
      }

      const process = processDesc[0];
      const outLogFile = process.pm2_env.pm_out_log_path;
      const errLogFile = process.pm2_env.pm_err_log_path;

      pm2.disconnect();

      try {
        if (outLogFile && fs.existsSync(outLogFile)) {
          fs.writeFileSync(outLogFile, "");
        }

        if (errLogFile && fs.existsSync(errLogFile)) {
          fs.writeFileSync(errLogFile, "");
        }

        res.json({ success: true });
      } catch (error) {
        console.error("Error clearing log files:", error);
        res
          .status(500)
          .json({ success: false, message: "Error clearing log files" });
      }
    });
  });
});

app.get("*", (req, res) => {
  res.sendFile(join(__dirname, "../dist/index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
