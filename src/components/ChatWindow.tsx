import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Image, MoreVertical, Hash } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import MessageList from './MessageList';
import FileUpload from './FileUpload';

interface Room {
  id: number;
  name: string;
  description?: string;
  type: 'group' | 'direct';
  member_count: number;
  message_count: number;
}

interface Message {
  id: number;
  room_id: number;
  user_id: number;
  content?: string;
  type: 'text' | 'file' | 'image';
  file_url?: string;
  file_name?: string;
  file_size?: number;
  created_at: string;
  username: string;
  avatar?: string;
}

interface ChatWindowProps {
  room: Room;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ room }) => {
  const { user, token } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (room) {
      fetchMessages();
      // Join the room for real-time updates
      socket?.emit('join_room', room.id);
    }

    return () => {
      if (room) {
        socket?.emit('leave_room', room.id);
      }
    };
  }, [room.id, socket]);

  useEffect(() => {
    // Listen for new messages
    const handleNewMessage = (message: Message) => {
      setMessages(prev => [...prev, message]);
    };

    const handleUserTyping = ({ userId, username, isTyping }: any) => {
      if (userId !== user?.id) {
        setTypingUsers(prev => {
          if (isTyping) {
            return prev.includes(username) ? prev : [...prev, username];
          } else {
            return prev.filter(name => name !== username);
          }
        });
      }
    };

    socket?.on('new_message', handleNewMessage);
    socket?.on('user_typing', handleUserTyping);

    return () => {
      socket?.off('new_message', handleNewMessage);
      socket?.off('user_typing', handleUserTyping);
    };
  }, [socket, user?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/messages/room/${room.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content?: string, type: 'text' | 'file' | 'image' = 'text', fileData?: any) => {
    const messageContent = content || newMessage.trim();
    if (!messageContent && type === 'text') return;

    try {
      const response = await fetch('http://localhost:3001/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          roomId: room.id,
          content: messageContent,
          type,
          fileUrl: fileData?.fileUrl,
          fileName: fileData?.fileName,
          fileSize: fileData?.fileSize,
        }),
      });

      const data = await response.json();
      if (data.message) {
        setMessages(prev => [...prev, data.message]);
        setNewMessage('');
        
        // Emit real-time message
        socket?.emit('send_message', {
          roomId: room.id,
          message: data.message,
        });
        
        // Stop typing indicator
        socket?.emit('typing_stop', room.id);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  const handleTyping = () => {
    socket?.emit('typing_start', room.id);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      socket?.emit('typing_stop', room.id);
    }, 1000);
  };

  const handleFileUpload = (fileData: any) => {
    const type = fileData.mimeType?.startsWith('image/') ? 'image' : 'file';
    sendMessage(fileData.fileName, type, fileData);
    setShowFileUpload(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <Hash className="h-6 w-6 text-gray-500" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {room.name}
              </h1>
              <p className="text-sm text-gray-500">
                {room.member_count} members
              </p>
            </div>
          </div>
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <MessageList 
          messages={messages} 
          currentUserId={user?.id || 0}
          loading={loading}
        />
        
        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="px-6 py-2">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span>
                {typingUsers.length === 1 
                  ? `${typingUsers[0]} is typing...`
                  : `${typingUsers.length} people are typing...`
                }
              </span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="px-6 py-4 bg-white border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex items-end space-x-3">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                placeholder={`Message #${room.name}`}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowFileUpload(true)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Paperclip className="h-5 w-5" />
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="flex-shrink-0 p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>

      {/* File Upload Modal */}
      {showFileUpload && (
        <FileUpload
          onClose={() => setShowFileUpload(false)}
          onUpload={handleFileUpload}
        />
      )}
    </div>
  );
};

export default ChatWindow;