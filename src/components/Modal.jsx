import React from 'react';
import { X } from 'lucide-react';

export function Modal({ open, onClose, title, children, footer, wide }) {
  if (!open) return null;
  return (
    <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Đóng"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative max-h-[92vh] overflow-hidden flex flex-col w-full ${
          wide ? 'max-w-3xl' : 'max-w-lg'
        } rounded-2xl bg-white border border-gray-200 shadow-2xl shadow-black/15`}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto p-4 sm:p-6 flex-1 min-h-0">{children}</div>
        {footer ? (
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex flex-wrap justify-end gap-2 bg-gray-50">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
