"use client";
import React, { useEffect, useState, useRef } from "react";
import {
  VictoryChart,
  VictoryLine,
  VictoryTheme,
  VictoryLegend,
  VictoryGroup,
  VictoryBar,
  VictoryAxis,
  VictoryPie,
  VictoryTooltip,
  VictoryScatter
} from "victory";
import { useDuckDBContext } from "../_providers/DuckDBContext";
import { Dimensions } from "@/types/Schemas";
import { buildWhereClause } from "@/lib/services/buildWhereClause";
import { GroupModal } from "../../components/GroupManagement";

// Types
interface ChartData {
  line: Array<{ period: string; revenue: number; grossMargin: number; netProfit: number; }>;
  bar: Array<{ period: string; revenue: number; expenses: number; }>;
  pie: { grossMargin: number; opEx: number; netProfit: number; revenue: number; } | null;
  donut: Array<{ catAccountingView: string; revenue: number; }>;
  drillDown: any[];
}

interface DrillDownState {
  active: boolean;
  type: 'line' | 'bar' | 'pie' | 'donut' | '';
  category: string;
  field: string;
  title: string;
}

// Chart Container with Export functionality
const ChartContainer: React.FC<{
  title: string;
  children: React.ReactNode;
  onBack?: () => void;
  isDrilled?: boolean;
  data?: any[];
}> = ({ title, children, onBack, isDrilled, data }) => {
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
    link.setAttribute('download', `${title.toLowerCase().replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PNG export function
  const exportToPNG = () => {
    const chartElement = chartRef.current;
    if (!chartElement) return;

    const svg = chartElement.querySelector('svg');
    
    if (svg) {
      try {
        // Create a canvas element
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const svgData = new XMLSerializer().serializeToString(svg);
        const img = new Image();
        
        // Set dimensions from SVG
        const svgRect = svg.getBoundingClientRect();
        canvas.width = svgRect.width;
        canvas.height = svgRect.height;
        
        // Convert SVG to PNG
        const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
        const DOMURL = window.URL || window.webkitURL || window;
        const url = DOMURL.createObjectURL(svgBlob);
        
        img.onload = function() {
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            DOMURL.revokeObjectURL(url);
            
            const imgURI = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
            
            const link = document.createElement('a');
            link.download = `${title.toLowerCase().replace(/\s+/g, '_')}.png`;
            link.href = imgURI;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        };
        
        img.src = url;
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
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold">{title}</h2>
          {isDrilled && onBack && (
            <button
              onClick={onBack}
              className="ml-3 px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
            >
              ← Back
            </button>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={exportToPNG}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            disabled={!data || data.length === 0}
          >
            PNG
          </button>
          <button
            onClick={exportToCSV}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            disabled={!data || data.length === 0}
          >
            CSV
          </button>
        </div>
      </div>
      <div className="w-full h-[400px]" ref={chartRef}>{children}</div>
    </div>
  );
};


// Main Component
const VictoryChartsPage: React.FC = () => {
  const { executeQuery, isDataLoaded } = useDuckDBContext();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState<boolean>(false);
  const [dimensions, setDimensions] = useState<Dimensions | null>(null);
  const [chartData, setChartData] = useState<ChartData>({
    line: [],
    bar: [],
    pie: null,
    donut: [],
    drillDown: []
  });
  const [drillDown, setDrillDown] = useState<DrillDownState>({
    active: false,
    type: '',
    category: '',
    field: '',
    title: ''
  });


  // Fetch chart data
  useEffect(() => {
    if (!isDataLoaded) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const whereClause = buildWhereClause(dimensions);

        const queries = {
          line: `SELECT period, AVG(revenue) as revenue, AVG(grossMargin) as grossMargin, AVG(netProfit) as netProfit 
                 FROM financial_data ${whereClause} GROUP BY period ORDER BY period`,
          bar: `SELECT period, SUM(revenue) as revenue, SUM(operatingExpenses) as expenses
                FROM financial_data ${whereClause} GROUP BY period ORDER BY period`,
          pie: `SELECT SUM(grossMargin) as grossMargin, SUM(operatingExpenses) as opEx, 
                SUM(netProfit) as netProfit, SUM(revenue) as revenue
                FROM financial_data ${whereClause}`,
          donut: `SELECT catAccountingView, SUM(revenue) as revenue
                  FROM financial_data ${whereClause} GROUP BY catAccountingView ORDER BY revenue DESC`
        };

        const [lineResult, barResult, pieResult, donutResult] = await Promise.all([
          executeQuery(queries.line),
          executeQuery(queries.bar),
          executeQuery(queries.pie),
          executeQuery(queries.donut)
        ]);

        setChartData({
          line: lineResult.success ? lineResult.data || [] : [],
          bar: barResult.success ? barResult.data || [] : [],
          pie: pieResult.success && pieResult.data?.[0] ? pieResult.data[0] : null,
          donut: donutResult.success ? donutResult.data || [] : [],
          drillDown: []
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [dimensions, isDataLoaded, executeQuery]);

  // Drill-down handler
  const handleDrillDown = async (type: DrillDownState['type'], category: string, field: string) => {
    if (!isDataLoaded) return;
    setIsLoading(true);
    setError(null);

    try {
      let query = "";
      let title = "";

      switch (type) {
        case 'line':
          query = `SELECT fiscalYear, catFinancialView, SUM(${field}) as value 
                   FROM financial_data WHERE period = '${category}' 
                   GROUP BY fiscalYear, catFinancialView ORDER BY value DESC`;
          title = `${field} Breakdown for ${category}`;
          break;
        case 'bar':
          query = `SELECT fiscalYear, catFinancialView, SUM(${field}) as value 
                   FROM financial_data WHERE period = '${category}' 
                   GROUP BY fiscalYear, catFinancialView ORDER BY value DESC`;
          title = `${field} Breakdown for ${category}`;
          break;
        case 'pie':
          query = `SELECT catFinancialView, SUM(${field}) as value 
                   FROM financial_data GROUP BY catFinancialView ORDER BY value DESC`;
          title = `${field} Distribution by Category`;
          break;
        case 'donut':
          query = `SELECT fiscalYear, period, SUM(revenue) as value 
                   FROM financial_data WHERE catAccountingView = '${category}' 
                   GROUP BY fiscalYear, period ORDER BY fiscalYear, period`;
          title = `Revenue Breakdown for ${category}`;
          break;
      }

      if (query) {
        const result = await executeQuery(query);
        if (result.success && result.data?.length) {
          // @ts-ignore
          setChartData(prev => ({ ...prev, drillDown: result.data }));
          setDrillDown({
            active: true,
            type,
            category,
            field,
            title
          });
        } else {
          setError("No data available for this selection");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  // Reset drill-down
  const resetDrillDown = () => {
    setDrillDown({ active: false, type: '', category: '', field: '', title: '' });
    setChartData(prev => ({ ...prev, drillDown: [] }));
  };

  const handleCreateGroup = (datas: any) => {
    setDimensions(datas);
  }

  return (
    <section className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-center mb-8">Financial Dashboard - Victory Charts</h1>
      
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

      {error && <p className="text-red-500 mb-2">{error}</p>}
      {isLoading && <p className="text-gray-500 mb-2">Loading...</p>}
      {drillDown.active ? (
        <div className="mb-8">
          <ChartContainer 
            title={drillDown.title} 
            onBack={resetDrillDown} 
            isDrilled
            data={chartData.drillDown}
          >
            <DrillDownChart data={chartData.drillDown} />
          </ChartContainer>
          <p className="mt-2 text-sm text-gray-500 text-center">
            <i>Click the back button to return to main charts</i>
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ChartContainer title="Revenue Trends" data={chartData.line}>
              <LineChart data={chartData.line} onDrillDown={handleDrillDown} />
            </ChartContainer>

            <ChartContainer title="Revenue vs Expenses" data={chartData.bar}>
              <BarChart data={chartData.bar} onDrillDown={handleDrillDown} />
            </ChartContainer>

            <ChartContainer title="Financial Distribution" data={chartData.pie ? [chartData.pie] : []}>
              <PieChart data={chartData.pie} onDrillDown={handleDrillDown} />
            </ChartContainer>

            <ChartContainer title="Revenue by Category" data={chartData.donut}>
              <DonutChart data={chartData.donut} onDrillDown={handleDrillDown} />
            </ChartContainer>
          </div>
          <p className="mt-4 text-sm text-gray-500 text-center">
            <i>Click on any chart element to drill down into more detailed data</i>
          </p>
        </>
      )}
    </section>
  );
};

// Individual Chart Components
const LineChart: React.FC<{
  data: any[];
  onDrillDown: (type: 'line', category: string, field: string) => void;
}> = ({ data, onDrillDown }) => {
  if (!data?.length) return <div className="text-center text-gray-500">No data available</div>;

  return (
    <VictoryChart theme={VictoryTheme.material} domainPadding={20} height={350}>
      <VictoryAxis tickFormat={x => x} style={{ tickLabels: { fontSize: 10, angle: -45 } }} />
      <VictoryAxis dependentAxis tickFormat={y => `$${Math.round(y / 1000)}k`} />
      <VictoryLegend
        x={50} y={10} orientation="horizontal" gutter={20}
        style={{ labels: { fontSize: 10 } }}
        data={[
          { name: "Revenue", symbol: { fill: "#4bc0c0" } },
          { name: "Gross Margin", symbol: { fill: "#36a2eb" } },
          { name: "Net Profit", symbol: { fill: "#ff6384" } },
        ]}
      />
      
      {/* Lines for visual representation */}
      <VictoryLine
        data={data} x="period" y="revenue"
        style={{ data: { stroke: "#4bc0c0", strokeWidth: 2 } }}
      />
      <VictoryLine
        data={data} x="period" y="grossMargin"
        style={{ data: { stroke: "#36a2eb", strokeWidth: 2 } }}
      />
      <VictoryLine
        data={data} x="period" y="netProfit"
        style={{ data: { stroke: "#ff6384", strokeWidth: 2 } }}
      />
      
      {/* Invisible scatter points for click detection - one for each line */}
      <VictoryScatter
        data={data} x="period" y="revenue"
        size={10} // Make them bigger for easier clicking
        style={{ data: { fill: "transparent" } }} // Invisible
        events={[{
          target: "data",
          eventHandlers: {
            onClick: (event, datum) => {
              const clickedPoint = datum.data[datum.index];
              if (clickedPoint && clickedPoint.period) {
                onDrillDown('line', clickedPoint.period, 'revenue');
              }
            }
          }
        }]}
      />
      <VictoryScatter
        data={data} x="period" y="grossMargin"
        size={10}
        style={{ data: { fill: "transparent" } }}
        events={[{
          target: "data",
          eventHandlers: {
            onClick: (event, datum) => {
              const clickedPoint = datum.data[datum.index];
              if (clickedPoint && clickedPoint.period) {
                onDrillDown('line', clickedPoint.period, 'grossMargin');
              }
            }
          }
        }]}
      />
      <VictoryScatter
        data={data} x="period" y="netProfit"
        size={10}
        style={{ data: { fill: "transparent" } }}
        events={[{
          target: "data",
          eventHandlers: {
            onClick: (event, datum) => {
              const clickedPoint = datum.data[datum.index];
              if (clickedPoint && clickedPoint.period) {
                onDrillDown('line', clickedPoint.period, 'netProfit');
              }
            }
          }
        }]}
      />
    </VictoryChart>
  );
};


const BarChart: React.FC<{
  data: any[];
  onDrillDown: (type: 'bar', category: string, field: string) => void;
}> = ({ data, onDrillDown }) => {
  if (!data?.length) return <div className="text-center text-gray-500">No data available</div>;

  return (
    <VictoryChart theme={VictoryTheme.material} domainPadding={20} height={350}>
      <VictoryAxis tickFormat={x => x} style={{ tickLabels: { fontSize: 10, angle: -45 } }} />
      <VictoryAxis dependentAxis tickFormat={y => `$${Math.round(y / 1000)}k`} />
      <VictoryLegend
        x={50} y={10} orientation="horizontal" gutter={20}
        style={{ labels: { fontSize: 10 } }}
        data={[
          { name: "Revenue", symbol: { fill: "#4bc0c0" } },
          { name: "Expenses", symbol: { fill: "#ff6384" } }
        ]}
      />
      <VictoryGroup offset={20} colorScale={["#4bc0c0", "#ff6384"]}>
        <VictoryBar
          data={data} x="period" y="revenue"
          events={[{
            target: "data",
            eventHandlers: {
              onClick: (event, datum) => {
                onDrillDown('bar', datum.datum.period, 'revenue');
              }
            }
          }]}
        />
        <VictoryBar
          data={data} x="period" y="expenses"
          events={[{
            target: "data",
            eventHandlers: {
              onClick: (event, datum) => {
                onDrillDown('bar', datum.datum.period, 'expenses');
              }
            }
          }]}
        />
      </VictoryGroup>
    </VictoryChart>
  );
};

const PieChart: React.FC<{
  data: any;
  onDrillDown: (type: 'pie', category: string, field: string) => void;
}> = ({ data, onDrillDown }) => {
  if (!data) return <div className="text-center text-gray-500">No data available</div>;
  
  const pieData = [
    { x: "Gross Margin", y: data.grossMargin, field: "grossMargin" },
    { x: "Operating Expenses", y: data.opEx, field: "operatingExpenses" },
    { x: "Net Profit", y: data.netProfit, field: "netProfit" },
    { x: "Revenue", y: data.revenue, field: "revenue" }
  ].filter(item => item.y > 0);

  return (
    <VictoryPie
      data={pieData}
      colorScale={["#4bc0c0", "#ff6384", "#36a2eb", "#ffce56"]}
      labelRadius={80}
      style={{ labels: { fontSize: 10, fill: "#333" } }}
      labels={({ datum }) => `${datum.x}: $${Math.round(datum.y)}`}
      height={350}
      events={[{
        target: "data",
        eventHandlers: {
          onClick: (event, datum) => {
            onDrillDown('pie', datum.datum.x, datum.datum.field);
          }
        }
      }]}
    />
  );
};

const DonutChart: React.FC<{
  data: any[];
  onDrillDown: (type: 'donut', category: string, field: string) => void;
}> = ({ data, onDrillDown }) => {
  if (!data?.length) return <div className="text-center text-gray-500">No data available</div>;
  
  const topCategories = data.slice(0, 6);
  
  return (
    <VictoryPie
      data={topCategories}
      x="catAccountingView" y="revenue"
      colorScale={["#ffce56", "#4bc0c0", "#9966ff", "#ff9f40", "#36a2eb", "#ff6384"]}
      innerRadius={70} labelRadius={90}
      style={{ labels: { fontSize: 10, fill: "#333" } }}
      labels={({ datum }) => `${datum.catAccountingView}: $${Math.round(datum.revenue)}`}
      height={350}
      events={[{
        target: "data",
        eventHandlers: {
          onClick: (event, datum) => {
            onDrillDown('donut', datum.datum.catAccountingView, 'revenue');
          }
        }
      }]}
    />
  );
};

// Drill-down Chart Component
const DrillDownChart: React.FC<{ data: any[] }> = ({ data }) => {
  if (!data?.length) return <div className="text-center text-gray-500">No data available</div>;

  const firstItem = data[0];
  const keys = Object.keys(firstItem);
  
  // Determine chart type based on data structure
  if (keys.includes('catFinancialView')) {
    return (
      <VictoryChart theme={VictoryTheme.material} domainPadding={20} height={350}>
        <VictoryAxis tickFormat={x => x} style={{ tickLabels: { fontSize: 10, angle: -45 } }} />
        <VictoryAxis dependentAxis tickFormat={y => `$${Math.round(y / 1000)}k`} />
        <VictoryBar
          data={data} x="catFinancialView" y="value"
          style={{ data: { fill: "#4bc0c0" } }}
        />
      </VictoryChart>
    );
  } else if (keys.includes('period')) {
    return (
      <VictoryChart theme={VictoryTheme.material} domainPadding={20} height={350}>
        <VictoryAxis tickFormat={x => x} style={{ tickLabels: { fontSize: 10, angle: -45 } }} />
        <VictoryAxis dependentAxis tickFormat={y => `$${Math.round(y / 1000)}k`} />
        <VictoryLine
          data={data} x="period" y="value"
          style={{ data: { stroke: "#4bc0c0", strokeWidth: 2 } }}
        />
      </VictoryChart>
    );
  } else {
    // Pie chart for other data
    const labelKey = keys.find(key => key !== 'value') || keys[0];
    return (
      <VictoryPie
        data={data}
        x={labelKey} y="value"
        colorScale={["#4bc0c0", "#ff6384", "#36a2eb", "#ffce56", "#9966ff", "#ff9f40"]}
        style={{ labels: { fontSize: 10, fill: "#333" } }}
        height={350}
      />
    );
  }
};

export default VictoryChartsPage;