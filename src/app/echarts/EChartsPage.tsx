"use client";
import React, { useState, useEffect, useRef } from "react";
import ReactECharts from "echarts-for-react";
import { GroupModal } from "../../components/GroupManagement";
import { 
  useFetchLineChartDataMutation,
  useFetchBarChartDataMutation,
  useFetchPieChartDataMutation,
  useFetchDonutChartDataMutation,
  useFetchDrillDownDataMutation,
  databaseName
} from "@/lib/services/usersApi";
// Types
import { Dimensions } from "@/types/Schemas";
import { buildRequestBody } from "@/lib/services/buildWhereClause";

// Core data types
interface ChartDataPoint {
  period?: string;
  revenue?: number;
  expenses?: number;
  grossMargin?: number;
  netProfit?: number;
  catAccountingView?: string;
  catfinancialview?: string;
  label?: string;
  value?: number;
  [key: string]: any;
}

// Define TypeScript interfaces for chart data
interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
  onExportCSV?: () => void;
  onExportPNG?: () => void;
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

interface PieChartDataPoint {
  catfinancialview: string;
  revenue: number;
}

interface DonutChartDataPoint {
  cataccountingview: string;
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
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState<boolean>(false);
  const [dimensions, setDimensions] = useState<Dimensions | null>(null);
  
  // API Mutations
  const [fetchLineChartData] = useFetchLineChartDataMutation();
  const [fetchBarChartData] = useFetchBarChartDataMutation();
  const [fetchPieChartData] = useFetchPieChartDataMutation();
  const [fetchDonutChartData] = useFetchDonutChartDataMutation();
  const [fetchDrillDownData] = useFetchDrillDownDataMutation();

  // Chart data states
  const [lineChartData, setLineChartData] = useState<LineChartDataPoint[]>([]);
  const [barChartData, setBarChartData] = useState<BarChartDataPoint[]>([]);
  const [pieChartData, setPieChartData] = useState<PieChartDataPoint[]>([]);
  const [donutChartData, setDonutChartData] = useState<DonutChartDataPoint[]>([]);
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

  // Fetch all chart data using APIs
  const fetchAllChartData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch line chart data
      const lineResult = await fetchLineChartData({
        body: buildRequestBody(dimensions,'line', 'country')
      }).unwrap();

      // Fetch bar chart data
      const barResult = await fetchBarChartData({
        body: buildRequestBody(dimensions,'bar', 'country')
      }).unwrap();

      // Fetch pie chart data
      const pieResult = await fetchPieChartData({
        body: buildRequestBody(dimensions,'pie', 'catfinancialview')
      }).unwrap();

      // Fetch donut chart data
      const donutResult = await fetchDonutChartData({
        body: buildRequestBody(dimensions,'donut', 'cataccountingview')
      }).unwrap();

      // Process line chart data
      const lineData = lineResult.success ? lineResult.data || [] : [];
      setLineChartData(lineData);

      // Process bar chart data - transform to include expenses
      const barData = barResult.success ? barResult.data || [] : [];
      const transformedBarData = barData.map((item: any) => ({
        period: item.period,
        revenue: item.revenue,
        expenses: item.expenses
      }));      
      setBarChartData(transformedBarData);

      // Process pie chart data - use actual API data instead of dummy
      const pieData = pieResult.success ? pieResult.data || [] : [];
      setPieChartData(pieData);

      // Process donut chart data
      const donutData = donutResult.success ? donutResult.data || [] : [];
      console.log(donutData,'logsssss');
      
      setDonutChartData(donutData);

    } catch (err: any) {
      setError(err?.data?.detail || err.message || "Failed to fetch chart data");
      console.error("Error fetching chart data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when dimensions change
  useEffect(() => {
    fetchAllChartData();
  }, [dimensions]);

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
  
  // Handle drill down using API
  const handleDrillDown = async (chartType: string, category: string, value: any, dataType: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchDrillDownData({
        table_name: databaseName,
        chart_type: chartType,
        category: category,
        data_type: dataType,
        value: value
      }).unwrap();

      if (result.success && result.data && result.data.length > 0) {
        const drillData = result.data;
        const title = result.title || `${dataType} Breakdown for ${category}`;

        setDrillDownData(drillData);
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
    } catch (err: any) {
      setError(err?.data?.detail || err.message || "Failed to fetch drill-down data");
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
    return (
      <div className="flex justify-between bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <p>{error}</p>
        <p onClick={() => setError('')} className="cursor-pointer">x</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
        <p>Loading chart data...</p>
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
              <div className="flex gap-2">
                <button onClick={() => setDimensions(null)} className="shadow-xl border bg-red-400 p-2 rounded text-white hover:bg-red-500">Reset Group</button>
                <button onClick={() => setIsGroupModalOpen(true)} className="shadow-xl border bg-blue-400 p-2 rounded text-white hover:bg-blue-500">Create Group</button>
                <button onClick={fetchAllChartData} className="shadow-xl border bg-green-400 p-2 rounded text-white hover:bg-green-500">Refresh Data</button>
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
            onExportCSV={() => exportToCSV(pieChartData)}
            onExportPNG={() => exportToPNG(pieChartRef)}
          >
            <PieChartComponent 
              data={pieChartData} 
              onDrillDown={(category, value) => handleDrillDown('pie', category, value, 'revenue')} 
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
              onDrillDown={(category, value) => handleDrillDown('donut', category, value, 'revenue')} 
              chartRef={donutChartRef}
            />
          </ChartContainer>
        </div>
      )}

      {!drillDown.active && (
        <p className="col-span-1 md:col-span-2 text-sm text-gray-500 text-center mt-4">
          <i>Click on any chart element to drill down into more detailed data</i>
        </p>
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
  const { title } = drillDownState;
  
  // Determine chart type based on data structure
  const firstDataPoint = drillDownData[0];
  const dataKeys = firstDataPoint ? Object.keys(firstDataPoint) : [];
  
  let option: any = {};
  
  if (dataKeys.includes('catfinancialview') || dataKeys.includes('catFinancialView')) {
    // Bar chart for financial view breakdown
    const categoryKey = dataKeys.includes('catfinancialview') ? 'catfinancialview' : 'catFinancialView';
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
        data: drillDownData.map(item => item[categoryKey]),
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
        // @ts-ignore
        onExportCSV={() => exportToCSV(drillDownData)}
        onExportPNG={() => exportToPNG(chartRef)}
      >
        <ReactECharts 
          option={option} 
          style={{ height: '100%' }} 
          ref={chartRef}
        />
      </ChartContainer>
      <p className="mt-2 text-sm text-gray-500 text-center">
        <i>Click any data point for further drill-down, or use the back button to return</i>
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
  data: PieChartDataPoint[],
  onDrillDown: (category: string, value: number) => void,
  chartRef: React.RefObject<any>
}) => {
  if (!data || data.length === 0) return <div>No data available</div>;
  
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
        data: data.map(item => ({
          name: item.catfinancialview,
          value: item.revenue
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
        },
        color: ['#4bc0c0', '#ff6384', '#36a2eb', '#ffce56', '#9966ff', '#ff9f40']
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
          name: item.cataccountingview,
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