import React, { useState, useEffect } from 'react';
import { X, Hash, Users, Search, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Room {
  id: number;
  name: string;
  description?: string;
  type: 'group' | 'direct';
  member_count: number;
  message_count: number;
  created_by?: number;
  created_by_username?: string;
  is_member?: boolean;
}

interface RoomBrowserProps {
  onClose: () => void;
  onJoinRoom: (roomId: number) => void;
}

const RoomBrowser: React.FC<RoomBrowserProps> = ({ onClose, onJoinRoom }) => {
  const { token } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [joiningRooms, setJoiningRooms] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchPublicRooms();
  }, []);

  const fetchPublicRooms = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/rooms/public', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.rooms) {
        setRooms(data.rooms);
      }
    } catch (error) {
      console.error('Failed to fetch public rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (roomId: number) => {
    setJoiningRooms(prev => new Set(prev).add(roomId));
    try {
      await onJoinRoom(roomId);
      // Update the room's membership status
      setRooms(prev => prev.map(room => 
        room.id === roomId 
          ? { ...room, is_member: true, member_count: room.member_count + 1 }
          : room
      ));
    } catch (error) {
      console.error('Failed to join room:', error);
    } finally {
      setJoiningRooms(prev => {
        const newSet = new Set(prev);
        newSet.delete(roomId);
        return newSet;
      });
    }
  };

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Browse Public Rooms
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
              placeholder="Search rooms..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Room List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="text-center py-12">
              <Hash className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No rooms found' : 'No public rooms available'}
              </h4>
              <p className="text-gray-500">
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : 'Be the first to create a public room!'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRooms.map((room) => (
                <div
                  key={room.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <Hash className="h-5 w-5 text-gray-500 flex-shrink-0" />
                        <h4 className="font-semibold text-gray-900 truncate">
                          {room.name}
                        </h4>
                        {room.is_member && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                            Joined
                          </span>
                        )}
                      </div>
                      
                      {room.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {room.description}
                        </p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Users className="h-3 w-3" />
                          <span>{room.member_count} members</span>
                        </div>
                        {room.created_by_username && (
                          <span>Created by {room.created_by_username}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="ml-4 flex-shrink-0">
                      {room.is_member ? (
                        <span className="text-sm text-green-600 font-medium">
                          Already joined
                        </span>
                      ) : (
                        <button
                          onClick={() => handleJoinRoom(room.id)}
                          disabled={joiningRooms.has(room.id)}
                          className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                        >
                          {joiningRooms.has(room.id) ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                              <span>Joining...</span>
                            </>
                          ) : (
                            <>
                              <Plus className="h-3 w-3" />
                              <span>Join</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomBrowser;