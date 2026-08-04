import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import TodayMealCard from './components/TodayMealCard';
import WeeklyMeals from './components/WeeklyMeals';
import SettingsModal from './components/SettingsModal';
import LoginModal from './components/LoginModal';

export default function App() {
  const [user, setUser] = useState(null);
  const [mealData, setMealData] = useState({
    todayMeal: null,
    days: [],
    locationName: '',
    lastUpdated: null,
  });
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const theme = config?.theme || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  }, [config?.theme]);

  useEffect(() => {
    initApp();

    if (window.electronAPI) {
      const unsubscribe = window.electronAPI.onMealDataUpdated((data) => {
        if (data && data.success) {
          setUser(data.user);
          setMealData({
            todayMeal: data.todayMeal,
            days: data.days,
            locationName: data.locationName,
            lastUpdated: data.lastUpdated,
          });
        }
      });
      return () => unsubscribe();
    }
  }, []);

  const initApp = async () => {
    setLoading(true);
    if (window.electronAPI) {
      const loadedConfig = await window.electronAPI.getConfig();
      setConfig(loadedConfig);

      const res = await window.electronAPI.loadMealData();
      if (res && res.success) {
        setUser(res.user);
        setMealData({
          todayMeal: res.todayMeal,
          days: res.days,
          locationName: res.locationName,
          lastUpdated: res.lastUpdated,
        });
      } else if (res && res.reason === 'unauthenticated') {
        setUser(null);
      }
    }
    setLoading(false);
  };

  const handleLogin = async (credentials) => {
    setLoginError('');
    if (!window.electronAPI) {
      setLoginError('Không kết nối được với ứng dụng. Vui lòng khởi động lại.');
      return;
    }

    try {
      const result = await window.electronAPI.login(credentials);
      if (result && result.success) {
        setUser(result.tokenData);
        if (result.mealData && result.mealData.success) {
          setMealData({
            todayMeal: result.mealData.todayMeal,
            days: result.mealData.days,
            locationName: result.mealData.locationName,
            lastUpdated: result.mealData.lastUpdated,
          });
        }
      } else {
        setLoginError((result && result.error) || 'Đăng nhập không thành công. Kiểm tra lại tài khoản/mật khẩu.');
      }
    } catch (err) {
      setLoginError(err.message || 'Đã xảy ra lỗi hệ thống khi kết nối tới THACO Portal.');
    }
  };

  const handleLogout = async () => {
    if (window.electronAPI) {
      await window.electronAPI.logout();
      setUser(null);
      setMealData({ todayMeal: null, days: [], locationName: '', lastUpdated: null });
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    if (window.electronAPI) {
      const res = await window.electronAPI.loadMealData(true);
      if (res && res.success) {
        setMealData({
          todayMeal: res.todayMeal,
          days: res.days,
          locationName: res.locationName,
          lastUpdated: res.lastUpdated,
        });
      }
    }
    setLoading(false);
  };

  const handleSaveConfig = async (newConfig) => {
    if (window.electronAPI) {
      const updated = await window.electronAPI.saveConfig(newConfig);
      setConfig(updated);
      setShowSettings(false);
    }
  };

  return (
    <div className="app-container">
      <Header
        user={user}
        loading={loading}
        onRefresh={handleRefresh}
        onOpenSettings={() => setShowSettings(true)}
        onLogout={handleLogout}
      />

      {!user && !loading && (
        <LoginModal onLogin={handleLogin} error={loginError} />
      )}

      {user && (
        <main>
          <TodayMealCard
            todayMeal={mealData.todayMeal}
            locationName={mealData.locationName}
            lastUpdated={mealData.lastUpdated}
          />

          <WeeklyMeals
            days={mealData.days}
            locationName={mealData.locationName}
          />
        </main>
      )}

      {showSettings && (
        <SettingsModal
          config={config}
          onClose={() => setShowSettings(false)}
          onSave={handleSaveConfig}
        />
      )}
    </div>
  );
}
