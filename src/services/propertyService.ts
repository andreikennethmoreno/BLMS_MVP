/**
 * Property Service
 * 
 * This service handles all property-related operations including
 * creation, approval, rejection, and status management.
 * 
 * Data Flow:
 * 1. Unit owner submits property -> status: pending_review
 * 2. Property manager reviews -> approve/reject
 * 3. If approved -> contract sent -> status: pending_contract
 * 4. Owner accepts contract -> status: approved (live for bookings)
 */

import { propertyDataService, contractDataService } from './dataService';
import { calculateFinalRate, updatePropertyWithCommission } from '../utils/calculations';
import { validateProperty } from '../utils/validators';
import { PROPERTY_STATUS, BUSINESS_CONFIG } from '../config/constants';
import type { Property, Contract, ContractField } from '../types';

/**
 * Property service class
 */
class PropertyService {
  /**
   * Submit new property for review
   */
  submitProperty(propertyData: Omit<Property, 'id' | 'status' | 'submittedAt'>): Property {
    // Validate property data
    const validationErrors = validateProperty(propertyData);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    // Calculate rates with commission
    const propertyWithRates = updatePropertyWithCommission(propertyData);

    // Calculate maximum stay fields if provided
    let maxStayFields = {};
    if (propertyData.maxStayDays && propertyData.maxStayUnit) {
      const maxStayDays = convertMaxStayToDays(propertyData.maxStayDays, propertyData.maxStayUnit);
      maxStayFields = {
        maxStayDays,
        maxStayUnit: propertyData.maxStayUnit,
        maxStayDisplay: formatMaxStayDisplay(propertyData.maxStayDays, propertyData.maxStayUnit),
        termClassification: calculateTermClassification(maxStayDays)
      };
    }

    const newProperty: Property = {
      ...propertyWithRates,
      ...maxStayFields,
      id: `prop-${Date.now()}`,
      status: PROPERTY_STATUS.PENDING_REVIEW,
      submittedAt: new Date().toISOString(),
      contractApproved: false,
      // Filter out empty values
      images: propertyData.images.filter(img => img.trim() !== ''),
      amenities: propertyData.amenities.filter(amenity => amenity.trim() !== ''),
    } as Property;

    propertyDataService.add(newProperty);
    return newProperty;
  }

  /**
   * Approve property and send contract
   */
  approveProperty(
    propertyId: string, 
    finalRate: number, 
    commissionPercentage: number = BUSINESS_CONFIG.DEFAULT_COMMISSION_PERCENTAGE
  ): Contract {
    // Calculate final rate with commission
    const calculation = calculateFinalRate(finalRate, commissionPercentage);
    
    // Update property status
    propertyDataService.update(propertyId, {
      status: PROPERTY_STATUS.PENDING_CONTRACT,
      finalRate: calculation.finalRate,
      baseRate: calculation.baseRate,
      commissionPercentage: calculation.commissionPercentage,
      commissionAmount: calculation.commissionAmount,
      approvedAt: new Date().toISOString(),
      managerApproved: true
    });

    // Get property and owner details for contract
    const properties = propertyDataService.getAll();
    const property = properties.find((p: Property) => p.id === propertyId);
    
    if (!property) {
      throw new Error('Property not found');
    }

    // Create and send contract
    return this.createContract(property, calculation);
  }

  /**
   * Reject property with reason
   */
  rejectProperty(propertyId: string, rejectionReason: string): void {
    propertyDataService.update(propertyId, {
      status: PROPERTY_STATUS.REJECTED,
      rejectedAt: new Date().toISOString(),
      rejectionReason
    });
  }

  /**
   * Appeal rejected property (resubmit with changes)
   */
  appealProperty(propertyId: string, updatedData: Partial<Property>): Property {
    // Validate updated data
    const validationErrors = validateProperty(updatedData);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    // Get current property to increment appeal count
    const properties = propertyDataService.getAll();
    const currentProperty = properties.find((p: Property) => p.id === propertyId);
    
    if (!currentProperty) {
      throw new Error('Property not found');
    }

    // Calculate updated rates
    const propertyWithRates = updatePropertyWithCommission(updatedData);

    // Update property with new data and reset status
    const updates = {
      ...propertyWithRates,
      images: updatedData.images?.filter(img => img.trim() !== '') || currentProperty.images,
      amenities: updatedData.amenities?.filter(amenity => amenity.trim() !== '') || currentProperty.amenities,
      status: PROPERTY_STATUS.PENDING_REVIEW,
      submittedAt: new Date().toISOString(),
      appealCount: (currentProperty.appealCount || 0) + 1,
      rejectionReason: undefined,
      contractApproved: false
    };

    propertyDataService.update(propertyId, updates);
    
    // Return updated property
    const updatedProperties = propertyDataService.getAll();
    return updatedProperties.find((p: Property) => p.id === propertyId)!;
  }

  /**
   * Create contract for approved property
   */
  private createContract(property: Property, calculation: any): Contract {
    // Get owner information
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const owner = users.find((u: any) => u.id === property.ownerId);
    
    if (!owner) {
      throw new Error('Property owner not found');
    }

    // Create contract fields
    const contractFields: ContractField[] = [
      { id: 'property_name', label: 'Property Name', type: 'text', required: true, value: property.title },
      { id: 'owner_name', label: 'Owner Name', type: 'text', required: true, value: owner.name },
      { id: 'base_rate', label: 'Base Rate (per night)', type: 'number', required: true, value: calculation.baseRate.toString() },
      { id: 'final_rate', label: 'Final Rate with Commission (per night)', type: 'number', required: true, value: calculation.finalRate.toString() },
      { id: 'commission_rate', label: 'Platform Commission (%)', type: 'number', required: true, value: calculation.commissionPercentage.toString() }
    ];

    const contract: Contract = {
      id: `contract-${Date.now()}`,
      templateId: 'template-1', // Default template
      propertyId: property.id,
      ownerId: property.ownerId,
      ownerName: owner.name,
      ownerEmail: owner.email,
      templateName: 'Property Rental Contract',
      terms: `Standard property rental agreement with ${calculation.commissionPercentage}% platform commission. Base rate: $${calculation.baseRate}/night, Final rate with commission: $${calculation.finalRate}/night.`,
      commissionPercentage: calculation.commissionPercentage,
      fields: contractFields,
      baseRate: calculation.baseRate,
      finalRate: calculation.finalRate,
      status: 'sent',
      sentAt: new Date().toISOString()
    };

    contractDataService.add(contract);
    return contract;
  }

  /**
   * Get properties by owner
   */
  getPropertiesByOwner(ownerId: string): Property[] {
    const properties = propertyDataService.getAll();
    return properties.filter((p: Property) => p.ownerId === ownerId);
  }

  /**
   * Get properties available for customers (approved with contracts)
   */
  getAvailableProperties(): Property[] {
    const properties = propertyDataService.getAll();
    return properties.filter((p: Property) => 
      p.status === PROPERTY_STATUS.APPROVED &&
      p.contractApproved === true &&
      p.finalRate !== null &&
      p.finalRate > 0
    );
  }

  /**
   * Get properties pending review
   */
  getPendingProperties(): Property[] {
    const properties = propertyDataService.getAll();
    return properties.filter((p: Property) => p.status === PROPERTY_STATUS.PENDING_REVIEW);
  }
}

// Export singleton instance
export const propertyService = new PropertyService();