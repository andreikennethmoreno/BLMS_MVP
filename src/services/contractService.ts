/**
 * Contract Service
 * 
 * Handles all contract-related operations including creation, review,
 * signing, and status management.
 * 
 * Data Flow:
 * 1. Property approved -> contract auto-generated and sent
 * 2. Unit owner reviews contract -> agree/disagree
 * 3. If agreed -> property becomes live for bookings
 * 4. If disagreed -> property manager can adjust terms
 */

import { contractDataService, propertyDataService } from './dataService';
import { STORAGE_KEYS } from '../config/constants';
import type { Contract, ContractField, Property } from '../types';

/**
 * Contract service class
 */
class ContractService {
  /**
   * Create contract for approved property
   * 
   * Process:
   * 1. Get property and owner details
   * 2. Generate contract fields with calculated rates
   * 3. Create contract record with "sent" status
   * 4. Store in localStorage
   */
  createContract(
    propertyId: string, 
    templateId: string,
    baseRate: number,
    finalRate: number,
    commissionPercentage: number
  ): Contract {
    // Get property details
    const properties = propertyDataService.getAll();
    const property = properties.find((p: Property) => p.id === propertyId);
    
    if (!property) {
      throw new Error('Property not found');
    }

    // Get owner details
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const owner = users.find((u: any) => u.id === property.ownerId);
    
    if (!owner) {
      throw new Error('Property owner not found');
    }

    // Create contract fields with property-specific data
    const contractFields: ContractField[] = [
      { 
        id: 'property_name', 
        label: 'Property Name', 
        type: 'text', 
        required: true, 
        value: property.title 
      },
      { 
        id: 'owner_name', 
        label: 'Owner Name', 
        type: 'text', 
        required: true, 
        value: owner.name 
      },
      { 
        id: 'base_rate', 
        label: 'Base Rate (per night)', 
        type: 'number', 
        required: true, 
        value: baseRate.toString() 
      },
      { 
        id: 'final_rate', 
        label: 'Final Rate with Commission (per night)', 
        type: 'number', 
        required: true, 
        value: finalRate.toString() 
      },
      { 
        id: 'commission_rate', 
        label: 'Platform Commission (%)', 
        type: 'number', 
        required: true, 
        value: commissionPercentage.toString() 
      }
    ];

    const contract: Contract = {
      id: `contract-${Date.now()}`,
      templateId,
      propertyId,
      ownerId: property.ownerId,
      ownerName: owner.name,
      ownerEmail: owner.email,
      templateName: 'Property Rental Contract',
      terms: `Standard property rental agreement with ${commissionPercentage}% platform commission. Base rate: $${baseRate}/night, Final rate with commission: $${finalRate}/night.`,
      commissionPercentage,
      fields: contractFields,
      baseRate,
      finalRate,
      status: 'sent',
      sentAt: new Date().toISOString()
    };

    contractDataService.add(contract);
    return contract;
  }

  /**
   * Owner agrees to contract
   * 
   * Process:
   * 1. Update contract status to "agreed"
   * 2. Update property status to "approved"
   * 3. Mark property as live for customer bookings
   */
  agreeToContract(contractId: string): void {
    // Update contract status
    contractDataService.update(contractId, {
      status: 'agreed',
      agreedAt: new Date().toISOString(),
      reviewedAt: new Date().toISOString()
    });

    // Get contract to find associated property
    const contracts = contractDataService.getAll();
    const contract = contracts.find((c: Contract) => c.id === contractId);
    
    if (!contract) {
      throw new Error('Contract not found');
    }

    // Update property to approved status
    propertyDataService.update(contract.propertyId, {
      status: 'approved',
      contractAcceptedAt: new Date().toISOString(),
      contractApproved: true,
      finalRate: contract.finalRate,
      baseRate: contract.baseRate,
      commissionPercentage: contract.commissionPercentage
    });
  }

  /**
   * Owner disagrees with contract
   */
  disagreeWithContract(contractId: string, reason: string): void {
    contractDataService.update(contractId, {
      status: 'disagreed',
      disagreedAt: new Date().toISOString(),
      reviewedAt: new Date().toISOString(),
      disagreementReason: reason
    });
  }

  /**
   * Get contracts for specific owner
   */
  getContractsForOwner(ownerId: string): Contract[] {
    const contracts = contractDataService.getAll();
    return contracts.filter((contract: Contract) => contract.ownerId === ownerId);
  }

  /**
   * Get pending contracts for owner
   */
  getPendingContractsForOwner(ownerId: string): Contract[] {
    return this.getContractsForOwner(ownerId).filter(
      (contract: Contract) => contract.status === 'sent'
    );
  }
}

// Export singleton instance
export const contractService = new ContractService();