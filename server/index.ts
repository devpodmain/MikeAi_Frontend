import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { registerRoutes } from "./routes";
import { log, setupVite, serveStatic } from "./vite";

if (process.env.NODE_ENV === "production") {
  const noop = () => {};
  console.log = noop;
  console.info = noop;
  console.debug = noop;
  // If you also want to hide warnings, uncomment:
  console.warn = noop;
  // I recommend keeping console.error so you still see errors in logs.
}

const app = express();
const __dirname = path.resolve();

/* --------------------------------------
   2. Stripe Webhook – RAW body required
--------------------------------------- */
app.use(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" })
);

/* --------------------------
   3. JSON + URL middleware
--------------------------- */
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

/* --------------------------
   4. API request logger
--------------------------- */
app.use((req, res, next) => {
  const start = Date.now();
  let responseCopy: any = null;

  const originalJson = res.json.bind(res);
  res.json = (json) => {
    responseCopy = json;
    return originalJson(json);
  };

  res.on("finish", () => {
    if (req.path.startsWith("/api")) {
      const duration = Date.now() - start;
      let line = `${req.method} ${req.path} ${res.statusCode} in ${duration}ms`;

      if (responseCopy) {
        const out = JSON.stringify(responseCopy);
        line += out.length > 100 ? ` :: ${out.slice(0, 100)}…` : ` :: ${out}`;
      }

      log(line);
    }
  });

  next();
});

/* --------------------------
   5. Routes + startup tasks
--------------------------- */
(async () => {
  const server = await registerRoutes(app);

  // Activation maintenance job
  (async () => {
    try {
      const { storage } = await import("./storage");
      await storage.runActivationMaintenanceForAllOrgs();
    } catch (err) {
      console.error("[Startup] Activation maintenance failed:", err);
    }
  })();

  /* --------------------------
      6. Error handling
  --------------------------- */
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const code = err.status || err.statusCode || 500;
    res.status(code).json({ message: err.message || "Internal Server Error" });
    console.error(err);
  });

  /* --------------------------
      7. Development (Vite)
  --------------------------- */
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  /* --------------------------
      8. Start Server
  --------------------------- */
  const port = 5000;
  const listenOptions: any = { port, host: "0.0.0.0" };

  if (process.platform !== "win32") {
    listenOptions.reusePort = true;
  }

  server.listen(listenOptions, () => {
    log(`🚀 Server running at http://localhost:${port}`);
  });
})();
