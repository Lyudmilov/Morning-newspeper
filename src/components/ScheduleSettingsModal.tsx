import React, { useState } from 'react';
import {
  X,
  Clock,
  Bell,
  Volume2,
  Mail,
  CheckCircle2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { playMorningChime } from '../utils/speech';

interface ScheduleSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulateMorningDispatch: () => void;
}

export const ScheduleSettingsModal: React.FC<ScheduleSettingsModalProps> = ({
  isOpen,
  onClose,
  onSimulateMorningDispatch,
}) => {
  const [emailAddress, setEmailAddress] = useState('mitko.g78@gmail.com');
  const [enableSound, setEnableSound] = useState(true);
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleTestChime = () => {
    playMorningChime();
  };

  const handleRequestNotifications = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification('Моят сутрешен вестник 07:00 ч.', {
          body: 'Сутрешният ви вестник със заглавия от деня е готов!',
          icon: '/favicon.ico',
        });
      }
    }
  };

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div
        className="relative w-full max-w-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <h2 className="font-sans font-bold text-lg text-stone-900 dark:text-stone-100">
              График за изпращане: 07:00 ч.
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5 text-sm text-stone-700 dark:text-stone-300">
          {/* Schedule status banner */}
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
            <Calendar className="w-5 h-5 text-amber-700 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold text-amber-950 dark:text-amber-200 text-xs sm:text-sm">
                Фиксиран час: Всяка сутрин точно в 07:00 ч.
              </p>
              <p className="text-xs text-amber-900/80 dark:text-amber-300/80 mt-0.5">
                Автоматично съставяне на чист списък от номерирани заглавия с посочени източници с малки букви.
              </p>
            </div>
          </div>

          {/* Email setting */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              Имейл за сутрешно изпращане:
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:border-amber-500"
                />
              </div>
            </div>
            <p className="text-[11px] text-stone-400 mt-1">
              Вестникът съдържа само заглавията и източниците, без обобщения.
            </p>
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-2 border-t border-stone-200 dark:border-stone-800">
            {/* Sound Chime */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Volume2 className="w-4 h-4 text-amber-600" />
                <div>
                  <p className="font-medium text-xs sm:text-sm text-stone-900 dark:text-stone-100">
                    Звуков сигнал (Сутрешен камбанен звън)
                  </p>
                  <p className="text-[11px] text-stone-400">
                    Дискретен тон при пристигане на вестника в 7:00 ч.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleTestChime}
                className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline px-2 py-1 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 cursor-pointer"
              >
                Тествай звук
              </button>
            </div>

            {/* Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Bell className="w-4 h-4 text-amber-600" />
                <div>
                  <p className="font-medium text-xs sm:text-sm text-stone-900 dark:text-stone-100">
                    Браузърни известия
                  </p>
                  <p className="text-[11px] text-stone-400">
                    Изскачащо уведомление на екрана в 07:00 ч.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRequestNotifications}
                className="text-xs font-semibold text-stone-700 dark:text-stone-300 hover:text-stone-900 px-2.5 py-1 rounded bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 cursor-pointer"
              >
                Разреши
              </button>
            </div>
          </div>

          {/* Simulate button */}
          <div className="p-3 bg-stone-100 dark:bg-stone-800/60 rounded-xl flex items-center justify-between gap-2">
            <div>
              <p className="font-semibold text-xs text-stone-800 dark:text-stone-200">
                Симулирай утринния 7:00 ч. звън сега:
              </p>
              <p className="text-[11px] text-stone-500">
                Задейства нотификация, звън и обновяване
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                playMorningChime();
                onSimulateMorningDispatch();
                onClose();
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Тествай</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/90 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            Отказ
          </button>
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            {savedSuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : null}
            <span>{savedSuccess ? 'Запазено!' : 'Запази настройките'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
