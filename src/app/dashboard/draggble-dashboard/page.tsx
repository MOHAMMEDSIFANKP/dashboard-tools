'use client';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Banknote,
  TrendingUp,
  DollarSign,
  Receipt,
  BarChart3,
  Activity,
  Target,
  Grip,
  Plus,
  X,
  Globe,
  Calendar,
  Building,
  Filter,
  Layers,
  Smartphone,
  ChevronUp,
  ChevronDown
} from "lucide-react";

// AG Charts imports
import { AgCharts } from 'ag-charts-react';
import { AgChartOptions } from "ag-charts-community";

// Chart.js imports
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
  ChartOptions as ChartJSOptions,
  ChartData,
} from "chart.js";
import { Line, Bar as ChartJSBar } from "react-chartjs-2";

// Plotly imports
import Plot from 'react-plotly.js';
import dynamic from 'next/dynamic';

// Dynamically import Plotly to avoid SSR issues
const Plotly = dynamic(() => import('react-plotly.js'), { ssr: false });

// Register Chart.js components
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

interface ChartAttribute {
  key: string;
  label: string;
  color: string;
  iconName: string;
  type: 'measure' | 'dimension';
}

interface ChartType {
  key: 'line' | 'bar';
  label: string;
  iconName: string;
}

interface ChartConfig {
  chart: ChartAttribute[];
  filters: ChartAttribute[];
  groupBy?: string;
  filterValues: Record<string, string[]>;
}

interface ChartConfigurations {
  line: ChartConfig;
  bar: ChartConfig;
}

interface DraggableAttributeProps {
  attribute: ChartAttribute;
  isUsed: boolean;
}

// Chart Library types
type ChartLibrary = 'ag-charts' | 'chart-js' | 'plotly' | 'nivo' | 'victory' | 'echarts';

interface ChartLibraryOption {
  key: ChartLibrary;
  label: string;
  icon: string;
  color: string;
  implemented: boolean;
}

// Chart library options
const chartLibraryOptions: ChartLibraryOption[] = [
  { key: 'ag-charts', label: 'AG Charts', icon: 'BarChart3', color: '#3B82F6', implemented: true },
  { key: 'chart-js', label: 'Chart.js', icon: 'Activity', color: '#10B981', implemented: true },
  { key: 'plotly', label: 'Plotly', icon: 'TrendingUp', color: '#8B5CF6', implemented: true },
  { key: 'nivo', label: 'Nivo Charts', icon: 'BarChart3', color: '#F59E0B', implemented: false },
  { key: 'victory', label: 'Victory Charts', icon: 'Target', color: '#EF4444', implemented: false },
  { key: 'echarts', label: 'ECharts', icon: 'Activity', color: '#06B6D4', implemented: false }
];

// Mock data for demonstration
const mockFinancialData: FinancialData[] = [
  {
    fiscalyear: 2017,
    period: "201710",
    cataccountingview: "Charges",
    catfinancialview: "Financier",
    revenue: 811581.46,
    otherincome: 6680.1,
    grossmargin: 397398.95,
    operatingexpenses: 181977.82,
    operatingprofit: 327840.45,
    financialresult: -849.67,
    earningsbeforetax: 13390.61,
    nonrecurringresult: 11211.21,
    netprofit: 77046.86,
    country: "India",
    continent: "Asia"
  },
  {
    fiscalyear: 2017,
    period: "201711",
    cataccountingview: "Operations",
    catfinancialview: "Revenue",
    revenue: 750000,
    otherincome: 5000,
    grossmargin: 350000,
    operatingexpenses: 170000,
    operatingprofit: 180000,
    financialresult: 1000,
    earningsbeforetax: 181000,
    nonrecurringresult: 0,
    netprofit: 140000,
    country: "USA",
    continent: "North America"
  },
  {
    fiscalyear: 2017,
    period: "201712",
    cataccountingview: "Charges",
    catfinancialview: "Financier",
    revenue: 890000,
    otherincome: 8000,
    grossmargin: 420000,
    operatingexpenses: 195000,
    operatingprofit: 225000,
    financialresult: 2000,
    earningsbeforetax: 227000,
    nonrecurringresult: 5000,
    netprofit: 180000,
    country: "Germany",
    continent: "Europe"
  },
  {
    fiscalyear: 2018,
    period: "201801",
    cataccountingview: "Operations",
    catfinancialview: "Revenue",
    revenue: 920000,
    otherincome: 12000,
    grossmargin: 450000,
    operatingexpenses: 200000,
    operatingprofit: 250000,
    financialresult: 3000,
    earningsbeforetax: 253000,
    nonrecurringresult: 0,
    netprofit: 200000,
    country: "India",
    continent: "Asia"
  },
  {
    fiscalyear: 2018,
    period: "201802",
    cataccountingview: "Charges",
    catfinancialview: "Financier",
    revenue: 680000,
    otherincome: 4000,
    grossmargin: 320000,
    operatingexpenses: 160000,
    operatingprofit: 160000,
    financialresult: -500,
    earningsbeforetax: 159500,
    nonrecurringresult: 8000,
    netprofit: 120000,
    country: "USA",
    continent: "North America"
  }
];

// Available measures
const availableMeasures: ChartAttribute[] = [
  { key: 'revenue', label: 'Revenue', color: '#3B82F6', iconName: 'DollarSign', type: 'measure' },
  { key: 'grossmargin', label: 'Gross Margin', color: '#10B981', iconName: 'TrendingUp', type: 'measure' },
  { key: 'operatingprofit', label: 'Operating Profit', color: '#8B5CF6', iconName: 'Banknote', type: 'measure' },
  { key: 'netprofit', label: 'Net Profit', color: '#F59E0B', iconName: 'Target', type: 'measure' },
  { key: 'operatingexpenses', label: 'Operating Expenses', color: '#EF4444', iconName: 'Receipt', type: 'measure' },
  { key: 'otherincome', label: 'Other Income', color: '#06B6D4', iconName: 'Plus', type: 'measure' },
];

// Available dimensions
const availableDimensions: ChartAttribute[] = [
  { key: 'country', label: 'Country', color: '#EC4899', iconName: 'Globe', type: 'dimension' },
  { key: 'continent', label: 'Continent', color: '#8B5CF6', iconName: 'Globe', type: 'dimension' },
  { key: 'fiscalyear', label: 'Fiscal Year', color: '#10B981', iconName: 'Calendar', type: 'dimension' },
  { key: 'period', label: 'Period', color: '#F59E0B', iconName: 'Calendar', type: 'dimension' },
  { key: 'cataccountingview', label: 'Accounting View', color: '#EF4444', iconName: 'Building', type: 'dimension' },
  { key: 'catfinancialview', label: 'Financial View', color: '#06B6D4', iconName: 'Layers', type: 'dimension' },
];

// Chart types
const chartTypes: ChartType[] = [
  { key: 'line', label: 'Line Chart', iconName: 'Activity' },
//   { key: 'bar', label: 'Bar Chart', iconName: 'BarChart3' },
];

// Icon mapper function
const getIcon = (iconName: string, size: number = 16) => {
  const iconProps = { size };
  switch (iconName) {
    case 'DollarSign': return <DollarSign {...iconProps} />;
    case 'TrendingUp': return <TrendingUp {...iconProps} />;
    case 'Banknote': return <Banknote {...iconProps} />;
    case 'Target': return <Target {...iconProps} />;
    case 'Receipt': return <Receipt {...iconProps} />;
    case 'Plus': return <Plus {...iconProps} />;
    case 'Activity': return <Activity {...iconProps} />;
    case 'BarChart3': return <BarChart3 {...iconProps} />;
    case 'Globe': return <Globe {...iconProps} />;
    case 'Calendar': return <Calendar {...iconProps} />;
    case 'Building': return <Building {...iconProps} />;
    case 'Layers': return <Layers {...iconProps} />;
    case 'Filter': return <Filter {...iconProps} />;
    default: return <BarChart3 {...iconProps} />;
  }
};

const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(2)}`;
};

// Chart Library Tabs Component
const ChartLibraryTabs: React.FC<{
  selectedLibrary: ChartLibrary;
  onLibraryChange: (library: ChartLibrary) => void;
}> = ({ selectedLibrary, onLibraryChange }) => {
  return (
    <div className="mb-6 bg-white rounded-xl shadow-lg p-4">
      <h3 className="font-semibold text-gray-800 mb-4">Chart Library</h3>
      <div className="flex flex-wrap gap-2">
        {chartLibraryOptions.map((library) => (
          <button
            key={library.key}
            onClick={() => library.implemented && onLibraryChange(library.key)}
            disabled={!library.implemented}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedLibrary === library.key
                ? 'bg-blue-600 text-white shadow-md'
                : library.implemented
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-gray-50 text-gray-400 cursor-not-allowed'
            }`}
          >
            {getIcon(library.icon, 16)}
            <span>{library.label}</span>
            {!library.implemented && (
              <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">
                Coming Soon
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

// Chart Renderer Component
const ChartRenderer: React.FC<{
  library: ChartLibrary;
  chartType: ChartType;
  config: ChartConfig;
  data: FinancialData[];
}> = ({ library, chartType, config, data }) => {
  const chartMeasures = config.chart.filter(attr => attr.type === 'measure');
  const chartDimensions = config.chart.filter(attr => attr.type === 'dimension');

  // Process data based on filters
  const processedData = useMemo(() => {
    let filteredData = data;

    Object.entries(config.filterValues).forEach(([dimension, values]) => {
      if (values.length > 0) {
        filteredData = filteredData.filter(item =>
          values.includes((item as any)[dimension]?.toString())
        );
      }
    });

    return filteredData;
  }, [data, config.filterValues]);

  if (chartMeasures.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <BarChart3 size={48} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">Add measures to chart area to create visualization</p>
        </div>
      </div>
    );
  }

  const xKey = config.groupBy || (chartDimensions[0]?.key || 'period');

  switch (library) {
    case 'ag-charts':
      return <AGChartsRenderer 
        chartType={chartType} 
        measures={chartMeasures} 
        xKey={xKey} 
        data={processedData} 
      />;
    case 'chart-js':
      return <ChartJSRenderer 
        chartType={chartType} 
        measures={chartMeasures} 
        xKey={xKey} 
        data={processedData} 
      />;
    case 'plotly':
      return <PlotlyRenderer 
        chartType={chartType} 
        measures={chartMeasures} 
        xKey={xKey} 
        data={processedData} 
      />;
    default:
      return <div className="text-center text-gray-500">Chart library not implemented yet</div>;
  }
};

// AG Charts Renderer
const AGChartsRenderer: React.FC<{
  chartType: ChartType;
  measures: ChartAttribute[];
  xKey: string;
  data: FinancialData[];
}> = ({ chartType, measures, xKey, data }) => {
  const chartOptions: AgChartOptions = useMemo(() => {
    const series = measures.map(measure => ({
      type: chartType.key,
      xKey: xKey,
      yKey: measure.key,
      yName: measure.label,
      stroke: measure.color,
      fill: measure.color,
      tooltip: { 
        renderer: (params: any) => {
          return `<div class="p-2 bg-white border border-gray-200 rounded shadow">
            <div class="font-semibold">${params.xValue}</div>
            <div>${params.yName}: ${formatCurrency(params.yValue)}</div>
          </div>`;
        }
      },
    }));

    return {
      title: { text: `${chartType.label} - Financial Analysis (AG Charts)` },
      data: data,
      series: series,
      axes: [
        {
          type: 'category',
          position: 'bottom',
          title: { text: xKey },
          label: { rotation: -45 }
        },
        {
          type: 'number',
          position: 'left',
          title: { text: 'Amount ($)' },
          label: {
            formatter: (params: any) => formatCurrency(params.value)
          }
        },
      ],
      legend: { 
        enabled: true, 
        position: 'bottom',
        item: {
          marker: {
            strokeWidth: 2,
            size: 15,
            padding: 8,
          },
        },
      },
    };
  }, [chartType, measures, xKey, data]);

  return (
    <AgCharts
      className="w-full h-full"
      options={chartOptions}
    />
  );
};

// Chart.js Renderer
const ChartJSRenderer: React.FC<{
  chartType: ChartType;
  measures: ChartAttribute[];
  xKey: string;
  data: FinancialData[];
}> = ({ chartType, measures, xKey, data }) => {
  const chartData: ChartData<'line' | 'bar'> = useMemo(() => {
    const labels = [...new Set(data.map(item => (item as any)[xKey]?.toString()))].sort();
    
    const datasets = measures.map(measure => ({
      label: measure.label,
      data: labels.map(label => {
        const item = data.find(d => (d as any)[xKey]?.toString() === label);
        return item ? (item as any)[measure.key] : 0;
      }),
      backgroundColor: measure.color + '80',
      borderColor: measure.color,
      borderWidth: 2,
      tension: 0.1,
    }));

    return {
      labels,
      datasets,
    };
  }, [measures, xKey, data]);

  const options: ChartJSOptions<'line' | 'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: `${chartType.label} - Financial Analysis (Chart.js)`,
        font: {
          size: 16
        }
      },
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
          },
        },
        displayColors: true,
        usePointStyle: true,
        padding: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1F2937',
        bodyColor: '#1F2937',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        cornerRadius: 8
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => formatCurrency(Number(value)),
        },
        grid: {
            //@ts-ignore
          drawBorder: false,
          color: '#E5E7EB'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
  };

  const ChartComponent = chartType.key === 'line' ? Line : ChartJSBar;

  return (
    <div className="w-full h-full p-4">
      <ChartComponent
      //@ts-ignore
        data={chartData}
        options={options}
      />
    </div>
  );
};

// Plotly Renderer
const PlotlyRenderer: React.FC<{
  chartType: ChartType;
  measures: ChartAttribute[];
  xKey: string;
  data: FinancialData[];
}> = ({ chartType, measures, xKey, data }) => {
  const plotlyRef = useRef<HTMLDivElement>(null);

  const chartData = useMemo(() => {
    const labels = [...new Set(data.map(item => (item as any)[xKey]?.toString()))].sort();
    
    return measures.map(measure => ({
      x: labels,
      y: labels.map(label => {
        const item = data.find(d => (d as any)[xKey]?.toString() === label);
        return item ? (item as any)[measure.key] : 0;
      }),
      type: chartType.key === 'line' ? 'scatter' : 'bar',
      mode: chartType.key === 'line' ? 'lines+markers' : undefined,
      name: measure.label,
      line: { color: measure.color, width: 2 },
      marker: { color: measure.color, size: 8 },
      hovertemplate: `%{x}<br>${measure.label}: %{y:$,.2f}<extra></extra>`
    }));
  }, [measures, xKey, data, chartType]);

  const layout = useMemo(() => ({
    title: `${chartType.label} - Financial Analysis (Plotly)`,
    xaxis: { 
      title: xKey,
      tickangle: -45,
      automargin: true
    },
    yaxis: { 
      title: 'Amount ($)',
      tickprefix: '$',
      tickformat: ',.2f',
      hoverformat: '$,.2f'
    },
    legend: { 
      orientation: 'h',
      y: -0.3,
      x: 0.5,
      xanchor: 'center'
    },
    margin: { 
      t: 50,
      b: 100,
      l: 60,
      r: 40,
      pad: 10
    },
    hovermode: 'closest',
    plot_bgcolor: 'rgba(0,0,0,0)',
    paper_bgcolor: 'rgba(0,0,0,0)',
    font: {
      family: 'Inter, sans-serif',
      size: 12,
      color: '#374151'
    }
  }), [chartType, xKey]);

  const config = {
    responsive: true,
    displayModeBar: false,
    staticPlot: false
  };

  return (
    <div className="w-full h-full p-4">
      {typeof window !== 'undefined' && (
        <Plot
          divId="plotly-chart"
          data={chartData}
          layout={layout}
          config={config}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler={true}
        />
      )}
    </div>
  );
};

// Draggable Attribute Component
const DraggableAttribute: React.FC<DraggableAttributeProps> = ({ attribute, isUsed }) => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>): void => {
    e.dataTransfer.setData('text/plain', JSON.stringify(attribute));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const bgColor = attribute.type === 'measure' ? 'bg-blue-50 border-blue-200' : 'bg-purple-50 border-purple-200';
  const hoverColor = attribute.type === 'measure' ? 'hover:bg-blue-100' : 'hover:bg-purple-100';

  return (
    <div
      draggable={!isUsed}
      onDragStart={handleDragStart}
      className={`flex items-center gap-2 p-3 rounded-lg border-2 border-dashed transition-all duration-200 cursor-move ${
        isUsed
          ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
          : `${bgColor} ${hoverColor}`
      }`}
    >
      <Grip size={16} className="text-gray-400" />
      <div style={{ color: attribute.color }}>
        {getIcon(attribute.iconName, 16)}
      </div>
      <span className={`text-sm font-medium ${isUsed ? 'text-gray-400' : 'text-gray-700'}`}>
        {attribute.label}
      </span>
      <span className={`text-xs px-2 py-1 rounded-full ${
        attribute.type === 'measure' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
      }`}>
        {attribute.type}
      </span>
    </div>
  );
};

// Chart Drop Zone Component
const ChartDropZone: React.FC<{
  chartType: ChartType;
  config: ChartConfig;
  onAttributeDrop: (chartType: 'line' | 'bar', attribute: ChartAttribute, dropZone: 'chart' | 'filters') => void;
  onAttributeRemove: (chartType: 'line' | 'bar', attributeKey: string, attributeType: 'chart' | 'filters') => void;
  onGroupByChange: (chartType: 'line' | 'bar', dimensionKey: string | undefined) => void;
  onFilterChange: (chartType: 'line' | 'bar', dimension: string, values: string[]) => void;
  data: FinancialData[];
  selectedLibrary: ChartLibrary;
}> = ({
  chartType,
  config,
  onAttributeDrop,
  onAttributeRemove,
  onGroupByChange,
  onFilterChange,
  data,
  selectedLibrary
}) => {
  const [isDragOverChart, setIsDragOverChart] = useState<boolean>(false);
  const [isDragOverFilters, setIsDragOverFilters] = useState<boolean>(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, zone: 'chart' | 'filters'): void => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (zone === 'chart') {
      setIsDragOverChart(true);
    } else {
      setIsDragOverFilters(true);
    }
  };

  const handleDragLeave = (zone: 'chart' | 'filters'): void => {
    if (zone === 'chart') {
      setIsDragOverChart(false);
    } else {
      setIsDragOverFilters(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, zone: 'chart' | 'filters'): void => {
    e.preventDefault();
    setIsDragOverChart(false);
    setIsDragOverFilters(false);

    try {
      const attributeData: ChartAttribute = JSON.parse(e.dataTransfer.getData('text/plain'));
      onAttributeDrop(chartType.key, attributeData, zone);
    } catch (error) {
      console.error('Error parsing dropped data:', error);
    }
  };

  // Get unique values for dimension filters
  const getDimensionValues = (dimensionKey: string) => {
    return [...new Set(data.map(item => (item as any)[dimensionKey]?.toString()))].filter(Boolean);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden">
      {/* Chart Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          {getIcon(chartType.iconName, 16)}
          <h3 className="font-semibold text-gray-800">{chartType.label}</h3>
          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
            {chartLibraryOptions.find(lib => lib.key === selectedLibrary)?.label}
          </span>
        </div>
      </div>

      {/* Configuration Area */}
      <div className="p-4 bg-gray-50 border-b">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Chart Configuration Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-3 transition-all duration-200 ${
              isDragOverChart ? 'border-blue-400 bg-blue-50' : 'border-blue-200 bg-blue-25'
            }`}
            onDragOver={(e) => handleDragOver(e, 'chart')}
            onDragLeave={() => handleDragLeave('chart')}
            onDrop={(e) => handleDrop(e, 'chart')}
          >
            <div className="flex items-center gap-2 mb-2">
              {getIcon('BarChart3', 16)}
              <span className="font-medium text-blue-800">Chart Configuration</span>
            </div>
            <p className="text-xs text-gray-600 mb-2">
              X-Axis (Categories) and Y-Axis (Values)
            </p>
            <div className="flex flex-wrap gap-2">
              {config.chart.length === 0 ? (
                <span className="text-sm text-gray-500">Drag fields here for visualization</span>
              ) : (
                config.chart.map((attribute) => (
                  <div
                    key={attribute.key}
                    className="flex items-center gap-1 px-2 py-1 bg-white rounded-md border text-xs"
                  >
                    <div style={{ color: attribute.color }}>
                      {getIcon(attribute.iconName, 12)}
                    </div>
                    <span>{attribute.label}</span>
                    <span className={`text-xs px-1 py-0.5 rounded-full ${
                      attribute.type === 'measure' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                    }`}>
                      {attribute.type === 'measure' ? 'M' : 'D'}
                    </span>
                    <button
                      onClick={() => onAttributeRemove(chartType.key, attribute.key, 'chart')}
                      className="ml-1 text-gray-400 hover:text-red-500"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Filter Configuration Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-3 transition-all duration-200 ${
              isDragOverFilters ? 'border-purple-400 bg-purple-50' : 'border-purple-200 bg-purple-25'
            }`}
            onDragOver={(e) => handleDragOver(e, 'filters')}
            onDragLeave={() => handleDragLeave('filters')}
            onDrop={(e) => handleDrop(e, 'filters')}
          >
            <div className="flex items-center gap-2 mb-2">
              <Filter size={16} className="text-purple-600" />
              <span className="font-medium text-purple-800">Filters</span>
            </div>
            <p className="text-xs text-gray-600 mb-2">
              Fields for filtering data
            </p>
            <div className="flex flex-wrap gap-2">
              {config.filters.length === 0 ? (
                <span className="text-sm text-gray-500">Drag fields here for filtering</span>
              ) : (
                config.filters.map((attribute) => (
                  <div
                    key={attribute.key}
                    className="flex items-center gap-1 px-2 py-1 bg-white rounded-md border text-xs"
                  >
                    <div style={{ color: attribute.color }}>
                      {getIcon(attribute.iconName, 12)}
                    </div>
                    <span>{attribute.label}</span>
                    <span className={`text-xs px-1 py-0.5 rounded-full ${
                      attribute.type === 'measure' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                    }`}>
                      {attribute.type === 'measure' ? 'M' : 'D'}
                    </span>
                    <button
                      onClick={() => onAttributeRemove(chartType.key, attribute.key, 'filters')}
                      className="ml-1 text-gray-400 hover:text-red-500"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Group By and Filter Values */}
        {(config.filters.length > 0 || config.chart.some(attr => attr.type === 'dimension')) && (
          <div className="mt-4 space-y-3">
            {/* Group By Selection */}
            {config.chart.filter(attr => attr.type === 'dimension').length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Group By:</label>
                <select
                  value={config.groupBy || ''}
                  onChange={(e) => onGroupByChange(chartType.key, e.target.value || undefined)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm w-full"
                >
                  <option value="">Select dimension...</option>
                  {config.chart.filter(attr => attr.type === 'dimension').map((dim) => (
                    <option key={dim.key} value={dim.key}>{dim.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Filter Values */}
            {config.filters.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {config.filters.map((attribute) => (
                  <div key={attribute.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Filter by {attribute.label}:
                    </label>
                    <select
                      multiple
                      value={config.filterValues[attribute.key] || []}
                      onChange={(e) => {
                        const selectedValues = Array.from(e.target.selectedOptions, option => option.value);
                        onFilterChange(chartType.key, attribute.key, selectedValues);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm h-20"
                    >
                      {getDimensionValues(attribute.key).map((value) => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chart Area */}
      <div className="h-96">
        <ChartRenderer
          library={selectedLibrary}
          chartType={chartType}
          config={config}
          data={data}
        />
      </div>
    </div>
  );
};

// Main Dashboard Component
const EnhancedDashboard: React.FC = () => {
  const [chartConfigurations, setChartConfigurations] = useState<ChartConfigurations>({
    line: {
      chart: [],
      filters: [],
      filterValues: {}
    },
    bar: {
      chart: [],
      filters: [],
      filterValues: {}
    }
  });

  const [selectedLibrary, setSelectedLibrary] = useState<ChartLibrary>('ag-charts');
  const [mobileConfig, setMobileConfig] = useState<{
    selectedMeasures: Set<string>;
    selectedDimensions: Set<string>;
    groupBy?: string;
    filters: Record<string, string[]>;
  }>({
    selectedMeasures: new Set(),
    selectedDimensions: new Set(),
    filters: {}
  });

  const handleAttributeDrop = (chartType: 'line' | 'bar', attribute: ChartAttribute, dropZone: 'chart' | 'filters'): void => {
    setChartConfigurations(prev => ({
      ...prev,
      [chartType]: {
        ...prev[chartType],
        [dropZone]: [
          ...prev[chartType][dropZone].filter(attr => attr.key !== attribute.key),
          attribute
        ]
      }
    }));
  };

  const handleAttributeRemove = (chartType: 'line' | 'bar', attributeKey: string, attributeType: 'chart' | 'filters'): void => {
    setChartConfigurations(prev => ({
      ...prev,
      [chartType]: {
        ...prev[chartType],
        [attributeType]: prev[chartType][attributeType].filter(attr => attr.key !== attributeKey)
      }
    }));
  };

  const handleGroupByChange = (chartType: 'line' | 'bar', dimensionKey: string | undefined): void => {
    setChartConfigurations(prev => ({
      ...prev,
      [chartType]: {
        ...prev[chartType],
        groupBy: dimensionKey
      }
    }));
  };

  const handleFilterChange = (chartType: 'line' | 'bar', dimension: string, values: string[]): void => {
    setChartConfigurations(prev => ({
      ...prev,
      [chartType]: {
        ...prev[chartType],
        filterValues: {
          ...prev[chartType].filterValues,
          [dimension]: values
        }
      }
    }));
  };

  const usedAttributeKeys = useMemo<Set<string>>(() => {
    return new Set([
      ...chartConfigurations.line.chart.map(attr => attr.key),
      ...chartConfigurations.line.filters.map(attr => attr.key),
      ...chartConfigurations.bar.chart.map(attr => attr.key),
      ...chartConfigurations.bar.filters.map(attr => attr.key)
    ]);
  }, [chartConfigurations]);

  // Mobile handlers
  const handleMobileAttributeToggle = (attributeKey: string, type: 'measure' | 'dimension') => {
    setMobileConfig(prev => {
      const key = type === 'measure' ? 'selectedMeasures' : 'selectedDimensions';
      const newSet = new Set(prev[key]);

      if (newSet.has(attributeKey)) {
        newSet.delete(attributeKey);
      } else {
        newSet.add(attributeKey);
      }

      return {
        ...prev,
        [key]: newSet
      };
    });
  };

  const handleMobileGroupByChange = (dimensionKey: string | undefined) => {
    setMobileConfig(prev => ({
      ...prev,
      groupBy: dimensionKey
    }));
  };

  const handleMobileFilterChange = (dimension: string, values: string[]) => {
    setMobileConfig(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [dimension]: values
      }
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6">
      <div className="max-w-7xl mx-auto hidden lg:block">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Advanced Financial Analytics Dashboard
          </h1>
          <p className="text-gray-600">
            Create interactive charts with measures and dimensions
          </p>
        </div>

        {/* Chart Library Selection */}
        <ChartLibraryTabs 
          selectedLibrary={selectedLibrary}
          onLibraryChange={setSelectedLibrary}
        />

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 bg-white rounded-xl shadow-lg p-6 mb-5">
          {/* Measures Section */}
          <div className="mb-6">
            <h3 className="font-semibold text-blue-800 mb-4 flex items-center gap-2">
              <DollarSign size={16} />
              Available Fields
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...availableMeasures, ...availableDimensions].map((attribute) => (
                <DraggableAttribute
                  key={attribute.key}
                  attribute={attribute}
                  isUsed={usedAttributeKeys.has(attribute.key)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Available Attributes */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">How to use:</h4>
                <ol className="text-sm text-gray-700 space-y-1">
                  <li>1. Drag measures to quantify data</li>
                  <li>2. Add dimensions for grouping</li>
                  <li>3. Set group-by and filters</li>
                  <li>4. Analyze your insights!</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Main Chart Area */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {chartTypes.map((chartType) => (
                <ChartDropZone
                  key={chartType.key}
                  chartType={chartType}
                  config={chartConfigurations[chartType.key]}
                  onAttributeDrop={handleAttributeDrop}
                  onAttributeRemove={handleAttributeRemove}
                  onGroupByChange={handleGroupByChange}
                  onFilterChange={handleFilterChange}
                  data={mockFinancialData}
                  selectedLibrary={selectedLibrary}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Dashboard */}
      <MobileDashboard
        availableMeasures={availableMeasures}
        availableDimensions={availableDimensions}
        mobileConfig={mobileConfig}
        onAttributeToggle={handleMobileAttributeToggle}
        onGroupByChange={handleMobileGroupByChange}
        onFilterChange={handleMobileFilterChange}
        data={mockFinancialData}
      />
    </div>
  );
};

// Mobile Dashboard Component (existing implementation remains the same)
interface MobileDashboardProps {
  availableMeasures: ChartAttribute[];
  availableDimensions: ChartAttribute[];
  mobileConfig: {
    selectedMeasures: Set<string>;
    selectedDimensions: Set<string>;
    groupBy?: string;
    filters: Record<string, string[]>;
  };
  onAttributeToggle: (attributeKey: string, type: 'measure' | 'dimension') => void;
  onGroupByChange: (dimensionKey: string | undefined) => void;
  onFilterChange: (dimension: string, values: string[]) => void;
  data: FinancialData[];
}

const MobileDashboard: React.FC<MobileDashboardProps> = ({
  availableMeasures,
  availableDimensions,
  mobileConfig,
  onAttributeToggle,
  onGroupByChange,
  onFilterChange,
  data
}) => {
  const [isExpanded, setIsExpanded] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Get selected attributes for chart
  const selectedMeasureObjects = availableMeasures.filter(m => mobileConfig.selectedMeasures.has(m.key));
  const selectedDimensionObjects = availableDimensions.filter(d => mobileConfig.selectedDimensions.has(d.key));

  // Auto-show chart when measures are selected
  const showChart = selectedMeasureObjects.length > 0;

  // Process data for mobile chart
  const processedData = useMemo(() => {
    let filteredData = data;

    Object.entries(mobileConfig.filters).forEach(([dimension, values]) => {
      if (values.length > 0) {
        filteredData = filteredData.filter(item =>
          values.includes((item as any)[dimension]?.toString())
        );
      }
    });

    return filteredData;
  }, [data, mobileConfig.filters]);

  // Chart options for mobile
  const mobileChartOptions: AgChartOptions = useMemo(() => {
    if (selectedMeasureObjects.length === 0) return {};

    const series = selectedMeasureObjects.map(measure => ({
      type: 'line' as const,
      xKey: mobileConfig.groupBy || 'period',
      yKey: measure.key,
      yName: measure.label,
      stroke: measure.color,
      fill: measure.color,
      tooltip: { 
        renderer: (params: any) => {
          return `<div class="p-2 bg-white border border-gray-200 rounded shadow">
            <div class="font-semibold">${params.xValue}</div>
            <div>${params.yName}: ${formatCurrency(params.yValue)}</div>
          </div>`;
        }
      },
    }));

    return {
      title: { text: 'Financial Analysis', fontSize: 14 },
      data: processedData,
      series: series,
      axes: [
        {
          type: 'category',
          position: 'bottom',
          title: {
            text: mobileConfig.groupBy ?
              availableDimensions.find(d => d.key === mobileConfig.groupBy)?.label || 'Group' :
              'Period',
            fontSize: 10
          },
          label: { rotation: -45, fontSize: 10 }
        },
        {
          type: 'number',
          position: 'left',
          title: { text: 'Amount ($)', fontSize: 10 },
          label: {
            formatter: (params: any) => formatCurrency(params.value),
            fontSize: 10
          }
        },
      ],
      legend: { 
        enabled: true, 
        position: 'bottom',
        item: {
          marker: {
            strokeWidth: 2,
            size: 12,
            padding: 6,
          },
        },
      },
    };
  }, [selectedMeasureObjects, mobileConfig, processedData, availableDimensions]);

  // Get unique values for filters
  const getDimensionValues = (dimensionKey: string) => {
    return [...new Set(data.map(item => (item as any)[dimensionKey]?.toString()))].filter(Boolean);
  };

  const ListingValues = [
    {
      title: 'Measures',
      iconName: "DollarSign",
      color: '#3B82F6',
      attributes: availableMeasures,
      type: 'measures' as const,
      selectedCount: mobileConfig.selectedMeasures.size
    },
    {
      title: 'Dimensions',
      iconName: "Filter",
      color: '#805ad5',
      attributes: availableDimensions,
      type: 'dimensions' as const,
      selectedCount: mobileConfig.selectedDimensions.size
    }
  ];

  return (
    <div className='lg:hidden pt-16'>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Smartphone size={20} className="text-blue-600" />
          <h1 className="text-lg font-bold text-gray-900">Financial Analytics</h1>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {selectedDimensionObjects.length > 0 && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-medium flex items-center gap-1"
            >
              <Filter size={14} />
              Filters
            </button>
          )}
        </div>
      </div>

      {/* Chart Section - Auto-shows when measures selected */}
      {showChart && (
        <div className="mb-4 bg-white rounded-lg border shadow-sm">
          <div className="p-3 border-b bg-gray-50">
            <h3 className="font-medium text-gray-900">Chart View</h3>
          </div>
          <div className="h-64 p-2">
            <AgChartsReact
              className="w-full h-full"
              options={mobileChartOptions}
            />
          </div>
        </div>
      )}

      {/* Filters Section */}
      {showFilters && selectedDimensionObjects.length > 0 && (
        <div className="mb-4 bg-white rounded-lg border shadow-sm">
          <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
            <h3 className="font-medium text-gray-900">Filters & Grouping</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          </div>
          <div className="p-3 space-y-3">
            {/* Group By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Group By:</label>
              <select
                value={mobileConfig.groupBy || ''}
                onChange={(e) => onGroupByChange(e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Select dimension...</option>
                {selectedDimensionObjects.map((dim) => (
                  <option key={dim.key} value={dim.key}>{dim.label}</option>
                ))}
              </select>
            </div>

            {/* Dimension Filters */}
            {selectedDimensionObjects.map((dimension) => (
              <div key={dimension.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by {dimension.label}:
                </label>
                <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md">
                  {getDimensionValues(dimension.key).map((value) => (
                    <label key={value} className="flex items-center p-2 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={(mobileConfig.filters[dimension.key] || []).includes(value)}
                        onChange={(e) => {
                          const currentValues = mobileConfig.filters[dimension.key] || [];
                          const newValues = e.target.checked
                            ? [...currentValues, value]
                            : currentValues.filter(v => v !== value);
                          onFilterChange(dimension.key, newValues);
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{value}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <button
              onClick={() => {
                selectedDimensionObjects.forEach(dim => {
                  onFilterChange(dim.key, []);
                });
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      )}

      {/* Attributes Selection */}
      <div className="flex flex-col gap-2">
        {ListingValues.map(({ title, iconName, color, attributes, type, selectedCount }) => (
          <div
            key={title}
            className='rounded-lg border shadow-sm overflow-hidden bg-white'>
            <button
              onClick={() => setIsExpanded(isExpanded === type ? null : type)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-2">
                {type === 'measures' ?
                  <DollarSign size={16} className="text-blue-600" /> :
                  <Filter size={16} className="text-purple-600" />
                }
                <span className="font-medium text-gray-900">{title}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  selectedCount > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {selectedCount}
                </span>
              </div>
              {isExpanded === type ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {isExpanded === type && (
              <div className="border-t bg-gray-50">
                <div className="p-3 space-y-2">
                  {attributes.map((attribute) => {
                    const isSelected = type === 'measures' ?
                      mobileConfig.selectedMeasures.has(attribute.key) :
                      mobileConfig.selectedDimensions.has(attribute.key);

                    return (
                      <button
                        key={attribute.key}
                        onClick={() => onAttributeToggle(attribute.key, attribute.type)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-blue-300 bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div style={{ color: attribute.color }}>
                          {getIcon(attribute.iconName, 16)}
                        </div>
                        <div className="flex-1 text-left">
                          <span className="text-sm font-medium block">
                            {attribute.label}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            attribute.type === 'measure' ?
                              'bg-blue-100 text-blue-700' :
                              'bg-purple-100 text-purple-700'
                          }`}>
                            {attribute.type}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <X size={12} className="text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary Card */}
      {(selectedMeasureObjects.length > 0 || selectedDimensionObjects.length > 0) && (
        <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
          <h4 className="font-medium text-gray-900 mb-2 text-sm">Selection Summary</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <div>Measures: {selectedMeasureObjects.map(m => m.label).join(', ') || 'None'}</div>
            <div>Dimensions: {selectedDimensionObjects.map(d => d.label).join(', ') || 'None'}</div>
            {mobileConfig.groupBy && (
              <div>Grouped by: {availableDimensions.find(d => d.key === mobileConfig.groupBy)?.label}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedDashboard;