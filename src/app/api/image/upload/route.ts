import { put } from '@vercel/blob';
import sharp from 'sharp';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename') as string;
  const requestBuffer = await request.arrayBuffer();
  const imageBuffer = Buffer.from(requestBuffer);
  const session = await auth();
  if (!session) return NextResponse.json({
    error: 'No access'
  });

  const resizedFile = await sharp(imageBuffer)
  .resize(800, 800)
  .jpeg({ quality: 80 })
  // ⚠️ The below code is for App Router Route Handlers only
  const blob = await put(filename, resizedFile, {
    access: 'public',
    allowOverwrite: true,
  });

  // Here's the code for Pages API Routes:
  // const blob = await put(filename, request, {
  //   access: 'public',
  // });

  return NextResponse.json(blob);
}

// The next lines are required for Pages API Routes only
// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };
