"use client";
import React, { useState, useEffect, useRef, forwardRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
} from "chart.js";
import { Line, Bar, Pie, Doughnut } from "react-chartjs-2";
import { useDuckDBContext } from "../_providers/DuckDBContext";
import { GroupModal } from "@/components/GroupManagement";
import { buildWhereClause } from "@/lib/services/buildWhereClause";
// Types
import { Dimensions } from "@/types/Schemas";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Interface for drill-down state
interface DrillDownState {
  active: boolean;
  chartType: string;
  category: string;
  title: string;
  dataType?: string;
}

interface ChartContainerProps {
  title: string;
  chartRef: React.RefObject<any>;
  data: any;
  onChartClick?: (event: any) => void;
  children: React.ReactNode;
  isDrilled?: boolean;
  onBack?: () => void;
}

const ChartContainer = forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ title, chartRef, data, onChartClick, children, isDrilled, onBack }, ref) => {
    const handleDownloadImage = () => {
      if (chartRef.current) {
        const url = chartRef.current.toBase64Image();
        const link = document.createElement("a");
        link.href = url;
        link.download = `${title.replace(/\s+/g, "_").toLowerCase()}.png`;
        link.click();
      }
    };

    const handleDownloadCSV = () => {
      if (!data) return;
      let csvContent = "data:text/csv;charset=utf-8,";
      const labels = data.labels;
      const datasets = data.datasets;

      if (labels && datasets) {
        csvContent += ["Label", ...labels].join(",") + "\n";

        datasets.forEach((dataset: any) => {
          csvContent += [dataset.label, ...dataset.data].join(",") + "\n";
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

    return (
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
          <div className="flex gap-2 mb-4">
            <button onClick={handleDownloadImage} className="px-4 py-2 bg-blue-500 text-white rounded">
              Download Image
            </button>
            <button onClick={handleDownloadCSV} className="px-4 py-2 bg-green-500 text-white rounded">
              Download CSV
            </button>
          </div>
        </div>
        <div className="h-64">{children}</div>
      </div>
    );
  }
);

ChartContainer.displayName = "ChartContainer";


// Drill Down Chart Component
const DrillDownChart: React.FC<{
  drillDownState: DrillDownState;
  drillDownData: ChartData<'bar' | 'line' | 'pie' | 'doughnut'>;
  onBack: () => void;
}> = ({ drillDownState, drillDownData, onBack }) => {
  const drillChartRef = useRef<any>(null);

  const chartOptions: ChartOptions<'line' | 'bar' | 'pie' | 'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { position: "top" },
      title: {
        display: true,
        text: drillDownState.title
      }
    }
  };

  // Render appropriate chart type based on drill-down data
  const renderDrillDownChart = () => {
    switch (drillDownState.chartType) {
      case 'line':
         // @ts-ignore
        return <Line ref={drillChartRef} options={chartOptions} data={drillDownData} />;
      case 'bar':
         // @ts-ignore
        return <Bar ref={drillChartRef} options={chartOptions} data={drillDownData} />;
      case 'pie':
         // @ts-ignore
        return <Pie ref={drillChartRef} options={chartOptions} data={drillDownData} />;
      case 'donut':
         // @ts-ignore
        return <Doughnut ref={drillChartRef} options={{...chartOptions, cutout: '50%'}} data={drillDownData} />;
      default:
         // @ts-ignore
        return <Bar ref={drillChartRef} options={chartOptions} data={drillDownData} />;
    }
  };

  return (
    <ChartContainer 
      title={drillDownState.title} 
      chartRef={drillChartRef} 
      data={drillDownData}
      isDrilled={true}
      onBack={onBack}
    >
      {renderDrillDownChart()}
    </ChartContainer>
  );
};

export default function ChartJsPage() {
  const { executeQuery, isDataLoaded } = useDuckDBContext();  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [lineChartData, setLineChartData] = useState<ChartData<'line'> | null>(null);
  const [barChartData, setBarChartData] = useState<ChartData<'bar'> | null>(null);
  const [pieChartData, setPieChartData] = useState<ChartData<'pie'> | null>(null);
  const [donutChartData, setDonutChartData] = useState<ChartData<'doughnut'> | null>(null);

  const [isGroupModalOpen, setIsGroupModalOpen] = useState<boolean>(false);
  const [dimensions, setDimensions] = useState<Dimensions | null>(null);

  // Drill down state
  const [drillDown, setDrillDown] = useState<DrillDownState>({
    active: false,
    chartType: "",
    category: "",
    title: ""
  });
  const [drillDownData, setDrillDownData] = useState<ChartData<'bar' | 'line' | 'pie' | 'doughnut'> | null>(null);

  const lineChartRef = useRef<any>(null);
  const barChartRef = useRef<any>(null);
  const pieChartRef = useRef<any>(null);
  const donutChartRef = useRef<any>(null);

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
  }

  useEffect(() => {
    if (!isDataLoaded) return;
    const fetchChartData = async () => {
      setIsLoading(true);

      const whereClause = buildWhereClause(dimensions);

      try {
       
        const [lineResult, barResult, pieResult, donutResult] = await Promise.all([
          executeQuery(`
            SELECT period, AVG(revenue) as revenue, AVG(grossMargin) as grossMargin, AVG(netProfit) as netProfit 
            FROM financial_data ${whereClause} GROUP BY period ORDER BY period
          `),
          executeQuery(`
            SELECT period, SUM(revenue) as revenue, SUM(operatingExpenses) as expenses 
            FROM financial_data ${whereClause} GROUP BY period ORDER BY period
          `),
          executeQuery(`
            SELECT SUM(grossMargin) as grossMargin, SUM(operatingExpenses) as opEx, SUM(netProfit) as netProfit, SUM(revenue) as revenue 
            FROM financial_data ${whereClause}
          `),
          executeQuery(`
            SELECT catAccountingView, SUM(revenue) as revenue 
            FROM financial_data ${whereClause} GROUP BY catAccountingView ORDER BY revenue DESC
          `)
        ]);

        if (lineResult.success && lineResult.data) {
          setLineChartData({
            labels: lineResult.data.map((item: any) => item.period),
            datasets: [
              {
                label: "Revenue",
                data: lineResult.data.map((item: any) => item.revenue),
                borderColor: "rgb(75, 192, 192)",
                backgroundColor: "rgba(75, 192, 192, 0.5)",
              },
              {
                label: "Gross Margin",
                data: lineResult.data.map((item: any) => item.grossMargin),
                borderColor: "rgb(53, 162, 235)",
                backgroundColor: "rgba(53, 162, 235, 0.5)",
              },
              {
                label: "Net Profit",
                data: lineResult.data.map((item: any) => item.netProfit),
                borderColor: "rgb(255, 99, 132)",
                backgroundColor: "rgba(255, 99, 132, 0.5)",
              }
            ]
          });
        }

        if (barResult.success && barResult.data) {
          setBarChartData({
            labels: barResult.data.map((item: any) => item.period),
            datasets: [
              {
                label: "Revenue",
                data: barResult.data.map((item: any) => item.revenue),
                backgroundColor: "rgba(75, 192, 192, 0.6)",
              },
              {
                label: "Expenses",
                data: barResult.data.map((item: any) => item.expenses),
                backgroundColor: "rgba(255, 99, 132, 0.6)",
              }
            ]
          });
        }

        if (pieResult.success && pieResult.data && pieResult.data[0]) {
          const d = pieResult.data[0];
          setPieChartData({
            labels: ["Gross Margin", "Operating Expenses", "Net Profit", "Other"],
            datasets: [{
              data: [d.grossMargin, d.opEx, d.netProfit, d.revenue - d.grossMargin - d.opEx - d.netProfit],
              backgroundColor: [
                "rgba(75, 192, 192, 0.6)",
                "rgba(255, 99, 132, 0.6)",
                "rgba(53, 162, 235, 0.6)",
                "rgba(255, 206, 86, 0.6)",
              ]
            }]
          });
        }

        if (donutResult.success && donutResult.data) {
          setDonutChartData({
            labels: donutResult.data.map((item: any) => item.catAccountingView),
            datasets: [{
              data: donutResult.data.map((item: any) => item.revenue),
              backgroundColor: [
                "rgba(255, 206, 86, 0.6)",
                "rgba(75, 192, 192, 0.6)",
                "rgba(153, 102, 255, 0.6)",
                "rgba(255, 159, 64, 0.6)",
                "rgba(54, 162, 235, 0.6)",
                "rgba(255, 99, 132, 0.6)",
              ]
            }]
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchChartData();
  }, [dimensions, isDataLoaded, executeQuery]);

  // Handle drill down for line chart
  const handleLineChartClick = async (event: any) => {
    if (!lineChartRef.current) return;
    
    try {
      const points = lineChartRef.current.getElementsAtEventForMode(
        event,
        'nearest',
        { intersect: true },
        false
      );

      if (points.length === 0) return;
      
      const clickedPoint = points[0];
      const { datasetIndex, index } = clickedPoint;
      const period = lineChartData?.labels?.[index] as string;
      const dataType = lineChartData?.datasets?.[datasetIndex]?.label?.toLowerCase() || '';
      
      await handleDrillDown('line', period, dataType);
    } catch (error) {
      console.error("Error in line chart click handler:", error);
    }
  };

  // Handle drill down for bar chart
  const handleBarChartClick = async (event: any) => {
    if (!barChartRef.current) return;
    
    try {
      const points = barChartRef.current.getElementsAtEventForMode(
        event,
        'nearest',
        { intersect: true },
        false
      );

      if (points.length === 0) return;
      
      const clickedPoint = points[0];
      const { datasetIndex, index } = clickedPoint;
      const period = barChartData?.labels?.[index] as string;
      const dataType = barChartData?.datasets?.[datasetIndex]?.label?.toLowerCase() || '';
      
      await handleDrillDown('bar', period, dataType);
    } catch (error) {
      console.error("Error in bar chart click handler:", error);
    }
  };

  // Handle drill down for pie chart
  const handlePieChartClick = async (event: any) => {
    if (!pieChartRef.current) return;
    
    try {
      const points = pieChartRef.current.getElementsAtEventForMode(
        event,
        'nearest',
        { intersect: true },
        false
      );

      if (points.length === 0) return;
      
      const clickedPoint = points[0];
      const { index } = clickedPoint;
      const dataType = pieChartData?.labels?.[index] as string;
      
      await handleDrillDown('pie', dataType, 'financialDistribution');
    } catch (error) {
      console.error("Error in pie chart click handler:", error);
    }
  };

  // Handle drill down for donut chart
  const handleDonutChartClick = async (event: any) => {
    if (!donutChartRef.current) return;
    
    try {
      const points = donutChartRef.current.getElementsAtEventForMode(
        event,
        'nearest',
        { intersect: true },
        false
      );

      if (points.length === 0) return;
      
      const clickedPoint = points[0];
      const { index } = clickedPoint;
      const category = donutChartData?.labels?.[index] as string;
      
      await handleDrillDown('donut', category, 'categoryRevenue');
    } catch (error) {
      console.error("Error in donut chart click handler:", error);
    }
  };

  // Generic drill down function
  const handleDrillDown = async (chartType: string, category: string, dataType: string) => {
    if (!isDataLoaded) return;
    
    setIsLoading(true);
    // const whereClause = selectedYear !== "all" ? `AND fiscalYear = '${selectedYear}'` : "";
    const whereClause = ""
    
    try {
      let query = "";
      let title = "";
      let drillChartType: 'bar' | 'line' | 'pie' = 'bar';
      
      switch (chartType) {
        case 'bar':
          if (dataType === 'revenue') {
            query = `SELECT fiscalYear, catFinancialView, SUM(revenue) as value 
                     FROM financial_data 
                     WHERE period = '${category}' ${whereClause}
                     GROUP BY fiscalYear, catFinancialView
                     ORDER BY fiscalYear, value DESC`;
            title = `Revenue Breakdown for Period: ${category}`;
            drillChartType = 'bar';
          } else if (dataType === 'expenses') {
            query = `SELECT fiscalYear, catFinancialView, SUM(operatingExpenses) as value 
                     FROM financial_data 
                     WHERE period = '${category}' ${whereClause}
                     GROUP BY fiscalYear, catFinancialView
                     ORDER BY fiscalYear, value DESC`;
            title = `Expenses Breakdown for Period: ${category}`;
            drillChartType = 'bar';
          }
          break;
          
        case 'line':
          let columnName = dataType.toLowerCase().replace(/\s+/g, '');
          query = `SELECT fiscalYear, catFinancialView, SUM(${columnName}) as value 
                   FROM financial_data 
                   WHERE period = '${category}' ${whereClause}
                   GROUP BY fiscalYear, catFinancialView
                   ORDER BY value DESC`;
          title = `${dataType} Breakdown for Period: ${category}`;
          drillChartType = 'bar';
          break;
          
        case 'donut':
          query = `SELECT fiscalYear, period, SUM(revenue) as value 
                   FROM financial_data 
                   WHERE catAccountingView = '${category}' ${whereClause}
                   GROUP BY fiscalYear, period
                   ORDER BY fiscalYear, period`;
          title = `Revenue Breakdown for Category: ${category}`;
          drillChartType = 'line';
          break;
          
        case 'pie':
          const metricColumn = category.toLowerCase().replace(/\s+/g, '');
          query = `SELECT catFinancialView, SUM(${metricColumn === 'other' ? 'revenue' : metricColumn}) as value 
                   FROM financial_data 
                   WHERE 1=1 ${whereClause}
                   GROUP BY catFinancialView
                   ORDER BY value DESC`;
          title = `${category} Breakdown by Financial Category`;
          drillChartType = 'pie';
          break;
      }
      
      if (query) {
        const result = await executeQuery(query);
        if (result.success && result.data && result.data.length > 0) {
          const drillData = result.data;
          
          // Create appropriate chart data based on drill-down type
          let formattedData: ChartData<'bar' | 'line' | 'pie'> = {
            labels: [],
            datasets: []
          };
          
          if (drillChartType === 'bar') {
            // Group by fiscal year if present
            if (drillData[0].fiscalYear) {
              // Create a lookup of all unique categories and fiscal years
              const categories = Array.from(new Set(drillData.map((d: any) => d.catFinancialView)));
              const fiscalYears = Array.from(new Set(drillData.map((d: any) => d.fiscalYear)));
              
              formattedData = {
                labels: categories,
                datasets: fiscalYears.map((year: string, idx: number) => {
                  const yearData = drillData.filter((d: any) => d.fiscalYear === year);
                  const colorIdx = idx % 6;
                  const colors = [
                    "rgba(75, 192, 192, 0.6)",
                    "rgba(255, 99, 132, 0.6)", 
                    "rgba(53, 162, 235, 0.6)",
                    "rgba(255, 206, 86, 0.6)",
                    "rgba(153, 102, 255, 0.6)",
                    "rgba(255, 159, 64, 0.6)"
                  ];
                  
                  return {
                    label: `Year ${year}`,
                    data: categories.map(cat => {
                      const match = yearData.find((d: any) => d.catFinancialView === cat);
                      return match ? match.value : 0;
                    }),
                    backgroundColor: colors[colorIdx]
                  };
                })
              };
            } else {
              formattedData = {
                labels: drillData.map((d: any) => d.catFinancialView || d.period),
                datasets: [{
                  label: 'Value',
                  data: drillData.map((d: any) => d.value),
                  backgroundColor: "rgba(75, 192, 192, 0.6)"
                }]
              };
            }
          } else if (drillChartType === 'line') {
            // Group by period if present
            if (drillData[0].period) {
              // Create a lookup of all unique fiscal years
              const fiscalYears = Array.from(new Set(drillData.map((d: any) => d.fiscalYear)));
              const periods = Array.from(new Set(drillData.map((d: any) => d.period)));
              
              formattedData = {
                labels: periods,
                datasets: fiscalYears.map((year: string, idx: number) => {
                  const yearData = drillData.filter((d: any) => d.fiscalYear === year);
                  const colorIdx = idx % 6;
                  const colors = [
                    "rgb(75, 192, 192)",
                    "rgb(255, 99, 132)", 
                    "rgb(53, 162, 235)",
                    "rgb(255, 206, 86)",
                    "rgb(153, 102, 255)",
                    "rgb(255, 159, 64)"
                  ];
                  
                  return {
                    label: `Year ${year}`,
                    data: periods.map(period => {
                      const match = yearData.find((d: any) => d.period === period);
                      return match ? match.value : 0;
                    }),
                    borderColor: colors[colorIdx],
                    backgroundColor: colors[colorIdx].replace('rgb', 'rgba').replace(')', ', 0.5)')
                  };
                })
              };
            } else {
              formattedData = {
                labels: drillData.map((d: any) => d.period || d.fiscalYear),
                datasets: [{
                  label: 'Value',
                  data: drillData.map((d: any) => d.value),
                  borderColor: "rgb(75, 192, 192)",
                  backgroundColor: "rgba(75, 192, 192, 0.5)"
                }]
              };
            }
          } else if (drillChartType === 'pie') {
            formattedData = {
              labels: drillData.map((d: any) => d.catFinancialView),
              datasets: [{
                data: drillData.map((d: any) => d.value),
                backgroundColor: [
                  "rgba(75, 192, 192, 0.6)",
                  "rgba(255, 99, 132, 0.6)",
                  "rgba(53, 162, 235, 0.6)",
                  "rgba(255, 206, 86, 0.6)",
                  "rgba(153, 102, 255, 0.6)",
                  "rgba(255, 159, 64, 0.6)",
                ]
              }]
            };
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

  const chartOptions: ChartOptions<'line' | 'bar' | 'pie' | 'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "top" } }
  };

  if (error) return <div className="text-red-500">{error}</div>;
  if (isLoading) return <div className="text-center p-8">Loading...</div>;

  return (
    <section className="p-8 bg-gray-50">
      <h1 className="text-3xl font-bold text-center mb-8">Financial Dashboard - Chart Js</h1>
    <GroupModal
           isOpen={isGroupModalOpen}
           onClose={() => setIsGroupModalOpen(false)}
           onCreateGroup={handleCreateGroup}
         />
         <div className="flex flex-col mb-4">
           {dimensions?.groupName && <p className="text-sm text-gray-500">Current Group Name: <span className="capitalize font-bold">{dimensions.groupName}</span></p>}
           <div>
             <button onClick={() => setDimensions(null)} className="shadow-xl border bg-red-400 p-2 rounded text-white">Reset Group</button>
             <button onClick={() => setIsGroupModalOpen(true)} className="shadow-xl border bg-blue-400 p-2 rounded text-white">Create Group</button>
           </div>
         </div>

      {drillDown.active && drillDownData ? (
        <DrillDownChart 
          drillDownState={drillDown} 
          drillDownData={drillDownData} 
          onBack={resetDrillDown} 
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {lineChartData && (
            <ChartContainer title="Revenue Trends" chartRef={lineChartRef} data={lineChartData}>
              <Line
                ref={lineChartRef}
                 // @ts-ignore
                options={{
                  ...chartOptions,
                  onClick: handleLineChartClick
                }}
                data={lineChartData}
              />
            </ChartContainer>
          )}
          {barChartData && (
            <ChartContainer title="Revenue vs Expenses" chartRef={barChartRef} data={barChartData}>
              <Bar
                ref={barChartRef}
                 // @ts-ignore
                options={{
                  ...chartOptions,
                  onClick: handleBarChartClick
                }}
                data={barChartData}
              />
            </ChartContainer>
          )}
          {pieChartData && (
            <ChartContainer title="Financial Distribution" chartRef={pieChartRef} data={pieChartData}>
              <Pie
                ref={pieChartRef}
                options={{
                  ...chartOptions,
                  onClick: handlePieChartClick
                }}
                data={pieChartData}
              />
            </ChartContainer>
          )}
          {donutChartData && (
            <ChartContainer title="Revenue by Category" chartRef={donutChartRef} data={donutChartData}>
              <Doughnut
                ref={donutChartRef}
                options={{
                  ...chartOptions,
                  cutout: "50%",
                  onClick: handleDonutChartClick
                }}
                data={donutChartData}
              />
            </ChartContainer>
          )}
          <p className="col-span-1 md:col-span-2 text-sm text-gray-500">
            <i>Click on any chart element to drill down into more detailed data</i>
          </p>
        </div>
      )}
    </section>
  );
}