/*
'use client';

import React from 'react';
import { useTimelineStore } from '@/store/timeline';
import { Sparkles } from 'lucide-react';

export default function DemoDataLoader() {
    const { properties, addProperty, addEvent } = useTimelineStore();

    const loadDemoData = () => {
        // Add first property (stays on main line)
        const prop1Id = addProperty({
            name: 'Main Residence',
            address: '123 Oak Street, Melbourne',
            color: '#3B82F6',
            purchasePrice: 650000,
            currentValue: 850000,
        });

        // Add events for first property
        setTimeout(() => {
            addEvent({
                propertyId: prop1Id,
                type: 'purchase',
                date: new Date(2020, 2, 15),
                title: 'Purchase',
                amount: 650000,
                position: 20,
                color: '#3B82F6',
            });

            addEvent({
                propertyId: prop1Id,
                type: 'move_in',
                date: new Date(2026, 3, 1),
                title: 'Move In',
                position: 22,
                color: '#10B981',
            });

            addEvent({
                propertyId: prop1Id,
                type: 'improvement',
                date: new Date(2029, 5, 10),
                title: 'Kitchen Renovation',
                amount: 45000,
                position: 40,
                color: '#06B6D4',
                description: 'Complete kitchen remodel',
            });
        }, 100);

        // Add second property (first branch)
        setTimeout(() => {
            const prop2Id = addProperty({
                name: 'Investment Unit',
                address: '456 Beach Road, Sydney',
                color: '#F59E0B',
                purchasePrice: 480000,
            });

            // Add events for second property
            setTimeout(() => {
                addEvent({
                    propertyId: prop2Id,
                    type: 'purchase',
                    date: new Date(2023, 8, 20),
                    title: 'Purchase',
                    amount: 480000,
                    position: 45,
                    color: '#3B82F6',
                });

                addEvent({
                    propertyId: prop2Id,
                    type: 'rent_start',
                    date: new Date(2025, 9, 1),
                    title: 'Start Rent',
                    amount: 2400,
                    position: 48,
                    color: '#F59E0B',
                    description: '$600/week rental income',
                });

                addEvent({
                    propertyId: prop2Id,
                    type: 'improvement',
                    date: new Date(2028, 2, 15),
                    title: 'Bathroom Update',
                    amount: 12000,
                    position: 55,
                    color: '#06B6D4',
                });
            }, 100);
        }, 300);

        // Add third property (second branch)
        setTimeout(() => {
            const prop3Id = addProperty({
                name: 'Holiday Home',
                address: '789 Mountain View, Blue Mountains',
                color: '#10B981',
                purchasePrice: 720000,
            });

            // Add events for third property
            setTimeout(() => {
                addEvent({
                    propertyId: prop3Id,
                    type: 'purchase',
                    date: new Date(2026, 6, 1),
                    title: 'Purchase',
                    amount: 720000,
                    position: 62,
                    color: '#3B82F6',
                });

                addEvent({
                    propertyId: prop3Id,
                    type: 'improvement',
                    date: new Date(2028, 0, 10),
                    title: 'Solar Installation',
                    amount: 18000,
                    position: 72,
                    color: '#06B6D4',
                });

                addEvent({
                    propertyId: prop3Id,
                    type: 'sale',
                    date: new Date(2029, 10, 15),
                    title: 'Sale',
                    amount: 890000,
                    position: 88,
                    color: '#8B5CF6',
                });
            }, 100);
        }, 600);
    };

    if (properties.length > 0) return null;

    return (
        <div className="absolute top-20 right-8 z-40">
            <button
                onClick={loadDemoData}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
                <Sparkles className="w-4 h-4" />
                <span className="font-medium">Load Demo Data</span>
            </button>
        </div>
    );
}*/
