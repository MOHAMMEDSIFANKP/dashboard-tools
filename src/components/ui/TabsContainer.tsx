
import React, { useState } from 'react';
import { BarChart3, Table, Info, Move3D } from 'lucide-react';

export type TabOption = 'charts' | 'table' | 'tool-test-info' | 'drag-and-drop';

type TabsContainerProps = {
  selectedTab: TabOption;
  setSelectedTab: React.Dispatch<React.SetStateAction<TabOption>>;
};

export const TabsContainer = ({ selectedTab, setSelectedTab }: TabsContainerProps) => {
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const items = [
    { 
      id: 'tool-test-info', 
      label: 'Tool / Test Info', 
      icon: Info,
      gradient: 'from-blue-500 to-cyan-500',
      hoverBg: 'hover:bg-blue-50',
      activeBg: 'bg-blue-50',
      activeText: 'text-blue-600',
      activeBorder: 'border-blue-500'
    },
    { 
      id: 'charts', 
      label: 'Dashboard', 
      icon: BarChart3,
      gradient: 'from-emerald-500 to-teal-500',
      hoverBg: 'hover:bg-emerald-50',
      activeBg: 'bg-emerald-50',
      activeText: 'text-emerald-600',
      activeBorder: 'border-emerald-500'
    },
    { 
      id: 'table', 
      label: 'Table', 
      icon: Table,
      gradient: 'from-purple-500 to-indigo-500',
      hoverBg: 'hover:bg-purple-50',
      activeBg: 'bg-purple-50',
      activeText: 'text-purple-600',
      activeBorder: 'border-purple-500'
    },
    { 
      id: 'drag-and-drop', 
      label: 'Drag & Drop', 
      icon: Move3D,
      gradient: 'from-orange-500 to-red-500',
      hoverBg: 'hover:bg-orange-50',
      activeBg: 'bg-orange-50',
      activeText: 'text-orange-600',
      activeBorder: 'border-orange-500'
    },
  ];

  return (
    <div className="relative bg-white mx-4 my-6 rounded-2xl shadow-lg shadow-gray-100/50 border border-gray-100 overflow-hidden">
      {/* Background gradient decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-50/50 via-white to-gray-50/50"></div>
      
      <div className="relative px-6 py-4">
        <div className="flex items-center justify-center space-x-2">
          {items.map((item, index) => {
            const Icon = item.icon;
            const isActive = item.id === selectedTab;
            const isHovered = hoveredTab === item.id;
            
            return (
              <div key={item.id} className="relative">
                <button
                  onClick={() => setSelectedTab(item.id as TabOption)}
                  onMouseEnter={() => setHoveredTab(item.id)}
                  onMouseLeave={() => setHoveredTab(null)}
                  className={`
                    relative flex items-center space-x-3 px-6 py-3 rounded-xl font-medium text-sm
                    transition-all duration-500 ease-out transform
                    ${isActive 
                      ? `${item.activeBg} ${item.activeText} shadow-lg shadow-gray-200/50 scale-105 translate-y-0` 
                      : `text-gray-600 ${item.hoverBg} hover:text-gray-800 hover:shadow-md hover:shadow-gray-100/50 hover:scale-102 hover:-translate-y-0.5`
                    }
                    ${isHovered && !isActive ? 'transform scale-102 -translate-y-0.5' : ''}
                  `}
                >
                  {/* Icon container with gradient background */}
                  <div className={`
                    relative flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-500
                    ${isActive 
                      ? `bg-gradient-to-br ${item.gradient} shadow-lg` 
                      : `bg-gray-100 ${isHovered ? 'bg-gray-200' : ''}`
                    }
                  `}>
                    <Icon 
                      size={16} 
                      className={`
                        transition-all duration-500 transform
                        ${isActive 
                          ? 'text-white scale-110' 
                          : `text-gray-500 ${isHovered ? 'text-gray-700 scale-105' : ''}`
                        }
                      `} 
                    />
                  </div>

                  {/* Label */}
                  <span className={`
                    transition-all duration-300 transform
                    ${isActive ? 'font-semibold' : 'font-medium'}
                    ${isHovered && !isActive ? 'translate-x-0.5' : ''}
                  `}>
                    {item.label}
                  </span>
                  {/* Hover glow effect */}
                  {isHovered && !isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-xl opacity-50"></div>
                  )}
                </button>    
              </div>
            );
          })}
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
      </div>

      {/* Decorative corner elements */}
      <div className="absolute top-2 left-2 w-2 h-2 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full opacity-30"></div>
      <div className="absolute bottom-2 right-2 w-2 h-2 bg-gradient-to-br from-emerald-200 to-cyan-200 rounded-full opacity-30"></div>
    </div>
  );
};
