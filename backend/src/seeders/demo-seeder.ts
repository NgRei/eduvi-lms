import bcrypt from 'bcryptjs';
import { sequelize } from '../config/database';
import { User, StudentProfile, InstructorProfile } from '../models';

const seedDemoData = async () => {
  try {
    console.log('Starting demo database seeder...');
    
    // Connect to database
    await sequelize.authenticate();
    console.log('Database connected. Dropping all tables...');
    
    // Disable foreign key checks and drop all tables
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
    
    // Get all tables and drop them
    const [tables] = await sequelize.query('SHOW TABLES;');
    for (const table of tables as any[]) {
      const tableName = Object.values(table)[0];
      await sequelize.query(`DROP TABLE IF EXISTS \`${tableName}\`;`);
    }
    
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('All tables dropped. Syncing new schema...');
    
    // Sync models - creates all tables fresh
    await sequelize.sync({ force: false });
    console.log('Database tables created successfully.');

    const salt = await bcrypt.genSalt(10);
    const commonHash = await bcrypt.hash('ant.design', salt);

    console.log('Hashing passwords and seeding default accounts...');

    // 1. Seed Admin
    const adminUser = await User.create({
      id: 'u-admin-0000000000000000000000000001',
      email: 'admin@eduvi.com',
      username: 'sysadmin',
      password_hash: commonHash,
      full_name: 'Quản trị viên Hệ thống',
      user_type: 'admin',
      is_active: true
    });
    console.log('- Seeded Admin account: username: "sysadmin", password: "ant.design"');

    // 2. Seed Instructor 1
    const instructor1 = await User.create({
      id: 'u-instru-000000000000000000000000001',
      email: 'binhtt@gmail.com',
      username: 'binhtt',
      password_hash: commonHash,
      full_name: 'TS. Trần Thị Bình',
      user_type: 'instructor',
      is_active: true
    });
    await InstructorProfile.create({
      user_id: instructor1.id,
      expertise: 'Lập trình NodeJS, Kiến trúc MVC, Microservices',
      experience_years: 8,
      degree: 'Tiến sĩ'
    });
    console.log('- Seeded Instructor 1: username: "binhtt", password: "ant.design"');

    // 3. Seed Instructor 2
    const instructor2 = await User.create({
      id: 'u-instru-000000000000000000000000002',
      email: 'hongvt@gmail.com',
      username: 'hongvt@921',
      password_hash: commonHash,
      full_name: 'ThS. Vũ Thị Hồng',
      user_type: 'instructor',
      is_active: true
    });
    await InstructorProfile.create({
      user_id: instructor2.id,
      expertise: 'Hệ quản trị CSDL MySQL, PostgreSQL, DevOps cơ bản',
      experience_years: 4,
      degree: 'Thạc sĩ'
    });
    console.log('- Seeded Instructor 2: username: "hongvt@921", password: "ant.design"');

    // 4. Seed Student 1
    const student1 = await User.create({
      id: 'u-studen-000000000000000000000000001',
      email: 'annv@gmail.com',
      username: 'annv',
      password_hash: commonHash,
      full_name: 'Nguyễn Văn An',
      user_type: 'student',
      is_active: true
    });
    await StudentProfile.create({
      user_id: student1.id,
      grade_level: 'Năm 3',
      school_name: 'Đại học Công nghệ Thông tin'
    });
    console.log('- Seeded Student 1: username: "annv", password: "ant.design"');

    // 5. Seed Student 2
    const student2 = await User.create({
      id: 'u-studen-000000000000000000000000002',
      email: 'cuonglh@gmail.com',
      username: 'cuonglh@441',
      password_hash: commonHash,
      full_name: 'Lê Hoàng Cường',
      user_type: 'student',
      is_active: true
    });
    await StudentProfile.create({
      user_id: student2.id,
      grade_level: 'Năm 2',
      school_name: 'Đại học Bách Khoa'
    });
    console.log('- Seeded Student 2: username: "cuonglh@441", password: "ant.design"');

    // 6. Seed Student 3
    const student3 = await User.create({
      id: 'u-studen-000000000000000000000000003',
      email: 'ducpm@gmail.com',
      username: 'ducpm@782',
      password_hash: commonHash,
      full_name: 'Phạm Minh Đức',
      user_type: 'student',
      is_active: true
    });
    await StudentProfile.create({
      user_id: student3.id,
      grade_level: 'Năm 4',
      school_name: 'Đại học KHTN'
    });
    console.log('- Seeded Student 3: username: "ducpm@782", password: "ant.design"');

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
