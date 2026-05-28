import express from 'express';
import cors from 'cors';
import authRoutes from '../../routes/auth.routes';
import courseRoutes from '../../routes/course.routes';

export const createTestApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get('/health', (req, res) => {
    res.status(200).json({ success: true, message: 'Eduvi LMS Backend is healthy!' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/courses', courseRoutes);

  return app;
};
