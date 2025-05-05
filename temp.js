// // hooks/useDuckDB.js
// 'use client';
// import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
// import * as duckdb from '@duckdb/duckdb-wasm';
// import Papa from 'papaparse';

// const instantiateDuckDB = async () => {
//   const CDN_BUNDLES = duckdb.getJsDelivrBundles();
//   const bundle = await duckdb.selectBundle(CDN_BUNDLES);

//   const worker_url = URL.createObjectURL(
//     new Blob([`importScripts("${bundle.mainWorker}");`], {
//       type: "text/javascript",
//     })
//   );

//   const worker = new Worker(worker_url);
//   const logger = new duckdb.ConsoleLogger("INFO");
//   const db = new duckdb.AsyncDuckDB(logger, worker);
//   await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
//   URL.revokeObjectURL(worker_url);
//   return db;
// };

// export function useDuckDB() {
//   const dbRef = useRef(null);
//   const connRef = useRef(null);

//   const [isReady, setIsReady] = useState(false);
//   const [error, setError] = useState(null);
//   const [columns, setColumns] = useState([]);

//   const initDuckDB = useCallback(async () => {
//     try {
//       const db = await instantiateDuckDB();
//       dbRef.current = db;

//       const conn = await db.connect();
//       connRef.current = conn;

//       return conn;
//     } catch (err) {
//       console.error("DuckDB init failed:", err);
//       setError(err.message);
//       return null;
//     }
//   }, []);

//   const loadCSV = useCallback(async (conn) => {
//     try {
//       const res = await fetch('/files/dataset_elphi_finance_YYYYMM.csv');
//       const csv = await res.text();

//       return new Promise((resolve, reject) => {
//         Papa.parse(csv, {
//           delimiter: ";",
//           header: true,
//           skipEmptyLines: true,
//           dynamicTyping: true,
//           complete: async ({ data }) => {
//             if (!data.length) {
//               return reject(new Error("No data in CSV"));
//             }

//             const cols = Object.keys(data[0]);
//             const types = cols.map(col => {
//               const isNum = data.slice(0, 10).every(row => !isNaN(parseFloat(row[col])));
//               return `${col} ${isNum ? 'DOUBLE' : 'VARCHAR'}`;
//             });

//             await conn.query(`DROP TABLE IF EXISTS financial_data`);
//             await conn.query(`CREATE TABLE financial_data (${types.join(', ')})`);

//             const batchSize = 100;
//             for (let i = 0; i < data.length; i += batchSize) {
//               const batch = data.slice(i, i + batchSize);
//               const rows = batch.map(row => 
//                 `(${cols.map(col => {
//                   const val = row[col];
//                   return val == null || val === '' ? 'NULL' : (isNaN(val) ? `'${String(val).replace(/'/g, "''")}'` : val);
//                 }).join(', ')})`
//               ).join(', ');

//               await conn.query(`INSERT INTO financial_data VALUES ${rows}`);
//             }

//             setColumns(cols.map(c => ({ field: c })));
//             resolve();
//           },
//           error: err => reject(err),
//         });
//       });

//     } catch (err) {
//       console.error("CSV Load Failed:", err);
//       throw err;
//     }
//   }, []);

//   useEffect(() => {
//     let isMounted = true;

//     (async () => {
//       const conn = await initDuckDB();
//       if (conn && isMounted) {
//         try {
//           await loadCSV(conn);
//           if (isMounted) setIsReady(true);
//         } catch (err) {
//           if (isMounted) setError(err.message);
//         }
//       }
//     })();

//     return () => {
//       isMounted = false;
//       connRef.current?.close();
//       dbRef.current?.terminate();
//     };
//   }, [initDuckDB, loadCSV]);

//   const executeQuery = useCallback(async (sql) => {
//     try {
//       const result = await connRef.current.query(sql);
//       return {
//         data: result.toArray(),
//         columnNames: result.schema.fields.map(f => f.name),
//         success: true
//       };
//     } catch (err) {
//       return { error: err.message, success: false };
//     }
//   }, []);

//   const getAvailableYears = useCallback(async () => {
//     try {
//       const res = await connRef.current.query(`SELECT DISTINCT "fiscalYear" FROM financial_data ORDER BY "fiscalYear"`);
//       return { data: res.toArray().map(r => r[0]), success: true };
//     } catch (err) {
//       return { error: err.message, success: false };
//     }
//   }, []);

//   return {
//     executeQuery,
//     getAvailableYears,
//     isLoading: !isReady,
//     isDataLoaded: isReady,
//     error,
//     columns
//   };
// }

"use client";
import React, { useState, useEffect, useRef } from "react";
import { AgCharts } from "ag-charts-react";
import { useDuckDBContext } from "../_providers/DuckDBContext";
import { AgChartOptions } from "ag-charts-community";

// Core data types
interface ChartDataPoint {
  period?: string;
  revenue?: number;
  expenses?: number;
  grossMargin?: number;
  netProfit?: number;
  catAccountingView?: string;
  label?: string;
  value?: number;
  country?: string;
  region?: string;
  [key: string]: any;
}

// Common props for components
interface CommonProps {
  title: string;
  data?: any[];
  onDrillDown?: (type: string, category: string, value: any, dataType: string) => void;
}

// Drill-down state interface
interface DrillDownState {
  active: boolean;
  chartType: string;
  category: string;
  title: string;
}

// Group definition interface
interface GroupDefinition {
  name: string;
  members: string[];
}

// Chart container component
const ChartContainer: React.FC<CommonProps & {
  children: React.ReactNode;
  isDrilled?: boolean;
  onBack?: () => void;
}> = ({ title, children, data, isDrilled, onBack }) => {
  const chartRef = useRef<HTMLDivElement>(null);

  // Export to CSV function
  const exportToCSV = () => {
    if (!data || !data.length) return;
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `chart_data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PNG export function
  const exportToPNG = () => {
    const chartElement = chartRef.current;
    if (!chartElement) return;
    
    const canvas = chartElement.querySelector('canvas');
    
    if (canvas) {
      try {
        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'chart.png';
        link.href = image;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.error("Failed to export chart:", err);
        alert("Could not export chart as PNG. Please try again.");
      }
    } else {
      alert("Chart is not ready for export. Please try again.");
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold">{title}</h2>
          {isDrilled && (
            <button
              onClick={onBack}
              className="ml-3 px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
            >
              ↩ Back
            </button>
          )}
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={exportToPNG}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          >
            PNG
          </button>
          <button 
            onClick={exportToCSV}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          >
            CSV
          </button>
        </div>
      </div>
      <div ref={chartRef}>
        {children}
      </div>
    </div>
  );
};

// Filter bar component enhanced with grouping
const FilterBar: React.FC<{
  years: string[];
  selectedYear: string;
  onYearChange: (year: string) => void;
  onResetDrillDown?: () => void;
  isDrilled: boolean;
  onOpenGroupModal: () => void;
}> = ({ years, selectedYear, onYearChange, onResetDrillDown, isDrilled, onOpenGroupModal }) => (
  <div className="mb-6 flex items-center flex-wrap gap-2">
    <label className="mr-2 font-medium">Year:</label>
    <select
      value={selectedYear}
      onChange={(e) => onYearChange(e.target.value)}
      className="border border-gray-300 rounded px-3 py-2"
    >
      <option value="all">All Years</option>
      {years.map((year) => (
        <option key={year} value={year}>
          {year}
        </option>
      ))}
    </select>
    
    {isDrilled && (
      <button
        onClick={onResetDrillDown}
        className="px-3 py-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
      >
        Reset Drill Down
      </button>
    )}
    
    <button
      onClick={onOpenGroupModal}
      className="ml-auto px-3 py-2 bg-green-100 text-green-600 rounded hover:bg-green-200"
    >
      Create Group
    </button>
  </div>
);

// Group creation modal component
const GroupModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  dimensions: { dimension: string; values: string[] }[];
  onCreateGroup: (dimension: string, groupName: string, members: string[]) => void;
}> = ({ isOpen, onClose, dimensions, onCreateGroup }) => {
  const [selectedDimension, setSelectedDimension] = useState<string>("");
  const [groupName, setGroupName] = useState<string>("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  
  useEffect(() => {
    if (dimensions.length > 0 && !selectedDimension) {
      setSelectedDimension(dimensions[0].dimension);
    }
  }, [dimensions, selectedDimension]);
  
  const handleDimensionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDimension(e.target.value);
    setSelectedMembers([]);
  };
  
  const handleMemberToggle = (member: string) => {
    if (selectedMembers.includes(member)) {
      setSelectedMembers(selectedMembers.filter(m => m !== member));
    } else {
      setSelectedMembers([...selectedMembers, member]);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (groupName && selectedDimension && selectedMembers.length > 0) {
      onCreateGroup(selectedDimension, groupName, selectedMembers);
      setGroupName("");
      setSelectedMembers([]);
      onClose();
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Create Dimension Group</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Select Dimension</label>
            <select
              value={selectedDimension}
              onChange={handleDimensionChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              {dimensions.map(dim => (
                <option key={dim.dimension} value={dim.dimension}>
                  {dim.dimension}
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Group Name</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="Enter group name"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Select Members</label>
            <div className="border border-gray-300 rounded p-2 max-h-40 overflow-y-auto">
              {selectedDimension && dimensions.find(d => d.dimension === selectedDimension)?.values.map(value => (
                <div key={value} className="flex items-center mb-1">
                  <input
                    type="checkbox"
                    id={`member-${value}`}
                    checked={selectedMembers.includes(value)}
                    onChange={() => handleMemberToggle(value)}
                    className="mr-2"
                  />
                  <label htmlFor={`member-${value}`}>{value}</label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              disabled={!groupName || selectedMembers.length === 0}
            >
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Separated Drill Down Component
const DrillDownChart: React.FC<{
  drillDownState: DrillDownState;
  drillDownData: any[];
  drillDownOptions: AgChartOptions | null;
  onBack: () => void;
}> = ({ drillDownState, drillDownData, drillDownOptions, onBack }) => {
  return (
    <div className="mb-4">
      <ChartContainer 
        title={drillDownState.title} 
        data={drillDownData}
        onBack={onBack}
        isDrilled={true}
      >
        {drillDownOptions && <AgCharts options={drillDownOptions} />}
      </ChartContainer>
      <p className="mt-2 text-sm text-gray-500">
        <i>Click any data point for further drill-down, or use the back button to return</i>
      </p>
    </div>
  );
};

// Group management component
const GroupManagement: React.FC<{
  groups: Record<string, GroupDefinition[]>;
  onDeleteGroup: (dimension: string, groupName: string) => void;
}> = ({ groups, onDeleteGroup }) => {
  if (Object.keys(groups).length === 0) return null;
  
  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium mb-2">Active Groups</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {Object.entries(groups).map(([dimension, dimensionGroups]) => (
          dimensionGroups.length > 0 && (
            <div key={dimension} className="border rounded-md p-3 bg-gray-50">
              <h4 className="font-medium text-gray-700">{dimension}</h4>
              <ul className="mt-2">
                {dimensionGroups.map(group => (
                  <li key={group.name} className="flex justify-between items-center mb-1">
                    <div>
                      <span className="text-sm font-medium">{group.name}</span>
                      <span className="text-xs text-gray-500 ml-1">({group.members.length} members)</span>
                    </div>
                    <button
                      onClick={() => onDeleteGroup(dimension, group.name)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )
        ))}
      </div>
    </div>
  );
};

// Main AG Charts Page Component
const AgChartsPage: React.FC = () => {
  const { executeQuery, isDataLoaded } = useDuckDBContext();
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [years, setYears] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState<boolean>(false);
  
  // Available dimensions for grouping
  const [dimensions, setDimensions] = useState<{ dimension: string; values: string[] }[]>([]);
  
  // Groups state - stores created dimension groups
  const [groups, setGroups] = useState<Record<string, GroupDefinition[]>>({});

  // Drill down state
  const [drillDown, setDrillDown] = useState<DrillDownState>({
    active: false,
    chartType: "",
    category: "",
    title: ""
  });

  // Chart data states
  const [chartData, setChartData] = useState<{
    line: ChartDataPoint[],
    bar: ChartDataPoint[],
    pie: ChartDataPoint[],
    donut: ChartDataPoint[],
    drillDown: any[]
  }>({
    line: [],
    bar: [],
    pie: [],
    donut: [],
    drillDown: []
  });

  // Chart options states
  const [chartOptions, setChartOptions] = useState<{
    line: AgChartOptions | null,
    bar: AgChartOptions | null,
    pie: AgChartOptions | null,
    donut: AgChartOptions | null,
    drillDown: AgChartOptions | null
  }>({
    line: null,
    bar: null,
    pie: null,
    donut: null,
    drillDown: null
  });

  // Reset drill down
  const resetDrillDown = () => {
    setDrillDown({
      active: false,
      chartType: "",
      category: "",
      title: ""
    });
  };

  // Fetch dimensions for grouping
  useEffect(() => {
    if (!isDataLoaded) return;
    
    const fetchDimensions = async () => {
      try {
        const [countryResult, catAccountingResult, catFinancialResult, regionResult] = await Promise.all([
          executeQuery("SELECT DISTINCT country FROM financial_data ORDER BY country"),
          executeQuery("SELECT DISTINCT catAccountingView FROM financial_data ORDER BY catAccountingView"),
          executeQuery("SELECT DISTINCT catFinancialView FROM financial_data ORDER BY catFinancialView"),
          executeQuery("SELECT DISTINCT region FROM financial_data ORDER BY region")
        ]);
        
        const dimensionsData = [];
        
        if (countryResult.success && countryResult.data && countryResult.data.length > 0) {
          dimensionsData.push({
            dimension: "country",
            values: countryResult.data.map((row: { country: string }) => row.country)
          });
        }
        
        if (catAccountingResult.success && catAccountingResult.data && catAccountingResult.data.length > 0) {
          dimensionsData.push({
            dimension: "catAccountingView",
            values: catAccountingResult.data.map((row: { catAccountingView: string }) => row.catAccountingView)
          });
        }
        
        if (catFinancialResult.success && catFinancialResult.data && catFinancialResult.data.length > 0) {
          dimensionsData.push({
            dimension: "catFinancialView",
            values: catFinancialResult.data.map((row: { catFinancialView: string }) => row.catFinancialView)
          });
        }
        
        if (regionResult.success && regionResult.data && regionResult.data.length > 0) {
          dimensionsData.push({
            dimension: "region",
            values: regionResult.data.map((row: { region: string }) => row.region)
          });
        }
        
        setDimensions(dimensionsData);
        
        // Initialize empty groups for each dimension
        const initialGroups: Record<string, GroupDefinition[]> = {};
        dimensionsData.forEach(dim => {
          initialGroups[dim.dimension] = [];
        });
        setGroups(initialGroups);
        
      } catch (err) {
        console.error("Failed to fetch dimensions:", err);
      }
    };
    
    fetchDimensions();
  }, [isDataLoaded, executeQuery]);

  // Fetch years for year filter
  useEffect(() => {
    if (!isDataLoaded) return;

    const fetchYears = async () => {
      try {
        const result = await executeQuery("SELECT DISTINCT fiscalYear FROM financial_data ORDER BY fiscalYear");
        if (result.success && result.data) {
          setYears(result.data.map((row: { fiscalYear: string }) => row.fiscalYear));
        }
      } catch (err) {
        console.error("Failed to fetch years:", err);
        setError("Failed to load year data");
      }
    };

    fetchYears();
  }, [isDataLoaded, executeQuery]);

  // Function to apply group transformations to data
  const applyGroupTransformations = (data: any[], dimension: string): any[] => {
    if (!data || data.length === 0 || !groups[dimension] || groups[dimension].length === 0) {
      return data;
    }
    
    return data.map(item => {
      const itemCopy = { ...item };
      const dimensionGroups = groups[dimension];
      
      for (const group of dimensionGroups) {
        if (group.members.includes(item[dimension])) {
          itemCopy[dimension] = group.name;
          break;
        }
      }
      
      return itemCopy;
    });
  };
  
  // Function to combine data by group
  const combineDataByGroup = (data: any[], dimension: string): any[] => {
    if (!data || data.length === 0) return data;
    
    const groupedData: Record<string, any> = {};
    
    data.forEach(item => {
      const key = item[dimension];
      if (!groupedData[key]) {
        groupedData[key] = { ...item };
      } else {
        // Sum numeric values
        Object.keys(item).forEach(prop => {
          if (typeof item[prop] === 'number') {
            groupedData[key][prop] = (groupedData[key][prop] || 0) + item[prop];
          }
        });
      }
    });
    
    return Object.values(groupedData);
  };

  // Main data fetching effect
  useEffect(() => {
    if (!isDataLoaded) return;

    const fetchChartData = async () => {
      setIsLoading(true);
      setError(null);
      const whereClause = selectedYear !== "all" ? `WHERE fiscalYear = '${selectedYear}'` : "";

      try {
        const [lineResult, barResult, pieResult, donutResult] = await Promise.all([
          executeQuery(`SELECT period, AVG(revenue) as revenue, AVG(grossMargin) as grossMargin, AVG(netProfit) as netProfit FROM financial_data ${whereClause} GROUP BY period ORDER BY period`),
          executeQuery(`SELECT period, SUM(revenue) as revenue, SUM(operatingExpenses) as expenses FROM financial_data ${whereClause} GROUP BY period ORDER BY period`),
          executeQuery(`SELECT SUM(grossMargin) as grossMargin, SUM(operatingExpenses) as operatingExpenses, SUM(netProfit) as netProfit, SUM(revenue) as revenue FROM financial_data ${whereClause}`),
          executeQuery(`SELECT catAccountingView, SUM(revenue) as revenue FROM financial_data ${whereClause} GROUP BY catAccountingView ORDER BY revenue DESC`)
        ]);

        // Process line chart data
        let lineData = lineResult.success ? lineResult.data || [] : [];
        
        // Apply grouping if needed (not applicable for line chart as it doesn't use dimension groups)
        
        const lineOpts = lineData.length ? {
          title: { text: "Profit & Loss Accounts" },
          subtitle: { text: "Showing numbers in $" },
          data: lineData,
          series: [
            {
              type: "line",
              xKey: "period",
              yKey: "revenue",
              yName: "Revenue",
              tooltip: { enabled: true },
            },
            {
              type: "line",
              xKey: "period",
              yKey: "grossMargin",
              yName: "Gross Margin",
              tooltip: { enabled: true },
            },
            {
              type: "line",
              xKey: "period",
              yKey: "netProfit",
              yName: "Net Profit",
              tooltip: { enabled: true },
            },
          ],
          axes: [
            { type: "category", position: "bottom", title: { text: "Period" } },
            { type: "number", position: "left", title: { text: "Amount ($)" } },
          ],
          listeners: {
            seriesNodeClick: ({ datum, yKey }) => {
              if (datum && datum.period) {
                handleDrillDown("line", datum.period, datum[yKey], yKey);
              }
            },
          }
        } : null;

        // Process bar chart data
        let barData = barResult.success ? barResult.data || [] : [];
        
        // Apply grouping if needed (not applicable for bar chart as it uses period)
        
        const barOpts = barData.length ? {
          title: { text: "Revenue vs Expenses" },
          data: barData,
          series: [
            { 
              type: "bar", 
              xKey: "period", 
              yKey: "revenue", 
              yName: "Revenue",
              tooltip: { enabled: true }
            },
            { 
              type: "bar", 
              xKey: "period", 
              yKey: "expenses", 
              yName: "Expenses",
              tooltip: { enabled: true }
            },
          ],
          axes: [
            { type: 'category', position: 'bottom', title: { text: 'Period' } },
            { type: 'number', position: 'left', title: { text: 'Amount ($)' } }
          ],
          listeners: {
            seriesNodeClick: ({ datum, yKey }) => {
              if (datum && datum.period) {
                handleDrillDown('bar', datum.period, datum[yKey], yKey);
              }
            }
          }
        } : null;

        // Process pie chart data
        let pieData: ChartDataPoint[] = [];
        if (pieResult.success && pieResult.data?.length) {
          pieData = Object.entries(pieResult.data[0])
            .map(([key, value]) => ({ label: key, value: value as number }));
        }
        
        // Apply grouping if needed (not applicable for this pie chart as it doesn't use dimensions)
        
        const pieOpts = pieData.length ? {
          title: { text: "Financial Distribution" },
          data: pieData,
          series: [{ 
            type: "pie", 
            angleKey: "value", 
            labelKey: "label",
            tooltip: { enabled: true },
            calloutLabel: { enabled: true },
            listeners: {
              nodeClick: (event) => {
                const { datum } = event;
                if (datum) {
                  handleDrillDown('pie', datum.label, datum.value, 'financialDistribution');
                }
              }
            }
          }],
        } : null;

        // Process donut chart data with grouping
        let donutData = donutResult.success ? donutResult.data || [] : [];
        
        // Apply grouping for catAccountingView dimension
        if (groups.catAccountingView && groups.catAccountingView.length > 0) {
          donutData = applyGroupTransformations(donutData, 'catAccountingView');
          donutData = combineDataByGroup(donutData, 'catAccountingView');
        }
        
        const donutOpts = donutData.length ? {
          title: { text: "Revenue by Category" },
          data: donutData,
          series: [{ 
            type: "donut", 
            angleKey: "revenue", 
            labelKey: "catAccountingView",
            tooltip: { enabled: true },
            calloutLabel: { enabled: true },
            listeners: {
              nodeClick: (event) => {
                const { datum } = event;
                if (datum) {
                  handleDrillDown('donut', datum.catAccountingView, datum.revenue, 'categoryRevenue');
                }
              }
            }
          }],
        } : null;

        // Update all chart data and options
        setChartData({
          line: lineData,
          bar: barData,
          pie: pieData,
          donut: donutData,
          drillDown: []
        });
        
        setChartOptions({
          line: lineOpts as any,
          bar: barOpts as any,
          pie: pieOpts as any,
          donut: donutOpts as any,
          drillDown: null
        });

      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred");
        console.error("Error fetching chart data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChartData();
  }, [selectedYear, isDataLoaded, executeQuery, groups]);

  // Handle drill down
  const handleDrillDown = async (chartType: string, category: string, value: any, dataType: string) => {
    if (!isDataLoaded) return;
    
    setIsLoading(true);
    setError(null);
    const whereClause = selectedYear !== "all" ? `AND fiscalYear = '${selectedYear}'` : "";
    
    try {
      let query = "";
      let title = "";
      let dimensionToGroup = ""; // Dimension that will be used for grouping in drill-down
      
      switch (chartType) {
        case 'bar':
          if (dataType === 'revenue') {
            query = `SELECT fiscalYear, catFinancialView, SUM(revenue) as value 
                     FROM financial_data 
                     WHERE period = '${category}' ${whereClause}
                     GROUP BY fiscalYear, catFinancialView
                     ORDER BY fiscalYear, value DESC`;
            title = `Revenue Breakdown for Period: ${category}`;
            dimensionToGroup = "catFinancialView";
          } else if (dataType === 'expenses') {
            query = `SELECT fiscalYear, catFinancialView, SUM(operatingExpenses) as value 
                     FROM financial_data 
                     WHERE period = '${category}' ${whereClause}
                     GROUP BY fiscalYear, catFinancialView
                     ORDER BY fiscalYear, value DESC`;
            title = `Expenses Breakdown for Period: ${category}`;
            dimensionToGroup = "catFinancialView";
          }
          break;
          
        case 'line':
          query = `SELECT fiscalYear, catFinancialView, SUM(${dataType}) as value 
                   FROM financial_data 
                   WHERE period = '${category}' ${whereClause}
                   GROUP BY fiscalYear, catFinancialView
                   ORDER BY value DESC`;
          title = `${dataType.charAt(0).toUpperCase() + dataType.slice(1)} Breakdown for Period: ${category}`;
          dimensionToGroup = "catFinancialView";
          break;
          
        case 'donut':
          // Handle case where category is from a group
          const isFromGroup = groups.catAccountingView?.some(group => 
            group.name === category && !dimensions.find(d => d.dimension === 'catAccountingView')?.values.includes(category)
          );
          
          if (isFromGroup) {
            // Find the group that contains this category name
            const group = groups.catAccountingView.find(g => g.name === category);
            if (group) {
              // Create WHERE IN clause with group members
              const membersStr = group.members.map(m => `'${m}'`).join(',');
              query = `SELECT fiscalYear, period, country, region, SUM(revenue) as value 
                       FROM financial_data 
                       WHERE catAccountingView IN (${membersStr}) ${whereClause}
                       GROUP BY fiscalYear, period, country, region
                       ORDER BY value DESC`;
              title = `Revenue Breakdown for Group: ${category}`;
              dimensionToGroup = "country"; // We'll group by country/region in this drill-down
            }
          } else {
            query = `SELECT fiscalYear, period, country, region, SUM(revenue) as value 
                     FROM financial_data 
                     WHERE catAccountingView = '${category}' ${whereClause}
                     GROUP BY fiscalYear, period, country, region
                     ORDER BY value DESC`;
            title = `Revenue Breakdown for Category: ${category}`;
            dimensionToGroup = "country"; // We'll group by country/region in this drill-down
          }
          break;
          
        case 'pie':
          if (dataType === 'financialDistribution') {
            query = `SELECT catFinancialView, SUM(${category}) as value 
                     FROM financial_data 
                     WHERE 1=1 ${whereClause}
                     GROUP BY catFinancialView
                     ORDER BY value DESC`;
            title = `${category} Breakdown by Financial Category`;
            dimensionToGroup = "catFinancialView";
          }
          break;
      }
      
      if (query) {
        const result = await executeQuery(query);
        if (result.success && result.data && result.data.length > 0) {
          let drillData = result.data;
          
          // Apply dimension grouping if this drill-down contains groupable dimensions
          if (dimensionToGroup && groups[dimensionToGroup] && groups[dimensionToGroup].length > 0) {
            drillData = applyGroupTransformations(drillData, dimensionToGroup);
            drillData = combineDataByGroup(drillData, dimensionToGroup);
          }
          
          // Create appropriate chart options based on data structure
          const firstDataPoint = drillData[0];
          const dataKeys = firstDataPoint ? Object.keys(firstDataPoint) : [];
          let options: AgChartOptions;
          
          if (dataKeys.includes('catFinancialView') || dataKeys.includes('country') || dataKeys.includes('region')) {
            // For bar charts with categories
            const dimensionKey = dataKeys.find(key => 
              ['catFinancialView', 'country', 'region'].includes(key)
            ) || dataKeys[0];
            
            options = {
              title: { text: title },
              data: drillData,
              series: [{ 
                type: 'bar', 
                xKey: dimensionKey, 
                yKey: 'value',
                yName: 'Value',
                tooltip: { enabled: true }
              }],
              axes: [
                { type: 'category', position: 'bottom' },
                { type: 'number', position: 'left', title: { text: 'Value ($)' } }
              ],
            };
          } else if (dataKeys.includes('period')) {
            // For line charts with time periods
            options = {
              title: { text: title },
              data: drillData,
              series: [{ 
                type: 'line', 
                xKey: 'period', 
                yKey: 'value',
                yName: 'Value',
                tooltip: { enabled: true }
              }],
              axes: [
                { type: 'category', position: 'bottom', title: { text: 'Period' } },
                { type: 'number', position: 'left', title: { text: 'Value ($)' } }
              ],
            };
          } else {
            // For pie charts
            const labelKey = dataKeys.find(key => key !== 'value') || dataKeys[0];
            options = {
              title: { text: title },
              data: drillData,
              series: [{ 
                type: 'pie', 
                angleKey: 'value', 
                labelKey: labelKey,
                tooltip: { enabled: true },
                calloutLabel: { enabled: true }
              }],
            };
          }
          
          // Update drill-down data and options
          setChartData(prev => ({
            ...prev,
            drillDown: drillData
          }));
          
          setChartOptions(prev => ({
            ...prev,
            drillDown: options
          }));
          
          setDrillDown({
            active: true,
            chartType,
            category,
            title
          });
        } else {
          setError("No data available for this selection");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      console.error("Error in drill-down:", err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Create group handler
  const handleCreateGroup = (dimension: string, groupName: string, members: string[]) => {
    if (!dimension || !groupName || members.length === 0) return;
    
    setGroups(prevGroups => {
      const updatedGroups = { ...prevGroups };
      
      // Initialize the dimension array if it doesn't exist
      if (!updatedGroups[dimension]) {
        updatedGroups[dimension] = [];
      }
      
      // Check if group with this name already exists
      const existingGroupIndex = updatedGroups[dimension].findIndex(g => g.name === groupName);
      
      if (existingGroupIndex >= 0) {
        // Update existing group
        updatedGroups[dimension][existingGroupIndex] = {
          name: groupName,
          members
        };
      } else {
        // Add new group
        updatedGroups[dimension].push({
          name: groupName,
          members
        });
      }
      
      return updatedGroups;
    });
  };
  
  // Delete group handler
  const handleDeleteGroup = (dimension: string, groupName: string) => {
    setGroups(prevGroups => {
      const updatedGroups = { ...prevGroups };
      
      if (updatedGroups[dimension]) {
        updatedGroups[dimension] = updatedGroups[dimension].filter(g => g.name !== groupName);
      }
      
      return updatedGroups;
    });
  };

  return (
    <section className="p-5">
      <h1 className="text-2xl font-bold text-center mb-4">Financial Dashboard - Ag Charts</h1>
      <FilterBar 
        years={years} 
        selectedYear={selectedYear} 
        onYearChange={setSelectedYear} 
        onResetDrillDown={resetDrillDown}
        isDrilled={drillDown.active}
        onOpenGroupModal={() => setIsGroupModalOpen(true)}
      />
      
      {/* Group Management UI */}
      <GroupManagement 
        groups={groups}
        onDeleteGroup={handleDeleteGroup}
      />
      
      {/* Group Creation Modal */}
      <GroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        dimensions={dimensions}
        onCreateGroup={handleCreateGroup}
      />
      
      {error && <p className="text-red-500 mb-2">{error}</p>}
      {isLoading && <p className="text-gray-500 mb-2">Loading...</p>}
      
      {drillDown.active ? (
        // Use the separated drill-down component
        <DrillDownChart
          drillDownState={drillDown}
          drillDownData={chartData.drillDown}
          drillDownOptions={chartOptions.drillDown}
          onBack={resetDrillDown}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {chartOptions.line && (
            <ChartContainer title="Line Series" data={chartData.line}>
              <AgCharts options={chartOptions.line} />
            </ChartContainer>
          )}
          {chartOptions.bar && (
            <ChartContainer title="Bar Series" data={chartData.bar}>
              <AgCharts options={chartOptions.bar} />
            </ChartContainer>
          )}
          {chartOptions.pie && (
            <ChartContainer title="Pie Series" data={chartData.pie}>
              <AgCharts options={chartOptions.pie} />
            </ChartContainer>
          )}
          {chartOptions.donut && (
            <ChartContainer title="Donut Series" data={chartData.donut}>
              <AgCharts options={chartOptions.donut} />
            </ChartContainer>
          )}
          <p className="col-span-1 md:col-span-2 text-sm text-gray-500">
            <i>Click on any chart element to drill down into more detailed data, or use the "Create Group" button to create dimension groups</i>
          </p>
        </div>
      )}
    </section>
  );
};

export default AgChartsPage;

"use client";
import React, { useState, useEffect, useRef } from "react";
import { AgCharts } from "ag-charts-react";
import { useDuckDBContext } from "../_providers/DuckDBContext";
import { AgChartOptions } from "ag-charts-community";
import { GroupModal} from "./GroupManagement";

// Core data types
interface ChartDataPoint {
  period?: string;
  revenue?: number;
  expenses?: number;
  grossMargin?: number;
  netProfit?: number;
  catAccountingView?: string;
  label?: string;
  value?: number;
  country?: string;
  region?: string;
  [key: string]: any;
}

// Common props for components
interface CommonProps {
  title: string;
  data?: any[];
  onDrillDown?: (type: string, category: string, value: any, dataType: string) => void;
}

// Drill-down state interface
interface DrillDownState {
  active: boolean;
  chartType: string;
  category: string;
  title: string;
}

// Group definition interface
interface GroupDefinition {
  name: string;
  members: string[];
}

// Chart container component
const ChartContainer: React.FC<CommonProps & {
  children: React.ReactNode;
  isDrilled?: boolean;
  onBack?: () => void;
}> = ({ title, children, data, isDrilled, onBack }) => {
  const chartRef = useRef<HTMLDivElement>(null);

  // Export to CSV function
  const exportToCSV = () => {
    if (!data || !data.length) return;
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `chart_data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PNG export function
  const exportToPNG = () => {
    const chartElement = chartRef.current;
    if (!chartElement) return;
    
    const canvas = chartElement.querySelector('canvas');
    
    if (canvas) {
      try {
        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'chart.png';
        link.href = image;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.error("Failed to export chart:", err);
        alert("Could not export chart as PNG. Please try again.");
      }
    } else {
      alert("Chart is not ready for export. Please try again.");
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold">{title}</h2>
          {isDrilled && (
            <button
              onClick={onBack}
              className="ml-3 px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
            >
              ↩ Back
            </button>
          )}
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={exportToPNG}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          >
            PNG
          </button>
          <button 
            onClick={exportToCSV}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          >
            CSV
          </button>
        </div>
      </div>
      <div ref={chartRef}>
        {children}
      </div>
    </div>
  );
};

// Filter bar component enhanced with grouping
const FilterBar: React.FC<{
  years: string[];
  selectedYear: string;
  onYearChange: (year: string) => void;
  onResetDrillDown?: () => void;
  isDrilled: boolean;
  onOpenGroupModal: () => void;
}> = ({ years, selectedYear, onYearChange, onResetDrillDown, isDrilled, onOpenGroupModal }) => (
  <div className="mb-6 flex items-center flex-wrap gap-2">
    <label className="mr-2 font-medium">Year:</label>
    <select
      value={selectedYear}
      onChange={(e) => onYearChange(e.target.value)}
      className="border border-gray-300 rounded px-3 py-2"
    >
      <option value="all">All Years</option>
      {years.map((year) => (
        <option key={year} value={year}>
          {year}
        </option>
      ))}
    </select>
    
    {isDrilled && (
      <button
        onClick={onResetDrillDown}
        className="px-3 py-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
      >
        Reset Drill Down
      </button>
    )}
    
    <button
      onClick={onOpenGroupModal}
      className="ml-auto px-3 py-2 shadow-xl border border-gray-500 bg-blue-500 text-white rounded"
    >
      Create Group
    </button>
  </div>
);


// Separated Drill Down Component
const DrillDownChart: React.FC<{
  drillDownState: DrillDownState;
  drillDownData: any[];
  drillDownOptions: AgChartOptions | null;
  onBack: () => void;
}> = ({ drillDownState, drillDownData, drillDownOptions, onBack }) => {
  return (
    <div className="mb-4">
      <ChartContainer 
        title={drillDownState.title} 
        data={drillDownData}
        onBack={onBack}
        isDrilled={true}
      >
        {drillDownOptions && <AgCharts options={drillDownOptions} />}
      </ChartContainer>
      <p className="mt-2 text-sm text-gray-500">
        <i>Click any data point for further drill-down, or use the back button to return</i>
      </p>
    </div>
  );
};


// Main AG Charts Page Component
const AgChartsPage: React.FC = () => {
  const { executeQuery, isDataLoaded } = useDuckDBContext();
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [years, setYears] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState<boolean>(false);
  
  // Available dimensions for grouping
  const [dimensions, setDimensions] = useState<{ dimension: string; values: string[] }[]>([]);
  // Groups state - stores created dimension groups
  const [groups, setGroups] = useState<Record<string, GroupDefinition[]>>({});

  // Drill down state
  const [drillDown, setDrillDown] = useState<DrillDownState>({
    active: false,
    chartType: "",
    category: "",
    title: ""
  });

  // Chart data states
  const [chartData, setChartData] = useState<{
    line: ChartDataPoint[],
    bar: ChartDataPoint[],
    pie: ChartDataPoint[],
    donut: ChartDataPoint[],
    drillDown: any[]
  }>({
    line: [],
    bar: [],
    pie: [],
    donut: [],
    drillDown: []
  });

  // Chart options states
  const [chartOptions, setChartOptions] = useState<{
    line: AgChartOptions | null,
    bar: AgChartOptions | null,
    pie: AgChartOptions | null,
    donut: AgChartOptions | null,
    drillDown: AgChartOptions | null
  }>({
    line: null,
    bar: null,
    pie: null,
    donut: null,
    drillDown: null
  });

  // Reset drill down
  const resetDrillDown = () => {
    setDrillDown({
      active: false,
      chartType: "",
      category: "",
      title: ""
    });
  };
  // Fetch years for year filter
  useEffect(() => {
    if (!isDataLoaded) return;

    const fetchYears = async () => {
      try {
        const result = await executeQuery("SELECT DISTINCT fiscalYear FROM financial_data ORDER BY fiscalYear");
        if (result.success && result.data) {
          setYears(result.data.map((row: { fiscalYear: string }) => row.fiscalYear));
        }
      } catch (err) {
        console.error("Failed to fetch years:", err);
        setError("Failed to load year data");
      }
    };

    fetchYears();
  }, [isDataLoaded, executeQuery]);
  // Main data fetching effect
  useEffect(() => {
    if (!isDataLoaded) return;

    const fetchChartData = async () => {
      setIsLoading(true);
      setError(null);
      const whereClause = selectedYear !== "all" ? `WHERE fiscalYear = '${selectedYear}'` : "";

      try {
        const [lineResult, barResult, pieResult, donutResult] = await Promise.all([
          executeQuery(`SELECT period, AVG(revenue) as revenue, AVG(grossMargin) as grossMargin, AVG(netProfit) as netProfit FROM financial_data ${whereClause} GROUP BY period ORDER BY period`),
          executeQuery(`SELECT period, SUM(revenue) as revenue, SUM(operatingExpenses) as expenses FROM financial_data ${whereClause} GROUP BY period ORDER BY period`),
          executeQuery(`SELECT SUM(grossMargin) as grossMargin, SUM(operatingExpenses) as operatingExpenses, SUM(netProfit) as netProfit, SUM(revenue) as revenue FROM financial_data ${whereClause}`),
          executeQuery(`SELECT catAccountingView, SUM(revenue) as revenue FROM financial_data ${whereClause} GROUP BY catAccountingView ORDER BY revenue DESC`)
        ]);

        // Process line chart data
        let lineData = lineResult.success ? lineResult.data || [] : [];
        
        // Apply grouping if needed (not applicable for line chart as it doesn't use dimension groups)
        
        const lineOpts = lineData.length ? {
          title: { text: "Profit & Loss Accounts" },
          subtitle: { text: "Showing numbers in $" },
          data: lineData,
          series: [
            {
              type: "line",
              xKey: "period",
              yKey: "revenue",
              yName: "Revenue",
              tooltip: { enabled: true },
            },
            {
              type: "line",
              xKey: "period",
              yKey: "grossMargin",
              yName: "Gross Margin",
              tooltip: { enabled: true },
            },
            {
              type: "line",
              xKey: "period",
              yKey: "netProfit",
              yName: "Net Profit",
              tooltip: { enabled: true },
            },
          ],
          axes: [
            { type: "category", position: "bottom", title: { text: "Period" } },
            { type: "number", position: "left", title: { text: "Amount ($)" } },
          ],
          listeners: {
            seriesNodeClick: ({ datum, yKey }) => {
              if (datum && datum.period) {
                handleDrillDown("line", datum.period, datum[yKey], yKey);
              }
            },
          }
        } : null;

        // Process bar chart data
        let barData = barResult.success ? barResult.data || [] : [];
        
        // Apply grouping if needed (not applicable for bar chart as it uses period)
        
        const barOpts = barData.length ? {
          title: { text: "Revenue vs Expenses" },
          data: barData,
          series: [
            { 
              type: "bar", 
              xKey: "period", 
              yKey: "revenue", 
              yName: "Revenue",
              tooltip: { enabled: true }
            },
            { 
              type: "bar", 
              xKey: "period", 
              yKey: "expenses", 
              yName: "Expenses",
              tooltip: { enabled: true }
            },
          ],
          axes: [
            { type: 'category', position: 'bottom', title: { text: 'Period' } },
            { type: 'number', position: 'left', title: { text: 'Amount ($)' } }
          ],
          listeners: {
            seriesNodeClick: ({ datum, yKey }) => {
              if (datum && datum.period) {
                handleDrillDown('bar', datum.period, datum[yKey], yKey);
              }
            }
          }
        } : null;

        // Process pie chart data
        let pieData: ChartDataPoint[] = [];
        if (pieResult.success && pieResult.data?.length) {
          pieData = Object.entries(pieResult.data[0])
            .map(([key, value]) => ({ label: key, value: value as number }));
        }
        
        // Apply grouping if needed (not applicable for this pie chart as it doesn't use dimensions)
        
        const pieOpts = pieData.length ? {
          title: { text: "Financial Distribution" },
          data: pieData,
          series: [{ 
            type: "pie", 
            angleKey: "value", 
            labelKey: "label",
            tooltip: { enabled: true },
            calloutLabel: { enabled: true },
            listeners: {
              nodeClick: (event) => {
                const { datum } = event;
                if (datum) {
                  handleDrillDown('pie', datum.label, datum.value, 'financialDistribution');
                }
              }
            }
          }],
        } : null;

        // Process donut chart data with grouping
        let donutData = donutResult.success ? donutResult.data || [] : [];
        
        // Apply grouping for catAccountingView dimension
        if (groups.catAccountingView && groups.catAccountingView.length > 0) {
          donutData = applyGroupTransformations(donutData, 'catAccountingView');
          donutData = combineDataByGroup(donutData, 'catAccountingView');
        }
        
        const donutOpts = donutData.length ? {
          title: { text: "Revenue by Category" },
          data: donutData,
          series: [{ 
            type: "donut", 
            angleKey: "revenue", 
            labelKey: "catAccountingView",
            tooltip: { enabled: true },
            calloutLabel: { enabled: true },
            listeners: {
              nodeClick: (event) => {
                const { datum } = event;
                if (datum) {
                  handleDrillDown('donut', datum.catAccountingView, datum.revenue, 'categoryRevenue');
                }
              }
            }
          }],
        } : null;

        // Update all chart data and options
        setChartData({
          line: lineData,
          bar: barData,
          pie: pieData,
          donut: donutData,
          drillDown: []
        });
        
        setChartOptions({
          line: lineOpts as any,
          bar: barOpts as any,
          pie: pieOpts as any,
          donut: donutOpts as any,
          drillDown: null
        });

      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred");
        console.error("Error fetching chart data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChartData();
  }, [selectedYear, isDataLoaded, executeQuery, groups]);

  // Handle drill down
  const handleDrillDown = async (chartType: string, category: string, value: any, dataType: string) => {
    if (!isDataLoaded) return;
    
    setIsLoading(true);
    setError(null);
    const whereClause = selectedYear !== "all" ? `AND fiscalYear = '${selectedYear}'` : "";
    
    try {
      let query = "";
      let title = "";
      let dimensionToGroup = ""; // Dimension that will be used for grouping in drill-down
      
      switch (chartType) {
        case 'bar':
          if (dataType === 'revenue') {
            query = `SELECT fiscalYear, catFinancialView, SUM(revenue) as value 
                     FROM financial_data 
                     WHERE period = '${category}' ${whereClause}
                     GROUP BY fiscalYear, catFinancialView
                     ORDER BY fiscalYear, value DESC`;
            title = `Revenue Breakdown for Period: ${category}`;
            dimensionToGroup = "catFinancialView";
          } else if (dataType === 'expenses') {
            query = `SELECT fiscalYear, catFinancialView, SUM(operatingExpenses) as value 
                     FROM financial_data 
                     WHERE period = '${category}' ${whereClause}
                     GROUP BY fiscalYear, catFinancialView
                     ORDER BY fiscalYear, value DESC`;
            title = `Expenses Breakdown for Period: ${category}`;
            dimensionToGroup = "catFinancialView";
          }
          break;
          
        case 'line':
          query = `SELECT fiscalYear, catFinancialView, SUM(${dataType}) as value 
                   FROM financial_data 
                   WHERE period = '${category}' ${whereClause}
                   GROUP BY fiscalYear, catFinancialView
                   ORDER BY value DESC`;
          title = `${dataType.charAt(0).toUpperCase() + dataType.slice(1)} Breakdown for Period: ${category}`;
          dimensionToGroup = "catFinancialView";
          break;
          
        case 'donut':
          // Handle case where category is from a group
          const isFromGroup = groups.catAccountingView?.some(group => 
            group.name === category && !dimensions.find(d => d.dimension === 'catAccountingView')?.values.includes(category)
          );
          
          if (isFromGroup) {
            // Find the group that contains this category name
            const group = groups.catAccountingView.find(g => g.name === category);
            if (group) {
              // Create WHERE IN clause with group members
              const membersStr = group.members.map(m => `'${m}'`).join(',');
              query = `SELECT fiscalYear, period, country, region, SUM(revenue) as value 
                       FROM financial_data 
                       WHERE catAccountingView IN (${membersStr}) ${whereClause}
                       GROUP BY fiscalYear, period, country, region
                       ORDER BY value DESC`;
              title = `Revenue Breakdown for Group: ${category}`;
              dimensionToGroup = "country"; // We'll group by country/region in this drill-down
            }
          } else {
            query = `SELECT fiscalYear, period, country, region, SUM(revenue) as value 
                     FROM financial_data 
                     WHERE catAccountingView = '${category}' ${whereClause}
                     GROUP BY fiscalYear, period, country, region
                     ORDER BY value DESC`;
            title = `Revenue Breakdown for Category: ${category}`;
            dimensionToGroup = "country"; // We'll group by country/region in this drill-down
          }
          break;
          
        case 'pie':
          if (dataType === 'financialDistribution') {
            query = `SELECT catFinancialView, SUM(${category}) as value 
                     FROM financial_data 
                     WHERE 1=1 ${whereClause}
                     GROUP BY catFinancialView
                     ORDER BY value DESC`;
            title = `${category} Breakdown by Financial Category`;
            dimensionToGroup = "catFinancialView";
          }
          break;
      }
      
      if (query) {
        const result = await executeQuery(query);
        if (result.success && result.data && result.data.length > 0) {
          let drillData = result.data;
          
          // Apply dimension grouping if this drill-down contains groupable dimensions
          if (dimensionToGroup && groups[dimensionToGroup] && groups[dimensionToGroup].length > 0) {
            drillData = applyGroupTransformations(drillData, dimensionToGroup);
            drillData = combineDataByGroup(drillData, dimensionToGroup);
          }
          
          // Create appropriate chart options based on data structure
          const firstDataPoint = drillData[0];
          const dataKeys = firstDataPoint ? Object.keys(firstDataPoint) : [];
          let options: AgChartOptions;
          
          if (dataKeys.includes('catFinancialView') || dataKeys.includes('country') || dataKeys.includes('region')) {
            // For bar charts with categories
            const dimensionKey = dataKeys.find(key => 
              ['catFinancialView', 'country', 'region'].includes(key)
            ) || dataKeys[0];
            
            options = {
              title: { text: title },
              data: drillData,
              series: [{ 
                type: 'bar', 
                xKey: dimensionKey, 
                yKey: 'value',
                yName: 'Value',
                tooltip: { enabled: true }
              }],
              axes: [
                { type: 'category', position: 'bottom' },
                { type: 'number', position: 'left', title: { text: 'Value ($)' } }
              ],
            };
          } else if (dataKeys.includes('period')) {
            // For line charts with time periods
            options = {
              title: { text: title },
              data: drillData,
              series: [{ 
                type: 'line', 
                xKey: 'period', 
                yKey: 'value',
                yName: 'Value',
                tooltip: { enabled: true }
              }],
              axes: [
                { type: 'category', position: 'bottom', title: { text: 'Period' } },
                { type: 'number', position: 'left', title: { text: 'Value ($)' } }
              ],
            };
          } else {
            // For pie charts
            const labelKey = dataKeys.find(key => key !== 'value') || dataKeys[0];
            options = {
              title: { text: title },
              data: drillData,
              series: [{ 
                type: 'pie', 
                angleKey: 'value', 
                labelKey: labelKey,
                tooltip: { enabled: true },
                calloutLabel: { enabled: true }
              }],
            };
          }
          
          // Update drill-down data and options
          setChartData(prev => ({
            ...prev,
            drillDown: drillData
          }));
          
          setChartOptions(prev => ({
            ...prev,
            drillDown: options
          }));
          
          setDrillDown({
            active: true,
            chartType,
            category,
            title
          });
        } else {
          setError("No data available for this selection");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      console.error("Error in drill-down:", err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Create group handler
  const handleCreateGroup = (groupName: string, selections: { dimension: string; members: string[] }[]) => {
    if (!groupName || !selections.length) return;
  
    setGroups(prevGroups => {
      const updated = { ...prevGroups };
  
      selections.forEach(({ dimension, members }) => {
        if (!dimension || !members.length) return;
  
        const existing = updated[dimension] || [];
        const index = existing.findIndex(g => g.name === groupName);
  
        const groupEntry = { name: groupName, members };
  
        if (index >= 0) {
          existing[index] = groupEntry;
        } else {
          existing.push(groupEntry);
        }
  
        updated[dimension] = existing;
      });
  
      return updated;
    });
  };  
  
  

  return (
    <section className="p-5">
      <h1 className="text-2xl font-bold text-center mb-4">Financial Dashboard - Ag Charts</h1>
      <FilterBar 
        years={years} 
        selectedYear={selectedYear} 
        onYearChange={setSelectedYear} 
        onResetDrillDown={resetDrillDown}
        isDrilled={drillDown.active}
        onOpenGroupModal={() => setIsGroupModalOpen(true)}
      />
      
      
      {/* Group Creation Modal */}
      <GroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onCreateGroup={handleCreateGroup}
      />
      
      {error && <p className="text-red-500 mb-2">{error}</p>}
      {isLoading && <p className="text-gray-500 mb-2">Loading...</p>}
      
      {drillDown.active ? (
        // Use the separated drill-down component
        <DrillDownChart
          drillDownState={drillDown}
          drillDownData={chartData.drillDown}
          drillDownOptions={chartOptions.drillDown}
          onBack={resetDrillDown}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {chartOptions.line && (
            <ChartContainer title="Line Series" data={chartData.line}>
              <AgCharts options={chartOptions.line} />
            </ChartContainer>
          )}
          {chartOptions.bar && (
            <ChartContainer title="Bar Series" data={chartData.bar}>
              <AgCharts options={chartOptions.bar} />
            </ChartContainer>
          )}
          {chartOptions.pie && (
            <ChartContainer title="Pie Series" data={chartData.pie}>
              <AgCharts options={chartOptions.pie} />
            </ChartContainer>
          )}
          {chartOptions.donut && (
            <ChartContainer title="Donut Series" data={chartData.donut}>
              <AgCharts options={chartOptions.donut} />
            </ChartContainer>
          )}
          <p className="col-span-1 md:col-span-2 text-sm text-gray-500">
            <i>Click on any chart element to drill down into more detailed data, or use the "Create Group" button to create dimension groups</i>
          </p>
        </div>
      )}
    </section>
  );
};

export default AgChartsPage;