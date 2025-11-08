/**
 * Device Detection Utility
 * Detects device type for responsive UI rendering
 */

import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export interface DeviceInfo {
  type: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  screenHeight: number;
  isTouchDevice: boolean;
  userAgent: string;
}

/**
 * Detect device type from user agent and screen size
 */
export function detectDevice(): DeviceInfo {
  // Server-side fallback
  if (typeof window === 'undefined') {
    return {
      type: 'desktop',
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      screenWidth: 1920,
      screenHeight: 1080,
      isTouchDevice: false,
      userAgent: '',
    };
  }

  const ua = navigator.userAgent.toLowerCase();
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Mobile detection (phones)
  const isMobileUA = /iphone|ipod|android.*mobile|blackberry|opera mini|mobile/i.test(ua);
  const isMobileScreen = screenWidth < 768;
  const isMobile = isMobileUA || isMobileScreen;

  // Tablet detection
  const isTabletUA = /ipad|android(?!.*mobile)|tablet/i.test(ua);
  const isTabletScreen = screenWidth >= 768 && screenWidth < 1024;
  const isTablet = (isTabletUA || isTabletScreen) && !isMobile;

  // Desktop (default)
  const isDesktop = !isMobile && !isTablet;

  const type: DeviceType = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';

  return {
    type,
    isMobile,
    isTablet,
    isDesktop,
    screenWidth,
    screenHeight,
    isTouchDevice,
    userAgent: ua,
  };
}

/**
 * Hook for device detection with reactive updates
 */
export function useDeviceDetection(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(detectDevice());

  useEffect(() => {
    const handleResize = () => {
      setDeviceInfo(detectDevice());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return deviceInfo;
}

