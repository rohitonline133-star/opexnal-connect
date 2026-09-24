import {
  uploadMedia,
  getStorageFile,
  verifySignedStorageUrl,
  StorageBucket,
} from "../../storage/storage-service";
import { requireAuth } from "../../security/authorizer";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function handleStorageRoutes(
  request: Request,
  pathname: string,
): Promise<Response | null> {
  const method = request.method.toUpperCase();

  // POST /api/v1/storage/upload
  if (pathname === "/api/v1/storage/upload" && method === "POST") {
    const auth = await requireAuth(request);
    const contentType = request.headers.get("content-type") || "";

    try {
      if (contentType.includes("multipart/form-data")) {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const bucket = (formData.get("bucket") as StorageBucket) || "post-media";

        if (!file) {
          return json({ error: "No file provided in form data" }, 400);
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const result = await uploadMedia({
          bucket,
          userId: auth.user.userId,
          fileName: file.name,
          mimeType: file.type || "image/jpeg",
          buffer,
        });

        return json(result, 201);
      } else {
        // Direct JSON base64 upload
        const body = (await request.json()) as {
          bucket?: StorageBucket;
          fileName?: string;
          mimeType?: string;
          base64Data?: string;
        };

        if (!body.base64Data || !body.fileName || !body.mimeType) {
          return json({ error: "fileName, mimeType, and base64Data are required" }, 400);
        }

        const buffer = Buffer.from(body.base64Data, "base64");
        const result = await uploadMedia({
          bucket: body.bucket || "post-media",
          userId: auth.user.userId,
          fileName: body.fileName,
          mimeType: body.mimeType,
          buffer,
        });

        return json(result, 201);
      }
    } catch (e: unknown) {
      return json({ error: e instanceof Error ? e.message : "Upload failed" }, 400);
    }
  }

  // GET /api/v1/storage/signed
  if (pathname === "/api/v1/storage/signed" && method === "GET") {
    const url = new URL(request.url);
    const path = url.searchParams.get("path");
    const expires = url.searchParams.get("expires");
    const sig = url.searchParams.get("sig");

    if (!path || !expires || !sig) {
      return json({ error: "Missing signed URL parameters" }, 400);
    }

    const isValid = verifySignedStorageUrl(path, expires, sig);
    if (!isValid) {
      return json({ error: "Signed URL is invalid or has expired" }, 403);
    }

    const file = getStorageFile(path);
    if (!file) {
      return json({ error: "File not found" }, 404);
    }

    return new Response(new Uint8Array(file.buffer), {
      status: 200,
      headers: {
        "Content-Type": file.mime,
        "Cache-Control": "private, max-age=3600",
      },
    });
  }

  // GET /api/v1/storage/public/*
  const publicMatch = pathname.match(/^\/api\/v1\/storage\/public\/(.+)$/);
  if (publicMatch && method === "GET") {
    const storagePath = publicMatch[1];
    if (!storagePath) {
      return json({ error: "Path required" }, 400);
    }
    // Public media bucket check
    if (
      !storagePath.startsWith("avatars/") &&
      !storagePath.startsWith("post-media/") &&
      !storagePath.startsWith("reel-media/")
    ) {
      return json({ error: "Access denied to private storage path" }, 403);
    }

    const file = getStorageFile(storagePath);
    if (!file) {
      return json({ error: "File not found" }, 404);
    }

    return new Response(new Uint8Array(file.buffer), {
      status: 200,
      headers: {
        "Content-Type": file.mime,
        "Cache-Control": "public, max-age=86400",
      },
    });
  }

  return null;
}
