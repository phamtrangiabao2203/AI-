import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { LoginView } from './components/auth/LoginView';
import { DashboardView } from './components/dashboard/DashboardView';
import { PredictionView } from './components/prediction/PredictionView';
import { CustomerListView } from './components/customers/CustomerListView';
import { HistoryView } from './components/history/HistoryView';
import { ModelManagementView } from './components/model/ModelManagementView';
import { UserManagementView } from './components/users/UserManagementView';
import { AuditLogsView } from './components/audit/AuditLogsView';
import { SettingsView } from './components/settings/SettingsView';
import { CustomerInput } from './types';

function MainApp() {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [prefilledCustomer, setPrefilledCustomer] = useState<CustomerInput | null>(null);
  const [selectedPredictionId, setSelectedPredictionId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Đang khởi tạo hệ thống AI Bank Marketing...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const handlePredictCustomer = (customer: CustomerInput & { customerId?: string }) => {
    setPrefilledCustomer(customer);
    setActiveTab('prediction');
  };

  const handleViewPredictionDetail = (predictionId: string) => {
    setSelectedPredictionId(predictionId);
    setActiveTab('history');
  };

  const handleTabChange = (tab: NavTab) => {
    // If staff tries to access admin tabs, fallback to dashboard
    if ((tab === 'users' || tab === 'audit') && !isAdmin) {
      setActiveTab('dashboard');
      return;
    }
    setActiveTab(tab);
  };

  return (
    <div className="flex h-screen bg-[#F5F7FB] overflow-hidden text-slate-900 font-sans">
      {/* Fixed Left Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header activeTab={activeTab} onTabChange={handleTabChange} />

        {/* Viewport Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardView
                onNavigateToPredict={() => setActiveTab('prediction')}
                onViewPredictionDetail={handleViewPredictionDetail}
              />
            )}

            {activeTab === 'prediction' && (
              <PredictionView
                initialData={prefilledCustomer}
                onSavedToHistory={() => {}}
              />
            )}

            {activeTab === 'customers' && (
              <CustomerListView onPredictCustomer={handlePredictCustomer} />
            )}

            {activeTab === 'history' && (
              <HistoryView initialSelectedId={selectedPredictionId} />
            )}

            {activeTab === 'model' && <ModelManagementView />}

            {activeTab === 'users' && isAdmin && <UserManagementView />}

            {activeTab === 'audit' && isAdmin && <AuditLogsView />}

            {activeTab === 'settings' && <SettingsView />}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
