import type { ReactNode } from 'react';
import { SettingsGear } from './SettingsGear';

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
  backgroundImage,
  overlayClassName = '',
  contentClassName = '',
}: PhoneLayoutProps) {
  return (
    <div className="mobile-safe-frame relative w-full overflow-hidden bg-black">
      {backgroundImage ? (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          />
          {overlayClassName ? <div className={`absolute inset-0 ${overlayClassName}`} /> : null}
        </>
      ) : null}

      <div
        className={`mobile-safe-content relative z-10 flex min-h-[100dvh] flex-col overflow-y-auto px-5 ${contentClassName}`}
      >
        {children}
      </div>
      <SettingsGear minimal={minimalSettingsGear} />
    </div>
  );
}
