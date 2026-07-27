import { requestUrl } from "obsidian";

export interface OGPData {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  url: string;
}

interface CacheEntry {
  /** null records a URL that could not be resolved, so it is not retried immediately. */
  data: OGPData | null;
  expiresAt: number;
}

const SUCCESS_TTL = 3600000; // 1 hour
// Failures are remembered too, otherwise a URL that always fails (a site returning 403 to bots,
// or an offline vault) is re-requested on every redraw. Kept short so a recovered site comes back.
const FAILURE_TTL = 600000; // 10 minutes
const PRUNE_THRESHOLD = 500;

export class OGPCache {
  private cache = new Map<string, CacheEntry>();
  private pending = new Map<string, Promise<OGPData | null>>();
  enabled = true;

  get(url: string): OGPData | null {
    return this.fresh(url)?.data ?? null;
  }

  /** True when the outcome for this URL is already known, success or failure. */
  isResolved(url: string): boolean {
    return this.fresh(url) !== null;
  }

  /** True when a fetch would actually be attempted; false means there is nothing to wait for. */
  canFetch(url: string): boolean {
    if (!this.enabled) return false;
    if (url.startsWith("obsidian://")) return false;
    return this.isPublicUrl(url);
  }

  private fresh(url: string): CacheEntry | null {
    const entry = this.cache.get(url);
    if (!entry) return null;
    if (Date.now() >= entry.expiresAt) {
      this.cache.delete(url);
      return null;
    }
    return entry;
  }

  private remember(url: string, data: OGPData | null): void {
    if (this.cache.size >= PRUNE_THRESHOLD) this.pruneExpired();
    this.cache.set(url, {
      data,
      expiresAt: Date.now() + (data ? SUCCESS_TTL : FAILURE_TTL),
    });
  }

  private pruneExpired(): void {
    const now = Date.now();
    for (const [url, entry] of this.cache) {
      if (now >= entry.expiresAt) this.cache.delete(url);
    }
  }

  async fetchOGP(url: string): Promise<OGPData | null> {
    if (!this.canFetch(url)) return null;

    const entry = this.fresh(url);
    if (entry) return entry.data;

    // Coalesce concurrent requests for the same URL
    const inflight = this.pending.get(url);
    if (inflight) return inflight;

    const promise = this.doFetch(url);
    this.pending.set(url, promise);
    try {
      return await promise;
    } finally {
      this.pending.delete(url);
    }
  }

  private isPublicUrl(urlString: string): boolean {
    try {
      const parsed = new URL(urlString);
      if (!["http:", "https:"].includes(parsed.protocol)) return false;
      const hostname = parsed.hostname.toLowerCase();
      if (hostname === "localhost" || hostname === "[::1]") return false;
      if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|0\.)/.test(hostname)) return false;
      if (hostname.endsWith(".local") || hostname.endsWith(".internal")) return false;
      return true;
    } catch {
      return false;
    }
  }

  private async doFetch(url: string): Promise<OGPData | null> {
    try {
      const resp = await requestUrl({
        url,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; ObsidianBot/1.0)",
          Accept: "text/html",
        },
      });

      const html = resp.text;
      const data = this.parseOGP(html, url);
      this.remember(url, data);
      return data;
    } catch {
      this.remember(url, null);
      return null;
    }
  }

  private parseOGP(html: string, url: string): OGPData {
    const get = (prop: string): string | undefined => {
      // Match property= or name=, single or double quotes
      const re = new RegExp(
        `<meta[^>]*(?:property|name)=["']og:${prop}["'][^>]*content=["']([^"']*)["']`,
        "i"
      );
      const match = html.match(re);
      if (match) return match[1];

      // Handle reversed attribute order (content before property)
      const re2 = new RegExp(
        `<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']og:${prop}["']`,
        "i"
      );
      const match2 = html.match(re2);
      return match2?.[1];
    };

    const title =
      get("title") ||
      html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim();

    return {
      title,
      description: get("description"),
      image: get("image"),
      siteName: get("site_name"),
      url,
    };
  }

  clear(): void {
    this.cache.clear();
  }
}
