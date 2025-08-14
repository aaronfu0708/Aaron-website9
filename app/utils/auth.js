// 登出功能
import { safeConfirm } from './dialogs';

export const safeLogout = () => {
  safeConfirm('確定要登出嗎？',
    () => {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userData');
      localStorage.removeItem('token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('isPlusSubscribed');
      window.location.href = '/';
    },
    () => {
      // 使用者取消登出
    }
  );
};