import React, { useState, useMemo } from 'react';
import { ArrowLeft, Filter, SlidersHorizontal, MapPin, Star, Users, Bed, Bath, Wifi, Car, Utensils, LogIn, User } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import propertiesData from '../data/properties.json';
import reviewsData from '../data/reviews.json';
import { isPropertyLiveForCustomers, getDisplayRate } from '../utils/propertyCalculations';
import { Property } from '../types';

interface SearchParams {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}

interface SearchResultsPageProps {
  searchParams: SearchParams;
  onPropertySelect: (propertyId: string) => void;
  onBackToLanding: () => void;
  onLogin: () => void;
  isAuthenticated: boolean;
  user: any;
}

interface Filters {
  minPrice: number;
  maxPrice: number;
  propertyType: string;
  amenities: string[];
  rating: number;
  bedrooms: number;
}

const SearchResultsPage: React.FC<SearchResultsPageProps> = ({
  searchParams,
  onPropertySelect,
  onBackToLanding,
  onLogin,
  isAuthenticated,
  user
}) => {
  const [properties] = useLocalStorage('properties', propertiesData.properties);
  const [reviews] = useLocalStorage('reviews', reviewsData.reviews);
  const [sortBy, setSortBy] = useState('best-match');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    minPrice: 0,
    maxPrice: 1000,
    propertyType: 'all',
    amenities: [],
    rating: 0,
    bedrooms: 0
  });

  // Filter properties that are live for customers
  const availableProperties: Property[] = properties.filter((p: Property) => 
    isPropertyLiveForCustomers(p)
  ) as Property[];

  // Apply search and filters
  const filteredProperties = useMemo(() => {
    return availableProperties.filter((property: Property) => {
      // Search by destination
      const matchesDestination = property.title.toLowerCase().includes(searchParams.destination.toLowerCase()) ||
                                property.address.toLowerCase().includes(searchParams.destination.toLowerCase());
      
      // Filter by guest capacity
      const matchesGuests = property.maxGuests >= searchParams.guests;
      
      // Filter by price range
      const rate = getDisplayRate(property);
      const matchesPrice = rate >= filters.minPrice && rate <= filters.maxPrice;
      
      // Filter by property type
      const matchesType = filters.propertyType === 'all' || 
                         property.propertyType === filters.propertyType;
      
      // Filter by amenities
      const matchesAmenities = filters.amenities.length === 0 || 
                              filters.amenities.every(amenity => 
                                property.amenities.some(propAmenity => 
                                  propAmenity.toLowerCase().includes(amenity.toLowerCase())
                                )
                              );
      
      // Filter by bedrooms
      const matchesBedrooms = filters.bedrooms === 0 || property.bedrooms >= filters.bedrooms;
      
      // Filter by rating
      const propertyReviews = reviews.filter((r: any) => r.propertyId === property.id);
      const avgRating = propertyReviews.length > 0 
        ? propertyReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / propertyReviews.length 
        : 0;
      const matchesRating = filters.rating === 0 || avgRating >= filters.rating;
      
      return matchesDestination && matchesGuests && matchesPrice && matchesType && 
             matchesAmenities && matchesBedrooms && matchesRating;
    });
  }, [availableProperties, searchParams, filters, reviews]);

  // Sort properties
  const sortedProperties = useMemo(() => {
    const sorted = [...filteredProperties];
    
    switch (sortBy) {
      case 'price-low':
        return sorted.sort((a, b) => getDisplayRate(a) - getDisplayRate(b));
      case 'price-high':
        return sorted.sort((a, b) => getDisplayRate(b) - getDisplayRate(a));
      case 'rating':
        return sorted.sort((a, b) => {
          const aReviews = reviews.filter((r: any) => r.propertyId === a.id);
          const bReviews = reviews.filter((r: any) => r.propertyId === b.id);
          const aRating = aReviews.length > 0 ? aReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / aReviews.length : 0;
          const bRating = bReviews.length > 0 ? bReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / bReviews.length : 0;
          return bRating - aRating;
        });
      case 'newest':
        return sorted.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      default:
        return sorted;
    }
  }, [filteredProperties, sortBy, reviews]);

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'wifi':
        return <Wifi className="w-4 h-4" />;
      case 'parking':
      case 'car':
        return <Car className="w-4 h-4" />;
      case 'kitchen':
        return <Utensils className="w-4 h-4" />;
      default:
        return <Star className="w-4 h-4" />;
    }
  };

  const getPropertyRating = (propertyId: string) => {
    const propertyReviews = reviews.filter((r: any) => r.propertyId === propertyId);
    if (propertyReviews.length === 0) return 0;
    return propertyReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / propertyReviews.length;
  };

  const toggleAmenityFilter = (amenity: string) => {
    setFilters(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const resetFilters = () => {
    setFilters({
      minPrice: 0,
      maxPrice: 1000,
      propertyType: 'all',
      amenities: [],
      rating: 0,
      bedrooms: 0
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBackToLanding}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-xs">H</span>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  HotelPlatform
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {isAuthenticated && user ? (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {user.name?.charAt(0)}
                    </span>
                  </div>
                  <span className="text-gray-700 font-medium">{user.name}</span>
                </div>
              ) : (
                <button
                  onClick={onLogin}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Search Summary */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {searchParams.destination} • {searchParams.guests} guest{searchParams.guests > 1 ? 's' : ''}
              </h1>
              <p className="text-gray-600">
                {new Date(searchParams.checkIn).toLocaleDateString()} - {new Date(searchParams.checkOut).toLocaleDateString()}
              </p>
            </div>
            <div className="text-sm text-gray-600">
              {sortedProperties.length} properties found
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Filters Sidebar - 20% width */}
          <div className="w-1/5 bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-fit sticky top-24">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
              <button
                onClick={resetFilters}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Reset
              </button>
            </div>

            {/* Price Range */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Price Range</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Min Price</label>
                  <input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) => setFilters(prev => ({ ...prev, minPrice: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Max Price</label>
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Property Type */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Property Type</h4>
              <select
                value={filters.propertyType}
                onChange={(e) => setFilters(prev => ({ ...prev, propertyType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="condo">Condo</option>
                <option value="villa">Villa</option>
              </select>
            </div>

            {/* Bedrooms */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Bedrooms</h4>
              <select
                value={filters.bedrooms}
                onChange={(e) => setFilters(prev => ({ ...prev, bedrooms: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={0}>Any</option>
                <option value={1}>1+</option>
                <option value={2}>2+</option>
                <option value={3}>3+</option>
                <option value={4}>4+</option>
              </select>
            </div>

            {/* Rating */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Minimum Rating</h4>
              <select
                value={filters.rating}
                onChange={(e) => setFilters(prev => ({ ...prev, rating: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={0}>Any Rating</option>
                <option value={3}>3+ Stars</option>
                <option value={4}>4+ Stars</option>
                <option value={4.5}>4.5+ Stars</option>
              </select>
            </div>

            {/* Amenities */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Amenities</h4>
              <div className="space-y-2">
                {['WiFi', 'Kitchen', 'Parking', 'Pool', 'Air Conditioning'].map((amenity) => (
                  <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.amenities.includes(amenity)}
                      onChange={() => toggleAmenityFilter(amenity)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{amenity}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content - 80% width */}
          <div className="flex-1">
            {/* Sort Bar */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-700">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="best-match">Best Match</option>
                    <option value="price-low">Lowest Price</option>
                    <option value="price-high">Highest Price</option>
                    <option value="rating">Top Rated</option>
                    <option value="newest">Newest</option>
                  </select>
                </div>
                
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="md:hidden flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Filters</span>
                </button>
              </div>
            </div>

            {/* Property Listings */}
            <div className="space-y-4">
              {sortedProperties.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
                  <p className="text-gray-600">Try adjusting your search criteria or filters</p>
                </div>
              ) : (
                sortedProperties.map((property: Property) => {
                  const rating = getPropertyRating(property.id);
                  const reviewCount = reviews.filter((r: any) => r.propertyId === property.id).length;
                  
                  return (
                    <div
                      key={property.id}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => onPropertySelect(property.id)}
                    >
                      <div className="flex">
                        {/* Property Image - Left side */}
                        <div className="w-80 h-64 flex-shrink-0">
                          <img
                            src={property.images[0]}
                            alt={property.title}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Property Details - Right side */}
                        <div className="flex-1 p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                {property.title}
                              </h3>
                              <p className="text-gray-600 flex items-center mb-3">
                                <MapPin className="w-4 h-4 mr-1" />
                                {property.address}
                              </p>
                              
                              {/* Rating */}
                              {rating > 0 && (
                                <div className="flex items-center space-x-2 mb-3">
                                  <div className="flex items-center space-x-1">
                                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                    <span className="font-medium text-gray-900">{rating.toFixed(1)}</span>
                                  </div>
                                  <span className="text-sm text-gray-600">
                                    ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
                                  </span>
                                </div>
                              )}

                              {/* Property specs */}
                              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                                <span className="flex items-center">
                                  <Bed className="w-4 h-4 mr-1" />
                                  {property.bedrooms} bed{property.bedrooms > 1 ? 's' : ''}
                                </span>
                                <span className="flex items-center">
                                  <Bath className="w-4 h-4 mr-1" />
                                  {property.bathrooms} bath{property.bathrooms > 1 ? 's' : ''}
                                </span>
                                <span className="flex items-center">
                                  <Users className="w-4 h-4 mr-1" />
                                  Up to {property.maxGuests} guests
                                </span>
                              </div>

                              {/* Amenities */}
                              <div className="flex flex-wrap gap-2 mb-4">
                                {property.amenities.slice(0, 4).map((amenity, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center space-x-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium"
                                  >
                                    {getAmenityIcon(amenity)}
                                    <span>{amenity}</span>
                                  </span>
                                ))}
                                {property.amenities.length > 4 && (
                                  <span className="text-xs text-gray-500">
                                    +{property.amenities.length - 4} more
                                  </span>
                                )}
                              </div>

                              {/* Description */}
                              <p className="text-gray-600 text-sm line-clamp-2">
                                {property.description}
                              </p>
                            </div>

                            {/* Price and Book Button */}
                            <div className="text-right ml-6">
                              <div className="mb-4">
                                <div className="text-3xl font-bold text-blue-600">
                                  ${getDisplayRate(property)}
                                </div>
                                <div className="text-sm text-gray-600">per night</div>
                                {searchParams.checkIn && searchParams.checkOut && (
                                  <div className="text-sm text-gray-500 mt-1">
                                    Total: ${getDisplayRate(property) * Math.ceil((new Date(searchParams.checkOut).getTime() - new Date(searchParams.checkIn).getTime()) / (1000 * 60 * 60 * 24))}
                                  </div>
                                )}
                              </div>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onPropertySelect(property.id);
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                              >
                                View Details
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResultsPage;