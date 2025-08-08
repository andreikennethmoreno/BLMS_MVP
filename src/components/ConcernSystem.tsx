import React, { useState } from 'react';
import { AlertTriangle, MessageCircle, Clock, CheckCircle, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import concernsData from '../data/concerns.json';
import bookingsData from '../data/bookings.json';
import propertiesData from '../data/properties.json';

interface Concern {
  id: string;
  bookingId: string;
  propertyId: string;
  customerId: string;
  ownerId: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  customerName: string;
  messages: Message[];
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
}

const ConcernSystem: React.FC = () => {
  const { user } = useAuth();
  const [concerns, setConcerns] = useLocalStorage('concerns', concernsData.concerns);
  const [bookings] = useLocalStorage('bookings', bookingsData.bookings);
  const [properties] = useLocalStorage('properties', propertiesData.properties);
  const [showNewConcernForm, setShowNewConcernForm] = useState(false);
  const [selectedConcern, setSelectedConcern] = useState<Concern | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [newConcern, setNewConcern] = useState({
    title: '',
    description: '',
    priority: 'medium'
  });

  // Get current bookings for customer
  const getCurrentBookings = () => {
    if (!user || user.role !== 'customer') return [];
    
    const now = new Date();
    return bookings.filter((booking: any) => {
      const checkIn = new Date(booking.checkIn);
      const checkOut = new Date(booking.checkOut);
      return booking.customerId === user.id && 
             booking.status === 'confirmed' &&
             checkIn <= now && 
             checkOut > now;
    });
  };

  // Get concerns based on user role
  const getUserConcerns = () => {
    if (!user) return [];
    
    switch (user.role) {
      case 'customer':
        return concerns.filter((c: Concern) => c.customerId === user.id);
      case 'unit_owner':
        return concerns.filter((c: Concern) => c.ownerId === user.id);
      case 'property_manager':
        return concerns;
      default:
        return [];
    }
  };

  const handleSubmitConcern = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const currentBookings = getCurrentBookings();
    if (currentBookings.length === 0) return;

    const booking = currentBookings[0]; // Use first current booking
    const property = properties.find((p: any) => p.id === booking.propertyId);

    const concern: Concern = {
      id: `concern-${Date.now()}`,
      bookingId: booking.id,
      propertyId: booking.propertyId,
      customerId: user.id,
      ownerId: property?.ownerId || '',
      title: newConcern.title,
      description: newConcern.description,
      status: 'pending',
      priority: newConcern.priority,
      createdAt: new Date().toISOString(),
      customerName: user.name,
      messages: [
        {
          id: `msg-${Date.now()}`,
          senderId: user.id,
          senderName: user.name,
          message: newConcern.description,
          timestamp: new Date().toISOString()
        }
      ]
    };

    setConcerns([...concerns, concern]);
    setShowNewConcernForm(false);
    setNewConcern({ title: '', description: '', priority: 'medium' });
  };

  const handleSendMessage = (concernId: string) => {
    if (!newMessage.trim() || !user) return;

    const message: Message = {
      id: `msg-${Date.now()}`,
      senderId: user.id,
      senderName: user.name,
      message: newMessage,
      timestamp: new Date().toISOString()
    };

    const updatedConcerns = concerns.map((c: Concern) =>
      c.id === concernId
        ? { ...c, messages: [...c.messages, message] }
        : c
    );

    setConcerns(updatedConcerns);
    setNewMessage('');
  };

  const updateConcernStatus = (concernId: string, status: string) => {
    const updatedConcerns = concerns.map((c: Concern) =>
      c.id === concernId ? { ...c, status } : c
    );
    setConcerns(updatedConcerns);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-orange-600 bg-orange-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const userConcerns = getUserConcerns();
  const currentBookings = getCurrentBookings();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {user?.role === 'customer' ? 'My Concerns' : 
             user?.role === 'unit_owner' ? 'Property Concerns' : 
             'All Concerns'}
          </h1>
          <p className="text-gray-600 mt-2">
            {user?.role === 'customer' ? 'Report issues during your stay' :
             user?.role === 'unit_owner' ? 'Manage guest concerns for your properties' :
             'Monitor and manage all property concerns'}
          </p>
        </div>
        
        {user?.role === 'customer' && currentBookings.length > 0 && (
          <button
            onClick={() => setShowNewConcernForm(true)}
            className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <AlertTriangle className="w-5 h-5" />
            <span>Report Issue</span>
          </button>
        )}
      </div>

      {/* Current Stay Alert for Customers */}
      {user?.role === 'customer' && currentBookings.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-900">Currently staying at:</span>
          </div>
          {currentBookings.map((booking: any) => {
            const property = properties.find((p: any) => p.id === booking.propertyId);
            return (
              <div key={booking.id} className="mt-2 text-blue-800">
                {property?.title} - {property?.address}
              </div>
            );
          })}
        </div>
      )}

      {/* No Current Stay Message */}
      {user?.role === 'customer' && currentBookings.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center mb-8">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">You can only report concerns during an active stay.</p>
        </div>
      )}

      {/* Concerns List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">
            Concerns ({userConcerns.length})
          </h2>
        </div>

        <div className="p-6">
          {userConcerns.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No concerns reported yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {userConcerns.map((concern: Concern) => {
                const property = properties.find((p: any) => p.id === concern.propertyId);
                return (
                  <div key={concern.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{concern.title}</h3>
                        <p className="text-gray-600 mb-2">{property?.title}</p>
                        <p className="text-gray-700 mb-3">{concern.description}</p>
                        
                        <div className="flex items-center space-x-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(concern.status)}`}>
                            {concern.status.replace('_', ' ')}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(concern.priority)}`}>
                            {concern.priority} priority
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(concern.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        {(user?.role === 'unit_owner' || user?.role === 'property_manager') && (
                          <select
                            value={concern.status}
                            onChange={(e) => updateConcernStatus(concern.id, e.target.value)}
                            className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                          </select>
                        )}
                        <button
                          onClick={() => setSelectedConcern(concern)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                        >
                          View Chat
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* New Concern Form Modal */}
      {showNewConcernForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold text-gray-900">Report an Issue</h3>
                <button
                  onClick={() => setShowNewConcernForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmitConcern} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Issue Title
                  </label>
                  <input
                    type="text"
                    value={newConcern.title}
                    onChange={(e) => setNewConcern(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Brief description of the issue"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority Level
                  </label>
                  <select
                    value={newConcern.priority}
                    onChange={(e) => setNewConcern(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="low">Low - Can wait</option>
                    <option value="medium">Medium - Should be addressed soon</option>
                    <option value="high">High - Urgent attention needed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Detailed Description
                  </label>
                  <textarea
                    value={newConcern.description}
                    onChange={(e) => setNewConcern(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows={4}
                    placeholder="Please provide as much detail as possible about the issue"
                    required
                  />
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowNewConcernForm(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    Submit Concern
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {selectedConcern && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{selectedConcern.title}</h3>
                  <p className="text-gray-600">{properties.find((p: any) => p.id === selectedConcern.propertyId)?.title}</p>
                </div>
                <button
                  onClick={() => setSelectedConcern(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {selectedConcern.messages.map((message: Message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.senderId === user?.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="text-sm font-medium mb-1">{message.senderName}</div>
                    <div>{message.message}</div>
                    <div className="text-xs mt-1 opacity-75">
                      {new Date(message.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSendMessage(selectedConcern.id);
                    }
                  }}
                />
                <button
                  onClick={() => handleSendMessage(selectedConcern.id)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConcernSystem;