import React, { useState } from "react";
import {
  Plus,
  Building,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Upload,
  Eye,
  Edit,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useLocalStorage } from "../hooks/useLocalStorage";
import ContractReviewSystem from "./ContractReviewSystem";
import propertiesData from "../data/properties.json";
import contractsData from "../data/contracts.json";
import bookingsData from "../data/bookings.json";
import { updatePropertyWithCommission } from '../utils/propertyCalculations';

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
  contractSentAt?: string;
  contractAcceptedAt?: string;
}

interface Contract {
  id: string;
  propertyId: string;
  ownerId: string;
  terms: string;
  finalRate: number;
  status: string;
  sentAt: string;
  acceptedAt?: string;
}

const UnitOwnerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useLocalStorage(
    "properties",
    propertiesData.properties
  );
  const [contracts, setContracts] = useLocalStorage(
    "contracts",
    contractsData.contracts
  );
  const [showNewPropertyForm, setShowNewPropertyForm] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(
    null
  );
  const [newProperty, setNewProperty] = useState({
    title: "",
    description: "",
    address: "",
    images: [""],
    amenities: [""],
    bedrooms: 1,
    bathrooms: 1,
    maxGuests: 1,
    proposedRate: 100,
  });

  const bookings = bookingsData.bookings;
  const ownerProperties = properties.filter(
    (p: Property) => p.ownerId === user?.id
  );
  const ownerContracts = contracts.filter(
    (c: Contract) => c.ownerId === user?.id
  );
  const pendingContracts = ownerContracts.filter(
    (c: Contract) => c.status === "sent"
  );
  const ownerBookings = bookings.filter((booking) =>
    ownerProperties.some((prop) => prop.id === booking.propertyId)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending_review":
        return "text-orange-600 bg-orange-100";
      case "approved":
        return "text-emerald-600 bg-emerald-100";
      case "rejected":
        return "text-red-600 bg-red-100";
      case "pending_contract":
        return "text-blue-600 bg-blue-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending_review":
        return "Pending Review";
      case "approved":
        return "Live Booking";
      case "rejected":
        return "Rejected";
      case "pending_contract":
        return "Contract Pending";
      default:
        return status;
    }
  };

  const handleCloseForm = () => {
    setShowNewPropertyForm(false);
    // Reset form data when closing
    setNewProperty({
      title: "",
      description: "",
      address: "",
      images: [""],
      amenities: [""],
      bedrooms: 1,
      bathrooms: 1,
      maxGuests: 1,
      proposedRate: 100,
    });
  };

  const handleSubmitProperty = (e: React.FormEvent) => {
    e.preventDefault();

    // Calculate rates with commission for new property
    const propertyWithRates = updatePropertyWithCommission(newProperty, 15);

    const property = {
      id: `prop-${Date.now()}`,
      ownerId: user?.id || "",
      ...propertyWithRates,
      images: newProperty.images.filter((img) => img.trim() !== ""),
      amenities: newProperty.amenities.filter(
        (amenity) => amenity.trim() !== ""
      ),
      status: "pending_review",
      submittedAt: new Date().toISOString(),
      contractApproved: false
    };

    setProperties([...properties, property]);
    handleCloseForm();
  };

  const addImageField = () => {
    setNewProperty((prev) => ({
      ...prev,
      images: [...prev.images, ""],
    }));
  };

  const updateImage = (index: number, value: string) => {
    setNewProperty((prev) => ({
      ...prev,
      images: prev.images.map((img, i) => (i === index ? value : img)),
    }));
  };

  const addAmenityField = () => {
    setNewProperty((prev) => ({
      ...prev,
      amenities: [...prev.amenities, ""],
    }));
  };

  const updateAmenity = (index: number, value: string) => {
    setNewProperty((prev) => ({
      ...prev,
      amenities: prev.amenities.map((amenity, i) =>
        i === index ? value : amenity
      ),
    }));
  };

  const acceptContract = (contractId: string) => {
    if (!user) return;

    // Find the contract to get commission details
    const contract = contracts.find((c: Contract) => c.id === contractId);
    if (!contract) return;

    const updatedContracts = contracts.map((c: Contract) =>
      c.id === contractId
        ? { ...c, status: "accepted", acceptedAt: new Date().toISOString() }
        : c
    );
    setContracts(updatedContracts);

    // Calculate final rate with commission and update property status to approved
    const commissionRate = 0.15; // 15% commission
    const updatedProperties = properties.map((p: Property) => {
      if (p.ownerId === user.id && p.id === contract.propertyId) {
        const baseRate = p.baseRate || p.proposedRate || p.finalRate || 100;
        const newFinalRate = Math.round(baseRate * (1 + commissionRate));
        
        return {
          ...p,
          status: "approved",
          finalRate: newFinalRate,
          baseRate: baseRate,
          commissionPercentage: 15,
          contractAcceptedAt: new Date().toISOString(),
          contractApproved: true
        };
      }
      return p;
    });
    setProperties(updatedProperties);
    
    // Update localStorage to ensure persistence
    localStorage.setItem('properties', JSON.stringify(updatedProperties));
    
    // Trigger storage event for real-time updates
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'properties',
      newValue: JSON.stringify(updatedProperties)
    }));

    setSelectedContract(null);
  };

  const rejectContract = (contractId: string) => {
    const updatedContracts = contracts.map((c: Contract) =>
      c.id === contractId ? { ...c, status: "rejected" } : c
    );
    setContracts(updatedContracts);
    setSelectedContract(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Unit Owner Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your properties and bookings
          </p>
        </div>
        <button
          onClick={() => setShowNewPropertyForm(true)}
          className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Property</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">My Properties</p>
              <p className="text-3xl font-bold text-emerald-600">
                {ownerProperties.length}
              </p>
            </div>
            <Building className="w-8 h-8 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Bookings</p>
              <p className="text-3xl font-bold text-blue-600">
                {ownerBookings.length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Contracts</p>
              <p className="text-3xl font-bold text-orange-600">
                {pendingContracts.length}
              </p>
            </div>
            <FileText className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Pending Contracts */}
      {pendingContracts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-orange-500" />
              Contract Review Required
            </h2>
          </div>
          <div className="p-6">
            <ContractReviewSystem />
          </div>
        </div>
      )}

      {/* Properties List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">My Properties</h2>
        </div>
        <div className="p-6">
          {ownerProperties.length === 0 ? (
            <div className="text-center py-12">
              <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No properties listed yet</p>
              <button
                onClick={() => setShowNewPropertyForm(true)}
                className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Add Your First Property
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {ownerProperties.map((property: Property) => (
                <div
                  key={property.id}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <img
                    src={property.images[0]}
                    alt={property.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {property.title}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          property.status
                        )}`}
                      >
                        {getStatusText(property.status)}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{property.address}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>
                        {property.bedrooms} bed • {property.bathrooms} bath
                      </span>
                      <span className="font-medium text-emerald-600">
                        ${property.finalRate || property.proposedRate}/night
                      </span>
                    </div>
                    {property.rejectionReason && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">
                          <strong>Rejection Reason:</strong>{" "}
                          {property.rejectionReason}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Property Form Modal */}
      {showNewPropertyForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold text-gray-900">
                  Add New Property
                </h3>
                <button
                  onClick={handleCloseForm}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmitProperty} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Property Title
                    </label>
                    <input
                      type="text"
                      value={newProperty.title}
                      onChange={(e) =>
                        setNewProperty((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={newProperty.description}
                      onChange={(e) =>
                        setNewProperty((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      value={newProperty.address}
                      onChange={(e) =>
                        setNewProperty((prev) => ({
                          ...prev,
                          address: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bedrooms
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newProperty.bedrooms}
                      onChange={(e) =>
                        setNewProperty((prev) => ({
                          ...prev,
                          bedrooms: Number(e.target.value),
                        }))
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bathrooms
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newProperty.bathrooms}
                      onChange={(e) =>
                        setNewProperty((prev) => ({
                          ...prev,
                          bathrooms: Number(e.target.value),
                        }))
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Guests
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newProperty.maxGuests}
                      onChange={(e) =>
                        setNewProperty((prev) => ({
                          ...prev,
                          maxGuests: Number(e.target.value),
                        }))
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Proposed Rate (per night)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-gray-500">
                        $
                      </span>
                      <input
                        type="number"
                        min="1"
                        value={newProperty.proposedRate}
                        onChange={(e) =>
                          setNewProperty((prev) => ({
                            ...prev,
                            proposedRate: Number(e.target.value),
                          }))
                        }
                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Images */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property Images (URLs)
                  </label>
                  <div className="space-y-2">
                    {newProperty.images.map((image, index) => (
                      <input
                        key={index}
                        type="url"
                        value={image}
                        onChange={(e) => updateImage(index, e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    ))}
                    <button
                      type="button"
                      onClick={addImageField}
                      className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                    >
                      + Add another image
                    </button>
                  </div>
                </div>

                {/* Amenities */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amenities
                  </label>
                  <div className="space-y-2">
                    {newProperty.amenities.map((amenity, index) => (
                      <input
                        key={index}
                        type="text"
                        value={amenity}
                        onChange={(e) => updateAmenity(index, e.target.value)}
                        placeholder="e.g., WiFi, Kitchen, Pool"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    ))}
                    <button
                      type="button"
                      onClick={addAmenityField}
                      className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                    >
                      + Add another amenity
                    </button>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    Submit for Review
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnitOwnerDashboard;
