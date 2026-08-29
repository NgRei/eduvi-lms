import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  MessageOutlined,
  CloseOutlined,
  DeleteOutlined,
  SendOutlined,
  UserOutlined,
} from '@ant-design/icons';
import './style.less';

interface ChatItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time: string;
}

interface SuggestionItem {
  label: string;
  prompt: string;
}

const getCurrentTimeString = () => {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/**
 * Check if the chat widget should be visible on the given path
 */
export const shouldShowWidget = (pathname: string): boolean => {
  if (!pathname) return true;
  const clean = pathname.split('?')[0].split('#')[0];

  // 1. Blacklist: Authentication forms (login, register, forgot-password, reset-password)
  if (clean.startsWith('/user/')) return false;

  // 2. Blacklist: Active exam / assignment taking (/student/assignments/:id but NOT /result)
  if (/^\/student\/assignments\/[^/]+$/.test(clean)) return false;

  // 3. Blacklist: Exception error pages (403, 404, 500)
  if (clean.startsWith('/exception/')) return false;

  return true;
};

/**
 * Get dynamic suggestions & welcome message according to the current section
 */
export const getContextConfig = (pathname: string) => {
  const clean = (pathname || '').split('?')[0].split('#')[0];

  // 1. Certificates Page
  if (clean.includes('/certificates')) {
    return {
      welcome:
        '👋 Chào bạn! Tôi là **Eduvi AI Advisor**.\n\nBạn đang ở trang **Chứng chỉ & Thành tích**. Tôi có thể giúp bạn tìm hiểu về **điều kiện nhận chứng chỉ**, **cách xác thực mã chứng chỉ** hoặc **chia sẻ lên LinkedIn/CV**.',
      suggestions: [
        { label: '📜 Điều kiện nhận chứng chỉ?', prompt: 'Làm sao để tôi đủ điều kiện nhận chứng chỉ hoàn thành khóa học trên Eduvi LMS?' },
        { label: '🔗 Cách chia sẻ lên LinkedIn?', prompt: 'Hướng dẫn cách thêm và chia sẻ chứng chỉ Eduvi LMS lên hồ sơ LinkedIn?' },
        { label: '🔍 Cách xác thực mã chứng chỉ?', prompt: 'Làm thế nào để nhà tuyển dụng có thể kiểm tra và xác thực mã chứng chỉ Eduvi của tôi?' },
        { label: '🎓 Khóa học có chứng chỉ?', prompt: 'Những khóa học nào trên Eduvi LMS cấp chứng chỉ hoàn thành sau khi học?' },
      ],
    };
  }

  // 2. Payments & Billing Page
  if (clean.includes('/payments')) {
    return {
      welcome:
        '👋 Chào bạn! Tôi là **Eduvi AI Advisor**.\n\nBạn đang ở mục **Lịch sử thanh toán & Giao dịch**. Bạn cần hỗ trợ về **hóa đơn**, **trạng thái thanh toán VNPAY/Momo** hay **chính sách hoàn tiền**?',
      suggestions: [
        { label: '💳 Chính sách hoàn tiền?', prompt: 'Chính sách hoàn tiền học phí của Eduvi LMS được quy định như thế nào?' },
        { label: '🧾 Xuất hóa đơn khóa học?', prompt: 'Làm thế nào để tôi có thể xuất hóa đơn VAT sau khi thanh toán khóa học?' },
        { label: '🔒 Các cổng thanh toán?', prompt: 'Eduvi LMS hỗ trợ những phương thức thanh toán an toàn nào?' },
        { label: '🎁 Mã giảm giá & Ưu đãi?', prompt: 'Làm sao để tôi nhận và áp dụng mã voucher giảm giá khóa học?' },
      ],
    };
  }

  // 3. Student Dashboard & My Courses
  if (clean.includes('/student/dashboard') || clean.includes('/student/my-courses')) {
    return {
      welcome:
        '👋 Chào bạn! Tôi là **Eduvi AI Advisor** - Cố vấn học tập của bạn.\n\nTôi có thể hỗ trợ bạn **gợi ý bài học tiếp theo**, **tư vấn lộ trình học tập**, **mẹo quản lý thời gian** hoặc giải đáp thắc mắc về khóa học.',
      suggestions: [
        { label: '📈 Gợi ý lộ trình tiếp theo?', prompt: 'Dựa trên các khóa học hiện tại, bạn có thể tư vấn lộ trình học tập nâng cao tiếp theo cho tôi không?' },
        { label: '⏰ Mẹo quản lý thời gian học?', prompt: 'Làm sao để duy trì thói quen học tập trực tuyến đều đặn và hiệu quả nhất?' },
        { label: '📝 Mẹo làm bài tập đạt điểm cao?', prompt: 'Bạn có lời khuyên gì để hoàn thành tốt các bài tập và quiz trên hệ thống Eduvi LMS?' },
        { label: '💡 Hỏi đáp về bài giảng?', prompt: 'Tôi có thể hỏi bạn các kiến thức chuyên môn trong quá trình học không?' },
      ],
    };
  }

  // 4. Become Instructor / Instructor Portal
  if (clean.startsWith('/teach') || clean.includes('become-instructor') || clean.startsWith('/instructor')) {
    return {
      welcome:
        '👋 Chào bạn! Tôi là **Eduvi AI Advisor**.\n\nTôi có thể hỗ trợ bạn về **quy trình ứng tuyển giảng viên**, **chính sách chia sẻ doanh thu**, **tiêu chuẩn bài giảng** và **cách tạo khóa học thu hút** trên Eduvi LMS.',
      suggestions: [
        { label: '👨‍🏫 Quy trình nộp hồ sơ?', prompt: 'Quy trình và hồ sơ cần thiết để đăng ký trở thành Giảng viên trên Eduvi LMS là gì?' },
        { label: '💰 Tỷ lệ chia sẻ doanh thu?', prompt: 'Giảng viên trên Eduvi LMS nhận được mức chia sẻ doanh thu (Revenue Share) như thế nào?' },
        { label: '📹 Tiêu chuẩn video bài giảng?', prompt: 'Eduvi LMS có những quy chuẩn và yêu cầu kỹ thuật gì đối với video bài giảng?' },
        { label: '📊 Mẹo xây dựng giáo trình?', prompt: 'Làm thế nào để thiết kế một khóa học hấp dẫn và thu hút đông đảo học viên?' },
      ],
    };
  }

  // 5. Default / Homepage & Courses Catalog
  return {
    welcome:
      '👋 Xin chào! Tôi là **Eduvi AI Advisor** - Trợ lý thông minh của Eduvi LMS.\n\nTôi có thể giúp bạn **tư vấn khóa học**, **hướng dẫn học tập**, **đăng ký giảng viên** hoặc giải đáp bất kỳ thắc mắc nào. Bạn muốn tìm hiểu gì hôm nay?',
    suggestions: [
      { label: '🎓 Khóa học AI & Lập trình?', prompt: 'Eduvi LMS có những khóa học nổi bật nào về AI và lập trình web?' },
      { label: '🚀 Lộ trình cho người mới?', prompt: 'Tôi là người mới bắt đầu, bạn có thể tư vấn lộ trình học tập phù hợp không?' },
      { label: '👨‍🏫 Trở thành Giảng viên?', prompt: 'Làm thế nào để tôi có thể đăng ký làm Giảng viên trên Eduvi LMS?' },
      { label: '💳 Học phí & Thanh toán?', prompt: 'Eduvi LMS hỗ trợ những phương thức thanh toán và chính sách học phí nào?' },
    ],
  };
};

export const GlobalChatWidget: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname;
    }
    return '/';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkPath = () => {
      const p = window.location.pathname;
      if (p !== currentPath) {
        setCurrentPath(p);
      }
    };

    const interval = setInterval(checkPath, 250);
    window.addEventListener('popstate', checkPath);
    window.addEventListener('hashchange', checkPath);

    return () => {
      clearInterval(interval);
      window.removeEventListener('popstate', checkPath);
      window.removeEventListener('hashchange', checkPath);
    };
  }, [currentPath]);

  const isVisible = useMemo(() => shouldShowWidget(currentPath), [currentPath]);
  const contextConfig = useMemo(() => getContextConfig(currentPath), [currentPath]);

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [hasUnread, setHasUnread] = useState<boolean>(true);

  const [messages, setMessages] = useState<ChatItem[]>([
    {
      id: 'welcome-init',
      role: 'assistant',
      content: contextConfig.welcome,
      time: getCurrentTimeString(),
    },
  ]);

  // Update welcome message if conversation is clean and user changes section
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].role === 'assistant') {
        return [
          {
            id: `welcome-${currentPath}`,
            role: 'assistant',
            content: contextConfig.welcome,
            time: getCurrentTimeString(),
          },
        ];
      }
      return prev;
    });
  }, [currentPath, contextConfig]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, messages, isGenerating]);

  // Do not render anything if current route is in blacklist
  if (!isVisible) {
    return null;
  }

  const toggleChat = () => {
    setIsOpen((prev) => {
      if (!prev) setHasUnread(false);
      return !prev;
    });
  };

  const handleClearHistory = () => {
    if (isGenerating) return;
    if (window.confirm('Bạn có muốn xóa lịch sử cuộc trò chuyện này không?')) {
      setMessages([
        {
          id: `welcome-reset-${Date.now()}`,
          role: 'assistant',
          content: contextConfig.welcome,
          time: getCurrentTimeString(),
        },
      ]);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend || inputValue).trim();
    if (!content || isGenerating) return;

    const userMsg: ChatItem = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      time: getCurrentTimeString(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputValue('');
    setIsGenerating(true);

    try {
      // Build context (maximum last 6 messages)
      const payloadMessages = newMessages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: payloadMessages }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.reply) {
        const botMsg: ChatItem = {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          content: data.reply,
          time: getCurrentTimeString(),
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        const botMsg: ChatItem = {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ **Lỗi:** ${data.error || 'Không thể nhận phản hồi từ AI lúc này.'}\n\nVui lòng thử lại sau giây lát!`,
          time: getCurrentTimeString(),
        };
        setMessages((prev) => [...prev, botMsg]);
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      const botMsg: ChatItem = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: '⚠️ **Không thể kết nối đến máy chủ Eduvi AI.** Vui lòng kiểm tra lại kết nối mạng.',
        time: getCurrentTimeString(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsGenerating(false);
    }
  };

  const renderFormattedText = (raw: string) => {
    if (!raw) return null;

    const lines = raw.split('\n');
    return (
      <div>
        {lines.map((line, idx) => {
          const boldParts = line.split(/(\*\*[^*]+\*\*)/g);

          return (
            <p key={idx} style={{ margin: line.trim() === '' ? '4px 0' : '0 0 6px' }}>
              {boldParts.map((part, pIdx) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return (
                    <strong key={pIdx} style={{ color: '#1e1b4b', fontWeight: 600 }}>
                      {part.slice(2, -2)}
                    </strong>
                  );
                }
                const linkMatch = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
                if (linkMatch) {
                  const [full, text, url] = linkMatch;
                  const before = part.substring(0, part.indexOf(full));
                  const after = part.substring(part.indexOf(full) + full.length);
                  return (
                    <React.Fragment key={pIdx}>
                      {before}
                      <a
                        href={url}
                        target={url.startsWith('http') ? '_blank' : '_self'}
                        rel="noreferrer"
                        style={{ color: '#4f46e5', fontWeight: 600, textDecoration: 'underline' }}
                      >
                        {text}
                      </a>
                      {after}
                    </React.Fragment>
                  );
                }
                return part;
              })}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div
      id="eduvi-global-chat-widget"
      className={`globalChatContainer ${isOpen ? 'isOpen' : ''}`}
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 999999,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Floating Action Button */}
      <button
        id="eduvi-chat-fab-btn"
        type="button"
        className="chatFab"
        onClick={toggleChat}
        title="Mở Trợ lý Eduvi AI"
        aria-label="Eduvi AI Chat"
        style={{
          width: 58,
          height: 58,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
          border: '2px solid rgba(255, 255, 255, 0.4)',
          color: '#ffffff',
          boxShadow: '0 10px 25px -3px rgba(79, 70, 229, 0.5), 0 4px 10px -2px rgba(0, 0, 0, 0.3)',
          outline: 'none',
          position: 'relative',
        }}
      >
        <div className="fabIcon" style={{ fontSize: 24 }}>
          {isOpen ? <CloseOutlined /> : <MessageOutlined />}
        </div>
        {!isOpen && <div className="fabPulseRing" />}
        {!isOpen && hasUnread && <div className="fabBadge">AI</div>}
      </button>

      {/* Chat Modal Box */}
      <div
        id="eduvi-chat-modal-box"
        className="chatModal"
        role="dialog"
        aria-hidden={!isOpen}
        style={{
          display: isOpen ? 'flex' : 'none',
          position: 'absolute',
          bottom: 74,
          right: 0,
          width: 400,
          height: 'min(560px, calc(100vh - 110px))',
          maxHeight: 'calc(100vh - 110px)',
          background: '#ffffff',
          borderRadius: 20,
          boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.25), 0 0 20px 0 rgba(79, 70, 229, 0.15)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          flexDirection: 'column',
          overflow: 'hidden',
          zIndex: 999999,
        }}
      >
        {/* Header */}
        <div
          className="chatHeader"
          style={{
            flexShrink: 0,
            padding: '14px 18px',
            background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
          }}
        >
          <div className="headerInfo" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              className="botAvatar"
              style={{
                position: 'relative',
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                border: '1px solid rgba(255, 255, 255, 0.4)',
              }}
            >
              <span>🤖</span>
              <span
                className="statusDot"
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 11,
                  height: 11,
                  borderRadius: '50%',
                  background: '#22c55e',
                  border: '2px solid #4f46e5',
                  boxShadow: '0 0 8px #22c55e',
                }}
              />
            </div>
            <div>
              <div className="botName" style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2, color: '#ffffff' }}>
                Eduvi AI Assistant
              </div>
              <div className="botStatus" style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.85)' }}>
                Trực tuyến • Groq Cloud AI
              </div>
            </div>
          </div>
          <div className="headerActions" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              className="headerBtn"
              onClick={handleClearHistory}
              title="Làm mới cuộc trò chuyện"
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                color: '#ffffff',
                width: 32,
                height: 32,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              <DeleteOutlined />
            </button>
            <button
              type="button"
              className="headerBtn"
              onClick={toggleChat}
              title="Đóng khung chat"
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                color: '#ffffff',
                width: 32,
                height: 32,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              <CloseOutlined />
            </button>
          </div>
        </div>

        {/* Messages Body */}
        <div
          className="chatBody"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            background: '#f8fafc',
          }}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`msgRow ${msg.role === 'assistant' ? 'botRow' : 'userRow'}`}
              style={{
                display: 'flex',
                gap: 10,
                alignSelf: msg.role === 'assistant' ? 'flex-start' : 'flex-end',
                flexDirection: msg.role === 'assistant' ? 'row' : 'row-reverse',
                maxWidth: msg.role === 'assistant' ? '92%' : '85%',
              }}
            >
              <div
                className="rowAvatar"
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: msg.role === 'assistant' ? '#ede9fe' : '#e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                {msg.role === 'assistant' ? '🤖' : <UserOutlined />}
              </div>
              <div
                className={`msgBubble ${
                  msg.role === 'assistant' ? 'botBubble' : 'userBubble'
                }`}
                style={{
                  padding: '10px 14px',
                  fontSize: 13.5,
                  lineHeight: 1.55,
                  borderRadius: 14,
                  position: 'relative',
                  wordBreak: 'break-word',
                  background: msg.role === 'assistant' ? '#ffffff' : 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                  color: msg.role === 'assistant' ? '#1e293b' : '#ffffff',
                  border: msg.role === 'assistant' ? '1px solid #e2e8f0' : 'none',
                  boxShadow: msg.role === 'assistant' ? '0 1px 3px rgba(0, 0, 0, 0.05)' : '0 3px 10px rgba(79, 70, 229, 0.3)',
                  borderTopLeftRadius: msg.role === 'assistant' ? 4 : 14,
                  borderTopRightRadius: msg.role === 'assistant' ? 14 : 4,
                }}
              >
                {msg.role === 'assistant' ? (
                  renderFormattedText(msg.content)
                ) : (
                  <p style={{ margin: 0 }}>{msg.content}</p>
                )}
                <span
                  className="msgTime"
                  style={{
                    display: 'block',
                    fontSize: 10,
                    color: msg.role === 'assistant' ? '#94a3b8' : 'rgba(255, 255, 255, 0.7)',
                    marginTop: 4,
                    textAlign: 'right',
                  }}
                >
                  {msg.time}
                </span>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isGenerating && (
            <div
              className="msgRow botRow"
              style={{ display: 'flex', gap: 10, alignSelf: 'flex-start', maxWidth: '80%' }}
            >
              <div
                className="rowAvatar"
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: '#ede9fe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  flexShrink: 0,
                }}
              >
                🤖
              </div>
              <div
                className="msgBubble botBubble typingBubble"
                style={{
                  padding: '10px 14px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 14,
                  borderTopLeftRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <span className="typingDot" />
                <span className="typingDot" />
                <span className="typingDot" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestions */}
        <div
          className="quickSuggestions"
          style={{
            flexShrink: 0,
            padding: '8px 14px',
            background: '#ffffff',
            borderTop: '1px solid #f1f5f9',
          }}
        >
          <div className="suggestionLabel" style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>
            💡 Gợi ý câu hỏi nhanh:
          </div>
          <div
            className="suggestionScroll"
            style={{
              display: 'flex',
              gap: 6,
              overflowX: 'auto',
              paddingBottom: 4,
              scrollbarWidth: 'none',
            }}
          >
            {contextConfig.suggestions.map((item: SuggestionItem, idx: number) => (
              <button
                key={idx}
                type="button"
                className="suggestionChip"
                disabled={isGenerating}
                onClick={() => handleSendMessage(item.prompt)}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  color: '#475569',
                  fontSize: 12,
                  fontWeight: 500,
                  padding: '5px 11px',
                  borderRadius: 99,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Footer Form */}
        <form
          className="chatFooter"
          style={{
            flexShrink: 0,
            padding: '10px 14px',
            background: '#ffffff',
            borderTop: '1px solid #e2e8f0',
          }}
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
        >
          <div
            className="inputWrapper"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: 12,
              padding: '4px 6px 4px 12px',
            }}
          >
            <input
              ref={inputRef}
              type="text"
              className="chatInput"
              placeholder="Hỏi về khóa học, giảng dạy, học phí..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isGenerating}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: '#0f172a',
                fontSize: 13.5,
                outline: 'none',
                padding: '6px 0',
              }}
            />
            <button
              type="submit"
              className="btnSend"
              disabled={!inputValue.trim() || isGenerating}
              aria-label="Gửi tin nhắn"
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: !inputValue.trim() || isGenerating ? '#e2e8f0' : '#4f46e5',
                border: 'none',
                color: !inputValue.trim() || isGenerating ? '#94a3b8' : '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: !inputValue.trim() || isGenerating ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                flexShrink: 0,
              }}
            >
              <SendOutlined />
            </button>
          </div>
          <div className="poweredBy" style={{ textAlign: 'center', fontSize: 10.5, color: '#94a3b8', marginTop: 6 }}>
            Phản hồi siêu nhanh bởi <strong style={{ color: '#4f46e5' }}>Groq AI Engine</strong>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GlobalChatWidget;
