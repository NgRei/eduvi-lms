import { User } from './User.model';
import { StudentProfile } from './StudentProfile.model';
import { InstructorProfile } from './InstructorProfile.model';
import { Category } from './Category.model';
import { Course } from './Course.model';
import { CourseInstructor } from './CourseInstructor.model';
import { Lesson } from './Lesson.model';
import { CourseMaterial } from './CourseMaterial.model';
import { Enrollment } from './Enrollment.model';
import { LessonProgress } from './LessonProgress.model';
import { Assignment } from './Assignment.model';
import { QuizQuestion } from './QuizQuestion.model';

// User 1-to-1 StudentProfile
User.hasOne(StudentProfile, { foreignKey: 'user_id', as: 'studentProfile', onDelete: 'CASCADE' });
StudentProfile.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User 1-to-1 InstructorProfile
User.hasOne(InstructorProfile, { foreignKey: 'user_id', as: 'instructorProfile', onDelete: 'CASCADE' });
InstructorProfile.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Category self-referencing (parent-child)
Category.hasMany(Category, { foreignKey: 'parent_id', as: 'children', onDelete: 'SET NULL' });
Category.belongsTo(Category, { foreignKey: 'parent_id', as: 'parent' });

// Category 1-to-many Course
Category.hasMany(Course, { foreignKey: 'category_id', as: 'courses', onDelete: 'SET NULL' });
Course.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

// Course many-to-many User (instructor) through CourseInstructor
Course.belongsToMany(User, { through: CourseInstructor, foreignKey: 'course_id', otherKey: 'instructor_id', as: 'instructors' });
User.belongsToMany(Course, { through: CourseInstructor, foreignKey: 'instructor_id', otherKey: 'course_id', as: 'courses' });

// CourseInstructor associations
CourseInstructor.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });
CourseInstructor.belongsTo(User, { foreignKey: 'instructor_id', as: 'instructor' });
Course.hasMany(CourseInstructor, { foreignKey: 'course_id', as: 'courseInstructors', onDelete: 'CASCADE' });
User.hasMany(CourseInstructor, { foreignKey: 'instructor_id', as: 'instructorCourses', onDelete: 'CASCADE' });

// Course 1-to-many Lesson
Course.hasMany(Lesson, { foreignKey: 'course_id', as: 'lessons', onDelete: 'CASCADE' });
Lesson.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

// Course 1-to-many CourseMaterial
Course.hasMany(CourseMaterial, { foreignKey: 'course_id', as: 'materials', onDelete: 'CASCADE' });
CourseMaterial.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

// Lesson 1-to-many CourseMaterial (optional)
Lesson.hasMany(CourseMaterial, { foreignKey: 'lesson_id', as: 'materials', onDelete: 'SET NULL' });
CourseMaterial.belongsTo(Lesson, { foreignKey: 'lesson_id', as: 'lesson' });

// User 1-to-many Enrollment
User.hasMany(Enrollment, { foreignKey: 'user_id', as: 'enrollments', onDelete: 'CASCADE' });
Enrollment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Course 1-to-many Enrollment
Course.hasMany(Enrollment, { foreignKey: 'course_id', as: 'enrollments', onDelete: 'CASCADE' });
Enrollment.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

// User 1-to-many LessonProgress
User.hasMany(LessonProgress, { foreignKey: 'user_id', as: 'lessonProgress', onDelete: 'CASCADE' });
LessonProgress.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Lesson 1-to-many LessonProgress
Lesson.hasMany(LessonProgress, { foreignKey: 'lesson_id', as: 'progressRecords', onDelete: 'CASCADE' });
LessonProgress.belongsTo(Lesson, { foreignKey: 'lesson_id', as: 'lesson' });

// Course 1-to-many LessonProgress
Course.hasMany(LessonProgress, { foreignKey: 'course_id', as: 'lessonProgress', onDelete: 'CASCADE' });
LessonProgress.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

// Course 1-to-many Assignment
Course.hasMany(Assignment, { foreignKey: 'course_id', as: 'assignments', onDelete: 'CASCADE' });
Assignment.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

// Lesson 1-to-many Assignment (optional)
Lesson.hasMany(Assignment, { foreignKey: 'lesson_id', as: 'assignments', onDelete: 'SET NULL' });
Assignment.belongsTo(Lesson, { foreignKey: 'lesson_id', as: 'lesson' });

// Assignment 1-to-many QuizQuestion
Assignment.hasMany(QuizQuestion, { foreignKey: 'assignment_id', as: 'questions', onDelete: 'CASCADE' });
QuizQuestion.belongsTo(Assignment, { foreignKey: 'assignment_id', as: 'assignment' });

export {
  User,
  StudentProfile,
  InstructorProfile,
  Category,
  Course,
  CourseInstructor,
  Lesson,
  CourseMaterial,
  Enrollment,
  LessonProgress,
  Assignment,
  QuizQuestion
};
