/**
 * Responsive Chat Wrapper
 * Detects device and renders appropriate interface
 */

import { useEffect, useState } from 'react';
import { detectDevice, type DeviceInfo } from '../lib/device-detection';
import ChatInterfaceWorking from './ChatInterfaceWorking';
import MobileChatInterface from './MobileChatInterface';

interface ResponsiveChatWrapperProps {
  userId: string;
  userEmail: string;
  userName: string;
  userRole: string;
}

export default function ResponsiveChatWrapper(props: ResponsiveChatWrapperProps) {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);

  useEffect(() => {
    // Detect device on mount
    setDeviceInfo(detectDevice());

    // Re-detect on resize (orientation change, etc)
    const handleResize = () => {
      setDeviceInfo(detectDevice());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Show loading state while detecting
  if (!deviceInfo) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-slate-400">Cargando...</div>
      </div>
    );
  }

  // Mobile view for phones
  if (deviceInfo.isMobile) {
    return <MobileChatInterface {...props} />;
  }

  // Desktop/tablet view (existing full-featured interface)
  return <ChatInterfaceWorking {...props} />;
}


