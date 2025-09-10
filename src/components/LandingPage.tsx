import React, { useState } from 'react';
import { Search, Calendar, Users, MapPin, Star, TrendingUp, Award, Shield, User, LogIn } from 'lucide-react';
import TopNavigation from './layout/TopNavigation';

interface SearchParams {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}

interface LandingPageProps {
  onSearch: (params: SearchParams) => void;
  onLogin: () => void;
  isAuthenticated: boolean;
  user: any;
}

const LandingPage: React.FC<LandingPageProps> = ({ 
  onSearch, 
  onLogin, 
  isAuthenticated, 
  user 
}) => {
  const [searchParams, setSearchParams] = useState<SearchParams>({
    destination: '',
    checkIn: '',
    checkOut: '',
    guests: 1
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchParams.destination.trim()) {
      alert('Please enter a destination');
      return;
    }
    if (!searchParams.checkIn || !searchParams.checkOut) {
      alert('Please select check-in and check-out dates');
      return;
    }
    onSearch(searchParams);
  };

  const getTodayString = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getTomorrowString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">

      
      {/* Hero Section with Search */}
      <div className="relative">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=1920"
            alt="Beautiful hotel destination"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Find Your Perfect Stay
            </h1>
            <p className="text-xl text-white opacity-90 max-w-2xl mx-auto">
              Discover amazing properties around the world. From cozy apartments
              to luxury villas, we have the perfect accommodation for your next
              adventure.
            </p>
          </div>

          {/* Search Form */}
          <div className="max-w-4xl mx-auto">
            <form
              onSubmit={handleSearch}
              className="bg-white rounded-2xl shadow-2xl p-8 space-y-8"
            >
              {/* Row 1: Destination */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Where do you want to go?
                </label>
                <input
                  type="text"
                  value={searchParams.destination}
                  onChange={(e) =>
                    setSearchParams((prev) => ({
                      ...prev,
                      destination: e.target.value,
                    }))
                  }
                  placeholder="Enter destination, city, or property name"
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-lg"
                />
              </div>

              {/* Row 2: Dates + Guests */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Check-in Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Check-in
                  </label>
                  <input
                    type="date"
                    value={searchParams.checkIn}
                    onChange={(e) =>
                      setSearchParams((prev) => ({
                        ...prev,
                        checkIn: e.target.value,
                      }))
                    }
                    min={getTodayString()}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-lg"
                  />
                </div>

                {/* Check-out Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Check-out
                  </label>
                  <input
                    type="date"
                    value={searchParams.checkOut}
                    onChange={(e) =>
                      setSearchParams((prev) => ({
                        ...prev,
                        checkOut: e.target.value,
                      }))
                    }
                    min={searchParams.checkIn || getTomorrowString()}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-lg"
                  />
                </div>

                {/* Guests */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    <Users className="w-4 h-4 inline mr-2" />
                    Guests
                  </label>
                  <select
                    value={searchParams.guests}
                    onChange={(e) =>
                      setSearchParams((prev) => ({
                        ...prev,
                        guests: Number(e.target.value),
                      }))
                    }
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-lg"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                      <option key={num} value={num}>
                        {num} Guest{num > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: Search Button */}
              <div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 text-lg shadow-lg"
                >
                  <Search className="w-5 h-5 inline mr-2" />
                  Search Properties
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose HotelPlatform?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We make finding and booking your perfect accommodation simple,
              secure, and rewarding.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Premium Properties
              </h3>
              <p className="text-gray-600">
                Carefully curated selection of high-quality properties with
                verified reviews and ratings.
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Secure Booking
              </h3>
              <p className="text-gray-600">
                Your payments and personal information are protected with
                bank-level security.
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Best Price Guarantee
              </h3>
              <p className="text-gray-600">
                Find the same property for less elsewhere? We'll match the price
                and give you an extra 5% off.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Popular Destinations */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Popular Destinations
            </h2>
            <p className="text-xl text-gray-600">
              Explore our most loved locations around the world
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                name: "New York",
                image:
                  "https://images.pexels.com/photos/466685/pexels-photo-466685.jpeg?auto=compress&cs=tinysrgb&w=400",
                properties: "1,200+",
              },
              {
                name: "Miami",
                image:
                  "https://images.pexels.com/photos/1115804/pexels-photo-1115804.jpeg?auto=compress&cs=tinysrgb&w=400",
                properties: "850+",
              },
              {
                name: "Los Angeles",
                image:
                  "https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg?auto=compress&cs=tinysrgb&w=400",
                properties: "950+",
              },
              {
                name: "Chicago",
                image:
                  "https://images.pexels.com/photos/2089696/pexels-photo-2089696.jpeg?auto=compress&cs=tinysrgb&w=400",
                properties: "720+",
              },
            ].map((destination, index) => (
              <div
                key={index}
                className="relative rounded-2xl overflow-hidden cursor-pointer transform hover:scale-105 transition-transform duration-200 shadow-lg"
                onClick={() =>
                  setSearchParams((prev) => ({
                    ...prev,
                    destination: destination.name,
                  }))
                }
              >
                <img
                  src={destination.image}
                  alt={destination.name}
                  className="w-full h-64 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="text-2xl font-bold">{destination.name}</h3>
                  <p className="text-white opacity-90">
                    {destination.properties} properties
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">2M+</div>
              <div className="text-gray-600">Happy Guests</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">
                50K+
              </div>
              <div className="text-gray-600">Properties</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">200+</div>
              <div className="text-gray-600">Cities</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-600 mb-2">4.8</div>
              <div className="text-gray-600">Average Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">H</span>
                </div>
                <span className="text-xl font-bold">HotelPlatform</span>
              </div>
              <p className="text-gray-400">
                Your trusted partner for finding the perfect accommodation
                worldwide.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Press
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Safety
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Host</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    List Your Property
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Host Resources
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Community
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Host Insurance
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 HotelPlatform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;