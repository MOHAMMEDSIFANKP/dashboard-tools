// src/components/ReusableChartDrawer.tsx
import React, { ReactNode } from 'react';
import { X } from 'lucide-react';

// Generic drill-down state interface
export interface DrillDownState {
  active: boolean;
  chartType: string;
  category: string;
  title: string;
  dataType?: string;
}

// Props for the reusable drawer
interface ReusableChartDrawerProps {
  isOpen: boolean;
  drillDownState?: DrillDownState;
  onBack?: () => void;
  onClose?: () => void;
  isLoading?: boolean;
  children?: ReactNode; // This will contain the actual chart component
  showBackButton?: boolean;
  showCloseButton?: boolean;
  maxHeight?: string;
  className?: string;
}

export default function ReusableChartDrawer({
  isOpen,
  drillDownState,
  onBack,
  onClose,
  isLoading = false,
  children,
  showBackButton = true,
  showCloseButton = true,
  maxHeight = '85vh',
  className = ''
}: ReusableChartDrawerProps) {
  console.log('ReusableChartDrawer rendered with state:', drillDownState);
  
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else if (onBack) {
      onBack();
    }
  };

  const handleBackClick = () => {
    if (onBack) onBack();
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-opacity-30 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={handleClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        } ${className}`}
      >
        <div 
          className="bg-white rounded-t-3xl shadow-2xl overflow-hidden"
          style={{ maxHeight }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              {showBackButton && onBack && (
                <button
                  onClick={handleBackClick}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                  title="Back to charts"
                >
                  <span className="text-lg">↩</span>
                </button>
              )}
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  {drillDownState?.title || 'Chart Details'}
                </h2>
                {drillDownState?.category && (
                  <p className="text-sm text-gray-500">
                    Category: {drillDownState.category}
                  </p>
                )}
              </div>
            </div>
            
            {showCloseButton && (
              <button
                onClick={handleClose}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                title="Close"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            )}
          </div>

          {/* Content */}
          <div 
            className="px-6 py-4 overflow-y-auto"
            style={{ maxHeight: `calc(${maxHeight} - 120px)` }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600">Loading drill-down data...</span>
              </div>
            ) : children ? (
              <div className="space-y-4">
                {/* Chart Info */}
                {drillDownState && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">
                          <strong>Chart Type:</strong> {drillDownState.chartType}
                        </p>
                      </div>
                      {drillDownState.dataType && (
                        <div>
                          <p className="text-sm text-gray-600">
                            <strong>Data Type:</strong> {drillDownState.dataType}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Chart Container */}
                    <div className="bg-white rounded-lg p-4 min-h-[300px]">
                      {children}
                    </div>
                  </div>
                )}
                
                <div className="text-center">
                  <p className="text-sm text-gray-500 italic">
                    Click any data point for further drill-down, or use the back button to return
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="text-4xl text-gray-300 mb-4">📊</div>
                  <p className="text-gray-500">No drill-down data available</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Hook for managing drawer state (optional utility)
export function useChartDrawer() {
  const [drillDownState, setDrillDownState] = React.useState<DrillDownState>({
    active: false,
    chartType: '',
    category: '',
    title: ''
  });

  const openDrawer = (state: Omit<DrillDownState, 'active'>) => {
    setDrillDownState({
      ...state,
      active: true
    });
  };

  const closeDrawer = () => {
    setDrillDownState({
      active: false,
      chartType: '',
      category: '',
      title: ''
    });
  };

  return {
    drillDownState,
    openDrawer,
    closeDrawer,
    isOpen: drillDownState.active
  };
}