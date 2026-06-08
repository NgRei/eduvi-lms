import { Router } from 'express';
import { issueCertificate, getMyCertificates, verifyCertificate } from '../controllers/certificate.controller';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

// Public route — xác thực chứng chỉ
router.get('/verify/:cert_code', verifyCertificate as any);

// Protected routes — học viên
router.get('/my', authenticateToken as any, authorizeRole('student') as any, getMyCertificates as any);
router.post('/issue/:courseId', authenticateToken as any, authorizeRole('student') as any, issueCertificate as any);

export default router;
