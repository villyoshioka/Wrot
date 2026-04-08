import { requestUrl } from "obsidian";

export interface OGPData {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  url: string;
}

interface CacheEntry {
  data: OGPData;
  timestamp: number;
}

const TTL = 3600000; // 1 hour

export class OGPCache {
  private cache = new Map<string, CacheEntry>();
  private pending = new Map<string, Promise<OGPData | null>>();
  enabled = true;

  get(url: string): OGPData | null {
    const entry = this.cache.get(url);
    if (entry && Date.now() - entry.timestamp < TTL) {
      return entry.data;
    }
    return null;
  }

  async fetchOGP(url: string): Promise<OGPData | null> {
    if (!this.enabled) return null;
    if (url.startsWith("obsidian://")) return null;

    // Return cached data if fresh
    const cached = this.get(url);
    if (cached) return cached;

    // Deduplicate in-flight requests
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
    if (!this.isPublicUrl(url)) return null;
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
      this.cache.set(url, { data, timestamp: Date.now() });
      return data;
    } catch {
      return null;
    }
  }

  private parseOGP(html: string, url: string): OGPData {
    const get = (prop: string): string | undefined => {
      // Match both property= and name= variants, handle single/double quotes
      const re = new RegExp(
        `<meta[^>]*(?:property|name)=["']og:${prop}["'][^>]*content=["']([^"']*)["']`,
        "i"
      );
      const match = html.match(re);
      if (match) return match[1];

      // Try reversed attribute order: content before property
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
