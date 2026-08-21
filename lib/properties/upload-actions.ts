"use server";

import { randomUUID } from "node:crypto";
import { requireRole } from "@/lib/auth/require-role";
import { getFirebaseAdminStorage } from "@/lib/firebase/admin";
import { MAX_IMAGE_BYTES } from "./upload-constants";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export interface UploadPropertyImagesResult {
  urls: string[];
  errors: string[];
}

function extensionFor(file: File): string {
  const fromName = file.name.split(".").pop();
  if (fromName && fromName.length <= 5) return fromName.toLowerCase();
  return file.type.split("/")[1] ?? "jpg";
}

export async function uploadPropertyImages(formData: FormData): Promise<UploadPropertyImagesResult> {
  await requireRole(["admin"]);

  const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (!bucketName) {
    throw new Error("Missing NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET env var.");
  }

  const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File);
  const bucket = getFirebaseAdminStorage().bucket(bucketName);

  const urls: string[] = [];
  const errors: string[] = [];

  for (const file of files) {
    if (file.size > MAX_IMAGE_BYTES) {
      errors.push(`${file.name}: supera los 5MB.`);
      continue;
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      errors.push(`${file.name}: formato no soportado (use JPG, PNG, WEBP o GIF).`);
      continue;
    }

    const objectPath = `properties/${randomUUID()}.${extensionFor(file)}`;
    const downloadToken = randomUUID();
    const buffer = Buffer.from(await file.arrayBuffer());

    await bucket.file(objectPath).save(buffer, {
      contentType: file.type,
      metadata: { metadata: { firebaseStorageDownloadTokens: downloadToken } },
    });

    urls.push(
      `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
        objectPath,
      )}?alt=media&token=${downloadToken}`,
    );
  }

  return { urls, errors };
}
