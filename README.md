# CGT Timeline - Capital Gains Tax Property Timeline

A modern, interactive timeline application for managing property events and capital gains tax calculations. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 📍 **Click-to-Add Events**: Simply click anywhere on the timeline to add events
- 🏠 **Multiple Properties**: Manage multiple properties with GitHub-style branch visualization
- 🎯 **Drag & Drop**: Drag events along the timeline to change dates
- 📊 **Automatic Calculations**: Track purchase prices, improvements, and calculate capital gains
- 💾 **Import/Export**: Save and load your timeline data
- 🎨 **Beautiful UI**: Clean, modern interface with smooth animations
- 📱 **Responsive Design**: Works on all screen sizes

## Event Types

- **Purchase**: Record property purchases
- **Move In**: Track when you moved into the property
- **Move Out**: Record when you moved out
- **Rent Start/End**: Track rental periods
- **Sale**: Record property sales
- **Improvement**: Track property improvements and renovations
- **Refinance**: Record refinancing events

## Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Use

1. **Add a Property**: Click anywhere on the timeline and select "Add Property"
2. **Add Events**: Click on the timeline to add events to your properties
3. **Drag Events**: Click and drag event cards to change their dates
4. **View Details**: Click on a property to see detailed information in the side panel
5. **Export Data**: Use the export button to save your timeline data

## Technologies Used

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Smooth animations
- **Zustand**: State management
- **date-fns**: Date manipulation
- **Lucide Icons**: Beautiful icon set

## Project Structure

```
src/
├── app/              # Next.js app directory
├── components/       # React components
│   ├── Timeline.tsx
│   ├── PropertyBranch.tsx
│   ├── EventCard.tsx
│   ├── QuickAddMenu.tsx
│   ├── TimelineControls.tsx
│   └── PropertyPanel.tsx
├── store/           # Zustand state management
│   └── timeline.ts
└── lib/            # Utility functions
    └── utils.ts
```

## Build for Production

```bash
npm run build
npm start
```

## License

MIT
