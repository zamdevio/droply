import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { env } from "./env";

// Check if we're in demo mode
const isDemo = env.r2.accountId === "demo";

export const r2 = isDemo ? null : new S3Client({
  region: "auto",
  endpoint: `https://${env.r2.accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.r2.accessKeyId,
    secretAccessKey: env.r2.secretAccessKey,
  },
  requestHandler: { connectionTimeout: 5000 as any }, // 5s timeout
});

// R2 helper functions with streaming support
export async function r2PutStream(opts: { 
  bucket: string; 
  key: string; 
  body: any; 
  contentType: string; 
  checksum?: string 
}) {
  if (isDemo) {
    console.log(`[DEMO] Would upload to R2: ${opts.key} (${opts.contentType})`);
    return;
  }

  await r2!.send(new PutObjectCommand({
    Bucket: opts.bucket,
    Key: opts.key,
    Body: opts.body,
    ContentType: opts.contentType,
    // Note: R2 doesn't support ChecksumSHA256 in the same way as S3
    // We'll store the checksum in metadata instead
    ...(opts.checksum && { 
      Metadata: { 
        'x-amz-meta-checksum': opts.checksum 
      } 
    }),
  }));
}

export async function r2GetStream(opts: { bucket: string; key: string }) {
  if (isDemo) {
    console.log(`[DEMO] Would download from R2: ${opts.key}`);
    // Return mock response for demo
    return { 
      body: Buffer.from("Demo file content"), 
      contentLength: 18, 
      contentType: "text/plain" 
    };
  }

  const res = await r2!.send(new GetObjectCommand({ 
    Bucket: opts.bucket, 
    Key: opts.key 
  }));
  
  return { 
    body: res.Body as any, 
    contentLength: res.ContentLength, 
    contentType: res.ContentType 
  };
}

export async function r2Delete(opts: { bucket: string; key: string }) {
  if (isDemo) {
    console.log(`[DEMO] Would delete from R2: ${opts.key}`);
    return;
  }

  await r2!.send(new DeleteObjectCommand({ 
    Bucket: opts.bucket, 
    Key: opts.key 
  }));
}

export async function r2Head(opts: { bucket: string; key: string }) {
  if (isDemo) {
    console.log(`[DEMO] Would check R2 object: ${opts.key}`);
    return null;
  }

  try {
    return await r2!.send(new HeadObjectCommand({ 
      Bucket: opts.bucket, 
      Key: opts.key 
    }));
  } catch (error) {
    return null; // Object doesn't exist
  }
}

// Legacy functions for backward compatibility (will be removed)
export const s3 = r2;
export function fileKey(id: string) { return `files/${id}`; }
export function metaKey(id: string) { return `meta/${id}.json`; }

// These will be replaced by the new PostgreSQL-based functions
export async function putFile(id: string, body: ReadableStream<any> | Blob | Buffer, size: number, contentType?: string) {
  if (isDemo) {
    console.log(`[DEMO] Would upload file ${id} (${size} bytes, ${contentType})`);
    return;
  }
  
  const key = `files/${id}`;
  await r2PutStream({
    bucket: env.r2.bucket,
    key,
    body: body as any,
    contentType: contentType || "application/octet-stream",
  });
}

export async function getFile(id: string) {
  if (isDemo) {
    console.log(`[DEMO] Would download file ${id}`);
    return {
      Body: Buffer.from("Demo file content"),
      ContentType: "text/plain",
      ContentLength: 18
    };
  }
  
  const key = `files/${id}`;
  return r2GetStream({ bucket: env.r2.bucket, key });
}

export async function deleteFile(id: string) {
  if (isDemo) {
    console.log(`[DEMO] Would delete file ${id}`);
    return;
  }
  
  const key = `files/${id}`;
  await r2Delete({ bucket: env.r2.bucket, key });
}

export async function putMeta(meta: any) {
  if (isDemo) {
    console.log(`[DEMO] Would save metadata for ${meta.id}:`, meta);
    return;
  }
  
  // This will be replaced by PostgreSQL
  console.warn("putMeta is deprecated - use PostgreSQL instead");
}

export async function currentTotalBytes(): Promise<number> {
  if (isDemo) {
    console.log(`[DEMO] Would check total bytes`);
    return 0;
  }

  let token: string | undefined = undefined;
  let total = 0;
  do {
    const res: any = await r2!.send(new ListObjectsV2Command({ 
      Bucket: env.r2.bucket, 
      Prefix: "files/", 
      ContinuationToken: token 
    }));
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
    const res: any = await r2!.send(new ListObjectsV2Command({ 
      Bucket: env.r2.bucket, 
      Prefix: "files/", 
      ContinuationToken: token 
    }));
    for (const obj of res.Contents || []) {
      if (!obj.Key) continue;
      items.push({ key: obj.Key, size: obj.Size || 0, last: obj.LastModified || new Date(0) });
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);

  items.sort((a, b) => a.last.getTime() - b.last.getTime());

  const deleted: string[] = [];
  let freed = 0;
  for (const it of items) {
    if (before + requiredBytes - freed <= env.r2.maxTotalBytes) break;
    await r2!.send(new DeleteObjectCommand({ Bucket: env.r2.bucket, Key: it.key }));
    freed += it.size;
    deleted.push(it.key);
  }

  return { deleted, before, after: before - freed };
}
