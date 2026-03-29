const PHONE_USER_AGENT_PATTERN = /android.+mobile|iphone|ipod|windows phone|mobile/i;

export function isPhoneDevice() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  const matchesPhoneUserAgent = PHONE_USER_AGENT_PATTERN.test(navigator.userAgent);
  const matchesPhoneViewport = typeof window.matchMedia === 'function'
    ? window.matchMedia('(max-width: 768px) and (pointer: coarse)').matches
    : window.innerWidth <= 768;

  return matchesPhoneUserAgent || matchesPhoneViewport;
}
