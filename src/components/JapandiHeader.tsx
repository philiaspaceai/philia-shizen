import { BookOpen, BarChart2, Settings, HelpCircle } from 'lucide-react';
import { Language, t } from '../utils/i18n';

interface JapandiHeaderProps {
  activeTab: 'dashboard' | 'browser' | 'settings';
  onTabChange: (tab: 'dashboard' | 'browser' | 'settings') => void;
  streak: number;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenWalkthrough: () => void;
}

export default function JapandiHeader({ activeTab, onTabChange, streak, language, onLanguageChange, onOpenWalkthrough }: JapandiHeaderProps) {
  return (
    <header className="border-b border-[#D5C9B9]/40 bg-[#FBF9F6]/80 backdrop-blur-md sticky top-0 z-30 px-4 py-3.5 flex flex-col space-y-3" id="app-header">
      {/* Branding and Sun Crest */}
      <div className="flex items-center justify-between" id="header-brand-line">
        <div className="flex items-center space-x-2">
          {/* Aesthetic Zen Rising Sun Badge */}
          <div className="w-5 h-5 rounded-full bg-[#D7A48F] flex-shrink-0 relative opacity-90">
            <span className="absolute inset-0.5 rounded-full border border-[#FAF6F3]/50"></span>
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl font-serif font-bold text-[#4A433D] tracking-wide">自然 Shizen</h1>
            <p className="text-[10px] uppercase font-serif font-semibold tracking-widest text-[#8A7E72] opacity-80">{t('created_by', language)}</p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          {/* Minimal streak / active learner status crest */}
          <div className="text-[10px] uppercase font-serif font-bold text-[#6B7F6D] bg-[#F1F5F2] border border-[#CCD7CE] px-2 py-1.5 rounded-full flex items-center space-x-1" id="streak-crest">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6B7F6D] animate-ping" />
            <span>{t('active_learning', language)}</span>
          </div>

          {/* Help button for launching the guide */}
          <button
            onClick={onOpenWalkthrough}
            className="p-1.5 rounded-lg border border-[#D5C9B9]/50 bg-[#FAF6F1]/80 hover:bg-[#EAE3D5]/40 text-[#8A7E72] hover:text-[#4A433D] transition-colors"
            title="Guide / Walkthrough"
            id="btn-header-help"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>

          {/* Elegant Language Selector */}
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value as Language)}
            className="text-[10px] font-serif font-bold text-[#8A7E72] bg-[#FAF6F1]/80 hover:bg-[#EAE3D5]/40 border border-[#D5C9B9]/50 rounded-lg px-1.5 py-1.5 outline-none focus:border-[#6B7F6D] focus:ring-1 focus:ring-[#6B7F6D] cursor-pointer transition-colors"
            id="language-select"
          >
            <option value="en">EN</option>
            <option value="ja">JP</option>
            <option value="id">ID</option>
          </select>
        </div>
      </div>

      {/* Tabs Switcher Navigation */}
      <div className="grid grid-cols-3 gap-1.5 bg-[#EAE3D5]/40 p-1 rounded-xl" id="nav-tabs">
        <button
          onClick={() => onTabChange('dashboard')}
          className={`flex items-center justify-center space-x-1 py-2 rounded-lg text-[11px] sm:text-xs font-serif font-medium tracking-wide transition-all ${
            activeTab === 'dashboard'
              ? 'bg-[#FBF9F6] text-[#4A433D] shadow-sm'
              : 'text-[#8A7E72] hover:text-[#4A433D]'
          }`}
          id="btn-tab-dashboard"
        >
          <BarChart2 className="w-3.5 h-3.5 stroke-[1.8]" />
          <span>{t('dashboard', language)}</span>
        </button>
        <button
          onClick={() => onTabChange('browser')}
          className={`flex items-center justify-center space-x-1 py-2 rounded-lg text-[11px] sm:text-xs font-serif font-medium tracking-wide transition-all ${
            activeTab === 'browser'
              ? 'bg-[#FBF9F6] text-[#4A433D] shadow-sm'
              : 'text-[#8A7E72] hover:text-[#4A433D]'
          }`}
          id="btn-tab-browser"
        >
          <BookOpen className="w-3.5 h-3.5 stroke-[1.8]" />
          <span>{t('library', language)}</span>
        </button>
        <button
          onClick={() => onTabChange('settings')}
          className={`flex items-center justify-center space-x-1 py-2 rounded-lg text-[11px] sm:text-xs font-serif font-medium tracking-wide transition-all ${
            activeTab === 'settings'
              ? 'bg-[#FBF9F6] text-[#4A433D] shadow-sm'
              : 'text-[#8A7E72] hover:text-[#4A433D]'
          }`}
          id="btn-tab-settings"
        >
          <Settings className="w-3.5 h-3.5 stroke-[1.8]" />
          <span>{t('settings', language)}</span>
        </button>
      </div>
    </header>
  );
}
