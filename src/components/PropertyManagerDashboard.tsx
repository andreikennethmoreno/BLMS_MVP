import React, { useState } from 'react';
import { Building, Users, CheckCircle, Clock, XCircle, DollarSign, FileText, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLocalStorage } from '../hooks/useLocalStorage';
import propertiesData from '../data/properties.json';
import usersData from '../data/users.json';
import bookingsData from '../data/bookings.json';
import contractsData from '../data/contracts.json';

interface Property {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  address: string;
  images: string[];
  amenities: string[];
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  proposedRate: number;
  finalRate: number | null;
  status: string;
  submittedAt: string;
  rejectionReason?: string;
}

const PropertyManagerDashboard: React.FC = () => {
  const [properties, setProperties] = useLocalStorage('properties', propertiesData.properties);
  const [contracts, setContracts] = useLocalStorage('contracts', contractsData.contracts);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [reviewMode, setReviewMode] = useState<'approve' | 'reject' | null>(null);
  const [finalRate, setFinalRate] = useState<number>(0);
  const [rejectionReason, setRejectionReason] = useState('');

  const users = usersData.users;
  const bookings = bookingsData.bookings;

  const pendingProperties = properties.filter((p: Property) => p.status === 'pending_review');
  const approvedProperties = properties.filter((p: Property) => p.status === 'approved');
  const totalBookings = bookings.length;
  const totalRevenue = bookings.reduce((sum, booking) => sum + booking.totalAmount, 0);

  const getOwnerName = (ownerId: string) => {
    const owner = users.find(u => u.id === ownerId);
    return owner?.name || 'Unknown Owner';
  };

  const handlePropertyAction = (property: Property, action: 'approve' | 'reject') => {
    setSelectedProperty(property);
    setReviewMode(action);
    setFinalRate(property.proposedRate);
    setRejectionReason('');
  };

  const confirmAction = () => {
    if (!selectedProperty || !reviewMode) return;

    const updatedProperties = properties.map((p: Property) => {
      if (p.id === selectedProperty.id) {
        if (reviewMode === 'approve') {
          return {
            ...p,
            status: 'pending_contract',
            finalRate: finalRate,
            approvedAt: new Date().toISOString()
          };
        } else {
          return {
            ...p,
            status: 'rejected',
            rejectedAt: new Date().toISOString(),
            rejectionReason: rejectionReason
          };
        }
      }
      return p;
    });

    setProperties(updatedProperties);

    if (reviewMode === 'approve') {
      const newContract = {
        id: `contract-${Date.now()}`,
        propertyId: selectedProperty.id,
        ownerId: selectedProperty.ownerId,
        terms: `Standard property rental agreement with 15% platform commission. Final rate: $${finalRate}/night.`,
        finalRate: finalRate,
        status: 'sent',
        sentAt: new Date().toISOString()
      };
      
      setContracts([...contracts, newContract]);

      const propertiesWithContract = updatedProperties.map((p: Property) => {
        if (p.id === selectedProperty.id) {
          return { ...p, contractSentAt: new Date().toISOString() };
        }
        return p;
      });
      setProperties(propertiesWithContract);
    }

    setSelectedProperty(null);
    setReviewMode(null);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending_review': return 'secondary';
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Property Manager Dashboard</h1>
        <p className="text-muted-foreground mt-2">Manage properties, owners, and bookings</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingProperties.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Properties</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{approvedProperties.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{totalBookings}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">${totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Properties Review */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2 text-orange-500" />
            Properties Pending Review ({pendingProperties.length})
          </CardTitle>
        </CardHeader>

        <CardContent>
          {pendingProperties.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No properties pending review</p>
          ) : (
            <div className="space-y-4">
              {pendingProperties.map((property: Property) => (
                <Card key={property.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <img
                            src={property.images[0]}
                            alt={property.title}
                            className="w-20 h-20 rounded-lg object-cover"
                          />
                          <div>
                            <h3 className="text-lg font-semibold">{property.title}</h3>
                            <p className="text-muted-foreground">{property.address}</p>
                            <p className="text-sm text-muted-foreground">Owner: {getOwnerName(property.ownerId)}</p>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-sm">
                                {property.bedrooms} bed, {property.bathrooms} bath
                              </span>
                              <Badge variant="secondary">
                                Proposed: ${property.proposedRate}/night
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <Button
                          onClick={() => handlePropertyAction(property, 'approve')}
                          size="sm"
                          className="flex items-center space-x-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Approve</span>
                        </Button>
                        <Button
                          onClick={() => handlePropertyAction(property, 'reject')}
                          variant="destructive"
                          size="sm"
                          className="flex items-center space-x-1"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject</span>
                        </Button>
                        <Button
                          onClick={() => setSelectedProperty(property)}
                          variant="outline"
                          size="sm"
                          className="flex items-center space-x-1"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Modal */}
      <Dialog open={!!(selectedProperty && reviewMode)} onOpenChange={() => {
        setSelectedProperty(null);
        setReviewMode(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewMode === 'approve' ? 'Approve Property' : 'Reject Property'}
            </DialogTitle>
            <DialogDescription>
              {selectedProperty?.title} - {selectedProperty?.address}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {reviewMode === 'approve' ? (
              <div>
                <Label htmlFor="finalRate">Final Room Rate (per night)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-muted-foreground">$</span>
                  <Input
                    id="finalRate"
                    type="number"
                    value={finalRate}
                    onChange={(e) => setFinalRate(Number(e.target.value))}
                    className="pl-8"
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Owner proposed: ${selectedProperty?.proposedRate}
                </p>
              </div>
            ) : (
              <div>
                <Label htmlFor="rejectionReason">Rejection Reason</Label>
                <Textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejection..."
                  required
                />
              </div>
            )}

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedProperty(null);
                  setReviewMode(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmAction}
                disabled={reviewMode === 'reject' && !rejectionReason.trim()}
                className="flex-1"
                variant={reviewMode === 'approve' ? 'default' : 'destructive'}
              >
                {reviewMode === 'approve' ? 'Approve & Send Contract' : 'Reject Property'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Property Details Modal */}
      <Dialog open={!!(selectedProperty && !reviewMode)} onOpenChange={() => setSelectedProperty(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProperty?.title}</DialogTitle>
            <DialogDescription>{selectedProperty?.address}</DialogDescription>
          </DialogHeader>

          {selectedProperty && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {selectedProperty.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${selectedProperty.title} ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                ))}
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-muted-foreground">{selectedProperty.description}</p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-muted-foreground">Bedrooms:</span>
                      <span className="ml-2">{selectedProperty.bedrooms}</span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Bathrooms:</span>
                      <span className="ml-2">{selectedProperty.bathrooms}</span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Max Guests:</span>
                      <span className="ml-2">{selectedProperty.maxGuests}</span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Proposed Rate:</span>
                      <span className="ml-2">${selectedProperty.proposedRate}/night</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Amenities</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProperty.amenities.map((amenity, index) => (
                      <Badge key={index} variant="secondary">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Owner</h4>
                  <p className="text-muted-foreground">{getOwnerName(selectedProperty.ownerId)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PropertyManagerDashboard;