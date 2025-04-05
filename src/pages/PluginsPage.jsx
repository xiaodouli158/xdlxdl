import React from 'react';
import { Link } from 'react-router-dom';

function PluginsPage() {
  // 模拟插件数据
  const plugins = [
    { id: 1, name: 'OBS Studio', description: '开源的视频录制和直播软件', version: '30.0.2' },
    { id: 2, name: '变声器', description: '实时语音变声效果', version: '2.1.0' },
    { id: 3, name: '场景切换器', description: '快速切换直播场景', version: '1.5.3' },
    { id: 4, name: '特效滤镜', description: '添加视频特效和滤镜', version: '3.2.1' },
    { id: 5, name: '弹幕助手', description: '弹幕管理和互动工具', version: '2.0.5' },
    { id: 6, name: '直播计时器', description: '显示直播时长和提醒', version: '1.1.0' },
  ];

  return (
    <div className="min-h-full bg-gray-900 text-white p-2 flex flex-col h-full gap-2">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-indigo-400">插件中心</h1>
        <Link to="/app" className="text-indigo-400 hover:text-indigo-300 text-sm">返回首页</Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plugins.map(plugin => (
          <div 
            key={plugin.id} 
            className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-lg border border-indigo-900/30 shadow-lg hover:border-indigo-700/50 transition-colors"
          >
            <h2 className="text-lg font-semibold mb-1 text-indigo-300">{plugin.name}</h2>
            <div className="text-xs text-indigo-400 mb-3">v{plugin.version}</div>
            <p className="text-sm text-gray-300 mb-4">{plugin.description}</p>
            <div className="flex justify-between">
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-sm transition-colors">
                下载
              </button>
              <button className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm transition-colors">
                查看详情
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PluginsPage; 