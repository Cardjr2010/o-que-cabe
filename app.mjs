import handler from "./api/web.js";

export default async function appHandler(req, res) {
  const url = new URL(req.url || "/", "http://localhost");
  if (url.pathname === "/api/ping") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ ok: true, route: "ping", runtime: "vercel" }));
    return;
  }
  return handler(req, res);
}
