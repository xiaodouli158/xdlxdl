import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function TutorialsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  // 模拟教程数据
  const tutorials = [
    { 
      id: 1, 
      title: 'OBS直播设置入门指南', 
      category: 'obs',
      duration: '15:30',
      views: '8.9万',
      thumbnail: '/path/to/tutorial1.jpg', 
      author: '直播大师',
      date: '2023-12-05'
    },
    { 
      id: 2, 
      title: '如何提高直播画面质量', 
      category: 'quality',
      duration: '22:45',
      views: '5.3万',
      thumbnail: '/path/to/tutorial2.jpg', 
      author: '画质专家',
      date: '2024-01-15'
    },
    { 
      id: 3, 
      title: '直播互动技巧与话术', 
      category: 'skills',
      duration: '18:20',
      views: '12.1万',
      thumbnail: '/path/to/tutorial3.jpg', 
      author: '主播学院',
      date: '2024-02-08'
    },
    { 
      id: 4, 
      title: '用OBS制作高级转场效果', 
      category: 'obs',
      duration: '29:15',
      views: '6.7万',
      thumbnail: '/path/to/tutorial4.jpg', 
      author: '特效大师',
      date: '2024-02-22'
    },
    { 
      id: 5, 
      title: '直播设备选购指南', 
      category: 'equipment',
      duration: '35:10',
      views: '9.4万',
      thumbnail: '/path/to/tutorial5.jpg', 
      author: '设备评测师',
      date: '2024-03-01'
    },
    { 
      id: 6, 
      title: '如何优化直播声音效果', 
      category: 'audio',
      duration: '20:05',
      views: '4.8万',
      thumbnail: '/path/to/tutorial6.jpg', 
      author: '音频工程师',
      date: '2024-03-15'
    }
  ];

  // 定义教程分类
  const categories = [
    { id: 'all', name: '全部' },
    { id: 'obs', name: 'OBS教程' },
    { id: 'quality', name: '画质优化' },
    { id: 'skills', name: '主播技巧' },
    { id: 'equipment', name: '设备教程' },
    { id: 'audio', name: '音频教程' }
  ];

  // 根据选择的分类筛选教程
  const filteredTutorials = selectedCategory === 'all' 
    ? tutorials 
    : tutorials.filter(tutorial => tutorial.category === selectedCategory);

  return (
    <div className="min-h-full bg-gray-900 text-white p-2 flex flex-col h-full gap-2">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-indigo-400">直播教程</h1>
        <Link to="/app" className="text-indigo-400 hover:text-indigo-300 text-sm">返回首页</Link>
      </div>
      
      {/* 分类选择 */}
      <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
        {categories.map(category => (
          <button
            key={category.id}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              selectedCategory === category.id 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
            onClick={() => setSelectedCategory(category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>
      
      {/* 教程列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTutorials.map(tutorial => (
          <div 
            key={tutorial.id} 
            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-indigo-900/30 shadow-lg overflow-hidden hover:border-indigo-700/50 transition-colors"
          >
            <div className="relative">
              <div className="h-40 bg-gray-800 flex items-center justify-center">
                {/* 缩略图占位符 */}
                <div className="text-gray-600 text-sm">[教程缩略图]</div>
              </div>
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                {tutorial.duration}
              </div>
            </div>
            <div className="p-3">
              <h2 className="text-lg font-semibold text-indigo-300 mb-1">{tutorial.title}</h2>
              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span>{tutorial.author}</span>
                <span>{tutorial.views}次观看</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">{tutorial.date}</span>
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-xs transition-colors">
                  观看教程
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TutorialsPage; 