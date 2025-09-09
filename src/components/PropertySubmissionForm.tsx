import React, { useState } from "react";
import { Save, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { updatePropertyWithCommission } from "../utils/propertyCalculations";
import {
  convertMaxStayToDays,
  formatMaxStayDisplay,
  calculateTermClassification,
} from "../utils/calculations";
import { Property } from "../types";
import { PROPERTY_STATUS } from "../config/constants";

interface PropertySubmissionFormProps {
  onSubmit: () => void;
  onCancel: () => void;
}

const PropertySubmissionForm: React.FC<PropertySubmissionFormProps> = ({
  onSubmit,
  onCancel,
}) => {
  const { user } = useAuth();
  const [properties, setProperties] = useLocalStorage<Property[]>(
    "properties",
    [] as Property[]
  );
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    address: "",
    images: [""],
    amenities: [""],
    bedrooms: 1,
    bathrooms: 1,
    maxGuests: 2,
    proposedRate: 100,
    rentalType: "short-term" as "short-term" | "long-term",
    maxStayValue: 6,
    maxStayUnit: "months" as "days" | "months" | "years",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Calculate maximum stay in days and term classification
    const maxStayDays = convertMaxStayToDays(
      formData.maxStayValue,
      formData.maxStayUnit
    );
    const maxStayDisplay = formatMaxStayDisplay(
      formData.maxStayValue,
      formData.maxStayUnit
    );
    const termClassification = calculateTermClassification(maxStayDays);

    // Calculate rates with commission
    const propertyWithRates = updatePropertyWithCommission(formData, 15);

    const newProperty: Property = {
      id: `prop-${Date.now()}`,
      ownerId: user.id,
      ...propertyWithRates,
      maxStayDays,
      maxStayUnit: formData.maxStayUnit,
      maxStayDisplay,
      termClassification,
      images: formData.images.filter((img) => img.trim() !== ""),
      amenities: formData.amenities.filter((amenity) => amenity.trim() !== ""),
      status: PROPERTY_STATUS.PENDING_REVIEW,
      submittedAt: new Date().toISOString(),
      contractApproved: false,
    };

    setProperties([...properties, newProperty]);
    onSubmit();
  };

  const addImageField = () => {
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ""],
    }));
  };

  const updateImage = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.map((img, i) => (i === index ? value : img)),
    }));
  };

  const removeImage = (index: number) => {
    if (formData.images.length > 1) {
      setFormData((prev) => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index),
      }));
    }
  };

  const addAmenityField = () => {
    setFormData((prev) => ({
      ...prev,
      amenities: [...prev.amenities, ""],
    }));
  };

  const updateAmenity = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.map((amenity, i) =>
        i === index ? value : amenity
      ),
    }));
  };

  const removeAmenity = (index: number) => {
    if (formData.amenities.length > 1) {
      setFormData((prev) => ({
        ...prev,
        amenities: prev.amenities.filter((_, i) => i !== index),
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Property Title
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
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
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            rows={4}
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, address: e.target.value }))
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
            value={formData.bedrooms}
            onChange={(e) =>
              setFormData((prev) => ({
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
            value={formData.bathrooms}
            onChange={(e) =>
              setFormData((prev) => ({
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
            value={formData.maxGuests}
            onChange={(e) =>
              setFormData((prev) => ({
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
            <span className="absolute left-3 top-3 text-gray-500">$</span>
            <input
              type="number"
              min="1"
              value={formData.proposedRate}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  proposedRate: Number(e.target.value),
                }))
              }
              className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rental Type
          </label>
          <select
            value={formData.rentalType}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                rentalType: e.target.value as "short-term" | "long-term",
              }))
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="short-term">Short-term Rental</option>
            <option value="long-term">Long-term Rental</option>
          </select>
          <p className="text-sm text-gray-500 mt-1">
            Choose the intended rental duration for your property
          </p>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maximum Allowed Stay
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <input
                type="number"
                min="1"
                value={formData.maxStayValue}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    maxStayValue: Number(e.target.value),
                  }))
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Enter number"
              />
            </div>
            <div>
              <select
                value={formData.maxStayUnit}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    maxStayUnit: e.target.value as "days" | "months" | "years",
                  }))
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="days">Days</option>
                <option value="months">Months</option>
                <option value="years">Years</option>
              </select>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Maximum duration guests can stay at your property
          </p>
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Classification:</strong>{" "}
              {calculateTermClassification(
                convertMaxStayToDays(
                  formData.maxStayValue,
                  formData.maxStayUnit
                )
              ) === "short-term"
                ? "Short-term"
                : "Long-term"}
              (
              {formatMaxStayDisplay(
                formData.maxStayValue,
                formData.maxStayUnit
              )}{" "}
              maximum)
            </p>
          </div>
        </div>
      </div>

      {/* Images */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Property Images (URLs)
        </label>
        <div className="space-y-2">
          {formData.images.map((image, index) => (
            <div key={index} className="flex space-x-2">
              <input
                type="url"
                value={image}
                onChange={(e) => updateImage(index, e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              {formData.images.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors"
                >
                  Remove
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
      </div>

      {/* Amenities */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Amenities
        </label>
        <div className="space-y-2">
          {formData.amenities.map((amenity, index) => (
            <div key={index} className="flex space-x-2">
              <input
                type="text"
                value={amenity}
                onChange={(e) => updateAmenity(index, e.target.value)}
                placeholder="e.g., WiFi, Kitchen, Pool"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              {formData.amenities.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeAmenity(index)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
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
          onClick={onCancel}
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>Submit Property</span>
        </button>
      </div>
    </form>
  );
};

export default PropertySubmissionForm;
