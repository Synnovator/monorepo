#!/usr/bin/env node
import { S3Client, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = 'synnovator-temp';
const CUTOFF_MS = 24 * 60 * 60 * 1000; // 24 hours

const cutoff = new Date(Date.now() - CUTOFF_MS);
const { Contents = [] } = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET }));

let deleted = 0;
for (const obj of Contents) {
  if (obj.LastModified < cutoff) {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: obj.Key }));
    console.log(`Deleted: ${obj.Key}`);
    deleted++;
  }
}
console.log(`Cleanup complete. Checked ${Contents.length} objects, deleted ${deleted}.`);
