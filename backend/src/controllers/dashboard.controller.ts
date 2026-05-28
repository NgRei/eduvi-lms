import { Response } from 'express';
import { Op } from 'sequelize';
import { Enrollment, Course, Lesson, LessonProgress, User, CourseInstructor } from '../models';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getStudentDashboard = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const userId = req.user.id;

    const totalEnrollments = await Enrollment.count({
      where: { user_id: userId, status: { [Op.ne]: 'dropped' } },
    });

    const activeCourses = await Enrollment.count({
      where: { user_id: userId, status: 'active' },
    });

    const completedCourses = await Enrollment.count({
      where: { user_id: userId, status: 'completed' },
    });

    const enrollments = await Enrollment.findAll({
      where: { user_id: userId, status: 'active' },
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title', 'slug', 'thumbnail', 'total_lessons', 'rating_avg'],
          include: [
            {
              model: User,
              as: 'instructors',
              attributes: ['id', 'full_name'],
              through: { attributes: [] },
            },
          ],
        },
      ],
      order: [['updated_at', 'DESC']],
      limit: 5,
    });

    const recentProgress = await LessonProgress.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Lesson,
          as: 'lesson',
          attributes: ['id', 'title', 'lesson_type', 'course_id'],
        },
      ],
      order: [['updated_at', 'DESC']],
      limit: 10,
    });

    const totalLessonsCompleted = await LessonProgress.count({
      where: { user_id: userId, is_completed: true },
    });

    const totalWatchMinutes = await LessonProgress.sum('watch_duration', {
      where: { user_id: userId },
    }) || 0;

    const overallProgress = totalEnrollments > 0
      ? Math.round((completedCourses / totalEnrollments) * 100)
      : 0;

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          total_enrollments: totalEnrollments,
          active_courses: activeCourses,
          completed_courses: completedCourses,
          overall_progress: overallProgress,
          lessons_completed: totalLessonsCompleted,
          watch_minutes: Math.round(totalWatchMinutes / 60),
        },
        recent_courses: enrollments.map((e: any) => ({
          enrollment_id: e.id,
          course_id: e.course_id,
          title: e.course?.title,
          slug: e.course?.slug,
          thumbnail: e.course?.thumbnail,
          progress_percentage: e.progress_percentage,
          total_lessons: e.course?.total_lessons,
          instructors: e.course?.instructors?.map((i: any) => i.full_name) || [],
          updated_at: e.updated_at,
        })),
        recent_activity: recentProgress.map((p: any) => ({
          lesson_id: p.lesson_id,
          lesson_title: p.lesson?.title,
          lesson_type: p.lesson?.lesson_type,
          course_id: p.lesson?.course_id,
          is_completed: p.is_completed,
          last_position: p.last_position,
          updated_at: p.updated_at,
        })),
      },
    });
  } catch (error: any) {
    console.error('getStudentDashboard Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra!' });
  }
};

export const getInstructorDashboard = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const instructorId = req.user.id;

    const courseIds = await CourseInstructor.findAll({
      where: { instructor_id: instructorId },
      attributes: ['course_id'],
    });

    const courseIdList = courseIds.map((ci: any) => ci.course_id);

    const totalCourses = courseIdList.length;

    const totalStudents = await Enrollment.count({
      where: {
        course_id: { [Op.in]: courseIdList },
        status: { [Op.ne]: 'dropped' },
      },
      distinct: true,
      col: 'user_id',
    });

    const activeStudents = await Enrollment.count({
      where: {
        course_id: { [Op.in]: courseIdList },
        status: 'active',
      },
      distinct: true,
      col: 'user_id',
    });

    const courses = await Course.findAll({
      where: { id: { [Op.in]: courseIdList } },
      attributes: ['id', 'title', 'slug', 'thumbnail', 'total_students', 'rating_avg', 'is_published'],
      include: [
        {
          model: CourseInstructor,
          as: 'courseInstructors',
          where: { instructor_id: instructorId },
          attributes: ['is_primary'],
        },
      ],
      order: [['updated_at', 'DESC']],
    });

    const recentEnrollments = await Enrollment.findAll({
      where: {
        course_id: { [Op.in]: courseIdList },
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'full_name', 'email', 'username'],
        },
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title'],
        },
      ],
      order: [['enrolled_at', 'DESC']],
      limit: 10,
    });

    const publishedCourses = courses.filter((c: any) => c.is_published).length;
    const draftCourses = courses.filter((c: any) => !c.is_published).length;

    const avgRating = courses.length > 0
      ? courses.reduce((sum: number, c: any) => sum + (parseFloat(c.rating_avg) || 0), 0) / courses.length
      : 0;

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          total_courses: totalCourses,
          published_courses: publishedCourses,
          draft_courses: draftCourses,
          total_students: totalStudents,
          active_students: activeStudents,
          average_rating: Math.round(avgRating * 100) / 100,
        },
        courses: courses.map((c: any) => ({
          id: c.id,
          title: c.title,
          slug: c.slug,
          thumbnail: c.thumbnail,
          total_students: c.total_students,
          rating_avg: c.rating_avg,
          is_published: c.is_published,
          is_primary: c.courseInstructors?.[0]?.is_primary || false,
        })),
        recent_enrollments: recentEnrollments.map((e: any) => ({
          enrollment_id: e.id,
          student_name: e.user?.full_name,
          student_email: e.user?.email,
          course_title: e.course?.title,
          status: e.status,
          progress_percentage: e.progress_percentage,
          enrolled_at: e.enrolled_at,
        })),
      },
    });
  } catch (error: any) {
    console.error('getInstructorDashboard Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra!' });
  }
};
