// ES模块格式的preload脚本
import { contextBridge, ipcRenderer } from 'electron';

// 暴露API到渲染进程
contextBridge.exposeInMainWorld('electron', {
  // 窗口控制函数
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  // 可以在这里添加更多API...
});