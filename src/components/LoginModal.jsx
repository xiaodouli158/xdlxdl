import React from 'react';
import { X } from 'lucide-react';

/**
 * Modal component for platform login selection
 * 
 * @param {Object} props Component props
 * @param {boolean} props.isOpen Whether the modal is open
 * @param {Function} props.onClose Function to call when modal is closed
 * @param {Function} props.onWebLogin Function to call when web login is selected
 * @param {Function} props.onCompanionLogin Function to call when companion login is selected
 * @returns {JSX.Element|null} Modal component or null if not open
 */
const LoginModal = ({ isOpen, onClose, onWebLogin, onCompanionLogin }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 w-80 border border-slate-700 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-blue-300">选择登录方式</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white rounded-full p-1 hover:bg-gray-700"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={onWebLogin}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
          >
            抖音网页登录
          </button>
          
          <button
            onClick={onCompanionLogin}
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition-colors"
          >
            抖音直播伴侣
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
