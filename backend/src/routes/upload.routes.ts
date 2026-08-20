import { Router } from 'express';
import {
  handleVideoUpload,
  handleImageUpload,
  handleRawUpload,
  handleFileProxy,
  getVideoSignedUrl,
  deleteVideoById,
  getVideosByCourse,
} from '../controllers/upload.controller';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware';
import { uploadVideo, uploadImage, uploadRaw } from '../middlewares/upload.middleware';

const router = Router();

// Public file proxy route (allows iframe and direct browser tab access)
router.get('/file-proxy', handleFileProxy as any);

router.use(authenticateToken as any);

router.post('/video', authorizeRole('instructor', 'admin') as any, uploadVideo as any, handleVideoUpload as any);
router.post('/image', authorizeRole('instructor', 'admin') as any, uploadImage as any, handleImageUpload as any);
router.post('/raw', authorizeRole('instructor', 'admin') as any, uploadRaw as any, handleRawUpload as any);

router.get('/video/:id/signed-url', authorizeRole('student', 'instructor', 'admin') as any, getVideoSignedUrl as any);
router.get('/video/course/:courseId', authorizeRole('instructor', 'admin') as any, getVideosByCourse as any);

router.delete('/video/:id', authorizeRole('instructor', 'admin') as any, deleteVideoById as any);

export default router;
