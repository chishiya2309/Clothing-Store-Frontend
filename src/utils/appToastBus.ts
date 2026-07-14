import type { ToastType } from '../components/ui/Toast';

const APP_TOAST_EVENT = 'clothy:toast';

export interface AppToastPayload {
  message: string;
  type?: ToastType;
  duration?: number;
}

export function emitAppToast(payload: AppToastPayload) {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent<AppToastPayload>(APP_TOAST_EVENT, {
    detail: payload,
  }));
}

export function subscribeAppToast(listener: (payload: AppToastPayload) => void) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handler = (event: Event) => {
    listener((event as CustomEvent<AppToastPayload>).detail);
  };

  window.addEventListener(APP_TOAST_EVENT, handler as EventListener);
  return () => window.removeEventListener(APP_TOAST_EVENT, handler as EventListener);
}
