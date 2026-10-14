import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import OverviewPage from './pages/OverviewPage';
import WorkloadAnalyticsPage from './pages/WorkloadAnalyticsPage';
import AIForecastingPage from './pages/AIForecastingPage';
import AutoscalingSimulatorPage from './pages/AutoscalingSimulatorPage';
import PredictiveVsReactivePage from './pages/PredictiveVsReactivePage';
import CostOptimizationPage from './pages/CostOptimizationPage';
import ModelPerformancePage from './pages/ModelPerformancePage';
import HistoricalMetricsPage from './pages/HistoricalMetricsPage';
import ReportsAndExportsPage from './pages/ReportsAndExportsPage';
import SettingsPage from './pages/SettingsPage';
import UserProfilePage from './pages/UserProfilePage';
import LoginPage from './pages/LoginPage';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [currentUser, setCurrentUser] = useState({
    id: 1,
    name: 'B.Tech Evaluator',
    email: 'evaluator@college.edu',
    role: 'admin',
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    // Check session on load
    api.getCurrentUser()
      .then((res) => {
        if (res?.user && res.authenticated) setCurrentUser(res.user);
      })
      .catch(() => {});
  }, []);

  const handleDemoLogin = async (role = 'admin') => {
    try {
      const res = await api.demoLogin(role);
      if (res?.user) {
        setCurrentUser(res.user);
        setActiveTab('overview');
      }
    } catch (e) {
      console.error('Demo login failed', e);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      setCurrentUser(null);
      setActiveTab('login');
    } catch (e) {
      console.error('Logout error', e);
    }
  };

  const renderActivePage = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewPage setActiveTab={setActiveTab} />;
      case 'analytics':
        return <WorkloadAnalyticsPage />;
      case 'forecasting':
        return <AIForecastingPage />;
      case 'simulator':
        return <AutoscalingSimulatorPage />;
      case 'comparison':
        return <PredictiveVsReactivePage />;
      case 'cost':
        return <CostOptimizationPage />;
      case 'performance':
        return <ModelPerformancePage />;
      case 'metrics':
        return <HistoricalMetricsPage />;
      case 'reports':
        return <ReportsAndExportsPage />;
      case 'settings':
        return <SettingsPage />;
      case 'profile':
        return <UserProfilePage currentUser={currentUser} onDemoLogin={handleDemoLogin} onLogout={handleLogout} />;
      case 'login':
        return <LoginPage onLoginSuccess={(u) => { setCurrentUser(u); setActiveTab('overview'); }} onDemoLogin={handleDemoLogin} />;
      default:
        return <OverviewPage setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Navbar
        currentUser={currentUser}
        onDemoLogin={handleDemoLogin}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {renderActivePage()}
          </div>
        </main>
      </div>
    </div>
  );
}
