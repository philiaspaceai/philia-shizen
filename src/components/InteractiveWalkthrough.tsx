import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Sparkles,
  ChevronRight,
  HelpCircle,
  Volume2,
  BookOpen,
  Check,
  Compass,
  ArrowRight,
  Layers,
  Zap,
} from 'lucide-react';
import { Language, t } from '../utils/i18n';
import { playHiraganaAudio } from '../utils/audio';

interface InteractiveWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export default function InteractiveWalkthrough({
  isOpen,
  onClose,
  language,
}: InteractiveWalkthroughProps) {
  const [step, setStep] = useState(1);
  const totalSteps = 7;

  // Simulator Card State
  const [simFlipped, setSimFlipped] = useState(false);
  const [simSelectedRating, setSimSelectedRating] = useState<string | null>(null);

  const handleNext = () => {
    if (step < totalSteps) {
      setStep((s) => s + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((s) => s - 1);
    }
  };

  const handleFinish = () => {
    localStorage.setItem('shizen_walkthrough_completed', 'true');
    onClose();
    // Reset steps for next open
    setStep(1);
    setSimFlipped(false);
    setSimSelectedRating(null);
  };

  const playSimAudio = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    playHiraganaAudio('あ');
  };

  const handleSimCardTap = () => {
    setSimFlipped(!simFlipped);
    if (!simFlipped) {
      playSimAudio();
    }
  };

  const handleSimRating = (rating: string) => {
    setSimSelectedRating(rating);
    // Auto advance step after 1 second to show they rated it!
    setTimeout(() => {
      setStep(6);
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="walkthrough-modal">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleFinish}
          className="absolute inset-0 bg-[#3C3630]/60 backdrop-blur-sm"
          id="walkthrough-backdrop"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-md bg-[#FBF9F6] border border-[#D5C9B9]/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col justify-between max-h-[90vh]"
          id="walkthrough-dialog"
        >
          {/* Top Progress bar */}
          <div className="h-1.5 w-full bg-[#EAE3D5]/40 flex" id="walkthrough-progress-track">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-full flex-grow transition-all duration-300 ${
                  i < step ? 'bg-[#6B7F6D]' : 'bg-transparent'
                }`}
              />
            ))}
          </div>

          {/* Dialog Header */}
          <div className="px-5 pt-4 pb-2 flex items-center justify-between border-b border-[#D5C9B9]/15" id="walkthrough-header">
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-[#D7A48F]" />
              <span className="text-[10px] uppercase font-serif font-bold tracking-widest text-[#8A7E72]">
                {language === 'ja'
                  ? `ガイド • ステップ ${step}/${totalSteps}`
                  : language === 'id'
                  ? `Panduan • Langkah ${step}/${totalSteps}`
                  : `Guide • Step ${step}/${totalSteps}`}
              </span>
            </div>
            <button
              onClick={handleFinish}
              className="p-1 rounded-full text-[#8A7E72] hover:text-[#4A433D] hover:bg-[#EAE3D5]/20 transition-all"
              id="btn-close-walkthrough"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Core Content View */}
          <div className="p-5 flex-grow overflow-y-auto space-y-5" id="walkthrough-content">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-4 text-center py-4"
                >
                  <div className="mx-auto w-14 h-14 rounded-full bg-[#6B7F6D]/10 flex items-center justify-center text-[#6B7F6D]">
                    <Sparkles className="w-7 h-7 stroke-[1.5]" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-xl font-serif font-bold text-[#4A433D]">
                      {language === 'ja'
                        ? '「自然 Shizen」へようこそ！'
                        : language === 'id'
                        ? 'Selamat Datang di Shizen!'
                        : 'Welcome to Shizen!'}
                    </h3>
                    <p className="text-xs text-[#8A7E72] italic font-serif">
                      {language === 'ja'
                        ? 'ひらがな・カタカナを科学的・直感的に暗記する'
                        : language === 'id'
                        ? 'Menghafal Hiragana & Katakana secara ilmiah & intuitif'
                        : 'Scientific & intuitive memorization for Hiragana & Katakana'}
                    </p>
                  </div>
                  <div className="bg-[#F4EFE6] border border-[#D5C9B9]/40 p-4 rounded-2xl text-left space-y-2.5">
                    <h4 className="text-xs font-serif font-bold text-[#4A433D] flex items-center space-x-1.5">
                      <Zap className="w-3.5 h-3.5 text-[#D7A48F]" />
                      <span>
                        {language === 'ja'
                          ? 'なぜShizenは他と違うのか？'
                          : language === 'id'
                          ? 'Mengapa Shizen Berbeda?'
                          : 'Why is Shizen Different?'}
                      </span>
                    </h4>
                    <p className="text-xs text-[#3C3630]/90 leading-relaxed font-serif">
                      {language === 'ja'
                        ? 'Shizenは単なるフラッシュカードではありません。最先端の「FSRS（間隔反復）」アルゴリズムを搭載。脳がちょうど忘れそうになる最適なタイミングを計算して、復習予定を自動で組みます。これにより無駄な反復を極限まで減らします。'
                        : language === 'id'
                        ? 'Shizen bukan sekadar flashcard biasa. Aplikasi ini menggunakan algoritma canggih FSRS (Free Spaced Repetition Scheduler). Shizen menghitung kapan otak Anda hampir melupakan suatu huruf dan menjadwalkannya saat itu juga, menghemat waktu belajar Anda!'
                        : 'Shizen is not a traditional flashcard app. It is powered by the advanced FSRS (Free Spaced Repetition Scheduler) algorithm. It calculates exactly when your brain is about to forget each kana and reviews it at the perfect moment, maximizing your learning speed!'}
                    </p>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-4"
                >
                  <div className="mx-auto w-14 h-14 rounded-full bg-[#D7A48F]/10 flex items-center justify-center text-[#D7A48F]">
                    <Layers className="w-7 h-7 stroke-[1.5]" />
                  </div>
                  <div className="space-y-2 text-center">
                    <h3 className="text-base font-serif font-bold text-[#4A433D]">
                      {language === 'ja'
                        ? '学習システムを選択する'
                        : language === 'id'
                        ? 'Pilih Sistem Belajar'
                        : 'Select Your System'}
                    </h3>
                    <p className="text-xs text-[#8A7E72] leading-relaxed max-w-xs mx-auto">
                      {language === 'ja'
                        ? 'トップ画面にあるタブを切り替えるだけで、学習対象を簡単にカスタマイズできます。'
                        : language === 'id'
                        ? 'Anda dapat memilih jenis aksara Jepang yang ingin difokuskan secara dinamis.'
                        : 'You can dynamically choose which writing system to focus on with a simple tap.'}
                    </p>
                  </div>

                  <div className="p-3 bg-[#EAE3D5]/20 border border-[#D5C9B9]/30 rounded-2xl space-y-2">
                    <div className="grid grid-cols-3 gap-1 p-0.5 bg-[#EAE3D5]/30 rounded-lg border border-[#D5C9B9]/20">
                      <div className="py-1 rounded text-[9px] font-serif font-bold uppercase text-center bg-[#6B7F6D] text-white">
                        {t('all_kana_tab', language)}
                      </div>
                      <div className="py-1 rounded text-[9px] font-serif font-semibold uppercase text-center text-[#8A7E72]">
                        {t('hiragana_tab', language)}
                      </div>
                      <div className="py-1 rounded text-[9px] font-serif font-semibold uppercase text-center text-[#8A7E72]">
                        {t('katakana_tab', language)}
                      </div>
                    </div>
                    <ul className="text-[11px] text-[#3C3630] font-serif space-y-1.5 px-1 pt-1">
                      <li className="flex items-start space-x-1.5">
                        <span className="text-[#6B7F6D] mt-0.5">•</span>
                        <span>
                          {language === 'ja'
                            ? 'ひらがな: 日本語の基本。まず最初にマスターしましょう。'
                            : language === 'id'
                            ? 'Hiragana: Dasar bahasa Jepang. Mulailah dari sini.'
                            : 'Hiragana: The native Japanese script. Ideal for beginners.'}
                        </span>
                      </li>
                      <li className="flex items-start space-x-1.5">
                        <span className="text-[#6B7F6D] mt-0.5">•</span>
                        <span>
                          {language === 'ja'
                            ? 'カタカナ: 外来語や強調表記。中級へのファーストステップ。'
                            : language === 'id'
                            ? 'Katakana: Digunakan untuk kata serapan asing.'
                            : 'Katakana: Used for foreign loanwords and names.'}
                        </span>
                      </li>
                    </ul>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-4"
                >
                  <div className="mx-auto w-14 h-14 rounded-full bg-[#6B7F6D]/10 flex items-center justify-center text-[#6B7F6D]">
                    <Compass className="w-7 h-7 stroke-[1.5]" />
                  </div>
                  <div className="space-y-2 text-center">
                    <h3 className="text-base font-serif font-bold text-[#4A433D]">
                      {language === 'ja'
                        ? '毎日のジャーニー（新規 vs 復習）'
                        : language === 'id'
                        ? 'Perjalanan Harian (Baru vs Tinjauan)'
                        : 'Your Daily Journey (New vs Reviews)'}
                    </h3>
                    <p className="text-xs text-[#8A7E72] leading-relaxed">
                      {language === 'ja'
                        ? '効率的な暗記には、復習が何より大切です。'
                        : language === 'id'
                        ? 'Untuk menjaga ingatan, peninjauan (reviews) adalah kunci utama.'
                        : 'Reviewing is critical to preventing memory decay over time.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#F4EFE6] border border-[#D5C9B9]/50 p-3.5 rounded-2xl space-y-1">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-[#6B7F6D]">
                        {language === 'ja' ? '新規カード' : language === 'id' ? 'Item Baru' : 'New Cards'}
                      </span>
                      <p className="text-[11px] text-[#3C3630]/90 leading-relaxed font-serif">
                        {language === 'ja'
                          ? '毎日新しい仮名（既定20文字）が紹介され、復習ループに入ります。'
                          : language === 'id'
                          ? 'Karakter baru yang ditambahkan ke memori Anda setiap harinya.'
                          : 'Unseen characters introduced to your memory loop each day.'}
                      </p>
                    </div>

                    <div className="bg-[#FAF0ED] border border-[#EACCC7] p-3.5 rounded-2xl space-y-1">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-[#AC5042]">
                        {language === 'ja' ? '復習カード (Due)' : language === 'id' ? 'Tinjauan (Due)' : 'Reviews Due'}
                      </span>
                      <p className="text-[11px] text-[#3C3630]/90 leading-relaxed font-serif">
                        {language === 'ja'
                          ? '復習は期限が来たらすぐに解きましょう。 retention（定着率）を保ちます。'
                          : language === 'id'
                          ? 'Item yang harus ditinjau ulang sebelum Anda lupa.'
                          : 'Learned characters that must be reviewed to strengthen memory.'}
                      </p>
                    </div>
                  </div>
                  <p className="text-[10px] text-center italic text-[#8A7E72] font-serif">
                    {language === 'ja'
                      ? '※ 復習カードがある場合は、常に優先して学習することをお勧めします。'
                      : language === 'id'
                      ? '* Selalu prioritaskan meninjau (Review) kartu sebelum mempelajari yang Baru.'
                      : '* Always prioritize completing Reviews before studying New items.'}
                  </p>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-4"
                >
                  <div className="text-center space-y-1.5">
                    <h3 className="text-base font-serif font-bold text-[#4A433D]">
                      {language === 'ja'
                        ? '【体験】1. カードをタップしてめくる'
                        : language === 'id'
                        ? '【Praktik】1. Ketuk Kartu untuk Membalik'
                        : '【Try It!】1. Tap Card to Flip'}
                    </h3>
                    <p className="text-xs text-[#8A7E72]">
                      {language === 'ja'
                        ? '下のカードを実際にタップして、裏側の回答と音声を確認してみましょう！'
                        : language === 'id'
                        ? 'Ketuk kartu simulator di bawah untuk membalik, melihat romaji & memutar audio.'
                        : 'Tap the simulator card below to flip, reveal the romaji, and hear the clear audio.'}
                    </p>
                  </div>

                  {/* Tactile Card Simulator */}
                  <div className="perspective-1000 h-[170px] w-full max-w-[260px] mx-auto">
                    <div
                      onClick={handleSimCardTap}
                      className={`relative w-full h-full transition-transform duration-300 transform-style-3d cursor-pointer ${
                        simFlipped ? 'rotate-y-180' : ''
                      }`}
                      id="sim-card-flipper"
                    >
                      {/* Sim Card Front */}
                      <div className="absolute inset-0 w-full h-full backface-hidden bg-[#F4EFE6] border border-[#D5C9B9] rounded-2xl shadow-sm flex flex-col justify-between p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-mono text-[#D5C9B9]">No. 1</span>
                          <span className="text-[8px] bg-[#6B7F6D]/15 text-[#6B7F6D] px-1.5 py-0.5 rounded-full border border-[#6B7F6D]/20 uppercase">
                            Simulator
                          </span>
                        </div>
                        <div className="text-center flex items-center justify-center">
                          <h1 className="text-5xl font-serif font-medium text-[#4A433D] select-none">
                            あ
                          </h1>
                        </div>
                        <div className="text-center text-[9px] text-[#8A7E72] italic font-serif">
                          {language === 'ja' ? 'タップしてめくる' : language === 'id' ? 'Ketuk untuk membalik' : 'Tap to reveal'}
                        </div>
                      </div>

                      {/* Sim Card Back */}
                      <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-[#F4EFE6] border border-[#D5C9B9] rounded-2xl shadow-sm flex flex-col justify-between p-4">
                        <div className="flex justify-between items-center border-b border-[#D5C9B9]/30 pb-1">
                          <span className="text-[10px] font-mono text-[#8A7E72]">No. 1</span>
                          <button
                            onClick={playSimAudio}
                            className="w-6 h-6 rounded-full bg-[#EAE3D5] text-[#6B7F6D] flex items-center justify-center hover:bg-[#6B7F6D] hover:text-[#FBF9F6] transition-all"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-center space-y-0.5">
                          <h2 className="text-2xl font-serif text-[#4A433D] font-bold">あ</h2>
                          <p className="text-base font-serif tracking-wider font-light text-[#D7A48F] uppercase">
                            a
                          </p>
                        </div>
                        <div className="text-[9px] italic text-[#8A7E72] text-center font-serif">
                          {language === 'ja' ? 'ひらがなの「あ」' : language === 'id' ? 'Huruf "a" pertama' : 'First sound of Hiragana'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {simFlipped && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-center"
                      >
                        <button
                          onClick={() => setStep(5)}
                          className="bg-[#6B7F6D] text-white text-xs font-serif px-4 py-2 rounded-xl inline-flex items-center space-x-1 hover:bg-[#5A6D5C] transition-all"
                        >
                          <span>{language === 'ja' ? '評価へ進む' : language === 'id' ? 'Lanjut ke Penilaian' : 'Go to Rating Step'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {step === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-4"
                >
                  <div className="text-center space-y-1.5">
                    <h3 className="text-base font-serif font-bold text-[#4A433D]">
                      {language === 'ja'
                        ? '【体験】2. 最も重要な４つの評価ボタン'
                        : language === 'id'
                        ? '【Praktik】2. Empat Tombol Penilaian FSRS'
                        : '【Try It!】2. The Crucial 4 Rating Buttons'}
                    </h3>
                    <p className="text-xs text-[#8A7E72] leading-relaxed">
                      {language === 'ja'
                        ? 'Shizenは通常の正誤クイズではありません。脳の記憶定着度に合わせて以下の4つから自己評価します。ボタンを1回タップして進めてみましょう。'
                        : language === 'id'
                        ? 'Ini adalah bagian paling penting. Shizen menggunakan 4 tombol untuk mencatat ingatan Anda secara akurat. Pilih salah satu tombol di bawah!'
                        : 'Unlike classic quizzes, you rate how easily you recalled the item. Tap any button below to see what it does and advance.'}
                    </p>
                  </div>

                  {/* Simulator Buttons grid */}
                  <div className="grid grid-cols-4 gap-2 py-2" id="sim-score-buttons">
                    {/* Again */}
                    <button
                      onClick={() => handleSimRating('Again')}
                      className={`flex flex-col items-center justify-center rounded-xl py-2 px-1 transition-all border ${
                        simSelectedRating === 'Again'
                          ? 'bg-[#FAF0ED] border-[#AC5042] scale-95 ring-2 ring-[#AC5042]/20'
                          : 'bg-[#FAF0ED]/60 border-[#EACCC7] hover:bg-[#FAF0ED]'
                      }`}
                    >
                      <span className="text-[9px] uppercase tracking-wider text-[#AC5042] font-semibold">
                        {t('again', language)}
                      </span>
                      <span className="text-[8px] text-[#AC5042]/70 font-mono mt-0.5">1m</span>
                    </button>

                    {/* Hard */}
                    <button
                      onClick={() => handleSimRating('Hard')}
                      className={`flex flex-col items-center justify-center rounded-xl py-2 px-1 transition-all border ${
                        simSelectedRating === 'Hard'
                          ? 'bg-[#FCF7F1] border-[#A17E5E] scale-95 ring-2 ring-[#A17E5E]/20'
                          : 'bg-[#FCF7F1]/60 border-[#E9DFD0] hover:bg-[#FCF7F1]'
                      }`}
                    >
                      <span className="text-[9px] uppercase tracking-wider text-[#A17E5E] font-semibold">
                        {t('hard', language)}
                      </span>
                      <span className="text-[8px] text-[#A17E5E]/70 font-mono mt-0.5">12h</span>
                    </button>

                    {/* Good */}
                    <button
                      onClick={() => handleSimRating('Good')}
                      className={`flex flex-col items-center justify-center rounded-xl py-2 px-1 transition-all border ${
                        simSelectedRating === 'Good'
                          ? 'bg-[#F1F5F2] border-[#4E6150] scale-95 ring-2 ring-[#4E6150]/20'
                          : 'bg-[#F1F5F2]/60 border-[#CCD7CE] hover:bg-[#F1F5F2]'
                      }`}
                    >
                      <span className="text-[9px] uppercase tracking-wider text-[#4E6150] font-semibold">
                        {t('good', language)}
                      </span>
                      <span className="text-[8px] text-[#4E6150]/70 font-mono mt-0.5">3d</span>
                    </button>

                    {/* Easy */}
                    <button
                      onClick={() => handleSimRating('Easy')}
                      className={`flex flex-col items-center justify-center rounded-xl py-2 px-1 transition-all border ${
                        simSelectedRating === 'Easy'
                          ? 'bg-[#F0F5F6] border-[#496570] scale-95 ring-2 ring-[#496570]/20'
                          : 'bg-[#F0F5F6]/60 border-[#CBD7D9] hover:bg-[#F0F5F6]'
                      }`}
                    >
                      <span className="text-[9px] uppercase tracking-wider text-[#496570] font-semibold">
                        {t('easy', language)}
                      </span>
                      <span className="text-[8px] text-[#496570]/70 font-mono mt-0.5">7d</span>
                    </button>
                  </div>

                  <div className="bg-[#FAF6F1] p-3 rounded-xl space-y-1.5 text-[11px] leading-relaxed text-[#3C3630] font-serif border border-[#D5C9B9]/30">
                    <p className="font-semibold text-[#4A433D]">
                      {language === 'ja' ? '💡 各ボタンの基準と役割:' : language === 'id' ? '💡 Panduan Memilih Nilai:' : '💡 What do they mean?'}
                    </p>
                    <ul className="space-y-1 pl-1">
                      <li>
                        <strong className="text-[#AC5042]">{t('again', language)}</strong>:{' '}
                        {language === 'ja'
                          ? '完全に忘れていました。1分以内に再度出題されます。'
                          : language === 'id'
                          ? 'Sama sekali lupa. Kartu muncul lagi dalam 1 menit.'
                          : 'Completely forgot. Appears again in 1 minute to relearn.'}
                      </li>
                      <li>
                        <strong className="text-[#A17E5E]">{t('hard', language)}</strong>:{' '}
                        {language === 'ja'
                          ? 'ギリギリ思い出せました。感覚が鈍っているため、短期間で再度復習。'
                          : language === 'id'
                          ? 'Ingat tapi ragu-ragu. Dijadwal ulang dalam waktu dekat.'
                          : 'Correct with heavy effort. Scheduled again soon.'}
                      </li>
                      <li>
                        <strong className="text-[#4E6150]">{t('good', language)}</strong>:{' '}
                        {language === 'ja'
                          ? '標準的な努力で思い出せました。これが基本の選択です。'
                          : language === 'id'
                          ? 'Ingat secara normal. Pilihan standar terbaik.'
                          : 'Correct with normal effort. This is the optimal, standard selection.'}
                      </li>
                      <li>
                        <strong className="text-[#496570]">{t('easy', language)}</strong>:{' '}
                        {language === 'ja'
                          ? '一瞬で迷わず思い出せました。次回はかなり長期間に設定されます。'
                          : language === 'id'
                          ? 'Sangat mudah & spontan. Interval berikutnya sangat panjang.'
                          : 'Instant recall. Scheduled far into the future.'}
                      </li>
                    </ul>
                  </div>
                </motion.div>
              )}

              {step === 6 && (
                <motion.div
                  key="step6"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-4"
                >
                  <div className="mx-auto w-14 h-14 rounded-full bg-[#D7A48F]/10 flex items-center justify-center text-[#D7A48F]">
                    <BookOpen className="w-7 h-7 stroke-[1.5]" />
                  </div>
                  <div className="space-y-2 text-center">
                    <h3 className="text-base font-serif font-bold text-[#4A433D]">
                      {language === 'ja'
                        ? 'ライブラリで詳細な統計を確認'
                        : language === 'id'
                        ? 'Perpustakaan & Statistik Rinci'
                        : 'Explore Library & Memory Stats'}
                    </h3>
                    <p className="text-xs text-[#8A7E72] leading-relaxed">
                      {language === 'ja'
                        ? '学習済みのカードはライブラリタブに自動登録。'
                        : language === 'id'
                        ? 'Akses detail kognitif untuk setiap huruf di tab Perpustakaan.'
                        : 'Learned cards are added to your personal Library catalog.'}
                    </p>
                  </div>

                  <div className="bg-[#F4EFE6] border border-[#D5C9B9]/50 p-4 rounded-2xl space-y-2 font-serif text-xs">
                    <div className="flex justify-between pb-1.5 border-b border-[#D5C9B9]/30 text-[10px] text-[#8A7E72] font-mono">
                      <span>{language === 'ja' ? '評価項目' : language === 'id' ? 'Variabel Memori' : 'Memory Metrics'}</span>
                      <span>{language === 'ja' ? '意味' : language === 'id' ? 'Makna' : 'Significance'}</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="font-semibold text-[#4A433D]">{t('stability', language)}</span>
                      <span className="text-[#8A7E72] text-right">
                        {language === 'ja'
                          ? '記憶の強さ（次回忘れるまでの日数）'
                          : language === 'id'
                          ? 'Kekuatan memori (hari menuju lupa)'
                          : 'Memory strength (days until you forget)'}
                      </span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="font-semibold text-[#4A433D]">{t('difficulty', language)}</span>
                      <span className="text-[#8A7E72] text-right">
                        {language === 'ja'
                          ? '文字自体の難しさ。評価によって自動調整'
                          : language === 'id'
                          ? 'Tingkat kesulitan bawaan huruf ini'
                          : 'Subjective complexity of the item'}
                      </span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="font-semibold text-[#4A433D]">{t('repetitions', language)}</span>
                      <span className="text-[#8A7E72] text-right">
                        {language === 'ja' ? 'これまでの学習総回数' : language === 'id' ? 'Total belajar' : 'Total review cycles'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 7 && (
                <motion.div
                  key="step7"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-4 text-center py-4"
                >
                  <div className="mx-auto w-14 h-14 rounded-full bg-[#6B7F6D] text-white flex items-center justify-center">
                    <Check className="w-7 h-7 stroke-[2.5]" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-xl font-serif font-bold text-[#4A433D]">
                      {language === 'ja' ? '準備完了です！' : language === 'id' ? 'Anda Siap Belajar!' : "You're All Set!"}
                    </h3>
                    <p className="text-xs text-[#8A7E72]">
                      {language === 'ja'
                        ? '間隔反復の旅、美しき禅の学びが今ここから始まります。'
                        : language === 'id'
                        ? 'Perjalanan belajar berjarak Zen Anda dimulai sekarang.'
                        : 'Your elegant cognitive Japanese journey starts now.'}
                    </p>
                  </div>
                  <p className="text-xs text-[#3C3630]/90 leading-relaxed font-serif bg-[#F4EFE6] border border-[#D5C9B9]/40 p-4 rounded-2xl">
                    {language === 'ja'
                      ? '毎日少しずつの継続が、信じられないほどの高い記憶定着を実現します。さあ、最初の「新規カード」の学習を開始しましょう！'
                      : language === 'id'
                      ? 'Konsistensi harian kecil akan membuahkan hasil luar biasa berkat FSRS. Mari mulai mempelajari batch pertama Anda hari ini!'
                      : 'Small daily practices build rock-solid long-term memory via FSRS. Let\'s begin studying your first batch!'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Dialog Footer Actions */}
          <div className="px-5 py-4 border-t border-[#D5C9B9]/15 flex items-center justify-between bg-[#F4EFE6]/30" id="walkthrough-footer">
            {step > 1 ? (
              <button
                onClick={handleBack}
                className="text-xs font-serif font-medium text-[#8A7E72] hover:text-[#4A433D] transition-all px-3 py-2 rounded-lg"
                id="btn-walkthrough-back"
              >
                {language === 'ja' ? '戻る' : language === 'id' ? 'Kembali' : 'Back'}
              </button>
            ) : (
              <div /> // Spacer
            )}

            <button
              onClick={handleNext}
              className="bg-[#6B7F6D] hover:bg-[#5A6D5C] text-white text-xs font-serif font-medium py-2.5 px-5 rounded-xl flex items-center space-x-1 transition-all shadow-sm"
              id="btn-walkthrough-next"
            >
              <span>
                {step === totalSteps
                  ? language === 'ja'
                    ? '完了する'
                    : language === 'id'
                    ? 'Selesai'
                    : 'Finish'
                  : language === 'ja'
                  ? '次へ'
                  : language === 'id'
                  ? 'Berikutnya'
                  : 'Next'}
              </span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
