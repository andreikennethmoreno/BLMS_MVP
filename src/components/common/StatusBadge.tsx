/**
 * Status Badge Component
 * 
 * Reusable component for displaying status with consistent styling.
 * Automatically applies appropriate colors and icons based on status value.
 * 
 * Usage:
 * <StatusBadge status="approved" />
 * <StatusBadge status="pending_review" showIcon />
 */

import React from 'react';
import { getStatusColor, getStatusIcon, formatStatusText } from '../../utils/statusHelpers';

interface StatusBadgeProps {
  status: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  showIcon = false, 
  size = 'md',
  className = '' 
}) => {
  const Icon = getStatusIcon(status);
  const colorClasses = getStatusColor(status);
  const statusText = formatStatusText(status);

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <span 
      className={`inline-flex items-center space-x-1 rounded-full font-medium ${colorClasses} ${sizeClasses[size]} ${className}`}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      <span>{statusText}</span>
    </span>
  );
};

export default StatusBadge;