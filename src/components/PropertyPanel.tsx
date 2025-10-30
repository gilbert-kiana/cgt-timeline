'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useTimelineStore } from '@/store/timeline';
import { formatCurrency } from '@/lib/utils';
import { 
  X, 
  Edit2, 
  Trash2, 
  Home, 
  MapPin, 
  DollarSign,
  TrendingUp,
  Calendar,
  Calculator,
  FileText
} from 'lucide-react';

export default function PropertyPanel() {
  const { 
    selectedProperty, 
    properties, 
    events, 
    selectProperty,
    updateProperty,
    deleteProperty 
  } = useTimelineStore();
  
  const [isEditing, setIsEditing] = useState(false);
  
  const property = properties.find(p => p.id === selectedProperty);
  if (!property) return null;
  
  const propertyEvents = events
    .filter(e => e.propertyId === property.id)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  
  // Calculate key metrics
  const purchaseEvent = propertyEvents.find(e => e.type === 'purchase');
  const saleEvent = propertyEvents.find(e => e.type === 'sale');
  const improvements = propertyEvents
    .filter(e => e.type === 'improvement')
    .reduce((sum, e) => sum + (e.amount || 0), 0);
  
  const totalInvestment = (purchaseEvent?.amount || 0) + improvements;
  const capitalGain = saleEvent ? (saleEvent.amount || 0) - totalInvestment : null;
  
  // Calculate ownership period
  const ownershipDays = purchaseEvent && saleEvent
    ? Math.floor((saleEvent.date.getTime() - purchaseEvent.date.getTime()) / (1000 * 60 * 60 * 24))
    : purchaseEvent
    ? Math.floor((new Date().getTime() - purchaseEvent.date.getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  
  const ownershipYears = Math.floor(ownershipDays / 365);
  const ownershipMonths = Math.floor((ownershipDays % 365) / 30);
  
  const handleSave = (field: string, value: string) => {
    updateProperty(property.id, { [field]: value });
    setIsEditing(false);
  };
  
  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this property and all its events?')) {
      deleteProperty(property.id);
      selectProperty(null);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        className="w-96 h-full bg-white border-l border-slate-200 shadow-xl overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: property.color }}
              />
              {isEditing ? (
                <input
                  type="text"
                  value={property.name}
                  onChange={(e) => handleSave('name', e.target.value)}
                  onBlur={() => setIsEditing(false)}
                  className="text-lg font-bold border-b border-slate-300 outline-none"
                  autoFocus
                />
              ) : (
                <h2 className="text-lg font-bold text-slate-800">{property.name}</h2>
              )}
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <Edit2 className="w-3 h-3 text-slate-500" />
              </button>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleDelete}
                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
              <button
                onClick={() => selectProperty(null)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>
          
          {property.address && (
            <div className="flex items-center gap-2 mt-2 text-sm text-slate-600">
              <MapPin className="w-3 h-3" />
              <span>{property.address}</span>
            </div>
          )}
        </div>
        
        {/* Key Metrics */}
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-xs font-medium">Purchase Price</span>
              </div>
              <div className="text-lg font-bold text-blue-900">
                {purchaseEvent ? formatCurrency(purchaseEvent.amount || 0) : '-'}
              </div>
            </div>
            
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-medium">Current Value</span>
              </div>
              <div className="text-lg font-bold text-green-900">
                {property.currentValue ? formatCurrency(property.currentValue) : '-'}
              </div>
            </div>
            
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-purple-600 mb-1">
                <Calculator className="w-4 h-4" />
                <span className="text-xs font-medium">Total Investment</span>
              </div>
              <div className="text-lg font-bold text-purple-900">
                {formatCurrency(totalInvestment)}
              </div>
            </div>
            
            <div className={`p-3 rounded-lg ${capitalGain && capitalGain > 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
              <div className={`flex items-center gap-2 mb-1 ${capitalGain && capitalGain > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                <DollarSign className="w-4 h-4" />
                <span className="text-xs font-medium">Capital Gain</span>
              </div>
              <div className={`text-lg font-bold ${capitalGain && capitalGain > 0 ? 'text-emerald-900' : 'text-red-900'}`}>
                {capitalGain ? formatCurrency(capitalGain) : '-'}
              </div>
            </div>
          </div>
          
          {/* Ownership Period */}
          <div className="bg-slate-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-slate-600 mb-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">Ownership Period</span>
            </div>
            <div className="text-slate-800">
              {ownershipYears > 0 && <span className="font-bold">{ownershipYears} years </span>}
              {ownershipMonths > 0 && <span className="font-bold">{ownershipMonths} months</span>}
              {ownershipDays > 0 && ownershipYears === 0 && ownershipMonths === 0 && (
                <span className="font-bold">{ownershipDays} days</span>
              )}
              {ownershipDays === 0 && <span className="text-slate-500">Not yet purchased</span>}
            </div>
            {ownershipDays > 365 && (
              <div className="mt-2 text-xs text-green-600 font-medium">
                ✓ Eligible for 50% CGT discount
              </div>
            )}
          </div>
          
          {/* Events Timeline */}
          <div>
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Event History
            </h3>
            <div className="space-y-2">
              {propertyEvents.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  No events yet. Click on the timeline to add events.
                </p>
              ) : (
                propertyEvents.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative pl-8 pb-4"
                  >
                    {/* Connection line */}
                    {index < propertyEvents.length - 1 && (
                      <div className="absolute left-3 top-6 w-0.5 h-full bg-slate-200" />
                    )}
                    
                    {/* Event dot */}
                    <div 
                      className="absolute left-2 top-2 w-2 h-2 rounded-full"
                      style={{ backgroundColor: event.color }}
                    />
                    
                    {/* Event content */}
                    <div className="bg-white border border-slate-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm text-slate-800">
                          {event.title}
                        </span>
                        <span className="text-xs text-slate-500">
                          {format(event.date, 'dd MMM yyyy')}
                        </span>
                      </div>
                      {event.amount && (
                        <div className="text-sm font-bold" style={{ color: event.color }}>
                          {formatCurrency(event.amount)}
                        </div>
                      )}
                      {event.description && (
                        <p className="text-xs text-slate-600 mt-1">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
