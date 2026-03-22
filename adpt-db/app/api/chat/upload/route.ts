import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/lib/models/Users';
import { configureCloudinary } from '@/lib/cloudinary';

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

    // Check file type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    // Validate file size based on type
    const MAX_IMAGE_SIZE = 50 * 1024 * 1024; // 50MB for images
    const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB for videos
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB for other files

    if (isVideo && file.size > MAX_VIDEO_SIZE) {
      return NextResponse.json(
        { error: `Video file too large (Max 100MB). Your video is ${(file.size / 1024 / 1024).toFixed(2)}MB` },
        { status: 400 }
      );
    } else if (isImage && file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { error: `Image file too large (Max 50MB). Your image is ${(file.size / 1024 / 1024).toFixed(2)}MB` },
        { status: 400 }
      );
    } else if (!isImage && !isVideo && file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large (Max 50MB). Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB` },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    try {
      // Configure Cloudinary
      const cloudinary = configureCloudinary();
      
      // Determine resource type based on file type
      let resourceType: 'image' | 'video' | 'raw' = 'raw';
      let folder = 'chat/files';
      
      if (isImage) {
        resourceType = 'image';
        folder = 'chat/images';
      } else if (isVideo) {
        resourceType = 'video';
        folder = 'chat/videos';
      }

      // Prepare upload options
      const uploadOptions: any = {
        resource_type: resourceType,
        folder: folder,
        public_id: `${Date.now()}-${file.name.split('.')[0]}`,
        overwrite: false,
        timeout: 300000, // 5 minutes timeout for large files
      };

      // Add video-specific optimizations
      if (isVideo) {
        uploadOptions.quality = 'auto';
        uploadOptions.eager_async = true;
      }

      // Upload to Cloudinary using buffer directly (more efficient than base64)
      const result = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error: any, result: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        });

        uploadStream.end(buffer);
      });

      return NextResponse.json({
        url: result.secure_url,
        publicId: result.public_id,
        name: file.name,
        size: file.size,
        type: file.type,
        isImage: isImage,
        isVideo: isVideo,
        cloudinaryUrl: result.secure_url,
        savedAt: new Date().toISOString()
      }, { status: 201 });

    } catch (cloudinaryError: any) {
      console.error('Cloudinary upload error:', cloudinaryError);
      console.error('Error message:', cloudinaryError.message);
      console.error('Error status:', cloudinaryError.status);
      console.error('Error http_code:', cloudinaryError.http_code);
      
      let errorMessage = 'Upload failed';
      
      if (cloudinaryError.message) {
        errorMessage = cloudinaryError.message;
      } else if (cloudinaryError.error?.message) {
        errorMessage = cloudinaryError.error.message;
      }
      
      return NextResponse.json(
        { error: `${errorMessage}` },
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