'use client'
import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, RotateCw, X, MoveLeft, MoveRight, Check, TrendingUp, DollarSign, BarChart3, Clock, RefreshCw, Eye } from 'lucide-react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, CellValueChangedEvent } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
// import 'ag-grid-community/styles/ag-grid.css';
// import 'ag-grid-community/styles/ag-theme-alpine.css';

ModuleRegistry.registerModules([AllCommunityModule]);

// Type definitions
interface DateRange {
  start: Date;
  end: Date;
}

interface Preset {
  label: string;
  value: string;
  range: () => DateRange;
}

interface FinancialData {
  fiscalyear: number;
  period: string;
  cataccountingview: string;
  catfinancialview: string;
  revenue: number;
  otherincome: number;
  grossmargin: number;
  operatingexpenses: number;
  operatingprofit: number;
  financialresult: number;
  earningsbeforetax: number;
  nonrecurringresult: number;
  netprofit: number;
  country: string;
  continent: string;
}

// Enhanced Date Range Picker Component
const DateRangePicker: React.FC<{
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}> = ({ value, onChange, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'calendar' | 'presets' | 'quick'>('presets');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(value.start);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(value.end);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  // Generate years for dropdown (10 years before and after current)
  const yearOptions = useMemo(() => {
    const years = [];
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 10; i <= currentYear + 10; i++) {
      years.push(i);
    }
    return years;
  }, []);

  // Generate months for dropdown
  const monthOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      value: i,
      label: new Date(0, i).toLocaleString('default', { month: 'short' }),
    }));
  }, []);

  // Check if date is disabled based on min/max dates
  const isDateDisabled = useCallback((date: Date) => {
    const maxDate = new Date();
    if (date > maxDate) return true;
    return false;
  }, []);

  // Generate days for the current month view
  const daysInMonth = useMemo(() => {
    const date = new Date(currentYear, currentMonth, 1);
    const days = [];

    // Get the first day of the month
    const firstDay = date.getDay();

    // Get the last day of the previous month
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();

    // Add days from previous month
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(currentYear, currentMonth - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
        isDisabled: isDateDisabled(new Date(currentYear, currentMonth - 1, prevMonthLastDay - i)),
      });
    }

    // Add days from current month
    const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
    for (let i = 1; i <= lastDay; i++) {
      days.push({
        date: new Date(currentYear, currentMonth, i),
        isCurrentMonth: true,
        isDisabled: isDateDisabled(new Date(currentYear, currentMonth, i)),
      });
    }

    // Add days from next month to fill the grid
    const daysToAdd = 42 - days.length;
    for (let i = 1; i <= daysToAdd; i++) {
      days.push({
        date: new Date(currentYear, currentMonth + 1, i),
        isCurrentMonth: false,
        isDisabled: isDateDisabled(new Date(currentYear, currentMonth + 1, i)),
      });
    }

    return days;
  }, [currentMonth, currentYear, isDateDisabled]);

  // Check if date is in selected range
  const isInRange = useCallback((date: Date) => {
    if (!selectedStartDate || !selectedEndDate) return false;
    return date >= selectedStartDate && date <= selectedEndDate;
  }, [selectedStartDate, selectedEndDate]);

  // Check if date is in hover range (for visual feedback)
  const isInHoverRange = useCallback((date: Date) => {
    if (!selectedStartDate || !hoverDate) return false;
    return date >= (selectedStartDate < hoverDate ? selectedStartDate : hoverDate) &&
      date <= (selectedStartDate < hoverDate ? hoverDate : selectedStartDate);
  }, [selectedStartDate, hoverDate]);

  // Handle date selection
  const handleDateClick = useCallback((date: Date) => {
    if (isDateDisabled(date)) return;

    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      // First selection or new selection
      setSelectedStartDate(date);
      setSelectedEndDate(null);
    } else if (date > selectedStartDate) {
      // Second selection (end date)
      setSelectedEndDate(date);
    } else {
      // Second selection is before start date (swap them)
      setSelectedStartDate(date);
      setSelectedEndDate(selectedStartDate);
    }
  }, [selectedStartDate, selectedEndDate, isDateDisabled]);

  // Handle month/year navigation
  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  }, [currentMonth, currentYear]);

  // Apply the selected range
  const applySelection = useCallback(() => {
    if (selectedStartDate && selectedEndDate) {
      onChange({
        start: selectedStartDate,
        end: selectedEndDate,
      });
      setIsOpen(false);
    }
  }, [selectedStartDate, selectedEndDate, onChange]);

  // Reset to default range
  const resetSelection = useCallback(() => {
    setSelectedStartDate(null);
    setSelectedEndDate(null);
    onChange({ start: new Date(), end: new Date() });
    setIsOpen(false);
  }, [value]);

  // Handle preset selection
  const handlePresetSelect = useCallback((preset: Preset) => {
    const range = preset.range();
    setSelectedStartDate(range.start);
    setSelectedEndDate(range.end);
    setView('calendar');
  }, []);

  // Format date for display
  const formatDate = useCallback((date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, []);

  // Default presets with financial focus
  const defaultPresets = useMemo(() => [
    {
      label: 'This Month',
      value: 'thisMonth',
      range: () => {
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return { start, end };
      },
    },
    {
      label: 'Last Month',
      value: 'lastMonth',
      range: () => {
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const end = new Date(today.getFullYear(), today.getMonth(), 0);
        return { start, end };
      },
    },
    {
      label: 'This Quarter',
      value: 'thisQuarter',
      range: () => {
        const today = new Date();
        const quarter = Math.floor(today.getMonth() / 3);
        const start = new Date(today.getFullYear(), quarter * 3, 1);
        const end = new Date(today.getFullYear(), quarter * 3 + 3, 0);
        return { start, end };
      },
    },
    {
      label: 'Last Quarter',
      value: 'lastQuarter',
      range: () => {
        const today = new Date();
        const quarter = Math.floor(today.getMonth() / 3);
        const start = new Date(today.getFullYear(), quarter * 3 - 3, 1);
        const end = new Date(today.getFullYear(), quarter * 3, 0);
        return { start, end };
      },
    },
    {
      label: 'Year to Date',
      value: 'yearToDate',
      range: () => {
        const today = new Date();
        const start = new Date(today.getFullYear(), 0, 1);
        return { start, end: today };
      },
    },
    {
      label: 'Last Year',
      value: 'lastYear',
      range: () => {
        const today = new Date();
        const start = new Date(today.getFullYear() - 1, 0, 1);
        const end = new Date(today.getFullYear() - 1, 11, 31);
        return { start, end };
      },
    },
    {
      label: 'Same Month Last Year',
      value: 'sameMonthLastYear',
      range: () => {
        const today = new Date();
        const start = new Date(today.getFullYear() - 1, today.getMonth(), 1);
        const end = new Date(today.getFullYear() - 1, today.getMonth() + 1, 0);
        return { start, end };
      },
    },
    {
      label: 'Full Year 2021',
      value: 'fullYear2021',
      range: () => {
        const start = new Date(2021, 0, 1);
        const end = new Date(2021, 11, 31);
        return { start, end };
      },
    },
  ], []);

  // Custom Select Component
  const CustomSelect: React.FC<{
    options: { label: string; value: any }[];
    value?: { label: string; value: any };
    onChange?: (option: { label: string; value: any }) => void;
    className?: string;
  }> = ({ options, value, onChange, className = '' }) => {
    const [isSelectOpen, setIsSelectOpen] = useState(false);
    const selectRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
          setIsSelectOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    return (
      <div className={`relative ${className}`} ref={selectRef}>
        <button
          className={`cursor-pointer w-full px-3 py-2 border rounded-md text-left flex items-center justify-between transition-colors ${isSelectOpen
            ? 'border-blue-500 ring-1 ring-blue-200 bg-white'
            : 'border-gray-300 hover:border-blue-400 bg-white'
            }`}
          onClick={() => setIsSelectOpen(!isSelectOpen)}
        >
          <span className="truncate">{value?.label || 'Select'}</span>
          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isSelectOpen ? 'rotate-180' : ''}`} />
        </button>
        {isSelectOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-44 overflow-auto">
            {options.map((option) => (
              <div
                key={`${option.value}`}
                className={`px-3 py-2 cursor-pointer transition-colors flex items-center justify-between ${value?.value === option.value
                  ? 'bg-blue-50 text-blue-700'
                  : 'hover:bg-gray-50 text-gray-700'
                  }`}
                onClick={() => {
                  onChange?.(option);
                  setIsSelectOpen(false);
                }}
              >
                {option.label}
                {value?.value === option.value && <Check className="w-4 h-4 text-blue-500" />}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Helper function to check if two dates are the same day
  const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  // Effect to reset when value prop changes
  useEffect(() => {
    setSelectedStartDate(value.start);
    setSelectedEndDate(value.end);
  }, [value]);


  return (
    <div className={`relative ${className}`}>
      {/* Input Trigger */}
      <button
        className={`flex items-center gap-3 px-4 py-3 border rounded-xl transition-all duration-200 bg-white shadow-sm min-w-[280px] ${isOpen
          ? 'border-blue-500 ring-2 ring-blue-100 shadow-lg'
          : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
          }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Calendar className="w-5 h-5 text-blue-600" />
        <div className="flex-1 text-left">
          <div className="text-sm font-medium text-gray-900">
            {formatDate(value.start)} - {formatDate(value.end)}
          </div>
          <div className="text-xs text-gray-500">Click to change date range</div>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Picker Modal */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full sm:w-[700px] bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Select Date Range</h3>
              <p className="text-sm text-gray-600 mt-1">Choose your financial data time period</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-full hover:bg-white/50 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b bg-gray-50">
            {[
              { key: 'presets', label: 'Quick Select', icon: '⚡' },
              { key: 'calendar', label: 'Calendar', icon: '📅' },
              { key: 'quick', label: 'Custom', icon: '🎯' }
            ].map((tab) => (
              <button
                key={tab.key}
                className={`flex-1 py-4 px-4 text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${view === tab.key
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                onClick={() => setView(tab.key as any)}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="p-6">
            {/* Presets View */}
            {view === 'presets' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {defaultPresets.map((preset) => {
                    const isActive = selectedStartDate && selectedEndDate &&
                      isSameDay(selectedStartDate, preset.range().start) &&
                      isSameDay(selectedEndDate, preset.range().end);

                    return (
                      <button
                        key={preset.value}
                        className={`px-4 py-3 text-sm text-left rounded-xl border transition-all duration-200 flex items-center justify-between hover:scale-105 ${isActive
                          ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 shadow-md'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 text-gray-700 hover:shadow-sm'
                          }`}
                        onClick={() => handlePresetSelect(preset)}
                      >
                        <span className="font-medium">{preset.label}</span>
                        {isActive && <Check className="w-4 h-4 text-blue-500" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Calendar View */}
            {view === 'calendar' && (
              <div className="space-y-6">
                {/* Month/Year Navigation */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CustomSelect
                      options={monthOptions}
                      value={monthOptions[currentMonth]}
                      onChange={(option) => setCurrentMonth(option.value as number)}
                      className="w-32"
                    />
                    <CustomSelect
                      options={yearOptions.map(y => ({ label: y.toString(), value: y }))}
                      value={{ label: currentYear.toString(), value: currentYear }}
                      onChange={(option) => setCurrentYear(option.value as number)}
                      className="w-24"
                    />
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => navigateMonth('prev')}
                      className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-500 hover:text-gray-700" />
                    </button>
                    <button
                      onClick={() => navigateMonth('next')}
                      className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-500 hover:text-gray-700" />
                    </button>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 p-1">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                    <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
                      {day}
                    </div>
                  ))}
                  {daysInMonth.map((day, idx) => {
                    const isSelectedStart = selectedStartDate && isSameDay(day.date, selectedStartDate);
                    const isSelectedEnd = selectedEndDate && isSameDay(day.date, selectedEndDate);
                    const isInSelectedRange = isInRange(day.date);
                    const isInHoverRangeState = !selectedEndDate && hoverDate && isInHoverRange(day.date);
                    const isToday = isSameDay(day.date, new Date());
                    const isDisabled = day.isDisabled;

                    return (
                      <button
                        key={idx}
                        className={`relative h-12 rounded-lg text-sm flex items-center justify-center transition-all duration-200 font-medium
                          ${isDisabled ? 'text-gray-300 cursor-not-allowed' : ''}
                          ${!day.isCurrentMonth ? 'text-gray-400' : ''}
                          ${isToday && !isSelectedStart && !isSelectedEnd ? 'font-bold text-blue-600 bg-blue-50 ring-1 ring-blue-200' : ''}
                          ${(isSelectedStart || isSelectedEnd) ? 'bg-blue-600 text-white shadow-lg z-10 scale-110' : ''}
                          ${(isInSelectedRange || isInHoverRangeState) && !isSelectedStart && !isSelectedEnd ? 'bg-blue-100 text-blue-700' : ''}
                          ${!isDisabled && day.isCurrentMonth && !isSelectedStart && !isSelectedEnd ? 'hover:bg-gray-100 hover:scale-105' : ''}
                        `}
                        onClick={() => handleDateClick(day.date)}
                        onMouseEnter={() => !isDisabled && setHoverDate(day.date)}
                        disabled={isDisabled}
                      >
                        {day.date.getDate()}
                        {(isSelectedStart || isSelectedEnd) && (
                          <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full"></span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

           {/* Quick Select View */}
            {view === 'quick' && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-gray-700">Start Date</label>
                    <div className="flex gap-3">
                      <CustomSelect
                        options={monthOptions}
                        value={monthOptions[selectedStartDate?.getMonth() ?? new Date().getMonth()]}
                        onChange={(option) => {
                          const currentStartDate = selectedStartDate || new Date();
                          setSelectedStartDate(new Date(
                            currentStartDate.getFullYear(),
                            option.value as number,
                            1
                          ));
                        }}
                        className="flex-1"
                      />
                      <CustomSelect
                        options={yearOptions.map(y => ({ label: y.toString(), value: y }))}
                        value={{ label: (selectedStartDate?.getFullYear() || new Date().getFullYear()).toString(), value: selectedStartDate?.getFullYear() || new Date().getFullYear() }}
                        onChange={(option) => {
                          const currentStartDate = selectedStartDate || new Date();
                          setSelectedStartDate(new Date(
                            option.value as number,
                            currentStartDate.getMonth(),
                            1
                          ));
                        }}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-gray-700">End Date</label>
                    <div className="flex gap-3">
                      <CustomSelect
                        options={monthOptions}
                        value={monthOptions[selectedEndDate?.getMonth() ?? new Date().getMonth()]}
                        onChange={(option) => {
                          const currentEndDate = selectedEndDate || new Date();
                          setSelectedEndDate(new Date(
                            currentEndDate.getFullYear(),
                            option.value as number,
                            new Date(currentEndDate.getFullYear(), option.value as number + 1, 0).getDate()
                          ));
                        }}
                        className="flex-1"
                      />
                      <CustomSelect
                        options={yearOptions.map(y => ({ label: y.toString(), value: y }))}
                        value={{ label: (selectedEndDate?.getFullYear() || new Date().getFullYear()).toString(), value: selectedEndDate?.getFullYear() || new Date().getFullYear() }}
                        onChange={(option) => {
                          const currentEndDate = selectedEndDate || new Date();
                          setSelectedEndDate(new Date(
                            option.value as number,
                            currentEndDate.getMonth(),
                            new Date(option.value as number, currentEndDate.getMonth() + 1, 0).getDate()
                          ));
                        }}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-800">Selected Range:</span>
                    <span className="text-sm font-bold text-blue-900">
                      {formatDate(selectedStartDate)} - {formatDate(selectedEndDate)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between p-6 border-t bg-gray-50">
            <button
              onClick={resetSelection}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-white hover:text-gray-800 rounded-lg transition-all duration-200 border border-gray-200"
            >
              <RotateCw className="w-4 h-4" />
              Reset
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => setIsOpen(false)}
                className="px-6 py-2 text-sm text-gray-700 hover:bg-white rounded-lg transition-colors border border-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={applySelection}
                disabled={!selectedStartDate || !selectedEndDate}
                className={`px-6 py-2 text-sm text-white rounded-lg transition-all duration-200 flex items-center gap-2 shadow-lg ${!selectedStartDate || !selectedEndDate
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl'
                  }`}
              >
                <Check className="w-4 h-4" />
                Apply Selection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main Financial Dashboard Component
const FinancialDataDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date('2021-01-01'),
    end: new Date('2021-12-31')
  });

  // Sample financial data
  const financialData = useMemo<FinancialData[]>(() => [
    {
      fiscalyear: 2021,
      period: "202101",
      cataccountingview: "Immobilisations",
      catfinancialview: "Financier",
      revenue: 610569.9,
      otherincome: 33310.76,
      grossmargin: 185513.02,
      operatingexpenses: 86454.03,
      operatingprofit: 398755.69,
      financialresult: -9088.67,
      earningsbeforetax: 126296.74,
      nonrecurringresult: 10250.78,
      netprofit: 212235.32,
      country: "South Africa",
      continent: "Africa"
    },
    {
      fiscalyear: 2021,
      period: "202102",
      cataccountingview: "Immobilisations",
      catfinancialview: "Operationnel",
      revenue: 745230.5,
      otherincome: 42150.33,
      grossmargin: 225678.45,
      operatingexpenses: 98765.21,
      operatingprofit: 456789.12,
      financialresult: -12345.67,
      earningsbeforetax: 145678.90,
      nonrecurringresult: 8765.43,
      netprofit: 234567.89,
      country: "Nigeria",
      continent: "Africa"
    },
    {
      fiscalyear: 2021,
      period: "202103",
      cataccountingview: "Charges",
      catfinancialview: "Financier",
      revenue: 567890.12,
      otherincome: 28765.44,
      grossmargin: 189123.67,
      operatingexpenses: 76543.21,
      operatingprofit: 345678.90,
      financialresult: -7654.32,
      earningsbeforetax: 134567.89,
      nonrecurringresult: 9876.54,
      netprofit: 199876.54,
      country: "Kenya",
      continent: "Africa"
    },
    {
      fiscalyear: 2021,
      period: "202104",
      cataccountingview: "Produits",
      catfinancialview: "Operationnel",
      revenue: 823456.78,
      otherincome: 51234.56,
      grossmargin: 267890.12,
      operatingexpenses: 123456.78,
      operatingprofit: 512345.67,
      financialresult: -15678.90,
      earningsbeforetax: 178901.23,
      nonrecurringresult: 12345.67,
      netprofit: 289012.34,
      country: "Egypt",
      continent: "Africa"
    },
    {
      fiscalyear: 2021,
      period: "202105",
      cataccountingview: "Immobilisations",
      catfinancialview: "Financier",
      revenue: 692345.67,
      otherincome: 37890.12,
      grossmargin: 201234.56,
      operatingexpenses: 89012.34,
      operatingprofit: 423456.78,
      financialresult: -11234.56,
      earningsbeforetax: 156789.01,
      nonrecurringresult: 7890.12,
      netprofit: 245678.90,
      country: "Morocco",
      continent: "Africa"
    },
    {
      fiscalyear: 2021,
      period: "202106",
      cataccountingview: "Charges",
      catfinancialview: "Operationnel",
      revenue: 789012.34,
      otherincome: 45678.90,
      grossmargin: 234567.89,
      operatingexpenses: 101234.56,
      operatingprofit: 478901.23,
      financialresult: -13456.78,
      earningsbeforetax: 167890.12,
      nonrecurringresult: 11234.56,
      netprofit: 267890.12,
      country: "Ghana",
      continent: "Africa"
    },
    {
      fiscalyear: 2021,
      period: "202107",
      cataccountingview: "Produits",
      catfinancialview: "Financier",
      revenue: 656789.01,
      otherincome: 34567.89,
      grossmargin: 178901.23,
      operatingexpenses: 78901.23,
      operatingprofit: 389012.34,
      financialresult: -8901.23,
      earningsbeforetax: 145678.90,
      nonrecurringresult: 6789.01,
      netprofit: 223456.78,
      country: "Tunisia",
      continent: "Africa"
    },
    {
      fiscalyear: 2021,
      period: "202108",
      cataccountingview: "Immobilisations",
      catfinancialview: "Operationnel",
      revenue: 734567.89,
      otherincome: 41234.56,
      grossmargin: 212345.67,
      operatingexpenses: 95678.90,
      operatingprofit: 445678.90,
      financialresult: -12678.90,
      earningsbeforetax: 156789.01,
      nonrecurringresult: 9345.67,
      netprofit: 254321.09,
      country: "Algeria",
      continent: "Africa"
    },
    {
      fiscalyear: 2021,
      period: "202109",
      cataccountingview: "Charges",
      catfinancialview: "Financier",
      revenue: 812345.67,
      otherincome: 48901.23,
      grossmargin: 245678.90,
      operatingexpenses: 112345.67,
      operatingprofit: 501234.56,
      financialresult: -14567.89,
      earningsbeforetax: 178901.23,
      nonrecurringresult: 10890.12,
      netprofit: 287654.32,
      country: "Ethiopia",
      continent: "Africa"
    },
    {
      fiscalyear: 2021,
      period: "202110",
      cataccountingview: "Produits",
      catfinancialview: "Operationnel",
      revenue: 678901.23,
      otherincome: 36789.01,
      grossmargin: 189012.34,
      operatingexpenses: 81234.56,
      operatingprofit: 412345.67,
      financialresult: -9876.54,
      earningsbeforetax: 148901.23,
      nonrecurringresult: 7654.32,
      netprofit: 231234.56,
      country: "Uganda",
      continent: "Africa"
    },
    {
      fiscalyear: 2021,
      period: "202111",
      cataccountingview: "Immobilisations",
      catfinancialview: "Financier",
      revenue: 723456.78,
      otherincome: 39876.54,
      grossmargin: 198765.43,
      operatingexpenses: 87654.32,
      operatingprofit: 434567.89,
      financialresult: -10987.65,
      earningsbeforetax: 152345.67,
      nonrecurringresult: 8432.10,
      netprofit: 241098.76,
      country: "Tanzania",
      continent: "Africa"
    },
    {
      fiscalyear: 2021,
      period: "202112",
      cataccountingview: "Charges",
      catfinancialview: "Operationnel",
      revenue: 798765.43,
      otherincome: 43210.98,
      grossmargin: 231098.76,
      operatingexpenses: 105432.10,
      operatingprofit: 467890.12,
      financialresult: -13210.98,
      earningsbeforetax: 165432.10,
      nonrecurringresult: 9876.54,
      netprofit: 274321.09,
      country: "Zimbabwe",
      continent: "Africa"
    }
  ], []);

  // Filter data based on date range
  const filteredData = useMemo<FinancialData[]>(() => {
    return financialData.filter(item => {
      const periodYear = parseInt(item.period.substring(0, 4));
      const periodMonth = parseInt(item.period.substring(4, 6)) - 1;
      const itemDate = new Date(periodYear, periodMonth, 1);

      return itemDate >= dateRange.start && itemDate <= dateRange.end;
    });
  }, [financialData, dateRange]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalRevenue = filteredData.reduce((sum, item) => sum + item.revenue, 0);
    const totalNetProfit = filteredData.reduce((sum, item) => sum + item.netprofit, 0);
    const totalOperatingProfit = filteredData.reduce((sum, item) => sum + item.operatingprofit, 0);
    const avgGrossMargin = filteredData.length > 0
      ? filteredData.reduce((sum, item) => sum + item.grossmargin, 0) / filteredData.length
      : 0;

    return {
      totalRevenue,
      totalNetProfit,
      totalOperatingProfit,
      avgGrossMargin,
      recordCount: filteredData.length
    };
  }, [filteredData]);

  // Format currency
  const formatCurrency = useCallback((value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }, []);

  // Format period for display
  const formatPeriod = useCallback((period: string): string => {
    const year = period.substring(0, 4);
    const month = parseInt(period.substring(4, 6)) - 1;
    const date = new Date(parseInt(year), month);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    });
  }, []);

  // AG Grid column definitions
  const columnDefs = useMemo<ColDef<FinancialData>[]>(() => [
    {
      headerName: 'Fiscal Year',
      field: 'fiscalyear',
      width: 120,
      //   pinned: 'left',
      cellClass: 'font-medium'
    },
    {
      headerName: 'Period',
      field: 'period',
      width: 100,
      //   pinned: 'left',
      cellRenderer: (params: any) => formatPeriod(params.value)
    },
    {
      headerName: 'Country',
      field: 'country',
      width: 130,
      cellClass: 'font-medium'
    },
    {
      headerName: 'Continent',
      field: 'continent',
      width: 110
    },
    {
      headerName: 'Accounting View',
      field: 'cataccountingview',
      width: 150
    },
    {
      headerName: 'Financial View',
      field: 'catfinancialview',
      width: 140
    },
    {
      headerName: 'Revenue',
      field: 'revenue',
      width: 130,
      type: 'numericColumn',
      cellRenderer: (params: any) => formatCurrency(params.value),
      cellClass: 'font-semibold text-green-700'
    },
    {
      headerName: 'Other Income',
      field: 'otherincome',
      width: 130,
      type: 'numericColumn',
      cellRenderer: (params: any) => formatCurrency(params.value)
    },
    {
      headerName: 'Gross Margin',
      field: 'grossmargin',
      width: 130,
      type: 'numericColumn',
      cellRenderer: (params: any) => formatCurrency(params.value),
      cellClass: 'font-medium text-blue-700'
    },
    {
      headerName: 'Operating Expenses',
      field: 'operatingexpenses',
      width: 160,
      type: 'numericColumn',
      cellRenderer: (params: any) => formatCurrency(params.value),
      cellClass: 'text-red-600'
    },
    {
      headerName: 'Operating Profit',
      field: 'operatingprofit',
      width: 150,
      type: 'numericColumn',
      cellRenderer: (params: any) => formatCurrency(params.value),
      cellClass: 'font-semibold text-green-600'
    },
    {
      headerName: 'Financial Result',
      field: 'financialresult',
      width: 150,
      type: 'numericColumn',
      // cellRenderer: (params: any) => {
      //   const value = params.value;
      //   const className = value >= 0 ? 'text-green-600' : 'text-red-600';
      //   return `<span class="${className}">${formatCurrency(value)}</span>`;
      // }
    },
    {
      headerName: 'Earnings Before Tax',
      field: 'earningsbeforetax',
      width: 170,
      type: 'numericColumn',
      cellRenderer: (params: any) => formatCurrency(params.value),
      cellClass: 'font-medium'
    },
    {
      headerName: 'Non-Recurring Result',
      field: 'nonrecurringresult',
      width: 180,
      type: 'numericColumn',
      cellRenderer: (params: any) => formatCurrency(params.value)
    },
    {
      headerName: 'Net Profit',
      field: 'netprofit',
      width: 130,
      type: 'numericColumn',
      cellRenderer: (params: any) => formatCurrency(params.value),
      cellClass: 'font-bold text-green-700'
    },
  ], [formatCurrency, formatPeriod]);

  // AG Grid default column definition
  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    floatingFilter: true,
    flex: 1,
    minWidth: 100
  }), []);


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Financial Analytics Dashboard
                </h1>
                <p className="text-lg text-gray-600 mt-1">
                  Comprehensive financial performance insights and analytics
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Last Updated</div>
              <div className="text-lg font-semibold text-gray-900">
                {new Date().toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
            </div>
          </div>

          {/* Date Range Picker */}
          <div className="flex items-center gap-4">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Time Period:</span>
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              className="flex-1 max-w-md"
            />
          </div>
        </div>

        {/* Summary Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: 'Total Revenue',
              value: formatCurrency(summaryStats.totalRevenue),
              icon: DollarSign,
              color: 'from-green-500 to-emerald-600',
              bgColor: 'from-green-50 to-emerald-50'
            },
            {
              title: 'Net Profit',
              value: formatCurrency(summaryStats.totalNetProfit),
              icon: TrendingUp,
              color: 'from-blue-500 to-blue-600',
              bgColor: 'from-blue-50 to-blue-50'
            },
            {
              title: 'Operating Profit',
              value: formatCurrency(summaryStats.totalOperatingProfit),
              icon: BarChart3,
              color: 'from-purple-500 to-purple-600',
              bgColor: 'from-purple-50 to-purple-50'
            },
            {
              title: 'Avg Gross Margin',
              value: formatCurrency(summaryStats.avgGrossMargin),
              icon: Eye,
              color: 'from-orange-500 to-orange-600',
              bgColor: 'from-orange-50 to-orange-50'
            }
          ].map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center mb-4 shadow-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Data Table Section */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">Financial Data Records</h2>
              </div>
              <div className="flex items-center gap-4">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                  {summaryStats.recordCount} records
                </span>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-md">
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="ag-theme-alpine" style={{ height: '600px', width: '100%' }}>
            {filteredData.length > 0 ? (
              <AgGridReact
                rowData={filteredData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                pagination={true}
                paginationPageSizeSelector={[10, 20, 50, 100]}
                animateRows={true}
                rowSelection="multiple"
                suppressRowClickSelection={true}
                suppressCellFocus={true}
                className="ag-grid-custom"
                headerHeight={50}
                rowHeight={45}
                suppressHorizontalScroll={false}
                overlayNoRowsTemplate={`
                <div class="flex flex-col items-center justify-center py-12">
                  <svg class="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  <p class="text-gray-500">No data available for the selected date range</p>
                </div>
              `}
                gridOptions={{
                  headerHeight: 50,
                  rowHeight: 50,
                  suppressMenuHide: true,
                  enableCellTextSelection: true,
                  ensureDomOrder: true
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <BarChart3 className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
                <p className="text-gray-500 text-center max-w-md">
                  No financial records found for the selected date range. Try adjusting your time period or check your data source.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialDataDashboard;