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
  
  // Generate branch path
  const generateBranchPath = () => {
    if (sortedEvents.length === 0) return '';

    let path = `M 0,${branchY}`;

    sortedEvents.forEach((event, index) => {
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
            isSelected ? "text-slate-900" : "text-slate-600"
          )}>
            {property.name}
          </span>
        </div>
      </foreignObject>
      
      {/* Event Circles */}
      {sortedEvents.map((event) => (
        <EventCircle
          key={event.id}
          event={event}
          cx={`${event.calculatedPosition}%`}
          cy={branchY}
          color={event.color}
          onClick={() => onEventClick(event)}
        />
      ))}
    </g>
  );
}
