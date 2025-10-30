'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TimelineEvent } from '@/store/timeline';
import { Home, DollarSign, TrendingUp } from 'lucide-react';

interface EventCircleProps {
  event: TimelineEvent;
  cx: string; // X position as percentage
  cy: number; // Y position
  color: string;
  onClick: () => void;
}

export default function EventCircle({ event, cx, cy, color, onClick }: EventCircleProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Determine icon based on event type
  const getEventIcon = () => {
    switch (event.type) {
      case 'purchase':
        return <Home className="w-3 h-3" />;
      case 'sale':
        return <TrendingUp className="w-3 h-3" />;
      case 'move_in':
      case 'move_out':
        return <Home className="w-3 h-3" />;
      default:
        return <DollarSign className="w-3 h-3" />;
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

      {/* Main event circle */}
      <motion.circle
        cx={cx}
        cy={cy}
        r="14"
        fill={color}
        stroke="white"
        strokeWidth="3"
        initial={{ scale: 0 }}
        animate={{ scale: isHovered ? 1.15 : 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        style={{
          filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.25))',
        }}
      />

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

      {/* Hover tooltip */}
      {isHovered && (
        <foreignObject
          x={cx}
          y={cy - 50}
          width="160"
          height="80"
          style={{
            overflow: 'visible',
            pointerEvents: 'none',
            transform: 'translateX(-80px)'
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800 text-white px-3 py-2 rounded-lg shadow-xl text-xs"
          >
            <div className="font-semibold mb-1">{event.title}</div>
            <div className="text-slate-300 text-[10px]">
              {new Date(event.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
            {hasAmount && (
              <div className="text-green-400 font-semibold mt-1">
                ${event.amount?.toLocaleString()}
              </div>
            )}
            {isPPR && (
              <div className="text-green-400 text-[10px] mt-1">
                ✓ Principal Residence
              </div>
            )}
            <div className="text-slate-400 text-[10px] mt-1">
              Click to edit
            </div>
          </motion.div>
        </foreignObject>
      )}

      {/* Label below circle (always visible) */}
      <text
        x={cx}
        y={cy + 28}
        textAnchor="middle"
        className="text-[11px] font-semibold fill-slate-700 pointer-events-none"
        style={{ userSelect: 'none' }}
      >
        {event.title}
      </text>
    </g>
  );
}
