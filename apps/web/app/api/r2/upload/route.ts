import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@synnovator/shared/auth';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, 'application/pdf'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_PDF_SIZE = 20 * 1024 * 1024;

function getS3Client() {
  return new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT!,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request, process.env.AUTH_SECRET!);
    if (!session) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const context = formData.get('context') as string | null;

    if (!file) return NextResponse.json({ error: 'missing file' }, { status: 400 });
    if (!context || !['hackathon', 'proposal', 'profile'].includes(context))
      return NextResponse.json({ error: 'invalid context' }, { status: 400 });
    if (!ALLOWED_TYPES.includes(file.type))
      return NextResponse.json({ error: 'unsupported file type' }, { status: 400 });

    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_PDF_SIZE;
    if (file.size > maxSize)
      return NextResponse.json(
        { error: isImage ? 'image exceeds 5MB limit' : 'PDF exceeds 20MB limit' },
        { status: 400 },
      );

    const ext = file.name.split('.').pop() || 'bin';
    const hash = crypto.randomUUID().slice(0, 8);
    const filename = `${context}/${Date.now()}-${hash}.${ext}`;

    const s3 = getS3Client();
    const buffer = await file.arrayBuffer();

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.R2_TEMP_BUCKET || 'synnovator-temp',
        Key: filename,
        Body: new Uint8Array(buffer),
        ContentType: file.type,
      }),
    );

    const tempBaseUrl =
      process.env.R2_TEMP_PUBLIC_URL || `https://${process.env.R2_TEMP_BUCKET}.r2.dev`;
    const url = `${tempBaseUrl}/${filename}`;

    return NextResponse.json({ url, filename, size: file.size });
  } catch (err) {
    console.error('r2/upload error:', err);
    return NextResponse.json({ error: 'upload failed' }, { status: 500 });
  }
}
