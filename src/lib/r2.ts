import { env } from "./env";
import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from "@aws-sdk/client-s3";

// Check if we're in demo mode
const isDemo = env.r2.accountId === "demo";

export const s3 = isDemo ? null : new S3Client({
  region: "auto",
  endpoint: `https://${env.r2.accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.r2.accessKeyId,
    secretAccessKey: env.r2.secretAccessKey,
  },
});

export type FileMeta = {
  id: string;
  name: string;
  size: number;
  createdAt: string; // ISO
  contentType?: string;
  description?: string;
};

const META_PREFIX = "meta/"; // e.g., meta/abcd.json
const FILE_PREFIX = "uploads/"; // e.g., uploads/abcd.bin

export function fileKey(id: string) { return `${FILE_PREFIX}${id}`; }
export function metaKey(id: string) { return `${META_PREFIX}${id}.json`; }

export async function putFile(id: string, body: ReadableStream<any> | Blob | Buffer, size: number, contentType?: string) {
  if (isDemo) {
    console.log(`[DEMO] Would upload file ${id} (${size} bytes, ${contentType})`);
    return;
  }
  await s3!.send(new PutObjectCommand({ Bucket: env.r2.bucket, Key: fileKey(id), Body: body as any, ContentLength: size, ContentType: contentType }));
}

export async function getFile(id: string) {
  if (isDemo) {
    console.log(`[DEMO] Would download file ${id}`);
    // Return a mock response for demo
    return {
      Body: Buffer.from("Demo file content"),
      ContentType: "text/plain",
      ContentLength: 18
    };
  }
  return s3!.send(new GetObjectCommand({ Bucket: env.r2.bucket, Key: fileKey(id) }));
}

export async function deleteFile(id: string) {
  if (isDemo) {
    console.log(`[DEMO] Would delete file ${id}`);
    return;
  }
  await s3!.send(new DeleteObjectCommand({ Bucket: env.r2.bucket, Key: fileKey(id) }));
  await s3!.send(new DeleteObjectCommand({ Bucket: env.r2.bucket, Key: metaKey(id) }));
}

export async function putMeta(meta: FileMeta) {
  if (isDemo) {
    console.log(`[DEMO] Would save metadata for ${meta.id}:`, meta);
    return;
  }
  const body = Buffer.from(JSON.stringify(meta));
  await s3!.send(new PutObjectCommand({ Bucket: env.r2.bucket, Key: metaKey(meta.id), Body: body, ContentType: "application/json" }));
}

export async function currentTotalBytes(): Promise<number> {
  if (isDemo) {
    console.log(`[DEMO] Would check total bytes`);
    return 0; // Demo starts with empty storage
  }
  
  let token: string | undefined = undefined;
  let total = 0;
  do {
    const res = await s3!.send(new ListObjectsV2Command({ Bucket: env.r2.bucket, Prefix: FILE_PREFIX, ContinuationToken: token }));
    for (const obj of res.Contents || []) total += obj.Size || 0;
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return total;
}

export async function purgeOldestUntilFits(requiredBytes: number): Promise<{deleted: string[], before: number, after: number}> {
  if (isDemo) {
    console.log(`[DEMO] Would purge oldest files to fit ${requiredBytes} bytes`);
    return { deleted: [], before: 0, after: 0 };
  }
  
  const before = await currentTotalBytes();
  if (before + requiredBytes <= env.r2.maxTotalBytes) return { deleted: [], before, after: before };

  // list all uploads with LastModified, sort oldest first
  let token: string | undefined = undefined;
  const items: { key: string; size: number; last: Date }[] = [];
  do {
    const res = await s3!.send(new ListObjectsV2Command({ Bucket: env.r2.bucket, Prefix: FILE_PREFIX, ContinuationToken: token }));
    for (const obj of res.Contents || []) {
      if (!obj.Key) continue;
      items.push({ key: obj.Key, size: obj.Size || 0, last: obj.LastModified || new Date(0) });
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);

  items.sort((a, b) => a.last.getTime() - b.last.getTime()); // oldest first

  const deleted: string[] = [];
  let freed = 0;
  for (const it of items) {
    if (before + requiredBytes - freed <= env.r2.maxTotalBytes) break;
    await s3!.send(new DeleteObjectCommand({ Bucket: env.r2.bucket, Key: it.key }));
    // also nuke matching meta if exists
    const id = it.key.replace(FILE_PREFIX, "");
    await s3!.send(new DeleteObjectCommand({ Bucket: env.r2.bucket, Key: metaKey(id) }));
    freed += it.size;
    deleted.push(it.key);
  }

  const after = before - freed;
  return { deleted, before, after };
}
