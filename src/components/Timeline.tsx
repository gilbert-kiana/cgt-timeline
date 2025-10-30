'use client';

import React, { useState, useRef, useEffect, MouseEvent } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimelineStore, EventType, TimelineEvent } from '@/store/timeline';
import { cn, dateToPosition, positionToDate, generateTimelineMarkers, TimelineMarker } from '@/lib/utils';
import EventCard from './EventCard';
import TimelineControls from './TimelineControls';
import PropertyBranch from './PropertyBranch';
import QuickAddMenu from './QuickAddMenu';
import TimelineSlider from './TimelineSlider';
import EventDetailsModal from './EventDetailsModal';

interface TimelineProps {
  className?: string;
}

export default function Timeline({ className }: TimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddPosition, setQuickAddPosition] = useState({ x: 0, y: 0 });
  const [clickPosition, setClickPosition] = useState(0);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [editingEventPropertyName, setEditingEventPropertyName] = useState<string>('');
  
  const {
    properties,
    events,
    selectedProperty,
    selectedEvent,
    timelineStart,
    timelineEnd,
    zoom,
    addEvent,
    moveEvent,
    selectEvent,
  } = useTimelineStore();

  // Handle timeline click to add events
  const handleTimelineClick = (e: MouseEvent<HTMLDivElement>) => {
    if (isDragging) return;
    
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const position = (x / rect.width) * 100;
    
    setClickPosition(position);
    setQuickAddPosition({ x: e.clientX, y: e.clientY });
    setShowQuickAdd(true);
  };

  // Handle mouse move for hover effects
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const position = (x / rect.width) * 100;
    const date = positionToDate(position, timelineStart, timelineEnd);
    setHoveredDate(date);
  };

  // Handle event click - opens edit modal
  const handleEventClick = (event: TimelineEvent, propertyName: string) => {
    setEditingEvent(event);
    setEditingEventPropertyName(propertyName);
  };

  // Generate intelligent markers based on zoom level
  const timelineMarkers = generateTimelineMarkers(timelineStart, timelineEnd);

  // Calculate minimum height needed for all properties
  const minContentHeight = properties.length > 0
    ? Math.max(400, 100 + properties.length * 120 + 100) // Base offset + spacing per property + bottom padding
    : 400;

  // Handle drag start
  const handleDragStart = (eventId: string) => {
    setIsDragging(true);
    setDraggedEventId(eventId);
  };

  // Handle drag end
  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedEventId(null);
  };

  // Handle drag move
  useEffect(() => {
    if (!isDragging || !draggedEventId) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = timelineRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const x = e.clientX - rect.left;
      const position = Math.max(0, Math.min(100, (x / rect.width) * 100));
      moveEvent(draggedEventId, position);
    };

    const handleMouseUp = () => {
      handleDragEnd();
    };

    document.addEventListener('mousemove', handleMouseMove as any);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove as any);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, draggedEventId, moveEvent]);

  return (
    <div className={cn('relative w-full h-full bg-gradient-to-br from-slate-50 to-slate-100', className)}>
      {/* Controls */}
      <TimelineControls />
      
      {/* Main Timeline Container */}
      <div className="relative h-full pt-20 pb-24 px-8">
        <div
          ref={timelineRef}
          className="timeline-scroll relative h-full bg-white rounded-2xl shadow-lg border border-slate-200 overflow-y-auto overflow-x-hidden transition-all duration-300"
          onClick={handleTimelineClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredDate(null)}
        >
          {/* Scrollable Content Wrapper */}
          <div className="relative" style={{ minHeight: `${minContentHeight}px` }}>
            {/* Background Grid */}
            <div className="absolute inset-0 opacity-5">
              <div className="h-full w-full" style={{
                backgroundImage: 'linear-gradient(90deg, #000 1px, transparent 1px), linear-gradient(#000 1px, transparent 1px)',
                backgroundSize: '50px 50px',
              }} />
            </div>

            {/* Timeline Markers - Sticky */}
            <div className="sticky top-0 left-0 right-0 h-12 border-b border-slate-200 bg-slate-50 z-20">
            {timelineMarkers.map((marker, index) => {
              const isYear = marker.type === 'year';
              const isMinor = marker.isMinor;

              return (
                <div
                  key={`${marker.type}-${marker.date.getTime()}-${index}`}
                  className="absolute top-0 h-full flex items-center"
                  style={{ left: `${marker.position}%` }}
                >
                  <div
                    className={cn(
                      'px-2 whitespace-nowrap',
                      isYear ? 'font-bold text-slate-800 text-sm' : 'font-medium text-slate-600 text-xs',
                      isMinor && 'text-slate-400'
                    )}
                  >
                    {marker.label}
                  </div>
                  <div
                    className={cn(
                      'absolute top-full h-full',
                      isYear ? 'w-0.5 bg-slate-300' : isMinor ? 'w-px bg-slate-100' : 'w-px bg-slate-200'
                    )}
                  />
                </div>
              );
            })}
            </div>

            {/* Hover Date Indicator */}
            {hoveredDate && (
              <div
                className="absolute top-14 px-2 py-1 bg-slate-800 text-white text-xs rounded pointer-events-none z-50"
                style={{
                  left: `${dateToPosition(hoveredDate, timelineStart, timelineEnd)}%`,
                  transform: 'translateX(-50%)'
                }}
              >
                {format(hoveredDate, 'dd MMM yyyy')}
              </div>
            )}

            {/* Property Branches */}
            <svg
              className="absolute top-12 left-0 w-full"
              style={{ height: `${minContentHeight - 48}px` }}
            >
            {properties.map((property, index) => (
              <PropertyBranch
                key={property.id}
                property={property}
                events={events.filter(e => e.propertyId === property.id)}
                branchIndex={index}
                onDragStart={handleDragStart}
                isSelected={selectedProperty === property.id}
                timelineStart={timelineStart}
                timelineEnd={timelineEnd}
                onEventClick={(event) => handleEventClick(event, property.name)}
              />
            ))}
            </svg>

            {/* No Properties Message */}
            {properties.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-slate-700 mb-2">
                    Welcome to CGT Timeline
                  </h3>
                  <p className="text-slate-500 mb-4">
                    Click anywhere on the timeline to add your first property
                  </p>
                  <div className="flex items-center justify-center gap-2 text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2z" />
                    </svg>
                    <span className="text-sm">Click on the timeline to begin</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Timeline Slider */}
      <div className="absolute bottom-0 left-0 right-0">
        <TimelineSlider />
      </div>

      {/* Quick Add Menu */}
      <AnimatePresence>
        {showQuickAdd && (
          <QuickAddMenu
            position={quickAddPosition}
            timelinePosition={clickPosition}
            onClose={() => setShowQuickAdd(false)}
          />
        )}
      </AnimatePresence>

      {/* Event Details Modal - Rendered at top level */}
      {editingEvent && (
        <EventDetailsModal
          event={editingEvent}
          onClose={() => {
            setEditingEvent(null);
            setEditingEventPropertyName('');
          }}
          propertyName={editingEventPropertyName}
        />
      )}
    </div>
  );
}
