const PHONE_USER_AGENT_PATTERN = /android.+mobile|iphone|ipod|windows phone|mobile/i;
const PHONE_MAX_SHORTEST_SIDE = 430;

export function isPhoneDevice() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  const userAgentData = (navigator as Navigator & {
    userAgentData?: { mobile?: boolean };
  }).userAgentData;
  const matchesPhoneUserAgent = PHONE_USER_AGENT_PATTERN.test(navigator.userAgent);
  const reportsMobileUserAgent = userAgentData?.mobile === true;
  const shortestViewportSide = Math.min(window.innerWidth, window.innerHeight);
  const shortestScreenSide = Math.min(window.screen.width, window.screen.height);
  const isTouchCapable = navigator.maxTouchPoints > 0
    || typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches
    || 'ontouchstart' in window;
  const matchesPhoneViewport = isTouchCapable
    && Math.min(shortestViewportSide, shortestScreenSide) <= PHONE_MAX_SHORTEST_SIDE;

  return matchesPhoneUserAgent || reportsMobileUserAgent || matchesPhoneViewport;
}
