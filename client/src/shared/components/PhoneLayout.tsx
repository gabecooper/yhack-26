import type { ReactNode } from 'react';
import { SettingsGear } from './SettingsGear';
import defaultBackground from '../../../../lobbyv2.png';

interface PhoneLayoutProps {
  children: ReactNode;
  minimalSettingsGear?: boolean;
  backgroundImage?: string;
  overlayClassName?: string;
  contentClassName?: string;
}

export function PhoneLayout({
  children,
  minimalSettingsGear = false,
  backgroundImage = defaultBackground,
  overlayClassName = 'bg-black/45',
  contentClassName = '',
}: PhoneLayoutProps) {
  return (
    <div className="mobile-safe-frame relative w-full overflow-hidden bg-vault-darker">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />
      <div className={`absolute inset-0 ${overlayClassName}`} />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/30 via-black/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />

      <div
        className={`mobile-safe-content relative z-10 flex min-h-[100dvh] flex-col overflow-y-auto px-5 ${contentClassName}`}
      >
        {children}
      </div>
      <SettingsGear minimal={minimalSettingsGear} />
    </div>
  );
}
