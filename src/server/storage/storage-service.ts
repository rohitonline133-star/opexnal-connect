import { createHmac, randomBytes } from "node:crypto";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname, extname } from "node:path";

export type StorageBucket =
  "avatars" | "post-media" | "reel-media" | "story-media" | "message-attachments";

export interface StoragePolicy {
  allowedMimes: string[];
  allowedExtensions: string[];
  maxSizeBytes: number;
  isPublic: boolean;
}

const STORAGE_POLICIES: Record<StorageBucket, StoragePolicy> = {
  avatars: {
    allowedMimes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    allowedExtensions: [".jpg", ".jpeg", ".png", ".webp", ".gif"],
    maxSizeBytes: 5 * 1024 * 1024, // 5MB
    isPublic: true,
  },
  "post-media": {
    allowedMimes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "video/mp4",
      "video/quicktime",
      "video/webm",
    ],
    allowedExtensions: [".jpg", ".jpeg", ".png", ".webp", ".gif", ".mp4", ".mov", ".webm"],
    maxSizeBytes: 50 * 1024 * 1024, // 50MB
    isPublic: true,
  },
  "reel-media": {
    allowedMimes: ["video/mp4", "video/quicktime", "video/webm"],
    allowedExtensions: [".mp4", ".mov", ".webm"],
    maxSizeBytes: 100 * 1024 * 1024, // 100MB
    isPublic: true,
  },
  "story-media": {
    allowedMimes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "video/mp4",
      "video/quicktime",
    ],
    allowedExtensions: [".jpg", ".jpeg", ".png", ".webp", ".gif", ".mp4", ".mov"],
    maxSizeBytes: 30 * 1024 * 1024, // 30MB
    isPublic: false,
  },
  "message-attachments": {
    allowedMimes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "video/mp4",
      "audio/mpeg",
      "audio/ogg",
      "audio/wav",
      "application/pdf",
    ],
    allowedExtensions: [
      ".jpg",
      ".jpeg",
      ".png",
      ".webp",
      ".gif",
      ".mp4",
      ".mp3",
      ".ogg",
      ".wav",
      ".pdf",
    ],
    maxSizeBytes: 25 * 1024 * 1024, // 25MB
    isPublic: false,
  },
};

const STORAGE_SECRET =
  process.env["STORAGE_SECRET_KEY"] ||
  (process.env["NODE_ENV"] === "production"
    ? (() => {
        throw new Error(
          "[SECURITY CRITICAL] Mandatory STORAGE_SECRET_KEY is missing in production environment",
        );
      })()
    : "opexnal_storage_hmac_signing_secret_928172");
const CDN_BASE_URL = process.env["CDN_BASE_URL"] || "";
const STORAGE_ROOT = resolve(process.cwd(), ".storage");

// In-memory buffer fallback if filesystem writing is restricted in container
const memoryStorageMap = new Map<string, { buffer: Buffer; mime: string }>();

export interface UploadResult {
  storagePath: string;
  publicUrl: string;
  isPublic: boolean;
  mimeType: string;
  sizeBytes: number;
}

export async function uploadMedia(params: {
  bucket: StorageBucket;
  userId: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}): Promise<UploadResult> {
  const policy = STORAGE_POLICIES[params.bucket];
  if (!policy) {
    throw new Error(`Invalid storage bucket: ${params.bucket}`);
  }

  // 1. File size limit validation
  if (params.buffer.length > policy.maxSizeBytes) {
    throw new Error(
      `File size (${(params.buffer.length / (1024 * 1024)).toFixed(1)}MB) exceeds bucket limit of ${policy.maxSizeBytes / (1024 * 1024)}MB`,
    );
  }

  // 2. MIME type validation
  const normalizedMime = params.mimeType.toLowerCase();
  if (!policy.allowedMimes.includes(normalizedMime)) {
    throw new Error(
      `Unsupported MIME type: ${params.mimeType}. Allowed: ${policy.allowedMimes.join(", ")}`,
    );
  }

  // 3. Extension validation
  const ext =
    extname(params.fileName).toLowerCase() || (normalizedMime.includes("mp4") ? ".mp4" : ".jpg");
  if (!policy.allowedExtensions.includes(ext)) {
    throw new Error(
      `Unsupported file extension: ${ext}. Allowed: ${policy.allowedExtensions.join(", ")}`,
    );
  }

  // 4. Malware / Content scanning integration point
  const isSafe = await scanContentForMalware(params.buffer, normalizedMime);
  if (!isSafe) {
    throw new Error("File failed security scanning inspection and was rejected");
  }

  // 5. Generate secure object key
  const safeFileName = `${Date.now()}_${randomBytes(8).toString("hex")}${ext}`;
  const storagePath = `${params.bucket}/${params.userId}/${safeFileName}`;

  // 6. Persist file
  try {
    const fullPath = resolve(STORAGE_ROOT, storagePath);
    const dir = dirname(fullPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(fullPath, params.buffer);
  } catch {
    // Fallback to in-memory store
    memoryStorageMap.set(storagePath, { buffer: params.buffer, mime: normalizedMime });
  }

  // 7. Resolve URL
  let publicUrl: string;
  if (policy.isPublic) {
    publicUrl = CDN_BASE_URL
      ? `${CDN_BASE_URL}/${storagePath}`
      : `/api/v1/storage/public/${storagePath}`;
  } else {
    // Private media requires signed URL
    publicUrl = createSignedStorageUrl(storagePath, 3600);
  }

  return {
    storagePath,
    publicUrl,
    isPublic: policy.isPublic,
    mimeType: normalizedMime,
    sizeBytes: params.buffer.length,
  };
}

/**
 * Creates an HMAC-SHA256 signed URL with expiration timestamp.
 */
export function createSignedStorageUrl(storagePath: string, expiresInSeconds = 3600): string {
  const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const payload = `${storagePath}:${expires}`;
  const signature = createHmac("sha256", STORAGE_SECRET).update(payload).digest("hex");
  return `/api/v1/storage/signed?path=${encodeURIComponent(storagePath)}&expires=${expires}&sig=${signature}`;
}

/**
 * Verifies signed storage URL parameters.
 */
export function verifySignedStorageUrl(
  storagePath: string,
  expiresStr: string,
  signature: string,
): boolean {
  const expires = parseInt(expiresStr, 10);
  if (isNaN(expires) || Math.floor(Date.now() / 1000) > expires) {
    return false;
  }
  const payload = `${storagePath}:${expires}`;
  const expectedSig = createHmac("sha256", STORAGE_SECRET).update(payload).digest("hex");
  return expectedSig === signature;
}

/**
 * Retrieves file buffer from disk or memory.
 */
export function getStorageFile(storagePath: string): { buffer: Buffer; mime: string } | null {
  // Reject path traversal attempts with dot sequences or null bytes
  if (storagePath.includes("..") || storagePath.includes("\0")) {
    return null;
  }

  const mem = memoryStorageMap.get(storagePath);
  if (mem) return mem;

  const fullPath = resolve(STORAGE_ROOT, storagePath);
  // Ensure the resolved target path strictly resides within STORAGE_ROOT
  if (!fullPath.startsWith(STORAGE_ROOT)) {
    return null;
  }

  if (existsSync(fullPath)) {
    const buffer = readFileSync(fullPath);
    const ext = extname(storagePath).toLowerCase();
    let mime = "application/octet-stream";
    if (ext === ".jpg" || ext === ".jpeg") mime = "image/jpeg";
    if (ext === ".png") mime = "image/png";
    if (ext === ".webp") mime = "image/webp";
    if (ext === ".mp4") mime = "video/mp4";
    if (ext === ".mp3") mime = "audio/mpeg";
    return { buffer, mime };
  }

  return null;
}

/**
 * Content scanning hook (integration point for ClamAV / VirusTotal / Google Cloud Web Risk).
 */
async function scanContentForMalware(buffer: Buffer, mime: string): Promise<boolean> {
  // Check for known malicious executable signatures / polyglots inside image headers
  if (buffer.length >= 2 && buffer[0] === 0x4d && buffer[1] === 0x5a) {
    // Windows executable MZ header disguised as media
    return false;
  }
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x7f &&
    buffer[1] === 0x45 &&
    buffer[2] === 0x4c &&
    buffer[3] === 0x46
  ) {
    // ELF binary disguised as media
    return false;
  }
  return true;
}
