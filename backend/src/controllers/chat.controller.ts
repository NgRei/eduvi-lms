import { Request, Response } from 'express';
import { ChatService } from '../services/chat.service';

export class ChatController {
  /**
   * Handle POST /api/chat
   */
  public static async handleChat(req: Request, res: Response): Promise<void> {
    try {
      const { messages } = req.body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Dữ liệu không hợp lệ. "messages" phải là mảng hội thoại không rỗng.',
        });
        return;
      }

      const lastMessage = messages[messages.length - 1];
      if (!lastMessage || !lastMessage.content || typeof lastMessage.content !== 'string' || !lastMessage.content.trim()) {
        res.status(400).json({
          success: false,
          error: 'Nội dung tin nhắn không được để trống.',
        });
        return;
      }

      const result = await ChatService.processChat(messages);

      res.json({
        success: true,
        reply: result.reply,
        model: result.model,
        usage: result.usage,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('[ChatController Error]:', error.message || error);
      res.status(500).json({
        success: false,
        error: error.message || 'Không thể xử lý yêu cầu trò chuyện lúc này.',
      });
    }
  }
}
