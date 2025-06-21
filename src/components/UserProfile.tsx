import React from 'react';
import { X, Users, MessageCircle, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';

interface UserProfileProps {
  onClose: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ onClose }) => {
  const { user } = useAuth();
  const { onlineUsers } = useSocket();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Online Users
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current User */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">
                {user?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">{user?.username}</h4>
              <p className="text-sm text-gray-600">{user?.email}</p>
              <div className="flex items-center mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-xs text-green-600 font-medium">Online (You)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Online Users List */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
            <Users className="h-4 w-4" />
            <span>{onlineUsers.length} other users online</span>
          </div>

          {onlineUsers.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500">No other users online</p>
            </div>
          ) : (
            onlineUsers.map((onlineUser) => (
              <div key={onlineUser.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {onlineUser.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{onlineUser.username}</h4>
                  <div className="flex items-center mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-xs text-green-600">Online</span>
                  </div>
                </div>
                <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <MessageCircle className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Stats */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-5 w-5 text-gray-500" />
              </div>
              <p className="text-lg font-semibold text-gray-900">{onlineUsers.length + 1}</p>
              <p className="text-xs text-gray-600">Total Online</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <MessageCircle className="h-5 w-5 text-gray-500" />
              </div>
              <p className="text-lg font-semibold text-gray-900">Active</p>
              <p className="text-xs text-gray-600">Your Status</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;