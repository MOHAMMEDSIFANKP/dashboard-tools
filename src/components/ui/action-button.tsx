

import React from 'react';
import { RotateCcw, Plus, RefreshCcw } from 'lucide-react';

// Enhanced ActionButton Component
export const ActionButton: React.FC<{
  onClick: () => void;
  className: string;
  disabled?: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
}> = ({ onClick, className, disabled = false, children, icon }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      group relative overflow-hidden shadow-lg hover:shadow-xl w-full md:w-auto text-[14px] md:text-[16px] px-6 py-3 rounded-xl text-white font-medium
      transform transition-all duration-300 ease-out
      hover:scale-100 hover:-translate-y-0.5
      disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg
      active:scale-95 active:duration-75
      cursor-pointer
      ${className}
    `}
  >
    {/* Gradient overlay for hover effect */}
    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    
    {/* Ring effect */}
    <div className="absolute inset-0 rounded-xl ring-0 group-hover:ring-2 group-hover:ring-white/30 transition-all duration-300"></div>
    
    {/* Button content */}
    <div className="relative flex items-center justify-center space-x-2">
      {icon && (
        <span className="transition-transform duration-300 group-hover:scale-110">
          {icon}
        </span>
      )}
      <span className="transition-all duration-300 group-hover:tracking-wide">
        {children}
      </span>
    </div>
    
    {/* Shimmer effect */}
    <div className="absolute inset-0 -top-2 -left-2 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity duration-500 skew-x-12 w-8 h-full"></div>
  </button>
);


interface DashboardActionButtonComponentProps {
  isLoading: boolean;
  handleResetGroup: () => void;
  handleOpenModal: () => void;
  fetchAllChartDataHandle: () => void;
}

export const DashboardActionButtonComponent: React.FC<DashboardActionButtonComponentProps> = ({
  isLoading,
  handleResetGroup,
  handleOpenModal,
  fetchAllChartDataHandle,
}) => {
  return (
    <div className="relative p-1 bg-gradient-to-r from-slate-100 via-white to-slate-100 rounded-2xl shadow-inner">
      {/* Background decorative elements */}
      <div className="absolute -top-2 -right-2 w-12 h-12 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-xl opacity-70"></div>
      <div className="absolute -bottom-2 -left-2 w-10 h-10 bg-gradient-to-tr from-green-400/20 to-teal-400/20 rounded-full blur-lg opacity-70"></div>

      <div className="relative flex gap-3 p-3 bg-gradient-to-r from-white/80 via-slate-50/90 to-white/80 rounded-xl backdrop-blur-sm">
        {/* Reset Group Button */}
        <ActionButton
          onClick={handleResetGroup}
          className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-red-200"
          disabled={isLoading}
          icon={<RotateCcw className="w-4 h-4" />}
        >
          Reset Group
        </ActionButton>

        {/* Create Group Button */}
        <ActionButton
          onClick={handleOpenModal}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-blue-200"
          disabled={isLoading}
          icon={<Plus className="w-4 h-4" />}
        >
          Create Group
        </ActionButton>

        {/* Refresh Data Button */}
        <ActionButton
          onClick={fetchAllChartDataHandle}
          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-green-200"
          disabled={isLoading}
          icon={
            <RefreshCcw
              className={`w-4 h-4 transition-transform duration-300 ${
                isLoading ? 'animate-spin' : 'group-hover:rotate-180'
              }`}
            />
          }
        >
          {isLoading ? 'Loading...' : 'Refresh Data'}
        </ActionButton>
      </div>
    </div>
  );
};
