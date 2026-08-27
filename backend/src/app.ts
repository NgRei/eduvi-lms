import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { sequelize } from './config/database';
import './models'; // Load all models and associations
import authRoutes from './routes/auth.routes';
import courseRoutes from './routes/course.routes';
import lessonRoutes from './routes/lesson.routes';
import assignmentRoutes from './routes/assignment.routes';
import enrollmentRoutes from './routes/enrollment.routes';
import reviewRoutes from './routes/review.routes';
import auditRoutes from './routes/audit.routes';
import certificateRoutes from './routes/certificate.routes';
import adminRoutes from './routes/admin.routes';
import uploadRoutes from './routes/upload.routes';
import paymentRoutes from './routes/payment.routes';
import dashboardRoutes from './routes/dashboard.routes';
import lessonProgressRoutes from './routes/lessonProgress.routes';
import submissionRoutes from './routes/submission.routes';
import instructorApplicationRoutes from './routes/instructorApplication.routes';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static directory for uploaded files (if local storage used)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Root Route
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to Eduvi LMS Backend API (MySQL/phpMyAdmin)',
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/lesson-progress', lessonProgressRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/instructor-applications', instructorApplicationRoutes);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[SERVER ERROR]:', err);
  res.status(500).json({ success: false, error: 'Có lỗi xảy ra trên máy chủ!' });
});

let isServerListening = false;
const startServer = () => {
  if (!isServerListening) {
    isServerListening = true;
    app.listen(port, () => {
      console.log(`\n==================================================`);
      console.log(`🚀 Eduvi LMS Backend server is running on http://localhost:${port}`);
      console.log(`==================================================\n`);
    });
  }
};

// Connect to MySQL and Sync Models
sequelize.authenticate()
  .then(async () => {
    console.log('Successfully connected to MySQL database via phpMyAdmin.');

    try {
      await sequelize.sync({ force: false });
      console.log('Database schema successfully synchronized.');
    } catch (syncErr: any) {
      console.warn('Database sync note:', syncErr.message || syncErr);
    }
    try {
      await sequelize.query(`
        ALTER TABLE courses 
        ADD FULLTEXT INDEX ft_courses_search (title, short_description)
      `);
    } catch (err: any) {
      // FULLTEXT index may already exist
    }

    try {
      await sequelize.query(`
        ALTER TABLE lessons 
        MODIFY COLUMN lesson_type ENUM('video', 'text', 'pdf', 'slide', 'quiz') NOT NULL DEFAULT 'video'
      `);
      console.log('Successfully altered lessons.lesson_type column enum values.');
    } catch (err: any) {
      console.warn('Modify lessons.lesson_type enum warning:', err.message);
    }

    startServer();
  })
  .catch((err: any) => {
    console.error('Database connection warning:', err.message || err);
    startServer();
  });

export default app;
// Server started

