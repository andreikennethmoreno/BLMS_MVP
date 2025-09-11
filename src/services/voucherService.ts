/**
 * Voucher Service
 * 
 * Handles all voucher-related operations including creation, validation,
 * application, and usage tracking.
 * 
 * Data Flow:
 * 1. Unit owner creates voucher -> validates and stores
 * 2. Customer enters code at checkout -> validates and applies discount
 * 3. Booking completed -> records voucher usage
 * 4. Analytics track voucher performance
 */

import { dataService } from './dataService';
import { STORAGE_KEYS, BUSINESS_CONFIG } from '../config/constants';
import { isDateInPast } from '../utils/dateHelpers';
import type { Voucher, VoucherUsage, Property } from '../types';

interface VoucherValidationResult {
  isValid: boolean;
  error?: string;
  voucher?: Voucher;
  discountAmount?: number;
}

/**
 * Voucher service class
 */
class VoucherService {
  /**
   * Generate unique voucher code
   */
  generateVoucherCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < BUSINESS_CONFIG.VOUCHER_CODE_LENGTH; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Create new voucher
   */
  createVoucher(voucherData: {
    code?: string;
    ownerId: string;
    propertyId: string;
    propertyTitle: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    expirationDate: string;
    usageLimit: number;
  }): Voucher {
    // Validate voucher data
    this.validateVoucherData(voucherData);

    // Check for duplicate code
    const existingVouchers = this.getAllVouchers();
    const code = voucherData.code || this.generateVoucherCode();
    
    if (existingVouchers.some(v => v.code === code)) {
      throw new Error('Voucher code already exists. Please choose a different code.');
    }

    const newVoucher: Voucher = {
      id: `voucher-${Date.now()}`,
      code,
      ownerId: voucherData.ownerId,
      propertyId: voucherData.propertyId,
      propertyTitle: voucherData.propertyTitle,
      discountType: voucherData.discountType,
      discountValue: voucherData.discountValue,
      expirationDate: voucherData.expirationDate,
      usageLimit: voucherData.usageLimit,
      usedCount: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const vouchers = this.getAllVouchers();
    dataService.setData(STORAGE_KEYS.VOUCHERS, [...vouchers, newVoucher]);
    
    return newVoucher;
  }

  /**
   * Validate voucher code and calculate discount
   */
  validateVoucherCode(
    code: string, 
    propertyId: string, 
    subtotal: number
  ): VoucherValidationResult {
    const vouchers = this.getAllVouchers();
    const voucher = vouchers.find(v => 
      v.code.toUpperCase() === code.toUpperCase() && 
      v.propertyId === propertyId
    );

    if (!voucher) {
      return {
        isValid: false,
        error: 'Invalid voucher code for this property'
      };
    }

    if (!voucher.isActive) {
      return {
        isValid: false,
        error: 'This voucher is no longer active'
      };
    }

    if (isDateInPast(voucher.expirationDate)) {
      return {
        isValid: false,
        error: 'This voucher has expired'
      };
    }

    if (voucher.usedCount >= voucher.usageLimit) {
      return {
        isValid: false,
        error: 'This voucher has reached its usage limit'
      };
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (voucher.discountType === 'percentage') {
      discountAmount = Math.round(subtotal * (voucher.discountValue / 100));
    } else {
      discountAmount = Math.min(voucher.discountValue, subtotal);
    }

    return {
      isValid: true,
      voucher,
      discountAmount
    };
  }

  /**
   * Apply voucher to booking (record usage)
   */
  applyVoucher(
    voucherId: string,
    bookingId: string,
    customerId: string,
    customerName: string,
    propertyId: string,
    discountAmount: number
  ): void {
    // Record voucher usage
    const usage: VoucherUsage = {
      id: `usage-${Date.now()}`,
      voucherId,
      bookingId,
      customerId,
      customerName,
      propertyId,
      discountAmount,
      usedAt: new Date().toISOString()
    };

    const usageHistory = this.getVoucherUsage();
    dataService.setData(STORAGE_KEYS.VOUCHER_USAGE, [...usageHistory, usage]);

    // Update voucher used count
    const vouchers = this.getAllVouchers();
    const updatedVouchers = vouchers.map(v => 
      v.id === voucherId 
        ? { ...v, usedCount: v.usedCount + 1, updatedAt: new Date().toISOString() }
        : v
    );
    dataService.setData(STORAGE_KEYS.VOUCHERS, updatedVouchers);
  }

  /**
   * Get all vouchers
   */
  getAllVouchers(): Voucher[] {
    return dataService.getData(STORAGE_KEYS.VOUCHERS, []);
  }

  /**
   * Get vouchers for specific owner
   */
  getVouchersByOwner(ownerId: string): Voucher[] {
    const vouchers = this.getAllVouchers();
    return vouchers.filter(v => v.ownerId === ownerId);
  }

  /**
   * Get vouchers for specific property
   */
  getVouchersByProperty(propertyId: string): Voucher[] {
    const vouchers = this.getAllVouchers();
    return vouchers.filter(v => v.propertyId === propertyId);
  }

  /**
   * Get voucher usage history
   */
  getVoucherUsage(): VoucherUsage[] {
    return dataService.getData(STORAGE_KEYS.VOUCHER_USAGE, []);
  }

  /**
   * Get usage history for specific voucher
   */
  getVoucherUsageHistory(voucherId: string): VoucherUsage[] {
    const usage = this.getVoucherUsage();
    return usage.filter(u => u.voucherId === voucherId);
  }

  /**
   * Update voucher
   */
  updateVoucher(voucherId: string, updates: Partial<Voucher>): void {
    const vouchers = this.getAllVouchers();
    const updatedVouchers = vouchers.map(v => 
      v.id === voucherId 
        ? { ...v, ...updates, updatedAt: new Date().toISOString() }
        : v
    );
    dataService.setData(STORAGE_KEYS.VOUCHERS, updatedVouchers);
  }

  /**
   * Delete voucher
   */
  deleteVoucher(voucherId: string): void {
    const vouchers = this.getAllVouchers();
    const filteredVouchers = vouchers.filter(v => v.id !== voucherId);
    dataService.setData(STORAGE_KEYS.VOUCHERS, filteredVouchers);
  }

  /**
   * Get voucher statistics for owner
   */
  getVoucherStatsForOwner(ownerId: string): {
    totalVouchers: number;
    activeVouchers: number;
    totalUsage: number;
    totalDiscountGiven: number;
  } {
    const vouchers = this.getVouchersByOwner(ownerId);
    const usage = this.getVoucherUsage();
    const ownerUsage = usage.filter(u => 
      vouchers.some(v => v.id === u.voucherId)
    );

    return {
      totalVouchers: vouchers.length,
      activeVouchers: vouchers.filter(v => v.isActive && !isDateInPast(v.expirationDate)).length,
      totalUsage: ownerUsage.length,
      totalDiscountGiven: ownerUsage.reduce((sum, u) => sum + u.discountAmount, 0)
    };
  }

  /**
   * Get platform voucher statistics (for property managers)
   */
  getPlatformVoucherStats(): {
    totalVouchers: number;
    activeVouchers: number;
    totalUsage: number;
    totalDiscountGiven: number;
    topVouchers: Array<{
      code: string;
      propertyTitle: string;
      usedCount: number;
      discountGiven: number;
    }>;
  } {
    const vouchers = this.getAllVouchers();
    const usage = this.getVoucherUsage();

    const topVouchers = vouchers
      .map(v => {
        const voucherUsage = usage.filter(u => u.voucherId === v.id);
        return {
          code: v.code,
          propertyTitle: v.propertyTitle,
          usedCount: v.usedCount,
          discountGiven: voucherUsage.reduce((sum, u) => sum + u.discountAmount, 0)
        };
      })
      .sort((a, b) => b.usedCount - a.usedCount)
      .slice(0, 5);

    return {
      totalVouchers: vouchers.length,
      activeVouchers: vouchers.filter(v => v.isActive && !isDateInPast(v.expirationDate)).length,
      totalUsage: usage.length,
      totalDiscountGiven: usage.reduce((sum, u) => sum + u.discountAmount, 0),
      topVouchers
    };
  }

  /**
   * Validate voucher data before creation/update
   */
  private validateVoucherData(data: any): void {
    const errors: string[] = [];

    if (data.discountType === 'percentage') {
      if (data.discountValue < BUSINESS_CONFIG.MIN_VOUCHER_DISCOUNT_PERCENTAGE || 
          data.discountValue > BUSINESS_CONFIG.MAX_VOUCHER_DISCOUNT_PERCENTAGE) {
        errors.push(`Percentage discount must be between ${BUSINESS_CONFIG.MIN_VOUCHER_DISCOUNT_PERCENTAGE}% and ${BUSINESS_CONFIG.MAX_VOUCHER_DISCOUNT_PERCENTAGE}%`);
      }
    } else if (data.discountType === 'fixed') {
      if (data.discountValue < BUSINESS_CONFIG.MIN_VOUCHER_DISCOUNT_FIXED || 
          data.discountValue > BUSINESS_CONFIG.MAX_VOUCHER_DISCOUNT_FIXED) {
        errors.push(`Fixed discount must be between $${BUSINESS_CONFIG.MIN_VOUCHER_DISCOUNT_FIXED} and $${BUSINESS_CONFIG.MAX_VOUCHER_DISCOUNT_FIXED}`);
      }
    }

    if (!data.expirationDate) {
      errors.push('Expiration date is required');
    } else if (isDateInPast(data.expirationDate)) {
      errors.push('Expiration date cannot be in the past');
    }

    if (!data.usageLimit || data.usageLimit < 1) {
      errors.push('Usage limit must be at least 1');
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
  }
}

// Export singleton instance
export const voucherService = new VoucherService();