"use client";
import React, { useState, useEffect, useRef } from "react";
import ReactECharts from "echarts-for-react";
import { useDuckDBContext } from "../_providers/DuckDBContext";
import { Dimensions } from "@/types/Schemas";
import { buildWhereClause } from "@/lib/services/buildWhereClause";
import { GroupModal } from "@/components/GroupManagement";

// Define TypeScript interfaces for chart data
interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
  onExportCSV?: () => void;
  onExportPNG?: () => void;
  isDrilled?: boolean;
  onBack?: () => void;
}

interface FilterBarProps {
  years: string[];
  selectedYear: string;
  onYearChange: (year: string) => void;
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

interface PieChartDataPoint {
  grossMargin: number;
  opEx: number;
  netProfit: number;
  revenue: number;
}

interface DonutChartDataPoint {
  catAccountingView: string;
  revenue: number;
}

// Drill-down state interface
interface DrillDownState {
  active: boolean;
  chartType: string;
  category: string;
  title: string;
  dataType: string;
}

const EChartsPage = () => {
  const { executeQuery, isDataLoaded } = useDuckDBContext();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Chart data states
  const [lineChartData, setLineChartData] = useState<LineChartDataPoint[]>([]);
  const [barChartData, setBarChartData] = useState<BarChartDataPoint[]>([]);
  const [pieChartData, setPieChartData] = useState<PieChartDataPoint | null>(null);
  const [donutChartData, setDonutChartData] = useState<DonutChartDataPoint[]>([]);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState<boolean>(false);
  const [dimensions, setDimensions] = useState<Dimensions | null>(null);
  const [drillDownData, setDrillDownData] = useState<any[]>([]);

  // Chart refs for PNG export
  const lineChartRef = useRef(null);
  const barChartRef = useRef(null);
  const pieChartRef = useRef(null);
  const donutChartRef = useRef(null);
  const drillDownChartRef = useRef(null);

  // Drill down state
  const [drillDown, setDrillDown] = useState<DrillDownState>({
    active: false,
    chartType: "",
    category: "",
    title: "",
    dataType: ""
  });


  // Fetch chart data based on selected year
  useEffect(() => {
    if (!isDataLoaded) return;

    const fetchChartData = async (): Promise<void> => {
      setIsLoading(true);
      try {
        // Build WHERE clause for year filter
        const whereClause = buildWhereClause(dimensions);

        // Line chart data - monthly performance trends
        const lineQuery = `
          SELECT period, AVG(revenue) as revenue, AVG(grossMargin) as grossMargin, AVG(netProfit) as netProfit 
          FROM financial_data 
          ${whereClause}
          GROUP BY period 
          ORDER BY period
        `;

        // Bar chart data - revenue vs expenses
        const barQuery = `
          SELECT period, SUM(revenue) as revenue, SUM(operatingExpenses) as expenses
          FROM financial_data
          ${whereClause}
          GROUP BY period
          ORDER BY period
        `;

        // Pie chart data - financial distribution
        const pieQuery = `
          SELECT 
            SUM(grossMargin) as grossMargin,
            SUM(operatingExpenses) as opEx,
            SUM(netProfit) as netProfit,
            SUM(revenue) as revenue
          FROM financial_data
          ${whereClause}
        `;

        // Donut chart data - distribution by category
        const donutQuery = `
          SELECT catAccountingView, SUM(revenue) as revenue
          FROM financial_data
          ${whereClause}
          GROUP BY catAccountingView
          ORDER BY revenue DESC
        `;

        // Execute all queries in parallel
        const [lineResult, barResult, pieResult, donutResult] = await Promise.all([
          executeQuery(lineQuery),
          executeQuery(barQuery),
          executeQuery(pieQuery),
          executeQuery(donutQuery)
        ]);

        // Process line chart data
        if (lineResult.success && lineResult.data) {
          setLineChartData(lineResult.data as LineChartDataPoint[]);
        }

        // Process bar chart data
        if (barResult.success && barResult.data) {
          setBarChartData(barResult.data as BarChartDataPoint[]);
        }

        // Process pie chart data
        if (pieResult.success && pieResult.data && pieResult.data[0]) {
          setPieChartData(pieResult.data[0] as PieChartDataPoint);
        }

        // Process donut chart data
        if (donutResult.success && donutResult.data) {
          setDonutChartData(donutResult.data as DonutChartDataPoint[]);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchChartData();
  }, [dimensions, isDataLoaded, executeQuery]);

  // Reset drill down
  const resetDrillDown = () => {
    setDrillDown({
      active: false,
      chartType: "",
      category: "",
      title: "",
      dataType: ""
    });
    setDrillDownData([]);
  };

  const handleCreateGroup = (datas: any) => {
    setDimensions(datas);
  }
  
  // Handle drill down
  const handleDrillDown = async (chartType: string, category: string, value: any, dataType: string) => {
    if (!isDataLoaded) return;

    setIsLoading(true);
    setError(null);

    try {
      let query = "";
      let title = "";

      switch (chartType) {
        case 'bar':
          if (dataType === 'revenue') {
            query = `SELECT fiscalYear, catFinancialView, SUM(revenue) as value 
                     FROM financial_data 
                     WHERE period = '${category}'
                     GROUP BY fiscalYear, catFinancialView
                     ORDER BY fiscalYear, value DESC`;
            title = `Revenue Breakdown for Period: ${category}`;
          } else if (dataType === 'expenses') {
            query = `SELECT fiscalYear, catFinancialView, SUM(operatingExpenses) as value 
                     FROM financial_data 
                     WHERE period = '${category}'
                     GROUP BY fiscalYear, catFinancialView
                     ORDER BY fiscalYear, value DESC`;
            title = `Expenses Breakdown for Period: ${category}`;
          }
          break;

        case 'line':
          query = `SELECT fiscalYear, catFinancialView, SUM(${dataType}) as value 
                   FROM financial_data 
                   WHERE period = '${category}'
                   GROUP BY fiscalYear, catFinancialView
                   ORDER BY value DESC`;
          title = `${dataType.charAt(0).toUpperCase() + dataType.slice(1)} Breakdown for Period: ${category}`;
          break;

        case 'donut':
          query = `SELECT fiscalYear, period, SUM(revenue) as value 
                   FROM financial_data 
                   WHERE catAccountingView = '${category}'
                   GROUP BY fiscalYear, period
                   ORDER BY fiscalYear, period`;
          title = `Revenue Breakdown for Category: ${category}`;
          break;

        case 'pie':
          if (dataType === 'financialDistribution') {
            query = `SELECT catFinancialView, SUM(${category}) as value 
                     FROM financial_data 
                     GROUP BY catFinancialView
                     ORDER BY value DESC`;
            title = `${category} Breakdown by Financial Category`;
          }
          break;
      }

      if (query) {
        const result = await executeQuery(query);
        if (result.success && result.data && result.data.length > 0) {
          setDrillDownData(result.data);
          setDrillDown({
            active: true,
            chartType,
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

  // Export to CSV function
  const exportToCSV = (data: any[]) => {
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

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-pulse">Loading financial data...</div>
      </div>
    );
  }

  return (
    <section className="p-8 bg-gray-50">
      <h1 className="text-3xl font-bold text-center mb-8">
        Financial Dashboard ECharts
      </h1>

      {!drillDown.active && (
       <>
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
       </>
      
      )}

      {drillDown.active ? (
        <DrillDownChart
          drillDownState={drillDown}
          drillDownData={drillDownData}
          onBack={resetDrillDown}
          chartRef={drillDownChartRef}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ChartContainer 
            title="Revenue Trends" 
            onExportCSV={() => exportToCSV(lineChartData)}
            onExportPNG={() => exportToPNG(lineChartRef)}
          >
            <LineChartComponent 
              data={lineChartData} 
              onDrillDown={(period, value, dataType) => handleDrillDown('line', period, value, dataType)} 
              chartRef={lineChartRef}
            />
          </ChartContainer>

          <ChartContainer 
            title="Revenue vs Expenses"
            onExportCSV={() => exportToCSV(barChartData)}
            onExportPNG={() => exportToPNG(barChartRef)}
          >
            <BarChartComponent 
              data={barChartData} 
              onDrillDown={(period, value, dataType) => handleDrillDown('bar', period, value, dataType)} 
              chartRef={barChartRef}
            />
          </ChartContainer>

          <ChartContainer 
            title="Financial Distribution"
            onExportCSV={() => pieChartData ? exportToCSV([pieChartData]) : null}
            onExportPNG={() => exportToPNG(pieChartRef)}
          >
            <PieChartComponent 
              data={pieChartData} 
              onDrillDown={(category, value) => handleDrillDown('pie', category, value, 'financialDistribution')} 
              chartRef={pieChartRef}
            />
          </ChartContainer>

          <ChartContainer 
            title="Revenue by Category"
            onExportCSV={() => exportToCSV(donutChartData)}
            onExportPNG={() => exportToPNG(donutChartRef)}
          >
            <DonutChartComponent 
              data={donutChartData} 
              onDrillDown={(category, value) => handleDrillDown('donut', category, value, 'categoryRevenue')} 
              chartRef={donutChartRef}
            />
          </ChartContainer>
        </div>
      )}
    </section>
  );
};

export default EChartsPage;

// Chart container component
const ChartContainer: React.FC<ChartContainerProps> = ({ title, children, onExportCSV, onExportPNG, isDrilled, onBack }) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <div className="flex justify-between items-center mb-4">
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
        {onExportPNG && (
          <button
            onClick={onExportPNG}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          >
            PNG
          </button>
        )}
        {onExportCSV && (
          <button
            onClick={onExportCSV}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          >
            CSV
          </button>
        )}
      </div>
    </div>
    <div className="h-64">{children}</div>
  </div>
);

const exportToPNG = (chartRef: any) => {
  if (!chartRef || !chartRef.current || !chartRef.current.getEchartsInstance) return;
  
  try {
    const echartInstance = chartRef.current.getEchartsInstance();
    const dataURL = echartInstance.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: '#fff'
    });
    
    const link = document.createElement('a');
    link.download = 'chart.png';
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error("Failed to export chart:", err);
    alert("Could not export chart as PNG. Please try again.");
  }
};

// Drill Down Chart Component
const DrillDownChart: React.FC<{
  drillDownState: DrillDownState;
  drillDownData: any[];
  onBack: () => void;
  chartRef: React.RefObject<any>;
}> = ({ drillDownState, drillDownData, onBack, chartRef }) => {
  const { title, chartType, dataType } = drillDownState;
  
  // Determine chart type based on data structure
  const firstDataPoint = drillDownData[0];
  const dataKeys = firstDataPoint ? Object.keys(firstDataPoint) : [];
  
  let option: any = {};
  
  if (dataKeys.includes('catFinancialView')) {
    // Bar chart for financial view breakdown
    option = {
      title: {
        text: title,
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: '{b}: ${c}'
      },
      xAxis: {
        type: 'category',
        data: drillDownData.map(item => item.catFinancialView),
        axisLabel: {
          rotate: 45,
          fontSize: 10
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: '${value}'
        }
      },
      series: [
        {
          type: 'bar',
          data: drillDownData.map(item => item.value),
          itemStyle: { color: '#4bc0c0' }
        }
      ]
    };
  } else if (dataKeys.includes('period')) {
    // Line chart for period data
    option = {
      title: {
        text: title,
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        formatter: '{b}: ${c}'
      },
      xAxis: {
        type: 'category',
        data: drillDownData.map(item => item.period),
        axisLabel: {
          rotate: 45,
          fontSize: 10
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: '${value}'
        }
      },
      series: [
        {
          type: 'line',
          smooth: true,
          data: drillDownData.map(item => item.value),
          itemStyle: { color: '#36a2eb' }
        }
      ]
    };
  } else {
    // Pie chart for other breakdowns
    const labelKey = dataKeys.find(key => key !== 'value') || dataKeys[0];
    option = {
      title: {
        text: title,
        left: 'center'
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: ${c} ({d}%)'
      },
      series: [
        {
          type: 'pie',
          radius: '70%',
          data: drillDownData.map(item => ({
            name: item[labelKey],
            value: item.value
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          label: {
            fontSize: 10
          }
        }
      ]
    };
  }

  return (
    <div className="mb-4">
      <ChartContainer
        title={title}
        isDrilled={true}
        onBack={onBack}
        onExportCSV={() => {
          const blob = new Blob([JSON.stringify(drillDownData)], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.setAttribute('href', url);
          link.setAttribute('download', `drill_down_data.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }}
        onExportPNG={() => exportToPNG(chartRef)}
      >
        <ReactECharts 
          option={option} 
          style={{ height: '100%' }} 
          ref={chartRef}
        />
      </ChartContainer>
      <p className="mt-2 text-sm text-gray-500 text-center">
        <i>Drill-down view showing detailed breakdown data</i>
      </p>
    </div>
  );
};

const LineChartComponent = ({ 
  data, 
  onDrillDown,
  chartRef
}: { 
  data: LineChartDataPoint[],
  onDrillDown: (period: string, value: number, dataType: string) => void,
  chartRef: React.RefObject<any>
}) => {
  if (!data || data.length === 0) return <div>No data available</div>;
  
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br/>{a0}: ${c0}<br/>{a1}: ${c1}<br/>{a2}: ${c2}'
    },
    legend: {
      data: ['Revenue', 'Gross Margin', 'Net Profit'],
      textStyle: { fontSize: 10 }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.period),
      axisLabel: {
        rotate: 45,
        fontSize: 10
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '${value}'
      }
    },
    series: [
      {
        name: 'Revenue',
        type: 'line',
        smooth: true,
        data: data.map(item => item.revenue),
        itemStyle: { color: '#4bc0c0' }
      },
      {
        name: 'Gross Margin',
        type: 'line',
        smooth: true,
        data: data.map(item => item.grossMargin),
        itemStyle: { color: '#36a2eb' }
      },
      {
        name: 'Net Profit',
        type: 'line',
        smooth: true,
        data: data.map(item => item.netProfit),
        itemStyle: { color: '#ff6384' }
      }
    ]
  };

  const onChartClick = (params: any) => {
    const { name, seriesName, value } = params;
    let dataType = 'revenue';
    if (seriesName === 'Gross Margin') dataType = 'grossMargin';
    if (seriesName === 'Net Profit') dataType = 'netProfit';
    onDrillDown(name, value, dataType);
  };
  
  const onEvents = {
    'click': onChartClick
  };

  return <ReactECharts 
    option={option} 
    style={{ height: '100%' }} 
    onEvents={onEvents}
    ref={chartRef}
  />;
};

const BarChartComponent = ({ 
  data,
  onDrillDown,
  chartRef
}: { 
  data: BarChartDataPoint[],
  onDrillDown: (period: string, value: number, dataType: string) => void,
  chartRef: React.RefObject<any>
}) => {
  if (!data || data.length === 0) return <div>No data available</div>;
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: '{b}<br/>{a0}: ${c0}<br/>{a1}: ${c1}'
    },
    legend: {
      data: ['Revenue', 'Expenses'],
      textStyle: { fontSize: 10 }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.period),
      axisLabel: {
        rotate: 45,
        fontSize: 10
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '${value}'
      }
    },
    series: [
      {
        name: 'Revenue',
        type: 'bar',
        data: data.map(item => item.revenue),
        itemStyle: { color: '#4bc0c0' }
      },
      {
        name: 'Expenses',
        type: 'bar',
        data: data.map(item => item.expenses),
        itemStyle: { color: '#ff6384' }
      }
    ]
  };

  const onChartClick = (params: any) => {
    const { name, seriesName, value } = params;
    const dataType = seriesName === 'Revenue' ? 'revenue' : 'expenses';
    onDrillDown(name, value, dataType);
  };
  
  const onEvents = {
    'click': onChartClick
  };

  return <ReactECharts 
    option={option} 
    style={{ height: '100%' }} 
    onEvents={onEvents}
    ref={chartRef}
  />;
};

const PieChartComponent = ({ 
  data,
  onDrillDown,
  chartRef
}: { 
  data: PieChartDataPoint | null,
  onDrillDown: (category: string, value: number) => void,
  chartRef: React.RefObject<any>
}) => {
  if (!data) return <div>No data available</div>;
  
  const pieData = [
    { value: data.grossMargin, name: 'GrossMargin' },
    { value: data.opEx, name: 'OperatingExpenses' },
    { value: data.netProfit, name: 'NetProfit' },
    { value: data.revenue, name: 'revenue' }
  ];
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: ${c} ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      bottom: 'bottom',
      textStyle: { fontSize: 10 }
    },
    series: [
      {
        name: 'Financial Distribution',
        type: 'pie',
        radius: '70%',
        data: pieData,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          fontSize: 10
        },
        color: ['#4bc0c0', '#ff6384', '#36a2eb', '#ffce56']
      }
    ]
  };

  const onChartClick = (params: any) => {
    const { name, value } = params.data;
    onDrillDown(name, value);
  };
  
  const onEvents = {
    'click': onChartClick
  };

  return <ReactECharts 
    option={option} 
    style={{ height: '100%' }} 
    onEvents={onEvents}
    ref={chartRef}
  />;
};

const DonutChartComponent = ({ 
  data,
  onDrillDown,
  chartRef
}: { 
  data: DonutChartDataPoint[],
  onDrillDown: (category: string, value: number) => void,
  chartRef: React.RefObject<any>
}) => {
  if (!data || data.length === 0) return <div>No data available</div>;
  
  // Limit to top 6 categories for better visibility
  const topCategories = data.slice(0, 6);
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: ${c} ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      bottom: 'bottom',
      textStyle: { fontSize: 9 }
    },
    series: [
      {
        name: 'Revenue by Category',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        label: {
          fontSize: 9
        },
        data: topCategories.map(item => ({
          name: item.catAccountingView,
          value: item.revenue
        })),
        color: [
          '#ffce56', '#4bc0c0', '#9966ff', 
          '#ff9f40', '#36a2eb', '#ff6384'
        ]
      }
    ]
  };

  const onChartClick = (params: any) => {
    const { name, value } = params.data;
    onDrillDown(name, value);
  };
  
  const onEvents = {
    'click': onChartClick
  };

  return <ReactECharts 
    option={option} 
    style={{ height: '100%' }} 
    onEvents={onEvents}
    ref={chartRef}
  />;
};