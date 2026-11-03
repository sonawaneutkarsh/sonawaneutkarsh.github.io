// Minimal static file server that behaves like GitHub Pages for local tests
// (used by Playwright's webServer and the V3/Svelte comparison runs):
// directory URLs serve index.html, unknown paths serve 404.html with status
// 404, and byte-range requests work so videos can stream. Responses are not
// compressed; size comparisons gzip the files separately.

import { createServer } from "node:http";
import { createReadStream, statSync, existsSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".pdf": "application/pdf",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

export function serve(root, port = 0) {
  const base = resolve(root);
  const server = createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    let path = normalize(join(base, decodeURIComponent(url.pathname)));
    if (!path.startsWith(base)) {
      res.writeHead(403).end();
      return;
    }
    if (existsSync(path) && statSync(path).isDirectory()) {
      if (!url.pathname.endsWith("/")) {
        res.writeHead(301, { Location: `${url.pathname}/` }).end();
        return;
      }
      path = join(path, "index.html");
    }
    let status = 200;
    if (!existsSync(path)) {
      status = 404;
      path = join(base, "404.html");
    }
    const size = statSync(path).size;
    const headers = { "Content-Type": TYPES[extname(path)] || "application/octet-stream", "Accept-Ranges": "bytes" };
    const range = req.headers.range && /bytes=(\d*)-(\d*)/.exec(req.headers.range);
    if (range && status === 200) {
      const start = range[1] ? Number(range[1]) : 0;
      const end = range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
      res.writeHead(206, { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": end - start + 1 });
      createReadStream(path, { start, end }).pipe(res);
      return;
    }
    res.writeHead(status, { ...headers, "Content-Length": size });
    if (req.method === "HEAD") res.end();
    else createReadStream(path).pipe(res);
  });
  return new Promise((resolveServer) => {
    server.listen(port, "127.0.0.1", () => resolveServer(server));
  });
}
