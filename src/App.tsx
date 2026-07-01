import { useState, useEffect } from 'react';
import { Card, Rating, Grade } from 'ts-fsrs';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Compass } from 'lucide-react';

import { hiraganaData, HiraganaItem } from './data/hiragana';
import { katakanaData } from './data/katakana';
import JapandiHeader from './components/JapandiHeader';
import Dashboard from './components/Dashboard';
import FlashcardStudy from './components/FlashcardStudy';
import CardBrowser from './components/CardBrowser';
import SettingsTab from './components/SettingsTab';
import InteractiveWalkthrough from './components/InteractiveWalkthrough';
import { Language, t } from './utils/i18n';
import {
  loadAllCards,
  saveAllCards,
  loadReviewLogs,
  addReviewLog,
  getStreak,
  resetAllStudyProgress,
  getOrInitCard,
  ReviewLog,
  loadSettings,
  saveSettings,
  getFsrsInstance,
  getNewCardsStudiedToday,
  ShizenSettings,
} from './utils/fsrsService';

const allKanaData = [...hiraganaData, ...katakanaData];

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'browser' | 'settings'>('dashboard');
  
  // Selection of Japanese Kana system: all, hiragana, katakana
  const [selectedSystem, setSelectedSystem] = useState<'all' | 'hiragana' | 'katakana'>('all');

  // Language State
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('shizen_language');
    if (saved === 'en' || saved === 'ja' || saved === 'id') {
      return saved as Language;
    }
    return 'id';
  });

  // Walkthrough State
  const [isWalkthroughOpen, setIsWalkthroughOpen] = useState(false);

  // Sync language with localStorage
  useEffect(() => {
    localStorage.setItem('shizen_language', language);
  }, [language]);

  // Settings State
  const [settings, setSettings] = useState<ShizenSettings>(loadSettings());

  // FSRS & Progress States
  const [cardsState, setCardsState] = useState<Record<number, Card>>({});
  const [logs, setLogs] = useState<ReviewLog[]>([]);
  const [streak, setStreak] = useState<number>(0);
  
  // Study Session States
  const [isStudying, setIsStudying] = useState(false);
  const [studySessionItems, setStudySessionItems] = useState<HiraganaItem[]>([]);
  const [studySessionTitle, setStudySessionTitle] = useState('');

  // Initial Load from localStorage & automatic walkthrough check
  useEffect(() => {
    setCardsState(loadAllCards());
    setLogs(loadReviewLogs());
    setStreak(getStreak());

    const completed = localStorage.getItem('shizen_walkthrough_completed');
    if (!completed) {
      setIsWalkthroughOpen(true);
    }
  }, []);

  // Update card FSRS stats after rating
  const handleRateCard = (no: number, rating: Rating) => {
    const scheduler = getFsrsInstance();
    const currentCard = getOrInitCard(no, cardsState);
    
    // Calculate next state
    const result = scheduler.next(currentCard, new Date(), rating as Grade);
    const updatedCards = {
      ...cardsState,
      [no]: result.card,
    };
    
    // Save updated card details
    setCardsState(updatedCards);
    saveAllCards(updatedCards);
    
    // Record log
    const matchedItem = allKanaData.find((item) => item.no === no);
    if (matchedItem) {
      const newLog: ReviewLog = {
        no,
        hiragana: matchedItem.hiragana,
        romaji: matchedItem.romaji,
        rating,
        reviewedAt: new Date().toISOString(),
      };
      addReviewLog(newLog);
      
      // Sync log and streak arrays
      setLogs(loadReviewLogs());
      setStreak(getStreak());
    }
  };

  // Begin Review Session
  const handleStartReview = () => {
    const now = new Date();
    
    // Choose active items depending on the selected system
    const activeItems = selectedSystem === 'hiragana'
      ? hiraganaData
      : selectedSystem === 'katakana'
      ? katakanaData
      : allKanaData;

    // Due cards check (reps > 0 and due date in the past/present)
    const dueItems = activeItems.filter((item) => {
      const card = cardsState[item.no];
      return card && card.due <= now && card.reps > 0;
    });

    if (dueItems.length === 0) return;

    // Shuffle due cards to maximize learning random recall
    const shuffled = [...dueItems].sort(() => Math.random() - 0.5);
    setStudySessionItems(shuffled);
    setStudySessionTitle(t('review_due_items_title', language, { count: shuffled.length }));
    setIsStudying(true);
  };

  // Learn Next Words Session
  const handleStartNewLearn = () => {
    const todayNewCount = getNewCardsStudiedToday(logs);
    const remainingNew = settings.newCardsPerDay - todayNewCount;

    // Choose active items depending on the selected system
    const activeItems = selectedSystem === 'hiragana'
      ? hiraganaData
      : selectedSystem === 'katakana'
      ? katakanaData
      : allKanaData;

    // Unseen means cards that are either not present in localStorage or have reps === 0
    const unseenItems = activeItems.filter((item) => {
      const card = cardsState[item.no];
      return !card || card.reps === 0;
    });

    if (unseenItems.length === 0) {
      const systemName = selectedSystem === 'hiragana' 
        ? t('hiragana_tab', language) 
        : selectedSystem === 'katakana' 
        ? t('katakana_tab', language) 
        : t('all_kana_tab', language);
      alert(t('all_items_studied_alert', language, { count: activeItems.length.toLocaleString(), system: systemName }));
      return;
    }

    if (remainingNew <= 0) {
      const proceed = window.confirm(
        t('daily_limit_reached_confirm', language, { count: todayNewCount, limit: settings.newCardsPerDay })
      );
      if (!proceed) return;
    }

    // Pick next batch of cards based entirely on user's custom daily limit or remaining goal
    const batchSize = remainingNew > 0 ? Math.min(remainingNew, unseenItems.length) : Math.min(settings.newCardsPerDay, unseenItems.length);
    const batch = unseenItems.slice(0, batchSize);

    setStudySessionItems(batch);
    setStudySessionTitle(
      selectedSystem === 'hiragana' 
        ? t('new_hiragana_batch', language) 
        : selectedSystem === 'katakana' 
        ? t('new_katakana_batch', language) 
        : t('new_kana_batch', language)
    );
    setIsStudying(true);
  };

  // Reset Progress Handler
  const handleResetProgress = () => {
    resetAllStudyProgress();
    setCardsState({});
    setLogs([]);
    setStreak(0);
    setIsStudying(false);
  };

  // Calculate some simple first-time stats for welcome cards
  const totalLearned = (Object.values(cardsState) as Card[]).filter((c) => c.reps > 0).length;

  return (
    <div className="bg-[#FAF6F1] min-h-screen text-[#3C3630] font-serif selection:bg-[#D7A48F]/20 selection:text-[#4A433D]" id="app-viewport">
      {/* 
        Mobile Device Mockup frame for elegant Desktop Display 
        Ensures a gorgeous layout on monitors while remaining 100% responsive and fluid on mobile screens
      */}
      <div className="max-w-md mx-auto min-h-screen bg-[#FBF9F6] shadow-2xl md:border-x border-[#D5C9B9]/30 relative flex flex-col justify-between" id="mockup-frame">
        
        {/* Main Content Body */}
        <div className="flex-grow flex flex-col">
          {!isStudying ? (
            <>
              {/* Header section */}
              <JapandiHeader
                activeTab={activeTab}
                onTabChange={setActiveTab}
                streak={streak}
                language={language}
                onLanguageChange={setLanguage}
                onOpenWalkthrough={() => setIsWalkthroughOpen(true)}
              />

              {activeTab !== 'settings' && (
                <div className="px-4 pt-1 pb-3 bg-[#FBF9F6] border-b border-[#D5C9B9]/15">
                  <div className="grid grid-cols-3 gap-1 p-1 bg-[#EAE3D5]/30 rounded-xl border border-[#D5C9B9]/20">
                    <button
                      onClick={() => setSelectedSystem('all')}
                      className={`py-1.5 rounded-lg text-[10px] font-serif font-bold tracking-wider uppercase transition-all ${
                        selectedSystem === 'all'
                          ? 'bg-[#6B7F6D] text-[#FBF9F6] shadow-sm'
                          : 'text-[#8A7E72] hover:text-[#4A433D]'
                      }`}
                      id="btn-system-all"
                    >
                      {t('all_kana_tab', language)}
                    </button>
                    <button
                      onClick={() => setSelectedSystem('hiragana')}
                      className={`py-1.5 rounded-lg text-[10px] font-serif font-bold tracking-wider uppercase transition-all ${
                        selectedSystem === 'hiragana'
                          ? 'bg-[#6B7F6D] text-[#FBF9F6] shadow-sm'
                          : 'text-[#8A7E72] hover:text-[#4A433D]'
                      }`}
                      id="btn-system-hiragana"
                    >
                      {t('hiragana_tab', language)}
                    </button>
                    <button
                      onClick={() => setSelectedSystem('katakana')}
                      className={`py-1.5 rounded-lg text-[10px] font-serif font-bold tracking-wider uppercase transition-all ${
                        selectedSystem === 'katakana'
                          ? 'bg-[#6B7F6D] text-[#FBF9F6] shadow-sm'
                          : 'text-[#8A7E72] hover:text-[#4A433D]'
                      }`}
                      id="btn-system-katakana"
                    >
                      {t('katakana_tab', language)}
                    </button>
                  </div>
                </div>
              )}

              {/* Central View Content */}
              <main className="p-4 flex-grow overflow-y-auto" id="main-scroll-view">
                <AnimatePresence mode="wait">
                  {activeTab === 'dashboard' && (
                    <motion.div
                      key="dashboard"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      {/* Brand Welcome Card for beginners */}
                      {totalLearned === 0 && (
                        <div className="bg-gradient-to-br from-[#F4EFE6] to-[#EAE3D5] border border-[#D5C9B9]/60 p-5 rounded-2xl relative overflow-hidden space-y-3 shadow-sm" id="welcome-card">
                          {/* Aesthetic graphic dots in background */}
                          <div className="absolute right-[-10px] top-[-10px] w-24 h-24 rounded-full bg-[#D7A48F]/10 flex items-center justify-center">
                            <Sparkles className="w-8 h-8 text-[#D7A48F] opacity-30" />
                          </div>
                          
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold tracking-widest text-[#6B7F6D]">Zen Practice</span>
                            <h3 className="text-base font-serif font-bold text-[#4A433D]">{t('zen_path_begins', language)}</h3>
                          </div>
                          <p className="text-xs text-[#8A7E72] leading-relaxed">
                            {t('welcome_sub_desc', language)}
                          </p>
                          <div className="pt-1">
                            <button
                              onClick={handleStartNewLearn}
                              className="bg-[#6B7F6D] hover:bg-[#5A6D5C] text-[#FBF9F6] text-xs font-serif font-medium py-2 px-4 rounded-lg flex items-center space-x-1.5 transition-colors"
                              id="btn-welcome-learn"
                            >
                              <Compass className="w-3.5 h-3.5" />
                              <span>
                                {selectedSystem === 'hiragana'
                                  ? t('learn_hiragana_btn', language)
                                  : selectedSystem === 'katakana'
                                  ? t('learn_katakana_btn', language)
                                  : t('learn_kana_btn', language)}
                              </span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Dashboard Components */}
                      <Dashboard
                        cards={cardsState}
                        logs={logs}
                        streak={streak}
                        newCardsPerDay={settings.newCardsPerDay}
                        newCardsStudiedToday={getNewCardsStudiedToday(logs)}
                        selectedSystem={selectedSystem}
                        onStartReview={handleStartReview}
                        onStartNewLearn={handleStartNewLearn}
                        onResetProgress={handleResetProgress}
                        language={language}
                      />
                    </motion.div>
                  )}

                  {activeTab === 'browser' && (
                    <motion.div
                      key="browser"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* Catalog list card browser */}
                      <CardBrowser
                        items={
                          selectedSystem === 'hiragana' 
                            ? hiraganaData 
                            : selectedSystem === 'katakana' 
                            ? katakanaData 
                            : allKanaData
                        }
                        cardsState={cardsState}
                        language={language}
                      />
                    </motion.div>
                  )}

                  {activeTab === 'settings' && (
                    <motion.div
                      key="settings"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <SettingsTab
                        settings={settings}
                        onSaveSettings={(newSettings) => {
                          saveSettings(newSettings);
                          setSettings(newSettings);
                        }}
                        language={language}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </main>
            </>
          ) : (
            /* Active Flashcard study session overlay */
            <main className="p-4 flex-grow flex flex-col justify-between" id="active-study-session-view">
              <FlashcardStudy
                items={studySessionItems}
                cardsState={cardsState}
                onRateCard={handleRateCard}
                onClose={() => setIsStudying(false)}
                sessionTitle={studySessionTitle}
                language={language}
              />
            </main>
          )}
        </div>

        {/* Minimal aesthetic Footer */}
        <footer className="py-4 text-center border-t border-[#D5C9B9]/20 text-[10px] text-[#8A7E72] font-serif tracking-wide bg-[#FBF9F6]" id="app-footer">
          <span>Shizen しぜん • Spaced Repetition Memorization</span>
        </footer>
      </div>

      {/* Interactive Walkthrough Overlay */}
      <InteractiveWalkthrough
        isOpen={isWalkthroughOpen}
        onClose={() => setIsWalkthroughOpen(false)}
        language={language}
      />
    </div>
  );
}
