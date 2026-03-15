const https = require("https");

const TARGET_HOST = "navvi-microsoft-case-study-product.vercel.app";
const TARGET_ORIGIN = "https://" + TARGET_HOST;
const PROXY_PREFIX = "/proxy";

module.exports = (req, res) => {
  // Strip /proxy prefix to get real path
  const rawPath = req.url || "/";
  const stripped = rawPath.replace(/^\/proxy\/?/, "");
  const targetPath = stripped ? "/" + stripped : "/";

  const options = {
    hostname: TARGET_HOST,
    path: targetPath,
    method: req.method || "GET",
    headers: {
      host: TARGET_HOST,
      "user-agent": req.headers["user-agent"] || "Mozilla/5.0",
      accept: req.headers["accept"] || "*/*",
      "accept-encoding": "identity",
      "accept-language": req.headers["accept-language"] || "en-US,en",
      referer: TARGET_ORIGIN,
    },
  };

  const proxyReq = https.request(options, (proxyRes) => {
    // Handle redirects
    if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
      const location = proxyRes.headers.location;
      const newLocation = location.startsWith("http")
        ? PROXY_PREFIX + "/" + location.replace(TARGET_ORIGIN + "/", "").replace(/^\//, "")
        : PROXY_PREFIX + location;
      res.writeHead(302, { location: newLocation });
      res.end();
      return;
    }

    const headers = Object.assign({}, proxyRes.headers);
    // Strip iframe-blocking headers
    delete headers["x-frame-options"];
    delete headers["content-security-policy"];
    delete headers["content-security-policy-report-only"];
    // Remove encoding so we can rewrite text
    delete headers["content-encoding"];
    delete headers["transfer-encoding"];
    headers["x-frame-options"] = "ALLOWALL";
    headers["content-security-policy"] = "frame-ancestors *";

    const ct = headers["content-type"] || "";

    if (ct.includes("text/html")) {
      let body = "";
      proxyRes.setEncoding("utf8");
      proxyRes.on("data", (chunk) => { body += chunk; });
      proxyRes.on("end", () => {
        // Rewrite absolute URLs pointing to target origin
        body = body.replace(
          new RegExp(TARGET_ORIGIN.replace(/\./g, "\\.") + "/", "g"),
          PROXY_PREFIX + "/"
        );
        // Rewrite root-relative paths: src="/ → src="/proxy/
        body = body.replace(
          /((?:src|href|action|data-src)=["'])\/(?!\/|proxy\/)/g,
          "$1" + PROXY_PREFIX + "/"
        );
        // Rewrite url(/ in inline styles
        body = body.replace(
          /url\(["']?\/(?!\/|proxy\/)([^"')]*)/g,
          "url('" + PROXY_PREFIX + "/$1"
        );
        // Remove any base tag and inject our own
        body = body.replace(/<base[^>]*>/gi, "");
        body = body.replace(
          /<head([^>]*)>/i,
          '<head$1><base href="' + PROXY_PREFIX + '/">'
        );

        delete headers["content-length"];
        res.writeHead(proxyRes.statusCode, headers);
        res.end(body);
      });

    } else if (ct.includes("javascript") || ct.includes("text/css")) {
      let body = "";
      proxyRes.setEncoding("utf8");
      proxyRes.on("data", (chunk) => { body += chunk; });
      proxyRes.on("end", () => {
        // Rewrite any hardcoded absolute URLs in JS/CSS
        body = body.replace(
          new RegExp(TARGET_ORIGIN.replace(/\./g, "\\.") + "/", "g"),
          PROXY_PREFIX + "/"
        );
        delete headers["content-length"];
        res.writeHead(proxyRes.statusCode, headers);
        res.end(body);
      });

    } else {
      // Binary files (images, fonts, etc.) — stream directly
      res.writeHead(proxyRes.statusCode, headers);
      proxyRes.pipe(res);
    }
  });

  proxyReq.on("error", (err) => {
    res.writeHead(502, { "content-type": "text/plain" });
    res.end("Proxy error: " + err.message);
  });

  proxyReq.end();
};
