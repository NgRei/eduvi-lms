import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sequelize } from './config/database';
import authRoutes from './routes/auth.routes';
import courseRoutes from './routes/course.routes';
import lessonRoutes from './routes/lesson.routes';
import enrollmentRoutes from './routes/enrollment.routes';
import lessonProgressRoutes from './routes/lessonProgress.routes';

// Load env vars
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: '*', // Allow all origins for dev simplicity, can narrow later
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Eduvi LMS Backend is healthy!' });
});

// Register api routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/lesson-progress', lessonProgressRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[SERVER ERROR]:', err);
  res.status(500).json({ success: false, error: 'Có lỗi xảy ra trên máy chủ!' });
});

// Connect to MySQL and Sync Models
sequelize.authenticate()
  .then(() => {
    console.log('Successfully connected to MySQL database via phpMyAdmin.');
    
    // Sync models - automatically creates tables in phpMyAdmin if they do not exist
    return sequelize.sync({ force: false });
  })
  .then(async () => {
    console.log('Database schema successfully synchronized.');
    
    // Add FULLTEXT index for courses search if not exists
    try {
      await sequelize.query(`
        ALTER TABLE courses 
        ADD FULLTEXT INDEX ft_courses_search (title, short_description)
      `);
      console.log('FULLTEXT index added successfully.');
    } catch (err: any) {
      // Index may already exist, ignore error
      if (!err.message.includes('Duplicate key name')) {
        console.log('FULLTEXT index note:', err.message);
      }
    }
    
    // Start listening
    app.listen(port, () => {
      console.log(`Eduvi LMS Backend server is running at http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('Database connection or synchronization error:', err);
    console.log('\n[ATTENTION]: Vui lòng mở XAMPP/WampServer và tạo cơ sở dữ liệu có tên "eduvi_lms" trong phpMyAdmin để kết nối.');
    
    // Start listening anyway so they can see logs
    app.listen(port, () => {
      console.log(`Express server started in fallback mode on port ${port}`);
    });
  });
