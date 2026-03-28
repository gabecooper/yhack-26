import type { ReactNode } from 'react';
import { SettingsGear } from './SettingsGear';
import defaultBackground from '../../../../lobbyv2.png';

interface PhoneLayoutProps {
  children: ReactNode;
  minimalSettingsGear?: boolean;
}

export function PhoneLayout({ children, minimalSettingsGear = false }: PhoneLayoutProps) {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-vault-darker flex flex-col">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${defaultBackground})` }}
      />
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 flex-1 flex flex-col p-4 pt-16 overflow-y-auto">
        {children}
      </div>
      <SettingsGear minimal={minimalSettingsGear} />
    </div>
  );
}
