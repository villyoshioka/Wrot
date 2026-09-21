import { App, TFile, Vault, normalizePath } from "obsidian";

declare const moment: typeof import("moment");

const IMAGE_PREFIX = "Pasted Image";

const MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/bmp": "bmp",
};

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

function getExtension(file: File): string {
  if (MIME_TO_EXT[file.type]) return MIME_TO_EXT[file.type];
  const match = /^image\/(.+)$/.exec(file.type);
  if (match) return match[1];
  const nameMatch = /\.([a-zA-Z0-9]+)$/.exec(file.name);
  return nameMatch ? nameMatch[1].toLowerCase() : "png";
}

interface VaultWithAttachmentApi extends Vault {
  getAvailablePathForAttachments(
    filename: string,
    extension: string,
    sourceFile: TFile
  ): Promise<string>;
}

/**
 * Free path inside a folder Wrot picked itself.
 *
 * The vault's own attachment lookup applies Obsidian's folder setting, so it cannot be used
 * here; the duplicate handling it performs has to be repeated. Names carry a to-the-second
 * timestamp, so a collision only happens when two images are attached within the same second.
 */
function availablePathIn(app: App, folder: string, baseName: string, ext: string): string {
  const candidate = (suffix: string): string =>
    normalizePath(`${folder}/${baseName}${suffix}.${ext}`);
  let path = candidate("");
  for (let n = 1; app.vault.getAbstractFileByPath(path); n++) {
    path = candidate(` ${n}`);
  }
  return path;
}

/**
 * `folder` is the vault-relative folder Wrot saves into. Empty, or naming a folder that is not
 * there any more, hands the choice back to Obsidian's own attachment setting — Wrot never
 * creates the folder itself.
 */
export async function saveImageToVault(
  app: App,
  file: File,
  sourceFile: TFile,
  folder?: string
): Promise<TFile> {
  const buffer = await file.arrayBuffer();
  const ext = getExtension(file);
  const baseName = `${IMAGE_PREFIX} ${moment().format("YYYYMMDDHHmmss")}`;

  const target = folder?.trim();
  if (target && app.vault.getFolderByPath(normalizePath(target))) {
    return await app.vault.createBinary(
      availablePathIn(app, normalizePath(target), baseName, ext),
      buffer
    );
  }

  const vault = app.vault as VaultWithAttachmentApi;
  const path = await vault.getAvailablePathForAttachments(
    baseName,
    ext,
    sourceFile
  );
  return await app.vault.createBinary(path, buffer);
}

const SHRINK_MAX_EDGE = 2048;
const SHRINK_QUALITY = 0.85;

function hasAlpha(ctx: CanvasRenderingContext2D, width: number, height: number): boolean {
  const data = ctx.getImageData(0, 0, width, height).data;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) return true;
  }
  return false;
}

// Animated WebP sets the animation bit in its VP8X header; animated PNG carries an acTL chunk
// before the first IDAT. Redrawing either would keep only the first frame.
async function isAnimated(file: File): Promise<boolean> {
  if (file.type === "image/webp") {
    const head = new Uint8Array(await file.slice(0, 21).arrayBuffer());
    const isVp8x = String.fromCharCode(...head.slice(12, 16)) === "VP8X";
    return isVp8x && (head[20] & 0x02) !== 0;
  }
  if (file.type === "image/png") {
    const view = new DataView(await file.arrayBuffer());
    for (let pos = 8; pos + 8 <= view.byteLength; ) {
      const type = String.fromCharCode(
        view.getUint8(pos + 4), view.getUint8(pos + 5), view.getUint8(pos + 6), view.getUint8(pos + 7)
      );
      if (type === "acTL") return true;
      if (type === "IDAT") return false;
      pos += 12 + view.getUint32(pos);
    }
  }
  return false;
}

/**
 * Redraws the image at most SHRINK_MAX_EDGE on its long side and re-encodes it as WebP.
 * WebKit cannot encode WebP and silently hands back a PNG instead, so the returned type is
 * checked; there the fallback is JPEG for opaque images and PNG when there is transparency.
 * Redrawing drops EXIF and other embedded data. Returns the original when it is a GIF/SVG
 * (animation, vectors), when the output would not be smaller, or when anything fails.
 */
export async function shrinkImage(file: File): Promise<File> {
  if (!isImageFile(file) || file.type === "image/gif" || file.type === "image/svg+xml") {
    return file;
  }
  let bitmap: ImageBitmap | null = null;
  try {
    if (await isAnimated(file)) return file;
    bitmap = await createImageBitmap(file);
    const scale = Math.min(1, SHRINK_MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = createEl("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    const encode = (type: string, quality?: number): Promise<Blob | null> =>
      new Promise((resolve) => canvas.toBlob(resolve, type, quality));
    let blob = await encode("image/webp", SHRINK_QUALITY);
    if (blob?.type !== "image/webp") {
      const alpha = file.type === "image/jpeg" ? false : hasAlpha(ctx, width, height);
      blob = alpha ? await encode("image/png") : await encode("image/jpeg", SHRINK_QUALITY);
    }
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.${MIME_TO_EXT[blob.type]}`, {
      type: blob.type,
    });
  } catch {
    return file;
  } finally {
    bitmap?.close();
  }
}

export function buildEmbedLink(savedFile: TFile): string {
  return `![[${savedFile.name}]]`;
}
