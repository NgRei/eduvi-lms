const loginPath = '/user/login';

export const isPublicPath = (pathname: string): boolean => {
  if (!pathname) return false;
  const cleanPath = pathname.split('?')[0].split('#')[0];
  if (cleanPath === '/' || cleanPath === loginPath) return true;
  if (
    cleanPath.startsWith('/user/') ||
    cleanPath === '/courses' ||
    cleanPath.startsWith('/courses/')
  ) {
    return true;
  }
  return false;
};
