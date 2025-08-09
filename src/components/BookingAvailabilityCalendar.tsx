import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface BookingAvailabilityCalendarProps {
  propertyId: string;
  bookedDates: string[];
  selectedCheckIn: string;
  selectedCheckOut: string;
  onDateSelect: (checkIn: string, checkOut: string) => void;
  minNights?: number;
}

const BookingAvailabilityCalendar: React.FC<BookingAvailabilityCalendarProps> = ({
  propertyId,
  bookedDates,
  selectedCheckIn,
  selectedCheckOut,
  onDateSelect,
  minNights = 1
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectingCheckOut, setSelectingCheckOut] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Generate calendar days for current month
  const generateCalendarDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    while (current <= lastDay || current.getDay() !== 0) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const isDateBooked = (date: Date) => {
    const dateStr = formatDate(date);
    return bookedDates.includes(dateStr);
  };

  const isDateInPast = (date: Date) => {
    return date < today;
  };

  const isDateSelected = (date: Date) => {
    const dateStr = formatDate(date);
    return dateStr === selectedCheckIn || dateStr === selectedCheckOut;
  };

  const isDateInRange = (date: Date) => {
    if (!selectedCheckIn || !selectedCheckOut) return false;
    const dateStr = formatDate(date);
    return dateStr > selectedCheckIn && dateStr < selectedCheckOut;
  };

  const handleDateClick = (date: Date) => {
    const dateStr = formatDate(date);
    
    if (isDateInPast(date) || isDateBooked(date)) {
      return;
    }

    if (!selectedCheckIn || (selectedCheckIn && selectedCheckOut)) {
      // Start new selection
      onDateSelect(dateStr, '');
      setSelectingCheckOut(true);
    } else if (selectingCheckOut) {
      // Select check-out date
      if (dateStr > selectedCheckIn) {
        // Check if there are any booked dates between check-in and check-out
        const checkInDate = new Date(selectedCheckIn);
        const checkOutDate = new Date(dateStr);
        let hasBlockedDates = false;
        
        const current = new Date(checkInDate);
        current.setDate(current.getDate() + 1);
        
        while (current < checkOutDate) {
          if (isDateBooked(current)) {
            hasBlockedDates = true;
            break;
          }
          current.setDate(current.getDate() + 1);
        }
        
        if (!hasBlockedDates) {
          const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
          if (nights >= minNights) {
            onDateSelect(selectedCheckIn, dateStr);
            setSelectingCheckOut(false);
          } else {
            alert(`Minimum stay is ${minNights} night${minNights > 1 ? 's' : ''}`);
          }
        } else {
          alert('Selected date range contains unavailable dates');
        }
      } else {
        // If selected date is before check-in, start over
        onDateSelect(dateStr, '');
        setSelectingCheckOut(true);
      }
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const calendarDays = generateCalendarDays(currentMonth);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Select Dates
        </h3>
      </div>

      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          disabled={currentMonth <= today}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <h4 className="text-lg font-medium">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h4>
        
        <button
          onClick={() => navigateMonth('next')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 p-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, index) => {
          const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
          const isPast = isDateInPast(date);
          const isBooked = isDateBooked(date);
          const isSelected = isDateSelected(date);
          const isInRange = isDateInRange(date);
          const isClickable = isCurrentMonth && !isPast && !isBooked;

          return (
            <button
              key={index}
              onClick={() => handleDateClick(date)}
              disabled={!isClickable}
              className={`
                p-2 text-sm rounded-lg transition-colors relative
                ${!isCurrentMonth ? 'text-gray-300' : ''}
                ${isPast ? 'text-gray-400 cursor-not-allowed' : ''}
                ${isBooked ? 'bg-red-100 text-red-600 cursor-not-allowed line-through' : ''}
                ${isSelected ? 'bg-purple-600 text-white' : ''}
                ${isInRange ? 'bg-purple-100 text-purple-800' : ''}
                ${isClickable && !isSelected && !isInRange ? 'hover:bg-gray-100' : ''}
              `}
            >
              {date.getDate()}
              {isBooked && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-purple-600 rounded"></div>
          <span>Selected</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-purple-100 rounded"></div>
          <span>In Range</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-red-100 rounded"></div>
          <span>Unavailable</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-gray-100 rounded"></div>
          <span>Available</span>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-3 text-sm text-gray-600">
        {!selectedCheckIn && "Click a date to select check-in"}
        {selectedCheckIn && !selectedCheckOut && "Click a date to select check-out"}
        {selectedCheckIn && selectedCheckOut && "Click a new date to change selection"}
      </div>
    </div>
  );
};

export default BookingAvailabilityCalendar;