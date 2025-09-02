/**
 * Contract Card Component
 * 
 * Reusable card for displaying contract information.
 * Used in contract lists and review interfaces.
 * 
 * Features:
 * - Contract details and terms display
 * - Commission structure visualization
 * - Action buttons for review/signing
 * - Status tracking with timestamps
 * 
 * Data Flow:
 * 1. Receives contract data as props
 * 2. Calculates commission amounts and final rates
 * 3. Renders appropriate actions based on contract status and user role
 */

import React from 'react';
import { FileText, DollarSign, Percent, Calendar } from 'lucide-react';
import StatusBadge from '../../common/StatusBadge';
import { formatDate } from '../../../utils/dateHelpers';
import { formatCurrency } from '../../../utils/formatters';
import type { Contract } from '../../../types';

interface ContractCardProps {
  contract: Contract;
  onReview?: (contract: Contract) => void;
  onViewPDF?: (contract: Contract) => void;
  onSign?: (contract: Contract) => void;
  showActions?: boolean;
  className?: string;
}

const ContractCard: React.FC<ContractCardProps> = ({
  contract,
  onReview,
  onViewPDF,
  onSign,
  showActions = true,
  className = ''
}) => {
  // Calculate final rate from fields if available
  const getFinalRate = (): number => {
    const rateField = contract.fields?.find(f => 
      f.label?.toLowerCase().includes('final rate') || 
      f.label?.toLowerCase().includes('rate with commission')
    );
    return parseFloat(rateField?.value || contract.finalRate?.toString() || '0');
  };

  const getBaseRate = (): number => {
    const baseField = contract.fields?.find(f => 
      f.label?.toLowerCase().includes('base rate')
    );
    return parseFloat(baseField?.value || contract.baseRate?.toString() || '0');
  };

  const finalRate = getFinalRate();
  const baseRate = getBaseRate();

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-blue-600" />
            {contract.templateName}
          </h3>
          <p className="text-gray-600 mt-1">{contract.terms}</p>
        </div>
        <StatusBadge status={contract.status} showIcon />
      </div>

      {/* Commission Structure */}
      <div className="bg-blue-50 rounded-lg p-4 mb-4">
        <h4 className="font-medium text-blue-900 mb-2 flex items-center">
          <Percent className="w-4 h-4 mr-1" />
          Commission Structure
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-blue-700">Base Rate:</span>
            <span className="ml-2 font-medium">{formatCurrency(baseRate)}/night</span>
          </div>
          <div>
            <span className="text-blue-700">Commission:</span>
            <span className="ml-2 font-medium">{contract.commissionPercentage}%</span>
          </div>
          <div>
            <span className="text-blue-700">Final Rate:</span>
            <span className="ml-2 font-medium">{formatCurrency(finalRate)}/night</span>
          </div>
          <div>
            <span className="text-blue-700">Commission Amount:</span>
            <span className="ml-2 font-medium">{formatCurrency(finalRate - baseRate)}/night</span>
          </div>
        </div>
      </div>

      {/* Contract Timeline */}
      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
        <span className="flex items-center">
          <Calendar className="w-4 h-4 mr-1" />
          Sent: {formatDate(contract.sentAt)}
        </span>
        {contract.agreedAt && (
          <span className="text-green-600">
            Agreed: {formatDate(contract.agreedAt)}
          </span>
        )}
        {contract.disagreedAt && (
          <span className="text-red-600">
            Disagreed: {formatDate(contract.disagreedAt)}
          </span>
        )}
      </div>

      {/* Disagreement Reason */}
      {contract.status === 'disagreed' && contract.disagreementReason && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-800">
            <strong>Disagreement Reason:</strong> {contract.disagreementReason}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      {showActions && contract.status === 'sent' && (
        <div className="flex space-x-3">
          {onViewPDF && (
            <button
              onClick={() => onViewPDF(contract)}
              className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>View PDF</span>
            </button>
          )}
          {onReview && (
            <button
              onClick={() => onReview(contract)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Review Contract
            </button>
          )}
          {onSign && (
            <button
              onClick={() => onSign(contract)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Sign Contract
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ContractCard;