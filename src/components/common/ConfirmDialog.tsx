import { AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  destructive = true,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal title={title} onClose={onCancel}>
      <div className="flex items-start gap-3">
        <div className={`rounded-full p-2 ${destructive ? "bg-red-50 text-red-600" : "bg-sky-50 text-sky-600"}`}>
          <AlertTriangle className="h-5 w-5" />
        </div>
        <p className="text-sm leading-relaxed text-slate-600">{message}</p>
      </div>
      <div className="mt-5 flex gap-2">
        <button
          onClick={onCancel}
          className="min-h-11 flex-1 rounded-xl border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className={`min-h-11 flex-1 rounded-xl px-4 text-sm font-semibold text-white ${destructive ? "bg-red-600 hover:bg-red-700" : "bg-accent hover:opacity-90"}`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
