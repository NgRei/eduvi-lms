import React from 'react';
import { Outlet } from '@umijs/max';
import GlobalChatWidget from '@/components/GlobalChatWidget';

const ChatbotWrapper: React.FC = () => {
  return (
    <>
      <Outlet />
      <GlobalChatWidget />
    </>
  );
};

export default ChatbotWrapper;
