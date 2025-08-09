import React, { useState, useEffect } from 'react';
import { Star, Clock, CheckCircle, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import bookingsData from '../data/bookings.json';
import propertiesData from '../data/properties.json';
import reviewsData from '../data/reviews.json';

interface ReviewReminder {
  id: string;
  bookingId: string;
  propertyId: string;
  customerId: string;
  checkoutDate: string;
  propertyTitle: string;
  dismissed: boolean;
  reviewSubmitted: boolean;
  createdAt: string;
}

const ReviewReminderSystem: React.FC = () => {
  const { user } = useAuth();
  const [bookings] = useLocalStorage('bookings', bookingsData.bookings);
  const [properties] = useLocalStorage('properties', propertiesData.properties);
  const [reviews] = useLocalStorage('reviews', reviewsData.reviews);
  const [reminders, setReminders] = useLocalStorage<ReviewReminder[]>('reviewReminders', []);
  const [showReminders, setShowReminders] = useState<ReviewReminder[]>([]);

  useEffect(() => {
    if (!user || user.role !== 'customer') return;

    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000));

    // Find completed bookings that need review reminders
    const completedBookings = bookings.filter((booking: any) => {
      const checkoutDate = new Date(booking.checkOut);
      const hasReview = reviews.some((review: any) => 
        review.bookingId === booking.id && review.customerId === user.id
      );
      const hasReminder = reminders.some(reminder => 
        reminder.bookingId === booking.id
      );

      return (
        booking.customerId === user.id &&
        booking.status === 'confirmed' &&
        checkoutDate < now &&
        checkoutDate > threeDaysAgo &&
        !hasReview &&
        !hasReminder
      );
    });

    // Create new reminders for completed bookings
    const newReminders = completedBookings.map((booking: any) => {
      const property = properties.find((p: any) => p.id === booking.propertyId);
      return {
        id: `reminder-${booking.id}`,
        bookingId: booking.id,
        propertyId: booking.propertyId,
        customerId: user.id,
        checkoutDate: booking.checkOut,
        propertyTitle: property?.title || 'Unknown Property',
        dismissed: false,
        reviewSubmitted: false,
        createdAt: new Date().toISOString()
      };
    });

    if (newReminders.length > 0) {
      setReminders([...reminders, ...newReminders]);
    }

    // Show active reminders (not dismissed and no review submitted)
    const activeReminders = [...reminders, ...newReminders].filter(reminder => 
      reminder.customerId === user.id &&
      !reminder.dismissed &&
      !reminder.reviewSubmitted &&
      !reviews.some((review: any) => review.bookingId === reminder.bookingId)
    );

    setShowReminders(activeReminders);
  }, [user, bookings, properties, reviews, reminders, setReminders]);

  const dismissReminder = (reminderId: string) => {
    const updatedReminders = reminders.map(reminder =>
      reminder.id === reminderId ? { ...reminder, dismissed: true } : reminder
    );
    setReminders(updatedReminders);
    setShowReminders(showReminders.filter(r => r.id !== reminderId));
  };

  const markReviewSubmitted = (bookingId: string) => {
    const updatedReminders = reminders.map(reminder =>
      reminder.bookingId === bookingId ? { ...reminder, reviewSubmitted: true } : reminder
    );
    setReminders(updatedReminders);
    setShowReminders(showReminders.filter(r => r.bookingId !== bookingId));
  };

  if (showReminders.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-3">
      {showReminders.map((reminder) => (
        <div
          key={reminder.id}
          className="bg-white border border-yellow-200 rounded-lg shadow-lg p-4 max-w-sm animate-slide-in"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <h4 className="font-medium text-gray-900">Review Reminder</h4>
            </div>
            <button
              onClick={() => dismissReminder(reminder.id)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-sm text-gray-700 mb-3">
            How was your stay at <strong>{reminder.propertyTitle}</strong>?
          </p>

          <div className="flex items-center space-x-2 text-xs text-gray-500 mb-3">
            <Clock className="w-3 h-3" />
            <span>Checked out: {new Date(reminder.checkoutDate).toLocaleDateString()}</span>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => {
                // Navigate to property page or open review modal
                // For now, we'll just mark as handled
                markReviewSubmitted(reminder.bookingId);
                alert('Review feature would open here. For demo, marking as handled.');
              }}
              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm px-3 py-2 rounded-lg transition-colors"
            >
              Leave Review
            </button>
            <button
              onClick={() => dismissReminder(reminder.id)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm px-3 py-2 rounded-lg transition-colors"
            >
              Later
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReviewReminderSystem;