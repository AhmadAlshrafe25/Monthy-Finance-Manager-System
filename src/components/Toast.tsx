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
    <div className="fixed right-5 bottom-5 z-50 flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-900/95 px-4 py-2.5 text-xs font-medium text-slate-100 shadow-2xl backdrop-blur">
      <span>{toast.text}</span>
      {toast.onUndo && (
        <button
          type="button"
          onClick={() => {
            toast.onUndo?.();
            onDismiss();
          }}
          className="flex items-center gap-1 rounded-md bg-sky-500/20 px-2 py-1 text-[11px] font-semibold text-sky-300 transition hover:bg-sky-500/30"
        >
          <RotateCcw className="h-3 w-3" /> Undo
        </button>
      )}
      <button
        type="button"
        onClick={onDismiss}
        className="text-slate-400 transition hover:text-slate-200"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
