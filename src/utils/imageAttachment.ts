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

export function buildEmbedLink(savedFile: TFile): string {
  return `![[${savedFile.name}]]`;
}
