import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function dateToPosition(date: Date, startDate: Date, endDate: Date): number {
  const total = endDate.getTime() - startDate.getTime();
  const current = date.getTime() - startDate.getTime();
  return (current / total) * 100;
}

export function positionToDate(position: number, startDate: Date, endDate: Date): Date {
  const total = endDate.getTime() - startDate.getTime();
  const offset = (position / 100) * total;
  return new Date(startDate.getTime() + offset);
}

export interface TimelineMarker {
  date: Date;
  position: number;
  label: string;
  type: 'year' | 'quarter' | 'month' | 'week' | 'day';
  isMinor?: boolean;
}

// Generate intelligent markers based on timeline range
export function generateTimelineMarkers(
  startDate: Date,
  endDate: Date
): TimelineMarker[] {
  const markers: TimelineMarker[] = [];
  const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  // Decade view (10+ years) - Show years only
  if (daysDiff >= 3650) {
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();

    for (let year = startYear; year <= endYear; year++) {
      const date = new Date(year, 0, 1);
      if (date >= startDate && date <= endDate) {
        markers.push({
          date,
          position: dateToPosition(date, startDate, endDate),
          label: year.toString(),
          type: 'year',
        });
      }
    }
  }
  // Multi-year view (5-10 years) - Show years
  else if (daysDiff >= 1825) {
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();

    for (let year = startYear; year <= endYear; year++) {
      const date = new Date(year, 0, 1);
      if (date >= startDate && date <= endDate) {
        markers.push({
          date,
          position: dateToPosition(date, startDate, endDate),
          label: year.toString(),
          type: 'year',
        });
      }
    }
  }
  // Years view (2-5 years) - Show years + quarters
  else if (daysDiff >= 730) {
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();

    for (let year = startYear; year <= endYear; year++) {
      // Add year marker
      const yearDate = new Date(year, 0, 1);
      if (yearDate >= startDate && yearDate <= endDate) {
        markers.push({
          date: yearDate,
          position: dateToPosition(yearDate, startDate, endDate),
          label: year.toString(),
          type: 'year',
        });
      }

      // Add quarter markers
      for (let q = 1; q <= 4; q++) {
        const month = (q - 1) * 3;
        const quarterDate = new Date(year, month, 1);
        if (quarterDate >= startDate && quarterDate <= endDate && month !== 0) {
          markers.push({
            date: quarterDate,
            position: dateToPosition(quarterDate, startDate, endDate),
            label: `Q${q}`,
            type: 'quarter',
            isMinor: true,
          });
        }
      }
    }
  }
  // Year view (1-2 years) - Show months
  else if (daysDiff >= 365) {
    let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

    while (current <= end) {
      if (current >= startDate && current <= endDate) {
        const isYearStart = current.getMonth() === 0;
        markers.push({
          date: new Date(current),
          position: dateToPosition(current, startDate, endDate),
          label: isYearStart
            ? current.getFullYear().toString()
            : current.toLocaleDateString('en-US', { month: 'short' }),
          type: isYearStart ? 'year' : 'month',
          isMinor: !isYearStart,
        });
      }
      current.setMonth(current.getMonth() + 1);
    }
  }
  // Months view (6-12 months) - Show months
  else if (daysDiff >= 180) {
    let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

    while (current <= end) {
      if (current >= startDate && current <= endDate) {
        markers.push({
          date: new Date(current),
          position: dateToPosition(current, startDate, endDate),
          label: current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          type: 'month',
        });
      }
      current.setMonth(current.getMonth() + 1);
    }
  }
  // Month view (3-6 months) - Show weeks
  else if (daysDiff >= 90) {
    let current = new Date(startDate);
    // Start on a Monday
    current.setDate(current.getDate() - current.getDay() + 1);

    while (current <= endDate) {
      if (current >= startDate) {
        const isMonthStart = current.getDate() <= 7;
        markers.push({
          date: new Date(current),
          position: dateToPosition(current, startDate, endDate),
          label: isMonthStart
            ? current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : current.getDate().toString(),
          type: isMonthStart ? 'month' : 'week',
          isMinor: !isMonthStart,
        });
      }
      current.setDate(current.getDate() + 7);
    }
  }
  // Weeks view (1-3 months) - Show days
  else if (daysDiff >= 30) {
    let current = new Date(startDate);
    current.setHours(0, 0, 0, 0);

    while (current <= endDate) {
      if (current >= startDate) {
        const isWeekStart = current.getDay() === 1;
        const isMonthStart = current.getDate() === 1;
        markers.push({
          date: new Date(current),
          position: dateToPosition(current, startDate, endDate),
          label: isMonthStart
            ? current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : current.getDate().toString(),
          type: isWeekStart ? 'week' : 'day',
          isMinor: !isWeekStart && !isMonthStart,
        });
      }
      current.setDate(current.getDate() + 1);
    }
  }
  // Days view (< 1 month) - Show all days
  else {
    let current = new Date(startDate);
    current.setHours(0, 0, 0, 0);

    while (current <= endDate) {
      if (current >= startDate) {
        const isMonthStart = current.getDate() === 1;
        markers.push({
          date: new Date(current),
          position: dateToPosition(current, startDate, endDate),
          label: isMonthStart
            ? current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : current.toLocaleDateString('en-US', { day: 'numeric', weekday: 'short' }),
          type: 'day',
        });
      }
      current.setDate(current.getDate() + 1);
    }
  }

  return markers;
}
