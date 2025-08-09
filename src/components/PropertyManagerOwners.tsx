import React, { useState } from 'react';
import { Users, Search, Mail, CheckCircle, XCircle, Clock, Building, Calendar } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import ContractTemplateEditor from './ContractTemplateEditor';
import usersData from '../data/users.json';
import propertiesData from '../data/properties.json';
import bookingsData from '../data/bookings.json';

interface User {
  id: string;
  email: string;
  role: string;
  name: string;
  verified: boolean;
  createdAt: string;
}

const PropertyManagerOwners: React.FC = () => {
  const [users, setUsers] = useLocalStorage('users', usersData.users);
  const [contracts, setContracts] = useLocalStorage('contracts', []);
  const [properties] = useLocalStorage('properties', propertiesData.properties);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOwner, setSelectedOwner] = useState<User | null>(null);
  const [showContractSelection, setShowContractSelection] = useState<User | null>(null);

  const bookings = bookingsData.bookings;
  const unitOwners = users.filter((u: User) => u.role === 'unit_owner');

  const getOwnerProperties = (ownerId: string) => {
    return properties.filter((p: any) => p.ownerId === ownerId);
  };

  const getOwnerBookings = (ownerId: string) => {
    const ownerProperties = getOwnerProperties(ownerId);
    return bookings.filter(booking => 
      ownerProperties.some(prop => prop.id === booking.propertyId)
    );
  };

  const getOwnerRevenue = (ownerId: string) => {
    const ownerBookings = getOwnerBookings(ownerId);
    return ownerBookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
  };

  const verifyOwner = (ownerId: string) => {
    const updatedUsers = users.map((u: User) => 
      u.id === ownerId ? { ...u, verified: true } : u
    );
    setUsers(updatedUsers);
    
    // Show contract selection for newly verified owner
    const owner = users.find((u: User) => u.id === ownerId);
    if (owner) {
      setShowContractSelection(owner);
    }
  };

  const handleContractSelection = (template: any) => {
    if (!showContractSelection) return;
    
    // Create contract for the owner
    const newContract = {
      id: `contract-${Date.now()}`,
      templateId: template.id,
      ownerId: showContractSelection.id,
      ownerName: showContractSelection.name,
      ownerEmail: showContractSelection.email,
      templateName: template.name,
      terms: template.description,
      commissionPercentage: template.commissionPercentage,
      fields: template.fields,
      status: 'sent',
      sentAt: new Date().toISOString()
    };
    
    setContracts([...contracts, newContract]);
    setShowContractSelection(null);
    
    alert(`Contract "${template.name}" has been sent to ${showContractSelection.name}`);
  };

  const filteredOwners = unitOwners.filter((owner: User) => {
    const matchesSearch = owner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         owner.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'verified' && owner.verified) ||
                         (statusFilter === 'unverified' && !owner.verified);
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: unitOwners.length,
    verified: unitOwners.filter((u: User) => u.verified).length,
    unverified: unitOwners.filter((u: User) => !u.verified).length,
    totalProperties: properties.filter((p: any) => 
      unitOwners.some((u: User) => u.id === p.ownerId)
    ).length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Unit Owners</h1>
        <p className="text-gray-600 mt-2">Manage and verify property owners</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Owners</p>
              <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Verified</p>
              <p className="text-3xl font-bold text-emerald-600">{stats.verified}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Verification</p>
              <p className="text-3xl font-bold text-orange-600">{stats.unverified}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Properties</p>
              <p className="text-3xl font-bold text-purple-600">{stats.totalProperties}</p>
            </div>
            <Building className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Pending Verifications */}
      {stats.unverified > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-orange-500" />
              Pending Verifications ({stats.unverified})
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {unitOwners
                .filter((owner: User) => !owner.verified)
                .map((owner: User) => (
                  <div key={owner.id} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{owner.name}</h3>
                        <p className="text-gray-600">{owner.email}</p>
                        <p className="text-sm text-gray-500">
                          Registered: {new Date(owner.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => verifyOwner(owner.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          Verify Owner
                        </button>
                        <button
                          onClick={() => setSelectedOwner(owner)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="w-4 h-4 inline mr-1" />
              Search Owners
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Owners</option>
              <option value="verified">Verified</option>
              <option value="unverified">Pending Verification</option>
            </select>
          </div>
        </div>
      </div>

      {/* Owners List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">
            All Unit Owners ({filteredOwners.length})
          </h2>
        </div>

        <div className="p-6">
          {filteredOwners.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No owners found matching your criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredOwners.map((owner: User) => {
                const ownerProperties = getOwnerProperties(owner.id);
                const ownerBookings = getOwnerBookings(owner.id);
                const revenue = getOwnerRevenue(owner.id);

                return (
                  <div key={owner.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                          {owner.name}
                          {owner.verified ? (
                            <CheckCircle className="w-5 h-5 text-emerald-500 ml-2" />
                          ) : (
                            <Clock className="w-5 h-5 text-orange-500 ml-2" />
                          )}
                        </h3>
                        <p className="text-gray-600 flex items-center">
                          <Mail className="w-4 h-4 mr-1" />
                          {owner.email}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center mt-1">
                          <Calendar className="w-4 h-4 mr-1" />
                          Joined: {new Date(owner.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        owner.verified 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {owner.verified ? 'Verified' : 'Pending'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{ownerProperties.length}</div>
                        <div className="text-sm text-gray-600">Properties</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-emerald-600">{ownerBookings.length}</div>
                        <div className="text-sm text-gray-600">Bookings</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">${revenue.toLocaleString()}</div>
                        <div className="text-sm text-gray-600">Revenue</div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      {!owner.verified && (
                        <button
                          onClick={() => verifyOwner(owner.id)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                        >
                          Verify Owner
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedOwner(owner)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Owner Details Modal */}
      {selectedOwner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900 flex items-center">
                    {selectedOwner.name}
                    {selectedOwner.verified ? (
                      <CheckCircle className="w-6 h-6 text-emerald-500 ml-2" />
                    ) : (
                      <Clock className="w-6 h-6 text-orange-500 ml-2" />
                    )}
                  </h3>
                  <p className="text-gray-600">{selectedOwner.email}</p>
                  <p className="text-sm text-gray-500">
                    Member since: {new Date(selectedOwner.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOwner(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Owner Properties */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Properties ({getOwnerProperties(selectedOwner.id).length})
                  </h4>
                  <div className="space-y-4">
                    {getOwnerProperties(selectedOwner.id).length === 0 ? (
                      <p className="text-gray-500">No properties listed yet</p>
                    ) : (
                      getOwnerProperties(selectedOwner.id).map((property: any) => (
                        <div key={property.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            <img
                              src={property.images[0]}
                              alt={property.title}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900">{property.title}</h5>
                              <p className="text-sm text-gray-600">{property.address}</p>
                              <div className="flex items-center justify-between mt-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  property.status === 'approved' 
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : property.status === 'pending_review'
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {property.status.replace('_', ' ')}
                                </span>
                                <span className="text-sm font-medium text-blue-600">
                                  ${property.finalRate || property.proposedRate}/night
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Owner Bookings */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Recent Bookings ({getOwnerBookings(selectedOwner.id).length})
                  </h4>
                  <div className="space-y-4">
                    {getOwnerBookings(selectedOwner.id).length === 0 ? (
                      <p className="text-gray-500">No bookings yet</p>
                    ) : (
                      getOwnerBookings(selectedOwner.id).slice(0, 5).map((booking: any) => {
                        const property = getOwnerProperties(selectedOwner.id).find((p: any) => p.id === booking.propertyId);
                        return (
                          <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="font-medium text-gray-900">{property?.title}</h5>
                                <p className="text-sm text-gray-600">{booking.customerName}</p>
                                <p className="text-sm text-gray-500">
                                  {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="font-medium text-emerald-600">${booking.totalAmount}</div>
                                <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full">
                                  {booking.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Revenue Summary */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h5 className="font-medium text-gray-900 mb-2">Revenue Summary</h5>
                    <div className="text-2xl font-bold text-purple-600">
                      ${getOwnerRevenue(selectedOwner.id).toLocaleString()}
                    </div>
                    <p className="text-sm text-gray-600">Total earnings from all bookings</p>
                  </div>
                </div>
              </div>

              {!selectedOwner.verified && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      verifyOwner(selectedOwner.id);
                      setSelectedOwner(null);
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    Verify This Owner
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contract Selection Modal */}
      {showContractSelection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900">Send Contract</h3>
                  <p className="text-gray-600">Select a contract template to send to {showContractSelection.name}</p>
                </div>
                <button
                  onClick={() => setShowContractSelection(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <ContractTemplateEditor 
                showSelector={true}
                onSelectTemplate={handleContractSelection}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyManagerOwners;