import { Request, Response } from 'express';
import cloudinary from '../config/cloudinary';
import { AuthRequest } from '../middlewares/auth.middleware';
import { Video, Course, CourseInstructor, Enrollment, Lesson } from '../models';
import { uploadVideo, uploadImage, uploadRawFile, getSignedVideoUrl, deleteVideo, deleteImage } from '../services/upload.service';

export const handleVideoUpload = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Vui lòng chọn file video!' });
    }

    const { course_id, lesson_id } = req.body;

    if (!course_id) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp course_id!' });
    }

    const course = await Course.findByPk(course_id);
    if (!course) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy khóa học!' });
    }

    if (req.user.user_type !== 'admin') {
      const isInstructor = await CourseInstructor.findOne({
        where: { course_id, instructor_id: req.user.id }
      });
      if (!isInstructor) {
        return res.status(403).json({ success: false, error: 'Bạn không có quyền upload video cho khóa học này!' });
      }
    }

    if (lesson_id) {
      const lesson = await Lesson.findByPk(lesson_id);
      if (!lesson || lesson.course_id !== course_id) {
        return res.status(400).json({ success: false, error: 'Bài học không tồn tại hoặc không thuộc khóa học này!' });
      }
    }

    const result = await uploadVideo(req.file.buffer, course_id, req.file.originalname);

    const video = await Video.create({
      cloudinary_id: result.public_id,
      public_id: result.public_id.split('/').pop(),
      original_name: req.file.originalname,
      format: result.format || 'mp4',
      duration: Math.round(result.duration || 0),
      size_bytes: result.bytes,
      width: result.width || null,
      height: result.height || null,
      thumbnail_url: null,
      lesson_id: lesson_id || null,
      course_id,
      uploaded_by: req.user.id,
      is_processed: true,
    });

    return res.status(201).json({
      success: true,
      message: 'Upload video thành công!',
      data: {
        id: video.id,
        cloudinary_id: video.cloudinary_id,
        original_name: video.original_name,
        format: video.format,
        duration: video.duration,
        size_bytes: video.size_bytes,
        thumbnail_url: video.thumbnail_url,
      },
    });
  } catch (error: any) {
    console.error('handleVideoUpload Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi upload video!' });
  }
};

export const handleImageUpload = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Vui lòng chọn file hình ảnh!' });
    }

    const { folder } = req.body;
    const uploadFolder = folder || 'eduvi/images';

    const result = await uploadImage(req.file.buffer, uploadFolder);

    return res.status(201).json({
      success: true,
      message: 'Upload hình ảnh thành công!',
      data: {
        url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
      },
    });
  } catch (error: any) {
    console.error('handleImageUpload Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi upload hình ảnh!' });
  }
};

export const getVideoSignedUrl = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const { id } = req.params;
    const { course_id } = req.query;

    if (!course_id) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp course_id!' });
    }

    const video = await Video.findByPk(id);
    if (!video) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy video!' });
    }

    if (video.course_id !== course_id) {
      return res.status(403).json({ success: false, error: 'Video không thuộc khóa học này!' });
    }

    const enrollment = await Enrollment.findOne({
      where: { user_id: req.user.id, course_id, status: 'active' }
    });

    if (!enrollment && req.user.user_type !== 'admin') {
      const isInstructor = await CourseInstructor.findOne({
        where: { course_id, instructor_id: req.user.id }
      });
      if (!isInstructor) {
        return res.status(403).json({ success: false, error: 'Bạn chưa đăng ký khóa học này!' });
      }
    }

    const signedUrl = getSignedVideoUrl(video.cloudinary_id, 15);

    return res.status(200).json({
      success: true,
      data: {
        url: signedUrl,
        expires_in: 900,
        video: {
          id: video.id,
          duration: video.duration,
          format: video.format,
          thumbnail_url: video.thumbnail_url,
        },
      },
    });
  } catch (error: any) {
    console.error('getVideoSignedUrl Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra!' });
  }
};

export const deleteVideoById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const { id } = req.params;

    const video = await Video.findByPk(id);
    if (!video) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy video!' });
    }

    if (req.user.user_type !== 'admin') {
      const isInstructor = await CourseInstructor.findOne({
        where: { course_id: video.course_id, instructor_id: req.user.id }
      });
      if (!isInstructor) {
        return res.status(403).json({ success: false, error: 'Bạn không có quyền xóa video này!' });
      }
    }

    await deleteVideo(video.cloudinary_id);

    await video.destroy();

    return res.status(200).json({
      success: true,
      message: 'Xóa video thành công!',
    });
  } catch (error: any) {
    console.error('deleteVideoById Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi xóa video!' });
  }
};

export const getVideosByCourse = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const { courseId } = req.params;

    const videos = await Video.findAll({
      where: { course_id: courseId },
      attributes: ['id', 'original_name', 'format', 'duration', 'size_bytes', 'thumbnail_url', 'lesson_id', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      data: videos,
    });
  } catch (error: any) {
    console.error('getVideosByCourse Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra!' });
  }
};

export const handleRawUpload = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Vui lòng chọn file!' });
    }

    const { folder } = req.body;
    const uploadFolder = folder || 'eduvi/documents';

    const result = await uploadRawFile(req.file.buffer, uploadFolder, req.file.originalname);

    return res.status(201).json({
      success: true,
      message: 'Upload file thành công!',
      data: {
        url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        bytes: result.bytes,
      },
    });
  } catch (error: any) {
    console.error('handleRawUpload Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi upload file!' });
  }
};

export const handleFileProxy = async (req: Request, res: Response) => {
  try {
    const fileUrl = req.query.url as string;
    const isDownload = req.query.download === 'true';

    if (!fileUrl) {
      return res.status(400).json({ success: false, error: 'Thiếu URL file!' });
    }

    let successfulResponse: globalThis.Response | null = null;
    let matchedUrl = '';

    // 1. If it's a Cloudinary URL, use Cloudinary signed private download URLs
    const match = fileUrl.match(/res\.cloudinary\.com\/[^/]+\/(raw|image|video|auto)\/upload\/(?:s--[^/]+--\/)?(?:v\d+\/)?(.+)/);
    if (match) {
      const rawPath = match[2];
      const candidatePaths = [
        rawPath,
        rawPath.replace(/\.pdf\.pdf$/i, '.pdf'),
        rawPath.replace(/\.pdf$/i, ''),
        rawPath.endsWith('.pdf') ? rawPath : `${rawPath}.pdf`,
      ];

      const resourceTypes: Array<'raw' | 'image' | 'auto'> = ['raw', 'image', 'auto'];

      for (const resType of resourceTypes) {
        for (const p of candidatePaths) {
          try {
            const extMatch = p.match(/\.([a-zA-Z0-9]+)$/);
            const format = extMatch ? extMatch[1] : 'pdf';
            const signedUrl = cloudinary.utils.private_download_url(p, format, {
              resource_type: resType,
              type: 'upload',
              attachment: false,
            });

            const resp = await fetch(signedUrl);
            if (resp.ok && resp.status === 200) {
              successfulResponse = resp;
              matchedUrl = signedUrl;
              break;
            }
          } catch (err) {
            // continue
          }
        }
        if (successfulResponse) break;
      }
    }

    // 2. Direct fetch fallback (for local or non-restricted files)
    if (!successfulResponse) {
      const directCandidates = [
        fileUrl,
        fileUrl.replace(/\.pdf\.pdf$/i, '.pdf'),
        fileUrl.endsWith('.pdf') ? fileUrl : `${fileUrl}.pdf`,
      ];

      for (const urlCandidate of directCandidates) {
        try {
          const resp = await fetch(urlCandidate);
          if (resp.ok && resp.status === 200) {
            successfulResponse = resp;
            matchedUrl = urlCandidate;
            break;
          }
        } catch (err) {
          // continue
        }
      }
    }

    if (!successfulResponse || !successfulResponse.ok) {
      return res.status(404).json({
        success: false,
        error: `Không thể tải file từ máy lưu trữ (Mã lỗi: 404)`,
      });
    }

    const arrayBuffer = await successfulResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let contentType = successfulResponse.headers.get('content-type') || 'application/pdf';
    if (fileUrl.toLowerCase().includes('.pdf') || matchedUrl.toLowerCase().includes('.pdf') || contentType.includes('octet-stream')) {
      contentType = 'application/pdf';
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader(
      'Content-Disposition',
      isDownload ? 'attachment; filename="document.pdf"' : 'inline'
    );
    return res.send(buffer);
  } catch (error: any) {
    console.error('handleFileProxy Error:', error);
    return res.status(500).json({ success: false, error: 'Lỗi server khi tải file proxy!' });
  }
};
