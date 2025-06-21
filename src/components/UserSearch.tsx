import React, { useState, useEffect } from 'react';
import { X, Search, MessageCircle, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface User {
  id: number;
  username: string;
  avatar?: string;
  online: boolean;
}

interface UserSearchProps {
  onClose: () => void;
  onStartChat: (userId: number, username: string) => void;
}

const UserSearch: React.FC<UserSearchProps> = ({ onClose, onStartChat }) => {
  const { token } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [startingChats, setStartingChats] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (searchTerm.trim()) {
      searchUsers();
    } else {
      setUsers([]);
    }
  }, [searchTerm]);

  const searchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/users/search?q=${encodeURIComponent(searchTerm)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async (userId: number, username: string) => {
    setStartingChats(prev => new Set(prev).add(userId));
    try {
      await onStartChat(userId, username);
    } catch (error) {
      console.error('Failed to start chat:', error);
    } finally {
      setStartingChats(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Start Direct Chat
            </h3>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users by username..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto p-6">
          {!searchTerm.trim() ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Search for Users
              </h4>
              <p className="text-gray-500">
                Enter a username to find people to chat with
              </p>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                No users found
              </h4>
              <p className="text-gray-500">
                Try searching with a different username
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      {user.online && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{user.username}</h4>
                      <p className="text-sm text-gray-500">
                        {user.online ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleStartChat(user.id, user.username)}
                    disabled={startingChats.has(user.id)}
                    className="flex items-center space-x-1 bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    {startingChats.has(user.id) ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                        <span>Starting...</span>
                      </>
                    ) : (
                      <>
                        <MessageCircle className="h-3 w-3" />
                        <span>Chat</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserSearch;