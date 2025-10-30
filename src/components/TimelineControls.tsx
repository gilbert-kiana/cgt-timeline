'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { useTimelineStore } from '@/store/timeline';
import { 
  ZoomIn, 
  ZoomOut, 
  Calendar,
  Download,
  Upload,
  Settings,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  List
} from 'lucide-react';

export default function TimelineControls() {
  const [showSettings, setShowSettings] = useState(false);
  const {
    zoomLevel,
    zoomIn,
    zoomOut,
    timelineStart,
    timelineEnd,
    setTimelineRange,
    properties,
    events
  } = useTimelineStore();

  // Get zoom level label for display
  const zoomLevelLabels: Record<string, string> = {
    'decade': '10+ Years',
    'multi-year': '5-10 Years',
    'years': '2-5 Years',
    'year': '1-2 Years',
    'months': '6-12 Months',
    'month': '3-6 Months',
    'weeks': '1-3 Months',
    'days': '< 1 Month',
  };

  const canZoomIn = zoomLevel !== 'days';
  const canZoomOut = zoomLevel !== 'decade';

  const handleExport = () => {
    // Transform data to custom format
    const exportData = {
      properties: properties.map(property => {
        // Get all events for this property, sorted by date
        const propertyEvents = events
          .filter(e => e.propertyId === property.id)
          .sort((a, b) => a.date.getTime() - b.date.getTime());

        // Map events to the custom format
        const property_history = propertyEvents.map(event => {
          const historyItem: any = {
            date: format(event.date, 'yyyy-MM-dd'),
            event: event.type,
          };

          // Add price if amount exists
          if (event.amount) {
            historyItem.price = event.amount;
          }

          return historyItem;
        });

        return {
          address: `${property.name}${property.address ? ', ' + property.address : ''}`,
          property_history,
          notes: property.currentStatus || 'No notes',
        };
      }),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cgt-brain-timeline-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        // In a real app, you'd validate and import this data
        console.log('Imported data:', data);
        // You would call store methods to import the data here
      } catch (error) {
        console.error('Failed to import data:', error);
      }
    };
    reader.readAsText(file);
  };

  const shiftTimeline = (months: number) => {
    const newStart = new Date(timelineStart);
    const newEnd = new Date(timelineEnd);
    newStart.setMonth(newStart.getMonth() + months);
    newEnd.setMonth(newEnd.getMonth() + months);

    // Don't allow the timeline to go past today's date
    const today = new Date();
    if (months > 0 && newEnd > today) {
      return; // Don't shift forward past today
    }

    setTimelineRange(newStart, newEnd);
  };

  // Check if we can shift forward (would the new end date exceed today?)
  const canShiftForward = () => {
    const testEnd = new Date(timelineEnd);
    testEnd.setMonth(testEnd.getMonth() + 12);
    const today = new Date();
    return testEnd <= today;
  };

  return (
    <div className="absolute top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between z-30">
      {/* Left Controls */}
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-slate-800">CGT Brain AI Timeline</h1>
        <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
          <span className="text-sm text-slate-500">
            {properties.length} {properties.length === 1 ? 'Property' : 'Properties'}
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-sm text-slate-500">
            {events.length} {events.length === 1 ? 'Event' : 'Events'}
          </span>
        </div>
      </div>

      {/* Center Controls - Timeline Navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => shiftTimeline(-12)}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          title="Previous Year"
        >
          <ChevronLeft className="w-4 h-4 text-slate-600" />
        </button>
        
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span className="text-sm text-slate-700">
            {format(timelineStart, 'MMM yyyy')} - {format(timelineEnd, 'MMM yyyy')}
          </span>
        </div>
        
        <button
          onClick={() => shiftTimeline(12)}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Next Year"
          disabled={!canShiftForward()}
        >
          <ChevronRight className="w-4 h-4 text-slate-600" />
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Zoom Controls */}
        <div className="flex items-center gap-1 border-r border-slate-200 pr-2">
          <button
            onClick={zoomOut}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!canZoomOut}
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4 text-slate-600" />
          </button>
          <div className="px-3 py-1 bg-slate-100 rounded-lg min-w-[120px] text-center">
            <div className="text-xs font-semibold text-slate-700">
              {zoomLevelLabels[zoomLevel]}
            </div>
          </div>
          <button
            onClick={zoomIn}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!canZoomIn}
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        {/* Action Buttons */}
        <button
          onClick={handleExport}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          title="Export Timeline"
        >
          <Download className="w-4 h-4 text-slate-600" />
        </button>
        
        <label className="p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
          <Upload className="w-4 h-4 text-slate-600" />
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </label>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4 text-slate-600" />
        </button>
      </div>
    </div>
  );
}
