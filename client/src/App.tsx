import { Routes, Route, Navigate } from 'react-router-dom';
import { HostApp } from '@/host/HostApp';
import { PhoneApp } from '@/phone/PhoneApp';
import { GameProvider } from '@/context/GameProvider';
import { AuthProvider, useAuth } from '@/auth/AuthContext';
import { AuthView } from '@/auth/views/AuthView';
import { RequireAuth } from '@/auth/components/RequireAuth';
import { AppFlowProvider, useAppFlow } from '@/app/AppFlowContext';
import { isPhoneDevice } from '@/app/isPhoneDevice';
import { StartFlowView } from '@/app/views/StartFlowView';
import { RealStartView } from '@/app/views/RealStartView';

function RootRedirect() {
  const { user, isLoading } = useAuth();
  const { flow, isReady } = useAppFlow();

  if (isLoading || !isReady) {
    return null;
  }

  if (isPhoneDevice()) {
    return <Navigate to="/play" replace />;
  }

  if (!flow) {
    return <Navigate to="/start" replace />;
  }

  if (flow === 'real') {
    return <Navigate to="/real" replace />;
  }

  return <Navigate to={user ? '/host' : '/auth'} replace />;
}

function StartRoute() {
  if (isPhoneDevice()) {
    return <Navigate to="/play" replace />;
  }

  return <StartFlowView />;
}

function RealRoute() {
  if (isPhoneDevice()) {
    return <Navigate to="/play" replace />;
  }

  return <RealStartView />;
}

export function App() {
  return (
    <AppFlowProvider>
      <AuthProvider>
        <GameProvider>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/start" element={<StartRoute />} />
            <Route path="/real" element={<RealRoute />} />
            <Route path="/auth" element={<AuthView />} />
            <Route
              path="/host/*"
              element={(
                <RequireAuth>
                  <HostApp />
                </RequireAuth>
              )}
            />
            <Route path="/play/*" element={<PhoneApp />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </GameProvider>
      </AuthProvider>
    </AppFlowProvider>
  );
}
