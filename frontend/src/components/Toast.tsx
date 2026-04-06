import { useState, useEffect } from 'react';

type ToastItem = { id: number; type: 'success' | 'error'; message: string };
type Listener = (items: ToastItem[]) => void;

let _items: ToastItem[] = [];
let _nextId = 0;
const _listeners = new Set<Listener>();

function _notify() {
  _listeners.forEach(l => l([..._items]));
}

export function extractErrorMessage(err: unknown, fallback: string): string {
  if (!err || typeof err !== 'object') return fallback;
  const e = err as any;
  const data = e?.response?.data;
  if (!data) return fallback;
  // NestJS validation errors return array in message
  if (Array.isArray(data.message)) return data.message.join(', ');
  if (typeof data.message === 'string') return data.message;
  if (typeof data.error === 'string') return data.error;
  return fallback;
}

export const toast = {
  success(message: string, duration = 3000) {
    const item: ToastItem = { id: _nextId++, type: 'success', message };
    _items = [..._items, item];
    _notify();
    setTimeout(() => { _items = _items.filter(i => i.id !== item.id); _notify(); }, duration);
  },
  error(message: string, duration = 4000) {
    const item: ToastItem = { id: _nextId++, type: 'error', message };
    _items = [..._items, item];
    _notify();
    setTimeout(() => { _items = _items.filter(i => i.id !== item.id); _notify(); }, duration);
  },
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    _listeners.add(setToasts);
    return () => { _listeners.delete(setToasts); };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 max-w-xs w-full pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 pointer-events-auto ${
            t.type === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          <span>{t.type === 'success' ? '✓' : '✗'}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
