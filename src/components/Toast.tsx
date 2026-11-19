import React from 'react';
import { RotateCcw, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  text: string;
  onUndo?: () => void;
}

interface ToastProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  if (!toast) return null;

  return (
    <div className="fixed right-4 bottom-12 z-50 flex items-center gap-3 rounded border-2 border-green-700 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-900 shadow-lg">
      <span>{toast.text}</span>
      {toast.onUndo && (
        <button
          type="button"
          onClick={() => {
            toast.onUndo?.();
            onDismiss();
          }}
          className="flex items-center gap-1 rounded bg-yellow-300 px-2 py-1 text-[11px] font-bold text-neutral-950 transition hover:bg-yellow-400"
        >
          <RotateCcw className="h-3 w-3" /> Undo
        </button>
      )}
      <button
        type="button"
        onClick={onDismiss}
        className="text-neutral-500 transition hover:text-red-600"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
