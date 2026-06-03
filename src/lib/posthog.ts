import posthog from 'posthog-js';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com';
const IS_PROD = import.meta.env.PROD === true && import.meta.env.MODE === 'production';
const POSTHOG_ENABLED = IS_PROD && !!POSTHOG_KEY;

export const initPostHog = () => {
  if (typeof window !== 'undefined' && POSTHOG_ENABLED) {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      autocapture: true,
      capture_pageview: false, // We'll handle this manually for more control
      persistence: 'localStorage',
    });
  }
};

export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (POSTHOG_KEY) {
    posthog.capture(eventName, properties);
  }
};

export const identifyUser = (userId: string, traits: { email?: string; role?: string; tenant?: string; [key: string]: any }) => {
  if (POSTHOG_KEY) {
    posthog.identify(userId, traits);
  }
};

export const resetPostHog = () => {
  if (POSTHOG_KEY) {
    posthog.reset();
  }
};

// Auto-capture exceptions
if (typeof window !== 'undefined' && POSTHOG_KEY) {
  window.addEventListener('error', (event) => {
    trackEvent('frontend_error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    trackEvent('frontend_promise_rejection', {
      reason: event.reason?.message || event.reason,
      stack: event.reason?.stack,
    });
  });
}
