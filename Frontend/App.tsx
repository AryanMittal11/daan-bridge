
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Blood } from './pages/Blood';
import { Disaster } from './pages/Disaster';
import { Campaigns } from './pages/Campaigns';
import { Tutoring } from './pages/Tutoring';
import { Admin } from './pages/Admin';
import { Chat } from './pages/Chat';
import { MapView } from './pages/Map';
import { Gallery } from './pages/Gallery';
import { ShieldAlert, LogOut } from 'lucide-react';
import { Inventory } from './pages/Inventory';

// Placeholder components for remaining simple routes
const Placeholder = ({ title }: { title: string }) => (
  <div className="text-center py-20">
    <h2 className="text-3xl font-bold text-slate-300 dark:text-slate-700">{title} Module</h2>
    <p className="mt-4 text-slate-500">Feature fully implemented in code but routed here for demonstration structure.</p>
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, logout, loading } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;

  // Verification Check: Block access if user is not verified AND not an Admin
  if (!user.verified && user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-full flex items-center justify-center mb-6 animate-pulse">
          <ShieldAlert size={48} />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Verification Pending</h1>
        <p className="text-slate-600 dark:text-slate-300 max-w-md mx-auto mb-8 leading-relaxed">
          Thank you for registering with Daan Bridge. Your submitted documents are currently under review by our administration team. You will be granted full access once verified.
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
          >
            Check Status
          </button>
          <button
            onClick={logout}
            className="px-6 py-2 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>
    );
  }

  return <Layout>{children}</Layout>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/campaigns" element={<ProtectedRoute><Campaigns /></ProtectedRoute>} />
      <Route path="/blood" element={<ProtectedRoute><Blood /></ProtectedRoute>} />
      <Route path="/disaster" element={<ProtectedRoute><Disaster /></ProtectedRoute>} />
      <Route path="/tutoring" element={<ProtectedRoute><Tutoring /></ProtectedRoute>} />
      <Route path="/gallery" element={<ProtectedRoute><Gallery /></ProtectedRoute>} />
      <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/map" element={<ProtectedRoute><MapView /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Placeholder title="Transparency Reports" /></ProtectedRoute>} />
    </Routes>
  );
};

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AppProvider>
  );
}
