import type { Request, Response } from 'express';
import { waitTime, defaultUser } from './utils';

const { ANT_DESIGN_PRO_ONLY_DO_NOT_USE_IN_YOUR_PRODUCTION } = process.env;

/**
 * 当前用户的权限，如果为空代表没登录
 * current user access， if is '', user need login
 * 如果是 pro 的预览，默认是有权限的
 */
let access = ANT_DESIGN_PRO_ONLY_DO_NOT_USE_IN_YOUR_PRODUCTION === 'site' ? 'admin' : '';

const getAccess = () => {
  return access;
};

// 代码中会兼容本地 service mock 以及部署站点的静态数据
export default {
  // 支持值为 Object 和 Array
  'GET /api/currentUser': (_req: Request, res: Response) => {
    if (!getAccess()) {
      res.status(401).send({
        data: {
          isLogin: false,
        },
        errorCode: '401',
        errorMessage: 'Vui lòng đăng nhập!',
        success: true,
      });
      return;
    }
    
    // Return role-specific mock details for a premium experience
    const activeAccess = getAccess();
    let roleProfile = {
      name: 'Nguyễn Văn An',
      avatar: 'https://gw.alipayobjects.com/zos/rmsportal/BiazfanxmamNRoxxVxka.png',
      userid: 'student_id',
      email: 'annv@gmail.com',
      signature: 'Học tập là hạt giống của hạnh phúc',
      title: 'Học viên Ưu tú',
      group: 'Lớp Lập trình NodeJS thực chiến',
    };

    if (activeAccess === 'admin') {
      roleProfile = {
        name: 'Quản trị viên Hệ thống',
        avatar: 'https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png',
        userid: 'admin_id',
        email: 'admin@eduvi.com',
        signature: 'Vận hành Eduvi LMS trơn tru',
        title: 'Quản trị viên cấp cao',
        group: 'Ban quản trị hệ thống',
      };
    } else if (activeAccess === 'instructor') {
      roleProfile = {
        name: 'TS. Trần Thị Bình',
        avatar: 'https://gw.alipayobjects.com/zos/rmsportal/sfjbOqnsXXJgNCjCzDBL.png',
        userid: 'instructor_id',
        email: 'binhtt@gmail.com',
        signature: 'Truyền tải kiến thức, khai sáng tương lai',
        title: 'Giảng viên cấp cao',
        group: 'Khoa Công nghệ Thông tin',
      };
    }

    res.send({
      success: true,
      data: {
        ...roleProfile,
        access: activeAccess,
        notifyCount: 3,
        unreadCount: 2,
      },
    });
  },
  // GET POST 可省略
  'GET /api/users': [
    {
      key: '1',
      name: 'John Brown',
      age: 32,
      address: 'New York No. 1 Lake Park',
    },
  ],
  'POST /api/login/account': async (req: Request, res: Response) => {
    const { password, username, type } = req.body;
    await waitTime(1000);
    
    if (password === 'ant.design') {
      if (username === 'sysadmin') {
        res.send({
          status: 'ok',
          type,
          currentAuthority: 'admin',
        });
        access = 'admin';
        return;
      }
      if (username === 'binhtt') {
        res.send({
          status: 'ok',
          type,
          currentAuthority: 'instructor',
        });
        access = 'instructor';
        return;
      }
      if (username === 'annv' || username === 'user') {
        res.send({
          status: 'ok',
          type,
          currentAuthority: 'student',
        });
        access = 'student';
        return;
      }
    }

    res.send({
      status: 'error',
      type,
      currentAuthority: 'guest',
    });
    access = 'guest';
  },
  'POST /api/login/outLogin': (_req: Request, res: Response) => {
    access = '';
    res.send({ data: {}, success: true });
  },
  'GET /api/500': (_req: Request, res: Response) => {
    res.status(500).send({
      timestamp: 1513932555104,
      status: 500,
      error: 'error',
      message: 'error',
      path: '/base/category/list',
    });
  },
  'GET /api/404': (_req: Request, res: Response) => {
    res.status(404).send({
      timestamp: 1513932643431,
      status: 404,
      error: 'Not Found',
      message: 'No message available',
      path: '/base/category/list/2121212',
    });
  },
  'GET /api/403': (_req: Request, res: Response) => {
    res.status(403).send({
      timestamp: 1513932555104,
      status: 403,
      error: 'Forbidden',
      message: 'Forbidden',
      path: '/base/category/list',
    });
  },
  'GET /api/401': (_req: Request, res: Response) => {
    res.status(401).send({
      timestamp: 1513932555104,
      status: 401,
      error: 'Unauthorized',
      message: 'Unauthorized',
      path: '/base/category/list',
    });
  },

  'GET /api/login/captcha': async (_req: Request, res: Response) => {
    await waitTime(2000);
    return res.json('captcha-xxx');
  },
};