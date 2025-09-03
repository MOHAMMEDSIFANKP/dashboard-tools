'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
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
// AG Chart Enterprice
import { AgCharts as AgChartsEnterprise } from 'ag-charts-enterprise';
import { AgChartOptions as AgChartOptionsEnterprise } from 'ag-charts-enterprise';

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
// Nivo imports
import { ResponsiveBar } from "@nivo/bar";
import { ResponsiveLine } from '@nivo/line';
// Victory imports
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
  VictoryScatter,
  VictoryLabel,
} from "victory";
// ECharts imports
import ReactECharts from "echarts-for-react";

// Hight charts
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
// Syncfusion
import {
  ChartComponent,
  SeriesCollectionDirective,
  SeriesDirective,
  Inject,
  LineSeries,
  ColumnSeries,
  Category,
  Legend as SyncfusionLegend,
  Tooltip as SyncfusionTooltip,
  DataLabel,
  Export,
  ChartTheme,
  Highlight,
  Selection
} from '@syncfusion/ej2-react-charts';
import { registerLicense, enableRipple } from '@syncfusion/ej2-base';

import { ChartAttribute, ChartType, ChartConfig, ChartConfigurations, DraggableAttributeProps, ChartLibrary } from '@/types/Schemas';
// Redux imports
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { setSelectedLibrary, updateChartConfig } from '@/store/slices/dashboardSlice';
import { formatCurrency } from '@/utils/utils';
import { CustomSelect } from '@/components/ui/inputs';

// Dynamically import Plotly to avoid SSR issues
const Plotly = dynamic(() => import('react-plotly.js'), { ssr: false });

// @ts-ignore
registerLicense(process.env.NEXT_PUBLIC_SYNCFUSION_LICENSE_KEY);

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
  { key: 'nivo', label: 'Nivo Charts', icon: 'BarChart3', color: '#F59E0B', implemented: true },
  { key: 'victory', label: 'Victory Charts', icon: 'Target', color: '#EF4444', implemented: true },
  { key: 'echarts', label: 'ECharts', icon: 'Activity', color: '#06B6D4', implemented: true },
  { key: 'highcharts', label: 'Highcharts', icon: 'TrendingUp', color: '#FF6B35', implemented: true },
  { key: 'syncfusion', label: 'Syncfusion Charts', icon: 'BarChart3', color: '#7C3AED', implemented: true }, // Add this line
  { key: 'ag-charts-enterprise', label: 'AG Charts Enterprise Charts', icon: 'Activity', color: '#7C3AED', implemented: true }, // Add this line
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
  // { key: 'bar', label: 'Bar Chart', iconName: 'BarChart3' },
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
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedLibrary === library.key
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
    case 'nivo':
      return <NivoRenderer
        chartType={chartType}
        measures={chartMeasures}
        xKey={xKey}
        data={processedData}
      />;
    case 'victory':
      return <VictoryRenderer
        chartType={chartType}
        measures={chartMeasures}
        xKey={xKey}
        data={processedData}
      />;
    case 'echarts':
      return <EChartsRenderer
        chartType={chartType}
        measures={chartMeasures}
        xKey={xKey}
        data={processedData}
      />;
    case 'highcharts':
      return <HighchartsRenderer
        chartType={chartType}
        measures={chartMeasures}
        xKey={xKey}
        data={processedData}
      />;
    case 'syncfusion':
      return <SyncfusionRenderer
        chartType={chartType}
        measures={chartMeasures}
        xKey={xKey}
        data={processedData}
      />;
    case 'ag-charts-enterprise':
      return <AGChartsEnterpriseRenderer
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
      // tooltip: {
      //   renderer: (params: any) => {
      //     return `<div class="p-2 bg-white border border-gray-200 rounded shadow">
      //       <div class="font-semibold">${params.xValue}</div>
      //       <div>${params.yName}: ${formatCurrency(params.yValue)}</div>
      //     </div>`;
      //   }
      // },
    }));

    return {
      title: { text: `${chartType.label} - Financial Analysis (AG Charts)` },
      data: data,
      series: series,
      axes: [
        {
          type: 'category',
          position: 'bottom',
          title: { text: availableDimensions.find(d => d.key === xKey)?.label },
          label: { rotation: -45 }
        },
        {
          type: 'number',
          position: 'left',
          title: { text: 'Amount ($)' },
          label: {
            formatter: (params: any) => formatCurrency(params.value)
          },
          line: { stroke: '#e0e0e0', width: 2 }
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
        },
        title: {
          display: true,
          text: 'Amount (USD)',
        },
      },
      x: {
        grid: {
          display: false
        },
        title: {
          display: true,
          text: availableDimensions.find(d => d.key === xKey)?.label || xKey,
        },
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

  const chartData = useMemo(() => {
    // Extract and sort labels, ensuring they're treated as strings
    const labels = [...new Set(data.map(item => {
      const value = (item as any)[xKey];
      return value?.toString() || '';
    }))].filter(Boolean).sort((a, b) => {
      // Custom sort for period-like strings (YYYYMM format)
      if (/^\d{6}$/.test(a) && /^\d{6}$/.test(b)) {
        return a.localeCompare(b);
      }
      // For other formats, use natural sort
      return a.localeCompare(b, undefined, { numeric: true });
    });

    return measures.map((measure, index) => ({
      x: labels,
      y: labels.map(label => {
        const item = data.find(d => (d as any)[xKey]?.toString() === label);
        return item ? (item as any)[measure.key] || 0 : 0;
      }),
      type: chartType.key === 'line' ? 'scatter' : 'bar',
      // text: labels.map(label => {
      //   const item = data.find(d => (d as any)[xKey]?.toString() === label);
      //   const value = item ? (item as any)[measure.key] || 0 : 0;
      //   return formatCurrency(Number(value));
      // }),
      mode: chartType.key === 'line' ? 'lines+markers' : undefined,
      name: measure.label,
      line: chartType.key === 'line' ? {
        color: measure.color,
        width: 2
      } : undefined,
      marker: {
        color: measure.color,
        size: chartType.key === 'line' ? 8 : undefined,
        line: {
          color: 'white',
          width: 1
        }
      },
      // hovertemplate: `%{text}<br>${measure.label}: %{y:$,.2f}<extra></extra>`
    }));
  }, [measures, xKey, data, chartType]);

  const layout = useMemo(() => ({
    title: `${chartType.label} - Financial Analysis (Plotly)`,
    xaxis: {
      title: { text: availableDimensions.find(d => d.key === xKey)?.label },
      type: 'category', // Force categorical x-axis to prevent interpolation
      tickmode: 'array',
      tickvals: chartData[0]?.x || [], // Explicitly set tick values
      ticktext: chartData[0]?.x || [], // Explicitly set tick text
      tickangle: -45,
      automargin: true,
      categoryorder: 'array', // Use the order from our sorted array
      categoryarray: chartData[0]?.x || [],
      showline: true,
    },
    yaxis: {
      title: { text: 'Amount ($)' },
      tickprefix: '$',
      // tickformat: ',.2f',
      // hoverformat: '$,.2f',
      range: [0, null],
      zeroline: true,
      zerolinewidth: 2,
      zerolinecolor: '#E5E7EB',
      gridcolor: '#E5E7EB',
      showline: true,
    },
    legend: {
      orientation: 'h',
      y: -0.5,
      x: 0.5,
      xanchor: 'center'
    },
    margin: {
      t: 60,
      b: 120, // Increased bottom margin for angled labels
      l: 80,
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
    },
    // Disable zoom and pan to prevent x-axis issues
    dragmode: false
  }), [chartType, xKey, chartData]);

  const config = {
    responsive: true,
    displayModeBar: false,
    staticPlot: false,
    scrollZoom: false,
    doubleClick: false,
    showTips: false
  };

  return (
    <div className="w-full h-full p-4">
      <div className='font-bold text-center'>
        {chartType.label} - Financial Analysis (Plotly)
      </div>
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
// Nivo Renderer
const NivoRenderer: React.FC<{
  chartType: ChartType;
  measures: ChartAttribute[];
  xKey: string;
  data: FinancialData[];
}> = ({ chartType, measures, xKey, data }) => {
  const chartData = useMemo(() => {
    if (chartType.key === 'line') {
      // For line charts, create data in Nivo line format
      return measures.map(measure => ({
        id: measure.label,
        color: measure.color,
        data: data.map(item => ({
          x: (item as any)[xKey]?.toString(),
          y: (item as any)[measure.key] || 0
        }))
      }));
    } else {
      // For bar charts, create data in Nivo bar format
      const groupedData = data.reduce((acc, item) => {
        const key = (item as any)[xKey]?.toString();
        if (!acc[key]) {
          acc[key] = { [xKey]: key };
        }
        measures.forEach(measure => {
          acc[key][measure.key] = (item as any)[measure.key] || 0;
        });
        return acc;
      }, {} as Record<string, any>);

      return Object.values(groupedData);
    }
  }, [chartType, measures, xKey, data]);

  const colors = measures.map(m => m.color);

  if (chartType.key === 'line') {
    return (
      <div className="w-full h-full p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
          Line Chart - Financial Analysis (Nivo)
        </h3>
        <div className="h-80">
          <ResponsiveLine
            data={chartData}
            margin={{ top: 20, right: 110, bottom: 60, left: 80 }}
            xScale={{ type: 'point' }}
            yScale={{
              type: 'linear',
              min: 0,
              max: 'auto',
              stacked: false,
              reverse: false
            }}
            yFormat={(value) => formatCurrency(Number(value))}
            curve="cardinal"
            axisTop={null}
            axisRight={null}
            axisBottom={{
              // orient: 'bottom',
              tickSize: 5,
              tickPadding: 5,
              tickRotation: -45,
              legend: availableDimensions.find(d => d.key === xKey)?.label || xKey,
              legendOffset: 50,
              legendPosition: 'middle'
            }}
            axisLeft={{
              // orient: 'left',
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: 'Amount ($)',
              legendOffset: -60,
              legendPosition: 'middle',
              format: (value) => formatCurrency(Number(value))
            }}
            pointSize={8}
            pointColor={{ theme: 'background' }}
            pointBorderWidth={2}
            pointBorderColor={{ from: 'serieColor' }}
            pointLabelYOffset={-12}
            useMesh={true}
            legends={[
              {
                anchor: 'bottom-right',
                direction: 'column',
                justify: false,
                translateX: 100,
                translateY: 0,
                itemsSpacing: 0,
                itemDirection: 'left-to-right',
                itemWidth: 80,
                itemHeight: 20,
                itemOpacity: 0.75,
                symbolSize: 12,
                symbolShape: 'circle',
                symbolBorderColor: 'rgba(0, 0, 0, .5)',
                effects: [
                  {
                    on: 'hover',
                    style: {
                      itemBackground: 'rgba(0, 0, 0, .03)',
                      itemOpacity: 1
                    }
                  }
                ]
              }
            ]}
            theme={{
              axis: {
                domain: {
                  line: {
                    stroke: "#B8B4B4",
                    strokeWidth: 2,
                  },
                },
              },
            }}
            colors={colors}
            tooltip={({ point }) => (
              <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-md">
                <div className="font-semibold text-gray-800">{point.data.xFormatted}</div>
                <div className="text-sm" style={{ color: point.serieColor }}>
                  {point.serieId}: {formatCurrency(Number(point.data.y))}
                </div>
              </div>
            )}
          />
        </div>
      </div>
    );
  } else {
    return (
      <div className="w-full h-full p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
          Bar Chart - Financial Analysis (Nivo)
        </h3>
        <div className="h-80">
          <ResponsiveBar
            data={chartData}
            keys={measures.map(m => m.key)}
            indexBy={xKey}
            margin={{ top: 20, right: 110, bottom: 60, left: 80 }}
            padding={0.3}
            valueScale={{ type: 'linear' }}
            indexScale={{ type: 'band', round: true }}
            colors={colors}
            defs={[
              {
                id: 'dots',
                type: 'patternDots',
                background: 'inherit',
                color: '#38bcb2',
                size: 4,
                padding: 1,
                stagger: true
              }
            ]}
            borderColor={{
              from: 'color',
              modifiers: [['darker', 1.6]]
            }}
            axisTop={null}
            axisRight={null}
            axisBottom={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: -45,
              legend: availableDimensions.find(d => d.key === xKey)?.label || xKey,
              legendPosition: 'middle',
              legendOffset: 50
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: 'Amount ($)',
              legendPosition: 'middle',
              legendOffset: -60,
              format: (value) => formatCurrency(Number(value))
            }}
            labelSkipWidth={12}
            labelSkipHeight={12}
            labelTextColor={{
              from: 'color',
              modifiers: [['darker', 1.6]]
            }}
            legends={[
              {
                dataFrom: 'keys',
                anchor: 'bottom-right',
                direction: 'column',
                justify: false,
                translateX: 100,
                translateY: 0,
                itemsSpacing: 2,
                itemWidth: 80,
                itemHeight: 20,
                itemDirection: 'left-to-right',
                itemOpacity: 0.85,
                symbolSize: 20,
                effects: [
                  {
                    on: 'hover',
                    style: {
                      itemOpacity: 1
                    }
                  }
                ]
              }
            ]}
            theme={{
              axis: {
                domain: {
                  line: {
                    stroke: "#B8B4B4",
                    strokeWidth: 2,
                  },
                },
              },
            }}
            role="application"
            ariaLabel="Financial data bar chart"
            barAriaLabel={(e) => `${e.id}: ${formatCurrency(Number(e.value))} for ${e.indexValue}`}
            tooltip={({ id, value, indexValue }) => (
              <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-md">
                <div className="font-semibold text-gray-800">{indexValue}</div>
                <div className="text-sm">
                  {measures.find(m => m.key === id)?.label}: {formatCurrency(Number(value))}
                </div>
              </div>
            )}
          />
        </div>
      </div>
    );
  }
};

const VictoryRenderer: React.FC<{
  chartType: ChartType;
  measures: ChartAttribute[];
  xKey: string;
  data: FinancialData[];
}> = ({ chartType, measures, xKey, data }) => {
  const chartData = useMemo(() => {
    if (chartType.key === 'line') {
      return measures.map(measure => ({
        name: measure.label,
        color: measure.color,
        data: data.map(item => ({
          x: (item as any)[xKey]?.toString(),
          y: (item as any)[measure.key] || 0
        }))
      }));
    } else {
      return data.map(item => {
        const result: any = { x: (item as any)[xKey]?.toString() };
        measures.forEach(measure => {
          result[measure.key] = (item as any)[measure.key] || 0;
        });
        return result;
      });
    }
  }, [chartType, measures, xKey, data]);
  const maxY = useMemo(() => {
    let max = 0;
    data.forEach(item => {
      measures.forEach(measure => {
        const value = (item as any)[measure.key] || 0;
        if (value > max) max = value;
      });
    });
    return max;
  }, [data, measures]);
  if (chartType.key === 'line') {
    return (
      <div className="w-full h-full p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
          Line Chart - Financial Analysis (Victory)
        </h3>
        <div className="h-[350px]">
          <VictoryChart
            theme={VictoryTheme.material}
            width={800}
            height={450}
            padding={{ left: 80, top: 20, right: 40, bottom: 130 }}
            domain={{ y: [0, maxY * 1.1] }}
          >
            <VictoryAxis
              label='Amount ($)'
              axisLabelComponent={<VictoryLabel dy={-50} className='capitalize font-bold' />}
              dependentAxis
              tickFormat={(value: number) => formatCurrency(Number(value))}
              style={{
                tickLabels: { fontSize: 12, padding: 5 }
              }}
            />
            <VictoryAxis
              label={availableDimensions.find(d => d.key === xKey)?.label || xKey}
              axisLabelComponent={<VictoryLabel dy={30} className='capitalize font-bold' />}
              style={{
                tickLabels: { fontSize: 12, padding: 5, angle: -0 }
              }}
            />
            <VictoryGroup>
              {chartData.map((series, index) => (
                <VictoryLine
                  key={series.name}
                  data={series.data}
                  style={{
                    data: { stroke: series.color, strokeWidth: 3 }
                  }}
                  animate={{
                    duration: 1000,
                    onLoad: { duration: 500 }
                  }}
                />
              ))}
              {chartData.map((series, index) => (
                <VictoryScatter
                  key={`scatter-${series.name}`}
                  data={series.data}
                  size={4}
                  style={{
                    data: {
                      fill: series.color,
                      stroke: series.color,
                      strokeWidth: 1
                    }
                  }}
                  labels={({ datum }) => `${series.name}: ${formatCurrency(datum.y)}`}
                  labelComponent={
                    <VictoryTooltip
                      cornerRadius={5}
                      style={{ fontSize: 12 }}
                      flyoutStyle={{
                        fill: "rgba(255, 255, 255, 0.95)",
                        stroke: series.color,
                        strokeWidth: 2,
                        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
                      }}
                      pointerLength={8}
                      pointerWidth={12}
                    />
                  }
                />
              ))}
            </VictoryGroup>
            <VictoryLegend
              x={300}
              y={380}
              orientation="horizontal"
              gutter={30}
              itemsPerRow={3}
              style={{
                border: { stroke: "#e0e0e0", strokeWidth: 1, fill: "#f9f9f9" },
                title: { fontSize: 14, fontWeight: "bold" },
                labels: { fontSize: 12, fontWeight: "500" }
              }}
              data={chartData.map(series => ({
                name: series.name,
                symbol: {
                  fill: series.color,
                  type: "circle",
                  size: 6
                }
              }))}
            />
          </VictoryChart>
        </div>
      </div>
    );
  } else {
    return (
      <div className="w-full h-full p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
          Bar Chart - Financial Analysis (Victory)
        </h3>
        <div className="h-96">
          <VictoryChart
            theme={VictoryTheme.material}
            width={800}
            height={450}
            padding={{ left: 80, top: 20, right: 40, bottom: 120 }}
          >
            <VictoryAxis
              dependentAxis
              tickFormat={(value) => formatCurrency(Number(value))}
              style={{
                tickLabels: { fontSize: 12, padding: 5 }
              }}
            />
            <VictoryAxis
              style={{
                tickLabels: { fontSize: 12, padding: 5, angle: -45 }
              }}
            />
            <VictoryGroup offset={20} colorScale="qualitative">
              {measures.map((measure, index) => (
                <VictoryBar
                  key={measure.key}
                  data={chartData}
                  x="x"
                  y={measure.key}
                  style={{
                    data: { fill: measure.color }
                  }}
                  labels={({ datum }) => `${measure.label}: ${formatCurrency(datum[measure.key])}`}
                  labelComponent={
                    <VictoryTooltip
                      cornerRadius={5}
                      style={{ fontSize: 12 }}
                      flyoutStyle={{
                        fill: "rgba(255, 255, 255, 0.95)",
                        stroke: measure.color,
                        strokeWidth: 2,
                        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
                      }}
                      pointerLength={8}
                      pointerWidth={12}
                    />
                  }
                  animate={{
                    duration: 1000,
                    onLoad: { duration: 500 }
                  }}
                />
              ))}
            </VictoryGroup>
            <VictoryLegend
              x={50}
              y={380}
              orientation="horizontal"
              gutter={30}
              itemsPerRow={3}
              style={{
                border: { stroke: "#e0e0e0", strokeWidth: 1, fill: "#f9f9f9" },
                title: { fontSize: 14, fontWeight: "bold" },
                labels: { fontSize: 12, fontWeight: "500" }
              }}
              data={measures.map(measure => ({
                name: measure.label,
                symbol: {
                  fill: measure.color,
                  type: "square",
                  size: 6
                }
              }))}
            />
          </VictoryChart>
        </div>
      </div>
    );
  }
};

const EChartsRenderer: React.FC<{
  chartType: ChartType;
  measures: ChartAttribute[];
  xKey: string;
  data: FinancialData[];
}> = ({ chartType, measures, xKey, data }) => {
  const chartOptions = useMemo(() => {
    const categories = [...new Set(data.map(item => (item as any)[xKey]?.toString()))].sort();

    if (chartType.key === 'line') {
      return {
        title: {
          text: 'Line Chart - Financial Analysis (ECharts)',
          left: 'center',
          textStyle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: '#1F2937'
          }
        },
        tooltip: {
          trigger: 'axis',
          formatter: (params: any) => {
            let result = `${params[0].axisValue}<br/>`;
            params.forEach((param: any) => {
              result += `${param.seriesName}: ${formatCurrency(param.value)}<br/>`;
            });
            return result;
          }
        },
        legend: {
          data: measures.map(m => m.label),
          bottom: 10
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          name: availableDimensions.find(d => d.key === xKey)?.label || xKey,
          nameLocation: 'middle',
          nameGap: 44,
          boundaryGap: false,
          data: categories,
          axisLabel: {
            rotate: 45,
            fontSize: 12,
          }
        },
        yAxis: {
          type: 'value',
          name: 'Amount ($)',
          nameLocation: 'middle',
          nameGap: 55,
          axisLabel: {
            formatter: (value: number) => formatCurrency(value),
            fontSize: 12
          },
          axisLine: {
            show: true,
            lineStyle: {
              color: 'gray',
              width: 2,
            }
          }
        },
        series: measures.map(measure => ({
          name: measure.label,
          type: 'line',
          data: categories.map(category => {
            const item = data.find(d => (d as any)[xKey]?.toString() === category);
            return item ? (item as any)[measure.key] : 0;
          }),
          lineStyle: {
            color: measure.color,
            width: 2
          },
          itemStyle: {
            color: measure.color
          },
          smooth: true,
          symbol: 'circle',
          symbolSize: 6
        }))
      };
    } else {
      return {
        title: {
          text: 'Bar Chart - Financial Analysis (ECharts)',
          left: 'center',
          textStyle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: '#1F2937'
          }
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          formatter: (params: any) => {
            let result = `${params[0].axisValue}<br/>`;
            params.forEach((param: any) => {
              result += `${param.seriesName}: ${formatCurrency(param.value)}<br/>`;
            });
            return result;
          }
        },
        legend: {
          data: measures.map(m => m.label),
          bottom: 10
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: categories,
          axisLabel: {
            rotate: -45,
            fontSize: 12
          }
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: (value: number) => formatCurrency(value),
            fontSize: 12
          }
        },
        series: measures.map(measure => ({
          name: measure.label,
          type: 'bar',
          data: categories.map(category => {
            const item = data.find(d => (d as any)[xKey]?.toString() === category);
            return item ? (item as any)[measure.key] : 0;
          }),
          itemStyle: {
            color: measure.color
          }
        }))
      };
    }
  }, [chartType, measures, xKey, data]);

  return (
    <div className="w-full h-full p-4">
      <ReactECharts
        option={chartOptions}
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'canvas' }}
      />
    </div>
  );
};

// Highcharts Renderer Component
const HighchartsRenderer: React.FC<{
  chartType: ChartType;
  measures: ChartAttribute[];
  xKey: string;
  data: FinancialData[];
}> = ({ chartType, measures, xKey, data }) => {

  const chartOptions = useMemo(() => {
    const categories = [...new Set(data.map(item => (item as any)[xKey]?.toString()))].sort();

    const baseConfig = {
      credits: { enabled: false },
      exporting: {
        enabled: true,
        fallbackToExportServer: false,
        buttons: {
          contextButton: {
            menuItems: [
              'viewFullscreen',
              'printChart',
              'separator',
              'downloadPNG',
              'downloadJPEG',
              'downloadPDF',
              'downloadSVG',
              'separator',
              'downloadCSV',
              'downloadXLS'
            ] as string[]
          }
        }
      },
      tooltip: {
        valueDecimals: 2,
        pointFormatter: function (this: any) {
          return `<span style="color:${this.color}">\u25CF</span> ${this.series.name}: <b>${formatCurrency(this.y)}</b><br/>`;
        }
      },
      plotOptions: {
        series: {
          animation: {
            duration: 1000,
          },
        },
      },
      legend: {
        enabled: true,
        align: 'center',
        verticalAlign: 'bottom',
        layout: 'horizontal',
        itemStyle: {
          fontSize: '12px',
          color: '#374151'
        }
      }
    };

    if (chartType.key === 'line') {
      return {
        ...baseConfig,
        chart: {
          type: 'line' as const,
          zooming: { type: 'x' as const },
          backgroundColor: 'transparent'
        },
        title: {
          text: 'Line Chart - Financial Analysis (Highcharts)',
          style: {
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#1F2937'
          }
        },
        subtitle: {
          text: 'Interactive financial data visualization',
          style: {
            fontSize: '14px',
            color: '#6B7280'
          }
        },
        xAxis: {
          categories: categories,
          title: {
            text: availableDimensions.find(d => d.key === xKey)?.label || xKey,
            style: {
              fontSize: '12px',
              color: '#374151'
            }
          },
          labels: {
            // rotation: -45,
            style: {
              fontSize: '11px',
              color: '#6B7280'
            }
          },
          gridLineWidth: 0,
          lineColor: '#E5E7EB'
        },
        yAxis: {
          lineWidth: 1,
          title: {
            text: 'Amount (USD)',
            style: {
              fontSize: '12px',
              color: '#374151'
            }
          },
          labels: {
            formatter: function (this: any) {
              return formatCurrency(this.value);
            },
            style: {
              fontSize: '11px',
              color: '#6B7280'
            }
          },
          gridLineColor: '#F3F4F6',
          gridLineWidth: 1,
          lineColor: '#E5E7EB'
        },
        series: measures.map(measure => ({
          type: 'line',
          name: measure.label,
          data: categories.map(category => {
            const item = data.find(d => (d as any)[xKey]?.toString() === category);
            return item ? (item as any)[measure.key] || 0 : 0;
          }),
          color: measure.color,
          lineWidth: 3,
          marker: {
            enabled: true,
            radius: 5,
            symbol: 'circle',
            fillColor: measure.color,
            lineColor: '#fff',
            lineWidth: 2
          }
        }))
      };
    } else {
      // Bar chart
      return {
        ...baseConfig,
        chart: {
          type: 'column' as const,
          zooming: { type: 'x' as const },
          backgroundColor: 'transparent'
        },
        title: {
          text: 'Bar Chart - Financial Analysis (Highcharts)',
          style: {
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#1F2937'
          }
        },
        subtitle: {
          text: 'Interactive financial data visualization',
          style: {
            fontSize: '14px',
            color: '#6B7280'
          }
        },
        xAxis: {
          categories: categories,
          title: {
            text: xKey,
            style: {
              fontSize: '12px',
              color: '#374151'
            }
          },
          labels: {
            rotation: -45,
            style: {
              fontSize: '11px',
              color: '#6B7280'
            }
          },
          gridLineWidth: 0,
          lineColor: '#E5E7EB'
        },
        yAxis: {
          title: {
            text: 'Amount (USD)',
            style: {
              fontSize: '12px',
              color: '#374151'
            }
          },
          labels: {
            formatter: function (this: any) {
              return formatCurrency(this.value);
            },
            style: {
              fontSize: '11px',
              color: '#6B7280'
            }
          },
          gridLineColor: '#F3F4F6',
          gridLineWidth: 1,
          lineColor: '#E5E7EB'
        },
        plotOptions: {
          column: {
            dataLabels: {
              enabled: false
            },
            borderWidth: 0,
            pointPadding: 0.1,
            groupPadding: 0.1
          },
        },
        series: measures.map(measure => ({
          type: 'column',
          name: measure.label,
          data: categories.map(category => {
            const item = data.find(d => (d as any)[xKey]?.toString() === category);
            return item ? (item as any)[measure.key] || 0 : 0;
          }),
          color: measure.color
        }))
      };
    }
  }, [chartType, measures, xKey, data]);

  return (
    <div className="w-full h-full p-4">
      <HighchartsReact
        highcharts={Highcharts}
        options={chartOptions}
        immutable={false}
        containerProps={{
          style: { height: '99%', width: '100%' }
        }}
      />
    </div>
  );
};
// Chart theme configuration
const chartTheme: ChartTheme = 'Material';
enableRipple(true);

// Syncfusion Renderer Component
const SyncfusionRenderer: React.FC<{
  chartType: ChartType;
  measures: ChartAttribute[];
  xKey: string;
  data: FinancialData[];
}> = ({ chartType, measures, xKey, data }) => {

  // Process data for Syncfusion format
  const processedData = useMemo(() => {
    const categories = [...new Set(data.map(item => (item as any)[xKey]?.toString()))].sort();

    return categories.map(category => {
      const item = data.find(d => (d as any)[xKey]?.toString() === category);
      const result: any = { [xKey]: category };

      measures.forEach(measure => {
        result[measure.key] = item ? (item as any)[measure.key] || 0 : 0;
      });

      return result;
    });
  }, [data, xKey, measures]);

  // Color palette for series
  const getSeriesColor = (index: number): string => {
    const colors = ['#058DC7', '#50B432', '#ED561B', '#DDDF00', '#24CBE5', '#64E572', '#FF9655', '#FFF263', '#6AF9C4'];
    return measures[index]?.color || colors[index % colors.length];
  };

  if (chartType.key === 'line') {
    return (
      <div className="w-full h-full p-4">
        <ChartComponent
          height="100%"
          style={{ textAlign: 'center' }}
          theme={chartTheme}
          title={`Line Chart - Financial Analysis (Syncfusion)`}
          subTitle="Interactive financial data visualization"
          primaryXAxis={{
            valueType: 'Category',
            title: availableDimensions.find(d => d.key === xKey)?.label || xKey,
            labelRotation: -45,
            labelStyle: { color: '#666', size: '12px' },
            majorGridLines: { width: 0 },
            lineStyle: { color: '#E5E7EB' }
          }}
          primaryYAxis={{
            title: 'Amount (USD)',
            labelFormat: '${value}',
            labelStyle: { color: '#666', size: '12px' },
            majorGridLines: { color: '#F3F4F6', width: 1 },
            lineStyle: { color: '#E5E7EB' }
          }}
          axisLabelRender={(args) => {
            if (args.axis.name === 'primaryYAxis') {
              args.text = formatCurrency(args.value);
            }
          }}
          tooltip={{
            enable: true,
            shared: false,
            enableHighlight: true,
            showNearestTooltip: true,
            header: '<b>${series.name}</b>',
            // format: '${point.x}: <b>' + formatCurrency('${point.y}') + '</b>',
            fill: 'rgba(255, 255, 255, 0.95)',
            border: { color: '#E5E7EB', width: 1 },
            textStyle: { color: '#1F2937', size: '12px' }
          }}
          legendSettings={{
            visible: true,
            position: 'Bottom',
            padding: 20,
            shapePadding: 10,
            textStyle: { color: '#374151', size: '12px' }
          }}
          enableAnimation={true}
          background="transparent"
          margin={{ left: 20, right: 20, top: 40, bottom: 60 }}
        >
          <Inject services={[LineSeries, Category, SyncfusionLegend, SyncfusionTooltip, DataLabel, Export, Highlight, Selection]} />
          <SeriesCollectionDirective>
            {measures.map((measure, index) => (
              <SeriesDirective
                key={measure.key}
                dataSource={processedData}
                xName={xKey}
                yName={measure.key}
                type="Line"
                name={measure.label}
                width={3}
                marker={{
                  visible: true,
                  width: 8,
                  height: 8,
                  shape: index % 3 === 0 ? 'Circle' : index % 3 === 1 ? 'Diamond' : 'Triangle',
                  fill: getSeriesColor(index),
                  border: { width: 2, color: '#fff' }
                }}
                fill={getSeriesColor(index)}
                opacity={0.9}
              />
            ))}
          </SeriesCollectionDirective>
        </ChartComponent>
      </div>
    );
  } else {
    // Bar/Column Chart
    return (
      <div className="w-full h-full p-4">
        <ChartComponent
          height="100%"
          style={{ textAlign: 'center' }}
          theme={chartTheme}
          title={`Bar Chart - Financial Analysis (Syncfusion)`}
          subTitle="Interactive financial data visualization"
          primaryXAxis={{
            valueType: 'Category',
            title: availableDimensions.find(d => d.key === xKey)?.label || xKey,
            labelRotation: -45,
            labelStyle: { color: '#666', size: '12px' },
            majorGridLines: { width: 0 },
            lineStyle: { color: '#E5E7EB' }
          }}
          primaryYAxis={{
            title: 'Amount (USD)',
            labelFormat: '${value}',
            labelStyle: { color: '#666', size: '12px' },
            majorGridLines: { color: '#F3F4F6', width: 1 },
            lineStyle: { color: '#E5E7EB' }
          }}
          tooltip={{
            enable: true,
            shared: false,
            header: '<b>${series.name}</b>',
            // format: '${point.x}: <b>' + formatCurrency('${point.y}') + '</b>',
            fill: 'rgba(255, 255, 255, 0.95)',
            border: { color: '#E5E7EB', width: 1 },
            textStyle: { color: '#1F2937', size: '12px' }
          }}
          legendSettings={{
            visible: true,
            position: 'Bottom',
            padding: 20,
            shapePadding: 10,
            textStyle: { color: '#374151', size: '12px' }
          }}
          enableAnimation={true}
          background="transparent"
          margin={{ left: 20, right: 20, top: 40, bottom: 60 }}
        >
          <Inject services={[ColumnSeries, Category, Legend, Tooltip, DataLabel, Export, Highlight, Selection]} />
          <SeriesCollectionDirective>
            {measures.map((measure, index) => (
              <SeriesDirective
                key={measure.key}
                dataSource={processedData}
                xName={xKey}
                yName={measure.key}
                type="Column"
                name={measure.label}
                fill={getSeriesColor(index)}
                columnSpacing={0.1}
                columnWidth={0.8}
                opacity={0.9}
                border={{ width: 1, color: 'transparent' }}
                dataLabel={{
                  visible: false,
                  position: 'Top',
                  font: { fontWeight: '600', color: '#ffffff', size: '10px' }
                }}
              />
            ))}
          </SeriesCollectionDirective>
        </ChartComponent>
      </div>
    );
  }
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
      className={`available-fields-items-card flex items-center gap-2 p-3 rounded-lg border-2 border-dashed transition-all duration-200 cursor-move ${isUsed
        ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
        : `${bgColor} ${hoverColor}`
        }`}
    >
      <Grip size={16} className="text-gray-400" />
      <div style={{ color: attribute.color }}>
        {getIcon(attribute.iconName, 16)}
      </div>
      <span className={`available-fields-items-text text-sm font-medium ${isUsed ? 'text-gray-400' : 'text-gray-700'}`}>
        {attribute.label}
      </span>
      <span className={`text-xs px-2 py-1 rounded-full ${attribute.type === 'measure' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
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
              className={`border-2 border-dashed rounded-lg p-3 transition-all duration-200 ${isDragOverChart ? 'border-blue-400 bg-blue-50' : 'border-blue-200 bg-blue-25'
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
                      <span className={`text-xs px-1 py-0.5 rounded-full ${attribute.type === 'measure' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
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
              className={`border-2 border-dashed rounded-lg p-3 transition-all duration-200 ${isDragOverFilters ? 'border-purple-400 bg-purple-50' : 'border-purple-200 bg-purple-25'
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
                      <span className={`text-xs px-1 py-0.5 rounded-full ${attribute.type === 'measure' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
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
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                  {/* Group By Header */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-green-100">
                      <Layers size={16} className="text-green-600" />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-800 block">
                        Group By
                      </label>
                      <span className="text-xs text-gray-500">Choose dimension for grouping</span>
                    </div>
                    {config.groupBy && (
                      <div className="ml-auto">
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                          Active
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Custom Select for Group By */}
                  <div className="mb-3">
                    <CustomSelect
                      options={[
                        { label: 'No Grouping', value: '' },
                        ...config.chart
                          .filter(attr => attr.type === 'dimension')
                          .map((dim) => ({
                            label: dim.label,
                            value: dim.key
                          }))
                      ]}
                      value={config.groupBy ? {
                        label: config.chart.find(attr => attr.key === config.groupBy)?.label || '',
                        value: config.groupBy
                      } : { label: 'No Grouping', value: '' }}
                      onChange={(selectedOption) => {
                        const value = selectedOption?.value?.toString();
                        onGroupByChange(chartType.key, value === '' ? undefined : value);
                      }}
                      placeholder="Select dimension for grouping..."
                      className="text-sm"
                      borderColor="#10b981"
                      isClearable={true}
                      isSearchable={false}
                      styles={{
                        control: (provided, state) => ({
                          ...provided,
                          borderRadius: '8px',
                          minHeight: '38px',
                          borderColor: state.isFocused ? '#10b981' : '#d1d5db',
                          borderWidth: '2px',
                          boxShadow: state.isFocused ? '0 0 0 1px #10b98120' : 'none',
                          '&:hover': {
                            borderColor: '#10b981',
                          },
                          backgroundColor: 'white',
                        }),
                        option: (provided, state) => ({
                          ...provided,
                          backgroundColor: state.isSelected
                            ? '#10b981'
                            : state.isFocused
                              ? '#10b98115'
                              : 'white',
                          color: state.isSelected ? 'white' : '#374151',
                          fontSize: '13px',
                          padding: '8px 12px',
                          '&:hover': {
                            backgroundColor: state.isSelected ? '#10b981' : '#10b98120',
                          },
                        }),
                        menu: (provided) => ({
                          ...provided,
                          borderRadius: '8px',
                          border: '1px solid #10b98130',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                          zIndex: 1000,
                        }),
                        menuList: (provided) => ({
                          ...provided,
                          padding: '4px',
                        }),
                        placeholder: (provided) => ({
                          ...provided,
                          color: '#9ca3af',
                          fontSize: '13px',
                        }),
                        singleValue: (provided) => ({
                          ...provided,
                          color: '#374151',
                          fontSize: '13px',
                          fontWeight: '500',
                        }),
                        clearIndicator: (provided) => ({
                          ...provided,
                          color: '#6b7280',
                          '&:hover': {
                            color: '#10b981',
                          },
                        }),
                        dropdownIndicator: (provided) => ({
                          ...provided,
                          color: '#6b7280',
                          '&:hover': {
                            color: '#10b981',
                          },
                        }),
                      }}
                    />
                  </div>

                  {/* Available Dimensions Info */}
                  <div className="space-y-2">
                    <div className="text-xs text-gray-600 font-medium">Available dimensions:</div>
                    <div className="flex flex-wrap gap-1">
                      {config.chart.filter(attr => attr.type === 'dimension').map((dim) => {
                        const isSelected = config.groupBy === dim.key;

                        return (
                          <button
                            key={dim.key}
                            onClick={() => {
                              onGroupByChange(chartType.key, isSelected ? undefined : dim.key);
                            }}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all duration-200 ${isSelected
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
                              }`}
                          >
                            <div style={{ color: isSelected ? '#10b981' : dim.color }}>
                              {getIcon(dim.iconName, 12)}
                            </div>
                            <span>{dim.label}</span>
                            {isSelected && (
                              <div className="w-1.5 h-1.5 rounded-full bg-green-600"></div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Current Selection Display */}
                  {config.groupBy && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-gray-600">
                          <span className="font-medium">Grouping by:</span>{' '}
                          <span className="text-green-700 font-semibold">
                            {config.chart.find(attr => attr.key === config.groupBy)?.label}
                          </span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Filter Values */}
              {config.filters.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {config.filters.map((attribute) => {
                    const availableValues = getDimensionValues(attribute.key);
                    const selectedValues = config.filterValues[attribute.key] || [];
                    const isAllSelected = selectedValues.length === availableValues.length;
                    const isNoneSelected = selectedValues.length === 0;

                    // Prepare options for react-select
                    const selectOptions = availableValues.map(value => ({
                      label: value,
                      value: value
                    }));

                    const selectedOptions = selectedValues.map(value => ({
                      label: value,
                      value: value
                    }));

                    return (
                      <div key={attribute.key} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                        {/* Filter Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="p-1.5 rounded-lg"
                              style={{
                                backgroundColor: attribute.color + '15',
                                color: attribute.color
                              }}
                            >
                              {getIcon(attribute.iconName, 16)}
                            </div>
                            <div>
                              <label className="text-sm font-semibold text-gray-800 block">
                                {attribute.label}
                              </label>
                              <span className="text-xs text-gray-500">Filter values</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className="text-xs px-2 py-1 rounded-full font-medium"
                              style={{
                                backgroundColor: selectedValues.length > 0 ? attribute.color + '20' : '#f3f4f6',
                                color: selectedValues.length > 0 ? attribute.color : '#6b7280'
                              }}
                            >
                              {selectedValues.length}/{availableValues.length}
                            </span>
                          </div>
                        </div>

                        {/* Custom Select Component */}
                        <div className="mb-3">
                          <CustomSelect
                            // @ts-ignore
                            isMulti
                            options={selectOptions}
                            value={selectedOptions}
                            onChange={(selectedOptions) => {
                              // @ts-ignore
                              const values = selectedOptions ? selectedOptions.map(option => option.value.toString()) : [];
                              onFilterChange(chartType.key, attribute.key, values);
                            }}
                            placeholder={`Select ${attribute.label.toLowerCase()}...`}
                            className="text-sm"
                            classNamePrefix="filter-select"
                            borderColor={attribute.color}
                            closeMenuOnSelect={false}
                            hideSelectedOptions={false}
                            isClearable={true}
                            isSearchable={true}
                            menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                            styles={{
                              control: (provided, state) => ({
                                ...provided,
                                borderRadius: '8px',
                                minHeight: '38px',
                                borderColor: state.isFocused ? attribute.color : '#d1d5db',
                                borderWidth: '2px',
                                boxShadow: state.isFocused ? `0 0 0 1px ${attribute.color}20` : 'none',
                                '&:hover': {
                                  borderColor: attribute.color,
                                },
                                backgroundColor: 'white',
                              }),
                              multiValue: (provided) => ({
                                ...provided,
                                backgroundColor: attribute.color + '15',
                                borderRadius: '6px',
                              }),
                              multiValueLabel: (provided) => ({
                                ...provided,
                                color: attribute.color,
                                fontWeight: '500',
                                fontSize: '12px',
                              }),
                              multiValueRemove: (provided) => ({
                                ...provided,
                                color: attribute.color,
                                '&:hover': {
                                  backgroundColor: attribute.color + '30',
                                  color: attribute.color,
                                },
                              }),
                              option: (provided, state) => ({
                                ...provided,
                                backgroundColor: state.isSelected
                                  ? attribute.color
                                  : state.isFocused
                                    ? attribute.color + '15'
                                    : 'white',
                                color: state.isSelected ? 'white' : '#374151',
                                fontSize: '13px',
                                padding: '8px 12px',
                                '&:hover': {
                                  backgroundColor: state.isSelected ? attribute.color : attribute.color + '20',
                                },
                              }),
                              menu: (provided) => ({
                                ...provided,
                                borderRadius: '8px',
                                border: `1px solid ${attribute.color}30`,
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                zIndex: 1000,
                              }),
                              menuList: (provided) => ({
                                ...provided,
                                maxHeight: '200px',
                                padding: '4px',
                              }),
                              placeholder: (provided) => ({
                                ...provided,
                                color: '#9ca3af',
                                fontSize: '13px',
                              }),
                              input: (provided) => ({
                                ...provided,
                                fontSize: '13px',
                              }),
                              clearIndicator: (provided) => ({
                                ...provided,
                                color: '#6b7280',
                                '&:hover': {
                                  color: attribute.color,
                                },
                              }),
                              dropdownIndicator: (provided) => ({
                                ...provided,
                                color: '#6b7280',
                                '&:hover': {
                                  color: attribute.color,
                                },
                              }),
                            }}
                          />
                        </div>

                        {/* Quick Action Buttons */}
                        <div className="flex justify-between items-center">
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                onFilterChange(chartType.key, attribute.key, availableValues);
                              }}
                              disabled={isAllSelected}
                              className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${isAllSelected
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                }`}
                            >
                              All
                            </button>
                            <button
                              onClick={() => {
                                onFilterChange(chartType.key, attribute.key, []);
                              }}
                              disabled={isNoneSelected}
                              className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${isNoneSelected
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                              None
                            </button>
                          </div>

                          {/* Status Indicator */}
                          {selectedValues.length > 0 && (
                            <div className="flex items-center gap-1">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: attribute.color }}
                              ></div>
                              <span className="text-xs text-gray-600 font-medium">
                                Active
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Selected Values Preview (for when many are selected) */}
                        {selectedValues.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="text-xs text-gray-600">
                              <span className="font-medium">Applied to:</span>
                              <div className="mt-1">
                                {selectedValues.length <= 3 ? (
                                  <span className="text-gray-700">
                                    {selectedValues.join(', ')}
                                  </span>
                                ) : (
                                  <span className="text-gray-700">
                                    {selectedValues.slice(0, 2).join(', ')} and {selectedValues.length - 2} others
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
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
  const dispatch = useDispatch();
  const { chartConfigurations, selectedLibrary } = useSelector((state: RootState) => state.dashboard);

  // const [chartConfigurations, setChartConfigurations] = useState<ChartConfigurations>({
  //   line: {
  //     chart: [],
  //     filters: [],
  //     filterValues: {}
  //   },
  //   bar: {
  //     chart: [],
  //     filters: [],
  //     filterValues: {}
  //   }
  // });

  // const [selectedLibrary, setSelectedLibrary] = useState<ChartLibrary>('ag-charts');
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

  const handleAttributeDrop = (chartType: 'line' | 'bar', attribute: ChartAttribute, dropZone: 'chart' | 'filters') => {
    const updatedConfig = {
      ...chartConfigurations[chartType],
      [dropZone]: [
        ...chartConfigurations[chartType][dropZone].filter(attr => attr.key !== attribute.key),
        attribute
      ]
    };
    dispatch(updateChartConfig({ chartType, config: updatedConfig }));
  };

  const handleAttributeRemove = (chartType: 'line' | 'bar', attributeKey: string, attributeType: 'chart' | 'filters') => {
    const updatedConfig = {
      ...chartConfigurations[chartType],
      [attributeType]: chartConfigurations[chartType][attributeType].filter(attr => attr.key !== attributeKey)
    };
    if (attributeType === 'filters') {
      const { [attributeKey]: removedFilter, ...remainingFilterValues } = updatedConfig.filterValues || {};
      updatedConfig.filterValues = remainingFilterValues;
    }
    dispatch(updateChartConfig({ chartType, config: updatedConfig }));
  };

  const handleGroupByChange = (chartType: 'line' | 'bar', dimensionKey: string | undefined) => {
    const updatedConfig = {
      ...chartConfigurations[chartType],
      groupBy: dimensionKey
    };
    dispatch(updateChartConfig({ chartType, config: updatedConfig }));
  };

  const handleFilterChange = (chartType: 'line' | 'bar', dimension: string, values: string[]) => {
    const updatedConfig = {
      ...chartConfigurations[chartType],
      filterValues: {
        ...chartConfigurations[chartType].filterValues,
        [dimension]: values
      }
    };
    dispatch(updateChartConfig({ chartType, config: updatedConfig }));
  };

  const handleLibraryChange = (library: ChartLibrary) => {
    dispatch(setSelectedLibrary(library));
  };

  // const handleAttributeDrop = (chartType: 'line' | 'bar', attribute: ChartAttribute, dropZone: 'chart' | 'filters'): void => {
  //   setChartConfigurations(prev => ({
  //     ...prev,
  //     [chartType]: {
  //       ...prev[chartType],
  //       [dropZone]: [
  //         ...prev[chartType][dropZone].filter(attr => attr.key !== attribute.key),
  //         attribute
  //       ]
  //     }
  //   }));
  // };

  // const handleAttributeRemove = (chartType: 'line' | 'bar', attributeKey: string, attributeType: 'chart' | 'filters'): void => {
  //   setChartConfigurations(prev => ({
  //     ...prev,
  //     [chartType]: {
  //       ...prev[chartType],
  //       [attributeType]: prev[chartType][attributeType].filter(attr => attr.key !== attributeKey)
  //     }
  //   }));
  // };

  // const handleGroupByChange = (chartType: 'line' | 'bar', dimensionKey: string | undefined): void => {
  //   setChartConfigurations(prev => ({
  //     ...prev,
  //     [chartType]: {
  //       ...prev[chartType],
  //       groupBy: dimensionKey
  //     }
  //   }));
  // };

  // const handleFilterChange = (chartType: 'line' | 'bar', dimension: string, values: string[]): void => {
  //   setChartConfigurations(prev => ({
  //     ...prev,
  //     [chartType]: {
  //       ...prev[chartType],
  //       filterValues: {
  //         ...prev[chartType].filterValues,
  //         [dimension]: values
  //       }
  //     }
  //   }));
  // };

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
    <div className="drag-and-drop min-h-screen bg-gradient-to-br from-gray-50 to-white p-6">
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
          onLibraryChange={handleLibraryChange}
        />

        <div className="measures-section grid grid-cols-1 lg:grid-cols-1 gap-6 bg-white rounded-xl shadow-lg p-6 mb-5">
          {/* Measures Section */}
          <div className="mb-6">
            <h3 className="font-semibold text-blue-800 mb-4 flex items-center gap-2">
              <DollarSign size={16} />
              Available Fields
            </h3>
            <div className="available-fields grid grid-cols-2 lg:grid-cols-4 gap-4">
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

        <div className="available-attributes grid grid-cols-1 lg:grid-cols-4 gap-6">
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
            <AgCharts
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
                <span className={`text-xs px-2 py-1 rounded-full ${selectedCount > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
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
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${isSelected
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
                          <span className={`text-xs px-2 py-0.5 rounded-full ${attribute.type === 'measure' ?
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

const AGChartsEnterpriseRenderer: React.FC<{
  chartType: ChartType;
  measures: ChartAttribute[];
  xKey: string;
  data: FinancialData[];
}> = ({ chartType, measures, xKey, data }) => {
  const chartRef = useRef<HTMLDivElement>(null);

  //@ts-ignore
  const chartOptions: AgChartOptionsEnterprise = useMemo(() => {
    const series = measures.map(measure => ({
      type: chartType.key,
      xKey: xKey,
      yKey: measure.key,
      yName: measure.label,
      stroke: measure.color,
      fill: measure.color,
      // tooltip: {
      //   renderer: (params: any) => {
      //     return `<div class="p-2 bg-white border border-gray-200 rounded shadow">
      //       <div class="font-semibold">${params.xValue}</div>
      //       <div>${params.yName}: ${formatCurrency(params.yValue)}</div>
      //     </div>`;
      //   }
      // },
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
          label: { rotation: -45 },
          line: {
            color: '#e0e0e0',
          },
          tick: {
            color: '#e0e0e0',
          },
        },
        {
          type: 'number',
          position: 'left',
          title: { text: 'Amount ($)' },
          label: {
            formatter: (params: any) => formatCurrency(params.value)
          },
          line: {
            color: '#e0e0e0',
          },
          tick: {
            color: '#e0e0e0',
          },
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
      tooltip: { mode: 'single' },
    };
  }, [chartType, measures, xKey, data]);

  useEffect(() => {
    if (!chartRef.current || !data.length) return;


    const chart = AgChartsEnterprise.create({
      ...chartOptions,
      container: chartRef.current,
    });

    return () => {
      if (chart && chart.destroy) {
        chart.destroy();
      }
    };
  }, [chartType, measures, xKey, data]);

  return (
    <div className="w-full h-full">
      <div ref={chartRef} className="w-full h-full min-h-[300px]" />
    </div>
  );
};

export default EnhancedDashboard;
