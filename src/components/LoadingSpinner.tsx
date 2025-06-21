import React from 'react';
import { MessageCircle } from 'lucide-react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
          <MessageCircle className="h-8 w-8 text-blue-600" />
        </div>
        <div className="absolute inset-0 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-1">
          Loading Chat
        </h3>
        <p className="text-gray-500">
          Connecting to the server...
        </p>
      </div>
    </div>
  );
};

export default LoadingSpinner;