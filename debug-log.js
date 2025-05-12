// 在 HomePage.jsx 中添加以下代码来增强日志输出

// 在 console.log('===== 获取推流信息成功，开始维持直播状态... ====='); 之后添加：
console.log('推流地址:', result.streamUrl);
console.log('房间ID:', result.room_id);
console.log('流ID:', result.stream_id);
console.log('直播方式:', streamMethod);

// 在 if (streamMethod === '手机开播' && result.room_id && result.stream_id) { 之前添加：
console.log('检查条件:', 'streamMethod =', streamMethod, 'room_id =', result.room_id ? '存在' : '不存在', 'stream_id =', result.stream_id ? '存在' : '不存在');

// 在 maintainDouyinStream 调用之前添加：
console.log('准备调用 maintainDouyinStream 函数，参数:', {
  room_id: result.room_id,
  stream_id: result.stream_id,
  mode: 'phone'
});

// 在 maintainResult 返回后添加：
console.log('maintainDouyinStream 返回结果:', maintainResult);

// 在 catch 块中添加：
console.error('启动直播状态维持时出错，详细信息:', error);
console.error('错误堆栈:', error.stack);
