import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'USDC'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency === 'USDC' ? 'USD' : currency,
    maximumFractionDigits: 0,
  }).format(amount).replace('$', '') + ' ' + currency;
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ru-RU').format(num);
}

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function shortenHash(hash?: string, chars: number = 6): string {
  if (!hash) return '';
  if (hash.length <= chars * 2 + 2) return hash;
  return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`;
}

export function getMilestoneStatusInfo(status: string) {
  switch (status) {
    case 'approved':
      return {
        label: 'Одобрено AI / Выплачено',
        color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        badgeColor: 'bg-emerald-500',
        icon: 'CheckCircle2',
      };
    case 'submitted':
      return {
        label: 'Чек на AI-проверке',
        color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
        badgeColor: 'bg-blue-500',
        icon: 'Clock',
      };
    case 'rejected':
      return {
        label: 'Отклонено AI / Фрод',
        color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
        badgeColor: 'bg-rose-500',
        icon: 'XCircle',
      };
    case 'expired':
      return {
        label: 'Дедлайн просрочен',
        color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
        badgeColor: 'bg-amber-500',
        icon: 'AlertTriangle',
      };
    default:
      return {
        label: 'В ожидании закупки',
        color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30',
        badgeColor: 'bg-slate-400',
        icon: 'CircleDot',
      };
  }
}

export function getStageTypeLabel(stageType: string): string {
  switch (stageType) {
    case 'procurement':
      return 'Закупка у поставщика';
    case 'distribution':
      return 'Логистика и выдача';
    case 'reporting':
      return 'Акты распределения и бенефициары';
    default:
      return 'Этап миссии';
  }
}
