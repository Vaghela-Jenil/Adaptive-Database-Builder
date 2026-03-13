import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/lib/models/Users';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const currentUser = await User.findOne({ clerkId });
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const receiverId = formData.get('receiverId') as string;

    if (!file || !receiverId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large (Max 5MB)' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create uploads directory if it doesn't exist
    // Note: On Vercel, this local folder is read-only. 
    // This works for local development or VPS (DigitalOcean/Railway).
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'chat');
    await mkdir(uploadsDir, { recursive: true });

    // Sanitize filename: remove spaces and special characters
    const safeName = file.name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9.-]/g, '');
    const filename = `${Date.now()}-${safeName}`;
    const filepath = join(uploadsDir, filename);

    // Save file to the public directory
    await writeFile(filepath, buffer);

    const fileUrl = `/uploads/chat/${filename}`;

    return NextResponse.json({
      url: fileUrl,
      name: file.name,
      size: file.size,
      type: file.type
    }, { status: 201 });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}