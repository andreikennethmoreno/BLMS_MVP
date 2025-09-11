import React, { useState } from 'react';
import { Ticket, Check, X, Percent, DollarSign } from 'lucide-react';
import { voucherService } from '../services/voucherService';
import { formatCurrency } from '../utils/formatters';
import type { Voucher } from '../types';

interface VoucherInputProps {
  propertyId: string;
  subtotal: number;
  onVoucherApplied: (voucher: Voucher, discountAmount: number) => void;
  onVoucherRemoved: () => void;
  appliedVoucher?: {
    voucher: Voucher;
    discountAmount: number;
  } | null;
}

const VoucherInput: React.FC<VoucherInputProps> = ({
  propertyId,
  subtotal,
  onVoucherApplied,
  onVoucherRemoved,
  appliedVoucher
}) => {
  const [voucherCode, setVoucherCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');
  const [showInput, setShowInput] = useState(false);

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      setError('Please enter a voucher code');
      return;
    }

    setIsValidating(true);
    setError('');

    try {
      const validation = voucherService.validateVoucherCode(
        voucherCode.trim(),
        propertyId,
        subtotal
      );

      if (!validation.isValid) {
        setError(validation.error || 'Invalid voucher code');
        return;
      }

      if (validation.voucher && validation.discountAmount !== undefined) {
        onVoucherApplied(validation.voucher, validation.discountAmount);
        setVoucherCode('');
        setShowInput(false);
        setError('');
      }
    } catch (error) {
      setError('Failed to validate voucher code');
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveVoucher = () => {
    onVoucherRemoved();
    setVoucherCode('');
    setError('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApplyVoucher();
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900 flex items-center">
          <Ticket className="w-5 h-5 mr-2 text-emerald-600" />
          Voucher Code
        </h4>
        
        {!appliedVoucher && !showInput && (
          <button
            onClick={() => setShowInput(true)}
            className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
          >
            Have a voucher?
          </button>
        )}
      </div>

      {/* Applied Voucher Display */}
      {appliedVoucher && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-green-900">
                  Voucher Applied: {appliedVoucher.voucher.code}
                </p>
                <p className="text-sm text-green-700 flex items-center">
                  {appliedVoucher.voucher.discountType === 'percentage' ? (
                    <>
                      <Percent className="w-4 h-4 mr-1" />
                      {appliedVoucher.voucher.discountValue}% off
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-4 h-4 mr-1" />
                      {formatCurrency(appliedVoucher.voucher.discountValue)} off
                    </>
                  )}
                  {' • '}
                  You save {formatCurrency(appliedVoucher.discountAmount)}
                </p>
              </div>
            </div>
            <button
              onClick={handleRemoveVoucher}
              className="text-green-700 hover:text-green-800 p-1"
              title="Remove voucher"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Voucher Input */}
      {showInput && !appliedVoucher && (
        <div className="space-y-3">
          <div className="flex space-x-2">
            <input
              type="text"
              value={voucherCode}
              onChange={(e) => {
                setVoucherCode(e.target.value.toUpperCase());
                setError('');
              }}
              onKeyPress={handleKeyPress}
              placeholder="Enter voucher code"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent uppercase"
              maxLength={20}
            />
            <button
              onClick={handleApplyVoucher}
              disabled={isValidating || !voucherCode.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-6 py-3 rounded-lg transition-colors"
            >
              {isValidating ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Apply'
              )}
            </button>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
          
          <button
            onClick={() => {
              setShowInput(false);
              setVoucherCode('');
              setError('');
            }}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default VoucherInput;