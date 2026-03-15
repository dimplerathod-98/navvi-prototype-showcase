const https = require('https');
const http = require('http');

const TARGET_HOST = 'navvi-microsoft-case-study-product.vercel.app';
const TARGET_ORIGIN = `https://${TARGET_HOST}`;

module.exports = async (req, res) => {
  // Strip /proxy prefix to get real path
  const stripped = req.url.replace(/^\/proxy\/?/, '') || '';
  const targetPath = stripped ? `/${stripped}` : '/';

  const options = {
    hostname: TARGET_HOST,
    path: targetPath,
    method: req.method,
    headers: {
      'accept': req.headers['accept'] || '*/*',
      'accept-language': req.headers['accept-language'] || 'en-US,en',
      'user-agent': req.headers['user-agent'] || 'Mozilla/5.0',
      'host': TARGET_HOST,
    },
  };

  return new Promise((resolve) => {
    const proxyReq = https.request(options, (proxyRes) => {
      // Copy headers but strip iframe-blocking ones
      const headers = { ...proxyRes.headers };
      delete headers['x-frame-options'];
      delete headers['content-security-policy'];
      delete headers['content-security-policy-report-only'];
      headers['x-frame-options'] = 'ALLOWALL';
      headers['content-security-policy'] = "frame-ancestors *";

      const contentType = headers['content-type'] || '';

      if (contentType.includes('text/html')) {
        let body = '';
        proxyRes.setEncoding('utf8');
        proxyRes.on('data', chunk => { body += chunk; });
        proxyRes.on('end', () => {
          // Rewrite root-relative paths to go through /proxy
          body = body
            .replace(/((?:src|href|action)=["'])\/(?!\/|proxy\/|proxy")/g, '$1/proxy/')
            .replace(/url\(['"]?\/(?!\/|proxy\/)([^'")\s]*)/g, "url('/proxy/$1")
            .replace(/<base[^>]*>/gi, '')
            .replace(/<head([^>]*)>/i, '<head$1><base href="/proxy/">');

          res.writeHead(proxyRes.statusCode, headers);
          res.end(body);
          resolve();
        });
      } else {
        // Stream non-HTML responses (JS, CSS, images) directly
        res.writeHead(proxyRes.statusCode, headers);
        proxyRes.pipe(res);
        proxyRes.on('end', resolve);
      }
    });

    proxyReq.on('error', (err) => {
      res.writeHead(502, { 'content-type': 'text/plain' });
      res.end(`Proxy error: ${err.message}`);
      resolve();
    });

    proxyReq.end();
  });
};
