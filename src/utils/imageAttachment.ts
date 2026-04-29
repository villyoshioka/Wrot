import { App, TFile, Vault } from "obsidian";

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

export async function saveImageToVault(
  app: App,
  file: File,
  sourceFile: TFile
): Promise<TFile> {
  const buffer = await file.arrayBuffer();
  const ext = getExtension(file);
  const baseName = `${IMAGE_PREFIX} ${moment().format("YYYYMMDDHHmmss")}`;
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
