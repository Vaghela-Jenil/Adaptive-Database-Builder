import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/lib/models/Users';
import { v2 as cloudinary } from 'cloudinary';

const configureCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
};

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

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size (50MB max)
    const MAX_FILE_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: `File too large (Max 50MB)` }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Check if file is an image
    const isImage = file.type.startsWith('image/');

    try {
      // Configure Cloudinary
      configureCloudinary();
      
      // Convert buffer to data URI
      const base64 = buffer.toString('base64');
      const dataURI = `data:${file.type};base64,${base64}`;

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(dataURI, {
        resource_type: isImage ? 'image' : 'raw',
        folder: isImage ? 'chat/images' : 'chat/files',
        public_id: `${Date.now()}-${file.name.split('.')[0]}`,
        overwrite: false,
      });

      return NextResponse.json({
        url: result.secure_url,
        publicId: result.public_id,
        name: file.name,
        size: file.size,
        type: file.type,
        isImage: isImage,
        cloudinaryUrl: result.secure_url,
        savedAt: new Date().toISOString()
      }, { status: 201 });

    } catch (cloudinaryError: any) {
      console.error('Cloudinary upload error:', cloudinaryError);
      return NextResponse.json(
        { error: `Cloudinary error: ${cloudinaryError.message}` },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: `Upload error: ${error.message}` },
      { status: 500 }
    );
  }
}