export const config = { runtime: 'edge' };

const TARGET = 'https://navvi-microsoft-case-study-product.vercel.app';

export default async function handler(req) {
  const url = new URL(req.url);

  // Strip /proxy prefix → get the real path the app needs
  // /proxy       → /
  // /proxy/      → /
  // /proxy/about → /about
  const stripped = url.pathname.replace(/^\/proxy\/?/, '') || '';
  const targetPath = stripped ? `/${stripped}` : '/';
  const targetUrl = `${TARGET}${targetPath}${url.search}`;

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        // Forward useful headers but spoof the host
        'accept': req.headers.get('accept') || '*/*',
        'accept-language': req.headers.get('accept-language') || 'en-US,en',
        'user-agent': req.headers.get('user-agent') || 'Mozilla/5.0',
        'referer': TARGET,
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
    });

    const headers = new Headers(response.headers);

    // Strip ALL headers that block iframe embedding
    headers.delete('x-frame-options');
    headers.delete('content-security-policy');
    headers.delete('content-security-policy-report-only');

    // Allow embedding from anywhere
    headers.set('x-frame-options', 'ALLOWALL');
    headers.set('content-security-policy', "frame-ancestors *");

    const contentType = headers.get('content-type') || '';

    if (contentType.includes('text/html')) {
      let body = await response.text();

      // Rewrite all root-relative paths to go through /proxy
      // so that navigation inside the app stays within the iframe
      body = body
        // src="/..." and href="/..." → src="/proxy/..." href="/proxy/..."
        .replace(/((?:src|href|action)=["'])\/(?!\/|proxy\/|proxy")/g, '$1/proxy/')
        // url('/...') in CSS
        .replace(/url\(['"]?\/(?!\/|proxy\/)([^'")\s]*)/g, "url('/proxy/$1")
        // <base href="..."> — override any base tag
        .replace(/<base[^>]*>/gi, `<base href="/proxy/">`)
        // inject a base tag if none exists
        .replace(/<head([^>]*)>/i, `<head$1><base href="/proxy/">`);

      return new Response(body, {
        status: response.status,
        headers,
      });
    }

    // For non-HTML (JS, CSS, images, fonts etc.) — pass through as-is
    return new Response(response.body, {
      status: response.status,
      headers,
    });

  } catch (err) {
    return new Response(`Proxy error: ${err.message}`, {
      status: 502,
      headers: { 'content-type': 'text/plain' },
    });
  }
}
