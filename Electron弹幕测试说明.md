# Electron 弹幕测试说明

## 🔧 修复内容

为了解决 Electron 环境中弹幕连接失败的问题，我们进行了以下修复：

### ⚠️ 关键问题
原始问题：环境检测逻辑不准确，导致在 Electron 环境中仍然尝试连接本地代理服务器而不是直接连接抖音服务器。

### 🎯 核心修复

### 1. Electron 安全策略配置
在 `electron/main.js` 中添加了以下配置：

```javascript
webPreferences: {
  nodeIntegration: false,
  contextIsolation: true,
  preload: path.join(__dirname, 'preload.js'),
  webSecurity: false, // 禁用网络安全策略以允许跨域请求
  allowRunningInsecureContent: true, // 允许运行不安全内容
}
```

### 2. 会话权限配置
添加了会话配置来处理网络请求：

```javascript
// 设置权限处理
ses.setPermissionRequestHandler((webContents, permission, callback) => {
  callback(true); // 允许所有权限请求
});

// 设置证书验证处理
ses.setCertificateVerifyProc((request, callback) => {
  callback(0); // 信任所有证书
});

// 修改请求头以避免CORS问题
ses.webRequest.onBeforeSendHeaders((details, callback) => {
  // 为抖音请求添加必要的请求头
});

// 处理响应头以允许跨域
ses.webRequest.onHeadersReceived((details, callback) => {
  // 添加CORS响应头
});
```

### 3. 环境检测逻辑改进（重要修复）
修改了 `src/core/danmu/dycast.ts` 和 `src/core/danmu/request.ts`：

```javascript
// 多重检测方法确保准确识别 Electron 环境
// 方法1：检查 window.process
const hasElectronProcess = typeof window !== 'undefined' &&
  window.process &&
  window.process.type &&
  (window.process.type === 'renderer' || window.process.type === 'worker');

// 方法2：检查 User Agent
const hasElectronUA = typeof navigator !== 'undefined' &&
  navigator.userAgent &&
  navigator.userAgent.includes('Electron');

// 方法3：检查 window.electronAPI（如果有的话）
const hasElectronAPI = typeof window !== 'undefined' &&
  window.electronAPI !== undefined;

// 综合判断
const isElectron = hasElectronProcess || hasElectronUA || hasElectronAPI;

// 根据环境选择不同的 API 地址
const BASE_URL = isElectron
  ? 'wss://webcast5-ws-web-lf.douyin.com/webcast/im/push/v2/'
  : 构建正确的本地WebSocket地址;
```

### 4. mssdk.js 注入
在 `electron/preload.js` 中添加了 mssdk.js 的自动注入：

```javascript
// 在 DOM 加载完成后注入 mssdk.js
window.addEventListener('DOMContentLoaded', () => {
  // 读取并注入 mssdk.js 文件
});
```

## 🧪 测试步骤

### 1. 浏览器环境测试
```bash
# 启动开发服务器
npm run dev

# 访问 http://localhost:5173
# 点击"打开弹幕"按钮测试
```

### 2. Electron 环境测试
```bash
# 安装依赖
npm install

# 启动 Electron 开发环境（推荐）
npm run electron:dev

# 或者构建后启动生产环境
npm run build
npm run electron:build
```

### 3. 测试弹幕连接
1. 在应用中点击"打开弹幕"按钮
2. 输入一个正在直播的抖音房间号（如：12297819928）
3. 点击"连接"按钮
4. 观察连接状态和弹幕消息

### 4. 验证修复效果
检查以下项目：
- ✅ 连接状态应该显示为"已连接"
- ✅ 应该能看到实时弹幕消息
- ✅ 不再出现"连接失败: error"的错误
- ✅ 控制台中应该有成功的连接日志
- ✅ 浏览器和 Electron 环境都能正常工作

## 🔍 故障排除

### 如果仍然连接失败：

1. **检查开发者工具**：
   - 在浏览器中按 F12 打开开发者工具
   - 在 Electron 中按 F12 打开开发者工具
   - 查看 Console 标签页的错误信息和环境检测日志
   - 查看 Network 标签页的网络请求状态

2. **验证环境检测**：
   - 在控制台查看 "Environment detection" 日志
   - 确认 "Using BASE_URL" 显示正确的地址
   - 浏览器应该显示 `ws://localhost:5173/socket/...`
   - Electron 应该显示 `wss://webcast5-ws-web-lf.douyin.com/...`

3. **检查网络连接**：
   - 确保网络连接正常
   - 尝试在浏览器中访问 `https://live.douyin.com`
   - 检查防火墙是否阻止了 WebSocket 连接

4. **检查房间号**：
   - 确保输入的是正确的数字房间号
   - 确保目标直播间正在直播中
   - 可以先在抖音 APP 中确认直播间状态

5. **重启应用**：
   - 完全关闭应用
   - 重新运行 `npm run dev` 或 `npm run electron`

### 常见错误及解决方案：

1. **"mssdk.js not found"**：
   - 确保 `public/mssdk.js` 文件存在
   - 重新构建应用：`npm run build`

2. **"WebSocket connection failed"**：
   - 检查防火墙设置
   - 确保没有代理软件干扰

3. **"Certificate error"**：
   - 已通过 `setCertificateVerifyProc` 修复
   - 如果仍有问题，检查系统时间是否正确

## 📊 预期结果

修复后的 Electron 应用应该能够：
- ✅ 成功连接抖音直播间
- ✅ 实时接收和显示弹幕消息
- ✅ 正确处理各种消息类型（聊天、礼物、社交）
- ✅ 稳定运行不会频繁断线
- ✅ 与浏览器版本功能一致

## 🎯 技术原理

### 为什么浏览器可以而 Electron 不行？

1. **安全策略差异**：
   - 浏览器有同源策略但可以通过代理绕过
   - Electron 默认有更严格的安全策略

2. **网络请求处理**：
   - 浏览器可以使用 Vite 代理
   - Electron 需要直接访问外部 API

3. **证书验证**：
   - 浏览器对证书验证相对宽松
   - Electron 默认严格验证证书

4. **CORS 策略**：
   - 浏览器可以通过代理避免 CORS
   - Electron 需要手动处理 CORS 头

### 修复方案的核心思路：

1. **禁用严格的安全策略**：允许跨域请求和不安全内容
2. **直接连接外部 API**：绕过代理直接访问抖音服务器
3. **手动处理网络请求**：添加必要的请求头和响应头
4. **环境检测**：根据运行环境选择不同的连接方式

这样就能确保弹幕功能在 Electron 环境中正常工作！
