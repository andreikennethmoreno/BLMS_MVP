import React, { useState } from 'react';
import { AlertTriangle, MessageCircle, Clock, CheckCircle, XCircle, Plus, Send, Eye } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../contexts/AuthContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { concernSchema, type ConcernFormData } from '@/lib/validations';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import concernsData from '../data/concerns.json';
import bookingsData from '../data/bookings.json';
import propertiesData from '../data/properties.json';
import usersData from '../data/users.json';

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
  const [showNewConcernForm, setShowNewConcernForm] = useState(false);
  const [selectedConcern, setSelectedConcern] = useState<Concern | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [selectedBookingId, setSelectedBookingId] = useState('');

  const form = useForm<ConcernFormData>({
    resolver: zodResolver(concernSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
    },
  });

  const properties = propertiesData.properties;
  const users = usersData.users;

  // Get user-specific data based on role
  const getUserConcerns = () => {
    if (!user) return [];
    
    switch (user.role) {
      case 'property_manager':
        return concerns;
      case 'unit_owner':
        return concerns.filter((c: Concern) => c.ownerId === user.id);
      case 'customer':
        return concerns.filter((c: Concern) => c.customerId === user.id);
      default:
        return [];
    }
  };

  // Get active bookings for customers to report concerns
  const getActiveBookings = () => {
    if (user?.role !== 'customer') return [];
    
    const now = new Date();
    return bookings.filter((booking: any) => {
      const checkIn = new Date(booking.checkIn);
      const checkOut = new Date(booking.checkOut);
      return (
        booking.customerId === user.id &&
        booking.status === 'confirmed' &&
        checkIn <= now &&
        checkOut >= now
      );
    });
  };

  const handleSubmitConcern = (data: ConcernFormData) => {
    if (!user || !selectedBookingId) return;

    const booking = bookings.find((b: any) => b.id === selectedBookingId);
    if (!booking) return;

    const property = properties.find((p: any) => p.id === booking.propertyId);
    if (!property) return;

    const concern: Concern = {
      id: `concern-${Date.now()}`,
      bookingId: selectedBookingId,
      propertyId: booking.propertyId,
      customerId: user.id,
      ownerId: property.ownerId,
      title: data.title,
      description: data.description,
      status: 'pending',
      priority: data.priority,
      createdAt: new Date().toISOString(),
      customerName: user.name,
      messages: [
        {
          id: `msg-${Date.now()}`,
          senderId: user.id,
          senderName: user.name,
          message: data.description,
          timestamp: new Date().toISOString()
        }
      ]
    };

    setConcerns([...concerns, concern]);
    setShowNewConcernForm(false);
    setSelectedBookingId('');
    form.reset();
  };

  const handleSendMessage = () => {
    if (!selectedConcern || !newMessage.trim() || !user) return;

    const message: Message = {
      id: `msg-${Date.now()}`,
      senderId: user.id,
      senderName: user.name,
      message: newMessage.trim(),
      timestamp: new Date().toISOString()
    };

    const updatedConcerns = concerns.map((c: Concern) =>
      c.id === selectedConcern.id
        ? { ...c, messages: [...c.messages, message] }
        : c
    );

    setConcerns(updatedConcerns);
    setSelectedConcern({
      ...selectedConcern,
      messages: [...selectedConcern.messages, message]
    });
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

  const getProperty = (propertyId: string) => {
    return properties.find((p: any) => p.id === propertyId);
  };

  const getUser = (userId: string) => {
    return users.find((u: any) => u.id === userId);
  };

  const userConcerns = getUserConcerns();
  const activeBookings = getActiveBookings();

  const stats = {
    total: userConcerns.length,
    pending: userConcerns.filter((c: Concern) => c.status === 'pending').length,
    inProgress: userConcerns.filter((c: Concern) => c.status === 'in_progress').length,
    resolved: userConcerns.filter((c: Concern) => c.status === 'resolved').length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {user?.role === 'customer' ? 'Report Issues' : 'Concerns & Issues'}
          </h1>
          <p className="text-gray-600 mt-2">
            {user?.role === 'customer' 
              ? 'Report issues during your stay'
              : user?.role === 'unit_owner'
              ? 'Manage guest concerns for your properties'
              : 'Monitor and resolve all property concerns'
            }
          </p>
        </div>
        
        {user?.role === 'customer' && activeBookings.length > 0 && (
          <button
            onClick={() => setShowNewConcernForm(true)}
            className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Report Issue</span>
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Concerns</p>
              <p className="text-3xl font-bold text-red-600">{stats.total}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-3xl font-bold text-orange-600">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-3xl font-bold text-blue-600">{stats.inProgress}</p>
            </div>
            <MessageCircle className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Resolved</p>
              <p className="text-3xl font-bold text-green-600">{stats.resolved}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Customer Notice */}
      {user?.role === 'customer' && activeBookings.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="font-medium text-blue-900">No Active Stays</h3>
              <p className="text-blue-800 mt-1">
                You can only report issues during an active stay. Check your bookings to see your upcoming trips.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Concerns List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">
            {user?.role === 'customer' ? 'My Reports' : 'All Concerns'} ({userConcerns.length})
          </h2>
        </div>

        <div className="p-6">
          {userConcerns.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {user?.role === 'customer' 
                  ? 'No issues reported yet'
                  : 'No concerns reported yet'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {userConcerns.map((concern: Concern) => {
                const property = getProperty(concern.propertyId);
                const customer = getUser(concern.customerId);
                const owner = getUser(concern.ownerId);

                return (
                  <div key={concern.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{concern.title}</h3>
                        <p className="text-gray-600 mb-2">{property?.title}</p>
                        <p className="text-gray-700 mb-3">{concern.description}</p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Reported by: {concern.customerName}</span>
                          <span>Created: {new Date(concern.createdAt).toLocaleDateString()}</span>
                          <span>Messages: {concern.messages.length}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(concern.status)}`}>
                          {concern.status.replace('_', ' ')}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(concern.priority)}`}>
                          {concern.priority} priority
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {user?.role === 'property_manager' && (
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
                      </div>
                      
                      <button
                        onClick={() => setSelectedConcern(concern)}
                        className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>View Messages</span>
                      </button>
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
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold text-gray-900">Report an Issue</h3>
                <button
                  onClick={() => setShowNewConcernForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmitConcern)} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Active Booking
                    </label>
                    <select
                      value={selectedBookingId}
                      onChange={(e) => setSelectedBookingId(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      required
                    >
                      <option value="">Choose your current stay...</option>
                      {activeBookings.map((booking: any) => {
                        const property = getProperty(booking.propertyId);
                        return (
                          <option key={booking.id} value={booking.id}>
                            {property?.title} - {new Date(booking.checkIn).toLocaleDateString()} to {new Date(booking.checkOut).toLocaleDateString()}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Issue Title</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Brief description of the issue" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Detailed Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            rows={4} 
                            placeholder="Please provide detailed information about the issue..." 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority Level</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low - Minor inconvenience</SelectItem>
                            <SelectItem value="medium">Medium - Affects comfort</SelectItem>
                            <SelectItem value="high">High - Urgent attention needed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex space-x-4">
                    <Button
                      type="button"
                      onClick={() => setShowNewConcernForm(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={!selectedBookingId}
                      className="flex-1"
                    >
                      Submit Report
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </div>
      )}

      {/* Concern Messages Modal */}
      {selectedConcern && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900">{selectedConcern.title}</h3>
                  <p className="text-gray-600">{getProperty(selectedConcern.propertyId)?.title}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedConcern.status)}`}>
                      {selectedConcern.status.replace('_', ' ')}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(selectedConcern.priority)}`}>
                      {selectedConcern.priority} priority
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedConcern(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Messages */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6 max-h-96 overflow-y-auto">
                <div className="space-y-4">
                  {selectedConcern.messages.map((message: Message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.senderId === user?.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{message.senderName}</span>
                          <span className="text-xs opacity-75">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm">{message.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Message Input */}
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  <Send className="w-5 h-5" />
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