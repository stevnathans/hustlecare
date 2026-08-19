/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/admin/products/fetch-metadata/route.ts
export const runtime = 'nodejs'; // needed for dns/promises

import { NextResponse } from 'next/server';
import dns from 'node:dns/promises';
import { load } from 'cheerio';
import { requirePermission } from '@/lib/admin-utils';

const MAX_REDIRECTS = 5;
const FETCH_TIMEOUT_MS = 8000;
const MAX_BYTES = 3 * 1024 * 1024; // cap page size we'll read
const UA = 'Mozilla/5.0 (compatible; ProductLinkPreview/1.0)';

// --- SSRF guardrails -------------------------------------------------
// Since this endpoint fetches an arbitrary admin-supplied URL server-side,
// we resolve the hostname and reject anything pointing at loopback/private/
// link-local ranges — otherwise an admin (or a compromised admin session)
// could use this to probe internal infrastructure. Re-checked on every
// redirect hop, since a public URL can redirect to an internal one.
function isPrivateOrLoopbackIp(ip: string): boolean {
  const v4 = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const a = Number(v4[1]);
    const b = Number(v4[2]);
    if (a === 127 || a === 10 || a === 0) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true;
    return false;
  }
  const lower = ip.toLowerCase();
  if (lower === '::1') return true;
  if (lower.startsWith('fe80:')) return true;
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true;
  if (lower.startsWith('::ffff:')) return isPrivateOrLoopbackIp(lower.replace('::ffff:', ''));
  return false;
}

async function assertSafeUrl(url: URL) {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Only http/https links are supported.');
  }
  if (url.username || url.password) {
    throw new Error('URL must not contain credentials.');
  }
  if (url.hostname === 'localhost' || url.hostname.endsWith('.local')) {
    throw new Error("That URL isn't reachable — please use the product's public page.");
  }
  let addresses;
  try {
    addresses = await dns.lookup(url.hostname, { all: true });
  } catch {
    throw new Error('Could not resolve that URL.');
  }
  if (addresses.some((a) => isPrivateOrLoopbackIp(a.address))) {
    throw new Error("That URL isn't reachable — please use the product's public page.");
  }
}

async function fetchWithSafeRedirects(startUrl: URL): Promise<{ html: string; finalUrl: string }> {
  let current = startUrl;
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    await assertSafeUrl(current);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(current.toString(), {
        redirect: 'manual',
        signal: controller.signal,
        headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml' },
      });
    } finally {
      clearTimeout(timeout);
    }

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location) throw new Error('The page redirected without a destination.');
      current = new URL(location, current);
      continue;
    }

    if (!res.ok) {
      throw new Error(
        `The page returned an error (${res.status}). Some sites block automated requests — you may need to enter details manually.`
      );
    }

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      throw new Error("That link doesn't point to a web page.");
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('Could not read the page content.');
    const chunks: Uint8Array[] = [];
    let received = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > MAX_BYTES) {
        await reader.cancel();
        break;
      }
      chunks.push(value);
    }
    const html = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString('utf-8');
    return { html, finalUrl: current.toString() };
  }
  throw new Error('Too many redirects.');
}

// --- Parsing -----------------------------------------------------------
function firstNonEmpty(...vals: Array<string | undefined | null>): string {
  for (const v of vals) if (v && v.trim()) return v.trim();
  return '';
}

function extractJsonLdProduct($: ReturnType<typeof load>): any | null {
  const scripts = $('script[type="application/ld+json"]').toArray();
  for (const el of scripts) {
    const raw = $(el).contents().text();
    if (!raw) continue;
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      continue;
    }
    const candidates: any[] = [];
    const collect = (node: any) => {
      if (!node) return;
      if (Array.isArray(node)) return node.forEach(collect);
      if (node['@graph']) collect(node['@graph']);
      candidates.push(node);
    };
    collect(parsed);

    const product = candidates.find((c) => {
      const type = c?.['@type'];
      if (!type) return false;
      const types = Array.isArray(type) ? type : [type];
      return types.some((t: string) => typeof t === 'string' && t.toLowerCase() === 'product');
    });
    if (product) return product;
  }
  return null;
}

function priceFromOffers(offers: any): { price: string; currency: string } {
  if (!offers) return { price: '', currency: '' };
  const offer = Array.isArray(offers) ? offers[0] : offers;
  const price = offer?.price ?? offer?.lowPrice ?? offer?.priceSpecification?.price;
  const currency = offer?.priceCurrency ?? offer?.priceSpecification?.priceCurrency;
  return { price: price != null ? String(price) : '', currency: currency ? String(currency) : '' };
}

export async function GET(request: Request) {
  try {
    // Reuses the same permission as product creation — this is only ever
    // called from the admin product form.
    await requirePermission('products.create');

    const { searchParams } = new URL(request.url);
    const raw = searchParams.get('url');
    if (!raw) return NextResponse.json({ error: 'Missing url.' }, { status: 400 });

    let url: URL;
    try {
      url = new URL(raw);
    } catch {
      return NextResponse.json({ error: "That doesn't look like a valid URL." }, { status: 400 });
    }

    const { html, finalUrl } = await fetchWithSafeRedirects(url);
    const $ = load(html);

    const jsonLd = extractJsonLdProduct($);
    const jsonLdImage = jsonLd?.image
      ? Array.isArray(jsonLd.image)
        ? jsonLd.image[0]
        : typeof jsonLd.image === 'object'
        ? jsonLd.image.url
        : jsonLd.image
      : '';
    const { price: jsonLdPrice, currency: jsonLdCurrency } = priceFromOffers(jsonLd?.offers);

    const ogTitle = $('meta[property="og:title"]').attr('content') || '';
    const ogDescription = $('meta[property="og:description"]').attr('content') || '';
    const ogImage = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content') || '';
    const ogPrice = $('meta[property="product:price:amount"]').attr('content') || $('meta[property="og:price:amount"]').attr('content') || '';
    const ogCurrency = $('meta[property="product:price:currency"]').attr('content') || $('meta[property="og:price:currency"]').attr('content') || '';

    const metaDescription = $('meta[name="description"]').attr('content') || '';
    const pageTitle = $('title').first().text() || '';

    const name = firstNonEmpty(jsonLd?.name, ogTitle, pageTitle);
    const description = firstNonEmpty(jsonLd?.description, ogDescription, metaDescription);
    const imageRaw = firstNonEmpty(jsonLdImage, ogImage);
    const price = firstNonEmpty(jsonLdPrice, ogPrice);
    const currency = firstNonEmpty(jsonLdCurrency, ogCurrency).toUpperCase();

    let image = '';
    if (imageRaw) {
      try {
        image = new URL(imageRaw, finalUrl).toString();
      } catch {
        image = imageRaw;
      }
    }

    if (!name && !description && !image && !price) {
      return NextResponse.json(
        { error: "Couldn't find product details on that page — it may need JavaScript to load, or block automated requests." },
        { status: 422 }
      );
    }

    return NextResponse.json({ name, description, image, price, currency, finalUrl });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (error.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Error fetching product metadata:', error);
    return NextResponse.json({ error: 'Failed to fetch product details.' }, { status: 500 });
  }
}