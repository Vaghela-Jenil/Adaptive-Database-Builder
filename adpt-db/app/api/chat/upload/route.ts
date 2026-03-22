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

    // Convert file to buffer with size tracking
    let buffer: Buffer;
    try {
      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
      console.log(`File converted to buffer: ${buffer.length} bytes (${(buffer.length / 1024 / 1024).toFixed(2)}MB)`);
    } catch (bufferError: any) {
      console.error('Error converting file to buffer:', bufferError);
      return NextResponse.json(
        { error: 'Failed to process file. File may be corrupted.' },
        { status: 400 }
      );
    }

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
        max_file_size: 52428800, // 50MB max on Cloudinary side
      };

      // Add image-specific optimizations
      if (isImage) {
        uploadOptions.quality = 'auto';
        uploadOptions.fetch_format = 'auto';
      }

      // Add video-specific optimizations
      if (isVideo) {
        uploadOptions.quality = 'auto';
        uploadOptions.eager_async = true;
        uploadOptions.media_metadata = true;
      }

      // Upload to Cloudinary using stream for efficient memory usage
      const result = await new Promise<any>((resolve, reject) => {
        try {
          const uploadStream = cloudinary.uploader.upload_stream(
            uploadOptions,
            (error: any, result: any) => {
              if (error) {
                console.error('Cloudinary stream callback error:', error);
                reject(error);
              } else {
                console.log('Cloudinary upload successful');
                resolve(result);
              }
            }
          );

          // Handle stream errors
          uploadStream.on('error', (streamError: any) => {
            console.error('Upload stream error:', streamError);
            reject(streamError);
          });

          // Write buffer to stream and end
          uploadStream.end(buffer);
        } catch (streamSetupError: any) {
          console.error('Error setting up upload stream:', streamSetupError);
          reject(streamSetupError);
        }
      });

      console.log('Upload completed successfully, returning response');
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
      console.error('=== Cloudinary Upload Error ===');
      console.error('Error type:', cloudinaryError?.constructor?.name);
      console.error('Error message:', cloudinaryError?.message);
      console.error('Error status:', cloudinaryError?.status);
      console.error('Error http_code:', cloudinaryError?.http_code);
      console.error('Error full:', JSON.stringify(cloudinaryError, null, 2));
      
      let errorMessage = 'Upload failed';
      let statusCode = 500;
      
      // Handle specific Cloudinary error types
      if (cloudinaryError.message?.includes('size')) {
        errorMessage = 'File size exceeds limit. Please use a smaller file.';
        statusCode = 400;
      } else if (cloudinaryError.message?.includes('timeout') || cloudinaryError.message?.includes('ETIMEDOUT')) {
        errorMessage = 'Upload timeout. The server took too long to process. Please try a smaller file.';
        statusCode = 408;
      } else if (cloudinaryError.message?.includes('Network') || cloudinaryError.message?.includes('ECONNREFUSED')) {
        errorMessage = 'Network error connecting to upload service. Please try again.';
        statusCode = 503;
      } else if (cloudinaryError.message?.includes('authenticat')) {
        errorMessage = 'Upload service authentication failed. Please contact support.';
        statusCode = 500;
      } else if (cloudinaryError.message?.includes('format') || cloudinaryError.message?.includes('type')) {
        errorMessage = 'File format not supported or file is corrupted.';
        statusCode = 400;
      } else if (cloudinaryError.message) {
        errorMessage = cloudinaryError.message.substring(0, 150); // Limit message length
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: statusCode }
      );
    }

  } catch (error: any) {
    console.error('=== Outer Catch - File Upload Error ===');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error?.message);
    
    let errorMessage = 'Upload error. Please try again.';
    
    if (error.message?.includes('ENOTFOUND') || error.message?.includes('Network')) {
      errorMessage = 'Network error. Please check your connection.';
    } else if (error.message?.includes('timeout') || error.code === 'ETIMEDOUT') {
      errorMessage = 'Request timeout. Please try again.';
    } else if (error.message?.includes('JSON') || error.message?.includes('parse')) {
      errorMessage = 'Invalid request format.';
    } else if (error.message) {
      errorMessage = error.message.substring(0, 150);
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}