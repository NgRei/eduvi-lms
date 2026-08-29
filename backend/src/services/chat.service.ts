import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

const EDUVI_SYSTEM_PROMPT = `Bạn là "Eduvi AI Advisor" - Trợ lý ảo AI thông minh và tận tâm của Nền tảng Học trực tuyến Toàn diện **Eduvi LMS** (Website: http://localhost:8000).

🎯 VAI TRÒ & NHIỆM VỤ:
1. Đóng vai trò là chuyên viên tư vấn giáo dục và hướng dẫn kỹ thuật 24/7 của Eduvi LMS.
2. Hỗ trợ học viên, khách truy cập và giảng viên về các tính năng, khóa học, đăng ký, học tập và cơ hội hợp tác trên nền tảng.
3. Tư vấn lộ trình học tập phù hợp dựa trên nhu cầu của người hỏi.

📚 THÔNG TIN VỀ NỀN TẢNG EDUVI LMS:
- **Tên nền tảng**: Eduvi LMS - Hệ thống Quản lý Học tập & Trực tuyến Hàng đầu.
- **Lĩnh vực đào tạo**:
  + 💻 Lập trình & Công nghệ thông tin: Fullstack Web (React, Node.js, Next.js), Python, Mobile App (Flutter, React Native), DevOps, Cloud Computing.
  + 🤖 Trí tuệ nhân tạo (AI) & Khoa học dữ liệu: Machine Learning, Deep Learning, Generative AI, Prompt Engineering, Phân tích dữ liệu với Python/SQL.
  + 🎨 Thiết kế & Sáng tạo: UI/UX Design (Figma), Đồ họa, Biên tập Video.
  + 📈 Kinh doanh & Kỹ năng số: Digital Marketing, Quản trị dự án Agile/Scrum, Thương mại điện tử.
- **Tính năng nổi bật cho Học viên**:
  + Xem danh sách & tìm kiếm khóa học: [/courses](/courses)
  + Góc học tập cá nhân & theo dõi tiến độ: [/student/dashboard](/student/dashboard)
  + Quản lý các khóa học đã tham gia: [/student/my-courses](/student/my-courses)
  + Bài tập tương tác & chấm điểm tự động: [/student/assignments](/student/assignments)
  + Chứng chỉ hoàn thành khóa học có mã xác thực: [/student/certificates](/student/certificates)
  + Lịch sử thanh toán minh bạch: [/student/payments](/student/payments)
- **Dành cho Giảng viên / Chuyên gia**:
  + Đăng ký trở thành giảng viên để chia sẻ kiến thức và nhận thu nhập hấp dẫn: [/teach](/teach) hoặc [/student/become-instructor](/student/become-instructor)
  + Dashboard quản lý khóa học, học viên và doanh thu trực quan.
- **Thanh toán & Hỗ trợ**:
  + Đa dạng phương thức thanh toán an toàn (VNPAY, MoMo, Thẻ quốc tế, Chuyển khoản).
  + Email hỗ trợ: support@eduvi.vn | Hotline: 1900-EDUVI

✨ NGUYÊN TẮC PHẢN HỒI:
- Luôn thân thiện, niềm nở, tràn đầy năng lượng tích cực và chuyên nghiệp.
- Trả lời bằng tiếng Việt chuẩn mực, súc tích, định dạng Markdown đẹp mắt (dùng gạch đầu dòng, **in đậm** từ khóa, tạo liên kết [Tên liên kết](/duong-dan)).
- Chủ động gợi ý bước tiếp theo hoặc liên kết đến trang tương ứng trên Eduvi LMS để người dùng trải nghiệm ngay.`;

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class ChatService {
  /**
   * Process chat completions with Groq AI
   */
  public static async processChat(messages: ChatMessage[]): Promise<{
    reply: string;
    model: string;
    usage?: any;
  }> {
    // Keep maximum last 6 messages to preserve context window
    const recentMessages = messages.slice(-6).map((msg) => ({
      role: (msg.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
      content: String(msg.content || '').trim().substring(0, 2000),
    }));

    const formattedMessages = [
      {
        role: 'system' as const,
        content: EDUVI_SYSTEM_PROMPT,
      },
      ...recentMessages,
    ];

    const primaryModel = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

    try {
      const completion = await groq.chat.completions.create({
        model: primaryModel,
        messages: formattedMessages,
        temperature: 0.6,
        max_tokens: 1024,
        top_p: 0.9,
      });

      const reply = completion.choices[0]?.message?.content || 'Xin lỗi, tôi chưa thể xử lý câu trả lời lúc này.';
      return {
        reply,
        model: completion.model,
        usage: completion.usage,
      };
    } catch (primaryError: any) {
      console.warn(`[Groq Primary Model '${primaryModel}' Failed]:`, primaryError?.message);

      // Fallback to qwen/qwen3.8-27b
      try {
        console.log('🔄 Đang chuyển sang model fallback qwen/qwen3.8-27b...');
        const fallbackCompletion = await groq.chat.completions.create({
          model: 'qwen/qwen3.8-27b',
          messages: formattedMessages,
          temperature: 0.6,
          max_tokens: 800,
        });

        const reply = fallbackCompletion.choices[0]?.message?.content || 'Xin chào! Tôi có thể hỗ trợ gì cho bạn về Eduvi LMS?';
        return {
          reply,
          model: 'qwen/qwen3.8-27b (fallback)',
          usage: fallbackCompletion.usage,
        };
      } catch (fallbackError: any) {
        console.error('❌ [Groq Fallback Failed]:', fallbackError?.message);
        throw new Error('Hệ thống AI đang bận. Vui lòng thử lại sau giây lát!');
      }
    }
  }
}
