import { createServer } from "node:http";
import { Buffer } from "node:buffer";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function stripWrappingQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function loadDotEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return [];
  }

  const contents = readFileSync(filePath, "utf8");
  const loadedKeys = [];

  for (const rawLine of contents.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const normalizedLine = line.startsWith("export ")
      ? line.slice("export ".length).trim()
      : line;
    const separatorIndex = normalizedLine.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const key = normalizedLine.slice(0, separatorIndex).trim();
    const rawValue = normalizedLine.slice(separatorIndex + 1).trim();

    if (!key || process.env[key] !== undefined) {
      continue;
    }

    process.env[key] = stripWrappingQuotes(rawValue);
    loadedKeys.push(key);
  }

  return loadedKeys;
}

const DOTENV_LOCAL_PATH = resolve(process.cwd(), ".env.local");
const loadedEnvKeys = loadDotEnvFile(DOTENV_LOCAL_PATH);

if (!process.env.SUPABASE_URL && process.env.VITE_SUPABASE_URL) {
  process.env.SUPABASE_URL = process.env.VITE_SUPABASE_URL;
}

const HOST = process.env.HUSHH_API_HOST || "127.0.0.1";
const PORT = Number(process.env.PORT || process.env.HUSHH_API_PORT || 3000);

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function withHelpers(res) {
  res.shouldKeepOpen = false;

  res.status = (code) => {
    res.statusCode = code;
    return res;
  };

  res.json = (payload) => {
    if (!res.headersSent) {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
    }
    res.end(JSON.stringify(payload));
    return res;
  };

  res.send = (payload) => {
    if (payload == null) {
      res.end();
      return res;
    }

    if (typeof payload === "object" && !Buffer.isBuffer(payload)) {
      return res.json(payload);
    }

    res.end(payload);
    return res;
  };

  return res;
}

async function readBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return undefined;
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");
  const contentType = (req.headers["content-type"] || "").toLowerCase();

  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(rawBody);
    } catch {
      return rawBody;
    }
  }

  if (contentType.includes("application/x-www-form-urlencoded")) {
    return Object.fromEntries(new URLSearchParams(rawBody));
  }

  return rawBody;
}

function buildModuleSpecifier(pathname) {
  if (!pathname.startsWith("/api/")) {
    return null;
  }

  const routePath = pathname.slice("/api/".length).replace(/^\/+|\/+$/g, "");
  if (!routePath) {
    return null;
  }

  if (!/^[a-zA-Z0-9/_-]+$/.test(routePath) || routePath.includes("..")) {
    return null;
  }

  return `../api/${routePath}.js`;
}

const server = createServer(async (req, nativeRes) => {
  const res = withHelpers(nativeRes);
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  const url = new URL(req.url || "/", `http://${req.headers.host || `${HOST}:${PORT}`}`);
  const moduleSpecifier = buildModuleSpecifier(url.pathname);

  if (!moduleSpecifier) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  req.query = Object.fromEntries(url.searchParams.entries());
  req.path = url.pathname;
  req.body = await readBody(req);

  try {
    const module = await import(moduleSpecifier);
    const handler = module.default || module;

    if (typeof handler !== "function") {
      throw new Error(`API module ${moduleSpecifier} does not export a handler`);
    }

    await handler(req, res);

    if (!res.shouldKeepOpen && !res.writableEnded) {
      res.status(res.statusCode || 204).end();
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected local API server error";
    const missingModule =
      error instanceof Error &&
      (error.code === "ERR_MODULE_NOT_FOUND" ||
        error.message.includes("Cannot find module"));

    if (missingModule) {
      res.status(404).json({
        error: "API route not found",
        route: url.pathname,
      });
      return;
    }

    console.error(`[dev-api] ${req.method} ${url.pathname}`, error);
    if (!res.headersSent) {
      res.status(500).json({
        error: "Local API server error",
        detail: message,
      });
    }
  }
});

server.listen(PORT, HOST, () => {
  if (loadedEnvKeys.length > 0) {
    console.log(
      `[dev-api] loaded ${loadedEnvKeys.length} env vars from ${DOTENV_LOCAL_PATH}`
    );
  } else if (existsSync(DOTENV_LOCAL_PATH)) {
    console.log(
      `[dev-api] using shell-provided env vars over ${DOTENV_LOCAL_PATH}`
    );
  } else {
    console.log(
      `[dev-api] no .env.local found at ${DOTENV_LOCAL_PATH}; relying on shell env`
    );
  }

  console.log(`[dev-api] listening on http://${HOST}:${PORT}`);
  console.log("[dev-api] Vite can proxy /api requests here during local development");
});
