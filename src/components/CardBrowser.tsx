import React, { useState, useMemo } from 'react';
import { Card, State } from 'ts-fsrs';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Volume2, Info, ChevronDown, Check, Bookmark } from 'lucide-react';
import { HiraganaItem } from '../data/hiragana';
import { playHiraganaAudio } from '../utils/audio';
import { Language, t } from '../utils/i18n';

interface CardBrowserProps {
  items: HiraganaItem[];
  cardsState: Record<number, Card>;
  language: Language;
}

type FilterType = 'all' | 'long_vowel' | 'learned' | 'unseen';

export default function CardBrowser({ items, cardsState, language }: CardBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [expandedNo, setExpandedNo] = useState<number | null>(null);

  // Filter items in real time
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const card = cardsState[item.no];
      const reps = card?.reps || 0;

      // Filter check
      if (activeFilter === 'long_vowel' && !item.isLongVowel) return false;
      if (activeFilter === 'learned' && reps === 0) return false;
      if (activeFilter === 'unseen' && reps > 0) return false;

      // Search check
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesHira = item.hiragana.includes(query);
        const matchesRoma = item.romaji.toLowerCase().includes(query);
        const matchesNo = item.no.toString() === query;
        return matchesHira || matchesRoma || matchesNo;
      }

      return true;
    });
  }, [items, cardsState, activeFilter, searchQuery]);

  const handleRowClick = (no: number) => {
    setExpandedNo((prev) => (prev === no ? null : no));
  };

  const handleAudioClick = (e: React.MouseEvent, hiragana: string) => {
    e.stopPropagation();
    playHiraganaAudio(hiragana);
  };

  // Helper to render FSRS state pill
  const renderStatePill = (card?: Card) => {
    if (!card || card.reps === 0) {
      return (
        <span className="text-[10px] bg-[#EAE3D5] text-[#8A7E72] px-2 py-0.5 rounded-full border border-[#D5C9B9]/30">
          {t('state_new', language)}
        </span>
      );
    }
    
    switch (card.state) {
      case State.Learning:
        return (
          <span className="text-[10px] bg-[#FAF0ED] text-[#AC5042] px-2 py-0.5 rounded-full border border-[#EACCC7]/30">
            {t('state_learning', language)}
          </span>
        );
      case State.Review:
        return (
          <span className="text-[10px] bg-[#F1F5F2] text-[#4E6150] px-2 py-0.5 rounded-full border border-[#CCD7CE]/30">
            {t('state_review', language)}
          </span>
        );
      case State.Relearning:
        return (
          <span className="text-[10px] bg-[#FAF0ED] text-[#C56B5C] px-2 py-0.5 rounded-full border border-[#EACCC7]/30">
            {t('state_relearning', language)}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4" id="card-browser-container">
      {/* Search Input */}
      <div className="relative" id="search-wrapper">
        <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#8A7E72]" />
        <input
          type="text"
          placeholder={t('search_placeholder', language)}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#F4EFE6] text-[#4A433D] placeholder-[#8A7E72]/60 font-serif border border-[#D5C9B9]/70 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#6B7F6D] focus:border-[#6B7F6D] transition-all shadow-sm"
          id="input-search"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1.5 overflow-x-auto pb-1" id="filter-tabs">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-serif tracking-wide transition-all whitespace-nowrap ${
            activeFilter === 'all'
              ? 'bg-[#6B7F6D] text-[#FBF9F6]'
              : 'bg-[#F4EFE6] text-[#8A7E72] hover:bg-[#EAE3D5]/60'
          }`}
          id="btn-filter-all"
        >
          {t('filter_all', language)} ({items.length})
        </button>
        <button
          onClick={() => setActiveFilter('long_vowel')}
          className={`px-3 py-1.5 rounded-lg text-xs font-serif tracking-wide transition-all whitespace-nowrap ${
            activeFilter === 'long_vowel'
              ? 'bg-[#6B7F6D] text-[#FBF9F6]'
              : 'bg-[#F4EFE6] text-[#8A7E72] hover:bg-[#EAE3D5]/60'
          }`}
          id="btn-filter-long"
        >
          {t('filter_long_vowels', language)}
        </button>
        <button
          onClick={() => setActiveFilter('learned')}
          className={`px-3 py-1.5 rounded-lg text-xs font-serif tracking-wide transition-all whitespace-nowrap ${
            activeFilter === 'learned'
              ? 'bg-[#6B7F6D] text-[#FBF9F6]'
              : 'bg-[#F4EFE6] text-[#8A7E72] hover:bg-[#EAE3D5]/60'
          }`}
          id="btn-filter-learned"
        >
          {t('filter_learned', language)}
        </button>
        <button
          onClick={() => setActiveFilter('unseen')}
          className={`px-3 py-1.5 rounded-lg text-xs font-serif tracking-wide transition-all whitespace-nowrap ${
            activeFilter === 'unseen'
              ? 'bg-[#6B7F6D] text-[#FBF9F6]'
              : 'bg-[#F4EFE6] text-[#8A7E72] hover:bg-[#EAE3D5]/60'
          }`}
          id="btn-filter-unseen"
        >
          {t('filter_unseen', language)}
        </button>
      </div>

      {/* Grid count stats */}
      <div className="flex justify-between items-center text-[11px] font-serif text-[#8A7E72] px-1">
        <span>{t('showing_matches', language, { count: filteredItems.length })}</span>
        {searchQuery && <button onClick={() => setSearchQuery('')} className="underline hover:text-[#4A433D]">{t('clear_search', language)}</button>}
      </div>

      {/* Browser Catalog list */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1" id="browser-list-viewport">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 bg-[#F4EFE6]/50 border border-dashed border-[#D5C9B9] rounded-xl font-serif text-[#8A7E72] italic text-xs">
            {t('no_kana_match', language)}
          </div>
        ) : (
          filteredItems.map((item) => {
            const card = cardsState[item.no];
            const isExpanded = expandedNo === item.no;

            return (
              <div
                key={item.no}
                className={`bg-[#F4EFE6] border rounded-xl overflow-hidden transition-all duration-200 ${
                  isExpanded ? 'border-[#6B7F6D] shadow-sm' : 'border-[#D5C9B9]/40'
                }`}
                id={`browser-item-${item.no}`}
              >
                {/* Header row clickable */}
                <div
                  onClick={() => handleRowClick(item.no)}
                  className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-[#EAE3D5]/30 transition-colors"
                >
                  <div className="flex items-center space-x-3.5">
                    <span className="text-[11px] font-mono text-[#D5C9B9] w-6 text-right">#{item.no}</span>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-xl font-serif font-medium text-[#4A433D]">{item.hiragana}</span>
                      <span className="text-xs font-serif text-[#8A7E72] tracking-wide italic">({item.romaji})</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {renderStatePill(card)}
                    
                    {/* Audio */}
                    <button
                      onClick={(e) => handleAudioClick(e, item.hiragana)}
                      className="w-7 h-7 rounded-full bg-[#EAE3D5]/50 text-[#6B7F6D] flex items-center justify-center hover:bg-[#6B7F6D] hover:text-[#FBF9F6] transition-all"
                      id={`btn-listen-${item.no}`}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>

                    <ChevronDown className={`w-4 h-4 text-[#8A7E72] transition-transform duration-200 ${
                      isExpanded ? 'transform rotate-180 text-[#6B7F6D]' : ''
                    }`} />
                  </div>
                </div>

                {/* Expandable Details Panel */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-[#D5C9B9]/30 bg-[#EAE3D5]/20 p-4 text-xs space-y-3.5 text-[#4A433D]"
                    >
                      {/* Vowel Note */}
                      {item.isLongVowel && (
                        <div className="bg-[#FAF0ED] border border-[#EACCC7] p-3 rounded-lg flex items-start space-x-2 text-[11px] text-[#AC5042] font-serif leading-relaxed">
                          <Info className="w-4 h-4 flex-shrink-0 stroke-[2] mt-0.5 text-[#C56B5C]" />
                          <span>{item.specialNote}</span>
                        </div>
                      )}

                      {/* FSRS metrics info */}
                      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[#D5C9B9]/20" id={`fsrs-metrics-${item.no}`}>
                        <div>
                          <p className="text-[10px] uppercase text-[#8A7E72] tracking-wider font-semibold">{t('repetitions', language)}</p>
                          <p className="font-mono text-[11px] font-bold mt-0.5">{t('times_studied', language, { count: card?.reps || 0 })}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-[#8A7E72] tracking-wider font-semibold">{t('memory_lapse_count', language)}</p>
                          <p className="font-mono text-[11px] font-bold mt-0.5">{t('times_forgotten', language, { count: card?.lapses || 0 })}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-[#8A7E72] tracking-wider font-semibold">{t('difficulty_level', language)}</p>
                          <p className="font-mono text-[11px] font-bold mt-0.5">
                            {card ? `${card.difficulty.toFixed(1)} / 10.0` : t('not_yet_calculated', language)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-[#8A7E72] tracking-wider font-semibold">{t('spaced_interval', language)}</p>
                          <p className="font-mono text-[11px] font-bold mt-0.5">
                            {card ? t('days_count', language, { count: Math.round(card.scheduled_days) }) : t('not_yet_calculated', language)}
                          </p>
                        </div>
                        {card?.last_review && (
                          <div className="col-span-2 border-t border-[#D5C9B9]/15 pt-2 flex justify-between text-[10px] text-[#8A7E72] font-serif">
                            <span>{t('last_review', language, { date: new Date(card.last_review).toLocaleDateString() })}</span>
                            <span>{t('next_due', language, { date: new Date(card.due).toLocaleDateString() })}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
