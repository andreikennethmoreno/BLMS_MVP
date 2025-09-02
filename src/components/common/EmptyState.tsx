/**
 * Empty State Component
 * 
 * Reusable component for displaying empty states with consistent styling.
 * Used when lists, tables, or data collections have no items to display.
 * 
 * Features:
 * - Icon display with customizable icon
 * - Primary and secondary text
 * - Optional action button
 */

import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionButton?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionButton,
  className = ''
}) => {
  return (
    <div className={`text-center py-12 ${className}`}>
      <Icon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-500 mb-6">{description}</p>
      )}
      {actionButton && (
        <button
          onClick={actionButton.onClick}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            actionButton.variant === 'secondary'
              ? 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {actionButton.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;