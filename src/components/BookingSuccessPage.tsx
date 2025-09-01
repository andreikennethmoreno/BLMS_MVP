import React from 'react';
import { CheckCircle, Calendar, MapPin, Mail, Download } from 'lucide-react';

interface BookingSuccessPageProps {
  booking: {
    id: string;
    propertyTitle: string;
    propertyAddress: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    totalAmount: number;
  };
  onContinue: () => void;
}

const BookingSuccessPage: React.FC<BookingSuccessPageProps> = ({ booking, onContinue }) => {
  const calculateNights = () => {
    const start = new Date(booking.checkIn);
    const end = new Date(booking.checkOut);
    const timeDiff = end.getTime() - start.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  const downloadConfirmation = () => {
    const confirmationData = `
BOOKING CONFIRMATION
====================

Booking ID: ${booking.id}
Property: ${booking.propertyTitle}
Address: ${booking.propertyAddress}
Check-in: ${new Date(booking.checkIn).toLocaleDateString()}
Check-out: ${new Date(booking.checkOut).toLocaleDateString()}
Guests: ${booking.guests}
Total Amount: $${booking.totalAmount}

Thank you for your booking!
    `.trim();

    const blob = new Blob([confirmationData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `booking-confirmation-${booking.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Success Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
          <p className="text-gray-600 mb-8">
            Your reservation has been successfully confirmed. You'll receive a confirmation email shortly.
          </p>

          {/* Booking Details Card */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Booking Details</h2>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-gray-500" />
                <div>
                  <div className="font-medium text-gray-900">{booking.propertyTitle}</div>
                  <div className="text-gray-600">{booking.propertyAddress}</div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-500" />
                <div>
                  <div className="font-medium text-gray-900">
                    {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                  </div>
                  <div className="text-gray-600">{calculateNights()} nights • {booking.guests} guests</div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-500" />
                <div>
                  <div className="font-medium text-gray-900">Booking ID: {booking.id}</div>
                  <div className="text-gray-600">Total: ${booking.totalAmount}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <button
              onClick={downloadConfirmation}
              className="w-full flex items-center justify-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              <Download className="w-5 h-5" />
              <span>Download Confirmation</span>
            </button>

            <button
              onClick={onContinue}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Continue Browsing
            </button>
          </div>

          <div className="mt-6 text-sm text-gray-500">
            <p>Questions about your booking? Contact us at support@hotelplatform.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccessPage;