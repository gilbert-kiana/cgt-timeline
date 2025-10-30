'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { TimelineEvent, useTimelineStore } from '@/store/timeline';
import { cn, formatCurrency } from '@/lib/utils';
import { 
  Home, 
  DollarSign, 
  Key, 
  Package, 
  TrendingUp, 
  Hammer,
  Calendar,
  X,
  Edit2
} from 'lucide-react';

interface EventCardProps {
  event: TimelineEvent;
  onDragStart: () => void;
  isConnected?: boolean;
  branchColor: string;
}

const eventIcons: Record<string, React.ReactNode> = {
  purchase: <Home className="w-4 h-4" />,
  move_in: <Key className="w-4 h-4" />,
  move_out: <Package className="w-4 h-4" />,
  rent_start: <DollarSign className="w-4 h-4" />,
  rent_end: <DollarSign className="w-4 h-4" />,
  sale: <TrendingUp className="w-4 h-4" />,
  improvement: <Hammer className="w-4 h-4" />,
  refinance: <DollarSign className="w-4 h-4" />,
};

export default function EventCard({ 
  event, 
  onDragStart,
  isConnected,
  branchColor 
}: EventCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { updateEvent, deleteEvent, selectEvent, selectedEvent } = useTimelineStore();
  const isSelected = selectedEvent === event.id;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectEvent(event.id);
    onDragStart();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteEvent(event.id);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleSave = (updates: Partial<TimelineEvent>) => {
    updateEvent(event.id, updates);
    setIsEditing(false);
  };

  return (
    <motion.div
      className={cn(
        "absolute cursor-move bg-white rounded-lg shadow-lg border-2 p-3 min-w-[180px] transition-all",
        isSelected && "ring-2 ring-offset-2 ring-blue-400 z-20",
        isHovered && "shadow-xl scale-105 z-10"
      )}
      style={{ 
        borderColor: branchColor,
        backgroundColor: isSelected ? `${branchColor}10` : 'white'
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ y: -2 }}
      layout
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div 
            className="p-1.5 rounded-md text-white"
            style={{ backgroundColor: event.color }}
          >
            {eventIcons[event.type]}
          </div>
          {!isEditing ? (
            <h4 className="font-semibold text-sm text-slate-800">{event.title}</h4>
          ) : (
            <input
              className="font-semibold text-sm text-slate-800 border-b border-slate-300 outline-none bg-transparent"
              value={event.title}
              onChange={(e) => handleSave({ title: e.target.value })}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          )}
        </div>
        {isHovered && (
          <div className="flex gap-1">
            <button
              onClick={handleEdit}
              className="p-1 hover:bg-slate-100 rounded transition-colors"
            >
              <Edit2 className="w-3 h-3 text-slate-500" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1 hover:bg-red-100 rounded transition-colors"
            >
              <X className="w-3 h-3 text-red-500" />
            </button>
          </div>
        )}
      </div>

      {/* Date */}
      <div className="flex items-center gap-1 text-xs text-slate-600 mb-2">
        <Calendar className="w-3 h-3" />
        <span>{format(event.date, 'dd MMM yyyy')}</span>
      </div>

      {/* Amount */}
      {event.amount && (
        <div className="font-bold text-sm" style={{ color: branchColor }}>
          {formatCurrency(event.amount)}
        </div>
      )}

      {/* Description */}
      {event.description && !isEditing && (
        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
          {event.description}
        </p>
      )}

      {/* Drag Handle Indicator */}
      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
        <div className="w-1 h-1 bg-slate-300 rounded-full" />
        <div className="w-1 h-1 bg-slate-300 rounded-full" />
        <div className="w-1 h-1 bg-slate-300 rounded-full" />
      </div>
    </motion.div>
  );
}
