'use client';

import React from 'react';
import { TimelineEvent, calculateStatusPeriods, statusColors, PropertyStatus } from '@/store/timeline';
import { dateToPosition } from '@/lib/utils';

interface PropertyStatusBandsProps {
  events: TimelineEvent[];
  branchY: number;
  timelineStart: Date;
  timelineEnd: Date;
  propertyColor: string;
}

export default function PropertyStatusBands({
  events,
  branchY,
  timelineStart,
  timelineEnd,
  propertyColor,
}: PropertyStatusBandsProps) {
  const statusPeriods = calculateStatusPeriods(events);

  // Status labels for display
  const statusLabels: Record<PropertyStatus, string> = {
    ppr: 'PPR',
    rental: 'Rental',
    vacant: 'Vacant',
    construction: 'Construction',
    sold: 'Sold',
  };

  return (
    <g className="status-bands">
      {statusPeriods.map((period, index) => {
        const startPos = dateToPosition(period.startDate, timelineStart, timelineEnd);
        const endPos = period.endDate
          ? dateToPosition(period.endDate, timelineStart, timelineEnd)
          : 100; // If no end date, extend to end of timeline

        const width = endPos - startPos;

        // Only render if the period is visible in current timeline view
        if (endPos < 0 || startPos > 100 || width < 0.1) return null;

        const color = statusColors[period.status];
        const bandY = branchY + 15; // Position below the branch line
        const bandHeight = 8;

        return (
          <g key={`status-${index}`}>
            {/* Status band */}
            <rect
              x={`${Math.max(0, startPos)}%`}
              y={bandY}
              width={`${Math.min(100 - startPos, width)}%`}
              height={bandHeight}
              fill={color}
              opacity={0.4}
              rx={2}
            />

            {/* Status label (show if band is wide enough) */}
            {width > 5 && (
              <text
                x={`${startPos + width / 2}%`}
                y={bandY + bandHeight / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-[10px] font-bold fill-slate-800"
                style={{ pointerEvents: 'none' }}
              >
                {statusLabels[period.status]}
              </text>
            )}

            {/* Start marker */}
            <line
              x1={`${startPos}%`}
              x2={`${startPos}%`}
              y1={bandY}
              y2={bandY + bandHeight}
              stroke={color}
              strokeWidth="1.5"
              opacity={0.8}
            />

            {/* End marker (if period has ended) */}
            {period.endDate && (
              <line
                x1={`${endPos}%`}
                x2={`${endPos}%`}
                y1={bandY}
                y2={bandY + bandHeight}
                stroke={color}
                strokeWidth="1.5"
                opacity={0.8}
              />
            )}
          </g>
        );
      })}
    </g>
  );
}
