import React from 'react';
import { Outlet } from 'react-router-dom';
import TitleBar from './TitleBar';

const MainLayout = () => {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* 自定义标题栏 */}
      <TitleBar />
      
      {/* 主内容区域 */}
      <div className="flex-1 overflow-auto bg-slate-900">
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;
