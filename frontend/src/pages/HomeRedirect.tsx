import { PageLoading } from '@ant-design/pro-components';
import { history, useModel } from '@umijs/max';
import React, { useEffect } from 'react';

const HomeRedirect: React.FC = () => {
  const { initialState } = useModel('@@initialState');

  useEffect(() => {
    if (initialState?.currentUser) {
      const { access } = initialState.currentUser;
      if (access === 'admin') {
        history.replace('/admin/dashboard');
      } else if (access === 'instructor') {
        history.replace('/instructor/dashboard');
      } else {
        history.replace('/student/dashboard');
      }
    } else {
      history.replace('/user/login');
    }
  }, [initialState]);

  return <PageLoading />;
};

export default HomeRedirect;
