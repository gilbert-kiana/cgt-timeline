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
  Database,
  Trash2,
  Moon,
  Sun
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
    events,
    loadDemoData,
    clearAllData,
    setZoomByIndex,
    getZoomLevelIndex,
    absoluteStart,
    absoluteEnd,
    panToPosition,
    isDarkMode,
    toggleDarkMode
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

  // Smooth panning slider - uses absolute timeline positions
  const getPanSliderValue = () => {
    // Calculate center of current view as percentage of absolute timeline
    const centerTime = (timelineStart.getTime() + timelineEnd.getTime()) / 2;
    const absoluteRange = absoluteEnd.getTime() - absoluteStart.getTime();
    const offset = centerTime - absoluteStart.getTime();
    const percentage = (offset / absoluteRange) * 100;
    return Math.max(0, Math.min(100, percentage));
  };

  const handlePanSliderChange = (percentage: number) => {
    panToPosition(percentage);
  };

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

  return (
    <div className="absolute top-0 left-0 right-0 h-16 bg-white dark:bg-black border-b border-slate-200 dark:border-slate-700 px-8 flex items-center justify-between z-30">
      {/* Left Controls */}
      <div className="flex items-center gap-4">
        <h1 className="font-bold text-slate-800 dark:text-slate-100" style={{ fontSize: '14px' }}>CGT Brain AI Timeline</h1>
        <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-700 pl-4">
          <span className="text-slate-500 dark:text-slate-400" style={{ fontSize: '12px' }}>
            {properties.length} {properties.length === 1 ? 'Property' : 'Properties'}
          </span>
          <span className="text-slate-300 dark:text-slate-600">•</span>
          <span className="text-slate-500 dark:text-slate-400" style={{ fontSize: '12px' }}>
            {events.length} {events.length === 1 ? 'Event' : 'Events'}
          </span>
        </div>
      </div>

      {/* Center Controls - Timeline Navigation */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1" style={{ backgroundColor: '#000000', borderRadius: '7px' }}>
          <Calendar className="w-4 h-4" style={{ color: '#FFFFFF' }} />
          <span style={{ color: '#FFFFFF', fontSize: '12px' }}>
            {format(timelineStart, 'MMM yyyy')} - {format(timelineEnd, 'MMM yyyy')}
          </span>
        </div>

        <div className="flex items-center gap-2 px-3 py-2" style={{ backgroundColor: '#000000', borderRadius: '7px' }}>
          <span className="font-medium whitespace-nowrap" style={{ color: '#FFFFFF', fontSize: '12px' }}>Pan</span>
          <input
            type="range"
            min={0}
            max={100}
            step={0.01}
            value={getPanSliderValue()}
            onChange={(e) => handlePanSliderChange(parseFloat(e.target.value))}
            className="w-36 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer mr-[3px]
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-3
              [&::-webkit-slider-thumb]:h-3
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-white
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:hover:bg-gray-200
              [&::-webkit-slider-thumb]:transition-colors
              [&::-moz-range-thumb]:w-3
              [&::-moz-range-thumb]:h-3
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-white
              [&::-moz-range-thumb]:border-0
              [&::-moz-range-thumb]:cursor-pointer
              [&::-moz-range-thumb]:hover:bg-gray-200"
            title="Smooth timeline navigation"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Zoom Controls - scaled to 3/4 size */}
        <div className="scale-75 origin-left flex items-center gap-2">
          {/* Zoom Slider */}
          <div className="flex items-center gap-2 border-r border-slate-200 pr-2">
            <input
              type="range"
              min="0"
              max="7"
              value={getZoomLevelIndex()}
              onChange={(e) => setZoomByIndex(parseInt(e.target.value))}
              className="w-32 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-4
                [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-slate-600
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:hover:bg-slate-700
                [&::-moz-range-thumb]:w-4
                [&::-moz-range-thumb]:h-4
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-slate-600
                [&::-moz-range-thumb]:border-0
                [&::-moz-range-thumb]:cursor-pointer
                [&::-moz-range-thumb]:hover:bg-slate-700"
              title="Zoom Level Slider"
            />
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 border-r border-slate-200 dark:border-slate-700 pr-2">
            <button
              onClick={zoomOut}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!canZoomOut}
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </button>
            <div className="px-3 py-1 min-w-[120px] text-center" style={{ backgroundColor: '#000000', borderRadius: '7px' }}>
              <div className="font-semibold" style={{ color: '#FFFFFF', fontSize: '12px' }}>
                {zoomLevelLabels[zoomLevel]}
              </div>
            </div>
            <button
              onClick={zoomIn}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!canZoomIn}
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <button
          onClick={handleExport}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          title="Export Timeline"
        >
          <Download className="w-4 h-4 text-slate-600 dark:text-slate-300" />
        </button>

        <label className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer">
          <Upload className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </label>

        <button
          onClick={loadDemoData}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          title="Load Demo Data"
        >
          <Database className="w-4 h-4 text-slate-600 dark:text-slate-300" />
        </button>

        <button
          onClick={clearAllData}
          className="p-2 hover:bg-red-50 hover:bg-opacity-50 rounded-lg transition-colors"
          title="Clear All Data"
        >
          <Trash2 className="w-4 h-4 text-red-600" />
        </button>

        <button
          onClick={toggleDarkMode}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDarkMode ? (
            <Sun className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          )}
        </button>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4 text-slate-600 dark:text-slate-300" />
        </button>
      </div>
    </div>
  );
}
