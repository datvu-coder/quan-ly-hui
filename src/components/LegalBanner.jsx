import React from 'react';
import { AlertTriangle } from 'lucide-react';

export function LegalBanner({ interestWarnings = [], fundWarning = false }) {
  if (!interestWarnings.length && !fundWarning) return null;
  return (
    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 flex gap-3 items-start">
      <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={20} />
      <div className="text-sm text-amber-100/95 space-y-1">
        <p className="font-semibold text-amber-200">Lưu ý pháp lý & rủi ro</p>
        {interestWarnings.map((t, i) => (
          <p key={i}>{t}</p>
        ))}
        {fundWarning ? (
          <p>
            Quỹ từng dây hoặc tổng quỹ đạt ngưỡng cao — theo quy định có thể phải thông báo chính quyền địa
            phương. Kiểm tra Nghị định 19/2019/NĐ-CP và hướng dẫn hiện hành.
          </p>
        ) : null}
        <p className="text-xs text-slate-400">
          Ứng dụng chỉ hỗ trợ ghi chép; không thay thế tư vấn pháp lý.
        </p>
      </div>
    </div>
  );
}
