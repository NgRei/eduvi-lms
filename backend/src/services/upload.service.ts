import cloudinary from '../config/cloudinary';
import { Readable } from 'stream';

interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  format: string;
  duration?: number;
  bytes: number;
  width: number;
  height: number;
  resource_type: string;
  created_at: string;
}

export async function uploadVideo(
  fileBuffer: Buffer,
  courseId: string,
  originalName: string
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'video',
        folder: `eduvi/courses/${courseId}`,
        type: 'private',
        eager_async: true,
        eager: [
          { format: 'mp4', video_codec: 'h264' },
          { format: 'webm' },
        ],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result as unknown as CloudinaryUploadResult);
      }
    );

    const readableStream = new Readable();
    readableStream.push(fileBuffer);
    readableStream.push(null);
    readableStream.pipe(uploadStream);
  });
}

export async function uploadImage(
  fileBuffer: Buffer,
  folder: string
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        folder: folder,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result as unknown as CloudinaryUploadResult);
      }
    );

    const readableStream = new Readable();
    readableStream.push(fileBuffer);
    readableStream.push(null);
    readableStream.pipe(uploadStream);
  });
}

export function getSignedVideoUrl(
  cloudinaryId: string,
  expiresInMinutes: number = 15
): string {
  const timestamp = Math.round(Date.now() / 1000) + expiresInMinutes * 60;

  return cloudinary.url(cloudinaryId, {
    resource_type: 'video',
    type: 'private',
    sign_url: true,
    secure: true,
    expires_at: timestamp,
  });
}

export async function deleteVideo(cloudinaryId: string): Promise<void> {
  await cloudinary.uploader.destroy(cloudinaryId, {
    resource_type: 'video',
    type: 'private',
  });
}

export async function deleteImage(cloudinaryId: string): Promise<void> {
  await cloudinary.uploader.destroy(cloudinaryId, {
    resource_type: 'image',
  });
}
