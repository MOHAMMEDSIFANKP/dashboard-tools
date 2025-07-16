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

// "use client";
// import React, { useState, useEffect, useRef } from "react";
// import { AgCharts } from "ag-charts-react";
// import { useDuckDBContext } from "../_providers/DuckDBContext";
// import { AgChartOptions } from "ag-charts-community";

// // Core data types
// interface ChartDataPoint {
//   period?: string;
//   revenue?: number;
//   expenses?: number;
//   grossMargin?: number;
//   netProfit?: number;
//   catAccountingView?: string;
//   label?: string;
//   value?: number;
//   country?: string;
//   region?: string;
//   [key: string]: any;
// }

// // Common props for components
// interface CommonProps {
//   title: string;
//   data?: any[];
//   onDrillDown?: (type: string, category: string, value: any, dataType: string) => void;
// }

// // Drill-down state interface
// interface DrillDownState {
//   active: boolean;
//   chartType: string;
//   category: string;
//   title: string;
// }

// // Group definition interface
// interface GroupDefinition {
//   name: string;
//   members: string[];
// }

// // Chart container component
// const ChartContainer: React.FC<CommonProps & {
//   children: React.ReactNode;
//   isDrilled?: boolean;
//   onBack?: () => void;
// }> = ({ title, children, data, isDrilled, onBack }) => {
//   const chartRef = useRef<HTMLDivElement>(null);

//   // Export to CSV function
//   const exportToCSV = () => {
//     if (!data || !data.length) return;
    
//     const headers = Object.keys(data[0]).join(',');
//     const rows = data.map(row => Object.values(row).join(',')).join('\n');
//     const csv = `${headers}\n${rows}`;
    
//     const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
//     const url = URL.createObjectURL(blob);
//     const link = document.createElement('a');
//     link.setAttribute('href', url);
//     link.setAttribute('download', `chart_data.csv`);
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//   };

//   // PNG export function
//   const exportToPNG = () => {
//     const chartElement = chartRef.current;
//     if (!chartElement) return;
    
//     const canvas = chartElement.querySelector('canvas');
    
//     if (canvas) {
//       try {
//         const image = canvas.toDataURL('image/png');
//         const link = document.createElement('a');
//         link.download = 'chart.png';
//         link.href = image;
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);
//       } catch (err) {
//         console.error("Failed to export chart:", err);
//         alert("Could not export chart as PNG. Please try again.");
//       }
//     } else {
//       alert("Chart is not ready for export. Please try again.");
//     }
//   };

//   return (
//     <div className="bg-white p-6 rounded-lg shadow-md">
//       <div className="flex justify-between items-center mb-2">
//         <div className="flex items-center">
//           <h2 className="text-xl font-semibold">{title}</h2>
//           {isDrilled && (
//             <button
//               onClick={onBack}
//               className="ml-3 px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
//             >
//               ↩ Back
//             </button>
//           )}
//         </div>
//         <div className="flex space-x-2">
//           <button 
//             onClick={exportToPNG}
//             className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
//           >
//             PNG
//           </button>
//           <button 
//             onClick={exportToCSV}
//             className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
//           >
//             CSV
//           </button>
//         </div>
//       </div>
//       <div ref={chartRef}>
//         {children}
//       </div>
//     </div>
//   );
// };

// // Filter bar component enhanced with grouping
// const FilterBar: React.FC<{
//   years: string[];
//   selectedYear: string;
//   onYearChange: (year: string) => void;
//   onResetDrillDown?: () => void;
//   isDrilled: boolean;
//   onOpenGroupModal: () => void;
// }> = ({ years, selectedYear, onYearChange, onResetDrillDown, isDrilled, onOpenGroupModal }) => (
//   <div className="mb-6 flex items-center flex-wrap gap-2">
//     <label className="mr-2 font-medium">Year:</label>
//     <select
//       value={selectedYear}
//       onChange={(e) => onYearChange(e.target.value)}
//       className="border border-gray-300 rounded px-3 py-2"
//     >
//       <option value="all">All Years</option>
//       {years.map((year) => (
//         <option key={year} value={year}>
//           {year}
//         </option>
//       ))}
//     </select>
    
//     {isDrilled && (
//       <button
//         onClick={onResetDrillDown}
//         className="px-3 py-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
//       >
//         Reset Drill Down
//       </button>
//     )}
    
//     <button
//       onClick={onOpenGroupModal}
//       className="ml-auto px-3 py-2 bg-green-100 text-green-600 rounded hover:bg-green-200"
//     >
//       Create Group
//     </button>
//   </div>
// );

// // Group creation modal component
// const GroupModal: React.FC<{
//   isOpen: boolean;
//   onClose: () => void;
//   dimensions: { dimension: string; values: string[] }[];
//   onCreateGroup: (dimension: string, groupName: string, members: string[]) => void;
// }> = ({ isOpen, onClose, dimensions, onCreateGroup }) => {
//   const [selectedDimension, setSelectedDimension] = useState<string>("");
//   const [groupName, setGroupName] = useState<string>("");
//   const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  
//   useEffect(() => {
//     if (dimensions.length > 0 && !selectedDimension) {
//       setSelectedDimension(dimensions[0].dimension);
//     }
//   }, [dimensions, selectedDimension]);
  
//   const handleDimensionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     setSelectedDimension(e.target.value);
//     setSelectedMembers([]);
//   };
  
//   const handleMemberToggle = (member: string) => {
//     if (selectedMembers.includes(member)) {
//       setSelectedMembers(selectedMembers.filter(m => m !== member));
//     } else {
//       setSelectedMembers([...selectedMembers, member]);
//     }
//   };
  
//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (groupName && selectedDimension && selectedMembers.length > 0) {
//       onCreateGroup(selectedDimension, groupName, selectedMembers);
//       setGroupName("");
//       setSelectedMembers([]);
//       onClose();
//     }
//   };
  
//   if (!isOpen) return null;
  
//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//       <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
//         <h2 className="text-xl font-semibold mb-4">Create Dimension Group</h2>
        
//         <form onSubmit={handleSubmit}>
//           <div className="mb-4">
//             <label className="block text-sm font-medium mb-1">Select Dimension</label>
//             <select
//               value={selectedDimension}
//               onChange={handleDimensionChange}
//               className="w-full border border-gray-300 rounded px-3 py-2"
//             >
//               {dimensions.map(dim => (
//                 <option key={dim.dimension} value={dim.dimension}>
//                   {dim.dimension}
//                 </option>
//               ))}
//             </select>
//           </div>
          
//           <div className="mb-4">
//             <label className="block text-sm font-medium mb-1">Group Name</label>
//             <input
//               type="text"
//               value={groupName}
//               onChange={(e) => setGroupName(e.target.value)}
//               className="w-full border border-gray-300 rounded px-3 py-2"
//               placeholder="Enter group name"
//               required
//             />
//           </div>
          
//           <div className="mb-4">
//             <label className="block text-sm font-medium mb-2">Select Members</label>
//             <div className="border border-gray-300 rounded p-2 max-h-40 overflow-y-auto">
//               {selectedDimension && dimensions.find(d => d.dimension === selectedDimension)?.values.map(value => (
//                 <div key={value} className="flex items-center mb-1">
//                   <input
//                     type="checkbox"
//                     id={`member-${value}`}
//                     checked={selectedMembers.includes(value)}
//                     onChange={() => handleMemberToggle(value)}
//                     className="mr-2"
//                   />
//                   <label htmlFor={`member-${value}`}>{value}</label>
//                 </div>
//               ))}
//             </div>
//           </div>
          
//           <div className="flex justify-end space-x-2">
//             <button
//               type="button"
//               onClick={onClose}
//               className="px-4 py-2 border border-gray-300 rounded"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//               disabled={!groupName || selectedMembers.length === 0}
//             >
//               Create Group
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// // Separated Drill Down Component
// const DrillDownChart: React.FC<{
//   drillDownState: DrillDownState;
//   drillDownData: any[];
//   drillDownOptions: AgChartOptions | null;
//   onBack: () => void;
// }> = ({ drillDownState, drillDownData, drillDownOptions, onBack }) => {
//   return (
//     <div className="mb-4">
//       <ChartContainer 
//         title={drillDownState.title} 
//         data={drillDownData}
//         onBack={onBack}
//         isDrilled={true}
//       >
//         {drillDownOptions && <AgCharts options={drillDownOptions} />}
//       </ChartContainer>
//       <p className="mt-2 text-sm text-gray-500">
//         <i>Click any data point for further drill-down, or use the back button to return</i>
//       </p>
//     </div>
//   );
// };

// // Group management component
// const GroupManagement: React.FC<{
//   groups: Record<string, GroupDefinition[]>;
//   onDeleteGroup: (dimension: string, groupName: string) => void;
// }> = ({ groups, onDeleteGroup }) => {
//   if (Object.keys(groups).length === 0) return null;
  
//   return (
//     <div className="mb-6">
//       <h3 className="text-lg font-medium mb-2">Active Groups</h3>
//       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
//         {Object.entries(groups).map(([dimension, dimensionGroups]) => (
//           dimensionGroups.length > 0 && (
//             <div key={dimension} className="border rounded-md p-3 bg-gray-50">
//               <h4 className="font-medium text-gray-700">{dimension}</h4>
//               <ul className="mt-2">
//                 {dimensionGroups.map(group => (
//                   <li key={group.name} className="flex justify-between items-center mb-1">
//                     <div>
//                       <span className="text-sm font-medium">{group.name}</span>
//                       <span className="text-xs text-gray-500 ml-1">({group.members.length} members)</span>
//                     </div>
//                     <button
//                       onClick={() => onDeleteGroup(dimension, group.name)}
//                       className="text-red-500 hover:text-red-700 text-sm"
//                     >
//                       Remove
//                     </button>
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           )
//         ))}
//       </div>
//     </div>
//   );
// };

// // Main AG Charts Page Component
// const AgChartsPage: React.FC = () => {
//   const { executeQuery, isDataLoaded } = useDuckDBContext();
//   const [selectedYear, setSelectedYear] = useState<string>("all");
//   const [years, setYears] = useState<string[]>([]);
//   const [error, setError] = useState<string | null>(null);
//   const [isLoading, setIsLoading] = useState<boolean>(true);
//   const [isGroupModalOpen, setIsGroupModalOpen] = useState<boolean>(false);
  
//   // Available dimensions for grouping
//   const [dimensions, setDimensions] = useState<{ dimension: string; values: string[] }[]>([]);
  
//   // Groups state - stores created dimension groups
//   const [groups, setGroups] = useState<Record<string, GroupDefinition[]>>({});

//   // Drill down state
//   const [drillDown, setDrillDown] = useState<DrillDownState>({
//     active: false,
//     chartType: "",
//     category: "",
//     title: ""
//   });

//   // Chart data states
//   const [chartData, setChartData] = useState<{
//     line: ChartDataPoint[],
//     bar: ChartDataPoint[],
//     pie: ChartDataPoint[],
//     donut: ChartDataPoint[],
//     drillDown: any[]
//   }>({
//     line: [],
//     bar: [],
//     pie: [],
//     donut: [],
//     drillDown: []
//   });

//   // Chart options states
//   const [chartOptions, setChartOptions] = useState<{
//     line: AgChartOptions | null,
//     bar: AgChartOptions | null,
//     pie: AgChartOptions | null,
//     donut: AgChartOptions | null,
//     drillDown: AgChartOptions | null
//   }>({
//     line: null,
//     bar: null,
//     pie: null,
//     donut: null,
//     drillDown: null
//   });

//   // Reset drill down
//   const resetDrillDown = () => {
//     setDrillDown({
//       active: false,
//       chartType: "",
//       category: "",
//       title: ""
//     });
//   };

//   // Fetch dimensions for grouping
//   useEffect(() => {
//     if (!isDataLoaded) return;
    
//     const fetchDimensions = async () => {
//       try {
//         const [countryResult, catAccountingResult, catFinancialResult, regionResult] = await Promise.all([
//           executeQuery("SELECT DISTINCT country FROM financial_data ORDER BY country"),
//           executeQuery("SELECT DISTINCT catAccountingView FROM financial_data ORDER BY catAccountingView"),
//           executeQuery("SELECT DISTINCT catFinancialView FROM financial_data ORDER BY catFinancialView"),
//           executeQuery("SELECT DISTINCT region FROM financial_data ORDER BY region")
//         ]);
        
//         const dimensionsData = [];
        
//         if (countryResult.success && countryResult.data && countryResult.data.length > 0) {
//           dimensionsData.push({
//             dimension: "country",
//             values: countryResult.data.map((row: { country: string }) => row.country)
//           });
//         }
        
//         if (catAccountingResult.success && catAccountingResult.data && catAccountingResult.data.length > 0) {
//           dimensionsData.push({
//             dimension: "catAccountingView",
//             values: catAccountingResult.data.map((row: { catAccountingView: string }) => row.catAccountingView)
//           });
//         }
        
//         if (catFinancialResult.success && catFinancialResult.data && catFinancialResult.data.length > 0) {
//           dimensionsData.push({
//             dimension: "catFinancialView",
//             values: catFinancialResult.data.map((row: { catFinancialView: string }) => row.catFinancialView)
//           });
//         }
        
//         if (regionResult.success && regionResult.data && regionResult.data.length > 0) {
//           dimensionsData.push({
//             dimension: "region",
//             values: regionResult.data.map((row: { region: string }) => row.region)
//           });
//         }
        
//         setDimensions(dimensionsData);
        
//         // Initialize empty groups for each dimension
//         const initialGroups: Record<string, GroupDefinition[]> = {};
//         dimensionsData.forEach(dim => {
//           initialGroups[dim.dimension] = [];
//         });
//         setGroups(initialGroups);
        
//       } catch (err) {
//         console.error("Failed to fetch dimensions:", err);
//       }
//     };
    
//     fetchDimensions();
//   }, [isDataLoaded, executeQuery]);

//   // Fetch years for year filter
//   useEffect(() => {
//     if (!isDataLoaded) return;

//     const fetchYears = async () => {
//       try {
//         const result = await executeQuery("SELECT DISTINCT fiscalYear FROM financial_data ORDER BY fiscalYear");
//         if (result.success && result.data) {
//           setYears(result.data.map((row: { fiscalYear: string }) => row.fiscalYear));
//         }
//       } catch (err) {
//         console.error("Failed to fetch years:", err);
//         setError("Failed to load year data");
//       }
//     };

//     fetchYears();
//   }, [isDataLoaded, executeQuery]);

//   // Function to apply group transformations to data
//   const applyGroupTransformations = (data: any[], dimension: string): any[] => {
//     if (!data || data.length === 0 || !groups[dimension] || groups[dimension].length === 0) {
//       return data;
//     }
    
//     return data.map(item => {
//       const itemCopy = { ...item };
//       const dimensionGroups = groups[dimension];
      
//       for (const group of dimensionGroups) {
//         if (group.members.includes(item[dimension])) {
//           itemCopy[dimension] = group.name;
//           break;
//         }
//       }
      
//       return itemCopy;
//     });
//   };
  
//   // Function to combine data by group
//   const combineDataByGroup = (data: any[], dimension: string): any[] => {
//     if (!data || data.length === 0) return data;
    
//     const groupedData: Record<string, any> = {};
    
//     data.forEach(item => {
//       const key = item[dimension];
//       if (!groupedData[key]) {
//         groupedData[key] = { ...item };
//       } else {
//         // Sum numeric values
//         Object.keys(item).forEach(prop => {
//           if (typeof item[prop] === 'number') {
//             groupedData[key][prop] = (groupedData[key][prop] || 0) + item[prop];
//           }
//         });
//       }
//     });
    
//     return Object.values(groupedData);
//   };

//   // Main data fetching effect
//   useEffect(() => {
//     if (!isDataLoaded) return;

//     const fetchChartData = async () => {
//       setIsLoading(true);
//       setError(null);
//       const whereClause = selectedYear !== "all" ? `WHERE fiscalYear = '${selectedYear}'` : "";

//       try {
//         const [lineResult, barResult, pieResult, donutResult] = await Promise.all([
//           executeQuery(`SELECT period, AVG(revenue) as revenue, AVG(grossMargin) as grossMargin, AVG(netProfit) as netProfit FROM financial_data ${whereClause} GROUP BY period ORDER BY period`),
//           executeQuery(`SELECT period, SUM(revenue) as revenue, SUM(operatingExpenses) as expenses FROM financial_data ${whereClause} GROUP BY period ORDER BY period`),
//           executeQuery(`SELECT SUM(grossMargin) as grossMargin, SUM(operatingExpenses) as operatingExpenses, SUM(netProfit) as netProfit, SUM(revenue) as revenue FROM financial_data ${whereClause}`),
//           executeQuery(`SELECT catAccountingView, SUM(revenue) as revenue FROM financial_data ${whereClause} GROUP BY catAccountingView ORDER BY revenue DESC`)
//         ]);

//         // Process line chart data
//         let lineData = lineResult.success ? lineResult.data || [] : [];
        
//         // Apply grouping if needed (not applicable for line chart as it doesn't use dimension groups)
        
//         const lineOpts = lineData.length ? {
//           title: { text: "Profit & Loss Accounts" },
//           subtitle: { text: "Showing numbers in $" },
//           data: lineData,
//           series: [
//             {
//               type: "line",
//               xKey: "period",
//               yKey: "revenue",
//               yName: "Revenue",
//               tooltip: { enabled: true },
//             },
//             {
//               type: "line",
//               xKey: "period",
//               yKey: "grossMargin",
//               yName: "Gross Margin",
//               tooltip: { enabled: true },
//             },
//             {
//               type: "line",
//               xKey: "period",
//               yKey: "netProfit",
//               yName: "Net Profit",
//               tooltip: { enabled: true },
//             },
//           ],
//           axes: [
//             { type: "category", position: "bottom", title: { text: "Period" } },
//             { type: "number", position: "left", title: { text: "Amount ($)" } },
//           ],
//           listeners: {
//             seriesNodeClick: ({ datum, yKey }) => {
//               if (datum && datum.period) {
//                 handleDrillDown("line", datum.period, datum[yKey], yKey);
//               }
//             },
//           }
//         } : null;

//         // Process bar chart data
//         let barData = barResult.success ? barResult.data || [] : [];
        
//         // Apply grouping if needed (not applicable for bar chart as it uses period)
        
//         const barOpts = barData.length ? {
//           title: { text: "Revenue vs Expenses" },
//           data: barData,
//           series: [
//             { 
//               type: "bar", 
//               xKey: "period", 
//               yKey: "revenue", 
//               yName: "Revenue",
//               tooltip: { enabled: true }
//             },
//             { 
//               type: "bar", 
//               xKey: "period", 
//               yKey: "expenses", 
//               yName: "Expenses",
//               tooltip: { enabled: true }
//             },
//           ],
//           axes: [
//             { type: 'category', position: 'bottom', title: { text: 'Period' } },
//             { type: 'number', position: 'left', title: { text: 'Amount ($)' } }
//           ],
//           listeners: {
//             seriesNodeClick: ({ datum, yKey }) => {
//               if (datum && datum.period) {
//                 handleDrillDown('bar', datum.period, datum[yKey], yKey);
//               }
//             }
//           }
//         } : null;

//         // Process pie chart data
//         let pieData: ChartDataPoint[] = [];
//         if (pieResult.success && pieResult.data?.length) {
//           pieData = Object.entries(pieResult.data[0])
//             .map(([key, value]) => ({ label: key, value: value as number }));
//         }
        
//         // Apply grouping if needed (not applicable for this pie chart as it doesn't use dimensions)
        
//         const pieOpts = pieData.length ? {
//           title: { text: "Financial Distribution" },
//           data: pieData,
//           series: [{ 
//             type: "pie", 
//             angleKey: "value", 
//             labelKey: "label",
//             tooltip: { enabled: true },
//             calloutLabel: { enabled: true },
//             listeners: {
//               nodeClick: (event) => {
//                 const { datum } = event;
//                 if (datum) {
//                   handleDrillDown('pie', datum.label, datum.value, 'financialDistribution');
//                 }
//               }
//             }
//           }],
//         } : null;

//         // Process donut chart data with grouping
//         let donutData = donutResult.success ? donutResult.data || [] : [];
        
//         // Apply grouping for catAccountingView dimension
//         if (groups.catAccountingView && groups.catAccountingView.length > 0) {
//           donutData = applyGroupTransformations(donutData, 'catAccountingView');
//           donutData = combineDataByGroup(donutData, 'catAccountingView');
//         }
        
//         const donutOpts = donutData.length ? {
//           title: { text: "Revenue by Category" },
//           data: donutData,
//           series: [{ 
//             type: "donut", 
//             angleKey: "revenue", 
//             labelKey: "catAccountingView",
//             tooltip: { enabled: true },
//             calloutLabel: { enabled: true },
//             listeners: {
//               nodeClick: (event) => {
//                 const { datum } = event;
//                 if (datum) {
//                   handleDrillDown('donut', datum.catAccountingView, datum.revenue, 'categoryRevenue');
//                 }
//               }
//             }
//           }],
//         } : null;

//         // Update all chart data and options
//         setChartData({
//           line: lineData,
//           bar: barData,
//           pie: pieData,
//           donut: donutData,
//           drillDown: []
//         });
        
//         setChartOptions({
//           line: lineOpts as any,
//           bar: barOpts as any,
//           pie: pieOpts as any,
//           donut: donutOpts as any,
//           drillDown: null
//         });

//       } catch (err) {
//         setError(err instanceof Error ? err.message : "Unknown error occurred");
//         console.error("Error fetching chart data:", err);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchChartData();
//   }, [selectedYear, isDataLoaded, executeQuery, groups]);

//   // Handle drill down
//   const handleDrillDown = async (chartType: string, category: string, value: any, dataType: string) => {
//     if (!isDataLoaded) return;
    
//     setIsLoading(true);
//     setError(null);
//     const whereClause = selectedYear !== "all" ? `AND fiscalYear = '${selectedYear}'` : "";
    
//     try {
//       let query = "";
//       let title = "";
//       let dimensionToGroup = ""; // Dimension that will be used for grouping in drill-down
      
//       switch (chartType) {
//         case 'bar':
//           if (dataType === 'revenue') {
//             query = `SELECT fiscalYear, catFinancialView, SUM(revenue) as value 
//                      FROM financial_data 
//                      WHERE period = '${category}' ${whereClause}
//                      GROUP BY fiscalYear, catFinancialView
//                      ORDER BY fiscalYear, value DESC`;
//             title = `Revenue Breakdown for Period: ${category}`;
//             dimensionToGroup = "catFinancialView";
//           } else if (dataType === 'expenses') {
//             query = `SELECT fiscalYear, catFinancialView, SUM(operatingExpenses) as value 
//                      FROM financial_data 
//                      WHERE period = '${category}' ${whereClause}
//                      GROUP BY fiscalYear, catFinancialView
//                      ORDER BY fiscalYear, value DESC`;
//             title = `Expenses Breakdown for Period: ${category}`;
//             dimensionToGroup = "catFinancialView";
//           }
//           break;
          
//         case 'line':
//           query = `SELECT fiscalYear, catFinancialView, SUM(${dataType}) as value 
//                    FROM financial_data 
//                    WHERE period = '${category}' ${whereClause}
//                    GROUP BY fiscalYear, catFinancialView
//                    ORDER BY value DESC`;
//           title = `${dataType.charAt(0).toUpperCase() + dataType.slice(1)} Breakdown for Period: ${category}`;
//           dimensionToGroup = "catFinancialView";
//           break;
          
//         case 'donut':
//           // Handle case where category is from a group
//           const isFromGroup = groups.catAccountingView?.some(group => 
//             group.name === category && !dimensions.find(d => d.dimension === 'catAccountingView')?.values.includes(category)
//           );
          
//           if (isFromGroup) {
//             // Find the group that contains this category name
//             const group = groups.catAccountingView.find(g => g.name === category);
//             if (group) {
//               // Create WHERE IN clause with group members
//               const membersStr = group.members.map(m => `'${m}'`).join(',');
//               query = `SELECT fiscalYear, period, country, region, SUM(revenue) as value 
//                        FROM financial_data 
//                        WHERE catAccountingView IN (${membersStr}) ${whereClause}
//                        GROUP BY fiscalYear, period, country, region
//                        ORDER BY value DESC`;
//               title = `Revenue Breakdown for Group: ${category}`;
//               dimensionToGroup = "country"; // We'll group by country/region in this drill-down
//             }
//           } else {
//             query = `SELECT fiscalYear, period, country, region, SUM(revenue) as value 
//                      FROM financial_data 
//                      WHERE catAccountingView = '${category}' ${whereClause}
//                      GROUP BY fiscalYear, period, country, region
//                      ORDER BY value DESC`;
//             title = `Revenue Breakdown for Category: ${category}`;
//             dimensionToGroup = "country"; // We'll group by country/region in this drill-down
//           }
//           break;
          
//         case 'pie':
//           if (dataType === 'financialDistribution') {
//             query = `SELECT catFinancialView, SUM(${category}) as value 
//                      FROM financial_data 
//                      WHERE 1=1 ${whereClause}
//                      GROUP BY catFinancialView
//                      ORDER BY value DESC`;
//             title = `${category} Breakdown by Financial Category`;
//             dimensionToGroup = "catFinancialView";
//           }
//           break;
//       }
      
//       if (query) {
//         const result = await executeQuery(query);
//         if (result.success && result.data && result.data.length > 0) {
//           let drillData = result.data;
          
//           // Apply dimension grouping if this drill-down contains groupable dimensions
//           if (dimensionToGroup && groups[dimensionToGroup] && groups[dimensionToGroup].length > 0) {
//             drillData = applyGroupTransformations(drillData, dimensionToGroup);
//             drillData = combineDataByGroup(drillData, dimensionToGroup);
//           }
          
//           // Create appropriate chart options based on data structure
//           const firstDataPoint = drillData[0];
//           const dataKeys = firstDataPoint ? Object.keys(firstDataPoint) : [];
//           let options: AgChartOptions;
          
//           if (dataKeys.includes('catFinancialView') || dataKeys.includes('country') || dataKeys.includes('region')) {
//             // For bar charts with categories
//             const dimensionKey = dataKeys.find(key => 
//               ['catFinancialView', 'country', 'region'].includes(key)
//             ) || dataKeys[0];
            
//             options = {
//               title: { text: title },
//               data: drillData,
//               series: [{ 
//                 type: 'bar', 
//                 xKey: dimensionKey, 
//                 yKey: 'value',
//                 yName: 'Value',
//                 tooltip: { enabled: true }
//               }],
//               axes: [
//                 { type: 'category', position: 'bottom' },
//                 { type: 'number', position: 'left', title: { text: 'Value ($)' } }
//               ],
//             };
//           } else if (dataKeys.includes('period')) {
//             // For line charts with time periods
//             options = {
//               title: { text: title },
//               data: drillData,
//               series: [{ 
//                 type: 'line', 
//                 xKey: 'period', 
//                 yKey: 'value',
//                 yName: 'Value',
//                 tooltip: { enabled: true }
//               }],
//               axes: [
//                 { type: 'category', position: 'bottom', title: { text: 'Period' } },
//                 { type: 'number', position: 'left', title: { text: 'Value ($)' } }
//               ],
//             };
//           } else {
//             // For pie charts
//             const labelKey = dataKeys.find(key => key !== 'value') || dataKeys[0];
//             options = {
//               title: { text: title },
//               data: drillData,
//               series: [{ 
//                 type: 'pie', 
//                 angleKey: 'value', 
//                 labelKey: labelKey,
//                 tooltip: { enabled: true },
//                 calloutLabel: { enabled: true }
//               }],
//             };
//           }
          
//           // Update drill-down data and options
//           setChartData(prev => ({
//             ...prev,
//             drillDown: drillData
//           }));
          
//           setChartOptions(prev => ({
//             ...prev,
//             drillDown: options
//           }));
          
//           setDrillDown({
//             active: true,
//             chartType,
//             category,
//             title
//           });
//         } else {
//           setError("No data available for this selection");
//         }
//       }
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "Unknown error occurred");
//       console.error("Error in drill-down:", err);
//     } finally {
//       setIsLoading(false);
//     }
//   };
  
//   // Create group handler
//   const handleCreateGroup = (dimension: string, groupName: string, members: string[]) => {
//     if (!dimension || !groupName || members.length === 0) return;
    
//     setGroups(prevGroups => {
//       const updatedGroups = { ...prevGroups };
      
//       // Initialize the dimension array if it doesn't exist
//       if (!updatedGroups[dimension]) {
//         updatedGroups[dimension] = [];
//       }
      
//       // Check if group with this name already exists
//       const existingGroupIndex = updatedGroups[dimension].findIndex(g => g.name === groupName);
      
//       if (existingGroupIndex >= 0) {
//         // Update existing group
//         updatedGroups[dimension][existingGroupIndex] = {
//           name: groupName,
//           members
//         };
//       } else {
//         // Add new group
//         updatedGroups[dimension].push({
//           name: groupName,
//           members
//         });
//       }
      
//       return updatedGroups;
//     });
//   };
  
//   // Delete group handler
//   const handleDeleteGroup = (dimension: string, groupName: string) => {
//     setGroups(prevGroups => {
//       const updatedGroups = { ...prevGroups };
      
//       if (updatedGroups[dimension]) {
//         updatedGroups[dimension] = updatedGroups[dimension].filter(g => g.name !== groupName);
//       }
      
//       return updatedGroups;
//     });
//   };

//   return (
//     <section className="p-5">
//       <h1 className="text-2xl font-bold text-center mb-4">Financial Dashboard - Ag Charts</h1>
//       <FilterBar 
//         years={years} 
//         selectedYear={selectedYear} 
//         onYearChange={setSelectedYear} 
//         onResetDrillDown={resetDrillDown}
//         isDrilled={drillDown.active}
//         onOpenGroupModal={() => setIsGroupModalOpen(true)}
//       />
      
//       {/* Group Management UI */}
//       <GroupManagement 
//         groups={groups}
//         onDeleteGroup={handleDeleteGroup}
//       />
      
//       {/* Group Creation Modal */}
//       <GroupModal
//         isOpen={isGroupModalOpen}
//         onClose={() => setIsGroupModalOpen(false)}
//         dimensions={dimensions}
//         onCreateGroup={handleCreateGroup}
//       />
      
//       {error && <p className="text-red-500 mb-2">{error}</p>}
//       {isLoading && <p className="text-gray-500 mb-2">Loading...</p>}
      
//       {drillDown.active ? (
//         // Use the separated drill-down component
//         <DrillDownChart
//           drillDownState={drillDown}
//           drillDownData={chartData.drillDown}
//           drillDownOptions={chartOptions.drillDown}
//           onBack={resetDrillDown}
//         />
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           {chartOptions.line && (
//             <ChartContainer title="Line Series" data={chartData.line}>
//               <AgCharts options={chartOptions.line} />
//             </ChartContainer>
//           )}
//           {chartOptions.bar && (
//             <ChartContainer title="Bar Series" data={chartData.bar}>
//               <AgCharts options={chartOptions.bar} />
//             </ChartContainer>
//           )}
//           {chartOptions.pie && (
//             <ChartContainer title="Pie Series" data={chartData.pie}>
//               <AgCharts options={chartOptions.pie} />
//             </ChartContainer>
//           )}
//           {chartOptions.donut && (
//             <ChartContainer title="Donut Series" data={chartData.donut}>
//               <AgCharts options={chartOptions.donut} />
//             </ChartContainer>
//           )}
//           <p className="col-span-1 md:col-span-2 text-sm text-gray-500">
//             <i>Click on any chart element to drill down into more detailed data, or use the "Create Group" button to create dimension groups</i>
//           </p>
//         </div>
//       )}
//     </section>
//   );
// };

// export default AgChartsPage;

// "use client";
// import React, { useState, useEffect, useRef } from "react";
// import { AgCharts } from "ag-charts-react";
// import { useDuckDBContext } from "../_providers/DuckDBContext";
// import { AgChartOptions } from "ag-charts-community";
// import { GroupModal} from "./GroupManagement";

// // Core data types
// interface ChartDataPoint {
//   period?: string;
//   revenue?: number;
//   expenses?: number;
//   grossMargin?: number;
//   netProfit?: number;
//   catAccountingView?: string;
//   label?: string;
//   value?: number;
//   country?: string;
//   region?: string;
//   [key: string]: any;
// }

// // Common props for components
// interface CommonProps {
//   title: string;
//   data?: any[];
//   onDrillDown?: (type: string, category: string, value: any, dataType: string) => void;
// }

// // Drill-down state interface
// interface DrillDownState {
//   active: boolean;
//   chartType: string;
//   category: string;
//   title: string;
// }

// // Group definition interface
// interface GroupDefinition {
//   name: string;
//   members: string[];
// }

// // Chart container component
// const ChartContainer: React.FC<CommonProps & {
//   children: React.ReactNode;
//   isDrilled?: boolean;
//   onBack?: () => void;
// }> = ({ title, children, data, isDrilled, onBack }) => {
//   const chartRef = useRef<HTMLDivElement>(null);

//   // Export to CSV function
//   const exportToCSV = () => {
//     if (!data || !data.length) return;
    
//     const headers = Object.keys(data[0]).join(',');
//     const rows = data.map(row => Object.values(row).join(',')).join('\n');
//     const csv = `${headers}\n${rows}`;
    
//     const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
//     const url = URL.createObjectURL(blob);
//     const link = document.createElement('a');
//     link.setAttribute('href', url);
//     link.setAttribute('download', `chart_data.csv`);
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//   };

//   // PNG export function
//   const exportToPNG = () => {
//     const chartElement = chartRef.current;
//     if (!chartElement) return;
    
//     const canvas = chartElement.querySelector('canvas');
    
//     if (canvas) {
//       try {
//         const image = canvas.toDataURL('image/png');
//         const link = document.createElement('a');
//         link.download = 'chart.png';
//         link.href = image;
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);
//       } catch (err) {
//         console.error("Failed to export chart:", err);
//         alert("Could not export chart as PNG. Please try again.");
//       }
//     } else {
//       alert("Chart is not ready for export. Please try again.");
//     }
//   };

//   return (
//     <div className="bg-white p-6 rounded-lg shadow-md">
//       <div className="flex justify-between items-center mb-2">
//         <div className="flex items-center">
//           <h2 className="text-xl font-semibold">{title}</h2>
//           {isDrilled && (
//             <button
//               onClick={onBack}
//               className="ml-3 px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
//             >
//               ↩ Back
//             </button>
//           )}
//         </div>
//         <div className="flex space-x-2">
//           <button 
//             onClick={exportToPNG}
//             className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
//           >
//             PNG
//           </button>
//           <button 
//             onClick={exportToCSV}
//             className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
//           >
//             CSV
//           </button>
//         </div>
//       </div>
//       <div ref={chartRef}>
//         {children}
//       </div>
//     </div>
//   );
// };

// // Filter bar component enhanced with grouping
// const FilterBar: React.FC<{
//   years: string[];
//   selectedYear: string;
//   onYearChange: (year: string) => void;
//   onResetDrillDown?: () => void;
//   isDrilled: boolean;
//   onOpenGroupModal: () => void;
// }> = ({ years, selectedYear, onYearChange, onResetDrillDown, isDrilled, onOpenGroupModal }) => (
//   <div className="mb-6 flex items-center flex-wrap gap-2">
//     <label className="mr-2 font-medium">Year:</label>
//     <select
//       value={selectedYear}
//       onChange={(e) => onYearChange(e.target.value)}
//       className="border border-gray-300 rounded px-3 py-2"
//     >
//       <option value="all">All Years</option>
//       {years.map((year) => (
//         <option key={year} value={year}>
//           {year}
//         </option>
//       ))}
//     </select>
    
//     {isDrilled && (
//       <button
//         onClick={onResetDrillDown}
//         className="px-3 py-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
//       >
//         Reset Drill Down
//       </button>
//     )}
    
//     <button
//       onClick={onOpenGroupModal}
//       className="ml-auto px-3 py-2 shadow-xl border border-gray-500 bg-blue-500 text-white rounded"
//     >
//       Create Group
//     </button>
//   </div>
// );


// // Separated Drill Down Component
// const DrillDownChart: React.FC<{
//   drillDownState: DrillDownState;
//   drillDownData: any[];
//   drillDownOptions: AgChartOptions | null;
//   onBack: () => void;
// }> = ({ drillDownState, drillDownData, drillDownOptions, onBack }) => {
//   return (
//     <div className="mb-4">
//       <ChartContainer 
//         title={drillDownState.title} 
//         data={drillDownData}
//         onBack={onBack}
//         isDrilled={true}
//       >
//         {drillDownOptions && <AgCharts options={drillDownOptions} />}
//       </ChartContainer>
//       <p className="mt-2 text-sm text-gray-500">
//         <i>Click any data point for further drill-down, or use the back button to return</i>
//       </p>
//     </div>
//   );
// };


// // Main AG Charts Page Component
// const AgChartsPage: React.FC = () => {
//   const { executeQuery, isDataLoaded } = useDuckDBContext();
//   const [selectedYear, setSelectedYear] = useState<string>("all");
//   const [years, setYears] = useState<string[]>([]);
//   const [error, setError] = useState<string | null>(null);
//   const [isLoading, setIsLoading] = useState<boolean>(true);
//   const [isGroupModalOpen, setIsGroupModalOpen] = useState<boolean>(false);
  
//   // Available dimensions for grouping
//   const [dimensions, setDimensions] = useState<{ dimension: string; values: string[] }[]>([]);
//   // Groups state - stores created dimension groups
//   const [groups, setGroups] = useState<Record<string, GroupDefinition[]>>({});

//   // Drill down state
//   const [drillDown, setDrillDown] = useState<DrillDownState>({
//     active: false,
//     chartType: "",
//     category: "",
//     title: ""
//   });

//   // Chart data states
//   const [chartData, setChartData] = useState<{
//     line: ChartDataPoint[],
//     bar: ChartDataPoint[],
//     pie: ChartDataPoint[],
//     donut: ChartDataPoint[],
//     drillDown: any[]
//   }>({
//     line: [],
//     bar: [],
//     pie: [],
//     donut: [],
//     drillDown: []
//   });

//   // Chart options states
//   const [chartOptions, setChartOptions] = useState<{
//     line: AgChartOptions | null,
//     bar: AgChartOptions | null,
//     pie: AgChartOptions | null,
//     donut: AgChartOptions | null,
//     drillDown: AgChartOptions | null
//   }>({
//     line: null,
//     bar: null,
//     pie: null,
//     donut: null,
//     drillDown: null
//   });

//   // Reset drill down
//   const resetDrillDown = () => {
//     setDrillDown({
//       active: false,
//       chartType: "",
//       category: "",
//       title: ""
//     });
//   };
//   // Fetch years for year filter
//   useEffect(() => {
//     if (!isDataLoaded) return;

//     const fetchYears = async () => {
//       try {
//         const result = await executeQuery("SELECT DISTINCT fiscalYear FROM financial_data ORDER BY fiscalYear");
//         if (result.success && result.data) {
//           setYears(result.data.map((row: { fiscalYear: string }) => row.fiscalYear));
//         }
//       } catch (err) {
//         console.error("Failed to fetch years:", err);
//         setError("Failed to load year data");
//       }
//     };

//     fetchYears();
//   }, [isDataLoaded, executeQuery]);
//   // Main data fetching effect
//   useEffect(() => {
//     if (!isDataLoaded) return;

//     const fetchChartData = async () => {
//       setIsLoading(true);
//       setError(null);
//       const whereClause = selectedYear !== "all" ? `WHERE fiscalYear = '${selectedYear}'` : "";

//       try {
//         const [lineResult, barResult, pieResult, donutResult] = await Promise.all([
//           executeQuery(`SELECT period, AVG(revenue) as revenue, AVG(grossMargin) as grossMargin, AVG(netProfit) as netProfit FROM financial_data ${whereClause} GROUP BY period ORDER BY period`),
//           executeQuery(`SELECT period, SUM(revenue) as revenue, SUM(operatingExpenses) as expenses FROM financial_data ${whereClause} GROUP BY period ORDER BY period`),
//           executeQuery(`SELECT SUM(grossMargin) as grossMargin, SUM(operatingExpenses) as operatingExpenses, SUM(netProfit) as netProfit, SUM(revenue) as revenue FROM financial_data ${whereClause}`),
//           executeQuery(`SELECT catAccountingView, SUM(revenue) as revenue FROM financial_data ${whereClause} GROUP BY catAccountingView ORDER BY revenue DESC`)
//         ]);

//         // Process line chart data
//         let lineData = lineResult.success ? lineResult.data || [] : [];
        
//         // Apply grouping if needed (not applicable for line chart as it doesn't use dimension groups)
        
//         const lineOpts = lineData.length ? {
//           title: { text: "Profit & Loss Accounts" },
//           subtitle: { text: "Showing numbers in $" },
//           data: lineData,
//           series: [
//             {
//               type: "line",
//               xKey: "period",
//               yKey: "revenue",
//               yName: "Revenue",
//               tooltip: { enabled: true },
//             },
//             {
//               type: "line",
//               xKey: "period",
//               yKey: "grossMargin",
//               yName: "Gross Margin",
//               tooltip: { enabled: true },
//             },
//             {
//               type: "line",
//               xKey: "period",
//               yKey: "netProfit",
//               yName: "Net Profit",
//               tooltip: { enabled: true },
//             },
//           ],
//           axes: [
//             { type: "category", position: "bottom", title: { text: "Period" } },
//             { type: "number", position: "left", title: { text: "Amount ($)" } },
//           ],
//           listeners: {
//             seriesNodeClick: ({ datum, yKey }) => {
//               if (datum && datum.period) {
//                 handleDrillDown("line", datum.period, datum[yKey], yKey);
//               }
//             },
//           }
//         } : null;

//         // Process bar chart data
//         let barData = barResult.success ? barResult.data || [] : [];
        
//         // Apply grouping if needed (not applicable for bar chart as it uses period)
        
//         const barOpts = barData.length ? {
//           title: { text: "Revenue vs Expenses" },
//           data: barData,
//           series: [
//             { 
//               type: "bar", 
//               xKey: "period", 
//               yKey: "revenue", 
//               yName: "Revenue",
//               tooltip: { enabled: true }
//             },
//             { 
//               type: "bar", 
//               xKey: "period", 
//               yKey: "expenses", 
//               yName: "Expenses",
//               tooltip: { enabled: true }
//             },
//           ],
//           axes: [
//             { type: 'category', position: 'bottom', title: { text: 'Period' } },
//             { type: 'number', position: 'left', title: { text: 'Amount ($)' } }
//           ],
//           listeners: {
//             seriesNodeClick: ({ datum, yKey }) => {
//               if (datum && datum.period) {
//                 handleDrillDown('bar', datum.period, datum[yKey], yKey);
//               }
//             }
//           }
//         } : null;

//         // Process pie chart data
//         let pieData: ChartDataPoint[] = [];
//         if (pieResult.success && pieResult.data?.length) {
//           pieData = Object.entries(pieResult.data[0])
//             .map(([key, value]) => ({ label: key, value: value as number }));
//         }
        
//         // Apply grouping if needed (not applicable for this pie chart as it doesn't use dimensions)
        
//         const pieOpts = pieData.length ? {
//           title: { text: "Financial Distribution" },
//           data: pieData,
//           series: [{ 
//             type: "pie", 
//             angleKey: "value", 
//             labelKey: "label",
//             tooltip: { enabled: true },
//             calloutLabel: { enabled: true },
//             listeners: {
//               nodeClick: (event) => {
//                 const { datum } = event;
//                 if (datum) {
//                   handleDrillDown('pie', datum.label, datum.value, 'financialDistribution');
//                 }
//               }
//             }
//           }],
//         } : null;

//         // Process donut chart data with grouping
//         let donutData = donutResult.success ? donutResult.data || [] : [];
        
//         // Apply grouping for catAccountingView dimension
//         if (groups.catAccountingView && groups.catAccountingView.length > 0) {
//           donutData = applyGroupTransformations(donutData, 'catAccountingView');
//           donutData = combineDataByGroup(donutData, 'catAccountingView');
//         }
        
//         const donutOpts = donutData.length ? {
//           title: { text: "Revenue by Category" },
//           data: donutData,
//           series: [{ 
//             type: "donut", 
//             angleKey: "revenue", 
//             labelKey: "catAccountingView",
//             tooltip: { enabled: true },
//             calloutLabel: { enabled: true },
//             listeners: {
//               nodeClick: (event) => {
//                 const { datum } = event;
//                 if (datum) {
//                   handleDrillDown('donut', datum.catAccountingView, datum.revenue, 'categoryRevenue');
//                 }
//               }
//             }
//           }],
//         } : null;

//         // Update all chart data and options
//         setChartData({
//           line: lineData,
//           bar: barData,
//           pie: pieData,
//           donut: donutData,
//           drillDown: []
//         });
        
//         setChartOptions({
//           line: lineOpts as any,
//           bar: barOpts as any,
//           pie: pieOpts as any,
//           donut: donutOpts as any,
//           drillDown: null
//         });

//       } catch (err) {
//         setError(err instanceof Error ? err.message : "Unknown error occurred");
//         console.error("Error fetching chart data:", err);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchChartData();
//   }, [selectedYear, isDataLoaded, executeQuery, groups]);

//   // Handle drill down
//   const handleDrillDown = async (chartType: string, category: string, value: any, dataType: string) => {
//     if (!isDataLoaded) return;
    
//     setIsLoading(true);
//     setError(null);
//     const whereClause = selectedYear !== "all" ? `AND fiscalYear = '${selectedYear}'` : "";
    
//     try {
//       let query = "";
//       let title = "";
//       let dimensionToGroup = ""; // Dimension that will be used for grouping in drill-down
      
//       switch (chartType) {
//         case 'bar':
//           if (dataType === 'revenue') {
//             query = `SELECT fiscalYear, catFinancialView, SUM(revenue) as value 
//                      FROM financial_data 
//                      WHERE period = '${category}' ${whereClause}
//                      GROUP BY fiscalYear, catFinancialView
//                      ORDER BY fiscalYear, value DESC`;
//             title = `Revenue Breakdown for Period: ${category}`;
//             dimensionToGroup = "catFinancialView";
//           } else if (dataType === 'expenses') {
//             query = `SELECT fiscalYear, catFinancialView, SUM(operatingExpenses) as value 
//                      FROM financial_data 
//                      WHERE period = '${category}' ${whereClause}
//                      GROUP BY fiscalYear, catFinancialView
//                      ORDER BY fiscalYear, value DESC`;
//             title = `Expenses Breakdown for Period: ${category}`;
//             dimensionToGroup = "catFinancialView";
//           }
//           break;
          
//         case 'line':
//           query = `SELECT fiscalYear, catFinancialView, SUM(${dataType}) as value 
//                    FROM financial_data 
//                    WHERE period = '${category}' ${whereClause}
//                    GROUP BY fiscalYear, catFinancialView
//                    ORDER BY value DESC`;
//           title = `${dataType.charAt(0).toUpperCase() + dataType.slice(1)} Breakdown for Period: ${category}`;
//           dimensionToGroup = "catFinancialView";
//           break;
          
//         case 'donut':
//           // Handle case where category is from a group
//           const isFromGroup = groups.catAccountingView?.some(group => 
//             group.name === category && !dimensions.find(d => d.dimension === 'catAccountingView')?.values.includes(category)
//           );
          
//           if (isFromGroup) {
//             // Find the group that contains this category name
//             const group = groups.catAccountingView.find(g => g.name === category);
//             if (group) {
//               // Create WHERE IN clause with group members
//               const membersStr = group.members.map(m => `'${m}'`).join(',');
//               query = `SELECT fiscalYear, period, country, region, SUM(revenue) as value 
//                        FROM financial_data 
//                        WHERE catAccountingView IN (${membersStr}) ${whereClause}
//                        GROUP BY fiscalYear, period, country, region
//                        ORDER BY value DESC`;
//               title = `Revenue Breakdown for Group: ${category}`;
//               dimensionToGroup = "country"; // We'll group by country/region in this drill-down
//             }
//           } else {
//             query = `SELECT fiscalYear, period, country, region, SUM(revenue) as value 
//                      FROM financial_data 
//                      WHERE catAccountingView = '${category}' ${whereClause}
//                      GROUP BY fiscalYear, period, country, region
//                      ORDER BY value DESC`;
//             title = `Revenue Breakdown for Category: ${category}`;
//             dimensionToGroup = "country"; // We'll group by country/region in this drill-down
//           }
//           break;
          
//         case 'pie':
//           if (dataType === 'financialDistribution') {
//             query = `SELECT catFinancialView, SUM(${category}) as value 
//                      FROM financial_data 
//                      WHERE 1=1 ${whereClause}
//                      GROUP BY catFinancialView
//                      ORDER BY value DESC`;
//             title = `${category} Breakdown by Financial Category`;
//             dimensionToGroup = "catFinancialView";
//           }
//           break;
//       }
      
//       if (query) {
//         const result = await executeQuery(query);
//         if (result.success && result.data && result.data.length > 0) {
//           let drillData = result.data;
          
//           // Apply dimension grouping if this drill-down contains groupable dimensions
//           if (dimensionToGroup && groups[dimensionToGroup] && groups[dimensionToGroup].length > 0) {
//             drillData = applyGroupTransformations(drillData, dimensionToGroup);
//             drillData = combineDataByGroup(drillData, dimensionToGroup);
//           }
          
//           // Create appropriate chart options based on data structure
//           const firstDataPoint = drillData[0];
//           const dataKeys = firstDataPoint ? Object.keys(firstDataPoint) : [];
//           let options: AgChartOptions;
          
//           if (dataKeys.includes('catFinancialView') || dataKeys.includes('country') || dataKeys.includes('region')) {
//             // For bar charts with categories
//             const dimensionKey = dataKeys.find(key => 
//               ['catFinancialView', 'country', 'region'].includes(key)
//             ) || dataKeys[0];
            
//             options = {
//               title: { text: title },
//               data: drillData,
//               series: [{ 
//                 type: 'bar', 
//                 xKey: dimensionKey, 
//                 yKey: 'value',
//                 yName: 'Value',
//                 tooltip: { enabled: true }
//               }],
//               axes: [
//                 { type: 'category', position: 'bottom' },
//                 { type: 'number', position: 'left', title: { text: 'Value ($)' } }
//               ],
//             };
//           } else if (dataKeys.includes('period')) {
//             // For line charts with time periods
//             options = {
//               title: { text: title },
//               data: drillData,
//               series: [{ 
//                 type: 'line', 
//                 xKey: 'period', 
//                 yKey: 'value',
//                 yName: 'Value',
//                 tooltip: { enabled: true }
//               }],
//               axes: [
//                 { type: 'category', position: 'bottom', title: { text: 'Period' } },
//                 { type: 'number', position: 'left', title: { text: 'Value ($)' } }
//               ],
//             };
//           } else {
//             // For pie charts
//             const labelKey = dataKeys.find(key => key !== 'value') || dataKeys[0];
//             options = {
//               title: { text: title },
//               data: drillData,
//               series: [{ 
//                 type: 'pie', 
//                 angleKey: 'value', 
//                 labelKey: labelKey,
//                 tooltip: { enabled: true },
//                 calloutLabel: { enabled: true }
//               }],
//             };
//           }
          
//           // Update drill-down data and options
//           setChartData(prev => ({
//             ...prev,
//             drillDown: drillData
//           }));
          
//           setChartOptions(prev => ({
//             ...prev,
//             drillDown: options
//           }));
          
//           setDrillDown({
//             active: true,
//             chartType,
//             category,
//             title
//           });
//         } else {
//           setError("No data available for this selection");
//         }
//       }
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "Unknown error occurred");
//       console.error("Error in drill-down:", err);
//     } finally {
//       setIsLoading(false);
//     }
//   };
  
//   // Create group handler
//   const handleCreateGroup = (groupName: string, selections: { dimension: string; members: string[] }[]) => {
//     if (!groupName || !selections.length) return;
  
//     setGroups(prevGroups => {
//       const updated = { ...prevGroups };
  
//       selections.forEach(({ dimension, members }) => {
//         if (!dimension || !members.length) return;
  
//         const existing = updated[dimension] || [];
//         const index = existing.findIndex(g => g.name === groupName);
  
//         const groupEntry = { name: groupName, members };
  
//         if (index >= 0) {
//           existing[index] = groupEntry;
//         } else {
//           existing.push(groupEntry);
//         }
  
//         updated[dimension] = existing;
//       });
  
//       return updated;
//     });
//   };  
  
  

//   return (
//     <section className="p-5">
//       <h1 className="text-2xl font-bold text-center mb-4">Financial Dashboard - Ag Charts</h1>
//       <FilterBar 
//         years={years} 
//         selectedYear={selectedYear} 
//         onYearChange={setSelectedYear} 
//         onResetDrillDown={resetDrillDown}
//         isDrilled={drillDown.active}
//         onOpenGroupModal={() => setIsGroupModalOpen(true)}
//       />
      
      
//       {/* Group Creation Modal */}
//       <GroupModal
//         isOpen={isGroupModalOpen}
//         onClose={() => setIsGroupModalOpen(false)}
//         onCreateGroup={handleCreateGroup}
//       />
      
//       {error && <p className="text-red-500 mb-2">{error}</p>}
//       {isLoading && <p className="text-gray-500 mb-2">Loading...</p>}
      
//       {drillDown.active ? (
//         // Use the separated drill-down component
//         <DrillDownChart
//           drillDownState={drillDown}
//           drillDownData={chartData.drillDown}
//           drillDownOptions={chartOptions.drillDown}
//           onBack={resetDrillDown}
//         />
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           {chartOptions.line && (
//             <ChartContainer title="Line Series" data={chartData.line}>
//               <AgCharts options={chartOptions.line} />
//             </ChartContainer>
//           )}
//           {chartOptions.bar && (
//             <ChartContainer title="Bar Series" data={chartData.bar}>
//               <AgCharts options={chartOptions.bar} />
//             </ChartContainer>
//           )}
//           {chartOptions.pie && (
//             <ChartContainer title="Pie Series" data={chartData.pie}>
//               <AgCharts options={chartOptions.pie} />
//             </ChartContainer>
//           )}
//           {chartOptions.donut && (
//             <ChartContainer title="Donut Series" data={chartData.donut}>
//               <AgCharts options={chartOptions.donut} />
//             </ChartContainer>
//           )}
//           <p className="col-span-1 md:col-span-2 text-sm text-gray-500">
//             <i>Click on any chart element to drill down into more detailed data, or use the "Create Group" button to create dimension groups</i>
//           </p>
//         </div>
//       )}
//     </section>
//   );
// };

// export default AgChartsPage;


// "use client";
// import React, { useEffect, useState, useRef } from "react";
// import Plot from "react-plotly.js";
// import { useDuckDBContext } from "../_providers/DuckDBContext";
// import { GroupModal } from "@/components/GroupManagement";


// interface ChartContainerProps {
//   title: string;
//   children: React.ReactNode;
//   onDownloadCSV?: () => void;
//   onDownloadImage?: () => void;
//   isDrilled?: boolean;
//   onBack?: () => void;
// }

// interface LineChartDataPoint {
//   period: string;
//   revenue: number;
//   grossMargin: number;
//   netProfit: number;
// }

// interface BarChartDataPoint {
//   period: string;
//   revenue: number;
//   expenses: number;
// }

// interface PieChartData {
//   grossMargin: number;
//   opEx: number;
//   netProfit: number;
//   revenue: number;
// }

// interface DonutChartData {
//   catAccountingView: string;
//   revenue: number;
// }

// // Drill-down state interface
// interface DrillDownState {
//   active: boolean;
//   chartType: string;
//   category: string;
//   title: string;
//   dataType?: string;
// }

// type DimensionSelection = {
//   dimension: string;
//   members: string[];
// };

// type Dimensions = {
//   groupName: string;
//   filteredSelections: DimensionSelection[];
// };

// const ChartContainer: React.FC<ChartContainerProps> = ({ 
//   title, 
//   children, 
//   onDownloadCSV, 
//   onDownloadImage,
//   isDrilled,
//   onBack
// }) => (
//   <div className="bg-white p-6 rounded-lg shadow-md">
//     <div className="flex flex-row justify-between items-center">
//       <div className="flex items-center">
//         <h2 className="text-xl font-semibold mb-4">{title}</h2>
//         {isDrilled && (
//           <button
//             onClick={onBack}
//             className="ml-3 px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm mb-4"
//           >
//             ↩ Back
//           </button>
//         )}
//       </div>
//       {(onDownloadCSV || onDownloadImage) && (
//         <div className="flex gap-2 mb-4">
//           {onDownloadImage && (
//             <button onClick={onDownloadImage} className="px-4 py-2 bg-blue-500 text-white rounded">
//               Download Image
//             </button>
//           )}
//           {onDownloadCSV && (
//             <button onClick={onDownloadCSV} className="px-4 py-2 bg-green-500 text-white rounded">
//               Download CSV
//             </button>
//           )}
//         </div>
//       )}
//     </div>
//     <div className="">{children}</div>
//   </div>
// );

// // Drill Down Chart Component
// const DrillDownChart: React.FC<{
//   drillDownState: DrillDownState;
//   drillDownData: any;
//   onBack: () => void;
// }> = ({ drillDownState, drillDownData, onBack }) => {
//   const plotRef = useRef<any>(null);
  
//   // Function to handle image download
//   const handleDownloadImage = () => {
//     if (plotRef.current) {
//       const plotElement = plotRef.current.el;
//       Plotly.downloadImage(plotElement, {
//         format: 'png',
//         filename: `${drillDownState.title.replace(/\s+/g, "_").toLowerCase()}`
//       });
//     }
//   };
  
//   // Function to handle CSV download
//   const handleDownloadCSV = () => {
//     if (!drillDownData) return;
    
//     let csvContent = "data:text/csv;charset=utf-8,";
    
//     // Handle different chart types
//     if (drillDownState.chartType === 'bar' || drillDownState.chartType === 'line') {
//       // Get x-axis values
//       const xValues = drillDownData[0].x;
//       csvContent += ["Category", ...xValues].join(",") + "\n";
      
//       // Add data for each trace
//       drillDownData.forEach((trace: any) => {
//         csvContent += [trace.name, ...trace.y].join(",") + "\n";
//       });
//     } else if (drillDownState.chartType === 'pie') {
//       csvContent += "Label,Value\n";
//       drillDownData[0].labels.forEach((label: string, i: number) => {
//         csvContent += `${label},${drillDownData[0].values[i]}\n`;
//       });
//     }
    
//     const encodedUri = encodeURI(csvContent);
//     const link = document.createElement("a");
//     link.setAttribute("href", encodedUri);
//     link.setAttribute("download", `${drillDownState.title.replace(/\s+/g, "_").toLowerCase()}.csv`);
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//   };

//   // Render the appropriate chart based on drill-down state
//   const renderDrillDownChart = () => {
//     switch (drillDownState.chartType) {
//       case 'line':
//         return (
//           <Plot
//             ref={plotRef}
//             data={drillDownData}
//             layout={{ 
//               title: drillDownState.title,
//               autosize: true
//             }}
//             style={{ width: "100%", height: "100%" }}
//             config={{ responsive: true }}
//           />
//         );
//       case 'bar':
//         return (
//           <Plot
//             ref={plotRef}
//             data={drillDownData}
//             layout={{ 
//               title: drillDownState.title,
//               barmode: 'group',
//               autosize: true
//             }}
//             style={{ width: "100%", height: "100%" }}
//             config={{ responsive: true }}
//           />
//         );
//       case 'pie':
//         return (
//           <Plot
//             ref={plotRef}
//             data={drillDownData}
//             layout={{ 
//               title: drillDownState.title,
//               autosize: true
//             }}
//             style={{ width: "100%", height: "100%" }}
//             config={{ responsive: true }}
//           />
//         );
//       default:
//         return (
//           <Plot
//             ref={plotRef}
//             data={drillDownData}
//             layout={{ 
//               title: drillDownState.title,
//               autosize: true
//             }}
//             style={{ width: "100%", height: "100%" }}
//             config={{ responsive: true }}
//           />
//         );
//     }
//   };

//   return (
//     <ChartContainer 
//       title={drillDownState.title}
//       onDownloadCSV={handleDownloadCSV}
//       onDownloadImage={handleDownloadImage}
//       isDrilled={true}
//       onBack={onBack}
//     >
//       {renderDrillDownChart()}
//     </ChartContainer>
//   );
// };

// export default function ReactPlotly() {
//   const { executeQuery, isDataLoaded } = useDuckDBContext();
//   const [isLoading, setIsLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);

//   const [lineChartData, setLineChartData] = useState<LineChartDataPoint[]>([]);
//   const [barChartData, setBarChartData] = useState<BarChartDataPoint[]>([]);
//   const [pieChartData, setPieChartData] = useState<PieChartData | null>(null);
//   const [donutChartData, setDonutChartData] = useState<DonutChartData[]>([]);
  
//   // Refs for chart components
//   const linePlotRef = useRef<any>(null);
//   const barPlotRef = useRef<any>(null);
//   const piePlotRef = useRef<any>(null);
//   const donutPlotRef = useRef<any>(null);

//   // Drill-down state
//   const [drillDown, setDrillDown] = useState<DrillDownState>({
//     active: false,
//     chartType: "",
//     category: "",
//     title: ""
//   });
//   const [drillDownData, setDrillDownData] = useState<any>(null);
  
//   // Group management
//   const [isGroupModalOpen, setIsGroupModalOpen] = useState<boolean>(false);
//   const [dimensions, setDimensions] = useState<Dimensions | null>(null);
  
//   // Reset drill down state
//   const resetDrillDown = () => {
//     setDrillDown({
//       active: false,
//       chartType: "",
//       category: "",
//       title: ""
//     });
//     setDrillDownData(null);
//   };
  
//   const handleCreateGroup = (datas: any) => {
//     setDimensions(datas);
//   };

//   useEffect(() => {
//     if (!isDataLoaded) return;

//     const fetchChartData = async () => {
//       setIsLoading(true);
      
//       const months: { [key: string]: string } = {
//         "January": "01",
//         "February": "02",
//         "March": "03",
//         "April": "04",
//         "May": "05",
//         "June": "06",
//         "July": "07",
//         "August": "08",
//         "September": "09",
//         "October": "10",
//         "November": "11",
//         "December": "12"
//       };
      
//       // Construct where clause based on dimensions or selected year
//       // @ts-ignore
//       const whereClause = dimensions?.filteredSelections?.length > 0
//       ? `WHERE ${dimensions?.filteredSelections?.map((dim) => {
//         if (dim.dimension.toLowerCase() === "period") {
//           // Convert month names like "January" to "01"
//           const selectedMonths = dim.members.map(month => months[month]);

//           const yearSelection = dimensions.filteredSelections.find(
//             d => d.dimension.toLowerCase() === "fiscalyear"
//           );
//           const selectedYears = yearSelection ? yearSelection.members : [];

//           if (selectedYears.length === 0) {
//             // No year selected, filter by month part only
//             return `(${selectedMonths.map(month =>
//               `SUBSTR(CAST(period AS TEXT), 5, 2) = '${month}'`
//             ).join(" OR ")})`;
//           }

//           const fullPeriods = selectedYears.flatMap(year =>
//             selectedMonths.map(month => `'${year}${month}'`)
//           );

//           return `period IN (${fullPeriods.join(", ")})`;
//         } else {
//           const members = dim.members.map((member: string) => `'${member}'`).join(", ");
//           return `${dim.dimension.toLowerCase()} IN (${members})`;
//         }
//       }).join(" AND ")}`
//       : "";
//       try {
//         const [lineRes, barRes, pieRes, donutRes] = await Promise.all([
//           executeQuery(`
//             SELECT period, AVG(revenue) as revenue, AVG(grossMargin) as grossMargin, AVG(netProfit) as netProfit 
//             FROM financial_data ${whereClause}
//             GROUP BY period ORDER BY period
//           `),
//           executeQuery(`
//             SELECT period, SUM(revenue) as revenue, SUM(operatingExpenses) as expenses 
//             FROM financial_data ${whereClause}
//             GROUP BY period ORDER BY period
//           `),
//           executeQuery(`
//             SELECT 
//               AVG(grossMargin) as grossMargin, 
//               AVG(operatingExpenses) as opEx, 
//               AVG(netProfit) as netProfit, 
//               AVG(revenue) as revenue 
//             FROM financial_data ${whereClause}
//           `),
//           executeQuery(`
//             SELECT 
//               catAccountingView, 
//               SUM(revenue) as revenue 
//             FROM financial_data ${whereClause}
//             GROUP BY catAccountingView
//           `),

//         ]);

//         if (lineRes.success) setLineChartData(lineRes.data as LineChartDataPoint[]);
//         if (barRes.success) setBarChartData(barRes.data as BarChartDataPoint[]);
//         if (pieRes.success && pieRes.data) setPieChartData(pieRes.data[0] as PieChartData);
//         if (donutRes.success) setDonutChartData(donutRes.data as DonutChartData[]);
    
//         setError(null);
//       } catch (err) {
//         setError("Failed to load chart data.");
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchChartData();
//   }, [dimensions, isDataLoaded, executeQuery]);

//   // Handle drill down for line chart
//   const handleLineChartClick = async (data: any) => {
//     console.log(data, "line chart data");
    
//     if (!data || !data.points || data.points.length === 0) return;
    
//     const point = data.points[0];
//     const period = point.x;
//     const dataType = point.data.name?.toLowerCase() || 'revenue';
    
//     await handleDrillDown('line', period, dataType);
//   };

//   // Handle drill down for bar chart
//   const handleBarChartClick = async (data: any) => {
//     if (!data || !data.points || data.points.length === 0) return;
    
//     const point = data.points[0];
//     const period = point.x;
//     const dataType = point.data.name?.toLowerCase() || 'revenue';
    
//     await handleDrillDown('bar', period, dataType);
//   };

//   // Handle drill down for pie chart
//   const handlePieChartClick = async (data: any) => {
//     if (!data || !data.points || data.points.length === 0) return;
    
//     const point = data.points[0];
//     const dataType = point.label;
    
//     await handleDrillDown('pie', dataType, 'financialDistribution');
//   };

//   // Handle drill down for donut chart
//   const handleDonutChartClick = async (data: any) => {
//     if (!data || !data.points || data.points.length === 0) return;
    
//     const point = data.points[0];
//     const category = point.label;
    
//     await handleDrillDown('donut', category, 'categoryRevenue');
//   };

//  // Generic drill down function
// const handleDrillDown = async (chartType: string, category: string, dataType: string) => {
//   if (!isDataLoaded) return;
  
//   setIsLoading(true);
  
//   // Define months mapping
//   const months: { [key: string]: string } = {
//     "January": "01",
//     "February": "02",
//     "March": "03",
//     "April": "04",
//     "May": "05",
//     "June": "06",
//     "July": "07",
//     "August": "08",
//     "September": "09",
//     "October": "10",
//     "November": "11",
//     "December": "12"
//   };
  
//   // Construct where clause based on dimensions
//   const dimensionsWhereClause = dimensions?.filteredSelections?.length > 0
//     ? dimensions?.filteredSelections?.map((dim) => {
//       if (dim.dimension.toLowerCase() === "period") {
//         // Convert month names like "January" to "01"
//         const selectedMonths = dim.members.map(month => months[month]);

//         const yearSelection = dimensions.filteredSelections.find(
//           d => d.dimension.toLowerCase() === "fiscalyear"
//         );
//         const selectedYears = yearSelection ? yearSelection.members : [];

//         if (selectedYears.length === 0) {
//           // No year selected, filter by month part only
//           return `(${selectedMonths.map(month =>
//             `SUBSTR(CAST(period AS TEXT), 5, 2) = '${month}'`
//           ).join(" OR ")})`;
//         }

//         const fullPeriods = selectedYears.flatMap(year =>
//           selectedMonths.map(month => `'${year}${month}'`)
//         );

//         return `period IN (${fullPeriods.join(", ")})`;
//       } else {
//         const members = dim.members.map((member: string) => `'${member}'`).join(", ");
//         return `${dim.dimension.toLowerCase()} IN (${members})`;
//       }
//     }).join(" AND ")
//     : "";
    
//   try {
//     let query = "";
//     let title = "";
//     let drillChartType = 'bar';
    
//     // Prepare the base WHERE clause - this is the key change
//     let baseWhereClause = ``;
    
//     switch (chartType) {
//       case 'bar':
//         if (dataType === 'revenue') {
//           // Start with the specific filter condition
//           baseWhereClause = `period = '${category}'`;
//           // If we have dimension filters, add them with AND
//           if (dimensionsWhereClause) {
//             baseWhereClause += ` AND ${dimensionsWhereClause}`;
//           }
          
//           query = `SELECT fiscalYear, catFinancialView, SUM(revenue) as value 
//                    FROM financial_data 
//                    GROUP BY fiscalYear, catFinancialView
//                    ORDER BY fiscalYear, value DESC`;
//           title = `Revenue Breakdown for Period: ${category}`;
//           drillChartType = 'bar';
//         } else if (dataType === 'expenses') {
//           baseWhereClause = `period = '${category}'`;
//           if (dimensionsWhereClause) {
//             baseWhereClause += ` AND ${dimensionsWhereClause}`;
//           }
          
//           query = `SELECT fiscalYear, catFinancialView, SUM(operatingExpenses) as value 
//                    FROM financial_data 
//                    GROUP BY fiscalYear, catFinancialView
//                    ORDER BY fiscalYear, value DESC`;
//           title = `Expenses Breakdown for Period: ${category}`;
//           drillChartType = 'bar';
//         }
//         break;
        
//       case 'line':
//         let columnName = dataType.toLowerCase().replace(/\s+/g, '');
//         baseWhereClause = `period = '${category}'`;
//         if (dimensionsWhereClause) {
//           baseWhereClause += ` AND ${dimensionsWhereClause}`;
//         }
        
//         query = `SELECT fiscalYear, catFinancialView, SUM(${columnName}) as value 
//                  FROM financial_data 
//                  GROUP BY fiscalYear, catFinancialView
//                  ORDER BY value DESC`;
//         title = `${dataType.charAt(0).toUpperCase() + dataType.slice(1)} Breakdown for Period: ${category}`;
//         drillChartType = 'bar';
//         break;
        
//       case 'donut':
//         baseWhereClause = `catAccountingView = '${category}'`;
//         if (dimensionsWhereClause) {
//           baseWhereClause += ` AND ${dimensionsWhereClause}`;
//         }
        
//         query = `SELECT fiscalYear, period, SUM(revenue) as value 
//                  FROM financial_data 
//                  GROUP BY fiscalYear, period
//                  ORDER BY fiscalYear, period`;
//         title = `Revenue Breakdown for Category: ${category}`;
//         drillChartType = 'line';
//         break;
        
//       case 'pie':
//         const metricColumn = dataType.toLowerCase().replace(/\s+/g, '');
//         // For pie chart, we might not need a specific filter
//         baseWhereClause = dimensionsWhereClause ? dimensionsWhereClause : "1=1";
        
//         query = `SELECT catFinancialView, SUM(${metricColumn === 'other' ? 'revenue' : metricColumn}) as value 
//                  FROM financial_data 
//                  GROUP BY catFinancialView
//                  ORDER BY value DESC`;
//         title = `${dataType} Breakdown by Financial Category`;
//         drillChartType = 'pie';
//         break;
//     }
    
//     // Execute the query and handle results...
//     if (query) {
//       const result = await executeQuery(query);
//       if (result.success && result.data && result.data.length > 0) {
//         const drillData = result.data;
        
//         // Format data for Plotly based on chart type
//         let formattedData: any = [];
          
//           if (drillChartType === 'bar') {
//             // Group by fiscal year if present
//             if (drillData[0].fiscalYear) {
//               const categories = Array.from(new Set(drillData.map((d: any) => d.catFinancialView)));
//               const fiscalYears = Array.from(new Set(drillData.map((d: any) => d.fiscalYear)));
              
//               formattedData = fiscalYears.map((year: string, idx: number) => {
//                 const yearData = drillData.filter((d: any) => d.fiscalYear === year);
//                 const colorIdx = idx % 6;
//                 const colors = [
//                   'rgb(75, 192, 192)',
//                   'rgb(255, 99, 132)',
//                   'rgb(53, 162, 235)',
//                   'rgb(255, 206, 86)',
//                   'rgb(153, 102, 255)',
//                   'rgb(255, 159, 64)'
//                 ];
                
//                 return {
//                   x: categories,
//                   y: categories.map(cat => {
//                     const match = yearData.find((d: any) => d.catFinancialView === cat);
//                     return match ? match.value : 0;
//                   }),
//                   type: 'bar',
//                   name: `Year ${year}`,
//                   marker: { color: colors[colorIdx] }
//                 };
//               });
//             } else {
//               formattedData = [{
//                 x: drillData.map((d: any) => d.catFinancialView || d.period),
//                 y: drillData.map((d: any) => d.value),
//                 type: 'bar',
//                 name: 'Value',
//                 marker: { color: 'rgb(75, 192, 192)' }
//               }];
//             }
//           } else if (drillChartType === 'line') {
//             // Group by period if present
//             if (drillData[0].period) {
//               const fiscalYears = Array.from(new Set(drillData.map((d: any) => d.fiscalYear)));
//               const periods = Array.from(new Set(drillData.map((d: any) => d.period))).sort();
              
//               formattedData = fiscalYears.map((year: string, idx: number) => {
//                 const yearData = drillData.filter((d: any) => d.fiscalYear === year);
//                 const colorIdx = idx % 6;
//                 const colors = [
//                   'rgb(75, 192, 192)',
//                   'rgb(255, 99, 132)',
//                   'rgb(53, 162, 235)',
//                   'rgb(255, 206, 86)',
//                   'rgb(153, 102, 255)',
//                   'rgb(255, 159, 64)'
//                 ];
                
//                 return {
//                   x: periods,
//                   y: periods.map(period => {
//                     const match = yearData.find((d: any) => d.period === period);
//                     return match ? match.value : 0;
//                   }),
//                   type: 'scatter',
//                   mode: 'lines+markers',
//                   name: `Year ${year}`,
//                   line: { color: colors[colorIdx] }
//                 };
//               });
//             } else {
//               formattedData = [{
//                 x: drillData.map((d: any) => d.period || d.fiscalYear),
//                 y: drillData.map((d: any) => d.value),
//                 type: 'scatter',
//                 mode: 'lines+markers',
//                 name: 'Value',
//                 line: { color: 'rgb(75, 192, 192)' }
//               }];
//             }
//           } else if (drillChartType === 'pie') {
//             formattedData = [{
//               values: drillData.map((d: any) => d.value),
//               labels: drillData.map((d: any) => d.catFinancialView),
//               type: 'pie',
//               marker: {
//                 colors: [
//                   'rgba(75, 192, 192, 0.6)',
//                   'rgba(255, 99, 132, 0.6)',
//                   'rgba(53, 162, 235, 0.6)',
//                   'rgba(255, 206, 86, 0.6)',
//                   'rgba(153, 102, 255, 0.6)',
//                   'rgba(255, 159, 64, 0.6)'
//                 ]
//               }
//             }];
//           }
          
//           // Set drill-down data and state
//           setDrillDownData(formattedData);
//           setDrillDown({
//             active: true,
//             chartType: drillChartType,
//             category,
//             title,
//             dataType
//           });
//         } else {
//           setError("No data available for this selection");
//         }
//       }
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "Unknown error occurred");
//       console.error("Error in drill-down:", err);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Handle image download functions
//   const handleDownloadImage = (plotRef: React.RefObject<any>, title: string) => {
//     if (plotRef.current && plotRef.current.el) {
//       Plotly.downloadImage(plotRef.current.el, {
//         format: 'png',
//         filename: title.replace(/\s+/g, "_").toLowerCase()
//       });
//     }
//   };

//   // Handle CSV download functions
//   const handleDownloadCSV = (chartData: any, title: string, chartType: string) => {
//     if (!chartData) return;
    
//     let csvContent = "data:text/csv;charset=utf-8,";
    
//     if (chartType === 'line') {
//       // For line chart
//       const periods = lineChartData.map(d => d.period);
//       csvContent += ["Period", "Revenue", "Gross Margin", "Net Profit"].join(",") + "\n";
      
//       lineChartData.forEach((data) => {
//         csvContent += [data.period, data.revenue, data.grossMargin, data.netProfit].join(",") + "\n";
//       });
//     } else if (chartType === 'bar') {
//       // For bar chart
//       csvContent += ["Period", "Revenue", "Expenses"].join(",") + "\n";
      
//       barChartData.forEach((data) => {
//         csvContent += [data.period, data.revenue, data.expenses].join(",") + "\n";
//       });
//     } else if (chartType === 'pie') {
//       // For pie chart
//       csvContent += "Category,Value\n";
//       if (pieChartData) {
//         csvContent += `Revenue,${pieChartData.revenue}\n`;
//         csvContent += `Gross Margin,${pieChartData.grossMargin}\n`;
//         csvContent += `Net Profit,${pieChartData.netProfit}\n`;
//         csvContent += `Operating Expenses,${pieChartData.opEx}\n`;
//       }
//     } else if (chartType === 'donut') {
//       // For donut chart
//       csvContent += "Category,Revenue\n";
//       donutChartData.forEach((data) => {
//         csvContent += `${data.catAccountingView},${data.revenue}\n`;
//       });
//     }
    
//     const encodedUri = encodeURI(csvContent);
//     const link = document.createElement("a");
//     link.setAttribute("href", encodedUri);
//     link.setAttribute("download", `${title.replace(/\s+/g, "_").toLowerCase()}.csv`);
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//   };

//   if (isLoading) {
//     return <div className="p-8 text-center">Loading financial data...</div>;
//   }

//   if (error) {
//     return <div className="p-4 text-red-600">Error: {error}</div>;
//   }

//   return (
//     <section className="p-8 bg-gray-50">
//       <h1 className="text-3xl font-bold text-center mb-8">Financial Dashboard React Plotly</h1>
      
//       <div className="flex flex-row justify-between items-center mb-6">
//         {/* <FilterBar years={years} selectedYear={selectedYear} onYearChange={setSelectedYear} /> */}
        
//         <div>
//           <GroupModal
//             isOpen={isGroupModalOpen}
//             onClose={() => setIsGroupModalOpen(false)}
//             onCreateGroup={handleCreateGroup}
//           />
//           <div className="flex flex-col mb-4">
//             {dimensions?.groupName && <p className="text-sm text-gray-500">Current Group Name: <span className="capitalize font-bold">{dimensions.groupName}</span></p>}
//             <div>
//               <button onClick={() => setDimensions(null)} className="shadow-xl border bg-red-400 p-2 rounded text-white mr-2">Reset Group</button>
//               <button onClick={() => setIsGroupModalOpen(true)} className="shadow-xl border bg-blue-400 p-2 rounded text-white">Create Group</button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {drillDown.active && drillDownData ? (
//         <DrillDownChart 
//           drillDownState={drillDown} 
//           drillDownData={drillDownData}
//           onBack={resetDrillDown} 
//         />
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           <ChartContainer 
//             title="Monthly Performance (Line)"
//             onDownloadCSV={() => handleDownloadCSV(lineChartData, "Monthly_Performance", "line")}
//             onDownloadImage={() => handleDownloadImage(linePlotRef, "Monthly_Performance")}
//           >
//             <Plot
//               ref={linePlotRef}
//               data={[
//                 {
//                   x: lineChartData.map((d) => d.period),
//                   y: lineChartData.map((d) => d.revenue),
//                   type: "scatter",
//                   mode: "lines+markers",
//                   name: "Revenue",
//                   line: { color: "blue" },
//                 },
//                 {
//                   x: lineChartData.map((d) => d.period),
//                   y: lineChartData.map((d) => d.grossMargin),
//                   type: "scatter",
//                   mode: "lines+markers",
//                   name: "Gross Margin",
//                   line: { color: "purple" },
//                 },
//                 {
//                   x: lineChartData.map((d) => d.period),
//                   y: lineChartData.map((d) => d.netProfit),
//                   type: "scatter",
//                   mode: "lines+markers",
//                   name: "Net Profit",
//                   line: { color: "green" },
//                 },
//               ]}
//               layout={{ 
//                 title: "Monthly Performance",
//                 autosize: true
//               }}
//               // style={{ width: "100%", height: "100%" }}
//               config={{ responsive: true }}
//               onClick={handleLineChartClick}
//             />
//           </ChartContainer>

//           <ChartContainer 
//             title="Revenue vs Expenses (Bar)"
//             onDownloadCSV={() => handleDownloadCSV(barChartData, "Revenue_vs_Expenses", "bar")}
//             onDownloadImage={() => handleDownloadImage(barPlotRef, "Revenue_vs_Expenses")}
//           >
//             <Plot
//               ref={barPlotRef}
//               data={[
//                 {
//                   x: barChartData.map((d) => d.period),
//                   y: barChartData.map((d) => d.revenue),
//                   type: "bar",
//                   name: "Revenue",
//                   marker: { color: "teal" },
//                 },
//                 {
//                   x: barChartData.map((d) => d.period),
//                   y: barChartData.map((d) => d.expenses),
//                   type: "bar",
//                   name: "Expenses",
//                   marker: { color: "orange" },
//                 },
//               ]}
//               layout={{ 
//                 title: "Revenue vs Operating Expenses", 
//                 barmode: "group",
//                 autosize: true
//               }}
//               // style={{ width: "100%", height: "100%" }}
//               config={{ responsive: true }}
//               onClick={handleBarChartClick}
//             />
//              </ChartContainer>
//              <ChartContainer title="Financial Breakdown (Pie)"
//              onDownloadCSV={() => handleDownloadCSV(pieChartData, "Revenue", "line")}
//              onDownloadImage={() => handleDownloadImage(piePlotRef, "Revenue")}
//              >
//           <Plot
//            ref={piePlotRef}
//             data={[
//               {
//                 values: [
//                   pieChartData?.revenue || 0,
//                   pieChartData?.grossMargin || 0,
//                   pieChartData?.netProfit || 0,
//                   pieChartData?.opEx || 0,
//                 ],
//                 labels: ["Revenue", "Gross Margin", "Net Profit", "Operating Expenses"],
//                 type: "pie",
//               },
//             ]}
//             layout={{ title: "Financial Distribution" }}
//             // style={{ width: "100%", height: "100%" }}
//             config={{ responsive: true }}
//             onClick={handlePieChartClick}
//           />
//         </ChartContainer>

//         <ChartContainer title="Category-wise Revenue (Donut)"
//         onDownloadCSV={() => handleDownloadCSV(donutChartData, "Revenue_by_Category", "line")}
//         onDownloadImage={() => handleDownloadImage(donutPlotRef, "Revenue_by_Category")}
//         >
//           <Plot
//            ref={donutPlotRef}
//             data={[
//               {
//                 values: donutChartData.map((d) => d.revenue),
//                 labels: donutChartData.map((d) => d.catAccountingView),
//                 type: "pie",
//                 hole: 0.5,
//               },
//             ]}
//             layout={{ title: "Revenue by Category" }}
//             // style={{ width: "100%", height: "100%" }}
//             config={{ responsive: true }}
//             onClick={handleDonutChartClick}
//           />
//         </ChartContainer>
//       </div>)}
//     </section>
//     );
//   }
           


// 'use client';

// import React, { useEffect, useState, useCallback, useMemo } from 'react';
// import Highcharts from 'highcharts';
// import HighchartsReact from 'highcharts-react-official';
// import HighchartsExporting from 'highcharts/modules/exporting';
// import HighchartsExportData from 'highcharts/modules/export-data';
// import HighchartsOfflineExporting from 'highcharts/modules/offline-exporting';

// import { BarChartData, Dimensions, DonutChartData, LineChartData, PieChartData } from '@/types/Schemas';
// import { GroupModal } from '@/components/GroupManagement';
// import {
//     useFetchChartDataMutation,
//     useFetchDrillDownDataMutation,
//     databaseName
// } from '@/lib/services/usersApi';
// import { ActionButton } from '@/components/ui/action-button';
// import { ErrorAlert, LoadingAlert } from '@/components/ui/status-alerts';
// import { ChartSkelten } from '@/components/ui/ChartSkelten';
// import HighchartsDrilldown from 'highcharts/modules/drilldown';
// import { buildRequestBody, handleCrossChartFilteringFunc } from '@/lib/services/buildWhereClause';


// // Initialize only once and only on client side
// if (typeof window !== 'undefined') {
//     if (typeof HighchartsExporting === 'function') {
//         HighchartsExporting(Highcharts);
//     }
//     if (typeof HighchartsExportData === 'function') {
//         HighchartsExportData(Highcharts);
//     }
//     if (typeof HighchartsOfflineExporting === 'function') {
//         HighchartsOfflineExporting(Highcharts);
//     }
//     if (typeof HighchartsDrilldown === 'function') {
//         HighchartsDrilldown(Highcharts);
//     }
// }

// // Defaults Colors
// Highcharts.setOptions({
//     colors: [
//         '#058DC7', '#50B432', '#ED561B', '#DDDF00', '#24CBE5', '#64E572',
//         '#FF9655', '#FFF263', '#6AF9C4'
//     ]
// });

// interface ChartContainerProps {
//     options: Highcharts.Options | null;
//     title: string;
//     isLoading?: boolean;
// }

// // Chart configuration constants
// type ChartType = 'line' | 'bar' | 'pie' | 'donut';

// // Chart configuration constants
// const CHART_CONFIG = {
//     COMMON: {
//         credits: { enabled: false },
//         exporting: {
//             enabled: true,
//             fallbackToExportServer: false,
//             buttons: {
//                 contextButton: {
//                     menuItems: [
//                         'viewFullscreen',
//                         'printChart',
//                         'separator',
//                         'downloadPNG',
//                         'downloadJPEG',
//                         'downloadPDF',
//                         'downloadSVG',
//                         'separator',
//                         'downloadCSV',
//                         'downloadXLS'
//                     ] as string[]
//                 }
//             }
//         },
//         tooltip: { valueDecimals: 2 },
//         plotOptions: {
//             series: {
//                 animation: {
//                     duration: 1000,
//                 },
//             },
//         },
//     },
//     LINE: {
//         chart: { type: 'line' as const, zooming: { type: 'x' as const } },
//         title: { text: 'Revenue Trends Over Time' },
//         subtitle: { text: 'Showing financial metrics by period' },
//         xAxis: { title: { text: 'Period' } },
//         yAxis: { title: { text: 'Amount (USD)' } },
//     },
//     BAR: {
//         chart: { type: 'column' as const, zooming: { type: 'x' as const } },
//         title: { text: 'Revenue vs Expenses by Country' },
//         subtitle: { text: 'Showing financial metrics by period' },
//         xAxis: { title: { text: 'Period' } },
//         yAxis: { title: { text: 'Amount (USD)' } },
//         plotOptions: {
//             column: {
//                 dataLabels: { enabled: true, format: '${point.y:,.0f}' },
//             },
//         },
//     },
//     PIE: {
//         chart: { type: 'pie' as const },
//         title: { text: 'Financial Distribution' },
//         subtitle: { text: 'Showing financial metrics' },
//         plotOptions: {
//             pie: {
//                 allowPointSelect: true,
//                 cursor: 'pointer',
//                 dataLabels: {
//                     enabled: true,
//                     format: '<b>{point.name}</b>: ${point.y:,.0f} ({point.percentage:.1f}%)',
//                 },
//                 showInLegend: true,
//             },
//         },
//     },
//     DONUT: {
//         chart: { type: 'pie' as const },
//         title: { text: 'Revenue by Category and Country' },
//         subtitle: { text: 'Showing financial metrics' },
//         plotOptions: {
//             pie: {
//                 allowPointSelect: true,
//                 cursor: 'pointer',
//                 dataLabels: {
//                     enabled: true,
//                     format: '<b>{point.name}</b>: ${point.y:,.0f}',
//                 },
//                 innerSize: '50%',
//                 showInLegend: true,
//             },
//         },
//     },
// } as const;

// const FinancialDashboard: React.FC = () => {
//     const [error, setError] = useState<string | null>(null);
//     const [isLoading, setIsLoading] = useState<boolean>(false);
//     const [isGroupModalOpen, setIsGroupModalOpen] = useState<boolean>(false);
//     const [dimensions, setDimensions] = useState<Dimensions | null>(null);
//     const [chartData, setChartData] = useState<{
//         line: LineChartData[];
//         bar: BarChartData[];
//         pie: PieChartData[];
//         donut: DonutChartData[];
//     }>({
//         line: [],
//         bar: [],
//         pie: [],
//         donut: [],
//     });

//     const [fetchAllChartData] = useFetchChartDataMutation();
//     const [fetchDrillDownData] = useFetchDrillDownDataMutation();
//     const [drillDownData, setDrillDownData] = useState<any[]>([]);
//     console.log(drillDownData);

//     const handleCrossChartFiltering = (data: string) => {
//         // @ts-ignore   
//         setDimensions(handleCrossChartFilteringFunc(data));
//     };

//     const handleDrillDown = useCallback(async (chartType: string, category: string, value: any, dataType: string) => {
//         setIsLoading(true);
//         setError(null);

//         try {
//             const result = await fetchDrillDownData({
//                 table_name: databaseName,
//                 chart_type: chartType,
//                 category: category,
//                 data_type: dataType,
//                 value: value
//             }).unwrap();

//             if (result.success && result.data && result.data.length > 0) {
//                 setDrillDownData(result.data);
//                 // The drill-down will be handled by Highcharts automatically
//             } else {
//                 setError("No data available for this selection");
//             }
//         } catch (err: any) {
//             setError(err?.data?.detail || err.message || "Failed to fetch drill-down data");
//             console.error("Error in drill-down:", err);
//         } finally {
//             setIsLoading(false);
//         }
//     }, [fetchDrillDownData]);

//     // Memoized chart options
//     const chartOptions = useMemo(() => {
//         const options: Record<ChartType, Highcharts.Options | null> = {
//             line: null,
//             bar: null,
//             pie: null,
//             donut: null,
//         };

//         // Line Chart
//         if (chartData.line.length > 0) {
//             options.line = {
//                 ...CHART_CONFIG.COMMON,
//                 ...CHART_CONFIG.LINE,
//                 xAxis: {
//                     ...CHART_CONFIG.LINE.xAxis,
//                     categories: chartData.line?.map((item) => item.period),
//                 },
//                 series: [
//                     {
//                         type: 'line',
//                         name: 'Revenue',
//                         data: chartData.line?.map((item) => item.revenue),
//                         cursor: 'pointer',
//                         events: {
//                             click: function (event: any) {
//                                 const point = event.point;
//                                 const category = point.category;
//                                 const value = point.y;

//                                 if (event.originalEvent?.ctrlKey || event.originalEvent?.metaKey) {
//                                     handleDrillDown('line', category, value, 'revenue');
//                                 } else {
//                                     handleCrossChartFiltering(category);
//                                 }
//                             }
//                         }

//                     },
//                     {
//                         type: 'line',
//                         name: 'Gross Margin',
//                         data: chartData.line?.map((item) => item.grossMargin),
//                         cursor: 'pointer',
//                         events: {
//                             click: function (event: any) {
//                                 const point = event.point;
//                                 const category = point.category;
//                                 const value = point.y;

//                                 if (event.originalEvent?.ctrlKey || event.originalEvent?.metaKey) {
//                                     handleDrillDown('line', category, value, 'grossMargin');
//                                 } else {
//                                     handleCrossChartFiltering(category);
//                                 }
//                             }
//                         }

//                     },
//                     {
//                         type: 'line',
//                         name: 'Net Profit',
//                         data: chartData.line?.map((item) => item.netProfit),
//                         cursor: 'pointer',
//                         events: {
//                             click: function (event: any) {
//                                 const point = event.point;
//                                 const category = point.category;
//                                 const value = point.y;

//                                 if (event.originalEvent?.ctrlKey || event.originalEvent?.metaKey) {
//                                     handleDrillDown('line', category, value, 'netProfit');
//                                 } else {
//                                     // handleCrossChartFiltering(category);
//                                     handleDrillDown('line', category, value, 'netProfit');
//                                 }
//                             }
//                         }

//                     },
//                 ],
//                 drilldown: {
//                     series: [

//                     ]
//                 }
//             };
//         }

//         // Bar Chart
//         if (chartData.bar.length > 0) {
//             options.bar = {
//                 ...CHART_CONFIG.COMMON,
//                 ...CHART_CONFIG.BAR,
//                 xAxis: {
//                     ...CHART_CONFIG.BAR.xAxis,
//                     categories: chartData.bar?.map((item) => item.period),
//                 },
//                 plotOptions: {
//                     ...CHART_CONFIG.BAR.plotOptions,
//                     column: {
//                         ...CHART_CONFIG.BAR.plotOptions?.column,
//                         cursor: 'pointer',
//                         events: {
//                             click: function (event: any) {
//                                 const point = event.point;
//                                 const category = point.category;
//                                 const value = point.y;
//                                 const seriesName = point.series.name.toLowerCase();

//                                 handleDrillDown('bar', category, value, seriesName);
//                             }
//                         }
//                     }
//                 },

//                 series: [
//                     {
//                         type: 'column',
//                         name: 'Revenue',
//                         data: chartData.bar?.map((item) => item.revenue),
//                     },
//                     {
//                         type: 'column',
//                         name: 'Expenses',
//                         data: chartData.bar?.map((item) => item.expenses),
//                     },
//                 ],
//             };
//         }

//         // Pie Chart
//         if (chartData.pie.length > 0) {
//             options.pie = {
//                 ...CHART_CONFIG.COMMON,
//                 ...CHART_CONFIG.PIE,
//                 series: [
//                     {
//                         type: 'pie',
//                         name: 'Financial Metrics',
//                         data: chartData.pie.map(item => ({
//                             name: item?.catfinancialview,
//                             y: item.revenue,
//                         })),
//                     },
//                 ],
//             };
//         }

//         // Donut Chart
//         if (chartData.donut.length > 0) {
//             options.donut = {
//                 ...CHART_CONFIG.COMMON,
//                 ...CHART_CONFIG.DONUT,
//                 series: [
//                     {
//                         type: 'pie',
//                         name: 'Revenue Distribution',
//                         data: chartData.donut.map(item => ({
//                             name: item.cataccountingview,
//                             y: item.revenue,
//                         })),
//                     },
//                 ],
//             };
//         }

//         return options;
//     }, [chartData, handleDrillDown, handleCrossChartFiltering]);

//     // Fetch chart data handler
//     const fetchChartData = useCallback(async (): Promise<void> => {
//         setIsLoading(true);
//         setError(null);

//         try {
//             const result = await fetchAllChartData({
//                 body: buildRequestBody(dimensions, 'all'),
//             }).unwrap();

//             if (!result?.success) {
//                 throw new Error(result?.message || 'Failed to fetch chart data');
//             }

//             const { charts } = result;

//             setChartData({
//                 line: charts?.line?.success ? charts.line.data || [] : [],
//                 bar: charts?.bar?.success ? charts.bar.data || [] : [],
//                 pie: charts?.pie?.success ? charts.pie.data || [] : [],
//                 donut: charts?.donut?.success ? charts.donut.data || [] : [],
//             });

//         } catch (err: any) {
//             const errorMessage = err?.data?.detail || err.message || 'Failed to fetch chart data';
//             setError(errorMessage);
//             // console.error('Error fetching chart data:', err);
//         } finally {
//             setIsLoading(false);
//         }
//     }, [dimensions, fetchAllChartData]);




//     // Fetch data when dimensions change
//     useEffect(() => {
//         fetchChartData();
//     }, [fetchChartData]);

//     // Event handlers
//     const handleCreateGroup = useCallback((data: Dimensions): void => {
//         setDimensions(data);
//     }, []);

//     const handleResetGroup = useCallback((): void => {
//         setDimensions(null);
//     }, []);

//     const handleCloseModal = useCallback((): void => {
//         setIsGroupModalOpen(false);
//     }, []);

//     const handleOpenModal = useCallback((): void => {
//         setIsGroupModalOpen(true);
//     }, []);

//     const handleDismissError = useCallback((): void => {
//         setError(null);
//     }, []);

//     return (
//         <section className="p-5">
//             <h1 className="md:text-2xl font-bold text-center mb-4">
//                 Financial Dashboard - Highcharts
//             </h1>

//             <GroupModal
//                 isOpen={isGroupModalOpen}
//                 onClose={handleCloseModal}
//                 // @ts-ignore
//                 onCreateGroup={handleCreateGroup}
//             />

//             <div className="flex flex-col mb-4">
//                 {dimensions?.groupName && (
//                     <p className="text-sm text-gray-500 mb-2">
//                         Current Group Name:{' '}
//                         <span className="capitalize font-bold">{dimensions.groupName}</span>
//                     </p>
//                 )}

//                 <div className="flex gap-2">
//                     <ActionButton
//                         onClick={handleResetGroup}
//                         className="bg-red-400 hover:bg-red-500"
//                         disabled={isLoading}
//                     >
//                         Reset Group
//                     </ActionButton>

//                     <ActionButton
//                         onClick={handleOpenModal}
//                         className="bg-blue-400 hover:bg-blue-500"
//                         disabled={isLoading}
//                     >
//                         Create Group
//                     </ActionButton>

//                     <ActionButton
//                         onClick={fetchChartData}
//                         className="bg-green-400 hover:bg-green-500"
//                         disabled={isLoading}
//                     >
//                         {isLoading ? 'Loading...' : 'Refresh Data'}
//                     </ActionButton>
//                 </div>
//             </div>

//             {error && (<ErrorAlert message={error} onDismiss={handleDismissError} />)}

//             {isLoading && <LoadingAlert />}

//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
//                 <ChartContainer
//                     options={chartOptions.line}
//                     title="Line Charts"
//                 />
//                 <ChartContainer
//                     options={chartOptions.bar}
//                     title="Bar Chart"
//                 />
//                 <ChartContainer
//                     options={chartOptions.pie}
//                     title="Pie Chart"
//                 />
//                 <ChartContainer
//                     options={chartOptions.donut}
//                     title="Donut Chart"
//                 />
//             </div>
//         </section>
//     );
// };

// const ChartContainer: React.FC<ChartContainerProps> = ({
//     options,
//     title,
//     isLoading = false
// }) => (
//     <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-200">
//         <div className="flex items-center justify-between mb-4">
//             <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
//             {isLoading && (
//                 <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
//             )}
//         </div>

//         {options ? (
//             <div className="min-h-[400px]">
//                 <HighchartsReact
//                     highcharts={Highcharts}
//                     options={options}
//                     immutable={false}
//                 />
//             </div>
//         ) : (
//             <ChartSkelten />
//         )}
//     </div>
// );

// export default FinancialDashboard;