'use client';

import React from 'react';
import { motion } from 'framer-motion';
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
      
      {/* Branch Label */}
      <foreignObject x="10" y={branchY - 30} width="200" height="60">
        <div className="flex items-center gap-2">
          <div 
            className={cn(
              "w-3 h-3 rounded-full",
              isSelected && "ring-2 ring-offset-2 ring-slate-400"
            )}
            style={{ backgroundColor: property.color }}
          />
          <span className={cn(
            "font-semibold text-sm transition-all",
            isSelected
              ? "text-slate-900 dark:text-slate-100"
              : "text-slate-600 dark:text-slate-400"
          )}>
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
        />
      ))}
    </g>
  );
}
