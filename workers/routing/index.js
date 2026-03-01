/**
 * ASIO Routing Worker — Cloudflare Edge
 * A/B rollout: React/Next.js → Astro 4
 * Control via ROLLOUT_PERCENT env var (0-100)
 */

export default {
  async fetch(request, env) {
    const ROLLOUT = parseInt(env.ROLLOUT_PERCENT || '100');
    const url = new URL(request.url);

    // Static assets — siempre desde nueva versión
    if (url.pathname.match(/\.(js|css|png|jpg|svg|ico|woff2|webp)$/)) {
      return fetch(new Request(`https://asio-marketing.pages.dev${url.pathname}`, request));
    }

    // Health check
    if (url.pathname === '/_health') {
      return new Response(JSON.stringify({ rollout: ROLLOUT, ts: Date.now() }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Determinar versión por IP hash
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const hash = simpleHash(ip + url.pathname);
    const useNewVersion = ROLLOUT >= 100 || (hash % 100) < ROLLOUT;

    const origin = useNewVersion
      ? 'https://asio-marketing.pages.dev'   // Astro 4
      : env.ORIGIN_LEGACY || 'https://asiomarketing.com-origin';

    const targetURL = `${origin}${url.pathname}${url.search}`;

    try {
      const response = await fetch(new Request(targetURL, {
        method: request.method,
        headers: request.headers,
        body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
      }));

      // Clone con headers de telemetría
      const newResponse = new Response(response.body, response);
      newResponse.headers.set('X-ASIO-Version', useNewVersion ? 'astro-v2' : 'legacy');
      newResponse.headers.set('X-ASIO-Rollout', ROLLOUT.toString());
      return newResponse;

    } catch (err) {
      // Fallback en error
      return fetch(request);
    }
  },
};

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}
