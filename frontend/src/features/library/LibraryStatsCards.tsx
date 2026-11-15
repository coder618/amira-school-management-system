import React from 'react';
import { BookOpen, Layers, CheckCircle2, Bookmark, AlertCircle } from 'lucide-react';
import { LibraryStats } from '../../types';

interface LibraryStatsCardsProps {
  stats: LibraryStats | null;
  loading?: boolean;
}

export const LibraryStatsCards: React.FC<LibraryStatsCardsProps> = ({ stats, loading }) => {
  const cards = [
    {
      title: 'Total Titles',
      value: stats ? stats.total_books.toLocaleString() : '0',
      icon: BookOpen,
      iconColor: 'text-indigo-600',
      bgLight: 'bg-indigo-50',
      description: 'Unique book titles',
    },
    {
      title: 'Total Copies',
      value: stats ? stats.total_copies.toLocaleString() : '0',
      icon: Layers,
      iconColor: 'text-blue-600',
      bgLight: 'bg-blue-50',
      description: 'Inventory copies in stock',
    },
    {
      title: 'Available Copies',
      value: stats ? stats.available_copies.toLocaleString() : '0',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
      bgLight: 'bg-emerald-50',
      description: 'Ready for student checkout',
    },
    {
      title: 'Currently Issued',
      value: stats ? stats.active_issues.toLocaleString() : '0',
      icon: Bookmark,
      iconColor: 'text-amber-600',
      bgLight: 'bg-amber-50',
      description: 'In circulation with students',
    },
    {
      title: 'Overdue Books',
      value: stats ? stats.overdue_issues.toLocaleString() : '0',
      icon: AlertCircle,
      iconColor: 'text-rose-600',
      bgLight: 'bg-rose-50',
      description: 'Past due date returns',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        return (
          <div
            key={idx}
            className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {card.title}
              </span>
              <div className={`p-2 rounded-lg ${card.bgLight} ${card.iconColor}`}>
                <IconComponent className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-800">
                {loading ? (
                  <span className="inline-block w-8 h-6 bg-slate-100 animate-pulse rounded" />
                ) : (
                  card.value
                )}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400 truncate">{card.description}</p>
          </div>
        );
      })}
    </div>
  );
};
