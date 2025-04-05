import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import MainLayout from './layouts/MainLayout';

export default function App() {
  return (
    <Routes>
      {/* 重定向根路径到 /app */}
      <Route path="/" element={<Navigate to="/app" replace />} />
      
      {/* 主应用路由 */}
      <Route path="/app" element={<MainLayout />}>
        <Route index element={<HomePage />} />
      </Route>
    </Routes>
  );
}