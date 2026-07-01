import { useState, useMemo } from 'react';
import { Card, State } from 'ts-fsrs';
import { Flame, Award, Calendar, BookOpen, RotateCcw, Play, TrendingUp } from 'lucide-react';
import { ReviewLog } from '../utils/fsrsService';
import { Language, t } from '../utils/i18n';

interface DashboardProps {
  cards: Record<number, Card>;
  logs: ReviewLog[];
  streak: number;
  newCardsPerDay: number;
  newCardsStudiedToday: number;
  selectedSystem: 'all' | 'hiragana' | 'katakana';
  onStartReview: () => void;
  onStartNewLearn: () => void;
  onResetProgress: () => void;
  language: Language;
}

export default function Dashboard({
  cards,
  logs,
  streak,
  newCardsPerDay,
  newCardsStudiedToday,
  selectedSystem,
  onStartReview,
  onStartNewLearn,
  onResetProgress,
  language,
}: DashboardProps) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const stats = useMemo(() => {
    const isHiragana = selectedSystem === 'hiragana';
    const isKatakana = selectedSystem === 'katakana';
    const totalCardsCount = selectedSystem === 'all' ? 2000 : 1000;

    const cardsArray = Object.entries(cards)
      .map(([key, card]) => ({ id: Number(key), ...card }))
      .filter((c) => {
        if (isHiragana) return c.id <= 1000;
        if (isKatakana) return c.id > 1000;
        return true;
      });

    // Counts by FSRS state
    let learningCount = 0;
    let reviewCount = 0;
    let relearningCount = 0;

    cardsArray.forEach((c) => {
      if (c.state === State.Learning) learningCount++;
      else if (c.state === State.Review) reviewCount++;
      else if (c.state === State.Relearning) relearningCount++;
    });

    const activeCount = learningCount + reviewCount + relearningCount;
    const newCount = totalCardsCount - activeCount;

    // Due cards check
    const now = new Date();
    const dueCount = cardsArray.filter((c) => c.due <= now && c.state !== State.New).length;

    // Calculate accuracy/retention from logs filtered by selected system
    const filteredLogs = logs.filter((log) => {
      if (isHiragana) return log.no <= 1000;
      if (isKatakana) return log.no > 1000;
      return true;
    });

    let goodEasyCount = 0;
    filteredLogs.forEach((log) => {
      if (log.rating >= 3) {
        goodEasyCount++;
      }
    });
    const retentionRate = filteredLogs.length > 0 ? Math.round((goodEasyCount / filteredLogs.length) * 100) : 100;

    return {
      totalCardsCount,
      newCount,
      learningCount,
      reviewCount,
      relearningCount,
      activeCount,
      dueCount,
      retentionRate,
      totalReviews: filteredLogs.length,
    };
  }, [cards, logs, selectedSystem]);

  // Generate data for the 7-day study chart
  const chartData = useMemo(() => {
    const days = [];
    const now = new Date();
    
    // Prepare 7 days including today
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      days.push({
        dateStr: d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' }),
        rawDate: d.toDateString(),
        count: 0,
      });
    }

    // Populate counts from logs
    logs.forEach((log) => {
      if (selectedSystem === 'hiragana' && log.no > 1000) return;
      if (selectedSystem === 'katakana' && log.no <= 1000) return;

      const logDateStr = new Date(log.reviewedAt).toDateString();
      const chartDay = days.find((day) => day.rawDate === logDateStr);
      if (chartDay) {
        chartDay.count++;
      }
    });

    return days;
  }, [logs, selectedSystem]);

  // Calculate coordinates for the SVG chart
  const svgDimensions = { width: 500, height: 180 };
  const padding = { top: 20, right: 30, bottom: 30, left: 40 };

  const chartPoints = useMemo(() => {
    const maxVal = Math.max(...chartData.map((d) => d.count), 5); // Fallback max value is 5 for empty states
    const xInterval = (svgDimensions.width - padding.left - padding.right) / 6;
    const usableHeight = svgDimensions.height - padding.top - padding.bottom;

    return chartData.map((d, index) => {
      const x = padding.left + index * xInterval;
      const y = padding.top + usableHeight - (d.count / maxVal) * usableHeight;
      return { x, y, val: d.count, label: d.dateStr };
    });
  }, [chartData, svgDimensions, padding]);

  const pathD = useMemo(() => {
    if (chartPoints.length === 0) return '';
    return chartPoints.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');
  }, [chartPoints]);

  const areaD = useMemo(() => {
    if (chartPoints.length === 0) return '';
    const first = chartPoints[0];
    const last = chartPoints[chartPoints.length - 1];
    const floorY = svgDimensions.height - padding.bottom;
    return `${pathD} L ${last.x} ${floorY} L ${first.x} ${floorY} Z`;
  }, [chartPoints, pathD, svgDimensions, padding]);

  return (
    <div className="space-y-6" id="dashboard-container">
      {/* Quick Greeting */}
      <div className="flex items-center justify-between bg-[#F4EFE6] border border-[#D5C9B9]/60 p-4 rounded-xl" id="dashboard-greet">
        <div className="space-y-1">
          <p className="text-xs text-[#8A7E72] tracking-wider uppercase font-medium">{t('daily_journey', language)}</p>
          <h2 className="text-lg font-serif text-[#4A433D] font-semibold">{t('welcome_title', language)}</h2>
        </div>
        <div className="flex items-center space-x-1.5 text-[#6B7F6D]">
          <Flame className="w-5 h-5 fill-current animate-pulse text-[#D7A48F]" />
          <span className="font-serif font-bold text-lg text-[#4A433D]">{t('streak_days', language, { streak })}</span>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-4" id="stats-grid">
        {/* Metric 1 */}
        <div className="bg-[#F4EFE6] border border-[#D5C9B9]/50 p-4 rounded-xl flex flex-col justify-between h-32" id="stat-due">
          <div className="flex justify-between items-start text-[#8A7E72]">
            <Calendar className="w-5 h-5 text-[#6B7F6D]" />
            <span className="text-xs tracking-wider uppercase font-medium">{t('due_today', language)}</span>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-serif font-bold text-[#4A433D]">{stats.dueCount}</span>
            <p className="text-xs text-[#8A7E72] mt-0.5">{t('reviews_awaiting', language)}</p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-[#F4EFE6] border border-[#D5C9B9]/50 p-4 rounded-xl flex flex-col justify-between h-32" id="stat-retention">
          <div className="flex justify-between items-start text-[#8A7E72]">
            <TrendingUp className="w-5 h-5 text-[#D7A48F]" />
            <span className="text-xs tracking-wider uppercase font-medium">{t('retention', language)}</span>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-serif font-bold text-[#4A433D]">{stats.retentionRate}%</span>
            <p className="text-xs text-[#8A7E72] mt-0.5">{t('accuracy_score', language)}</p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-[#F4EFE6] border border-[#D5C9B9]/50 p-4 rounded-xl flex flex-col justify-between h-32" id="stat-learned">
          <div className="flex justify-between items-start text-[#8A7E72]">
            <Award className="w-5 h-5 text-[#D7A48F]" />
            <span className="text-xs tracking-wider uppercase font-medium">{t('mastered', language)}</span>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-serif font-bold text-[#4A433D]">{stats.activeCount}</span>
            <p className="text-xs text-[#8A7E72] mt-0.5">{t('out_of_items', language, { total: stats.totalCardsCount.toLocaleString() })}</p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-[#F4EFE6] border border-[#D5C9B9]/50 p-4 rounded-xl flex flex-col justify-between h-32" id="stat-reviews">
          <div className="flex justify-between items-start text-[#8A7E72]">
            <BookOpen className="w-5 h-5 text-[#6B7F6D]" />
            <span className="text-xs tracking-wider uppercase font-medium">{t('total_logs', language)}</span>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-serif font-bold text-[#4A433D]">{stats.totalReviews}</span>
            <p className="text-xs text-[#8A7E72] mt-0.5">{t('sessions_complete', language)}</p>
          </div>
        </div>
      </div>

      {/* Action Prompts */}
      <div className="bg-[#F4EFE6] border border-[#D5C9B9]/60 p-5 rounded-xl space-y-4" id="study-actions">
        <div className="border-b border-[#D5C9B9]/40 pb-2 flex justify-between items-center">
          <h3 className="text-sm font-serif font-medium text-[#4A433D] tracking-wide">{t('begin_session', language)}</h3>
          <span className="text-[10px] font-mono font-bold text-[#6B7F6D] bg-[#CCD7CE]/30 px-2 py-0.5 rounded-full">
            {t('goal_new', language, { current: newCardsStudiedToday, max: newCardsPerDay })}
          </span>
        </div>

        {/* Daily Goal Progress Bar */}
        <div className="bg-[#EAE3D5]/40 border border-[#D5C9B9]/30 p-3 rounded-lg space-y-1.5" id="daily-goal-bar">
          <div className="flex justify-between items-center text-[10px] font-serif text-[#8A7E72]">
            <span>{t('todays_new_cards_progress', language)}</span>
            <span>{Math.round(Math.min(100, (newCardsStudiedToday / newCardsPerDay) * 100))}%</span>
          </div>
          <div className="h-1.5 w-full bg-[#EAE3D5] rounded-full overflow-hidden">
            <div
              style={{ width: `${Math.min(100, (newCardsStudiedToday / newCardsPerDay) * 100)}%` }}
              className="h-full bg-[#6B7F6D] transition-all duration-300"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {stats.dueCount > 0 ? (
            <button
              onClick={onStartReview}
              className="w-full bg-[#6B7F6D] hover:bg-[#5A6D5C] text-[#FBF9F6] font-serif font-medium py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-all shadow-sm"
              id="btn-due-review"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{t('review_due', language, { count: stats.dueCount })}</span>
            </button>
          ) : (
            <div className="text-center py-2 bg-[#EAE3D5] text-[#6B7F6D] rounded-lg text-xs font-serif italic border border-[#D5C9B9]/20">
              {t('no_due_cards', language)}
            </div>
          )}

          <button
            onClick={onStartNewLearn}
            className="w-full bg-[#D7A48F] hover:bg-[#C9927C] text-[#FBF9F6] font-serif font-medium py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-all shadow-sm"
            id="btn-new-learn"
          >
            <Flame className="w-4 h-4" />
            <span>
              {selectedSystem === 'hiragana'
                ? t('learn_hiragana', language)
                : selectedSystem === 'katakana'
                ? t('learn_katakana', language)
                : t('learn_kana', language)}
            </span>
          </button>
        </div>
      </div>

      {/* FSRS Learning State Distribution */}
      <div className="bg-[#F4EFE6] border border-[#D5C9B9]/50 p-5 rounded-xl space-y-3" id="fsrs-distribution">
        <h3 className="text-sm font-serif font-medium text-[#4A433D] tracking-wide">{t('fsrs_state_distribution', language)}</h3>
        
        <div className="space-y-2">
          {/* Progress Bar */}
          <div className="h-2.5 w-full bg-[#EAE3D5] rounded-full overflow-hidden flex" id="fsrs-dist-bar">
            <div
              style={{ width: `${(stats.newCount / stats.totalCardsCount) * 100}%` }}
              className="bg-[#D5C9B9]"
              title={`New: ${stats.newCount}`}
            />
            <div
              style={{ width: `${(stats.learningCount / stats.totalCardsCount) * 100}%` }}
              className="bg-[#D7A48F]"
              title={`Learning: ${stats.learningCount}`}
            />
            <div
              style={{ width: `${(stats.reviewCount / stats.totalCardsCount) * 100}%` }}
              className="bg-[#6B7F6D]"
              title={`Review: ${stats.reviewCount}`}
            />
            <div
              style={{ width: `${(stats.relearningCount / stats.totalCardsCount) * 100}%` }}
              className="bg-[#C56B5C]"
              title={`Relearning: ${stats.relearningCount}`}
            />
          </div>

          {/* Legend Table */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2 text-xs text-[#8A7E72]" id="fsrs-dist-legend">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 bg-[#D5C9B9] rounded-full" />
              <span>{t('new_kana', language)}: <b>{stats.newCount}</b></span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 bg-[#D7A48F] rounded-full" />
              <span>{t('learning', language)}: <b>{stats.learningCount}</b></span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 bg-[#6B7F6D] rounded-full" />
              <span>{t('in_review', language)}: <b>{stats.reviewCount}</b></span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 bg-[#C56B5C] rounded-full" />
              <span>{t('relearning', language)}: <b>{stats.relearningCount}</b></span>
            </div>
          </div>
        </div>
      </div>

      {/* Handcrafted minimalist SVG 7-Day Line Chart */}
      <div className="bg-[#F4EFE6] border border-[#D5C9B9]/50 p-5 rounded-xl space-y-3" id="study-logs-chart">
        <h3 className="text-sm font-serif font-medium text-[#4A433D] tracking-wide">{t('seven_day_frequency', language)}</h3>
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`}
            width="100%"
            height={svgDimensions.height}
            className="font-serif text-[10px] fill-[#8A7E72]"
          >
            {/* Grid Lines */}
            <line
              x1={padding.left}
              y1={padding.top}
              x2={svgDimensions.width - padding.right}
              y2={padding.top}
              stroke="#D5C9B9"
              strokeDasharray="2,4"
              strokeWidth="1"
              opacity="0.3"
            />
            <line
              x1={padding.left}
              y1={svgDimensions.height - padding.bottom}
              x2={svgDimensions.width - padding.right}
              y2={svgDimensions.height - padding.bottom}
              stroke="#D5C9B9"
              strokeWidth="1.5"
              opacity="0.5"
            />

            {/* Filled area under curve */}
            {chartPoints.length > 0 && (
              <path
                d={areaD}
                fill="url(#chartGrad)"
                opacity="0.15"
              />
            )}

            {/* Connecting curve line */}
            {chartPoints.length > 0 && (
              <path
                d={pathD}
                fill="none"
                stroke="#6B7F6D"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Gradients */}
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6B7F6D" />
                <stop offset="100%" stopColor="#6B7F6D" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Scatter points with values */}
            {chartPoints.map((p, index) => (
              <g key={index}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="4"
                  fill="#FBF9F6"
                  stroke="#6B7F6D"
                  strokeWidth="2"
                />
                <text
                  x={p.x}
                  y={p.y - 10}
                  textAnchor="middle"
                  className="font-bold fill-[#4A433D]"
                >
                  {p.val}
                </text>
                <text
                  x={p.x}
                  y={svgDimensions.height - 12}
                  textAnchor="middle"
                  className="fill-[#8A7E72]"
                >
                  {p.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Settings / Reset Section */}
      <div className="pt-6 border-t border-[#D5C9B9]/30" id="dashboard-danger-zone">
        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center space-x-1.5 text-xs text-[#C56B5C] hover:text-[#AC5042] font-serif transition-colors py-1 px-2.5 rounded border border-[#C56B5C]/20 hover:bg-[#C56B5C]/5"
            id="btn-show-reset"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('reset_learning_progress', language)}</span>
          </button>
        ) : (
          <div className="bg-[#FAF0ED] border border-[#EACCC7] p-4 rounded-lg space-y-3" id="reset-confirm-box">
            <p className="text-xs text-[#AC5042] font-serif leading-relaxed">
              {t('confirm_reset_progress', language)}
            </p>
            <div className="flex items-center space-x-3 text-xs">
              <button
                onClick={() => {
                  onResetProgress();
                  setShowResetConfirm(false);
                }}
                className="bg-[#C56B5C] text-[#FBF9F6] py-1.5 px-3 rounded hover:bg-[#AC5042] transition-colors font-serif"
                id="btn-confirm-reset"
              >
                {t('yes_reset_all', language)}
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="text-[#8A7E72] hover:text-[#4A433D] font-serif transition-colors"
                id="btn-cancel-reset"
              >
                {t('cancel', language)}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
