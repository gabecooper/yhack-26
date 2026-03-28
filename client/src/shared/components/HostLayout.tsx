import type { ReactNode } from 'react';
import { SettingsGear } from './SettingsGear';
import defaultBackground from '../../../../lobbyv2.png';

interface HostLayoutProps {
  children: ReactNode;
  showBackground?: boolean;
  backgroundImage?: string;
  minimalSettingsGear?: boolean;
  settingsGearSide?: 'left' | 'right';
}

export function HostLayout({
  children,
  showBackground = true,
  backgroundImage,
  minimalSettingsGear = false,
  settingsGearSide = 'right',
}: HostLayoutProps) {
  const resolvedBackgroundImage = backgroundImage ?? defaultBackground;
  const shouldShowDefaultOverlay = !backgroundImage;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-vault-darker">
      {showBackground && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${resolvedBackgroundImage})` }}
          />
          {shouldShowDefaultOverlay && <div className="absolute inset-0 bg-black/50" />}
        </>
      )}

      <div className="relative z-10 w-full h-full flex flex-col">
        {children}
      </div>

      <SettingsGear minimal={minimalSettingsGear} side={settingsGearSide} />
    </div>
  );
}
