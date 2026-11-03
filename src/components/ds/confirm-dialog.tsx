"use client";
import { useEffect, useRef } from "react";

/** Native <dialog>: focus trapping, Esc to close and backdrop come from the browser. */
export function Dialog({ open, title, onClose, children, footer }: { open: boolean; title: string; onClose: () => void; children?: React.ReactNode; footer?: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const d = ref.current; if (!d) return; if (open && !d.open) d.showModal(); if (!open && d.open) d.close(); }, [open]);
  return (
    <dialog ref={ref} className="ds-dialog" onClose={onClose} onClick={e => { if (e.target === ref.current) onClose(); }} aria-labelledby="ds-dialog-title">
      <div className="ds-dialog-inner">
        <h2 id="ds-dialog-title">{title}</h2>
        <div className="ds-dialog-body">{children}</div>
        <div className="ds-dialog-foot">{footer}</div>
      </div>
    </dialog>
  );
}

export function ConfirmDialog({ open, title, message, confirmLabel, danger, onConfirm, onClose }: { open: boolean; title: string; message: string; confirmLabel: string; danger?: boolean; onConfirm: () => void; onClose: () => void }) {
  return (
    <Dialog open={open} title={title} onClose={onClose} footer={<><button type="button" className="ds-btn ds-btn-quiet" onClick={onClose}>Keep as is</button><button type="button" className={danger ? "ds-btn ds-btn-danger" : "ds-btn ds-btn-primary"} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</button></>}>
      <p>{message}</p>
    </Dialog>
  );
}
