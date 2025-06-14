import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ArrowLeft, Settings, Play, Square, Wifi, WifiOff, Gift, Heart, Users, MessageCircle, Download, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DyCast, CastMethod } from '../core/danmu/dycast.ts';

const DanmuPage = () => {
  const navigate = useNavigate();

  // 连接状态 0-未连接 1-已连接 2-连接失败 3-已断开
  const [connectStatus, setConnectStatus] = useState(0);
  // 房间号
  const [roomNum, setRoomNum] = useState('');
  // 转发地址
  const [relayUrl, setRelayUrl] = useState('');
  // 设置弹窗显示状态
  const [showSettings, setShowSettings] = useState(false);
  // 语音播报设置
  const [voiceBroadcastEnabled, setVoiceBroadcastEnabled] = useState(() => {
    const saved = localStorage.getItem('voiceBroadcastEnabled');
    return saved ? JSON.parse(saved) : false;
  });

  // DyCast 实例
  const dycastRef = useRef(null);

  // 直播间信息
  const [cover, setCover] = useState('');
  const [title, setTitle] = useState('*****');
  const [avatar, setAvatar] = useState('');
  const [nickname, setNickname] = useState('***');
  const [followCount, setFollowCount] = useState('*****');
  const [memberCount, setMemberCount] = useState('*****');
  const [userCount, setUserCount] = useState('*****');
  const [likeCount, setLikeCount] = useState('*****');

  // 弹幕消息列表
  const [chatMessages, setChatMessages] = useState([]);
  const [socialMessages, setSocialMessages] = useState([]);
  const [giftMessages, setGiftMessages] = useState([]);

  // 消息统计
  const [messageStats, setMessageStats] = useState({
    totalMessages: 0,
    chatCount: 0,
    giftCount: 0,
    socialCount: 0
  });

  // 滚动引用
  const chatScrollRef = useRef(null);
  const giftScrollRef = useRef(null);
  const socialScrollRef = useRef(null);

  // 验证房间号
  const verifyRoomNumber = useCallback((value) => {
    const roomNumRegex = /^\d+$/;
    const flag = roomNumRegex.test(value) && value.length > 0;
    if (flag) return { flag, message: '' };
    else {
      return { flag, message: '房间号错误' };
    }
  }, []);

  // 连接房间
  const connectLive = useCallback(async () => {
    const validation = verifyRoomNumber(roomNum);
    if (!validation.flag) {
      alert(validation.message);
      return;
    }

    try {
      setConnectStatus(1);

      // 创建 DyCast 实例
      const dycast = new DyCast(roomNum);
      dycastRef.current = dycast;

      // 监听连接打开
      dycast.on('open', (ev, info) => {
        console.log('弹幕连接已打开', info);
        setConnectStatus(1);

        if (info) {
          setTitle(info.title || '直播间');
          setNickname(info.nickname || '主播');
          setAvatar(info.avatar || '');
          setCover(info.cover || '');
        }
      });

      // 监听弹幕消息
      dycast.on('message', (messages) => {
        console.log('收到弹幕消息', messages);

        messages.forEach(msg => {
          const messageId = Date.now() + Math.random();
          const time = new Date();

          switch (msg.method) {
            case CastMethod.CHAT:
              const chatMsg = {
                id: messageId.toString(),
                user: {
                  name: msg.user?.name || '匿名用户',
                  avatar: msg.user?.avatar || ''
                },
                content: msg.content || '',
                time
              };
              setChatMessages(prev => [...prev, chatMsg]);
              setMessageStats(prev => ({
                ...prev,
                chatCount: prev.chatCount + 1,
                totalMessages: prev.totalMessages + 1
              }));
              break;

            case CastMethod.GIFT:
              const giftMsg = {
                id: messageId.toString(),
                user: {
                  name: msg.user?.name || '匿名用户',
                  avatar: msg.user?.avatar || ''
                },
                gift: {
                  name: msg.gift?.name || '礼物',
                  count: msg.gift?.count || 1,
                  price: msg.gift?.price || 0
                },
                time
              };
              setGiftMessages(prev => [...prev, giftMsg]);
              setMessageStats(prev => ({
                ...prev,
                giftCount: prev.giftCount + 1,
                totalMessages: prev.totalMessages + 1
              }));
              break;

            case CastMethod.MEMBER:
            case CastMethod.SOCIAL:
            case CastMethod.LIKE:
              const socialMsg = {
                id: messageId.toString(),
                user: {
                  name: msg.user?.name || '匿名用户',
                  avatar: msg.user?.avatar || ''
                },
                content: msg.method === CastMethod.MEMBER ? '进入直播间' :
                        msg.method === CastMethod.SOCIAL ? '关注了主播' :
                        '为主播点赞',
                type: msg.method === CastMethod.MEMBER ? 'member' :
                      msg.method === CastMethod.SOCIAL ? 'follow' : 'like',
                time
              };
              setSocialMessages(prev => [...prev, socialMsg]);
              setMessageStats(prev => ({
                ...prev,
                socialCount: prev.socialCount + 1,
                totalMessages: prev.totalMessages + 1
              }));
              break;
          }

          // 更新直播间统计信息
          if (msg.room) {
            if (msg.room.audienceCount) setMemberCount(msg.room.audienceCount.toString());
            if (msg.room.likeCount) setLikeCount(msg.room.likeCount.toString());
            if (msg.room.followCount) setFollowCount(msg.room.followCount.toString());
            if (msg.room.totalUserCount) setUserCount(msg.room.totalUserCount.toString());
          }
        });
      });

      // 监听连接关闭
      dycast.on('close', (code, reason) => {
        console.log('弹幕连接已关闭', code, reason);
        setConnectStatus(3);
      });

      // 监听错误
      dycast.on('error', (error) => {
        console.error('弹幕连接错误', error);
        setConnectStatus(2);
        alert('连接失败: ' + error.message);
      });

      // 开始连接
      await dycast.connect();

    } catch (err) {
      console.error('连接失败:', err);
      setConnectStatus(2);
      alert('连接失败: ' + err.message);
    }
  }, [roomNum, verifyRoomNumber]);

  // 断开连接
  const disconnectLive = useCallback(() => {
    if (dycastRef.current) {
      dycastRef.current.close();
      dycastRef.current = null;
    }
    setConnectStatus(3);
    setTitle('*****');
    setNickname('***');
    setFollowCount('*****');
    setMemberCount('*****');
    setUserCount('*****');
    setLikeCount('*****');
  }, []);

  // 清空消息
  const clearMessages = useCallback(() => {
    setChatMessages([]);
    setSocialMessages([]);
    setGiftMessages([]);
    setMessageStats({
      totalMessages: 0,
      chatCount: 0,
      giftCount: 0,
      socialCount: 0
    });
  }, []);

  // 保存弹幕到文件
  const saveMessages = useCallback(() => {
    const allMessages = {
      chatMessages,
      socialMessages,
      giftMessages,
      stats: messageStats,
      roomInfo: {
        roomNum,
        title,
        nickname,
        followCount,
        memberCount,
        userCount,
        likeCount
      },
      exportTime: new Date().toISOString()
    };

    const dataStr = JSON.stringify(allMessages, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `弹幕数据_${roomNum}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [chatMessages, socialMessages, giftMessages, messageStats, roomNum, title, nickname, followCount, memberCount, userCount, likeCount]);

  // 处理语音播报设置变化
  const handleVoiceBroadcastChange = useCallback((enabled) => {
    setVoiceBroadcastEnabled(enabled);
    localStorage.setItem('voiceBroadcastEnabled', JSON.stringify(enabled));
  }, []);

  // 组件卸载时清理连接
  useEffect(() => {
    return () => {
      if (dycastRef.current) {
        dycastRef.current.close();
      }
    };
  }, []);

  // 自动滚动到底部
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  useEffect(() => {
    if (giftScrollRef.current) {
      giftScrollRef.current.scrollTop = giftScrollRef.current.scrollHeight;
    }
  }, [giftMessages]);

  useEffect(() => {
    if (socialScrollRef.current) {
      socialScrollRef.current.scrollTop = socialScrollRef.current.scrollHeight;
    }
  }, [socialMessages]);

  // 获取连接状态显示
  const getStatusDisplay = () => {
    switch (connectStatus) {
      case 0: return { text: '未连接', color: 'text-gray-400', icon: WifiOff };
      case 1: return { text: '已连接', color: 'text-green-400', icon: Wifi };
      case 2: return { text: '连接失败', color: 'text-red-400', icon: WifiOff };
      case 3: return { text: '已断开', color: 'text-yellow-400', icon: WifiOff };
      default: return { text: '未知', color: 'text-gray-400', icon: WifiOff };
    }
  };

  const statusDisplay = getStatusDisplay();
  const StatusIcon = statusDisplay.icon;

  return (
    <div className="min-h-full bg-gray-900 text-white p-4 flex flex-col h-full">
      {/* 顶部导航栏 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/app')}
            className="flex items-center text-gray-300 hover:text-white transition-colors mr-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            返回主页
          </button>
          <h1 className="text-xl font-bold">弹幕助手</h1>
          <div className="ml-4 flex items-center space-x-4 text-sm">
            <div className="flex items-center text-blue-400">
              <MessageCircle size={16} className="mr-1" />
              聊天: {messageStats.chatCount}
            </div>
            <div className="flex items-center text-pink-400">
              <Gift size={16} className="mr-1" />
              礼物: {messageStats.giftCount}
            </div>
            <div className="flex items-center text-green-400">
              <Users size={16} className="mr-1" />
              社交: {messageStats.socialCount}
            </div>
            <div className="flex items-center text-yellow-400">
              总计: {messageStats.totalMessages}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={saveMessages}
            disabled={messageStats.totalMessages === 0}
            className="p-2 text-gray-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="保存弹幕数据"
          >
            <Download size={20} />
          </button>
          <button
            onClick={clearMessages}
            disabled={messageStats.totalMessages === 0}
            className="p-2 text-gray-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="清空弹幕"
          >
            <Trash2 size={20} />
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 text-gray-300 hover:text-white transition-colors"
            title="设置"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 grid grid-cols-12 gap-4">
        {/* 左侧：直播间信息和控制 */}
        <div className="col-span-3 space-y-4">
          {/* 直播间信息卡片 */}
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-gray-600 rounded-full mx-auto mb-2 flex items-center justify-center">
                {avatar ? (
                  <img src={avatar} alt="头像" className="w-full h-full rounded-full" />
                ) : (
                  <span className="text-gray-400">头像</span>
                )}
              </div>
              <h3 className="font-medium">{nickname}</h3>
              <p className="text-sm text-gray-400 truncate">{title}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-center">
                <div className="text-gray-400">关注</div>
                <div className="font-medium">{followCount}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400">观众</div>
                <div className="font-medium">{memberCount}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400">总观看</div>
                <div className="font-medium">{userCount}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400">点赞</div>
                <div className="font-medium">{likeCount}</div>
              </div>
            </div>
          </div>

          {/* 连接控制 */}
          <div className="bg-slate-800 rounded-lg p-4 space-y-3">
            <div>
              <label className="block text-sm font-medium mb-2">房间号</label>
              <input
                type="text"
                value={roomNum}
                onChange={(e) => setRoomNum(e.target.value)}
                placeholder="请输入房间号"
                className="w-full bg-slate-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex space-x-2">
              {connectStatus === 1 ? (
                <button
                  onClick={disconnectLive}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors flex items-center justify-center"
                >
                  <Square size={16} className="mr-2" />
                  断开
                </button>
              ) : (
                <button
                  onClick={connectLive}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors flex items-center justify-center"
                >
                  <Play size={16} className="mr-2" />
                  连接
                </button>
              )}
            </div>
            
            <div className={`flex items-center text-sm ${statusDisplay.color}`}>
              <StatusIcon size={16} className="mr-2" />
              {statusDisplay.text}
            </div>
          </div>
        </div>

        {/* 中间：弹幕区域 */}
        <div className="col-span-6 space-y-4">
          {/* 聊天弹幕 */}
          <div className="bg-slate-800 rounded-lg p-4 h-64 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium flex items-center">
                <MessageCircle size={18} className="mr-2 text-blue-400" />
                聊天弹幕
              </h3>
              <span className="text-sm text-gray-400">{chatMessages.length} 条</span>
            </div>
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto space-y-2">
              {chatMessages.map((msg) => (
                <div key={msg.id} className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex-shrink-0 flex items-center justify-center text-xs">
                    {msg.user.name[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-blue-400 text-sm font-medium">{msg.user.name}</span>
                      <span className="text-gray-500 text-xs">
                        {msg.time.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-white">{msg.content}</div>
                  </div>
                </div>
              ))}
              {chatMessages.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  暂无聊天消息
                </div>
              )}
            </div>
          </div>

          {/* 礼物弹幕 */}
          <div className="bg-slate-800 rounded-lg p-4 h-48 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium flex items-center">
                <Gift size={18} className="mr-2 text-pink-400" />
                礼物弹幕
              </h3>
              <span className="text-sm text-gray-400">{giftMessages.length} 条</span>
            </div>
            <div ref={giftScrollRef} className="flex-1 overflow-y-auto space-y-2">
              {giftMessages.map((msg) => (
                <div key={msg.id} className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-pink-500 rounded-full flex-shrink-0 flex items-center justify-center text-xs">
                    <Gift size={12} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-pink-400 text-sm font-medium">{msg.user.name}</span>
                      <span className="text-gray-500 text-xs">
                        {msg.time.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-white">
                      送出了 <span className="text-pink-300">{msg.gift.name}</span> x{msg.gift.count}
                      <span className="text-yellow-400 ml-2">({msg.gift.price} 抖币)</span>
                    </div>
                  </div>
                </div>
              ))}
              {giftMessages.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  暂无礼物消息
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 右侧：社交信息 */}
        <div className="col-span-3">
          <div className="bg-slate-800 rounded-lg p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium flex items-center">
                <Users size={18} className="mr-2 text-green-400" />
                社交信息
              </h3>
              <span className="text-sm text-gray-400">{socialMessages.length} 条</span>
            </div>
            <div ref={socialScrollRef} className="flex-1 overflow-y-auto space-y-2">
              {socialMessages.map((msg) => (
                <div key={msg.id} className="text-sm border-l-2 border-green-500 pl-3 py-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 flex-shrink-0">
                      {msg.type === 'member' && <Users size={14} className="text-blue-400" />}
                      {msg.type === 'follow' && <Heart size={14} className="text-red-400" />}
                      {msg.type === 'like' && <Heart size={14} className="text-pink-400" />}
                    </div>
                    <span className="text-green-400 font-medium">{msg.user.name}</span>
                  </div>
                  <div className="text-gray-300 mt-1">{msg.content}</div>
                  <div className="text-gray-500 text-xs mt-1">
                    {msg.time.toLocaleTimeString()}
                  </div>
                </div>
              ))}
              {socialMessages.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  暂无社交消息
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 设置弹窗 */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium mb-4">弹幕设置</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">语音播报</label>
                <input
                  type="checkbox"
                  checked={voiceBroadcastEnabled}
                  onChange={(e) => handleVoiceBroadcastChange(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>

              <div className="border-t border-gray-600 pt-4">
                <h4 className="text-sm font-medium mb-2">转发设置</h4>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">WebSocket 转发地址</label>
                  <input
                    type="text"
                    value={relayUrl}
                    onChange={(e) => setRelayUrl(e.target.value)}
                    placeholder="ws://localhost:8765"
                    className="w-full bg-slate-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    可选：设置后将实时转发弹幕数据到指定的 WebSocket 服务器
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-600 pt-4">
                <h4 className="text-sm font-medium mb-2">关于</h4>
                <div className="text-sm text-gray-400 space-y-1">
                  <p>弹幕助手 v1.0.0</p>
                  <p>基于 DyCast 项目集成</p>
                  <p>支持抖音直播弹幕获取与转发</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowSettings(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DanmuPage;
