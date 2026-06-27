"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface ModalState {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  danger: boolean;
  resolve: ((ok: boolean) => void) | null;
}

const ModalContext = createContext<{
  confirm: (opts: { title: string; message: string; confirmLabel?: string; danger?: boolean }) => Promise<boolean>;
} | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ModalState>({
    open: false,
    title: "",
    message: "",
    confirmLabel: "ยืนยัน",
    danger: false,
    resolve: null,
  });

  const confirm = useCallback(
    ({ title, message, confirmLabel = "ยืนยัน", danger = false }: {
      title: string;
      message: string;
      confirmLabel?: string;
      danger?: boolean;
    }) =>
      new Promise<boolean>((resolve) => {
        setState({ open: true, title, message, confirmLabel, danger, resolve });
      }),
    []
  );

  const close = (ok: boolean) => {
    state.resolve?.(ok);
    setState((s) => ({ ...s, open: false, resolve: null }));
  };

  return (
    <ModalContext.Provider value={{ confirm }}>
      {children}
      {state.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => close(false)}
          />
          {/* Dialog */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Top accent bar */}
            <div className={`h-1 w-full ${state.danger ? "bg-red-500" : "bg-accent"}`} />

            <div className="px-6 py-5 flex flex-col gap-4">
              {/* Icon + title */}
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${state.danger ? "bg-red-100" : "bg-indigo-100"}`}>
                  {state.danger ? (
                    <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                    </svg>
                  )}
                </div>
                <div className="flex flex-col gap-1 pt-0.5">
                  <h3 className="font-semibold text-base text-gray-900">{state.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{state.message}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end pt-1">
                <button
                  onClick={() => close(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => close(true)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${
                    state.danger
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-accent hover:bg-indigo-700"
                  }`}
                >
                  {state.confirmLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useConfirm must be used inside ModalProvider");
  return ctx.confirm;
}
