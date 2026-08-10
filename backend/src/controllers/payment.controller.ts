import { Response } from 'express';
import { Op } from 'sequelize';
import { Payment, Course, Enrollment, User, CourseInstructor } from '../models';
import { AuthRequest } from '../middlewares/auth.middleware';
import { generateVietQRUrl, getVietQRBankInfo } from '../services/vietqr.service';
import { createAuditLog, getClientIp } from '../services/audit.service';

// Cấu hình thời hạn tồn tại của mã VietQR (mặc định 90 giây = 1 phút 30 giây để test nhanh)
export const PAYMENT_EXPIRE_SECONDS = parseInt(process.env.PAYMENT_EXPIRE_SECONDS || '90', 10);

// POST /api/payments/create - Tạo hoặc lấy mã thanh toán VietQR cho khóa học
export const createPayment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const { course_id, force_new } = req.body;

    if (!course_id) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp course_id!' });
    }

    // 1. Kiểm tra khóa học tồn tại & đã xuất bản
    const course = await Course.findOne({
      where: { id: course_id, is_published: true, deleted_at: null },
    });

    if (!course) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy khóa học hoặc khóa học chưa được xuất bản!' });
    }

    // 2. Kiểm tra xem người dùng đã đăng ký khóa học này chưa
    const existingEnrollment = await Enrollment.findOne({
      where: { user_id: req.user.id, course_id },
    });

    if (existingEnrollment && existingEnrollment.status === 'active') {
      return res.status(409).json({ success: false, error: 'Bạn đã đăng ký và đang học khóa học này rồi!' });
    }

    // 3. Tính toán số tiền thực tế
    const effectivePrice = course.sale_price !== null && course.sale_price !== undefined ? course.sale_price : (course.price || 0);

    if (effectivePrice <= 0) {
      // Đăng ký trực tiếp không cần thanh toán
      let enrollment = existingEnrollment;
      if (enrollment) {
        await enrollment.update({
          status: 'active',
          progress_percentage: 0,
          enrolled_at: new Date(),
        });
      } else {
        enrollment = await Enrollment.create({
          user_id: req.user.id,
          course_id,
          status: 'active',
          progress_percentage: 0,
          enrolled_at: new Date(),
        });
        await course.update({ total_students: (course.total_students || 0) + 1 });
      }

      createAuditLog({
        user_id: req.user.id,
        action: 'enroll_free',
        entity_type: 'enrollment',
        entity_id: enrollment.id,
        detail: { course_id, course_title: course.title, price: 0 },
        ip_address: getClientIp(req),
      });

      return res.status(201).json({
        success: true,
        is_free: true,
        message: 'Đăng ký khóa học miễn phí thành công!',
        data: { enrollment },
      });
    }

    const now = new Date();
    const bankInfo = getVietQRBankInfo();

    // 4. Nếu KHÔNG ép buộc tạo mới (force_new !== true), kiểm tra xem người dùng có mã QR PENDING chưa hết hạn hay không
    if (!force_new) {
      const existingPending = await Payment.findOne({
        where: {
          user_id: req.user.id,
          course_id,
          status: 'PENDING',
        },
        order: [['createdAt', 'DESC']],
      });

      if (existingPending) {
        const expiresAtDate = existingPending.expires_at ? new Date(existingPending.expires_at) : null;

        // Nếu mã cũ vẫn CÒN HẠN -> Tái sử dụng lại giao dịch này!
        if (expiresAtDate && expiresAtDate.getTime() > now.getTime()) {
          const remainingSeconds = Math.max(0, Math.floor((expiresAtDate.getTime() - now.getTime()) / 1000));

          return res.status(200).json({
            success: true,
            is_free: false,
            is_reused: true,
            message: 'Tái sử dụng mã thanh toán VietQR còn hiệu lực!',
            data: {
              payment: existingPending,
              qr_code_url: existingPending.qr_code_url,
              bank_info: bankInfo,
              txn_ref: existingPending.txn_ref,
              amount: existingPending.amount,
              course_title: course.title,
              expires_at: expiresAtDate.toISOString(),
              expires_in_seconds: remainingSeconds,
            },
          });
        } else if (existingPending) {
          // Mã cũ đã HẾT HẠN -> Chuyển sang EXPIRED
          await existingPending.update({ status: 'EXPIRED' });
        }
      }
    } else {
      // Nếu ép buộc tạo mới, đánh dấu mọi bản ghi PENDING cũ của khóa học này sang EXPIRED
      await Payment.update(
        { status: 'EXPIRED' },
        { where: { user_id: req.user.id, course_id, status: 'PENDING' } }
      );
    }

    // 5. Tạo mã thanh toán VietQR mới kèm hạn tồn tại
    const txn_ref = `EDUVI_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const expires_at = new Date(Date.now() + PAYMENT_EXPIRE_SECONDS * 1000);

    const qr_code_url = generateVietQRUrl({
      bankId: bankInfo.bankId,
      accountNo: bankInfo.accountNo,
      accountName: bankInfo.accountName,
      amount: effectivePrice,
      addInfo: txn_ref,
    });

    const payment = await Payment.create({
      txn_ref,
      user_id: req.user.id,
      course_id,
      amount: effectivePrice,
      payment_method: 'VIETQR',
      status: 'PENDING',
      qr_code_url,
      bank_id: bankInfo.bankId,
      account_no: bankInfo.accountNo,
      account_name: bankInfo.accountName,
      expires_at,
    });

    createAuditLog({
      user_id: req.user.id,
      action: 'create_payment',
      entity_type: 'payment',
      entity_id: payment.id,
      detail: { course_id, course_title: course.title, amount: effectivePrice, txn_ref, expires_at },
      ip_address: getClientIp(req),
    });

    return res.status(201).json({
      success: true,
      is_free: false,
      is_reused: false,
      message: 'Khởi tạo mã thanh toán VietQR thành công!',
      data: {
        payment,
        qr_code_url,
        bank_info: bankInfo,
        txn_ref,
        amount: effectivePrice,
        course_title: course.title,
        expires_at: expires_at.toISOString(),
        expires_in_seconds: PAYMENT_EXPIRE_SECONDS,
      },
    });
  } catch (error: any) {
    console.error('createPayment Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi tạo mã thanh toán!' });
  }
};

// POST /api/payments/confirm/:id - Xác nhận thanh toán VietQR thành công & Kích hoạt khóa học
export const confirmPayment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const { id } = req.params;

    // 1. Tìm bản ghi Payment theo ID
    const payment = await Payment.findOne({
      where: { id },
      include: [{ model: Course, as: 'course' }],
    });

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy thông tin giao dịch thanh toán!' });
    }

    // 2. Kiểm tra quyền sở hữu giao dịch
    if (payment.user_id !== req.user.id && req.user.user_type !== 'admin') {
      return res.status(403).json({ success: false, error: 'Bạn không có quyền thao tác trên giao dịch này!' });
    }

    // 3. Nếu giao dịch đã hết hạn
    if (payment.status === 'EXPIRED' || (payment.expires_at && new Date() > new Date(payment.expires_at))) {
      if (payment.status !== 'EXPIRED') {
        await payment.update({ status: 'EXPIRED' });
      }
      return res.status(400).json({
        success: false,
        error: 'Mã thanh toán VietQR này đã hết hạn! Vui lòng tạo mã thanh toán mới.',
      });
    }

    // 4. Nếu giao dịch đã được xác nhận trước đó
    if (payment.status === 'SUCCESS') {
      const existingEnrollment = await Enrollment.findOne({
        where: { user_id: payment.user_id, course_id: payment.course_id },
      });

      return res.status(200).json({
        success: true,
        message: 'Giao dịch này đã được xác nhận thanh toán trước đó!',
        data: { payment, enrollment: existingEnrollment },
      });
    }

    // 5. Cập nhật trạng thái Payment sang SUCCESS
    await payment.update({
      status: 'SUCCESS',
      paid_at: new Date(),
    });

    // 6. Khởi tạo hoặc cập nhật Enrollment
    const [enrollment, created] = await Enrollment.findOrCreate({
      where: { user_id: payment.user_id, course_id: payment.course_id },
      defaults: {
        user_id: payment.user_id,
        course_id: payment.course_id,
        status: 'active',
        progress_percentage: 0,
        payment_id: payment.id,
        enrolled_at: new Date(),
      },
    });

    if (!created) {
      await enrollment.update({
        status: 'active',
        payment_id: payment.id,
        enrolled_at: new Date(),
      });
    } else {
      const course = await Course.findByPk(payment.course_id);
      if (course) {
        await course.update({ total_students: (course.total_students || 0) + 1 });
      }
    }

    // 7. Ghi Audit Log
    createAuditLog({
      user_id: req.user.id,
      action: 'confirm_payment',
      entity_type: 'payment',
      entity_id: payment.id,
      detail: {
        txn_ref: payment.txn_ref,
        amount: payment.amount,
        course_id: payment.course_id,
      },
      ip_address: getClientIp(req),
    });

    return res.status(200).json({
      success: true,
      message: 'Xác nhận thanh toán VietQR thành công! Khóa học đã được kích hoạt.',
      data: {
        payment,
        enrollment,
      },
    });
  } catch (error: any) {
    console.error('confirmPayment Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi xác nhận thanh toán!' });
  }
};

// GET /api/payments/status/:txn_ref - Lấy thông tin & trạng thái thanh toán theo mã giao dịch
export const getPaymentStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const { txn_ref } = req.params;

    const payment = await Payment.findOne({
      where: { txn_ref },
      include: [{ model: Course, as: 'course', attributes: ['id', 'title', 'thumbnail', 'price', 'sale_price'] }],
    });

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy thông tin giao dịch!' });
    }

    // Kiểm tra hết hạn nếu đang ở trạng thái PENDING
    if (payment.status === 'PENDING' && payment.expires_at && new Date() > new Date(payment.expires_at)) {
      await payment.update({ status: 'EXPIRED' });
    }

    return res.status(200).json({
      success: true,
      data: { payment },
    });
  } catch (error: any) {
    console.error('getPaymentStatus Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi kiểm tra trạng thái thanh toán!' });
  }
};

// GET /api/payments/my-payments - Danh sách lịch sử giao dịch của học viên
export const getMyPayments = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa xác thực người dùng!' });
    }

    const payments = await Payment.findAll({
      where: { user_id: req.user.id },
      order: [['createdAt', 'DESC']],
      include: [{ model: Course, as: 'course', attributes: ['id', 'title', 'thumbnail'] }],
    });

    return res.status(200).json({
      success: true,
      data: payments,
    });
  } catch (error: any) {
    console.error('getMyPayments Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi lấy danh sách giao dịch!' });
  }
};

// GET /api/payments/admin/all - Quan trị viên quản lý toàn bộ giao dịch & doanh thu sàn
export const getAllPaymentsAdmin = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.user_type !== 'admin') {
      return res.status(403).json({ success: false, error: 'Chỉ Quản trị viên mới có quyền truy cập!' });
    }

    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '10', 10);
    const offset = (page - 1) * limit;
    const { status, search, startDate, endDate } = req.query;

    const whereClause: any = {};

    if (status) {
      whereClause.status = status;
    }

    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate as string), new Date(endDate as string)],
      };
    }

    const userWhere: any = {};
    const courseWhere: any = {};

    if (search) {
      const searchPattern = `%${search}%`;
      whereClause[Op.or] = [
        { txn_ref: { [Op.like]: searchPattern } },
        { '$user.full_name$': { [Op.like]: searchPattern } },
        { '$user.email$': { [Op.like]: searchPattern } },
        { '$course.title$': { [Op.like]: searchPattern } },
      ];
    }

    const { count, rows: payments } = await Payment.findAndCountAll({
      where: whereClause,
      include: [
        { model: User, as: 'user', attributes: ['id', 'full_name', 'email', 'username'] },
        { model: Course, as: 'course', attributes: ['id', 'title', 'thumbnail', 'price', 'sale_price'] },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      subQuery: false,
    });

    // Thống kê Doanh thu & Tổng quan
    const allPayments = await Payment.findAll({ attributes: ['amount', 'status'] });
    let total_revenue = 0;
    let success_count = 0;
    let pending_count = 0;
    let expired_count = 0;

    allPayments.forEach((p) => {
      if (p.status === 'SUCCESS') {
        total_revenue += p.amount || 0;
        success_count++;
      } else if (p.status === 'PENDING') {
        pending_count++;
      } else if (p.status === 'EXPIRED') {
        expired_count++;
      }
    });

    return res.status(200).json({
      success: true,
      data: payments,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
      stats: {
        total_revenue,
        total_transactions: allPayments.length,
        success_count,
        pending_count,
        expired_count,
      },
    });
  } catch (error: any) {
    console.error('getAllPaymentsAdmin Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi lấy danh sách giao dịch toàn sàn!' });
  }
};

// GET /api/payments/instructor/my-transactions - Giảng viên xem giao dịch & thu nhập các khóa học của mình
export const getInstructorTransactions = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || (req.user.user_type !== 'instructor' && req.user.user_type !== 'admin')) {
      return res.status(403).json({ success: false, error: 'Chỉ Giảng viên mới có quyền truy cập!' });
    }

    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '10', 10);
    const offset = (page - 1) * limit;

    // Lấy tất cả ID khóa học do giảng viên này giảng dạy
    const courseInstructors = await CourseInstructor.findAll({
      where: { instructor_id: req.user.id },
      attributes: ['course_id'],
    });

    const courseIds = courseInstructors.map((ci) => ci.course_id);

    if (courseIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: { total: 0, page, limit, totalPages: 0 },
        stats: { instructor_revenue: 0, total_sales: 0 },
      });
    }

    const { count, rows: payments } = await Payment.findAndCountAll({
      where: {
        course_id: { [Op.in]: courseIds },
      },
      include: [
        { model: User, as: 'user', attributes: ['id', 'full_name', 'email'] },
        { model: Course, as: 'course', attributes: ['id', 'title', 'thumbnail', 'price'] },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    // Thống kê doanh thu giảng viên
    const successPayments = await Payment.findAll({
      where: {
        course_id: { [Op.in]: courseIds },
        status: 'SUCCESS',
      },
      attributes: ['amount'],
    });

    const instructor_revenue = successPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    return res.status(200).json({
      success: true,
      data: payments,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
      stats: {
        instructor_revenue,
        total_sales: successPayments.length,
      },
    });
  } catch (error: any) {
    console.error('getInstructorTransactions Error:', error);
    return res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi lấy danh sách thu nhập giảng viên!' });
  }
};
