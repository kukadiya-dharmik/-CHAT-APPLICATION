import React from 'react';
import { Download, FileText, Image as ImageIcon } from 'lucide-react';

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

interface MessageListProps {
  messages: Message[];
  currentUserId: number;
  loading: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages, currentUserId, loading }) => {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No messages yet
          </h3>
          <p className="text-gray-500">
            Be the first to send a message in this room
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-4 space-y-4">
      {messages.map((message, index) => {
        const isOwnMessage = message.user_id === currentUserId;
        const showAvatar = !isOwnMessage && (index === 0 || messages[index - 1].user_id !== message.user_id);
        
        return (
          <div
            key={message.id}
            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} ${
              showAvatar ? 'mt-6' : 'mt-1'
            }`}
          >
            <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${
              isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''
            }`}>
              {/* Avatar */}
              {!isOwnMessage && (
                <div className="flex-shrink-0">
                  {showAvatar ? (
                    <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-medium">
                        {message.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  ) : (
                    <div className="w-8 h-8"></div>
                  )}
                </div>
              )}

              {/* Message Content */}
              <div className={`rounded-2xl px-4 py-2 ${
                isOwnMessage 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white border border-gray-200 text-gray-900'
              }`}>
                {/* Username for non-own messages */}
                {!isOwnMessage && showAvatar && (
                  <p className="text-xs text-gray-500 mb-1 font-medium">
                    {message.username}
                  </p>
                )}

                {/* Message based on type */}
                {message.type === 'text' && (
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                )}

                {message.type === 'image' && (
                  <div className="space-y-2">
                    {message.file_url && (
                      <img
                        src={`http://localhost:3001${message.file_url}`}
                        alt={message.file_name || 'Image'}
                        className="max-w-full h-auto rounded-lg"
                      />
                    )}
                    {message.content && (
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    )}
                  </div>
                )}

                {message.type === 'file' && (
                  <div className="space-y-2">
                    <div className={`flex items-center space-x-3 p-3 rounded-lg ${
                      isOwnMessage ? 'bg-blue-500' : 'bg-gray-50'
                    }`}>
                      <FileText className="h-8 w-8 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          isOwnMessage ? 'text-white' : 'text-gray-900'
                        }`}>
                          {message.file_name}
                        </p>
                        <p className={`text-xs ${
                          isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {formatFileSize(message.file_size)}
                        </p>
                      </div>
                      {message.file_url && (
                        <a
                          href={`http://localhost:3001${message.file_url}`}
                          download={message.file_name}
                          className={`p-1 rounded ${
                            isOwnMessage 
                              ? 'text-blue-100 hover:bg-blue-500' 
                              : 'text-gray-500 hover:bg-gray-200'
                          } transition-colors`}
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                    {message.content && (
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    )}
                  </div>
                )}

                {/* Timestamp */}
                <p className={`text-xs mt-1 ${
                  isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {formatTime(message.created_at)}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MessageList;