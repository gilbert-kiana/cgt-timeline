'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Home } from 'lucide-react';
import { Property, TimelineEvent } from '@/store/timeline';
import EventCircle from './EventCircle';
import PropertyStatusBands from './PropertyStatusBands';
import { cn, dateToPosition } from '@/lib/utils';

interface PropertyBranchProps {
  property: Property;
  events: TimelineEvent[];
  branchIndex: number;
  onDragStart: (eventId: string) => void;
  isSelected: boolean;
  timelineStart: Date;
  timelineEnd: Date;
  onEventClick: (event: TimelineEvent) => void;
  draggedEventId?: string | null;
}

export default function PropertyBranch({
  property,
  events,
  branchIndex,
  onDragStart,
  isSelected,
  timelineStart,
  timelineEnd,
  onEventClick,
  draggedEventId,
}: PropertyBranchProps) {
  const branchY = 100 + branchIndex * 120; // Vertical spacing between branches

  // Calculate positions from dates for each event
  const eventsWithPositions = events.map(event => ({
    ...event,
    calculatedPosition: dateToPosition(event.date, timelineStart, timelineEnd)
  }));

  // Sort events by DATE (chronological order)
  const sortedEvents = [...eventsWithPositions].sort((a, b) =>
    a.date.getTime() - b.date.getTime()
  );

  // Assign tiers to avoid label overlap
  const assignLabelTiers = () => {
    const LABEL_MIN_SPACING = 8; // Minimum horizontal spacing in percentage points
    const MAX_TIERS = 4; // Maximum number of tiers

    interface PlacedLabel {
      startPos: number;
      endPos: number;
      tier: number;
    }

    const placedLabels: PlacedLabel[] = [];

    return sortedEvents.map((event) => {
      // Estimate label width based on title length (rough approximation)
      const estimatedLabelWidth = Math.min(event.title.length * 0.5, 12); // in percentage points
      const startPos = event.calculatedPosition - estimatedLabelWidth / 2;
      const endPos = event.calculatedPosition + estimatedLabelWidth / 2;

      // Find the lowest tier where this label doesn't overlap with existing labels
      let assignedTier = 0;

      for (let tier = 0; tier < MAX_TIERS; tier++) {
        const labelsInTier = placedLabels.filter(l => l.tier === tier);

        // Check if there's overlap with any label in this tier
        const hasOverlap = labelsInTier.some(placed => {
          return !(endPos + LABEL_MIN_SPACING < placed.startPos ||
                   startPos - LABEL_MIN_SPACING > placed.endPos);
        });

        if (!hasOverlap) {
          assignedTier = tier;
          break;
        }
      }

      // Place the label
      placedLabels.push({ startPos, endPos, tier: assignedTier });

      return {
        ...event,
        tier: assignedTier
      };
    });
  };

  const eventsWithTiers = assignLabelTiers();

  const purchaseEvent = sortedEvents.find(e => e.type === 'purchase') || sortedEvents[0];
  const labelXPosition = purchaseEvent ? Math.max(1, Math.min(99, purchaseEvent.calculatedPosition)) : 5;

  const LABEL_WIDTH = 300;
  const LABEL_HEIGHT = 40;
  const LABEL_GAP = 40;
  const LEFT_MARGIN_THRESHOLD = 8;
  const isLeftMargin = labelXPosition <= LEFT_MARGIN_THRESHOLD;
  const labelY = branchY - LABEL_HEIGHT / 2 + 2;
  const labelX = isLeftMargin 
    ? `calc(${labelXPosition}% + ${LABEL_GAP}px)` 
    : `calc(${labelXPosition}% - ${LABEL_GAP}px - ${LABEL_WIDTH}px)`;

  // Generate branch path
  const generateBranchPath = () => {
    if (eventsWithTiers.length === 0) return '';

    let path = `M 0,${branchY}`;

    eventsWithTiers.forEach((event, index) => {
      const x = `${event.calculatedPosition}%`;

      if (index === 0) {
        // Smooth curve to first event
        path += ` Q ${event.calculatedPosition / 2}%,${branchY} ${x},${branchY}`;
      } else {
        // Connect to next event
        path += ` L ${x},${branchY}`;
      }
    });

    // Extend to end
    path += ` L 100%,${branchY}`;

    return path;
  };
  
  return (
    <g className="property-branch">
      {/* Status Bands - Show PPR/Rental/Vacant periods */}
      <PropertyStatusBands
        events={events}
        branchY={branchY}
        timelineStart={timelineStart}
        timelineEnd={timelineEnd}
        propertyColor={property.color}
      />

      {/* Branch Line */}
      <motion.path
        d={generateBranchPath()}
        fill="none"
        stroke={property.color}
        strokeWidth={isSelected ? 4 : 3}
        strokeLinecap="round"
        opacity={isSelected ? 1 : 0.7}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: "easeInOut" }}
        className="drop-shadow-sm"
      />
      
      {/* Branch Label - positioned next to purchase date */}
      <foreignObject 
        x={labelX} 
        y={labelY} 
        width={LABEL_WIDTH} 
        height={LABEL_HEIGHT}
      >
        <div className="flex items-center gap-3">
          <div 
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              isSelected && "ring-2 ring-offset-2 ring-slate-400"
            )}
            style={{ backgroundColor: '#000000' }}
          >
            <Home className="w-4 h-4" style={{ color: '#FFD54F' }} />
          </div>
          <span className={cn(
            "font-bold transition-all whitespace-nowrap overflow-hidden text-ellipsis max-w-[250px]",
            isSelected
              ? "text-slate-900 dark:text-slate-100"
              : "text-slate-700 dark:text-slate-300"
          )}
          style={{ fontSize: '18px' }}>
            {property.name}
          </span>
        </div>
      </foreignObject>
      
      {/* Event Circles */}
      {eventsWithTiers.map((event) => (
        <EventCircle
          key={event.id}
          event={event}
          cx={`${event.calculatedPosition}%`}
          cy={branchY}
          color={event.color}
          onClick={() => onEventClick(event)}
          tier={event.tier}
          onDragStart={onDragStart}
          draggedEventId={draggedEventId}
        />
      ))}
    </g>
  );
}
