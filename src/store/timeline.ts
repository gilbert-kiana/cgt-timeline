import { create } from 'zustand';
import { addDays, format } from 'date-fns';

export type EventType =
  | 'purchase'
  | 'move_in'
  | 'move_out'
  | 'rent_start'
  | 'rent_end'
  | 'sale'
  | 'improvement'
  | 'refinance'
  | 'status_change';

export type PropertyStatus =
  | 'ppr'           // Principal Place of Residence
  | 'rental'        // Rented to tenants
  | 'vacant'        // Empty/not used
  | 'construction'  // Being built/renovated
  | 'sold';         // Sold

export interface TimelineEvent {
  id: string;
  propertyId: string;
  type: EventType;
  date: Date;
  title: string;
  amount?: number;
  description?: string;
  position: number; // Position on timeline (0-100) - kept for drag compatibility
  color: string;
  // CGT-specific fields
  contractDate?: Date;      // For sales - contract date vs settlement
  settlementDate?: Date;    // Actual settlement date
  newStatus?: PropertyStatus; // For status_change events
  isPPR?: boolean;          // Is this event related to PPR?
}

export interface Property {
  id: string;
  name: string;
  address: string;
  color: string;
  purchasePrice?: number;
  purchaseDate?: Date;
  currentValue?: number;
  salePrice?: number;
  saleDate?: Date;
  currentStatus?: PropertyStatus;
  branch: number; // Y-position for branch visualization
  isRental?: boolean; // Is this a rental property you don't own?
}

export type ZoomLevel =
  | 'decade'      // 10+ years
  | 'multi-year'  // 5-10 years
  | 'years'       // 2-5 years
  | 'year'        // 1-2 years
  | 'months'      // 6-12 months
  | 'month'       // 3-6 months
  | 'weeks'       // 1-3 months
  | 'days';       // < 1 month

interface TimelineState {
  properties: Property[];
  events: TimelineEvent[];
  selectedProperty: string | null;
  selectedEvent: string | null;
  lastInteractedEventId: string | null; // Last selected, edited, or added event
  timelineStart: Date; // Currently visible start
  timelineEnd: Date; // Currently visible end
  absoluteStart: Date; // Earliest possible date (based on data)
  absoluteEnd: Date; // Latest possible date (today)
  zoom: number;
  zoomLevel: ZoomLevel;
  centerDate: Date; // The date at the center of the viewport
  isDarkMode: boolean; // Dark mode toggle

  // Actions
  addProperty: (property: Omit<Property, 'id' | 'branch'>) => void;
  updateProperty: (id: string, property: Partial<Property>) => void;
  deleteProperty: (id: string) => void;

  addEvent: (event: Omit<TimelineEvent, 'id'>) => void;
  updateEvent: (id: string, event: Partial<TimelineEvent>) => void;
  deleteEvent: (id: string) => void;
  moveEvent: (id: string, newPosition: number) => void;

  selectProperty: (id: string | null) => void;
  selectEvent: (id: string | null) => void;

  setZoom: (zoom: number) => void;
  setTimelineRange: (start: Date, end: Date) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setZoomByIndex: (index: number) => void; // Set zoom level by index (0-7)
  getZoomLevelIndex: () => number; // Get current zoom level index (0-7)
  setCenterDate: (date: Date) => void;
  panToPosition: (position: number) => void; // Position 0-100 on absolute timeline
  loadDemoData: () => void; // Load demo data from Excel sheet
  clearAllData: () => void; // Clear all properties and events
  toggleDarkMode: () => void; // Toggle dark mode
}

const propertyColors = [
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#14B8A6', // Teal
];

const eventColors: Record<EventType, string> = {
  purchase: '#3B82F6',
  move_in: '#10B981',
  move_out: '#EF4444',
  rent_start: '#F59E0B',
  rent_end: '#F97316',
  sale: '#8B5CF6',
  improvement: '#06B6D4',
  refinance: '#6366F1',
  status_change: '#A855F7',
};

// Status colors for visualization
export const statusColors: Record<PropertyStatus, string> = {
  ppr: '#10B981',         // Green - Principal Place of Residence
  rental: '#3B82F6',      // Blue - Rental/Investment
  vacant: '#94A3B8',      // Gray - Vacant
  construction: '#F59E0B', // Orange - Under construction
  sold: '#8B5CF6',        // Purple - Sold
};

// Zoom level definitions with their time spans in days
export const zoomLevels: Array<{ level: ZoomLevel; minDays: number; maxDays: number; label: string }> = [
  { level: 'decade', minDays: 3650, maxDays: Infinity, label: '10+ Years' },
  { level: 'multi-year', minDays: 1825, maxDays: 3650, label: '5-10 Years' },
  { level: 'years', minDays: 730, maxDays: 1825, label: '2-5 Years' },
  { level: 'year', minDays: 365, maxDays: 730, label: '1-2 Years' },
  { level: 'months', minDays: 180, maxDays: 365, label: '6-12 Months' },
  { level: 'month', minDays: 90, maxDays: 180, label: '3-6 Months' },
  { level: 'weeks', minDays: 30, maxDays: 90, label: '1-3 Months' },
  { level: 'days', minDays: 0, maxDays: 30, label: '< 1 Month' },
];

// Calculate zoom level from date range
const calculateZoomLevel = (start: Date, end: Date): ZoomLevel => {
  const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  for (const { level, minDays, maxDays } of zoomLevels) {
    if (days >= minDays && days < maxDays) {
      return level;
    }
  }

  return 'decade';
};

// Get next zoom level (more detailed)
const getNextZoomLevel = (current: ZoomLevel): ZoomLevel | null => {
  const currentIndex = zoomLevels.findIndex(z => z.level === current);
  if (currentIndex < zoomLevels.length - 1) {
    return zoomLevels[currentIndex + 1].level;
  }
  return null;
};

// Get previous zoom level (less detailed)
const getPreviousZoomLevel = (current: ZoomLevel): ZoomLevel | null => {
  const currentIndex = zoomLevels.findIndex(z => z.level === current);
  if (currentIndex > 0) {
    return zoomLevels[currentIndex - 1].level;
  }
  return null;
};

// Calculate date range for a zoom level centered on a date
const calculateDateRange = (centerDate: Date, targetLevel: ZoomLevel): { start: Date; end: Date } => {
  const zoomConfig = zoomLevels.find(z => z.level === targetLevel);
  if (!zoomConfig) return { start: new Date(), end: new Date() };

  // Use the midpoint of the range for this zoom level
  const targetDays = Math.floor((zoomConfig.minDays + Math.min(zoomConfig.maxDays, 7300)) / 2);
  const halfSpan = (targetDays / 2) * 24 * 60 * 60 * 1000;

  const start = new Date(centerDate.getTime() - halfSpan);
  const end = new Date(centerDate.getTime() + halfSpan);

  // Don't allow end date to be in the future
  const today = new Date();
  if (end > today) {
    const diff = end.getTime() - today.getTime();
    return {
      start: new Date(start.getTime() - diff),
      end: today
    };
  }

  return { start, end };
};

// Calculate property status periods from events
export interface StatusPeriod {
  status: PropertyStatus;
  startDate: Date;
  endDate: Date | null; // null means ongoing
}

export const calculateStatusPeriods = (events: TimelineEvent[]): StatusPeriod[] => {
  const periods: StatusPeriod[] = [];

  // Sort events by date
  const sortedEvents = [...events].sort((a, b) => a.date.getTime() - b.date.getTime());

  let currentStatus: PropertyStatus | null = null;
  let currentStartDate: Date | null = null;

  for (const event of sortedEvents) {
    // Determine status change from event
    let newStatus: PropertyStatus | null = null;

    switch (event.type) {
      case 'purchase':
        newStatus = event.isPPR ? 'ppr' : 'rental';
        break;
      case 'move_in':
        newStatus = 'ppr';
        break;
      case 'move_out':
        // After moving out, property might be vacant or rented
        newStatus = 'vacant';
        break;
      case 'rent_start':
        newStatus = 'rental';
        break;
      case 'rent_end':
        newStatus = 'vacant';
        break;
      case 'sale':
        newStatus = 'sold';
        break;
      case 'status_change':
        newStatus = event.newStatus || null;
        break;
    }

    // If status changed, close previous period and start new one
    if (newStatus && newStatus !== currentStatus) {
      if (currentStatus && currentStartDate) {
        periods.push({
          status: currentStatus,
          startDate: currentStartDate,
          endDate: event.date,
        });
      }

      currentStatus = newStatus;
      currentStartDate = event.date;
    }
  }

  // Add final ongoing period
  if (currentStatus && currentStartDate) {
    periods.push({
      status: currentStatus,
      startDate: currentStartDate,
      endDate: null,
    });
  }

  return periods;
};

const defaultAbsoluteStart = new Date(1900, 0, 1);
const defaultAbsoluteEnd = new Date();

export const useTimelineStore = create<TimelineState>((set, get) => ({
  properties: [],
  events: [],
  selectedProperty: null,
  selectedEvent: null,
  lastInteractedEventId: null,
  timelineStart: new Date(2020, 0, 1),
  timelineEnd: new Date(), // Today's date
  absoluteStart: defaultAbsoluteStart,
  absoluteEnd: defaultAbsoluteEnd,
  zoom: 1,
  zoomLevel: calculateZoomLevel(new Date(2020, 0, 1), new Date()),
  centerDate: new Date(
    (new Date(2020, 0, 1).getTime() + new Date().getTime()) / 2
  ),
  isDarkMode: false,
  
  addProperty: (property) => {
    const properties = get().properties;
    const newProperty: Property = {
      ...property,
      id: `prop-${Date.now()}`,
      color: property.color || propertyColors[properties.length % propertyColors.length],
      branch: properties.length,
    };
    set({ properties: [...properties, newProperty] });
  },
  
  updateProperty: (id, updates) => {
    set((state) => ({
      properties: state.properties.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    }));
  },
  
  deleteProperty: (id) => {
    set((state) => ({
      properties: state.properties.filter((p) => p.id !== id),
      events: state.events.filter((e) => e.propertyId !== id),
    }));
  },
  
  addEvent: (event) => {
    const newEvent: TimelineEvent = {
      ...event,
      id: `event-${Date.now()}`,
      color: event.color || eventColors[event.type],
    };
    set((state) => ({
      events: [...state.events, newEvent],
      lastInteractedEventId: newEvent.id,
      centerDate: newEvent.date
    }));
  },
  
  updateEvent: (id, updates) => {
    set((state) => {
      const updatedEvents = state.events.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      );
      const updatedEvent = updatedEvents.find(e => e.id === id);
      return {
        events: updatedEvents,
        lastInteractedEventId: id,
        centerDate: updatedEvent?.date || state.centerDate
      };
    });
  },
  
  deleteEvent: (id) => {
    set((state) => ({
      events: state.events.filter((e) => e.id !== id),
    }));
  },
  
  moveEvent: (id, newPosition) => {
    const state = get();
    const event = state.events.find((e) => e.id === id);
    if (!event) return;
    
    const timelineRange = state.timelineEnd.getTime() - state.timelineStart.getTime();
    const newTime = state.timelineStart.getTime() + (newPosition / 100) * timelineRange;
    const newDate = new Date(newTime);
    
    set((state) => ({
      events: state.events.map((e) =>
        e.id === id ? { ...e, position: newPosition, date: newDate } : e
      ),
    }));
  },
  
  selectProperty: (id) => set({ selectedProperty: id }),
  selectEvent: (id) => {
    const state = get();
    const event = state.events.find(e => e.id === id);
    set({
      selectedEvent: id,
      lastInteractedEventId: id,
      centerDate: event?.date || state.centerDate
    });
  },

  setZoom: (zoom) => set({ zoom: Math.max(0.5, Math.min(3, zoom)) }),

  setTimelineRange: (start, end) => {
    const state = get();
    const newCenterDate = new Date((start.getTime() + end.getTime()) / 2);
    const newZoomLevel = calculateZoomLevel(start, end);

    // Expand absolute range if needed to accommodate the new range
    const newAbsoluteStart = start < state.absoluteStart ? start : state.absoluteStart;
    const newAbsoluteEnd = end > state.absoluteEnd ? end : state.absoluteEnd;

    set({
      timelineStart: start,
      timelineEnd: end,
      centerDate: newCenterDate,
      zoomLevel: newZoomLevel,
      absoluteStart: newAbsoluteStart,
      absoluteEnd: newAbsoluteEnd,
    });
  },

  setCenterDate: (date) => set({ centerDate: date }),

  zoomIn: () => {
    const state = get();
    const nextLevel = getNextZoomLevel(state.zoomLevel);

    if (nextLevel) {
      const { start, end } = calculateDateRange(state.centerDate, nextLevel);
      set({
        timelineStart: start,
        timelineEnd: end,
        zoomLevel: nextLevel,
      });
    }
  },

  zoomOut: () => {
    const state = get();
    const prevLevel = getPreviousZoomLevel(state.zoomLevel);

    if (prevLevel) {
      const { start, end } = calculateDateRange(state.centerDate, prevLevel);
      set({
        timelineStart: start,
        timelineEnd: end,
        zoomLevel: prevLevel,
      });
    }
  },

  setZoomByIndex: (index: number) => {
    const state = get();
    const clampedIndex = Math.max(0, Math.min(zoomLevels.length - 1, index));
    const targetLevel = zoomLevels[clampedIndex].level;

    if (targetLevel !== state.zoomLevel) {
      const { start, end } = calculateDateRange(state.centerDate, targetLevel);
      set({
        timelineStart: start,
        timelineEnd: end,
        zoomLevel: targetLevel,
      });
    }
  },

  getZoomLevelIndex: () => {
    const state = get();
    return zoomLevels.findIndex(z => z.level === state.zoomLevel);
  },

  panToPosition: (position: number) => {
    const state = get();
    const absoluteRange = state.absoluteEnd.getTime() - state.absoluteStart.getTime();
    const newCenterTime = state.absoluteStart.getTime() + (position / 100) * absoluteRange;
    const newCenterDate = new Date(newCenterTime);

    const { start, end } = calculateDateRange(newCenterDate, state.zoomLevel);

    set({
      timelineStart: start,
      timelineEnd: end,
      centerDate: newCenterDate,
    });
  },

  loadDemoData: () => {
    const demoProperties: Property[] = [];
    const demoEvents: TimelineEvent[] = [];

    // Property 1: 45 Collard Road, Humpty Doo
    const prop1 = {
      id: 'demo-prop-1',
      name: 'Humpty Doo, NT 0836',
      address: '45 Collard Road',
      color: propertyColors[0],
      purchasePrice: 106000,
      purchaseDate: new Date(2003, 0, 1),
      salePrice: 450000,
      saleDate: new Date(2023, 6, 14),
      currentStatus: 'sold' as PropertyStatus,
      branch: 0,
    };
    demoProperties.push(prop1);

    // Events for Property 1
    demoEvents.push({
      id: 'demo-event-1-1',
      propertyId: prop1.id,
      type: 'purchase',
      date: new Date(2003, 0, 1),
      title: 'Purchase',
      amount: 106000,
      position: 0,
      color: eventColors.purchase,
      isPPR: true,
    });

    demoEvents.push({
      id: 'demo-event-1-2',
      propertyId: prop1.id,
      type: 'move_in',
      date: new Date(2003, 0, 1),
      title: 'Move In',
      position: 0,
      color: eventColors.move_in,
      isPPR: true,
    });

    demoEvents.push({
      id: 'demo-event-1-3',
      propertyId: prop1.id,
      type: 'rent_start',
      date: new Date(2020, 0, 1),
      title: 'Start Rent',
      position: 0,
      color: eventColors.rent_start,
    });

    demoEvents.push({
      id: 'demo-event-1-4',
      propertyId: prop1.id,
      type: 'sale',
      date: new Date(2023, 6, 14),
      title: 'Sold as PPR',
      amount: 450000,
      position: 0,
      color: eventColors.sale,
      isPPR: true,
      contractDate: new Date(2023, 6, 14),
    });

    // Property 2: 50 Flynn Circuit, Bellamack
    const prop2 = {
      id: 'demo-prop-2',
      name: 'Bellamack, NT 0832',
      address: '50 Flynn Circuit',
      color: propertyColors[1],
      purchasePrice: 705000,
      purchaseDate: new Date(2014, 5, 5),
      currentStatus: 'rental' as PropertyStatus,
      branch: 1,
    };
    demoProperties.push(prop2);

    demoEvents.push({
      id: 'demo-event-2-1',
      propertyId: prop2.id,
      type: 'purchase',
      date: new Date(2014, 5, 5),
      title: 'Purchase',
      amount: 705000,
      position: 0,
      color: eventColors.purchase,
    });

    demoEvents.push({
      id: 'demo-event-2-2',
      propertyId: prop2.id,
      type: 'rent_start',
      date: new Date(2014, 5, 20),
      title: 'Start Rent',
      position: 0,
      color: eventColors.rent_start,
    });

    // Property 3: 5 Wanda Dr, Boyne Island
    const prop3 = {
      id: 'demo-prop-3',
      name: 'Boyne Island, Qld 4680',
      address: '5 Wanda Dr',
      color: propertyColors[2],
      purchasePrice: 530000,
      purchaseDate: new Date(2021, 8, 30),
      currentStatus: 'ppr' as PropertyStatus,
      branch: 2,
    };
    demoProperties.push(prop3);

    demoEvents.push({
      id: 'demo-event-3-1',
      propertyId: prop3.id,
      type: 'purchase',
      date: new Date(2021, 8, 30),
      title: 'Purchase',
      amount: 530000,
      position: 0,
      color: eventColors.purchase,
      isPPR: true,
    });

    demoEvents.push({
      id: 'demo-event-3-2',
      propertyId: prop3.id,
      type: 'move_in',
      date: new Date(2021, 8, 30),
      title: 'Move In',
      position: 0,
      color: eventColors.move_in,
      isPPR: true,
    });

    demoEvents.push({
      id: 'demo-event-3-3',
      propertyId: prop3.id,
      type: 'improvement',
      date: new Date(2022, 3, 15),
      title: 'Renovation',
      amount: 45000,
      position: 0,
      color: eventColors.improvement,
      description: 'Kitchen and bathroom renovation',
    });

    // Property 4: Boyne Island Rental (Living as tenant)
    const prop4 = {
      id: 'demo-prop-4',
      name: 'Boyne Island Rental, Qld 4680',
      address: 'Rental Property',
      color: propertyColors[3],
      currentStatus: 'rental' as PropertyStatus,
      branch: 3,
    };
    demoProperties.push(prop4);

    demoEvents.push({
      id: 'demo-event-4-1',
      propertyId: prop4.id,
      type: 'move_in',
      date: new Date(2020, 0, 1),
      title: 'Living in Rental',
      position: 0,
      color: eventColors.move_in,
      description: 'Living in a rental property',
    });

    // Set the demo data
    set({
      properties: demoProperties,
      events: demoEvents,
      timelineStart: new Date(2003, 0, 1),
      timelineEnd: new Date(),
      absoluteStart: new Date(2003, 0, 1),
      absoluteEnd: new Date(),
      centerDate: new Date(2013, 0, 1),
      zoomLevel: 'decade',
    });
  },

  clearAllData: () => {
    set({
      properties: [],
      events: [],
      selectedProperty: null,
      selectedEvent: null,
      lastInteractedEventId: null,
    });
  },

  toggleDarkMode: () => {
    const state = get();
    const newDarkMode = !state.isDarkMode;
    set({ isDarkMode: newDarkMode });

    // Update document class for Tailwind dark mode
    if (typeof window !== 'undefined') {
      if (newDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  },
}));
