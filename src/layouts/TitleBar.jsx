import React, { useState, useEffect } from 'react';
import { X, Music, UserCheck, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TitleBar = () => {
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const navigate = useNavigate();

  // 检查 electron 对象是否可用
  useEffect(() => {
    console.log('Window.electron:', window.electron);
    if (!window.electron) {
      console.warn('Electron API 不可用，窗口控制功能将不起作用');
    } else {
      console.log('Electron API 可用');
    }
  }, []);

  // 处理窗口关闭
  const handleClose = () => {
    console.log('点击了关闭按钮');
    if (window.electron) {
      console.log('调用 electron.closeWindow()');
      try {
        window.electron.closeWindow();
      } catch (error) {
        console.error('关闭窗口时出错:', error);
      }
    } else {
      console.warn('electron 对象不可用，无法关闭窗口');
      window.close();
    }
  };

  // 主题切换
  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
    // 这里可以添加实际的主题切换逻辑
  };

  // 音效切换
  const toggleMute = () => {
    setIsMuted(!isMuted);
    // 这里可以添加实际的音效控制逻辑
  };

  return (
    <div className="bg-slate-800 text-white h-10 flex items-center justify-between select-none drag">
      {/* 应用标题 */}
      <div className="px-3 font-medium text-sm flex items-center">
        <div className="w-5 h-5 mr-2 flex-shrink-0" style={{
          backgroundImage: 'url(/xdllogo.ico)',
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}></div>
        小斗笠直播助手
      </div>

      {/* 拖动区域 - 大部分标题栏区域可用于拖动窗口 */}
      <div className="flex-grow drag"></div>

      {/* 功能按钮 */}
      <div className="flex no-drag">
        {/* 音乐按钮 */}
        <button
          onClick={() => navigate('/app/audio-settings')}
          className="hover:bg-slate-700 focus:outline-none px-3 h-10 flex items-center justify-center"
          title={isMuted ? "打开音效" : "关闭音效"}
        >
          <Music size={18} className={isMuted ? "text-gray-500" : "text-blue-400"} />
        </button>

        {/* 会员按钮 */}
        <button
          onClick={() => navigate('/app/membership')}
          className="hover:bg-slate-700 focus:outline-none px-3 h-10 flex items-center justify-center"
          title="会员中心"
        >
          <UserCheck size={18} className="text-yellow-400" />
        </button>

        {/* 主题切换按钮 */}
        <button
          onClick={toggleTheme}
          className="hover:bg-slate-700 focus:outline-none px-3 h-10 flex items-center justify-center"
          title={isDarkTheme ? "切换到亮色主题" : "切换到暗色主题"}
        >
          {isDarkTheme ?
            <Sun size={18} className="text-yellow-300" /> :
            <Moon size={18} className="text-blue-300" />
          }
        </button>

        {/* 关闭按钮 */}
        <button
          onClick={handleClose}
          className="hover:bg-red-600 focus:outline-none px-4 h-10 flex items-center justify-center"
          title="关闭应用"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default TitleBar;