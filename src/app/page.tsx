'use client';

import Timeline from '@/components/Timeline';
import PropertyPanel from '@/components/PropertyPanel';
import { useTimelineStore } from '@/store/timeline';

export default function Home() {
  const { selectedProperty } = useTimelineStore();

  return (
    <main className="w-screen h-screen overflow-hidden flex">
      {/* Main Timeline Area */}
      <div className="flex-1 h-full">
        <Timeline className="w-full h-full" />
      </div>
      
      {/* Property Details Panel (slides in when property selected) */}
      {selectedProperty && (
        <PropertyPanel />
      )}
    </main>
  );
}
