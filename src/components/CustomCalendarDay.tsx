import React from 'react';
import { DayPickerProps } from 'react-day-picker';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface CustomCalendarDayProps extends DayPickerProps {
  date: Date;
  displayMonth: Date;
  dayReservationSegments: Map<string, { type: 'arrival' | 'departure' | 'middle' | 'single', channel: string }[]>;
  channelColors: { [key: string]: { name: string; bgColor: string; textColor: string; } };
}

const CustomCalendarDay: React.FC<CustomCalendarDayProps> = ({ date, displayMonth, dayReservationSegments, channelColors, ...props }) => {
  const dayKey = format(date, 'yyyy-MM-dd');
  const segments = dayReservationSegments.get(dayKey);

  const isOutside = !format(date, 'yyyy-MM').includes(format(displayMonth, 'yyyy-MM'));

  let customClasses = '';
  if (segments && segments.length > 0) {
    // Prioritize single, then arrival, then departure, then middle for display if multiple overlap
    const segment = segments.find(s => s.type === 'single') || 
                     segments.find(s => s.type === 'arrival') || 
                     segments.find(s => s.type === 'departure') || 
                     segments[0]; // Fallback to first if no specific priority

    if (segment) {
      customClasses += ` rdp-day_${segment.type}`;
      // If you want channel-specific colors on the calendar day itself, you'd add them here
      // const channelInfo = channelColors[segment.channel] || channelColors['UNKNOWN'];
      // customClasses += ` ${channelInfo.bgColor} ${channelInfo.textColor}`;
    }
  }

  return (
    <div className={cn("rdp-day", props.className)} style={props.style}>
      <button
        {...props.buttonProps}
        className={cn(
          "rdp-button",
          "w-full h-full flex items-center justify-center text-sm font-medium",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[selected]:hover:bg-primary data-[selected]:hover:text-primary-foreground data-[selected]:focus:bg-primary data-[selected]:focus:text-primary-foreground",
          "data-[disabled]:text-muted-foreground data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed",
          "data-[outside]:text-muted-foreground data-[outside]:data-[selected]:bg-accent/50 data-[outside]:data-[selected]:text-muted-foreground data-[outside]:data-[selected]:hover:bg-accent/50 data-[outside]:data-[selected]:hover:text-muted-foreground",
          "data-[unavailable]:text-muted-foreground data-[unavailable]:opacity-50 data-[unavailable]:cursor-not-allowed",
          
          // Apply custom reservation styles from globals.css via customClasses
          customClasses,
          isOutside && segments && segments.length > 0 ? "opacity-50" : "", // Dim booked days outside current month
          "transition-colors duration-100 ease-in-out" // Smooth transition for hover/selection
        )}
      >
        {format(date, 'd')}
      </button>
    </div>
  );
};

export default CustomCalendarDay;