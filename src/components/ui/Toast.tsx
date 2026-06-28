import { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

export function Toast({ id, type, message, duration = 4000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);
    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const icons = {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    info: 'info'
  };

  const colors = {
    success: 'bg-gradient-to-r from-emerald-500 to-green-600 text-white',
    error: 'bg-gradient-to-r from-red-500 to-rose-600 text-white',
    warning: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white',
    info: 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
  };

  return (
    <div
      className={`flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl ${colors[type]} min-w-[320px] max-w-md animate-[slideInRight_0.3s_ease-out]`}
      style={{
        animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <span className="material-symbols-outlined text-2xl flex-shrink-0">
        {icons[type]}
      </span>
      <p className="flex-1 font-medium text-sm leading-snug">{message}</p>
      <button
        onClick={() => onClose(id)}
        className="flex-shrink-0 w-6 h-6 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
        aria-label="Đóng thông báo"
      >
        <span className="material-symbols-outlined text-lg">close</span>
      </button>
    </div>
  );
}
