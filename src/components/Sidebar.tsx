import React from 'react';
import { Hash, MessageCircle, Users } from 'lucide-react';

interface Room {
  id: number;
  name: string;
  description?: string;
  type: 'group' | 'direct';
  member_count: number;
  message_count: number;
  created_by?: number;
}

interface SidebarProps {
  rooms: Room[];
  activeRoom: Room | null;
  onRoomSelect: (room: Room) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ rooms, activeRoom, onRoomSelect }) => {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 py-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Conversations
        </h3>
        <div className="space-y-1">
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => onRoomSelect(room)}
              className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-colors ${
                activeRoom?.id === room.id
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className={`flex-shrink-0 ${
                activeRoom?.id === room.id ? 'text-blue-600' : 'text-gray-400'
              }`}>
                {room.type === 'group' ? (
                  <Hash className="h-5 w-5" />
                ) : (
                  <MessageCircle className="h-5 w-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium truncate">
                    {room.name}
                  </p>
                  {room.message_count > 0 && (
                    <span className="text-xs text-gray-500">
                      {room.message_count}
                    </span>
                  )}
                </div>
                {room.description && (
                  <p className="text-xs text-gray-500 truncate mt-1">
                    {room.description}
                  </p>
                )}
                <div className="flex items-center mt-1 text-xs text-gray-400">
                  <Users className="h-3 w-3 mr-1" />
                  <span>{room.member_count} members</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;