'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TimelineEvent, PropertyStatus, useTimelineStore } from '@/store/timeline';
import { format } from 'date-fns';
import { X, Calendar, DollarSign, Home, Tag, FileText, CheckCircle } from 'lucide-react';

interface EventDetailsModalProps {
  event: TimelineEvent;
  onClose: () => void;
  propertyName: string;
}

export default function EventDetailsModal({ event, onClose, propertyName }: EventDetailsModalProps) {
  const { updateEvent, deleteEvent } = useTimelineStore();

  const [title, setTitle] = useState(event.title);
  const [date, setDate] = useState(format(event.date, 'yyyy-MM-dd'));
  const [amount, setAmount] = useState(event.amount?.toString() || '');
  const [description, setDescription] = useState(event.description || '');
  const [isPPR, setIsPPR] = useState(event.isPPR || false);
  const [newStatus, setNewStatus] = useState<PropertyStatus | ''>(event.newStatus || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    try {
      setIsSaving(true);

      const updates: Partial<TimelineEvent> = {
        title: title.trim(),
        date: new Date(date),
      };

      // Only include amount if it's a valid number
      if (amount && !isNaN(parseFloat(amount))) {
        updates.amount = parseFloat(amount);
      } else {
        updates.amount = undefined;
      }

      // Only include description if not empty
      if (description.trim()) {
        updates.description = description.trim();
      } else {
        updates.description = undefined;
      }

      // Include PPR status
      updates.isPPR = isPPR ? true : undefined;

      // Include new status if applicable
      if (newStatus) {
        updates.newStatus = newStatus as PropertyStatus;
      }

      updateEvent(event.id, updates);

      // Small delay for visual feedback
      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 200);
    } catch (error) {
      console.error('Error saving event:', error);
      setIsSaving(false);
      alert('Failed to save changes. Please try again.');
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this event?')) {
      deleteEvent(event.id);
      onClose();
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        // Cmd+Enter or Ctrl+Enter to save
        if (!isSaving && title.trim() && date) {
          handleSave();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSaving, title, date, onClose]);

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="px-6 py-4 border-b border-slate-200 dark:border-slate-700"
            style={{ backgroundColor: `${event.color}15` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center shadow-md"
                  style={{ backgroundColor: event.color }}
                >
                  <Home className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{event.title}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{propertyName}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
            {/* Event Type Badge */}
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-700">
              <Tag className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span className="text-sm text-slate-600 dark:text-slate-400">Event Type:</span>
              <span
                className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: event.color }}
              >
                {event.type.replace('_', ' ').toUpperCase()}
              </span>
              {isPPR && (
                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  PPR
                </span>
              )}
            </div>

            {/* Basic Information Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Basic Information</h3>

              {/* Title Input */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <FileText className="w-4 h-4" />
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Event title"
                  required
                />
              </div>

              {/* Date Input */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <Calendar className="w-4 h-4" />
                  Date *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Financial Details Section */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Financial Details</h3>

              {/* Amount Input */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <DollarSign className="w-4 h-4" />
                  Amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">$</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            {/* Additional Information Section */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Additional Information</h3>

              {/* Description Input */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <FileText className="w-4 h-4" />
                  Notes
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Add notes about this event..."
                />
              </div>

              {/* PPR Checkbox */}
              <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <input
                  type="checkbox"
                  id="isPPR-modal"
                  checked={isPPR}
                  onChange={(e) => setIsPPR(e.target.checked)}
                  className="w-5 h-5 text-green-600 border-gray-300 dark:border-gray-600 rounded focus:ring-green-500 mt-0.5"
                />
                <label htmlFor="isPPR-modal" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Home className="w-4 h-4 text-green-600 dark:text-green-400" />
                    Principal Place of Residence (PPR)
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Mark this event as related to your main residence. Important for CGT main residence exemption eligibility.
                  </p>
                </label>
              </div>
            </div>

            {/* Status Change Dropdown (if applicable) */}
            {event.type === 'status_change' && (
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <Home className="w-4 h-4" />
                  New Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as PropertyStatus)}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select status...</option>
                  <option value="ppr">Principal Place of Residence</option>
                  <option value="rental">Rental/Investment</option>
                  <option value="vacant">Vacant</option>
                  <option value="construction">Under Construction</option>
                  <option value="sold">Sold</option>
                </select>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
            {/* Keyboard shortcuts hint */}
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-4">
              <span>💡 Tip: Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-slate-700 dark:text-slate-300 font-mono">Esc</kbd> to cancel</span>
              <span>Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-slate-700 dark:text-slate-300 font-mono">Ctrl+Enter</kbd> to save</span>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={handleDelete}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete Event
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  disabled={isSaving}
                  className="px-5 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !title.trim() || !date}
                  className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm hover:shadow-md"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
