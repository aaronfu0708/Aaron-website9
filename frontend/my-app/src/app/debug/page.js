'use client';

export default function DebugPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>前端調試頁面</h1>
      
      <h2>環境變數檢查</h2>
      <div style={{ background: '#f5f5f5', padding: '10px', borderRadius: '5px', margin: '10px 0' }}>
        <p><strong>NEXT_PUBLIC_BACKEND_API_URL:</strong> {process.env.NEXT_PUBLIC_BACKEND_API_URL || '未設定'}</p>
        <p><strong>NEXT_PUBLIC_ML_SERVICE_URL:</strong> {process.env.NEXT_PUBLIC_ML_SERVICE_URL || '未設定'}</p>
        <p><strong>NEXT_PUBLIC_FRONTEND_URL:</strong> {process.env.NEXT_PUBLIC_FRONTEND_URL || '未設定'}</p>
        <p><strong>NODE_ENV:</strong> {process.env.NODE_ENV || '未設定'}</p>
      </div>

      <h2>說明</h2>
      <ul>
        <li>如果環境變數顯示為 "未設定"，表示環境變數沒有正確設定</li>
        <li>請在Vercel專案設定中設定環境變數</li>
        <li>設定完成後需要重新部署</li>
      </ul>

      <h2>需要設定的環境變數</h2>
      <pre style={{ background: '#e9ecef', padding: '10px', borderRadius: '5px' }}>
NEXT_PUBLIC_BACKEND_API_URL=https://aaron-website.onrender.com
NEXT_PUBLIC_ML_SERVICE_URL=https://aaron-website9.onrender.com
NEXT_PUBLIC_FRONTEND_URL=https://aaron-website9.vercel.app
      </pre>
    </div>
  );
}