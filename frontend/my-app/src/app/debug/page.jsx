'use client';

import { useEffect, useState } from 'react';
import { API_ENDPOINTS, getCurrentApiEndpoints } from '../utils/apiConfig';

export default function DebugPage() {
  const [envVars, setEnvVars] = useState({});
  const [apiEndpoints, setApiEndpoints] = useState({});

  useEffect(() => {
    // 檢查環境變數
    setEnvVars({
      NEXT_PUBLIC_BACKEND_API_URL: process.env.NEXT_PUBLIC_BACKEND_API_URL,
      NEXT_PUBLIC_ML_SERVICE_URL: process.env.NEXT_PUBLIC_ML_SERVICE_URL,
      NEXT_PUBLIC_FRONTEND_URL: process.env.NEXT_PUBLIC_FRONTEND_URL,
      NODE_ENV: process.env.NODE_ENV,
    });

    // 檢查API端點
    setApiEndpoints(getCurrentApiEndpoints());
  }, []);

  const testBackendConnection = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.BACKEND.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'test@test.com', password: 'test123' }),
      });
      
      const data = await response.json();
      alert(`後端連線測試結果:\n狀態: ${response.status}\n回應: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      alert(`後端連線錯誤: ${error.message}`);
    }
  };

  const testMLServiceConnection = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.ML_SERVICE.GENERATE_TOPIC_FROM_NOTE, {
        method: 'GET',
      });
      
      const data = await response.json();
      alert(`ML服務連線測試結果:\n狀態: ${response.status}\n回應: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      alert(`ML服務連線錯誤: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>前端調試頁面</h1>
      
      <h2>環境變數</h2>
      <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
        {JSON.stringify(envVars, null, 2)}
      </pre>

      <h2>API端點配置</h2>
      <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
        {JSON.stringify(apiEndpoints, null, 2)}
      </pre>

      <h2>API端點常數</h2>
      <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
        {JSON.stringify(API_ENDPOINTS, null, 2)}
      </pre>

      <h2>連線測試</h2>
      <div style={{ margin: '20px 0' }}>
        <button 
          onClick={testBackendConnection}
          style={{ 
            padding: '10px 20px', 
            margin: '10px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          測試後端連線
        </button>
        
        <button 
          onClick={testMLServiceConnection}
          style={{ 
            padding: '10px 20px', 
            margin: '10px', 
            backgroundColor: '#28a745', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          測試ML服務連線
        </button>
      </div>

      <h2>說明</h2>
      <ul>
        <li>如果環境變數顯示為 undefined，表示環境變數沒有正確設定</li>
        <li>如果API端點顯示為本地端點，表示環境變數沒有生效</li>
        <li>使用連線測試按鈕來檢查API是否可達</li>
      </ul>
    </div>
  );
}