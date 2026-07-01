import React, { useState, useEffect, useMemo } from 'react';
import { Card, Rating } from 'ts-fsrs';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, CheckCircle, ChevronLeft, HelpCircle } from 'lucide-react';
import { HiraganaItem } from '../data/hiragana';
import { playHiraganaAudio } from '../utils/audio';
import { getFsrsInstance } from '../utils/fsrsService';
import { Language, t } from '../utils/i18n';

interface FlashcardStudyProps {
  items: HiraganaItem[];
  cardsState: Record<number, Card>;
  onRateCard: (no: number, rating: Rating) => void;
  onClose: () => void;
  sessionTitle: string;
  language: Language;
}

export default function FlashcardStudy({
  items,
  cardsState,
  onRateCard,
  onClose,
  sessionTitle,
  language,
}: FlashcardStudyProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionFinished, setSessionFinished] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const currentItem = items[currentIndex];

  // Load scheduler once
  const scheduler = useMemo(() => getFsrsInstance(), []);

  // Retrieve FSRS card details
  const currentCard = useMemo(() => {
    if (!currentItem) return null;
    return cardsState[currentItem.no] || {
      due: new Date(),
      stability: 0,
      difficulty: 0,
      elapsed_days: 0,
      scheduled_days: 0,
      reps: 0,
      lapses: 0,
      state: 0, // State.New
    } as Card;
  }, [currentItem, cardsState]);

  // Compute calculated intervals for the FSRS rating options
  const intervals = useMemo(() => {
    if (!currentCard) return null;
    try {
      const now = new Date();
      const previews = scheduler.repeat(currentCard, now);
      
      const formatInterval = (days: number) => {
        if (days === 0) return '10m';
        if (days < 1) return '<1d';
        if (days >= 365) return `${(days / 365).toFixed(1)}y`;
        return `${Math.round(days)}d`;
      };

      return {
        [Rating.Again]: '1m', // FSRS defaults "Again" to 1 minute
        [Rating.Hard]: formatInterval(previews[Rating.Hard].card.scheduled_days),
        [Rating.Good]: formatInterval(previews[Rating.Good].card.scheduled_days),
        [Rating.Easy]: formatInterval(previews[Rating.Easy].card.scheduled_days),
      };
    } catch (err) {
      console.error("FSRS Interval Calculation Error:", err);
      return {
        [Rating.Again]: '1m',
        [Rating.Hard]: '12h',
        [Rating.Good]: '3d',
        [Rating.Easy]: '7d',
      };
    }
  }, [currentCard, scheduler]);

  // Reset flip state on item index changes
  useEffect(() => {
    setIsFlipped(false);
  }, [currentIndex]);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-12 text-center" id="empty-session">
        <p className="text-sm font-serif text-[#8A7E72] italic">{t('no_items_available', language)}</p>
        <button
          onClick={onClose}
          className="bg-[#6B7F6D] text-[#FBF9F6] font-serif px-6 py-2 rounded-lg transition-colors"
          id="btn-empty-close"
        >
          {t('back_to_dashboard', language)}
        </button>
      </div>
    );
  }

  if (sessionFinished) {
    return (
      <div className="bg-[#F4EFE6] border border-[#D5C9B9]/60 p-8 rounded-xl text-center space-y-6" id="finish-session">
        <div className="flex justify-center">
          <CheckCircle className="w-16 h-16 text-[#6B7F6D] stroke-1" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-serif text-[#4A433D] font-bold">{t('session_complete', language)}</h2>
          <p className="text-sm text-[#8A7E72] max-w-sm mx-auto leading-relaxed">
            {t('session_complete_detail', language)}
          </p>
        </div>
        <button
          onClick={onClose}
          className="bg-[#6B7F6D] hover:bg-[#5A6D5C] text-[#FBF9F6] font-serif font-medium py-2.5 px-6 rounded-lg transition-colors shadow-sm"
          id="btn-finish-return"
        >
          {t('back_to_dashboard', language)}
        </button>
      </div>
    );
  }

  const handleReveal = () => {
    if (isTransitioning) return;
    setIsFlipped(true);
    if (currentItem) {
      playHiraganaAudio(currentItem.hiragana);
    }
  };

  const handleAudioClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentItem) {
      playHiraganaAudio(currentItem.hiragana);
    }
  };

  const handleScore = (rating: Rating) => {
    if (isTransitioning) return;
    setIsTransitioning(true);

    onRateCard(currentItem.no, rating);
    setIsFlipped(false);
    
    setTimeout(() => {
      if (currentIndex < items.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setIsTransitioning(false);
      } else {
        setSessionFinished(true);
        setIsTransitioning(false);
      }
    }, 250); // Matches the 250ms transition duration
  };

  const progressPercent = ((currentIndex + 1) / items.length) * 100;

  return (
    <div className="space-y-6" id="flashcard-study-container">
      {/* Session Header */}
      <div className="flex items-center justify-between" id="session-header">
        <button
          onClick={onClose}
          className="flex items-center space-x-1 text-[#8A7E72] hover:text-[#4A433D] text-xs font-serif transition-colors"
          id="btn-quit-session"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>{t('exit_session', language)}</span>
        </button>
        <span className="text-xs font-serif font-semibold tracking-wider text-[#6B7F6D] uppercase bg-[#EAE3D5]/60 px-2.5 py-1 rounded-full">
          {sessionTitle}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5" id="session-progress">
        <div className="flex justify-between items-center text-[11px] font-serif text-[#8A7E72]">
          <span>{t('card_progress', language, { current: currentIndex + 1, total: items.length })}</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <div className="h-1 w-full bg-[#EAE3D5] rounded-full overflow-hidden">
          <div
            style={{ width: `${progressPercent}%` }}
            className="h-full bg-[#6B7F6D] transition-all duration-300"
          />
        </div>
      </div>

      {/* Main Tactical Card Area */}
      <div className="perspective-1000 h-[320px] w-full" id="tactile-card-stage">
        <div
          onClick={() => !isFlipped && !isTransitioning && handleReveal()}
          className={`relative w-full h-full transition-transform duration-250 transform-style-3d cursor-pointer ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          id="card-flipper"
        >
          {/* Card Front */}
          <div className="absolute inset-0 w-full h-full backface-hidden bg-[#F4EFE6] border border-[#D5C9B9] rounded-2xl shadow-sm flex flex-col justify-between p-6">
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono text-[#D5C9B9]">No. {currentItem.no}</span>
              {currentItem.isLongVowel && (
                <span className="text-[10px] bg-[#D7A48F]/15 text-[#D7A48F] px-2 py-0.5 rounded-full border border-[#D7A48F]/20">
                  {t('filter_long_vowels', language)}
                </span>
              )}
            </div>

            <div className="text-center py-6 flex flex-col items-center justify-center">
              <h1 className="text-7xl font-serif font-medium text-[#4A433D] select-none tracking-wide">
                {currentItem.hiragana}
              </h1>
            </div>

            <div className="text-center">
              <span className="text-xs font-serif text-[#8A7E72] italic flex items-center justify-center space-x-1.5 opacity-80">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{t('tap_to_reveal', language)}</span>
              </span>
            </div>
          </div>

          {/* Card Back (Flipped) */}
          <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-[#F4EFE6] border border-[#D5C9B9] rounded-2xl shadow-sm flex flex-col justify-between p-6 overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#D5C9B9]/30 pb-2">
              <span className="text-xs font-mono text-[#8A7E72]">No. {currentItem.no}</span>
              <button
                onClick={handleAudioClick}
                className="w-8 h-8 rounded-full bg-[#EAE3D5] text-[#6B7F6D] flex items-center justify-center hover:bg-[#6B7F6D] hover:text-[#FBF9F6] transition-all"
                title="Play Audio"
                id="btn-play-audio"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            {/* Answer Display */}
            <div className="text-center py-4 space-y-1">
              <h2 className="text-4xl font-serif text-[#4A433D] font-bold">
                {currentItem.hiragana}
              </h2>
              <p className="text-2xl font-serif tracking-wider font-light text-[#D7A48F] uppercase">
                {currentItem.romaji}
              </p>
            </div>

            {/* Note Area */}
            <div className="min-h-[70px] flex items-center">
              {currentItem.isLongVowel ? (
                <div className="bg-[#FAF0ED] border border-[#EACCC7]/60 p-3 rounded-lg text-left text-[11px] text-[#AC5042] leading-relaxed font-serif">
                  {currentItem.specialNote}
                </div>
              ) : (
                <div className="w-full text-center text-xs italic text-[#8A7E72] font-serif opacity-70">
                  {t('short_vowel_standard', language)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Interaction Controls */}
      <div className="h-20" id="controls-panel">
        <AnimatePresence mode="wait">
          {!isFlipped ? (
            <motion.div
              key="reveal-button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <button
                onClick={handleReveal}
                className="w-full bg-[#6B7F6D] hover:bg-[#5A6D5C] text-[#FBF9F6] font-serif font-medium py-3.5 px-4 rounded-xl shadow-sm tracking-wide transition-all uppercase text-xs"
                id="btn-reveal-bottom"
              >
                {t('show_answer', language)}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="score-buttons"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-4 gap-2"
              id="score-buttons-grid"
            >
              {/* Again Button */}
              <button
                onClick={() => handleScore(Rating.Again)}
                className="flex flex-col items-center justify-center bg-[#FAF0ED] hover:bg-[#F2DFDA] border border-[#EACCC7] rounded-xl py-2 px-1 transition-all"
                id="btn-score-again"
              >
                <span className="text-[10px] uppercase tracking-wider text-[#AC5042] font-semibold">{t('again', language)}</span>
                <span className="text-[10px] text-[#AC5042]/70 font-mono mt-0.5">{intervals?.[Rating.Again] || '1m'}</span>
              </button>

              {/* Hard Button */}
              <button
                onClick={() => handleScore(Rating.Hard)}
                className="flex flex-col items-center justify-center bg-[#FCF7F1] hover:bg-[#F2E8DC] border border-[#E9DFD0] rounded-xl py-2 px-1 transition-all"
                id="btn-score-hard"
              >
                <span className="text-[10px] uppercase tracking-wider text-[#A17E5E] font-semibold">{t('hard', language)}</span>
                <span className="text-[10px] text-[#A17E5E]/70 font-mono mt-0.5">{intervals?.[Rating.Hard] || '12h'}</span>
              </button>

              {/* Good Button */}
              <button
                onClick={() => handleScore(Rating.Good)}
                className="flex flex-col items-center justify-center bg-[#F1F5F2] hover:bg-[#DFE7E2] border border-[#CCD7CE] rounded-xl py-2 px-1 transition-all"
                id="btn-score-good"
              >
                <span className="text-[10px] uppercase tracking-wider text-[#4E6150] font-semibold">{t('good', language)}</span>
                <span className="text-[10px] text-[#4E6150]/70 font-mono mt-0.5">{intervals?.[Rating.Good] || '3d'}</span>
              </button>

              {/* Easy Button */}
              <button
                onClick={() => handleScore(Rating.Easy)}
                className="flex flex-col items-center justify-center bg-[#F0F5F6] hover:bg-[#DEE7E9] border border-[#CBD7D9] rounded-xl py-2 px-1 transition-all"
                id="btn-score-easy"
              >
                <span className="text-[10px] uppercase tracking-wider text-[#496570] font-semibold">{t('easy', language)}</span>
                <span className="text-[10px] text-[#496570]/70 font-mono mt-0.5">{intervals?.[Rating.Easy] || '7d'}</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
