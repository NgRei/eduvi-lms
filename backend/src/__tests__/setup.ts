import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

process.env.JWT_SECRET = 'test_jwt_secret_key';
process.env.JWT_EXPIRES_IN = '1h';
process.env.NODE_ENV = 'test';
