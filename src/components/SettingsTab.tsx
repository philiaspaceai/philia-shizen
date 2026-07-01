import React, { useState } from 'react';
import { Settings, Info, RotateCcw, Save, CheckCircle } from 'lucide-react';
import { ShizenSettings, DEFAULT_SETTINGS } from '../utils/fsrsService';
import { Language, t } from '../utils/i18n';

interface SettingsTabProps {
  settings: ShizenSettings;
  onSaveSettings: (settings: ShizenSettings) => void;
  language: Language;
}

export default function SettingsTab({ settings, onSaveSettings, language }: SettingsTabProps) {
  const [newCardsPerDay, setNewCardsPerDay] = useState(settings.newCardsPerDay);
  const [requestRetention, setRequestRetention] = useState(settings.request_retention);
  const [maximumInterval, setMaximumInterval] = useState(settings.maximum_interval);
  const [enableFuzz, setEnableFuzz] = useState(settings.enable_fuzz);
  const [enableShortTerm, setEnableShortTerm] = useState(settings.enable_short_term);
  const [showSavedNotification, setShowSavedNotification] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      newCardsPerDay: Number(newCardsPerDay),
      request_retention: Number(requestRetention),
      maximum_interval: Number(maximumInterval),
      enable_fuzz: enableFuzz,
      enable_short_term: enableShortTerm,
      language: settings.language || language,
    });
    setShowSavedNotification(true);
    setTimeout(() => {
      setShowSavedNotification(false);
    }, 3000);
  };

  const handleRestoreDefaults = () => {
    if (window.confirm(t('confirm_restore_defaults', language))) {
      setNewCardsPerDay(DEFAULT_SETTINGS.newCardsPerDay);
      setRequestRetention(DEFAULT_SETTINGS.request_retention);
      setMaximumInterval(DEFAULT_SETTINGS.maximum_interval);
      setEnableFuzz(DEFAULT_SETTINGS.enable_fuzz);
      setEnableShortTerm(DEFAULT_SETTINGS.enable_short_term);
      
      onSaveSettings(DEFAULT_SETTINGS);
      setShowSavedNotification(true);
      setTimeout(() => {
        setShowSavedNotification(false);
      }, 3000);
    }
  };

  return (
    <div className="space-y-6" id="settings-container">
      {/* Header card with Zen theme */}
      <div className="bg-[#F4EFE6] border border-[#D5C9B9]/60 p-4 rounded-xl flex items-center space-x-3" id="settings-header">
        <div className="w-9 h-9 rounded-full bg-[#6B7F6D]/15 text-[#6B7F6D] flex items-center justify-center">
          <Settings className="w-5 h-5 stroke-[1.8]" />
        </div>
        <div className="space-y-0.5">
          <h2 className="text-sm font-serif font-bold text-[#4A433D]">{t('scheduler_preferences', language)}</h2>
          <p className="text-[11px] text-[#8A7E72] leading-relaxed">{t('customize_preferences_desc', language)}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5" id="settings-form">
        {/* New Cards Per Day Section */}
        <div className="bg-[#F4EFE6] border border-[#D5C9B9]/40 p-4 rounded-xl space-y-3" id="setting-section-daily-limit">
          <div className="space-y-1">
            <label className="text-xs font-serif font-bold text-[#4A433D] block" htmlFor="input-new-cards">
              {t('daily_new_cards_limit', language)}
            </label>
            <p className="text-[10px] text-[#8A7E72] leading-normal">
              {t('daily_limit_desc', language)}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <input
              type="range"
              id="input-new-cards"
              min="5"
              max="100"
              step="5"
              value={newCardsPerDay}
              onChange={(e) => setNewCardsPerDay(Number(e.target.value))}
              className="flex-grow accent-[#6B7F6D] h-1.5 bg-[#EAE3D5] rounded-lg appearance-none cursor-pointer"
            />
            <span className="font-mono text-xs font-bold text-[#4A433D] bg-[#EAE3D5]/60 px-2.5 py-1 rounded w-12 text-center">
              {newCardsPerDay}
            </span>
          </div>
        </div>

        {/* FSRS Settings Section */}
        <div className="bg-[#F4EFE6] border border-[#D5C9B9]/40 p-4 rounded-xl space-y-4" id="setting-section-fsrs">
          <h3 className="text-xs font-serif font-bold text-[#4A433D] tracking-wide border-b border-[#D5C9B9]/30 pb-1.5 uppercase tracking-wider text-[10px] text-[#8A7E72]">
            {t('fsrs_parameters', language)}
          </h3>

          {/* Request Retention */}
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <label className="text-xs font-serif font-medium text-[#4A433D]" htmlFor="input-retention">
                {t('requested_retention', language)}
              </label>
              <span className="font-mono text-xs font-bold text-[#6B7F6D]">
                {Math.round(requestRetention * 100)}%
              </span>
            </div>
            <p className="text-[10px] text-[#8A7E72] leading-normal italic">
              {t('retention_desc', language)}
            </p>
            <input
              type="range"
              id="input-retention"
              min="0.70"
              max="0.99"
              step="0.01"
              value={requestRetention}
              onChange={(e) => setRequestRetention(Number(e.target.value))}
              className="w-full accent-[#6B7F6D] h-1.5 bg-[#EAE3D5] rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Maximum Interval */}
          <div className="space-y-1.5 pt-2 border-t border-[#D5C9B9]/20">
            <div className="flex justify-between items-baseline">
              <label className="text-xs font-serif font-medium text-[#4A433D]" htmlFor="input-max-interval">
                {t('max_interval', language)}
              </label>
              <input
                type="number"
                id="input-max-interval"
                min="10"
                max="36500"
                value={maximumInterval}
                onChange={(e) => setMaximumInterval(Number(e.target.value))}
                className="font-mono text-xs font-bold text-[#4A433D] bg-[#FBF9F6] border border-[#D5C9B9]/60 rounded px-2 py-1 w-20 text-center focus:outline-none focus:border-[#6B7F6D]"
              />
            </div>
            <p className="text-[10px] text-[#8A7E72] leading-normal">
              {t('max_interval_desc', language)}
            </p>
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-3 border-t border-[#D5C9B9]/20">
            {/* Enable Short Term */}
            <div className="flex items-start justify-between space-x-3">
              <div className="space-y-0.5">
                <span className="text-xs font-serif font-medium text-[#4A433D] block">{t('enable_short_term', language)}</span>
                <p className="text-[10px] text-[#8A7E72] leading-normal">
                  {t('short_term_desc', language)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEnableShortTerm(!enableShortTerm)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  enableShortTerm ? 'bg-[#6B7F6D]' : 'bg-[#D5C9B9]'
                }`}
                id="btn-toggle-short-term"
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    enableShortTerm ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Enable Fuzz */}
            <div className="flex items-start justify-between space-x-3 pt-2 border-t border-[#D5C9B9]/15">
              <div className="space-y-0.5">
                <span className="text-xs font-serif font-medium text-[#4A433D] block">{t('enable_fuzzing', language)}</span>
                <p className="text-[10px] text-[#8A7E72] leading-normal">
                  {t('fuzzing_desc', language)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEnableFuzz(!enableFuzz)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  enableFuzz ? 'bg-[#6B7F6D]' : 'bg-[#D5C9B9]'
                }`}
                id="btn-toggle-fuzz"
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    enableFuzz ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col space-y-2.5 pt-2" id="settings-actions">
          {/* Save confirmation banner */}
          {showSavedNotification && (
            <div className="bg-[#F1F5F2] border border-[#CCD7CE] text-[#4E6150] text-xs font-serif p-3 rounded-lg flex items-center space-x-2 animate-fadeIn" id="saved-success">
              <CheckCircle className="w-4 h-4 text-[#6B7F6D] shrink-0" />
              <span>{t('settings_saved_success', language)}</span>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <button
              type="submit"
              className="flex-grow bg-[#6B7F6D] hover:bg-[#5A6D5C] text-[#FBF9F6] font-serif font-medium py-3 px-4 rounded-xl shadow-sm flex items-center justify-center space-x-2 transition-all"
              id="btn-save-settings"
            >
              <Save className="w-4 h-4" />
              <span>{t('save_settings', language)}</span>
            </button>

            <button
              type="button"
              onClick={handleRestoreDefaults}
              className="bg-[#EAE3D5] hover:bg-[#D5C9B9] text-[#8A7E72] hover:text-[#4A433D] font-serif p-3 rounded-xl transition-all"
              title="Reset Settings to Defaults"
              id="btn-restore-defaults"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
