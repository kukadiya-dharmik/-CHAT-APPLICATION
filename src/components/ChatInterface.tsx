import React, { useState, useEffect } from 'react';
import { LogOut, Plus, Search, Users, Hash, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import UserProfile from './UserProfile';
import RoomBrowser from './RoomBrowser';
import UserSearch from './UserSearch';

interface Room {
  id: number;
  name: string;
  description?: string;
  type: 'group' | 'direct';
  member_count: number;
  message_count: number;
  created_by?: number;
}

const ChatInterface: React.FC = () => {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showRoomBrowser, setShowRoomBrowser] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('chat_token');
      const response = await fetch('http://localhost:3001/api/users/rooms', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch rooms');
      }
      
      const data = await response.json();
      if (data.rooms) {
        setRooms(data.rooms);
        if (data.rooms.length > 0 && !activeRoom) {
          setActiveRoom(data.rooms[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (name: string, description: string) => {
    try {
      const token = localStorage.getItem('chat_token');
      const response = await fetch('http://localhost:3001/api/users/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name, description, type: 'group' }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create room');
      }
      
      const data = await response.json();
      if (data.room) {
        setRooms(prev => [data.room, ...prev]);
        setActiveRoom(data.room);
        setShowCreateRoom(false);
      }
    } catch (error) {
      console.error('Failed to create room:', error);
      alert('Failed to create room. Please try again.');
    }
  };

  const handleJoinRoom = async (roomId: number) => {
    try {
      const token = localStorage.getItem('chat_token');
      const response = await fetch(`http://localhost:3001/api/users/rooms/${roomId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to join room');
      }
      
      await fetchRooms(); // Refresh rooms list
      setShowRoomBrowser(false);
    } catch (error) {
      console.error('Failed to join room:', error);
      alert('Failed to join room. Please try again.');
    }
  };

  const handleStartDirectChat = async (targetUserId: number, targetUsername: string) => {
    try {
      const token = localStorage.getItem('chat_token');
      const response = await fetch('http://localhost:3001/api/users/direct-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ targetUserId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to start direct chat');
      }
      
      const data = await response.json();
      if (data.room) {
        setRooms(prev => {
          const exists = prev.find(r => r.id === data.room.id);
          if (!exists) {
            return [data.room, ...prev];
          }
          return prev;
        });
        setActiveRoom(data.room);
        setShowUserSearch(false);
      }
    } catch (error) {
      console.error('Failed to start direct chat:', error);
      alert('Failed to start direct chat. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-white items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">{user?.username}</h2>
                <p className="text-sm text-green-600">Online</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowProfile(true)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="View online users"
              >
                <Users className="h-5 w-5" />
              </button>
              <button
                onClick={logout}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              onClick={() => setShowCreateRoom(true)}
              className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Create Room</span>
            </button>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowRoomBrowser(true)}
                className="flex items-center justify-center space-x-2 bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <Hash className="h-4 w-4" />
                <span>Join Room</span>
              </button>
              
              <button
                onClick={() => setShowUserSearch(true)}
                className="flex items-center justify-center space-x-2 bg-purple-600 text-white py-2 px-3 rounded-lg hover:bg-purple-700 transition-colors text-sm"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Direct Chat</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Room List */}
        <Sidebar
          rooms={rooms}
          activeRoom={activeRoom}
          onRoomSelect={setActiveRoom}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeRoom ? (
          <ChatWindow room={activeRoom} />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Welcome to Chat!
              </h3>
              <p className="text-gray-600 mb-6">
                Start a conversation by creating a room, joining an existing one, or starting a direct chat with someone.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => setShowCreateRoom(true)}
                  className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create New Room
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setShowRoomBrowser(true)}
                    className="bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    Browse Rooms
                  </button>
                  <button
                    onClick={() => setShowUserSearch(true)}
                    className="bg-purple-600 text-white py-2 px-3 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                  >
                    Find Users
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateRoom && (
        <CreateRoomModal
          onClose={() => setShowCreateRoom(false)}
          onCreate={handleCreateRoom}
        />
      )}

      {showRoomBrowser && (
        <RoomBrowser
          onClose={() => setShowRoomBrowser(false)}
          onJoinRoom={handleJoinRoom}
        />
      )}

      {showUserSearch && (
        <UserSearch
          onClose={() => setShowUserSearch(false)}
          onStartChat={handleStartDirectChat}
        />
      )}

      {showProfile && (
        <UserProfile onClose={() => setShowProfile(false)} />
      )}
    </div>
  );
};

// Create Room Modal Component
interface CreateRoomModalProps {
  onClose: () => void;
  onCreate: (name: string, description: string) => void;
}

const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && !loading) {
      setLoading(true);
      try {
        await onCreate(name.trim(), description.trim());
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Create New Chat Room
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Room Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter room name"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={3}
              placeholder="Enter room description"
              disabled={loading}
            />
          </div>
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={!name.trim() || loading}
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;