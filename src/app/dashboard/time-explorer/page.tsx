'use client'
import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Calendar, ChevronDown, TrendingUp, DollarSign, BarChart3, Clock, RefreshCw, X, Eye } from 'lucide-react';
import { AgGridReact } from 'ag-grid-react';
// import 'ag-grid-community/styles/ag-grid.css';
// import 'ag-grid-community/styles/ag-theme-alpine.css';
import type { ColDef, GridReadyEvent } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

// Type definitions
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

interface OptionType {
  label: string;
  value: string | number;
}

interface CustomSelectProps {
  options?: OptionType[];
  value?: OptionType;
  onChange?: (option: OptionType) => void;
  placeholder?: string;
  className?: string;
}

// CustomSelect component
const CustomSelect: React.FC<CustomSelectProps> = ({ 
  options = [], 
  value, 
  onChange, 
  placeholder = "", 
  className = "" 
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const handleSelect = useCallback((option: OptionType) => {
    onChange?.(option);
    setIsOpen(false);
  }, [onChange]);

  const handleToggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div
        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white cursor-pointer flex items-center justify-between hover:border-blue-500 transition-colors min-h-[40px]"
        onClick={handleToggle}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>
          {value ? value.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      
      {isOpen && (
        <>
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
            {options.map((option, index) => (
              <div
                key={`${option.value}-${index}`}
                className="px-3 py-2 hover:bg-blue-50 hover:text-blue-700 cursor-pointer transition-colors"
                onClick={() => handleSelect(option)}
              >
                {option.label}
              </div>
            ))}
          </div>
          <div 
            className="fixed inset-0 z-10" 
            onClick={handleClose}
          />
        </>
      )}
    </div>
  );
};

const FinancialDataDashboard: React.FC = () => {
  const [startDate, setStartDate] = useState<Date>(new Date('2021-01-01'));
  const [endDate, setEndDate] = useState<Date>(new Date('2021-12-31'));
  const [isDatePickerOpen, setIsDatePickerOpen] = useState<boolean>(false);
  const [tempStartDate, setTempStartDate] = useState<Date>(new Date('2021-01-01'));
  const [tempEndDate, setTempEndDate] = useState<Date>(new Date('2021-12-31'));
  const gridRef = useRef<AgGridReact>(null);

  // Generate year options (from 2020 to current year + 2)
  const yearOptions = useMemo<OptionType[]>(() => {
    const currentYear = new Date().getFullYear();
    const years: OptionType[] = [];
    for (let year = 2020; year <= currentYear + 2; year++) {
      years.push({ label: year.toString(), value: year });
    }
    return years;
  }, []);

  // Generate month options
  const monthOptions: OptionType[] = [
    { label: 'January', value: 0 },
    { label: 'February', value: 1 },
    { label: 'March', value: 2 },
    { label: 'April', value: 3 },
    { label: 'May', value: 4 },
    { label: 'June', value: 5 },
    { label: 'July', value: 6 },
    { label: 'August', value: 7 },
    { label: 'September', value: 8 },
    { label: 'October', value: 9 },
    { label: 'November', value: 10 },
    { label: 'December', value: 11 },
  ];

  // Custom range presets
  const rangePresets = [
    { label: "Last Month", value: "lastMonth" },
    { label: "Same Month Last Year", value: "sameMonthLastYear" },
    { label: "Beginning of Year", value: "beginningOfYear" },
    { label: "This Quarter", value: "thisQuarter" },
    { label: "Last Quarter", value: "lastQuarter" },
    { label: "Year to Date", value: "yearToDate" },
    { label: "Full Year", value: "fullYear" },
  ];

  // Sample financial data with your structure
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
      
      return itemDate >= startDate && itemDate <= endDate;
    });
  }, [financialData, startDate, endDate]);

  // Handle preset selection
  const handlePresetSelect = useCallback((presetValue: string) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    let newStartDate: Date, newEndDate: Date;

    switch (presetValue) {
      case 'lastMonth':
        newStartDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        newEndDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'sameMonthLastYear':
        newStartDate = new Date(currentYear - 1, today.getMonth(), 1);
        newEndDate = new Date(currentYear - 1, today.getMonth() + 1, 0);
        break;
      case 'beginningOfYear':
        newStartDate = new Date(currentYear, 0, 1);
        newEndDate = today;
        break;
      case 'thisQuarter':
        const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3;
        newStartDate = new Date(currentYear, quarterStartMonth, 1);
        newEndDate = today;
        break;
      case 'lastQuarter':
        const lastQuarterMonth = Math.floor(today.getMonth() / 3) * 3 - 3;
        newStartDate = new Date(currentYear, lastQuarterMonth, 1);
        newEndDate = new Date(currentYear, lastQuarterMonth + 3, 0);
        break;
      case 'yearToDate':
        newStartDate = new Date(currentYear, 0, 1);
        newEndDate = today;
        break;
      case 'fullYear':
        newStartDate = new Date(currentYear, 0, 1);
        newEndDate = new Date(currentYear, 11, 31);
        break;
      default:
        return;
    }

    setStartDate(newStartDate);
    setEndDate(newEndDate);
    setTempStartDate(newStartDate);
    setTempEndDate(newEndDate);
    setIsDatePickerOpen(false);
  }, []);

  // Format date for display
  const formatDisplayDate = useCallback((date: Date): string => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }, []);

  // Reset date range to default
  const handleResetDates = useCallback(() => {
    const defaultStart = new Date('2021-01-01');
    const defaultEnd = new Date('2021-12-31');
    setStartDate(defaultStart);
    setEndDate(defaultEnd);
    setTempStartDate(defaultStart);
    setTempEndDate(defaultEnd);
  }, []);

  // Apply date changes
  const applyDateChanges = useCallback(() => {
    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
    setIsDatePickerOpen(false);
  }, [tempStartDate, tempEndDate]);

  // Cancel date changes
  const cancelDateChanges = useCallback(() => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setIsDatePickerOpen(false);
  }, [startDate, endDate]);

  // Handle start date change
  const handleStartDateChange = useCallback((year: number, month: number) => {
    const newDate = new Date(year, month, 1);
    setTempStartDate(newDate);
    
    // Ensure end date is not before start date
    if (newDate > tempEndDate) {
      setTempEndDate(new Date(year, month + 1, 0)); // Last day of the month
    }
  }, [tempEndDate]);

  // Handle end date change
  const handleEndDateChange = useCallback((year: number, month: number) => {
    const newDate = new Date(year, month + 1, 0); // Last day of the month
    setTempEndDate(newDate);
    
    // Ensure start date is not after end date
    if (newDate < tempStartDate) {
      setTempStartDate(new Date(year, month, 1));
    }
  }, [tempStartDate]);

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
      cellRenderer: (params:any) => formatPeriod(params.value)
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
      cellRenderer: (params:any) => formatCurrency(params.value),
      cellClass: 'font-semibold text-green-700'
    },
    {
      headerName: 'Other Income',
      field: 'otherincome',
      width: 130,
      type: 'numericColumn',
      cellRenderer: (params:any) => formatCurrency(params.value)
    },
    {
      headerName: 'Gross Margin',
      field: 'grossmargin',
      width: 130,
      type: 'numericColumn',
      cellRenderer: (params:any) => formatCurrency(params.value),
      cellClass: 'font-medium text-blue-700'
    },
    {
      headerName: 'Operating Expenses',
      field: 'operatingexpenses',
      width: 160,
      type: 'numericColumn',
      cellRenderer: (params:any) => formatCurrency(params.value),
      cellClass: 'text-red-600'
    },
    {
      headerName: 'Operating Profit',
      field: 'operatingprofit',
      width: 150,
      type: 'numericColumn',
      cellRenderer: (params:any) => formatCurrency(params.value),
      cellClass: 'font-semibold text-green-600'
    },
    {
      headerName: 'Financial Result',
      field: 'financialresult',
      width: 150,
      type: 'numericColumn',
      cellRenderer: (params:any) => {
        const value = params.value;
        const className = value >= 0 ? 'text-green-600' : 'text-red-600';
        return `<span class="${className}">${formatCurrency(value)}</span>`;
      }
    },
    {
      headerName: 'Earnings Before Tax',
      field: 'earningsbeforetax',
      width: 170,
      type: 'numericColumn',
      cellRenderer: (params:any) => formatCurrency(params.value),
      cellClass: 'font-medium'
    },
    {
      headerName: 'Non-Recurring Result',
      field: 'nonrecurringresult',
      width: 180,
      type: 'numericColumn',
      cellRenderer: (params:any) => formatCurrency(params.value)
    },
    {
      headerName: 'Net Profit',
      field: 'netprofit',
      width: 130,
      type: 'numericColumn',
      cellRenderer: (params:any) => formatCurrency(params.value),
      cellClass: 'font-bold text-green-700'
    },
  ], [formatCurrency, formatPeriod]);



  // Grid ready handler
  const onGridReady = useCallback((params: GridReadyEvent) => {
    params.api.sizeColumnsToFit();
  }, []);

  console.log(filteredData);
  

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Financial Data Dashboard</h1>
              <p className="text-gray-600">Comprehensive financial performance analytics</p>
            </div>
          </div>
        </div>

        {/* Time Navigation Controls */}
        <div className="mb-8 bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-4 mb-6">
            <Clock className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Time Range Controls</h2>
          </div>

          {/* Date Range Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Date Range</label>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Date Range Display Button */}
              <button
                onClick={() => setIsDatePickerOpen(true)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-left flex items-center justify-between hover:border-blue-500 transition-colors bg-white"
              >
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-900">
                    {formatDisplayDate(startDate)} - {formatDisplayDate(endDate)}
                  </span>
                </span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>
              
              {/* Reset Button */}
              <button
                onClick={handleResetDates}
                className="flex items-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all duration-200"
              >
                <RefreshCw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>

          {/* Date Picker Modal */}
          {isDatePickerOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-xl p-6 m-4 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Select Date Range</h3>
                  <button
                    onClick={cancelDateChanges}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Quick Presets */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Presets</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {rangePresets.map((preset) => (
                      <button
                        key={preset.value}
                        onClick={() => handlePresetSelect(preset.value)}
                        className="px-3 py-2 text-sm text-left rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors border border-gray-200"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Selection */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  {/* Start Date */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-700">Start Date</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
                        <CustomSelect
                          options={yearOptions}
                          value={yearOptions.find(y => y.value === tempStartDate.getFullYear())}
                          onChange={(option) => handleStartDateChange(option.value as number, tempStartDate.getMonth())}
                          placeholder="Select year"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Month</label>
                        <CustomSelect
                          options={monthOptions}
                          value={monthOptions.find(m => m.value === tempStartDate.getMonth())}
                          onChange={(option) => handleStartDateChange(tempStartDate.getFullYear(), option.value as number)}
                          placeholder="Select month"
                        />
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Selected: </span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDisplayDate(tempStartDate)}
                      </span>
                    </div>
                  </div>

                  {/* End Date */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-700">End Date</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
                        <CustomSelect
                          options={yearOptions}
                          value={yearOptions.find(y => y.value === tempEndDate.getFullYear())}
                          onChange={(option) => handleEndDateChange(option.value as number, tempEndDate.getMonth())}
                          placeholder="Select year"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Month</label>
                        <CustomSelect
                          options={monthOptions}
                          value={monthOptions.find(m => m.value === tempEndDate.getMonth())}
                          onChange={(option) => handleEndDateChange(tempEndDate.getFullYear(), option.value as number)}
                          placeholder="Select month"
                        />
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Selected: </span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDisplayDate(tempEndDate)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                  <button
                    onClick={cancelDateChanges}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={applyDateChanges}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Selected Date Range Display */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Current Range: {formatDisplayDate(startDate)} - {formatDisplayDate(endDate)}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                  {filteredData.length} records
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Data Display Section - AG Grid Table */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <BarChart3 className="w-5 h-5 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">Financial Data</h2>
            </div>
            <div className="text-sm text-gray-500">
              Showing {filteredData.length} records
            </div>
          </div>

          {/* AG Grid Table */}
          <div className="ag-theme-alpine w-full" style={{ height: '600px' }}>
            <AgGridReact
              ref={gridRef}
              rowData={filteredData}
              columnDefs={columnDefs}
              defaultColDef={{
                sortable: true,
                filter: true,
                resizable: true,
                flex: 1,
                minWidth: 100
              }}
              pagination={true}
              paginationPageSize={20}
              paginationPageSizeSelector={[10, 20, 50, 100]}
              animateRows={true}
              rowSelection="multiple"
              suppressRowClickSelection={true}
              onGridReady={onGridReady}
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
          </div>
        </div>
      </div>
     </div>
  );
};

export default FinancialDataDashboard;