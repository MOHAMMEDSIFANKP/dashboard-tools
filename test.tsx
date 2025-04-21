'use client'
import React, { useState, useEffect, useMemo } from "react";
import { AgCharts } from "ag-charts-react";
import { useFinancialData, FinancialRow } from '@/app/_providers/financial-data-provider';

export default function AgChartsPage() {
  const { financialData } = useFinancialData();
  
  return (
    <section className='p-5'>
      <h1 className='text-2xl font-bold text-center'>Financial Performance Charts</h1>
      <div className='grid grid-cols-1 gap-4'>
        <div className='bg-white p-4 rounded shadow'>
          <h2 className='text-xl font-semibold'>Monthly Financial Metrics</h2>
          <BarChartExample financialData={financialData}/>
        </div>
      </div>
    </section>
  )
}

interface BarChartExampleProps {
  financialData: FinancialRow[];
}

// Fix 1: Properly type the period parameter
const extractMonth = (periodCode: string): string => {
  if (!periodCode || periodCode.length < 6) return "";
  return periodCode.slice(4);
};

const getMonthName = (monthNum: string): string => {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  return months[parseInt(monthNum) - 1] || monthNum;
};

// Fix 2: Properly destructure props
const BarChartExample: React.FC<BarChartExampleProps> = ({ financialData }) => {
  // Fix 3: Add console logs to debug data
  useEffect(() => {
    console.log("Raw Financial Data:", financialData);
  }, [financialData]);

  // Extract available years from data
  const availableYears = useMemo(() => {
    if (!financialData || financialData.length === 0) return [];
    
    // Fix 4: Convert to string for consistent comparison
    const years = [...new Set(financialData.map(item => String(item.fiscalYear)))];
    console.log("Available Years:", years);
    return years.sort();
  }, [financialData]);
  
  // Default to most recent year or first year if available
  const [selectedYear, setSelectedYear] = useState<string | null>(null);

  // Fix 5: Initialize selectedYear when data loads
  useEffect(() => {
    if (availableYears.length > 0 && !selectedYear) {
      setSelectedYear(availableYears[availableYears.length - 1]);
    }
  }, [availableYears, selectedYear]);

  // Selected metrics to display
  const [selectedMetrics, setSelectedMetrics] = useState([
    'revenue', 
    'operatingExpenses', 
    'netProfit'
  ]);

  // Filter data by selected year
  const filteredData = useMemo(() => {
    if (!financialData || !selectedYear) {
      console.log("No data to filter");
      return [];
    }
    
    // Fix 6: Convert both to strings for comparison
    const filtered = financialData
      .filter(item => String(item.fiscalYear) === String(selectedYear))
      .map(item => ({
        ...item,
        // Add formatted month for display
        monthName: getMonthName(extractMonth(String(item.period)))
      }))
      // Sort by period to ensure chronological order
      .sort((a, b) => Number(a.period) - Number(b.period));
    
    console.log("Filtered Data:", filtered);
    return filtered;
  }, [financialData, selectedYear]);

  // Available metrics for the selector
  const availableMetrics = [
    { value: 'revenue', label: 'Revenue' },
    { value: 'otherIncome', label: 'Other Income' },
    { value: 'grossMargin', label: 'Gross Margin' },
    { value: 'operatingExpenses', label: 'Operating Expenses' },
    { value: 'operatingProfit', label: 'Operating Profit' },
    { value: 'FinancialResult', label: 'Financial Result' },
    { value: 'EarningsBeforeTax', label: 'Earnings Before Tax' },
    { value: 'nonRecurringResult', label: 'Non-Recurring Result' },
    { value: 'netProfit', label: 'Net Profit' }
  ];

  // Generate chart options
  const [options, setOptions] = useState({});

  // Fix 7: Add debug messages and improve error handling
  useEffect(() => {
    console.log("Building chart with:", {
      filteredData: filteredData.length,
      selectedMetrics,
      selectedYear
    });
    
    if (filteredData.length > 0 && selectedMetrics.length > 0) {
      try {
        // Create series for each selected metric
        const series = selectedMetrics.map(metric => {
          const metricConfig = availableMetrics.find(m => m.value === metric);
          
          // Color mapping
          const colorMap = {
            'revenue': '#4285F4',
            'otherIncome': '#FBBC05',
            'grossMargin': '#34A853',
            'operatingExpenses': '#EA4335',
            'operatingProfit': '#673AB7',
            'FinancialResult': '#FF6D00',
            'EarningsBeforeTax': '#2196F3',
            'nonRecurringResult': '#795548',
            'netProfit': '#009688'
          };

          return {
            type: "column",
            xKey: "monthName",
            yKey: metric,
            yName: metricConfig?.label || metric,
            fill: colorMap[metric] || '#999999'
          };
        });

        const newOptions = {
          // Fix 8: Add container options
          container: {
            padding: {
              top: 30,
              right: 30,
              bottom: 30,
              left: 40
            }
          },
          title: {
            text: `Financial Performance ${selectedYear}`,
          },
          subtitle: {
            text: "Monthly Financial Metrics",
          },
          data: filteredData,
          series: series,
          legend: {
            position: "bottom",
          },
          axes: [
            {
              type: "category",
              position: "bottom",
              title: {
                text: "Month",
              },
            },
            {
              type: "number",
              position: "left",
              title: {
                text: "Amount ($)",
              },
              label: {
                formatter: (params) => {
                  return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                    notation: 'compact',
                    compactDisplay: 'short'
                  }).format(params.value);
                },
              },
            },
          ],
          tooltip: {
            enabled: true
          }
        };
        
        console.log("Setting chart options:", newOptions);
        setOptions(newOptions);
      } catch (error) {
        console.error("Error setting chart options:", error);
      }
    }
  }, [filteredData, selectedMetrics, selectedYear]);

  // Handle metric selection changes
  const handleMetricChange = (event) => {
    const value = event.target.value;
    
    // Toggle the metric in the selection
    if (selectedMetrics.includes(value)) {
      setSelectedMetrics(selectedMetrics.filter(m => m !== value));
    } else {
      setSelectedMetrics([...selectedMetrics, value]);
    }
  };

  // Fix 9: Better data loading state
  if (!financialData) {
    return <div className="flex justify-center items-center h-64">Loading financial data...</div>;
  }
  
  if (financialData.length === 0) {
    return <div className="flex justify-center items-center h-64">No financial data available</div>;
  }
  
  if (availableYears.length === 0) {
    return <div className="flex justify-center items-center h-64">No fiscal years found in data</div>;
  }

  return (
    <div className="space-y-4">
      {/* Add debug info for troubleshooting */}
      <div className="text-xs text-gray-500 mb-2">
        Total records: {financialData.length}, 
        Years available: {availableYears.join(', ')}, 
        Selected year: {selectedYear}, 
        Filtered records: {filteredData.length}
      </div>
      
      <div className="flex flex-wrap gap-4 mb-4">
        {/* Year selector */}
        <div className="flex items-center">
          <label htmlFor="yearSelect" className="mr-2 font-medium">Select Year:</label>
          <select 
            id="yearSelect"
            className="border rounded px-2 py-1"
            value={selectedYear || ''}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        
        {/* Metrics selector */}
        <div className="flex-1">
          <label className="block mb-1 font-medium">Select Metrics:</label>
          <div className="flex flex-wrap gap-2">
            {availableMetrics.map(metric => (
              <label key={metric.value} className="flex items-center mr-4 cursor-pointer">
                <input
                  type="checkbox"
                  value={metric.value}
                  checked={selectedMetrics.includes(metric.value)}
                  onChange={handleMetricChange}
                  className="mr-1"
                />
                <span>{metric.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
      
      {/* Chart display with better error handling */}
      <div style={{ height: "500px", width: "100%" }}>
        {filteredData.length > 0 ? (
          <AgCharts options={options} />
        ) : (
          <div className="flex items-center justify-center h-full border bg-gray-50 text-gray-500">
            No data available for {selectedYear}
          </div>
        )}
      </div>
      
      {/* Data context info */}
      {filteredData.length > 0 && (
        <div className="mt-2 text-sm text-gray-600">
          <p>Showing data for: {selectedYear} ({filteredData.length} months)</p>
          {filteredData[0] && (
            <p>
              Financial Category: {filteredData[0].catFinancialView || 'N/A'}, 
              Accounting View: {filteredData[0].catAccountingView || 'N/A'}
            </p>
          )}
        </div>
      )}
    </div>
  );
};