'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TimelineEvent } from '@/store/timeline';
import { 
  Home, 
  DollarSign, 
  TrendingUp, 
  LogIn, 
  LogOut, 
  Key, 
  Hammer, 
  RefreshCw, 
  ArrowRightLeft,
  GripVertical
} from 'lucide-react';

interface EventCircleProps {
  event: TimelineEvent;
  cx: string; // X position as percentage
  cy: number; // Y position
  color: string;
  onClick: () => void;
  tier?: number; // Vertical tier for label positioning (0 = default, 1-3 = higher tiers)
  onDragStart?: (eventId: string) => void;
  draggedEventId?: string | null;
}

export default function EventCircle({ event, cx, cy, color, onClick, tier = 0, onDragStart, draggedEventId }: EventCircleProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isDragging = draggedEventId === event.id;

  // Calculate label Y position based on tier
  // Each tier adds vertical space to avoid overlap
  const TIER_SPACING = 18; // Pixels between tiers
  const BASE_LABEL_OFFSET = 28; // Base offset from circle center
  const labelY = cy + BASE_LABEL_OFFSET + (tier * TIER_SPACING);

  // Determine icon based on event type
  const getEventIcon = () => {
    switch (event.type) {
      case 'purchase':
        return <Home className="w-4 h-4" />;
      case 'sale':
        return <TrendingUp className="w-4 h-4" />;
      case 'move_in':
        return <LogIn className="w-4 h-4" />;
      case 'move_out':
        return <LogOut className="w-4 h-4" />;
      case 'rent_start':
        return <Key className="w-4 h-4" />;
      case 'rent_end':
        return <Key className="w-4 h-4" />;
      case 'improvement':
        return <Hammer className="w-4 h-4" />;
      case 'refinance':
        return <RefreshCw className="w-4 h-4" />;
      case 'status_change':
        return <ArrowRightLeft className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const hasAmount = event.amount !== undefined && event.amount > 0;
  const isPPR = event.isPPR === true;

  return (
    <g
      className="event-circle-group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {/* Glow effect on hover */}
      {isHovered && (
        <motion.circle
          cx={cx}
          cy={cy}
          r="24"
          fill={color}
          opacity={0.2}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}

      {/* PPR indicator ring */}
      {isPPR && (
        <motion.circle
          cx={cx}
          cy={cy}
          r="20"
          fill="none"
          stroke="#10B981"
          strokeWidth="2.5"
          strokeDasharray="4,4"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.8, scale: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Main event circle with border */}
      <motion.circle
        cx={cx}
        cy={cy}
        r="16"
        fill="white"
        stroke={color}
        strokeWidth="3"
        initial={{ scale: 0 }}
        animate={{ scale: isHovered ? 1.15 : 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        style={{
          filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.25))',
        }}
      />

      {/* Icon inside the circle */}
      <foreignObject
        x={`calc(${cx} - 8px)`}
        y={cy - 8}
        width="16"
        height="16"
        style={{ pointerEvents: 'none' }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: isHovered ? 1.15 : 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          style={{ 
            color: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%'
          }}
        >
          {getEventIcon()}
        </motion.div>
      </foreignObject>

      {/* Amount indicator badge */}
      {hasAmount && (
        <motion.circle
          cx={cx}
          cy={cy}
          r="5"
          fill="white"
          stroke={color}
          strokeWidth="2"
          initial={{ scale: 0, x: 10, y: -10 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          style={{ transformOrigin: `${cx} ${cy}` }}
        />
      )}

      {/* Hover tooltip card */}
      {(isHovered || isDragging) && (
        <foreignObject
          x={cx}
          y={cy - 80}
          width="220"
          height="180"
          style={{
            overflow: 'visible',
            pointerEvents: 'auto',
            transform: 'translateX(-110px)'
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="px-4 py-3 rounded-xl shadow-2xl"
            style={{
              backgroundColor: '#000000',
              border: '2px solid #FFD54F'
            }}
          >
            {/* Event Title */}
            <div className="font-bold text-sm mb-2" style={{ color: '#FFFFFF' }}>
              {event.title}
            </div>
            
            {/* Event Type */}
            <div className="flex items-center gap-2 mb-2">
              <div 
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#FFD54F', color: '#000000' }}
              >
                {getEventIcon()}
              </div>
              <span className="text-xs capitalize" style={{ color: '#FFFFFF' }}>
                {event.type.replace('_', ' ')}
              </span>
            </div>

            {/* Date */}
            <div className="text-xs mb-2" style={{ color: '#FFFFFF' }}>
              📅 {new Date(event.date).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>

            {/* Amount */}
            {hasAmount && (
              <div className="text-sm font-bold mb-2" style={{ color: '#FFD54F' }}>
                💰 ${event.amount?.toLocaleString()}
              </div>
            )}

            {/* PPR Status */}
            {isPPR && (
              <div className="flex items-center gap-1 text-xs mb-2" style={{ color: '#FFD54F' }}>
                <span>🏠</span>
                <span className="font-semibold">Principal Residence</span>
              </div>
            )}

            {/* Description */}
            {event.description && (
              <div className="text-xs mb-2 line-clamp-2" style={{ color: '#FFFFFF' }}>
                {event.description}
              </div>
            )}

            {/* Drag to move row */}
            {onDragStart && (
              <div 
                className="flex items-center gap-2 mt-2 pt-2 px-2 py-1 rounded"
                style={{ 
                  color: '#FFD54F', 
                  borderTop: '1px solid #333333',
                  cursor: isDragging ? 'grabbing' : 'grab',
                  backgroundColor: isDragging ? 'rgba(255, 213, 79, 0.1)' : 'transparent'
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onDragStart(event.id);
                }}
              >
                <GripVertical className="w-4 h-4" />
                <span className="text-xs font-semibold">Drag to move</span>
              </div>
            )}

            {/* Click hint */}
            {!isDragging && (
              <div className="text-[10px] mt-2 pt-2" style={{ color: '#6B6B6B', borderTop: '1px solid #333333' }}>
                💡 Click to view details
              </div>
            )}
          </motion.div>
        </foreignObject>
      )}

      {/* Connecting line from circle to label (if label is offset) */}
      {tier > 0 && (
        <line
          x1={cx}
          x2={cx}
          y1={cy + 14}
          y2={labelY - 8}
          stroke={color}
          strokeWidth="1"
          strokeDasharray="2,2"
          opacity={0.5}
          className="pointer-events-none"
        />
      )}

      {/* Label below circle (positioned based on tier) */}
      <text
        x={cx}
        y={labelY}
        textAnchor="middle"
        className="text-[15px] font-bold fill-slate-900 dark:fill-slate-100 pointer-events-none"
        style={{ userSelect: 'none' }}
      >
        {event.title}
      </text>
    </g>
  );
}
