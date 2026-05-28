import { Response } from 'express';
import { Op, QueryTypes } from 'sequelize';
import { sequelize } from '../config/database';
import { Course, Category, Lesson, CourseMaterial, CourseInstructor, User, Enrollment } from '../models';
import { AuthRequest } from '../middlewares/auth.middleware';

// Helper: Generate slug from title
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

// GET /api/courses - Lấy danh sách khóa học (public)
export const getCourses = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      page = '1', 
      limit = '12', 
      category_id, 
      target_level, 
      search,
      sort = 'newest'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = { is_published: true };
    
    if (category_id) {
      where.category_id = category_id;
    }
    
    if (target_level && target_level !== 'all') {
      where.target_level = target_level;
    }

    // Build order clause
    let order: any[] = [];
    switch (sort) {
      case 'newest':
        order = [['created_at', 'DESC']];
        break;
      case 'price_asc':
        order = [['price', 'ASC']];
        break;
      case 'price_desc':
        order = [['price', 'DESC']];
        break;
      case 'popular':
        order = [['total_students', 'DESC']];
        break;
      case 'rating':
        order = [['rating_avg', 'DESC']];
        break;
      default:
        order = [['created_at', 'DESC']];
    }

    // Fulltext search or regular search
    let courses;
    let total;

    if (search) {
      // Use FULLTEXT search
      const [results] = await sequelize.query(
        `SELECT * FROM courses 
         WHERE MATCH(title, short_description) AGAINST(:search IN BOOLEAN MODE)
         AND is_published = true
         ${category_id ? 'AND category_id = :category_id' : ''}
         ${target_level && target_level !== 'all' ? 'AND target_level = :target_level' : ''}
         ORDER BY MATCH(title, short_description) AGAINST(:search IN BOOLEAN MODE) DESC
         LIMIT :limit OFFSET :offset`,
        {
          replacements: { 
            search: `${search}*`, 
            category_id, 
            target_level, 
            limit: limitNum, 
            offset 
          },
          type: QueryTypes.SELECT
        }
      );
      courses = results;

      // Get total count
      const [countResult] = await sequelize.query(
        `SELECT COUNT(*) as total FROM courses 
         WHERE MATCH(title, short_description) AGAINST(:search IN BOOLEAN MODE)
         AND is_published = true
         ${category_id ? 'AND category_id = :category_id' : ''}
         ${target_level && target_level !== 'all' ? 'AND target_level = :target_level' : ''}`,
        {
          replacements: { search: `${search}*`, category_id, target_level },
          type: QueryTypes.SELECT
        }
      );
      total = (countResult as any)?.total || 0;
    } else {
      // Regular query
      const result = await Course.findAndCountAll({
        where,
        include: [
          { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
          { 
            model: User, 
            as: 'instructors', 
            attributes: ['id', 'full_name', 'username'],
            through: { attributes: ['is_primary'] }
          }
        ],
        order,
        limit: limitNum,
        offset,
        distinct: true
      });
      courses = result.rows;
      total = result.count;
    }

    return res.status(200).json({
      success: true,
      data: courses,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('getCourses Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi lấy danh sách khóa học!' });
  }
};

// GET /api/courses/:id - Lấy chi tiết khóa học (public)
export const getCourseById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const course = await Course.findByPk(id, {
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
        { 
          model: User, 
          as: 'instructors', 
          attributes: ['id', 'full_name', 'username', 'email'],
          through: { attributes: ['is_primary'] }
        },
        {
          model: Lesson,
          as: 'lessons',
          where: { is_published: true },
          required: false,
          attributes: ['id', 'title', 'sort_order', 'lesson_type', 'duration_minutes', 'is_preview'],
          order: [['sort_order', 'ASC']]
        },
        {
          model: CourseMaterial,
          as: 'materials',
          attributes: ['id', 'title', 'material_type', 'file_url', 'file_size_kb', 'is_downloadable'],
          order: [['sort_order', 'ASC']]
        }
      ]
    });

    if (!course) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy khóa học!' });
    }

    // Check if user is enrolled
    let isEnrolled = false;
    let enrollment = null;
    if (req.user) {
      enrollment = await Enrollment.findOne({
        where: { user_id: req.user.id, course_id: id }
      });
      isEnrolled = !!enrollment;
    }

    return res.status(200).json({
      success: true,
      data: {
        ...course.toJSON(),
        is_enrolled: isEnrolled,
        enrollment: enrollment ? {
          status: enrollment.status,
          progress_percentage: enrollment.progress_percentage
        } : null
      }
    });
  } catch (error: any) {
    console.error('getCourseById Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi lấy thông tin khóa học!' });
  }
};

// POST /api/courses - Tạo khóa học mới (instructor/admin)
export const createCourse = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const {
      title,
      category_id,
      short_description,
      description,
      thumbnail,
      price,
      sale_price,
      target_level,
      language,
      max_students,
      duration_weeks
    } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Vui lòng nhập tên khóa học!' });
    }

    // Generate unique slug
    let slug = generateSlug(title);
    const existingSlug = await Course.findOne({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    // Create course
    const course = await Course.create({
      title,
      slug,
      category_id: category_id || null,
      short_description: short_description || null,
      description: description || null,
      thumbnail: thumbnail || null,
      price: price || 0,
      sale_price: sale_price || null,
      target_level: target_level || 'all',
      language: language || 'vi',
      max_students: max_students || null,
      duration_weeks: duration_weeks || null,
      is_published: false
    });

    // Assign instructor
    await CourseInstructor.create({
      course_id: course.id,
      instructor_id: req.user.id,
      is_primary: true
    });

    return res.status(201).json({
      success: true,
      message: 'Tạo khóa học thành công!',
      data: course
    });
  } catch (error: any) {
    console.error('createCourse Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi tạo khóa học!' });
  }
};

// PUT /api/courses/:id - Cập nhật khóa học (instructor owner/admin)
export const updateCourse = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const { id } = req.params;
    const course = await Course.findByPk(id);

    if (!course) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy khóa học!' });
    }

    // Check permission: admin or instructor assigned to this course
    if (req.user.user_type !== 'admin') {
      const isInstructor = await CourseInstructor.findOne({
        where: { course_id: id, instructor_id: req.user.id }
      });
      if (!isInstructor) {
        return res.status(403).json({ success: false, error: 'Bạn không có quyền chỉnh sửa khóa học này!' });
      }
    }

    const {
      title,
      category_id,
      short_description,
      description,
      thumbnail,
      price,
      sale_price,
      target_level,
      language,
      max_students,
      duration_weeks,
      is_published
    } = req.body;

    // Update slug if title changes
    let slug = course.slug;
    if (title && title !== course.title) {
      slug = generateSlug(title);
      const existingSlug = await Course.findOne({ where: { slug, id: { [Op.ne]: id } } });
      if (existingSlug) {
        slug = `${slug}-${Date.now()}`;
      }
    }

    await course.update({
      title: title || course.title,
      slug,
      category_id: category_id !== undefined ? category_id : course.category_id,
      short_description: short_description !== undefined ? short_description : course.short_description,
      description: description !== undefined ? description : course.description,
      thumbnail: thumbnail !== undefined ? thumbnail : course.thumbnail,
      price: price !== undefined ? price : course.price,
      sale_price: sale_price !== undefined ? sale_price : course.sale_price,
      target_level: target_level || course.target_level,
      language: language || course.language,
      max_students: max_students !== undefined ? max_students : course.max_students,
      duration_weeks: duration_weeks !== undefined ? duration_weeks : course.duration_weeks,
      is_published: is_published !== undefined ? is_published : course.is_published,
      published_at: is_published && !course.published_at ? new Date() : course.published_at
    });

    return res.status(200).json({
      success: true,
      message: 'Cập nhật khóa học thành công!',
      data: course
    });
  } catch (error: any) {
    console.error('updateCourse Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi cập nhật khóa học!' });
  }
};

// DELETE /api/courses/:id - Xóa khóa học (soft delete - admin only)
export const deleteCourse = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const { id } = req.params;
    const course = await Course.findByPk(id);

    if (!course) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy khóa học!' });
    }

    // Only admin can delete
    if (req.user.user_type !== 'admin') {
      return res.status(403).json({ success: false, error: 'Chỉ admin mới có quyền xóa khóa học!' });
    }

    // Soft delete
    await course.destroy();

    return res.status(200).json({
      success: true,
      message: 'Xóa khóa học thành công!'
    });
  } catch (error: any) {
    console.error('deleteCourse Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi xóa khóa học!' });
  }
};

// GET /api/courses/instructor/me - Lấy khóa học của giảng viên hiện tại
export const getInstructorCourses = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const { page = '1', limit = '10', status } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status === 'published') {
      where.is_published = true;
    } else if (status === 'draft') {
      where.is_published = false;
    }

    const { count, rows } = await Course.findAndCountAll({
      where,
      include: [
        {
          model: CourseInstructor,
          as: 'courseInstructors',
          where: { instructor_id: req.user.id },
          required: true
        },
        { model: Category, as: 'category', attributes: ['id', 'name'] }
      ],
      order: [['created_at', 'DESC']],
      limit: limitNum,
      offset,
      distinct: true
    });

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        totalPages: Math.ceil(count / limitNum)
      }
    });
  } catch (error: any) {
    console.error('getInstructorCourses Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi lấy danh sách khóa học!' });
  }
};

// GET /api/categories - Lấy danh sách danh mục (public)
export const getCategories = async (_req: AuthRequest, res: Response) => {
  try {
    const categories = await Category.findAll({
      where: { is_active: true },
      order: [['sort_order', 'ASC']],
      include: [
        {
          model: Category,
          as: 'children',
          where: { is_active: true },
          required: false
        }
      ]
    });

    return res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error: any) {
    console.error('getCategories Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi lấy danh mục!' });
  }
};
