import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Play } from 'lucide-react';

function TutorialsPage() {
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState('');

  // 教程数据 - 包含抖音视频ID和封面图片
  const tutorials = [
    {
      id: 1,
      title: 'OBS直播设置入门指南',
      duration: '15:30',
      views: '8.9万',
      coverImage: 'https://p3-pc.douyinpic.com/img/tos-cn-p-0000/o0AQBgAIEfABDgAeEgAhEfABDgAeEgAhEfABDgAeEgAh~c5_300x400.jpeg',
      author: '直播大师',
      date: '2023-12-05',
      videoId: '7475781431025798411',
      description: '从零开始学习OBS直播软件的基础设置，包括场景配置、音频设置、推流参数等核心功能。'
    },
    {
      id: 2,
      title: '如何提高直播画面质量',
      duration: '22:45',
      views: '5.3万',
      coverImage: 'https://p3-pc.douyinpic.com/img/tos-cn-p-0000/o0AQBgAIEfABDgAeEgAhEfABDgAeEgAhEfABDgAeEgAh~c5_300x400.jpeg',
      author: '画质专家',
      date: '2024-01-15',
      videoId: '7475781431025798411',
      description: '详细讲解直播画面优化技巧，包括分辨率设置、码率调整、滤镜使用等专业方法。'
    },
    {
      id: 3,
      title: '直播互动技巧与话术',
      duration: '18:20',
      views: '12.1万',
      coverImage: 'https://p3-pc.douyinpic.com/img/tos-cn-p-0000/o0AQBgAIEfABDgAeEgAhEfABDgAeEgAhEfABDgAeEgAh~c5_300x400.jpeg',
      author: '主播学院',
      date: '2024-02-08',
      videoId: '7234567890123456791',
      description: '学习如何与观众有效互动，掌握直播话术技巧，提升直播间活跃度和粉丝粘性。'
    },
    {
      id: 4,
      title: '用OBS制作高级转场效果',
      duration: '29:15',
      views: '6.7万',
      coverImage: 'https://p3-pc.douyinpic.com/img/tos-cn-p-0000/o0AQBgAIEfABDgAeEgAhEfABDgAeEgAhEfABDgAeEgAh~c5_300x400.jpeg',
      author: '特效大师',
      date: '2024-02-22',
      videoId: '7234567890123456792',
      description: '深入学习OBS高级功能，制作专业的场景转场效果，让你的直播更具视觉冲击力。'
    },
    {
      id: 5,
      title: '直播设备选购指南',
      duration: '35:10',
      views: '9.4万',
      coverImage: 'https://p3-pc.douyinpic.com/img/tos-cn-p-0000/o0AQBgAIEfABDgAeEgAhEfABDgAeEgAhEfABDgAeEgAh~c5_300x400.jpeg',
      author: '设备评测师',
      date: '2024-03-01',
      videoId: '7234567890123456793',
      description: '全面解析直播设备选购要点，包括摄像头、麦克风、灯光等设备的选择和搭配建议。'
    },
    {
      id: 6,
      title: '如何优化直播声音效果',
      duration: '20:05',
      views: '4.8万',
      coverImage: 'https://p3-pc.douyinpic.com/img/tos-cn-p-0000/o0AQBgAIEfABDgAeEgAhEfABDgAeEgAhEfABDgAeEgAh~c5_300x400.jpeg',
      author: '音频工程师',
      date: '2024-03-15',
      videoId: '7234567890123456794',
      description: '专业音频调试教程，学习如何设置音频参数、降噪处理、音效添加等技巧。'
    }
  ];

  // 处理视频点击事件
  const handleVideoClick = (videoId) => {
    setCurrentVideoId(videoId);
    setShowVideoModal(true);
  };

  // 关闭视频弹窗
  const closeVideoModal = () => {
    setShowVideoModal(false);
    setCurrentVideoId('');
  };

  // 抖音视频播放弹窗组件
  const VideoModal = ({ isOpen, videoId, onClose }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
        <div className="relative w-full max-w-6xl h-full max-h-[95vh] bg-gray-900 rounded-lg overflow-hidden flex flex-col">
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={onClose}
              className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full transition-colors shadow-lg"
            >
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 min-h-0">
            <iframe
              src={`https://open.douyin.com/player/video?vid=${videoId}&autoplay=0`}
              className="w-full h-full border-0"
              allowFullScreen
              title="抖音视频播放器"
              style={{ minHeight: '500px' }}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-full bg-gray-900 text-white p-2 flex flex-col h-full gap-2">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-indigo-400">直播教程</h1>
        <Link to="/app" className="text-indigo-400 hover:text-indigo-300 text-sm">返回首页</Link>
      </div>

      {/* 教程列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tutorials.map(tutorial => (
          <div
            key={tutorial.id}
            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-indigo-900/30 shadow-lg overflow-hidden hover:border-indigo-700/50 transition-colors"
          >
            <div className="relative cursor-pointer" onClick={() => handleVideoClick(tutorial.videoId)}>
              <div className="h-40 bg-gray-800 overflow-hidden">
                <img
                  src={tutorial.coverImage}
                  alt={tutorial.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzc0MTUxIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzlDQTNBRiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuinhumikeWwgemdouWbvjwvdGV4dD48L3N2Zz4=';
                  }}
                />
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 flex items-center justify-center transition-all duration-300">
                <div className="opacity-0 hover:opacity-100 transition-opacity duration-300">
                  <Play size={48} className="text-white drop-shadow-lg" />
                </div>
              </div>
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                {tutorial.duration}
              </div>
            </div>
            <div className="p-3">
              <h2 className="text-lg font-semibold text-indigo-300 mb-1">{tutorial.title}</h2>
              <p className="text-sm text-gray-400 mb-2 line-clamp-2">{tutorial.description}</p>
              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span>{tutorial.author}</span>
                <span>{tutorial.views}次观看</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">{tutorial.date}</span>
                <button
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-xs transition-colors"
                  onClick={() => handleVideoClick(tutorial.videoId)}
                >
                  观看教程
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 视频播放弹窗 */}
      <VideoModal
        isOpen={showVideoModal}
        videoId={currentVideoId}
        onClose={closeVideoModal}
      />
    </div>
  );
}

export default TutorialsPage;
