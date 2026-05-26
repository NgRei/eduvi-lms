import { User } from './User.model';
import { StudentProfile } from './StudentProfile.model';
import { InstructorProfile } from './InstructorProfile.model';

// User 1-to-1 StudentProfile
User.hasOne(StudentProfile, { foreignKey: 'user_id', as: 'studentProfile', onDelete: 'CASCADE' });
StudentProfile.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User 1-to-1 InstructorProfile
User.hasOne(InstructorProfile, { foreignKey: 'user_id', as: 'instructorProfile', onDelete: 'CASCADE' });
InstructorProfile.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

export {
  User,
  StudentProfile,
  InstructorProfile
};
