import React, { useState } from 'react';
import { CreditCard, Calendar, Users, MapPin, Shield, CheckCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import bookingsData from '../data/bookings.json';
import { getDisplayRate } from '../utils/propertyCalculations';

interface Property {
  id: string;
  title: string;
  address: string;
  images: string[];
  finalRate: number;
  proposedRate: number;
}

interface CheckoutPageProps {
  property: Property;
  checkIn: string;
  checkOut: string;
  guests: number;
  onBack: () => void;
  onComplete: () => void;
}

const CheckoutPage: React.FC<CheckoutPageProps> = ({
  property,
  checkIn,
  checkOut,
  guests,
  onBack,
  onComplete
}) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useLocalStorage('bookings', bookingsData.bookings);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    nameOnCard: '',
    billingAddress: '',
    city: '',
    zipCode: ''
  });

  const calculateNights = () => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const timeDiff = end.getTime() - start.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  const nights = calculateNights();
  const rate = getDisplayRate(property);
  const subtotal = rate * nights;
  const serviceFee = Math.round(subtotal * 0.12); // 12% service fee
  const taxes = Math.round(subtotal * 0.08); // 8% taxes
  const total = subtotal + serviceFee + taxes;

  const handlePayment = async () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 3000));

    const newBooking = {
      id: `booking-${Date.now()}`,
      propertyId: property.id,
      customerId: user?.id || '',
      checkIn,
      checkOut,
      guests,
      totalAmount: total,
      status: 'confirmed',
      paymentStatus: 'paid',
      bookedAt: new Date().toISOString(),
      customerName: user?.name || '',
      customerEmail: user?.email || ''
    };

    setBookings([...bookings, newBooking]);
    setIsProcessing(false);
    onComplete();
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to property</span>
          </button>
          <div className="h-6 w-px bg-gray-300" />
          <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Booking Summary */}
          <div className="space-y-6">
            {/* Property Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Stay</h2>
              
              <div className="flex items-start space-x-4 mb-6">
                <img
                  src={property.images[0]}
                  alt={property.title}
                  className="w-24 h-24 rounded-lg object-cover"
                />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{property.title}</h3>
                  <p className="text-gray-600 flex items-center mt-1">
                    <MapPin className="w-4 h-4 mr-1" />
                    {property.address}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <div className="text-sm text-gray-500">Check-in</div>
                  <div className="font-semibold text-gray-900">
                    {new Date(checkIn).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Check-out</div>
                  <div className="font-semibold text-gray-900">
                    {new Date(checkOut).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Duration</div>
                  <div className="font-semibold text-gray-900">{nights} night{nights > 1 ? 's' : ''}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Guests</div>
                  <div className="font-semibold text-gray-900">{guests} guest{guests > 1 ? 's' : ''}</div>
                </div>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Price Breakdown</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">${rate} × {nights} nights</span>
                  <span className="text-gray-900">${subtotal}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Service fee</span>
                  <span className="text-gray-900">${serviceFee}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Taxes</span>
                  <span className="text-gray-900">${taxes}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-purple-600">${total}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cancellation Policy */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Cancellation Policy</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p>• Free cancellation until 48 hours before check-in</p>
                <p>• 50% refund for cancellations within 48 hours</p>
                <p>• No refund for no-shows</p>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Information</h2>

              {/* Payment Method Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Payment Method
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="flex items-center space-x-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <CreditCard className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-900">Credit/Debit Card</span>
                  </label>
                  <label className="flex items-center space-x-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 opacity-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="paypal"
                      disabled
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <div className="w-5 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center">P</div>
                    <span className="font-medium text-gray-900">PayPal (Coming Soon)</span>
                  </label>
                </div>
              </div>

              {/* Card Details */}
              {paymentMethod === 'card' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Card Number *
                    </label>
                    <input
                      type="text"
                      value={paymentDetails.cardNumber}
                      onChange={(e) => setPaymentDetails(prev => ({ 
                        ...prev, 
                        cardNumber: formatCardNumber(e.target.value) 
                      }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expiry Date *
                      </label>
                      <input
                        type="text"
                        value={paymentDetails.expiryDate}
                        onChange={(e) => setPaymentDetails(prev => ({ ...prev, expiryDate: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="MM/YY"
                        maxLength={5}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CVV *
                      </label>
                      <input
                        type="text"
                        value={paymentDetails.cvv}
                        onChange={(e) => setPaymentDetails(prev => ({ ...prev, cvv: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="123"
                        maxLength={4}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name on Card *
                    </label>
                    <input
                      type="text"
                      value={paymentDetails.nameOnCard}
                      onChange={(e) => setPaymentDetails(prev => ({ ...prev, nameOnCard: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="John Smith"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Billing Address *
                    </label>
                    <input
                      type="text"
                      value={paymentDetails.billingAddress}
                      onChange={(e) => setPaymentDetails(prev => ({ ...prev, billingAddress: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="123 Main Street"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        value={paymentDetails.city}
                        onChange={(e) => setPaymentDetails(prev => ({ ...prev, city: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="New York"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ZIP Code *
                      </label>
                      <input
                        type="text"
                        value={paymentDetails.zipCode}
                        onChange={(e) => setPaymentDetails(prev => ({ ...prev, zipCode: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="10001"
                      />
                      {property.maxStayDisplay && (
                        <div className="md:col-span-2">
                          <span className="text-sm text-gray-500">Maximum Stay</span>
                          <div className="font-semibold text-gray-900 flex items-center space-x-2">
                            <span>{property.maxStayDisplay}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              property.termClassification === 'short-term' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {property.termClassification === 'short-term' ? 'Short-term' : 'Long-term'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Security Notice */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900">Secure Payment</h4>
                  <p className="text-green-800 text-sm">Your payment information is encrypted and secure. We never store your card details.</p>
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Terms & Conditions</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    required
                    className="mt-1 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span>
                    I agree to the <a href="#" className="text-purple-600 hover:underline">Terms of Service</a> and <a href="#" className="text-purple-600 hover:underline">Privacy Policy</a>
                  </span>
                </label>
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    required
                    className="mt-1 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span>
                    I understand the cancellation policy and agree to the booking terms
                  </span>
                </label>
              </div>
            </div>

            {/* Complete Booking Button */}
            <button
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing Payment...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Complete Booking - ${total}</span>
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 text-center">
              You will be charged ${total} for this booking
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;