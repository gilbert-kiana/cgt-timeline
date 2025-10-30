'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTimelineStore } from '@/store/timeline';
import { format } from 'date-fns';

export default function TimelineSlider() {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState(0);
  const [tooltipDate, setTooltipDate] = useState<Date>(new Date());

  const {
    timelineStart,
    timelineEnd,
    absoluteStart,
    absoluteEnd,
    panToPosition,
  } = useTimelineStore();

  // Calculate viewport position and width as percentages of the absolute timeline
  const calculateViewportMetrics = () => {
    const absoluteRange = absoluteEnd.getTime() - absoluteStart.getTime();
    const viewportStartOffset = timelineStart.getTime() - absoluteStart.getTime();
    const viewportEndOffset = timelineEnd.getTime() - absoluteStart.getTime();

    const startPercent = (viewportStartOffset / absoluteRange) * 100;
    const endPercent = (viewportEndOffset / absoluteRange) * 100;
    const widthPercent = endPercent - startPercent;

    return {
      left: Math.max(0, Math.min(100, startPercent)),
      width: Math.max(1, Math.min(100, widthPercent)),
    };
  };

  const viewport = calculateViewportMetrics();

  // Handle drag
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const updatePositionFromEvent = (clientX: number) => {
    if (!sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const position = Math.max(0, Math.min(100, (x / rect.width) * 100));

    if (isDragging) {
      panToPosition(position);
    }

    // Update tooltip
    const absoluteRange = absoluteEnd.getTime() - absoluteStart.getTime();
    const dateTime = absoluteStart.getTime() + (position / 100) * absoluteRange;
    setTooltipDate(new Date(dateTime));
    setTooltipPosition(position);
  };

  const handleMouseMove = (e: MouseEvent) => {
    updatePositionFromEvent(e.clientX);
  };

  const handleReactMouseMove = (e: React.MouseEvent) => {
    updatePositionFromEvent(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle slider track click
  const handleSliderClick = (e: React.MouseEvent) => {
    if (!sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const position = Math.max(0, Math.min(100, (x / rect.width) * 100));

    panToPosition(position);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  // Generate year markers for the slider
  const generateSliderMarkers = () => {
    const markers = [];
    const startYear = absoluteStart.getFullYear();
    const endYear = absoluteEnd.getFullYear();
    const yearSpan = endYear - startYear;

    // Show fewer markers if too many years
    const step = yearSpan > 20 ? 5 : yearSpan > 10 ? 2 : 1;

    for (let year = startYear; year <= endYear; year += step) {
      const date = new Date(year, 0, 1);
      const absoluteRange = absoluteEnd.getTime() - absoluteStart.getTime();
      const offset = date.getTime() - absoluteStart.getTime();
      const position = (offset / absoluteRange) * 100;

      if (position >= 0 && position <= 100) {
        markers.push({ year, position });
      }
    }

    return markers;
  };

  const markers = generateSliderMarkers();

  return (
    <div className="relative w-full h-16 bg-white border-t border-slate-200 px-8 py-3">
      <div
        ref={sliderRef}
        className="relative w-full h-full cursor-pointer"
        onClick={handleSliderClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onMouseMove={handleReactMouseMove}
      >
        {/* Slider Track */}
        <div className="absolute top-1/2 -translate-y-1/2 w-full h-2 bg-slate-200 rounded-full">
          {/* Year Markers */}
          {markers.map(({ year, position }) => (
            <div
              key={year}
              className="absolute top-1/2 -translate-y-1/2 w-px h-4 bg-slate-300"
              style={{ left: `${position}%` }}
            >
              <div className="absolute top-full mt-1 -translate-x-1/2 text-[10px] text-slate-500 whitespace-nowrap">
                {year}
              </div>
            </div>
          ))}

          {/* Viewport Indicator */}
          <div
            className="absolute top-0 h-full bg-blue-500 rounded-full cursor-grab active:cursor-grabbing transition-all duration-200 hover:bg-blue-600"
            style={{
              left: `${viewport.left}%`,
              width: `${viewport.width}%`,
            }}
            onMouseDown={handleMouseDown}
          >
            {/* Grip Lines */}
            <div className="absolute inset-0 flex items-center justify-center gap-0.5">
              <div className="w-px h-3 bg-white/50 rounded-full" />
              <div className="w-px h-3 bg-white/50 rounded-full" />
              <div className="w-px h-3 bg-white/50 rounded-full" />
            </div>
          </div>
        </div>

        {/* Hover Tooltip */}
        {showTooltip && !isDragging && (
          <div
            className="absolute bottom-full mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded pointer-events-none whitespace-nowrap -translate-x-1/2"
            style={{ left: `${tooltipPosition}%` }}
          >
            {format(tooltipDate, 'MMM dd, yyyy')}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800" />
          </div>
        )}

        {/* Dragging Tooltip */}
        {isDragging && (
          <div
            className="absolute bottom-full mb-2 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded pointer-events-none whitespace-nowrap -translate-x-1/2 shadow-lg"
            style={{ left: `${viewport.left + viewport.width / 2}%` }}
          >
            {format(timelineStart, 'MMM dd, yyyy')} - {format(timelineEnd, 'MMM dd, yyyy')}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-blue-600" />
          </div>
        )}
      </div>
    </div>
  );
}
