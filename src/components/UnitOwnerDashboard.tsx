import React, { useState } from "react";
import {
  Plus,
  Building,
  CheckCircle,
  XCircle,
  FileText,
  Phone,
  Trash2,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useLocalStorage } from "../hooks/useLocalStorage";
import ContractReviewSystem from "./ContractReviewSystem";
import propertiesData from "../data/properties.json";
import contractsData from "../data/contracts.json";
import bookingsData from "../data/bookings.json";
import { updatePropertyWithCommission } from "../utils/propertyCalculations";

// =====================
// Types
// =====================
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
  contractApproved?: boolean;
  // Extended fields for the new modal
  operationType: "sales" | "rent" | "sale-and-rent" | string;
  propertyType: string;
  leasingTerm: "short-term" | "long-term" | string;
  checkInDate?: string;
  checkOutDate?: string;
  facilities: string[];
  surroundings: string[];
  contactNumbers: string[];
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

// =====================
// Component
// =====================
const UnitOwnerDashboard: React.FC = () => {
  const { user } = useAuth();

  // Strongly type local storage hooks to avoid TS union errors when mapping
  const [properties, setProperties] = useLocalStorage<Property[]>(
    "properties",
    (propertiesData?.properties as Property[]) || []
  );
  const [contracts] = useLocalStorage<Contract[]>(
    "contracts",
    (contractsData?.contracts as Contract[]) || []
  );

  const [showNewPropertyForm, setShowNewPropertyForm] = useState(false);

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
    operationType: "rent" as "sales" | "rent" | "sale-and-rent",
    propertyType: "apartment",
    leasingTerm: "short-term" as "short-term" | "long-term",
    checkInDate: "",
    checkOutDate: "",
    facilities: [] as string[],
    surroundings: [] as string[],
    contactNumbers: [""],
  });

  // =====================
  // Options
  // =====================
  const operationTypes = [
    { value: "sales", label: "Sales" },
    { value: "rent", label: "Rent" },
    { value: "sale-and-rent", label: "Sale and Rent" },
  ];

  const propertyTypes = [
    { value: "apartment", label: "Apartment" },
    { value: "house", label: "House" },
    { value: "condo", label: "Condominium" },
    { value: "townhouse", label: "Townhouse" },
    { value: "villa", label: "Villa" },
    { value: "studio", label: "Studio" },
    { value: "penthouse", label: "Penthouse" },
    { value: "duplex", label: "Duplex" },
    { value: "loft", label: "Loft" },
    { value: "bungalow", label: "Bungalow" },
    { value: "commercial", label: "Commercial Space" },
    { value: "office", label: "Office" },
    { value: "warehouse", label: "Warehouse" },
    { value: "land", label: "Land/Lot" },
    { value: "farm", label: "Farm" },
  ];

  const facilitiesOptions = [
    "24 hours security",
    "Access for disabled",
    "Air conditioning",
    "Alarm",
    "Balcony",
    "Built in kitchen",
    "Built in wardrobe",
    "Car park",
    "CCTV",
    "Cellar",
    "Children playground",
    "WiFi",
    "Pool",
    "Gym",
    "Elevator",
    "Garden",
    "Terrace",
    "Laundry",
    "Furnished",
    "Pet friendly",
  ];

  const amenitiesList = [
  "24-hours security",
  "Access for the disabled",
  "Air conditioning",
  "Alarm",
  "Balcony",
  "Built-in kitchen",
  "Built-in wardrobe",
  "Car park",
  "CCTV",
  "Cellar",
  "Electricity",
  "Children's area",
  "Elevator",
];


  const surroundingsOptions = [
    "By the sea",
    "Near main road",
    "Near the train station",
    "Nearby malls",
    "Nearby park",
    "Near school",
    "Near hospital",
    "Near airport",
    "City center",
    "Quiet neighborhood",
    "Business district",
    "Residential area",
  ];

  // =====================
  // Derived data
  // =====================
  const bookings = (bookingsData as any)?.bookings || [];
  const ownerProperties = (properties || []).filter(
    (p: Property) => p.ownerId === user?.id
  );
  const ownerContracts = (contracts || []).filter(
    (c: Contract) => c.ownerId === user?.id
  );
  const pendingContracts = ownerContracts.filter(
    (c: Contract) => c.status === "sent"
  );
  const ownerBookings = (bookings || []).filter((b: any) =>
    ownerProperties.some((prop: Property) => prop.id === b.propertyId)
  );

  // =====================
  // Helpers
  // =====================
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

  // =====================
  // Form handlers
  // =====================
  const handleCloseForm = () => {
    setShowNewPropertyForm(false);
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
      operationType: "rent",
      propertyType: "apartment",
      leasingTerm: "short-term",
      checkInDate: "",
      checkOutDate: "",
      facilities: [],
      surroundings: [],
      contactNumbers: [""],
    });
  };

  const handleSubmitProperty = (e: React.FormEvent) => {
    e.preventDefault();

    // Calculate commission-adjusted rates
    const propertyWithRates = updatePropertyWithCommission(newProperty, 15);

    const property: Property = {
      id: `prop-${Date.now()}`,
      ownerId: user?.id || "",
      ...propertyWithRates,
      images: newProperty.images.filter((img) => img.trim() !== ""),
      amenities: newProperty.amenities.filter((amenity) => amenity.trim() !== ""),
      contactNumbers: newProperty.contactNumbers.filter((n) => n.trim() !== ""),
      facilities: [...newProperty.facilities],
      surroundings: [...newProperty.surroundings],
      status: "pending_review",
      submittedAt: new Date().toISOString(),
      finalRate: null,
      contractApproved: false,
    };

    setProperties([...(properties || []), property]);
    handleCloseForm();
  };

  // Images
  const addImageField = () =>
    setNewProperty((prev) => ({ ...prev, images: [...prev.images, ""] }));
  const updateImage = (index: number, value: string) =>
    setNewProperty((prev) => ({
      ...prev,
      images: prev.images.map((img, i) => (i === index ? value : img)),
    }));
  const removeImage = (index: number) =>
    setNewProperty((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));

  // Amenities (free text chips)
  const addAmenityField = () =>
    setNewProperty((prev) => ({ ...prev, amenities: [...prev.amenities, ""] }));
  const updateAmenity = (index: number, value: string) =>
    setNewProperty((prev) => ({
      ...prev,
      amenities: prev.amenities.map((a, i) => (i === index ? value : a)),
    }));
  const removeAmenity = (index: number) =>
    setNewProperty((prev) => ({
      ...prev,
      amenities: prev.amenities.filter((_, i) => i !== index),
    }));

  // Contacts
  const addContactNumber = () =>
    setNewProperty((prev) => ({ ...prev, contactNumbers: [...prev.contactNumbers, ""] }));
  const updateContactNumber = (index: number, value: string) =>
    setNewProperty((prev) => ({
      ...prev,
      contactNumbers: prev.contactNumbers.map((n, i) => (i === index ? value : n)),
    }));
  const removeContactNumber = (index: number) =>
    setNewProperty((prev) => ({
      ...prev,
      contactNumbers: prev.contactNumbers.filter((_, i) => i !== index),
    }));

  // Facilities + Surroundings toggles
  const handleFacilityChange = (facility: string, checked: boolean) =>
    setNewProperty((prev) => ({
      ...prev,
      facilities: checked
        ? [...prev.facilities, facility]
        : prev.facilities.filter((f) => f !== facility),
    }));
  const handleSurroundingChange = (s: string, checked: boolean) =>
    setNewProperty((prev) => ({
      ...prev,
      surroundings: checked
        ? [...prev.surroundings, s]
        : prev.surroundings.filter((x) => x !== s),
    }));

  // =====================
  // Render
  // =====================
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Unit Owner Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your properties and bookings</p>
        </div>
        <button
          onClick={() => setShowNewPropertyForm(true)}
          className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>New Property</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">My Properties</p>
              <p className="text-3xl font-bold text-emerald-600">{ownerProperties.length}</p>
            </div>
            <Building className="w-8 h-8 text-emerald-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Listings</p>
              <p className="text-3xl font-bold text-blue-600">{ownerProperties.filter((p) => p.status === "approved").length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Contracts</p>
              <p className="text-3xl font-bold text-orange-600">{pendingContracts.length}</p>
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
                <div key={property.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={property.images?.[0] || "https://via.placeholder.com/800x480?text=No+Image"}
                    alt={property.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{property.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(property.status)}`}>
                        {getStatusText(property.status)}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">{property.address}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 mb-3">
                      <span className="capitalize bg-gray-100 px-2 py-1 rounded">{property.operationType?.replace("-", " ")}</span>
                      <span className="capitalize bg-gray-100 px-2 py-1 rounded">{property.propertyType}</span>
                      <span className="capitalize bg-gray-100 px-2 py-1 rounded">{property.leasingTerm?.replace("-", " ")}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>
                        {property.bedrooms} bed • {property.bathrooms} bath
                      </span>
                      <span className="font-medium text-emerald-600">
                        ${property.finalRate ?? property.proposedRate}/night
                      </span>
                    </div>

                    {property.facilities?.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-1">Facilities:</p>
                        <div className="flex flex-wrap gap-1">
                          {property.facilities.slice(0, 3).map((f, idx) => (
                            <span key={idx} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {f}
                            </span>
                          ))}
                          {property.facilities.length > 3 && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              +{property.facilities.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {property.contactNumbers?.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-1">Contact:</p>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700">
                            {property.contactNumbers[0]}
                            {property.contactNumbers.length > 1 && (
                              <span className="text-gray-500 ml-1">+{property.contactNumbers.length - 1} more</span>
                            )}
                          </span>
                        </div>
                      </div>
                    )}

                    {property.rejectionReason && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">
                          <strong>Rejection Reason:</strong> {property.rejectionReason}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold text-gray-900">Add New Property</h3>
                <button onClick={handleCloseForm} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmitProperty} className="space-y-8">
                {/* Basic Info */}
                <section>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Property Title *</label>
                      <input
                        type="text"
                        value={newProperty.title}
                        onChange={(e) => setNewProperty({ ...newProperty, title: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Operation Type *</label>
                      <select
                        value={newProperty.operationType}
                        onChange={(e) => setNewProperty({ ...newProperty, operationType: e.target.value as any })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        required
                      >
                        {operationTypes.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Property Type *</label>
                      <select
                        value={newProperty.propertyType}
                        onChange={(e) => setNewProperty({ ...newProperty, propertyType: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        required
                      >
                        {propertyTypes.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Leasing Term *</label>
                      <select
                        value={newProperty.leasingTerm}
                        onChange={(e) => setNewProperty({ ...newProperty, leasingTerm: e.target.value as any })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        required
                      >
                        <option value="short-term">Short Term</option>
                        <option value="long-term">Long Term</option>
                      </select>
                    </div>

                    {newProperty.leasingTerm === "long-term" && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Check-in Date</label>
                          <input
                            type="date"
                            value={newProperty.checkInDate}
                            onChange={(e) => setNewProperty({ ...newProperty, checkInDate: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Check-out Date</label>
                          <input
                            type="date"
                            value={newProperty.checkOutDate}
                            onChange={(e) => setNewProperty({ ...newProperty, checkOutDate: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          />
                        </div>
                      </>
                    )}

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
                      <input
                        type="text"
                        value={newProperty.address}
                        onChange={(e) => setNewProperty({ ...newProperty, address: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                </section>

                {/* Details */}
                <section>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Property Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
                      <input
                        type="number"
                        min={0}
                        value={newProperty.bedrooms}
                        onChange={(e) => setNewProperty({ ...newProperty, bedrooms: Number(e.target.value) })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms</label>
                      <input
                        type="number"
                        min={0}
                        value={newProperty.bathrooms}
                        onChange={(e) => setNewProperty({ ...newProperty, bathrooms: Number(e.target.value) })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Max Guests</label>
                      <input
                        type="number"
                        min={1}
                        value={newProperty.maxGuests}
                        onChange={(e) => setNewProperty({ ...newProperty, maxGuests: Number(e.target.value) })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Proposed Rate *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-gray-500">$</span>
                        <input
                          type="number"
                          min={1}
                          value={newProperty.proposedRate}
                          onChange={(e) => setNewProperty({ ...newProperty, proposedRate: Number(e.target.value) })}
                          className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Facilities */}
                <section>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Facilities</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {facilitiesOptions.map((facility) => (
                      <label key={facility} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newProperty.facilities.includes(facility)}
                          onChange={(e) => handleFacilityChange(facility, e.target.checked)}
                          className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                        />
                        <span className="text-sm text-gray-700">{facility}</span>
                      </label>
                    ))}
                  </div>
                </section>

                {/* Surroundings */}
                <section>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Surroundings</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {surroundingsOptions.map((sur) => (
                      <label key={sur} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newProperty.surroundings.includes(sur)}
                          onChange={(e) => handleSurroundingChange(sur, e.target.checked)}
                          className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                        />
                        <span className="text-sm text-gray-700">{sur}</span>
                      </label>
                    ))}
                  </div>
                </section>

                {/* Images */}
                <section>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Property Images (URLs)</h4>
                  <div className="space-y-2">
                    {newProperty.images.map((image, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="url"
                          value={image}
                          onChange={(e) => updateImage(index, e.target.value)}
                          placeholder="https://example.com/image.jpg"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                        {newProperty.images.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="p-2 rounded bg-red-50 text-red-600 hover:bg-red-100"
                            aria-label="Remove image"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addImageField}
                      className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                    >
                      + Add another image
                    </button>
                  </div>
                </section>

                {/* Amenities (free inputs) */}
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amenities
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {amenitiesList.map((amenity) => (
                      <button
                        type="button"
                        key={amenity}
                        onClick={() =>
                          setNewProperty((prev) => ({
                            ...prev,
                            amenities: prev.amenities.includes(amenity)
                              ? prev.amenities.filter((a) => a !== amenity)
                              : [...prev.amenities, amenity],
                          }))
                        }
                        className={`px-3 py-2 rounded-lg border text-sm ${
                          newProperty.amenities.includes(amenity)
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {amenity}
                      </button>
                    ))}
                  </div>
                </div>


                {/* Property Description */}
                <section>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Property Description</h4>
                  <textarea
                    value={newProperty.description}
                    onChange={(e) => setNewProperty({ ...newProperty, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    rows={4}
                    placeholder="Describe your property in detail..."
                    required
                  />
                </section>

                {/* Contact Numbers */}
                <section>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Contact Numbers</h4>
                  <div className="space-y-3">
                    {newProperty.contactNumbers.map((number, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                          <input
                            type="tel"
                            value={number}
                            onChange={(e) => updateContactNumber(index, e.target.value)}
                            placeholder="Enter mobile number"
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          />
                        </div>
                        {newProperty.contactNumbers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeContactNumber(index)}
                            className="p-2 rounded bg-red-50 text-red-600 hover:bg-red-100"
                            aria-label="Remove contact"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addContactNumber}
                      className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                    >
                      + Add another contact number
                    </button>
                  </div>
                </section>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    className="px-5 py-3 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-3 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
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
