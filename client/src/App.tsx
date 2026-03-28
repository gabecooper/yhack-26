import { Routes, Route, Navigate } from 'react-router-dom';
import { HostApp } from '@/host/HostApp';
import { PhoneApp } from '@/phone/PhoneApp';
import { GameProvider } from '@/context/GameProvider';

export function App() {
  return (
    <GameProvider>
      <Routes>
        <Route path="/host/*" element={<HostApp />} />
        <Route path="/play/*" element={<PhoneApp />} />
        <Route path="*" element={<Navigate to="/host" replace />} />
      </Routes>
    </GameProvider>
  );
}
