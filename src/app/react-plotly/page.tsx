// "use client";
// import React, { useEffect, useState } from "react";
// import Plot from "react-plotly.js";
// import { useDuckDBContext } from "../_providers/DuckDBContext";

// // Interfaces
// interface FilterBarProps {
//   years: string[];
//   selectedYear: string;
//   onYearChange: (year: string) => void;
// }

// interface ChartContainerProps {
//   title: string;
//   children: React.ReactNode;
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

// export default function ReactPlotly() {
//   const { executeQuery, isDataLoaded } = useDuckDBContext();
//   const [selectedYear, setSelectedYear] = useState<string>("all");
//   const [years, setYears] = useState<string[]>([]);
//   const [isLoading, setIsLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);

//   const [lineChartData, setLineChartData] = useState<LineChartDataPoint[]>([]);
//   const [barChartData, setBarChartData] = useState<BarChartDataPoint[]>([]);
//   const [pieChartData, setPieChartData] = useState<PieChartData | null>(null);
//   const [donutChartData, setDonutChartData] = useState<DonutChartData[]>([]);

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
//       }
//     };

//     fetchYears();
//   }, [isDataLoaded, executeQuery]);

//   useEffect(() => {
//     if (!isDataLoaded) return;

//     const fetchChartData = async () => {
//       setIsLoading(true);
//       const whereClause = selectedYear !== "all" ? `WHERE fiscalYear = '${selectedYear}'` : "";

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
//             SELECT SUM(grossMargin) as grossMargin, SUM(operatingExpenses) as opEx, 
//                    SUM(netProfit) as netProfit, SUM(revenue) as revenue 
//             FROM financial_data ${whereClause}
//           `),
//           executeQuery(`
//             SELECT catAccountingView, SUM(revenue) as revenue 
//             FROM financial_data ${whereClause}
//             GROUP BY catAccountingView ORDER BY revenue DESC
//           `)
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
//   }, [isDataLoaded, selectedYear, executeQuery]);

//   if (isLoading) {
//     return <div className="p-8 text-center">Loading financial data...</div>;
//   }

//   if (error) {
//     return <div className="p-4 text-red-600">Error: {error}</div>;
//   }

//   return (
//     <section className="p-8 bg-gray-50">
//       <h1 className="text-3xl font-bold text-center mb-8">Financial Dashboard React Plotly</h1>
//       <FilterBar years={years} selectedYear={selectedYear} onYearChange={setSelectedYear} />

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         <ChartContainer title="Monthly Performance (Line)">
//           <Plot
//             data={[
//               {
//                 x: lineChartData.map((d) => d.period),
//                 y: lineChartData.map((d) => d.revenue),
//                 type: "scatter",
//                 mode: "lines+markers",
//                 name: "Revenue",
//                 line: { color: "blue" },
//               },
//               {
//                 x: lineChartData.map((d) => d.period),
//                 y: lineChartData.map((d) => d.grossMargin),
//                 type: "scatter",
//                 mode: "lines+markers",
//                 name: "Gross Margin",
//                 line: { color: "purple" },
//               },
//               {
//                 x: lineChartData.map((d) => d.period),
//                 y: lineChartData.map((d) => d.netProfit),
//                 type: "scatter",
//                 mode: "lines+markers",
//                 name: "Net Profit",
//                 line: { color: "green" },
//               },
//             ]}
//             layout={{ title: "Monthly Performance" }}
//             style={{ width: "100%", height: "100%" }}
//           />
//         </ChartContainer>

//         <ChartContainer title="Revenue vs Expenses (Bar)">
//           <Plot
//             data={[
//               {
//                 x: barChartData.map((d) => d.period),
//                 y: barChartData.map((d) => d.revenue),
//                 type: "bar",
//                 name: "Revenue",
//                 marker: { color: "teal" },
//               },
//               {
//                 x: barChartData.map((d) => d.period),
//                 y: barChartData.map((d) => d.expenses),
//                 type: "bar",
//                 name: "Expenses",
//                 marker: { color: "orange" },
//               },
//             ]}
//             layout={{ title: "Revenue vs Operating Expenses", barmode: "group" }}
//             style={{ width: "100%", height: "100%" }}
//           />
//         </ChartContainer>

//         <ChartContainer title="Financial Breakdown (Pie)">
//           <Plot
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
//             style={{ width: "100%", height: "100%" }}
//           />
//         </ChartContainer>

//         <ChartContainer title="Category-wise Revenue (Donut)">
//           <Plot
//             data={[
//               {
//                 values: donutChartData.map((d) => d.revenue),
//                 labels: donutChartData.map((d) => d.catAccountingView),
//                 type: "pie",
//                 hole: 0.5,
//               },
//             ]}
//             layout={{ title: "Revenue by Category" }}
//             style={{ width: "100%", height: "100%" }}
//           />
//         </ChartContainer>
//       </div>
//     </section>
//   );
// }

// const ChartContainer: React.FC<ChartContainerProps> = ({ title, children }) => (
//   <div className="bg-white p-6 rounded-lg shadow-md">
//     <h2 className="text-xl font-semibold mb-4">{title}</h2>
//     <div className="">{children}</div>
//   </div>
// );

// const FilterBar: React.FC<FilterBarProps> = ({ years, selectedYear, onYearChange }) => (
//   <div className="mb-6">
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
//   </div>
// );
"use client";
import React, { useEffect, useState, useRef } from "react";
import Plot from "react-plotly.js";
import { useDuckDBContext } from "../_providers/DuckDBContext";
import { GroupModal } from "@/components/GroupManagement";
import { buildWhereClause } from "@/lib/services/buildWhereClause";


interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
  onDownloadCSV?: () => void;
  onDownloadImage?: () => void;
  isDrilled?: boolean;
  onBack?: () => void;
}

interface LineChartDataPoint {
  period: string;
  revenue: number;
  grossMargin: number;
  netProfit: number;
}

interface BarChartDataPoint {
  period: string;
  revenue: number;
  expenses: number;
}

interface PieChartData {
  grossMargin: number;
  opEx: number;
  netProfit: number;
  revenue: number;
}

interface DonutChartData {
  catAccountingView: string;
  revenue: number;
}

// Drill-down state interface
interface DrillDownState {
  active: boolean;
  chartType: string;
  category: string;
  title: string;
  dataType?: string;
}

type DimensionSelection = {
  dimension: string;
  members: string[];
};

type Dimensions = {
  groupName: string;
  filteredSelections: DimensionSelection[];
};

const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  children,
  onDownloadCSV,
  onDownloadImage,
  isDrilled,
  onBack
}) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <div className="flex flex-row justify-between items-center">
      <div className="flex items-center">
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        {isDrilled && (
          <button
            onClick={onBack}
            className="ml-3 px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm mb-4"
          >
            ↩ Back
          </button>
        )}
      </div>
      {(onDownloadCSV || onDownloadImage) && (
        <div className="flex gap-2 mb-4">
          {onDownloadImage && (
            <button onClick={onDownloadImage} className="px-4 py-2 bg-blue-500 text-white rounded">
              Download Image
            </button>
          )}
          {onDownloadCSV && (
            <button onClick={onDownloadCSV} className="px-4 py-2 bg-green-500 text-white rounded">
              Download CSV
            </button>
          )}
        </div>
      )}
    </div>
    <div className="">{children}</div>
  </div>
);

// Drill Down Chart Component
const DrillDownChart: React.FC<{
  drillDownState: DrillDownState;
  drillDownData: any;
  onBack: () => void;
}> = ({ drillDownState, drillDownData, onBack }) => {
  const plotRef = useRef<any>(null);

  // Function to handle image download
  const handleDownloadImage = () => {
    if (plotRef.current) {
      const plotElement = plotRef.current.el;
      Plotly.downloadImage(plotElement, {
        format: 'png',
        filename: `${drillDownState.title.replace(/\s+/g, "_").toLowerCase()}`
      });
    }
  };

  // Function to handle CSV download
  const handleDownloadCSV = () => {
    if (!drillDownData) return;

    let csvContent = "data:text/csv;charset=utf-8,";

    // Handle different chart types
    if (drillDownState.chartType === 'bar' || drillDownState.chartType === 'line') {
      // Get x-axis values
      const xValues = drillDownData[0].x;
      csvContent += ["Category", ...xValues].join(",") + "\n";

      // Add data for each trace
      drillDownData.forEach((trace: any) => {
        csvContent += [trace.name, ...trace.y].join(",") + "\n";
      });
    } else if (drillDownState.chartType === 'pie') {
      csvContent += "Label,Value\n";
      drillDownData[0].labels.forEach((label: string, i: number) => {
        csvContent += `${label},${drillDownData[0].values[i]}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${drillDownState.title.replace(/\s+/g, "_").toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render the appropriate chart based on drill-down state
  const renderDrillDownChart = () => {
    switch (drillDownState.chartType) {
      case 'line':
        return (
          <Plot
            ref={plotRef}
            data={drillDownData}
            layout={{
              title: drillDownState.title,
              autosize: true
            }}
            style={{ width: "100%", height: "100%" }}
            config={DEFAULT_CONFIGURATION}
          />
        );
      case 'bar':
        return (
          <Plot
            ref={plotRef}
            data={drillDownData}
            layout={{
              title: drillDownState.title,
              barmode: 'group',
              autosize: true
            }}
            style={{ width: "100%", height: "100%" }}
            config={DEFAULT_CONFIGURATION}
          />
        );
      case 'pie':
        return (
          <Plot
            ref={plotRef}
            data={drillDownData}
            layout={{
              title: drillDownState.title,
              autosize: true
            }}
            style={{ width: "100%", height: "100%" }}
            config={DEFAULT_CONFIGURATION}
          />
        );
      default:
        return (
          <Plot
            ref={plotRef}
            data={drillDownData}
            layout={{
              title: drillDownState.title,
              autosize: true
            }}
            style={{ width: "100%", height: "100%" }}
            config={DEFAULT_CONFIGURATION}
          />
        );
    }
  };

  return (
    <ChartContainer
      title={drillDownState.title}
      onDownloadCSV={handleDownloadCSV}
      onDownloadImage={handleDownloadImage}
      isDrilled={true}
      onBack={onBack}
    >
      {renderDrillDownChart()}
    </ChartContainer>
  );
};

const DEFAULT_CONFIGURATION = {
  responsive: true,
  displayModeBar: false,
  modeBarButtonsToRemove: ['editInChartStudio', 'zoom2d', 'select2d', 'lasso2d', 'autoScale2d', 'resetScale2d']
};

export default function ReactPlotly() {
  const { executeQuery, isDataLoaded } = useDuckDBContext();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [lineChartData, setLineChartData] = useState<LineChartDataPoint[]>([]);
  const [barChartData, setBarChartData] = useState<BarChartDataPoint[]>([]);
  const [pieChartData, setPieChartData] = useState<PieChartData | null>(null);
  const [donutChartData, setDonutChartData] = useState<DonutChartData[]>([]);

  // Refs for chart components
  const linePlotRef = useRef<any>(null);
  const barPlotRef = useRef<any>(null);
  const piePlotRef = useRef<any>(null);
  const donutPlotRef = useRef<any>(null);

  // Drill-down state
  const [drillDown, setDrillDown] = useState<DrillDownState>({
    active: false,
    chartType: "",
    category: "",
    title: ""
  });
  const [drillDownData, setDrillDownData] = useState<any>(null);

  // Group management
  const [isGroupModalOpen, setIsGroupModalOpen] = useState<boolean>(false);
  const [dimensions, setDimensions] = useState<Dimensions | null>(null);

  // Reset drill down state
  const resetDrillDown = () => {
    setDrillDown({
      active: false,
      chartType: "",
      category: "",
      title: ""
    });
    setDrillDownData(null);
  };

  const handleCreateGroup = (datas: any) => {
    setDimensions(datas);
  };

  useEffect(() => {
    if (!isDataLoaded) return;

    const fetchChartData = async () => {
      setIsLoading(true);

      const whereClause = buildWhereClause(dimensions);
      try {
        const [lineRes, barRes, pieRes, donutRes] = await Promise.all([
          executeQuery(`SELECT period, AVG(revenue) as revenue, AVG(grossMargin) as grossMargin, AVG(netProfit) as netProfit FROM financial_data ${whereClause} GROUP BY period ORDER BY period`),
          executeQuery(`SELECT period, SUM(revenue) as revenue, SUM(operatingExpenses) as expenses FROM financial_data ${whereClause} GROUP BY period ORDER BY period`),
          executeQuery(`SELECT SUM(grossMargin) as grossMargin, SUM(operatingExpenses) as operatingExpenses, SUM(netProfit) as netProfit, SUM(revenue) as revenue FROM financial_data ${whereClause}`),
          executeQuery(`SELECT catAccountingView, SUM(revenue) as revenue FROM financial_data ${whereClause} GROUP BY catAccountingView ORDER BY revenue DESC`)
        ]);

        if (lineRes.success) setLineChartData(lineRes.data as LineChartDataPoint[]);
        if (barRes.success) setBarChartData(barRes.data as BarChartDataPoint[]);
        if (pieRes.success && pieRes.data) setPieChartData(pieRes.data[0] as PieChartData);
        if (donutRes.success) setDonutChartData(donutRes.data as DonutChartData[]);

        setError(null);
      } catch (err) {
        setError("Failed to load chart data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchChartData();
  }, [dimensions, isDataLoaded, executeQuery]);

  // Handle drill down for line chart
  const handleLineChartClick = async (data: any) => {
    console.log(data, "line chart data");

    if (!data || !data.points || data.points.length === 0) return;

    const point = data.points[0];
    const period = point.x;
    const dataType = point.data.name?.toLowerCase() || 'revenue';

    await handleDrillDown('line', period, dataType);
  };
  const handleBarChartClick = async (data: any) => {
    if (!data || !data.points || data.points.length === 0) return;

    const point = data.points[0];
    const period = point.x;
    const dataType = point.data.name?.toLowerCase() || 'revenue';

    await handleDrillDown('bar', period, dataType);
  };

  // Handle drill down for pie chart
  const handlePieChartClick = async (data: any) => {
    if (!data || !data.points || data.points.length === 0) return;

    const point = data.points[0];
    const dataType = point.label;

    await handleDrillDown('pie', dataType, 'financialDistribution');
  };

  // Handle drill down for donut chart
  const handleDonutChartClick = async (data: any) => {
    if (!data || !data.points || data.points.length === 0) return;

    const point = data.points[0];
    const category = point.label;

    await handleDrillDown('donut', category, 'categoryRevenue');
  };


  // Generic drill down function
  const handleDrillDown = async (chartType: string, category: string, dataType: string) => {
    if (!isDataLoaded) return;

    setIsLoading(true);
    try {
      let query = "";
      let title = "";
      let drillChartType = 'bar';

      // Prepare the base WHERE clause - this is the key change
      let baseWhereClause = ``;

      switch (chartType) {
        case 'bar':
          if (dataType === 'revenue') {
            // Start with the specific filter condition
            baseWhereClause = `period = '${category}'`;
            // If we have dimension filters, add them with AND
            // if (dimensionsWhereClause) {
            //   baseWhereClause += ` AND ${dimensionsWhereClause}`;
            // }

            query = `SELECT fiscalYear, catFinancialView, SUM(revenue) as value 
                     FROM financial_data 
                     WHERE period = '${category}'
                     GROUP BY fiscalYear, catFinancialView
                     ORDER BY fiscalYear, value DESC`;
            title = `Revenue Breakdown for Period: ${category}`;
            drillChartType = 'bar';
          } else if (dataType === 'expenses') {
            baseWhereClause = `period = '${category}'`;
            // if (dimensionsWhereClause) {
            //   baseWhereClause += ` AND ${dimensionsWhereClause}`;
            // }

            query = `SELECT fiscalYear, catFinancialView, SUM(operatingExpenses) as value 
                     FROM financial_data 
                     WHERE period = '${category}'
                     GROUP BY fiscalYear, catFinancialView
                     ORDER BY fiscalYear, value DESC`;
            title = `Expenses Breakdown for Period: ${category}`;
            drillChartType = 'bar';
          }
          break;

        case 'line':
          let columnName = dataType.toLowerCase().replace(/\s+/g, '');
          baseWhereClause = `period = '${category}'`;
          // if (dimensionsWhereClause) {
          //   baseWhereClause += ` AND ${dimensionsWhereClause}`;
          // }

          query = `SELECT fiscalYear, catFinancialView, SUM(${dataType}) as value 
                   FROM financial_data 
                   WHERE period = '${category}'
                   GROUP BY fiscalYear, catFinancialView
                   ORDER BY value DESC`;
          title = `${dataType.charAt(0).toUpperCase() + dataType.slice(1)} Breakdown for Period: ${category}`;
          drillChartType = 'bar';
          break;

        case 'donut':
          baseWhereClause = `catAccountingView = '${category}'`;
          // if (dimensionsWhereClause) {
          //   baseWhereClause += ` AND ${dimensionsWhereClause}`;
          // }

          query = `SELECT fiscalYear, period, SUM(revenue) as value 
                   FROM financial_data 
                   WHERE catAccountingView = '${category}'
                   GROUP BY fiscalYear, period
                   ORDER BY fiscalYear, period`;
          title = `Revenue Breakdown for Category: ${category}`;
          drillChartType = 'line';
          break;

        case 'pie':
          const metricColumn = dataType.toLowerCase().replace(/\s+/g, '');
          // For pie chart, we might not need a specific filter
          // baseWhereClause = dimensionsWhereClause ? dimensionsWhereClause : "1=1";

          query = `SELECT catFinancialView, SUM(${category}) as value 
                     FROM financial_data 
                     WHERE 1=1
                     GROUP BY catFinancialView
                     ORDER BY value DESC`;
          title = `${dataType} Breakdown by Financial Category`;
          drillChartType = 'pie';
          break;
      }

      // Execute the query and handle results...
      if (query) {
        const result = await executeQuery(query);
        if (result.success && result.data && result.data.length > 0) {
          const drillData = result.data;

          // Format data for Plotly based on chart type
          let formattedData: any = [];

          if (drillChartType === 'bar') {
            // Group by fiscal year if present
            if (drillData[0].fiscalYear) {
              const categories = Array.from(new Set(drillData.map((d: any) => d.catFinancialView)));
              const fiscalYears = Array.from(new Set(drillData.map((d: any) => d.fiscalYear)));

              formattedData = fiscalYears.map((year: string, idx: number) => {
                const yearData = drillData.filter((d: any) => d.fiscalYear === year);
                const colorIdx = idx % 6;
                const colors = [
                  'rgb(75, 192, 192)',
                  'rgb(255, 99, 132)',
                  'rgb(53, 162, 235)',
                  'rgb(255, 206, 86)',
                  'rgb(153, 102, 255)',
                  'rgb(255, 159, 64)'
                ];

                return {
                  x: categories,
                  y: categories.map(cat => {
                    const match = yearData.find((d: any) => d.catFinancialView === cat);
                    return match ? match.value : 0;
                  }),
                  type: 'bar',
                  name: `Year ${year}`,
                  marker: { color: colors[colorIdx] }
                };
              });
            } else {
              formattedData = [{
                x: drillData.map((d: any) => d.catFinancialView || d.period),
                y: drillData.map((d: any) => d.value),
                type: 'bar',
                name: 'Value',
                marker: { color: 'rgb(75, 192, 192)' }
              }];
            }
          } else if (drillChartType === 'line') {
            // Group by period if present
            if (drillData[0].period) {
              const fiscalYears = Array.from(new Set(drillData.map((d: any) => d.fiscalYear)));
              const periods = Array.from(new Set(drillData.map((d: any) => d.period))).sort();

              formattedData = fiscalYears.map((year: string, idx: number) => {
                const yearData = drillData.filter((d: any) => d.fiscalYear === year);
                const colorIdx = idx % 6;
                const colors = [
                  'rgb(75, 192, 192)',
                  'rgb(255, 99, 132)',
                  'rgb(53, 162, 235)',
                  'rgb(255, 206, 86)',
                  'rgb(153, 102, 255)',
                  'rgb(255, 159, 64)'
                ];

                return {
                  x: periods,
                  y: periods.map(period => {
                    const match = yearData.find((d: any) => d.period === period);
                    return match ? match.value : 0;
                  }),
                  type: 'scatter',
                  mode: 'lines+markers',
                  name: `Year ${year}`,
                  line: { color: colors[colorIdx] }
                };
              });
            } else {
              formattedData = [{
                x: drillData.map((d: any) => d.period || d.fiscalYear),
                y: drillData.map((d: any) => d.value),
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Value',
                line: { color: 'rgb(75, 192, 192)' }
              }];
            }
          } else if (drillChartType === 'pie') {
            formattedData = [{
              values: drillData.map((d: any) => d.value),
              labels: drillData.map((d: any) => d.catFinancialView),
              type: 'pie',
              marker: {
                colors: [
                  'rgba(75, 192, 192, 0.6)',
                  'rgba(255, 99, 132, 0.6)',
                  'rgba(53, 162, 235, 0.6)',
                  'rgba(255, 206, 86, 0.6)',
                  'rgba(153, 102, 255, 0.6)',
                  'rgba(255, 159, 64, 0.6)'
                ]
              }
            }];
          }

          // Set drill-down data and state
          setDrillDownData(formattedData);
          setDrillDown({
            active: true,
            chartType: drillChartType,
            category,
            title,
            dataType
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

  // Handle image download functions
  const handleDownloadImage = (plotRef: React.RefObject<any>, title: string) => {
    if (plotRef.current && plotRef.current.el) {
      Plotly.downloadImage(plotRef.current.el, {
        format: 'png',
        filename: title.replace(/\s+/g, "_").toLowerCase()
      });
    }
  };

  // Handle CSV download functions
  const handleDownloadCSV = (chartData: any, title: string, chartType: string) => {
    if (!chartData) return;

    let csvContent = "data:text/csv;charset=utf-8,";

    if (chartType === 'line') {
      // For line chart
      const periods = lineChartData.map(d => d.period);
      csvContent += ["Period", "Revenue", "Gross Margin", "Net Profit"].join(",") + "\n";

      lineChartData.forEach((data) => {
        csvContent += [data.period, data.revenue, data.grossMargin, data.netProfit].join(",") + "\n";
      });
    } else if (chartType === 'bar') {
      // For bar chart
      csvContent += ["Period", "Revenue", "Expenses"].join(",") + "\n";

      barChartData.forEach((data) => {
        csvContent += [data.period, data.revenue, data.expenses].join(",") + "\n";
      });
    } else if (chartType === 'pie') {
      // For pie chart
      csvContent += "Category,Value\n";
      if (pieChartData) {
        csvContent += `Revenue,${pieChartData.revenue}\n`;
        csvContent += `Gross Margin,${pieChartData.grossMargin}\n`;
        csvContent += `Net Profit,${pieChartData.netProfit}\n`;
        csvContent += `Operating Expenses,${pieChartData.opEx}\n`;
      }
    } else if (chartType === 'donut') {
      // For donut chart
      csvContent += "Category,Revenue\n";
      donutChartData.forEach((data) => {
        csvContent += `${data.catAccountingView},${data.revenue}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${title.replace(/\s+/g, "_").toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading financial data...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  return (
    <section className="p-8 bg-gray-50">
      <h1 className="text-3xl font-bold text-center mb-8">Financial Dashboard React Plotly</h1>

      <div className="flex flex-row justify-between items-center mb-6">
        {/* <FilterBar years={years} selectedYear={selectedYear} onYearChange={setSelectedYear} /> */}

        <div>
          <GroupModal
            isOpen={isGroupModalOpen}
            onClose={() => setIsGroupModalOpen(false)}
            onCreateGroup={handleCreateGroup}
          />
          <div className="flex flex-col mb-4">
            {dimensions?.groupName && <p className="text-sm text-gray-500">Current Group Name: <span className="capitalize font-bold">{dimensions.groupName}</span></p>}
            <div>
              <button onClick={() => setDimensions(null)} className="shadow-xl border bg-red-400 p-2 rounded text-white mr-2">Reset Group</button>
              <button onClick={() => setIsGroupModalOpen(true)} className="shadow-xl border bg-blue-400 p-2 rounded text-white">Create Group</button>
            </div>
          </div>
        </div>
      </div>

      {drillDown.active && drillDownData ? (
        <DrillDownChart
          drillDownState={drillDown}
          drillDownData={drillDownData}
          onBack={resetDrillDown}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ChartContainer
            title="Monthly Performance (Line)"
            onDownloadCSV={() => handleDownloadCSV(lineChartData, "Monthly_Performance", "line")}
            onDownloadImage={() => handleDownloadImage(linePlotRef, "Monthly_Performance")}
          >
            <Plot
              key={`line-chart-${dimensions?.groupName || 'default'}`}
              ref={linePlotRef}
              data={[
                {
                  x: lineChartData.map((d) => d.period),
                  y: lineChartData.map((d) => d.revenue),
                  type: "scatter",
                  mode: "lines+markers",
                  name: "Revenue",
                  line: { color: "blue" },
                },
                {
                  x: lineChartData.map((d) => d.period),
                  y: lineChartData.map((d) => d.grossMargin),
                  type: "scatter",
                  mode: "lines+markers",
                  name: "Gross Margin",
                  line: { color: "purple" },
                },
                {
                  x: lineChartData.map((d) => d.period),
                  y: lineChartData.map((d) => d.netProfit),
                  type: "scatter",
                  mode: "lines+markers",
                  name: "Net Profit",
                  line: { color: "green" },
                },
              ]}
              layout={{
                title: "Monthly Performance",
                autosize: true,
                xaxis: {
                  tickformat: 'digits'
                }

              }}
              style={{ width: "100%", height: "100%" }}
              config={DEFAULT_CONFIGURATION}
              onClick={handleLineChartClick}
            />
          </ChartContainer>

          <ChartContainer
            title="Revenue vs Expenses (Bar)"
            onDownloadCSV={() => handleDownloadCSV(barChartData, "Revenue_vs_Expenses", "bar")}
            onDownloadImage={() => handleDownloadImage(barPlotRef, "Revenue_vs_Expenses")}
          >
            <Plot
              ref={barPlotRef}
              data={[
                {
                  x: barChartData.map((d) => d.period),
                  y: barChartData.map((d) => d.revenue),
                  type: "bar",
                  name: "Revenue",
                  marker: { color: "teal" },
                },
                {
                  x: barChartData.map((d) => d.period),
                  y: barChartData.map((d) => d.expenses),
                  type: "bar",
                  name: "Expenses",
                  marker: { color: "orange" },
                },
              ]}
              layout={{
                title: "Revenue vs Operating Expenses",
                barmode: "group",
                autosize: true,
                xaxis: {
                  tickformat: 'digits'
                }
              }}
              // style={{ width: "100%", height: "100%" }}
              config={DEFAULT_CONFIGURATION}
              onClick={handleBarChartClick}
            />
          </ChartContainer>
          <ChartContainer title="Financial Breakdown (Pie)"
            onDownloadCSV={() => handleDownloadCSV(pieChartData, "Revenue", "line")}
            onDownloadImage={() => handleDownloadImage(piePlotRef, "Revenue")}
          >
            <Plot
              ref={piePlotRef}
              data={[
                {
                  values: [
                    pieChartData?.revenue || 0,
                    pieChartData?.grossMargin || 0,
                    pieChartData?.netProfit || 0,
                    pieChartData?.opEx || 0,
                  ],
                  labels: ["Revenue", "GrossMargin", "NetProfit", "OperatingExpenses"],
                  type: "pie",
                },
              ]}
              layout={{ title: "Financial Distribution" }}
              // style={{ width: "100%", height: "100%" }}
              config={{
                responsive: true,
                displayModeBar: false,
                modeBarButtonsToRemove: ['toImage', 'editInChartStudio', 'zoom2d', 'select2d', 'lasso2d', 'autoScale2d', 'resetScale2d']
              }}
              onClick={handlePieChartClick}
            />
          </ChartContainer>

          <ChartContainer title="Category-wise Revenue (Donut)"
            onDownloadCSV={() => handleDownloadCSV(donutChartData, "Revenue_by_Category", "line")}
            onDownloadImage={() => handleDownloadImage(donutPlotRef, "Revenue_by_Category")}
          >
            <Plot
              ref={donutPlotRef}
              data={[
                {
                  values: donutChartData.map((d) => d.revenue),
                  labels: donutChartData.map((d) => d.catAccountingView),
                  type: "pie",
                  hole: 0.5,
                },
              ]}
              layout={{ title: "Revenue by Category" }}
              // style={{ width: "100%", height: "100%" }}
              config={DEFAULT_CONFIGURATION}
              onClick={handleDonutChartClick}
            />
          </ChartContainer>
        </div>)}
    </section>
  );
}
