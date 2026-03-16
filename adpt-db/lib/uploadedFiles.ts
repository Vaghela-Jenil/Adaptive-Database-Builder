import { FieldAttributes } from '@/components/DatabaseBuilder/types';

export type UploadedFileAsset = {
  url: string;
  publicId?: string;
  originalFilename?: string;
  mimeType?: string;
  resourceType?: string;
  size?: number;
  isTemporary?: boolean;
};

export const isUploadedFileAsset = (value: unknown): value is UploadedFileAsset => {
  return Boolean(
    value &&
      typeof value === 'object' &&
      typeof (value as UploadedFileAsset).url === 'string'
  );
};

export const normalizeUploadedFileAsset = (value: unknown): UploadedFileAsset | null => {
  if (typeof value === 'string' && value.trim()) {
    return { url: value.trim() };
  }

  if (isUploadedFileAsset(value) && value.url.trim()) {
    return {
      url: value.url.trim(),
      publicId: value.publicId,
      originalFilename: value.originalFilename,
      mimeType: value.mimeType,
      resourceType: value.resourceType,
      size: value.size,
      isTemporary: value.isTemporary,
    };
  }

  return null;
};

export const extractUploadedFileAssets = (value: unknown): UploadedFileAsset[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeUploadedFileAsset(item))
      .filter((item): item is UploadedFileAsset => item !== null);
  }

  const single = normalizeUploadedFileAsset(value);
  return single ? [single] : [];
};

export const sanitizeUploadedFileValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return extractUploadedFileAssets(value).map(({ isTemporary, ...rest }) => rest);
  }

  const single = normalizeUploadedFileAsset(value);
  if (!single) return value;
  const { isTemporary, ...rest } = single;
  return rest;
};

export const extractTemporaryUploadedFileAssets = (value: unknown): UploadedFileAsset[] => {
  return extractUploadedFileAssets(value).filter((asset) => asset.isTemporary && asset.publicId);
};

export const extractUploadedFileAssetsFromRecordData = (
  data: Record<string, unknown>,
  formSchema: FieldAttributes[] = []
): UploadedFileAsset[] => {
  const fileFieldIds = formSchema
    .filter((field) => field.type === 'file-upload')
    .map((field) => field.id);

  return fileFieldIds.flatMap((fieldId) => extractUploadedFileAssets(data[fieldId]));
};

export const sanitizeRecordFileData = (
  data: Record<string, unknown>,
  formSchema: FieldAttributes[] = []
): Record<string, unknown> => {
  const next = { ...data };
  formSchema
    .filter((field) => field.type === 'file-upload')
    .forEach((field) => {
      if (field.id in next) {
        next[field.id] = sanitizeUploadedFileValue(next[field.id]);
      }
    });
  return next;
};

export const diffRemovedUploadedFileAssets = (
  previousAssets: UploadedFileAsset[],
  nextAssets: UploadedFileAsset[]
): UploadedFileAsset[] => {
  const nextKeys = new Set(
    nextAssets.map((asset) => asset.publicId || asset.url)
  );

  return previousAssets.filter((asset) => !nextKeys.has(asset.publicId || asset.url));
};
