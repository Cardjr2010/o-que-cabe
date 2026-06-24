import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const publicDir = path.join(root, "public");

function send(res, status, body, headers = {}) {
  res.statusCode = status;
  for (const [key, value] of Object.entries(headers)) res.setHeader(key, value);
  res.end(body);
}

function sendJson(res, status, data) {
  send(res, status, JSON.stringify(data), {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".ico": "image/x-icon",
  }[ext] || "application/octet-stream";
}

function safeJoin(base, target) {
  const normalized = path.normalize(target).replace(/^(\.\.[/\\])+/, "");
  return path.join(base, normalized);
}

export default function handler(req, res) {
  const url = new URL(req.url, "http://localhost");
  const pathname = url.pathname;

  if (pathname === "/") {
    sendJson(res, 200, { status: "ok", project: "O Que Cabe" });
    return;
  }

  if (pathname === "/favicon.ico") {
    const filePath = path.join(publicDir, "favicon.svg");
    if (fs.existsSync(filePath)) {
      send(res, 200, fs.readFileSync(filePath), { "Content-Type": contentType(filePath) });
      return;
    }
  }

  const staticCandidate = safeJoin(publicDir, pathname);
  if (fs.existsSync(staticCandidate) && fs.statSync(staticCandidate).isFile()) {
    send(res, 200, fs.readFileSync(staticCandidate), { "Content-Type": contentType(staticCandidate) });
    return;
  }

  if (pathname === "/favicon.png") {
    const pngPath = path.join(publicDir, "favicon.png");
    if (fs.existsSync(pngPath)) {
      send(res, 200, fs.readFileSync(pngPath), { "Content-Type": contentType(pngPath) });
      return;
    }
  }

  sendJson(res, 404, { status: "not_found" });
}
