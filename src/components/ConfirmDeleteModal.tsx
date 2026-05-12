import React from 'react';
import { Modal } from './ui/Modal';
import { Trash2, AlertTriangle } from 'lucide-react';

const COPY = {
  event: {
    title: "Cancel this event?",
    body: "Anyone who's RSVP'd will be removed. This can't be undone.",
    confirmLabel: "Cancel Event",
  },
  marketItem: {
    title: "Remove this listing?",
    body: "The item disappears from the marketplace. This can't be undone.",
    confirmLabel: "Remove Listing",
  },
  spot: {
    title: "Remove this spot?",
    body: "Other families won't see your recommendation anymore. This can't be undone.",
    confirmLabel: "Remove Spot",
  },
  trip: {
    title: "Remove this trip?",
    body: "This trip will be removed from your timeline. This can't be undone.",
    confirmLabel: "Remove Trip",
  },
  pastPlace: {
    title: "Remove from history?",
    body: "This city will be removed from your past travels. This can't be undone.",
    confirmLabel: "Remove Place",
  },
  request: {
    title: "Remove request?",
    body: "This request will be removed from the tribe board. This can't be undone.",
    confirmLabel: "Remove Request",
  },
};

export const ConfirmDeleteModal: React.FC<{
  target: { type: keyof typeof COPY; id: string } | null;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}> = ({ target, onCancel, onConfirm }) => {
  const [busy, setBusy] = React.useState(false);
  if (!target) return null;
  const copy = COPY[target.type];

  return (
    <Modal isOpen={!!target} onClose={onCancel} title="">
      <div className="text-center space-y-4 py-2">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-red-500" />
        </div>
        <h3 className="text-xl font-black text-secondary">{copy.title}</h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">{copy.body}</p>
        <div className="flex gap-3 pt-4">
          <button
            onClick={onCancel}
            disabled={busy}
            className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-sm font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-colors"
          >
            Keep it
          </button>
          <button
            onClick={async () => {
              setBusy(true);
              try { await onConfirm(); } finally { setBusy(false); }
            }}
            disabled={busy}
            className="flex-1 py-3.5 rounded-2xl bg-red-500 text-white text-sm font-black uppercase tracking-widest shadow-lg shadow-red-500/20 disabled:opacity-50 hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {busy ? "Removing..." : copy.confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};
