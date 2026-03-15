export const config = { runtime: 'edge' };

const TARGET = 'https://navvi-microsoft-case-study-product.vercel.app';

export default async function handler(req) {
  const url = new URL(req.url);
  // Strip the /proxy prefix to get the real path
  const targetPath = url.pathname.replace(/^\/proxy/, '') || '/';
  const targetUrl = `${TARGET}${targetPath}${url.search}`;

  const proxyReq = new Request(targetUrl, {
    method: req.method,
    headers: req.headers,
    body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
  });

  const response = await fetch(proxyReq);

  // Clone headers but strip the ones that block iframe embedding
  const headers = new Headers(response.headers);
  headers.delete('x-frame-options');
  headers.delete('content-security-policy');
  headers.set('x-frame-options', 'ALLOWALL');
  headers.set('content-security-policy', "frame-ancestors *");

  // Rewrite absolute URLs in HTML so assets/links still work
  const contentType = headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    let body = await response.text();
    // Rewrite root-relative asset paths to go through proxy
    body = body.replace(/(href|src|action)="\/(?!\/)/g, `$1="/proxy/`);
    return new Response(body, {
      status: response.status,
      headers,
    });
  }

  return new Response(response.body, {
    status: response.status,
    headers,
  });
}
