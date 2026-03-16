import { v2 as cloudinary } from 'cloudinary';
import { UploadedFileAsset } from '@/lib/uploadedFiles';

const sanitizeEnv = (value: string | undefined) => {
  if (!value) return '';
  return value.trim().replace(/^['\"]|['\"]$/g, '');
};

const isValidCloudName = (cloudName: string) => /^[a-z0-9-]+$/.test(cloudName);

export const configureCloudinary = () => {
  const cloudName = sanitizeEnv(process.env.CLOUDINARY_CLOUD_NAME).toLowerCase();
  const apiKey = sanitizeEnv(process.env.CLOUDINARY_API_KEY);
  const apiSecret = sanitizeEnv(process.env.CLOUDINARY_API_SECRET);

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary environment variables are missing');
  }

  if (!isValidCloudName(cloudName)) {
    throw new Error(
      'Invalid CLOUDINARY_CLOUD_NAME. Use your exact Cloudinary cloud name.'
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });

  return cloudinary;
};

export const deleteCloudinaryAssets = async (assets: UploadedFileAsset[]) => {
  const deletable = assets.filter((asset) => asset.publicId);
  if (!deletable.length) return;

  const configuredCloudinary = configureCloudinary();
  const uniqueAssets = new Map<string, UploadedFileAsset>();

  deletable.forEach((asset) => {
    uniqueAssets.set(`${asset.resourceType || 'image'}:${asset.publicId}`, asset);
  });

  await Promise.all(
    [...uniqueAssets.values()].map((asset) =>
      configuredCloudinary.uploader.destroy(asset.publicId as string, {
        resource_type: asset.resourceType || 'image',
        invalidate: true,
      })
    )
  );
};
