import React, { useState } from 'react';
import { X, Copy, Check, Download, Mail, FileText } from 'lucide-react';
import { MorningBulletin } from '../types/bulletin';
import { formatBulletinAsPlainText } from '../utils/bulletinFormatter';

interface PlainTextViewModalProps {
  bulletin: MorningBulletin;
  isOpen: boolean;
  onClose: () => void;
}

export const PlainTextViewModal: React.FC<PlainTextViewModalProps> = ({
  bulletin,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const plainText = formatBulletinAsPlainText(bulletin);

  const handleCopy = () => {
    navigator.clipboard.writeText(plainText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([plainText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `moqt-sutreshen-vestnik-0700-${bulletin.isoDate}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Моят сутрешен вестник 07:00 ч. (${bulletin.dateStr})`);
    const body = encodeURIComponent(plainText);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div
        className="relative w-full max-w-3xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-stone-200">
            <FileText className="w-5 h-5 text-amber-500" />
            <h2 className="font-sans font-bold text-lg">Чист текстов списък на вестника</h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Text viewer */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-stone-950">
          <p className="text-xs text-amber-400 font-mono mb-3">
            // Само заглавията с номериране и източници с малки букви, без обобщения:
          </p>
          <pre className="font-mono text-xs sm:text-sm text-stone-300 whitespace-pre-wrap leading-relaxed select-all">
            {plainText}
          </pre>
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3.5 border-t border-stone-800 bg-stone-900/90 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-stone-400 font-mono">
            Общо: {bulletin.totalHeadlinesCount} заглавия
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleEmailShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium transition-colors cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Отвори чернова в имейл</span>
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Свали .txt</span>
            </button>

            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Копирано!' : 'Копирай текста'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
