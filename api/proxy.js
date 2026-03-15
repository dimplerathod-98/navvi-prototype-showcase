const https = require("https");

const TARGET_HOST = "navvi-microsoft-case-study-product.vercel.app";

module.exports = (req, res) => {
  const targetPath = "/";

  const options = {
    hostname: TARGET_HOST,
    path: targetPath,
    method: "GET",
    headers: {
      host: TARGET_HOST,
      "user-agent": "Mozilla/5.0",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  };

  const proxyReq = https.request(options, (proxyRes) => {
    const headers = Object.assign({}, proxyRes.headers);
    delete headers["x-frame-options"];
    delete headers["content-security-policy"];
    delete headers["content-security-policy-report-only"];
    headers["x-frame-options"] = "ALLOWALL";
    headers["content-security-policy"] = "frame-ancestors *";

    const ct = headers["content-type"] || "";

    if (ct.includes("text/html")) {
      let body = "";
      proxyRes.setEncoding("utf8");
      proxyRes.on("data", (chunk) => { body += chunk; });
      proxyRes.on("end", () => {
        res.writeHead(proxyRes.statusCode, headers);
        res.end(body);
      });
    } else {
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
