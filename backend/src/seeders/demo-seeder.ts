import bcrypt from 'bcryptjs';
import { sequelize } from '../config/database';
import { User, StudentProfile, InstructorProfile } from '../models';

const seedDemoData = async () => {
  try {
    console.log('Starting demo database seeder...');
    
    // Connect to database
    await sequelize.authenticate();
    console.log('Database connected. Syncing tables...');
    await sequelize.sync({ force: true }); // Warning: force resets database, perfect for clean seeds!
    console.log('Database tables cleared and synchronized.');

    const salt = await bcrypt.genSalt(10);
    const commonHash = await bcrypt.hash('ant.design', salt);

    console.log('Hashing passwords and seeding default accounts...');

    // 1. Seed Admin
    const adminUser = await User.create({
      email: 'admin@eduvi.com',
      username: 'sysadmin',
      password_hash: commonHash,
      full_name: 'Quản trị viên Hệ thống',
      user_type: 'admin',
      is_active: true
    });
    console.log('- Seeded Admin account: username: "sysadmin", password: "ant.design"');

    // 2. Seed Instructor
    const instructorUser = await User.create({
      email: 'binhtt@gmail.com',
      username: 'binhtt',
      password_hash: commonHash,
      full_name: 'TS. Trần Thị Bình',
      user_type: 'instructor',
      is_active: true
    });
    await InstructorProfile.create({
      user_id: instructorUser.id,
      expertise: 'Khoa học Máy tính & Lập trình NodeJS thực chiến',
      experience_years: 8
    });
    console.log('- Seeded Instructor account: username: "binhtt", password: "ant.design"');

    // 3. Seed Student
    const studentUser = await User.create({
      email: 'annv@gmail.com',
      username: 'annv',
      password_hash: commonHash,
      full_name: 'Nguyễn Văn An',
      user_type: 'student',
      is_active: true
    });
    await StudentProfile.create({
      user_id: studentUser.id,
      grade_level: 'Lớp Lập trình Web thực chiến',
      school_name: 'Trường Đại học Công nghệ Thông tin'
    });
    console.log('- Seeded Student account: username: "annv", password: "ant.design"');

    console.log('\n=========================================');
    console.log('Eduvi LMS Demo Data seeded successfully!');
    console.log('=========================================');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDemoData();
