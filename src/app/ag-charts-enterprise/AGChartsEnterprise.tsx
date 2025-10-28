'use client';

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import Papa from 'papaparse';

import { AgCharts } from 'ag-charts-enterprise';
import { AgChartOptions } from 'ag-charts-enterprise';

import { BarChartData, Dimensions, DonutChartData, LineChartData, PieChartData } from '@/types/Schemas';
import { GroupModal } from '@/components/GroupManagement';
import {
    useFetchDrillDownDataMutation,
    databaseName,
    useFetchChartDataWithCrossChartFilterMutation
} from '@/lib/services/usersApi';
import { DashboardActionButtonComponent } from '@/components/ui/action-button';
import { ErrorAlert, LoadingAlert } from '@/components/ui/status-alerts';
import { buildRequestBody } from '@/lib/services/buildWhereClause';
import { ChartContextMenu } from '@/components/charts/ChartContextMenu';
import { ChartContainerView } from '@/components/charts/ChartContainerView';
import { testCase2ProductId, useFetchTestCase2ChartDataWithCrossChartFilterMutation, useFetchTestCase2DrillDownDataMutation } from '@/lib/services/testCase2Api';
import { RootState } from '@/store/store';
import { useSelector } from 'react-redux';
import { transformTestCase2DrillDownData, transformTestCase2ToCommonFormat } from '@/lib/testCase2Transformer';
import { useEmailShareDrawer } from '@/hooks/useEmailShareDrawer';
import { EmailShareDrawer } from '@/components/drawer/EmailShareDrawer';
import { formatCurrency } from '@/utils/utils';
import { ComparisonDrawer } from '@/components/drawer/ChartComparisonDrawer';
import { useChartComparisonDrawer } from '@/hooks/useChartComparisonDrawer';

// Initialize AG Charts Enterprise
if (typeof window !== 'undefined') {
    // AG Charts Enterprise initialization would go here
    // AgCharts.setLicenseKey('your-license-key'); // Add your enterprise license key
}

interface ChartContainerProps {
    options: AgChartOptions | null;
    title: string;
    isLoading?: boolean;
    isDrilled?: boolean;
    resetDrillDown?: () => void;
    isCrossChartFiltered?: { Year?: string; selected_region?: string; selected_country?: string };
    resetCrossChartFilter?: () => void;
    handleShareChart: (title: string, containerRef: React.RefObject<HTMLDivElement>) => void;
    onComparisonOpen: (chartType: string) => void;
    chartType: string;
    chartRef: React.RefObject<HTMLDivElement>;
    exportToPNG?: () => void;
    exportToCSV?: () => void;

}

// Chart configuration constants
type ChartType = 'line' | 'bar' | 'pie' | 'donut';

// AG Charts Enterprise configuration constants
const CHART_CONFIG = {
    COMMON: {
        background: {
            fill: 'white',
        },
        padding: {
            top: 20,
            right: 20,
            bottom: 20,
            left: 20,
        },
        legend: {
            position: 'bottom',
            spacing: 40,
        },
        toolbar: {
            enabled: true,
        },
        contextMenu: {
            enabled: true,
        },
        animation: {
            enabled: true,
            duration: 1000,
        },
    },
    LINE: {
        title: {
            text: 'Revenue Trends Over Time',
            fontSize: 18,
            fontWeight: 'bold',
        },
        subtitle: {
            text: 'Showing financial metrics by period',
            fontSize: 14,
        },
        axes: [
            {
                type: 'category',
                position: 'bottom',
                title: {
                    text: 'Period',
                    fontSize: 14,
                },
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
                title: {
                    text: 'Amount (USD)',
                    fontSize: 14,
                },
                label: {
                    formatter: ({ value }: any) => formatCurrency(value),
                },
                line: {
                    color: '#e0e0e0',
                },
                tick: {
                    color: '#e0e0e0',
                },
            },
        ],
    },
    BAR: {
        title: {
            text: 'Revenue vs Expenses',
            fontSize: 18,
            fontWeight: 'bold',
        },
        subtitle: {
            text: 'Showing financial metrics by period',
            fontSize: 14,
        },
        axes: [
            {
                type: 'category',
                position: 'bottom',
                title: {
                    text: 'Period',
                    fontSize: 14,
                },
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
                title: {
                    text: 'Amount (USD)',
                    fontSize: 14,
                },
                label: {
                    formatter: ({ value }: any) => formatCurrency(value),
                },
                line: {
                    color: '#e0e0e0',
                },
                tick: {
                    color: '#e0e0e0',
                },
            },
        ],
    },
    PIE: {
        title: {
            text: 'Financial Distribution',
            fontSize: 18,
            fontWeight: 'bold',
        },
        subtitle: {
            text: 'Showing financial metrics',
            fontSize: 14,
        },
    },
    DONUT: {
        title: {
            text: 'Revenue by Category',
            fontSize: 18,
            fontWeight: 'bold',
        },
        subtitle: {
            text: 'Showing financial metrics',
            fontSize: 14,
        },
    },
} as const;

const AGChartsEnterprise: React.FC = () => {
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState<boolean>(false);
    const [dimensions, setDimensions] = useState<Dimensions | null>(null);
    const [crossChartFilter, setCrossChartFilter] = useState<{ Year?: string; selected_region?: string; selected_country?: string }>({});
    const [drillDownState, setDrillDownState] = useState<{
        type: ChartType | null;
        data: any[];
        title: string;
    }>({
        type: null,
        data: [],
        title: ''
    });

    const [chartData, setChartData] = useState<{
        line: LineChartData[];
        bar: BarChartData[];
        pie: PieChartData[];
        donut: DonutChartData[];
    }>({
        line: [],
        bar: [],
        pie: [],
        donut: [],
    });

    const { emailDrawer, handleOpenDrawer, handleCloseDrawer } = useEmailShareDrawer();
    const { comparisonDrawer, handleComparisonOpenDrawer, handleComparisonCloseDrawer } = useChartComparisonDrawer();

    const testCase = useSelector((state: RootState) => state.dashboard.selectedTestCase);

    // Test Case 1 API Mutations
    const [fetchChartDataWithCrossChartFilter] = useFetchChartDataWithCrossChartFilterMutation();
    const [fetchDrillDownData] = useFetchDrillDownDataMutation();

    // Test Case 2 API Mutations
    const [fetchTestCase2ChartDataWithCrossChartFilter] = useFetchTestCase2ChartDataWithCrossChartFilterMutation();
    const [fetchTestCase2DrillDownData] = useFetchTestCase2DrillDownDataMutation();


    // Chart refs for AG Charts
    const lineChartRef = useRef<HTMLDivElement>(null);
    const barChartRef = useRef<HTMLDivElement>(null);
    const pieChartRef = useRef<HTMLDivElement>(null);
    const donutChartRef = useRef<HTMLDivElement>(null);

    // Handle drill down using API
    const handleDrillDown = useCallback(async (chartType: string, category: string, value: any, dataType: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const result: any = testCase === "test-case-1"
                ? await fetchDrillDownData({
                    table_name: databaseName,
                    chart_type: chartType,
                    category: category,
                    data_type: dataType,
                    value: value
                }).unwrap()
                : transformTestCase2DrillDownData(await fetchTestCase2DrillDownData({
                    productId: testCase2ProductId,
                    chartType: chartType,
                    category: category,
                    dataType: dataType,
                    value: value
                }).unwrap());

            if (result.success && result.data && result.data.length > 0) {
                setDrillDownState({
                    type: chartType as ChartType,
                    data: result.data,
                    title: result.title || `${dataType} Breakdown for ${category}`
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
    }, [fetchDrillDownData, fetchTestCase2DrillDownData, testCase]);

    const createDrillDownOptions = useCallback((type: ChartType, data: any[], title: string): AgChartOptions | null => {
        if (!data.length) return null;

        const columns = Object.keys(data[0]);
        const categoryKey = columns.find(key => key.includes('period') || key.includes('category')) || columns[0];
        const valueKey = columns.find(key => key.includes('value') || key.includes('amount')) || columns[1];

        const baseConfig = {
            ...CHART_CONFIG.COMMON,
            title: {
                text: title,
                fontSize: 18,
                fontWeight: 'bold',
            },
            subtitle: {
                text: 'Drill-down data',
                fontSize: 14,
            },
            data: data,
        };

        switch (type) {
            case 'line':
                return {
                    ...baseConfig,
                    ...CHART_CONFIG.LINE,
                    series: [{
                        // @ts-ignore
                        type: 'line',
                        xKey: categoryKey,
                        yKey: valueKey,
                        yName: valueKey,
                        stroke: '#058DC7',
                        strokeWidth: 3,
                        marker: {
                            enabled: true,
                            fill: '#058DC7',
                            stroke: '#058DC7',
                            strokeWidth: 2,
                            size: 6,
                        },
                        // tooltip: {
                        //     renderer: ({ datum, xKey, yKey }: any) => ({
                        //         content: `${xKey}: ${datum[xKey]}<br/>${yKey}: ${formatCurrency(datum[yKey])}`
                        //     }),
                        // },
                    }],
                };

            case 'bar':
                return {
                    ...baseConfig,
                    ...CHART_CONFIG.BAR,
                    series: [{
                        // @ts-ignore
                        type: 'bar',
                        direction: 'vertical',
                        xKey: categoryKey,
                        yKey: valueKey,
                        yName: valueKey,
                        fill: '#50B432',
                        stroke: '#50B432',
                        strokeWidth: 1,
                        // tooltip: {
                        //     renderer: ({ datum, xKey, yKey }: any) => ({
                        //         content: `${xKey}: ${datum[xKey]}<br/>${yKey}: ${formatCurrency(datum[yKey])}`
                        //     }),
                        // },
                        label: {
                            enabled: true,
                            formatter: ({ value }: any) => formatCurrency(value),
                        },
                    }],
                };

            case 'pie':
            case 'donut':
                return {
                    ...baseConfig,
                    ...CHART_CONFIG.PIE,
                    series: [{
                        // @ts-ignore
                        type: 'pie',
                        angleKey: valueKey,
                        categoryKey: categoryKey,
                        innerRadiusRatio: type === 'donut' ? 0.5 : 0,
                        fills: ['#058DC7', '#50B432', '#ED561B', '#DDDF00', '#24CBE5', '#64E572'],
                        strokes: ['#058DC7', '#50B432', '#ED561B', '#DDDF00', '#24CBE5', '#64E572'],
                        strokeWidth: 2,
                        // tooltip: {
                        //     renderer: ({ datum, angleKey, categoryKey }: any) => ({
                        //         content: `${datum[categoryKey]}: ${formatCurrency(datum[angleKey])}`
                        //     }),
                        // },
                        label: {
                            enabled: true,
                            formatter: ({ datum, angleKey, categoryKey }: any) =>
                                `${datum[categoryKey]}: ${formatCurrency(datum[angleKey])}`,
                        },
                    }],
                };

            default:
                return {
                    ...baseConfig,
                    series: [{
                        // @ts-ignore
                        type: 'line',
                        xKey: categoryKey,
                        yKey: valueKey,
                        yName: valueKey,
                        stroke: '#058DC7',
                        strokeWidth: 3,
                    }],
                };
        }
    }, []);

    // Memoized chart options
    const chartOptions = useMemo(() => {
        const options: Record<ChartType, AgChartOptions | null> = {
            line: null,
            bar: null,
            pie: null,
            donut: null,
        };

        if (drillDownState.type && drillDownState.data.length > 0) {
            const drillDownOption = createDrillDownOptions(drillDownState.type, drillDownState.data, drillDownState.title);
            options[drillDownState.type] = drillDownOption;
        }

        // Determine x-axis key based on year filter in crossChartFilter
        const xKey = crossChartFilter?.Year ? 'period' : 'fiscalYear';

        // Line Chart
        if (chartData.line.length > 0 && drillDownState.type !== 'line') {
            // Separate highlighted and non-highlighted data
            const regularData = chartData.line.filter(d => !d.ishighlighted);
            const highlightedData = chartData.line.filter(d => d.ishighlighted);
            const hasHighlighted = highlightedData.length > 0;

            const baseSeries = [
                {
                    // @ts-ignore
                    type: 'line',
                    xKey: xKey,
                    yKey: 'revenue',
                    yName: 'Revenue',
                    stroke: hasHighlighted ? 'rgba(5, 141, 199, 0.3)' : '#058DC7',
                    strokeWidth: 3,
                    marker: {
                        enabled: true,
                        fill: hasHighlighted ? 'rgba(5, 141, 199, 0.3)' : '#058DC7',
                        stroke: hasHighlighted ? 'rgba(5, 141, 199, 0.3)' : '#058DC7',
                        strokeWidth: 2,
                        size: 6,
                    },
                    data: regularData,
                    listeners: {
                        seriesNodeClick: (event: any) => {
                            const { datum } = event;
                            if (xKey === 'fiscalYear' && datum?.fiscalYear) {
                                setCrossChartFilter(prev => ({ ...prev, Year: String(datum.fiscalYear) }));
                            }
                        }
                    }
                },
                {
                    // @ts-ignore
                    type: 'line',
                    xKey: xKey,
                    yKey: 'grossMargin',
                    yName: 'Gross Margin',
                    stroke: hasHighlighted ? 'rgba(80, 180, 50, 0.3)' : '#50B432',
                    strokeWidth: 3,
                    marker: {
                        enabled: true,
                        fill: hasHighlighted ? 'rgba(80, 180, 50, 0.3)' : '#50B432',
                        stroke: hasHighlighted ? 'rgba(80, 180, 50, 0.3)' : '#50B432',
                        strokeWidth: 2,
                        size: 6,
                    },
                    data: regularData,
                    listeners: {
                        seriesNodeClick: (event: any) => {
                            const { datum } = event;
                            if (xKey === 'fiscalYear' && datum?.fiscalYear) {
                                setCrossChartFilter(prev => ({ ...prev, Year: String(datum.fiscalYear) }));
                            }
                        }
                    }
                },
                {
                    // @ts-ignore
                    type: 'line',
                    xKey: xKey,
                    yKey: 'netProfit',
                    yName: 'Net Profit',
                    stroke: hasHighlighted ? 'rgba(237, 86, 27, 0.3)' : '#ED561B',
                    strokeWidth: 3,
                    marker: {
                        enabled: true,
                        fill: hasHighlighted ? 'rgba(237, 86, 27, 0.3)' : '#ED561B',
                        stroke: hasHighlighted ? 'rgba(237, 86, 27, 0.3)' : '#ED561B',
                        strokeWidth: 2,
                        size: 6,
                    },
                    data: regularData,
                    listeners: {
                        seriesNodeClick: (event: any) => {
                            const { datum } = event;
                            if (xKey === 'fiscalYear' && datum?.fiscalYear) {
                                setCrossChartFilter(prev => ({ ...prev, Year: String(datum.fiscalYear) }));
                            }
                        }
                    }
                },
            ];

            // Add highlighted series if they exist
            const highlightedSeries = hasHighlighted ? [
                {
                    // @ts-ignore
                    type: 'line',
                    xKey: xKey,
                    yKey: 'revenue',
                    yName: highlightedData[0]?.filterLabel ? `Revenue (${highlightedData[0].filterLabel})` : 'Revenue (Filtered)',
                    stroke: '#058DC7',
                    strokeWidth: 4,
                    strokeOpacity: 1,
                    marker: {
                        enabled: true,
                        fill: '#058DC7',
                        stroke: '#058DC7',
                        strokeWidth: 2,
                        size: 8,
                    },
                    data: highlightedData,
                    listeners: {
                        seriesNodeClick: (event: any) => {
                            const { datum } = event;
                            if (xKey === 'fiscalYear' && datum?.fiscalYear) {
                                setCrossChartFilter(prev => ({ ...prev, Year: String(datum.fiscalYear) }));
                            }
                        }
                    }
                },
                {
                    // @ts-ignore
                    type: 'line',
                    xKey: xKey,
                    yKey: 'grossMargin',
                    yName: highlightedData[0]?.filterLabel ? `Gross Margin (${highlightedData[0].filterLabel})` : 'Gross Margin (Filtered)',
                    stroke: '#50B432',
                    strokeWidth: 4,
                    strokeOpacity: 1,
                    marker: {
                        enabled: true,
                        fill: '#50B432',
                        stroke: '#50B432',
                        strokeWidth: 2,
                        size: 8,
                    },
                    data: highlightedData,
                    listeners: {
                        seriesNodeClick: (event: any) => {
                            const { datum } = event;
                            if (xKey === 'fiscalYear' && datum?.fiscalYear) {
                                setCrossChartFilter(prev => ({ ...prev, Year: String(datum.fiscalYear) }));
                            }
                        }
                    }
                },
                {
                    // @ts-ignore
                    type: 'line',
                    xKey: xKey,
                    yKey: 'netProfit',
                    yName: highlightedData[0]?.filterLabel ? `Net Profit (${highlightedData[0].filterLabel})` : 'Net Profit (Filtered)',
                    stroke: '#ED561B',
                    strokeWidth: 4,
                    strokeOpacity: 1,
                    marker: {
                        enabled: true,
                        fill: '#ED561B',
                        stroke: '#ED561B',
                        strokeWidth: 2,
                        size: 8,
                    },
                    data: highlightedData,
                    listeners: {
                        seriesNodeClick: (event: any) => {
                            const { datum } = event;
                            if (xKey === 'fiscalYear' && datum?.fiscalYear) {
                                setCrossChartFilter(prev => ({ ...prev, Year: String(datum.fiscalYear) }));
                            }
                        }
                    }
                },
            ] : [];

            options.line = {
                ...CHART_CONFIG.COMMON,
                ...CHART_CONFIG.LINE,
                data: chartData.line,
                tooltip: { mode: 'single' },
                // @ts-ignore
                series: [...baseSeries, ...highlightedSeries],
            };
        }

        // Bar Chart
        if (chartData.bar.length > 0 && drillDownState.type !== 'bar') {
            // Separate highlighted and non-highlighted data
            const regularBarData = chartData.bar.filter(d => !d.ishighlighted);
            const highlightedBarData = chartData.bar.filter(d => d.ishighlighted);
            const hasHighlightedBar = highlightedBarData.length > 0;

            const baseBarSeries = [
                {
                    // @ts-ignore
                    type: 'bar',
                    direction: 'vertical',
                    xKey: xKey,
                    yKey: 'revenue',
                    yName: 'Revenue',
                    fill: hasHighlightedBar ? 'rgba(5, 141, 199, 0.3)' : '#058DC7',
                    stroke: hasHighlightedBar ? 'rgba(5, 141, 199, 0.3)' : '#058DC7',
                    strokeWidth: 1,
                    fillOpacity: hasHighlightedBar ? 0.3 : 1,
                    data: regularBarData,
                    label: {
                        enabled: false,
                        formatter: ({ value }: any) => formatCurrency(value),
                    },
                    listeners: {
                        seriesNodeClick: (event: any) => {
                            const { datum } = event;
                            if (xKey === 'fiscalYear' && datum?.fiscalYear) {
                                setCrossChartFilter(prev => ({ ...prev, Year: String(datum.fiscalYear) }));
                            }
                        }
                    }
                },
                {
                    // @ts-ignore
                    type: 'bar',
                    direction: 'vertical',
                    xKey: xKey,
                    yKey: 'expenses',
                    yName: 'Expenses',
                    fill: hasHighlightedBar ? 'rgba(237, 86, 27, 0.3)' : '#ED561B',
                    stroke: hasHighlightedBar ? 'rgba(237, 86, 27, 0.3)' : '#ED561B',
                    strokeWidth: 1,
                    fillOpacity: hasHighlightedBar ? 0.3 : 1,
                    data: regularBarData,
                    label: {
                        enabled: false,
                        formatter: ({ value }: any) => formatCurrency(value),
                    },
                    listeners: {
                        seriesNodeClick: (event: any) => {
                            const { datum } = event;
                            if (xKey === 'fiscalYear' && datum?.fiscalYear) {
                                setCrossChartFilter(prev => ({ ...prev, Year: String(datum.fiscalYear) }));
                            }
                        }
                    }
                },
            ];

            // Add highlighted series if they exist
            const highlightedBarSeries = hasHighlightedBar ? [
                {
                    // @ts-ignore
                    type: 'bar',
                    direction: 'vertical',
                    xKey: xKey,
                    yKey: 'revenue',
                    yName: highlightedBarData[0]?.filterLabel ? `Revenue (${highlightedBarData[0].filterLabel})` : 'Revenue (Filtered)',
                    fill: '#058DC7',
                    stroke: '#058DC7',
                    strokeWidth: 1,
                    fillOpacity: 1,
                    data: highlightedBarData,
                    label: {
                        enabled: false,
                        formatter: ({ value }: any) => formatCurrency(value),
                    },
                },
                {
                    // @ts-ignore
                    type: 'bar',
                    direction: 'vertical',
                    xKey: xKey,
                    yKey: 'expenses',
                    yName: highlightedBarData[0]?.filterLabel ? `Expenses (${highlightedBarData[0].filterLabel})` : 'Expenses (Filtered)',
                    fill: '#ED561B',
                    stroke: '#ED561B',
                    strokeWidth: 1,
                    fillOpacity: 1,
                    data: highlightedBarData,
                    label: {
                        enabled: false,
                        formatter: ({ value }: any) => formatCurrency(value),
                    },
                },
            ] : [];

            options.bar = {
                ...CHART_CONFIG.COMMON,
                ...CHART_CONFIG.BAR,
                data: chartData.bar,
                tooltip: { mode: 'single' },
                // @ts-ignore
                series: [...baseBarSeries, ...highlightedBarSeries],
            };
        }

        // Pie Chart
        if (chartData.pie.length > 0 && drillDownState.type !== 'pie') {
            const firstPie = chartData.pie[0] as any;
            const pieCategoryKey = firstPie?.continent ? 'continent' : 'catfinancialview';
            
            // Check if any item is highlighted
            const hasHighlightedPie = chartData.pie.some(d => d.ishighlighted);
            
            // Diverse color palette for pie chart - distinct colors to avoid confusion
            const pieColors = [
                '#1E88E5', // Blue
                '#43A047', // Green
                '#E53935', // Red
                '#FDD835', // Yellow
                '#8E24AA', // Purple
                '#FB8C00', // Orange
                '#00ACC1', // Cyan
                '#C0CA33', // Lime
                '#F06292', // Pink
                '#5E35B1', // Deep Purple
                '#FF6F00', // Dark Orange
                '#00897B', // Teal
            ];
            
            options.pie = {
                ...CHART_CONFIG.COMMON,
                ...CHART_CONFIG.PIE,
                data: chartData.pie,
                series: [{
                    // @ts-ignore
                    type: 'pie',
                    angleKey: 'revenue',
                    categoryKey: pieCategoryKey,
                    fills: pieColors,
                    strokes: pieColors,
                    strokeWidth: 2,
                    sectorLabelKey: pieCategoryKey,
                    legendItemKey: pieCategoryKey,
                    sectorLabel: { enabled: false },
                    calloutLabelKey: pieCategoryKey,
                    calloutLabel: {
                        enabled: true,
                        fontSize: ({ datum }: any) => datum?.ishighlighted && hasHighlightedPie ? 14 : 12,
                        fontWeight: ({ datum }: any) => datum?.ishighlighted && hasHighlightedPie ? 'bold' : 'normal',
                        color: ({ datum }: any) => datum?.ishighlighted && hasHighlightedPie ? '#000000' : '#666666',
                    },
                    // Apply dimming effect using item style based on data
                    itemStyler: ({ datum }: any) => {
                        if (hasHighlightedPie && !datum?.ishighlighted) {
                            return {
                                fillOpacity: 0.25,
                                strokeOpacity: 0.25,
                                strokeWidth: 1,
                            };
                        }
                        return {
                            fillOpacity: 1,
                            strokeOpacity: 1,
                            strokeWidth: datum?.ishighlighted ? 4 : 2,
                        };
                    },
                    tooltip: {
                        renderer: (params: any) => {
                            const isHighlighted = params.datum?.ishighlighted ? ' ⭐' : '';
                            const fontWeight = params.datum?.ishighlighted ? 'font-bold text-lg' : 'font-semibold';
                            return `
                                  <div class="p-3 bg-white border-2 ${params.datum?.ishighlighted ? 'border-yellow-400' : 'border-gray-200'} rounded shadow-lg">
                                    <div class="flex items-center gap-2">
                                      <div class="w-4 h-4 rounded" style="background-color:${params.fill}"></div>
                                      <div class="${fontWeight}">${params.datum[pieCategoryKey]}${isHighlighted}</div>
                                    </div>
                                    <div class="mt-1 ${params.datum?.ishighlighted ? 'font-semibold' : ''}">Revenue: ${formatCurrency(params.datum['revenue'])}</div>
                                  </div>`;
                        },
                    },
                    listeners: {
                        seriesNodeClick: (event: any) => {
                            const { datum } = event;
                            if (pieCategoryKey === 'continent' && datum?.continent) {
                                setCrossChartFilter(prev => ({ ...prev, selected_region: datum.continent, selected_country: undefined }));
                            }
                        }
                    }
                }],
            };
        }

        // Donut Chart
        if (chartData.donut.length > 0 && drillDownState.type !== 'donut') {
            const firstDonut = chartData.donut[0] as any;
            const donutCategoryKey = firstDonut?.country ? 'country' : 'cataccountingview';
            
            // Check if any item is highlighted (can be true or false, but not null)
            const hasHighlightedDonut = chartData.donut.some(d => d.ishighlighted === true || d.ishighlighted === false);
            
            // Diverse color palette for donut chart - more colors to handle many countries
            const donutColors = [
                '#2196F3', // Blue
                '#4CAF50', // Green  
                '#FF5722', // Deep Orange
                '#9C27B0', // Purple
                '#FF9800', // Orange
                '#00BCD4', // Cyan
                '#CDDC39', // Lime
                '#E91E63', // Pink
                '#673AB7', // Deep Purple
                '#009688', // Teal
                '#FFC107', // Amber
                '#3F51B5', // Indigo
                '#8BC34A', // Light Green
                '#FF6F00', // Dark Orange
                '#D32F2F', // Dark Red
                '#7B1FA2', // Dark Purple
                '#0288D1', // Light Blue
                '#388E3C', // Dark Green
                '#F57C00', // Dark Orange 2
                '#C2185B', // Dark Pink
                '#512DA8', // Deep Purple 2
            ];
            
            options.donut = {
                ...CHART_CONFIG.COMMON,
                ...CHART_CONFIG.DONUT,
                data: chartData.donut,
                series: [{
                    // @ts-ignore
                    type: 'donut',
                    angleKey: 'revenue',
                    categoryKey: donutCategoryKey,
                    innerRadiusRatio: 0.5,
                    fills: donutColors,
                    strokes: donutColors,
                    strokeWidth: 2,
                    sectorLabelKey: donutCategoryKey,
                    legendItemKey: donutCategoryKey,
                    calloutLabelKey: donutCategoryKey,
                    sectorLabel: { enabled: false },
                    calloutLabel: {
                        enabled: true,
                        fontSize: ({ datum }: any) => datum?.ishighlighted === true && hasHighlightedDonut ? 13 : 11,
                        fontWeight: ({ datum }: any) => datum?.ishighlighted === true && hasHighlightedDonut ? 'bold' : 'normal',
                        color: ({ datum }: any) => datum?.ishighlighted === true && hasHighlightedDonut ? '#000000' : '#666666',
                    },
                    // Apply dimming effect using item style based on data
                    itemStyler: ({ datum }: any) => {
                        // If highlighting is active and this item is not highlighted (false or null)
                        if (hasHighlightedDonut && datum?.ishighlighted !== true) {
                            return {
                                fillOpacity: 0.25,
                                strokeOpacity: 0.25,
                                strokeWidth: 1,
                            };
                        }
                        return {
                            fillOpacity: 1,
                            strokeOpacity: 1,
                            strokeWidth: datum?.ishighlighted === true ? 4 : 2,
                        };
                    },
                    tooltip: {
                        renderer: (params: any) => {
                            const isHighlighted = params.datum?.ishighlighted === true ? ' ⭐' : '';
                            const fontWeight = params.datum?.ishighlighted === true ? 'font-bold text-lg' : 'font-semibold';
                            const continentInfo = params.datum?.continent ? `<div class="text-xs ${params.datum?.ishighlighted === true ? 'text-gray-700 font-medium' : 'text-gray-500'} mt-1">📍 ${params.datum.continent}</div>` : '';
                            return `
                                <div class="p-3 bg-white border-2 ${params.datum?.ishighlighted === true ? 'border-yellow-400' : 'border-gray-200'} rounded shadow-lg">
                                    <div class="flex items-center gap-2">
                                    <div class="w-4 h-4 rounded" style="background-color:${params.fill}"></div>
                                    <div class="${fontWeight}">${params.datum[donutCategoryKey]}${isHighlighted}</div>
                                    </div>
                                    ${continentInfo}
                                    <div class="mt-1 ${params.datum?.ishighlighted === true ? 'font-semibold' : ''}">Revenue: ${formatCurrency(params.datum['revenue'])}</div>
                                </div>`;
                        },
                    },
                    listeners: {
                        seriesNodeClick: (event: any) => {
                            const { datum } = event;
                            if (donutCategoryKey === 'country' && datum?.country) {
                                // When selecting a country, clear the region filter
                                setCrossChartFilter(prev => ({ ...prev, selected_country: datum.country, selected_region: undefined }));
                            }
                        }
                    }
                }],
            };
        }

        return options;
    }, [chartData, crossChartFilter, drillDownState, createDrillDownOptions, handleDrillDown]);

    const fetchChartDataByTestCase = async () => {
        try {
            if (testCase === "test-case-1") {
                const res = await fetchChartDataWithCrossChartFilter({ body: buildRequestBody(dimensions, 'all'), Year: crossChartFilter.Year, selected_region: crossChartFilter.selected_region, selected_country: crossChartFilter.selected_country }).unwrap();
                if (!res?.success) throw new Error(res.message || "Error");
                return res;
            } else {
                const raw = await fetchTestCase2ChartDataWithCrossChartFilter({ body: buildRequestBody(dimensions, 'all'), Year: crossChartFilter.Year, selected_region: crossChartFilter.selected_region, selected_country: crossChartFilter.selected_country, excludeNullRevenue: false, productId: testCase2ProductId }).unwrap();
                // const transformed = transformTestCase2ToCommonFormat(raw);                
                // if (!transformed?.success) throw new Error(transformed.message || "Error");
                return raw;
            }
        } catch (error) {
            console.log(error, 'Error fetching chart data');
        }
    };

    // Fetch chart data handler
    const fetchChartData = useCallback(async (): Promise<void> => {
        setIsLoading(true);
        setError(null);

        try {
            const result: any = await fetchChartDataByTestCase();
            
            if (!result?.success) {
                throw new Error(result?.message || 'Failed to fetch chart data');
            }

            const { charts } = result;

            setChartData({
                line: charts?.line?.success ? charts.line.data || [] : [],
                bar: charts?.bar?.success ? charts.bar.data || [] : [],
                pie: charts?.pie?.success ? charts.pie.data || [] : [],
                donut: charts?.donut?.success ? charts.donut.data || [] : [],
            });

        } catch (err: any) {
            const errorMessage = err?.data?.detail || err.message || 'Failed to fetch chart data';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [dimensions, crossChartFilter, testCase, fetchChartDataWithCrossChartFilter, fetchTestCase2ChartDataWithCrossChartFilter]);

    // Export to PNG function
    const exportChartToPNG = useCallback((chartRef: React.RefObject<HTMLDivElement>, title: string) => {
        if (!chartRef.current) return;

        try {
            const canvas = chartRef.current.querySelector('canvas');
            if (canvas) {
                // Create a link element and trigger download
                const link = document.createElement('a');
                link.download = `${title.replace(/\s+/g, '_')}_chart.png`;
                link.href = canvas.toDataURL('image/png');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } catch (error) {
            console.error('Failed to export chart as PNG:', error);
            setError('Failed to export chart as PNG');
        }
    }, []);

    // Export to CSV function
    const exportChartToCSV = useCallback((chartType: ChartType, title: string) => {
        try {
            let data: any[] = [];
            let filename = '';

            // Check if we're in drill-down mode
            if (drillDownState.type === chartType && drillDownState.data.length > 0) {
                data = drillDownState.data;
                filename = `${title.replace(/\s+/g, '_')}_drilldown_data.csv`;
            } else {
                // Use regular chart data
                switch (chartType) {
                    case 'line':
                        data = chartData.line;
                        break;
                    case 'bar':
                        data = chartData.bar;
                        break;
                    case 'pie':
                        data = chartData.pie;
                        break;
                    case 'donut':
                        data = chartData.donut;
                        break;
                    default:
                        data = [];
                }
                filename = `${title.replace(/\s+/g, '_')}_data.csv`;
            }

            if (data.length === 0) {
                setError('No data available to export');
                return;
            }

            // Convert data to CSV
            const csv = Papa.unparse(data);

            // Create and trigger download
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to export chart data as CSV:', error);
            setError('Failed to export chart data as CSV');
        }
    }, [chartData, drillDownState]);


    // Fetch data when dimensions change
    useEffect(() => {
        fetchChartData();
    }, [fetchChartData]);

    // Event handlers
    const handleCreateGroup = useCallback((data: Dimensions): void => {
        setDimensions(data);
    }, []);

    const handleResetGroup = useCallback((): void => {
        setDimensions(null);
    }, []);

    const handleCloseModal = useCallback((): void => {
        setIsGroupModalOpen(false);
    }, []);

    const handleOpenModal = useCallback((): void => {
        setIsGroupModalOpen(true);
    }, []);

    const handleDismissError = useCallback((): void => {
        setError(null);
    }, []);

    const handleResetDrillDown = useCallback(() => {
        setDrillDownState({
            type: null,
            data: [],
            title: ''
        });
    }, []);

    const handleResetCrossChartFilter = useCallback(() => {
        setCrossChartFilter({});
    }, []);


    // Share email handler
    const handleShareChart = async (
        title: string,
        chartRef: React.RefObject<HTMLDivElement>
    ) => {
        if (!chartRef.current) return;
        try {
            // AG Charts Enterprise screenshot functionality
            const chart = chartRef.current.querySelector('canvas');
            if (chart) {
                const imageData = chart.toDataURL('image/png');
                handleOpenDrawer(title, imageData);
            }
        } catch (error) {
            console.error('Failed to capture chart:', error);
            setError('Failed to capture chart for sharing');
        }
    };

    return (
        <section className="p-5">
            <h1 className="md:text-2xl font-bold text-center mb-4">
                Financial Dashboard - AG Charts Enterprise
            </h1>

            <GroupModal
                isOpen={isGroupModalOpen}
                onClose={handleCloseModal}
                // @ts-ignore
                onCreateGroup={handleCreateGroup}
            />

            <div className="flex flex-col mb-4">
                {dimensions?.groupName && (
                    <p className="text-sm text-gray-500 mb-2">
                        Current Group Name:{' '}
                        <span className="capitalize font-bold">{dimensions.groupName}</span>
                    </p>
                )}

                <DashboardActionButtonComponent
                    isLoading={isLoading}
                    handleResetGroup={handleResetGroup}
                    handleOpenModal={handleOpenModal}
                    fetchAllChartDataHandle={fetchChartData}
                />
            </div>

           

            {error && (<ErrorAlert message={error} onDismiss={handleDismissError} />)}

            {isLoading && <LoadingAlert />}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <AGChartContainer
                    chartType="line"
                    options={chartOptions.line}
                    title="Revenue Trends"
                    isLoading={isLoading}
                    isDrilled={drillDownState.type === 'line'}
                    resetDrillDown={handleResetDrillDown}
                    isCrossChartFiltered={Object.keys(crossChartFilter).length > 0 ? crossChartFilter : undefined}
                    resetCrossChartFilter={handleResetCrossChartFilter}
                    handleShareChart={handleShareChart}
                    onComparisonOpen={handleComparisonOpenDrawer}
                    chartRef={lineChartRef as React.RefObject<HTMLDivElement>}
                    exportToPNG={() => exportChartToPNG(lineChartRef as React.RefObject<HTMLDivElement>, 'Revenue Trends')}
                    exportToCSV={() => exportChartToCSV('line', 'Revenue Trends')}

                />
                <AGChartContainer
                    chartType="bar"
                    options={chartOptions.bar}
                    title="Revenue vs Expenses"
                    isLoading={isLoading}
                    isDrilled={drillDownState.type === 'bar'}
                    resetDrillDown={handleResetDrillDown}
                    isCrossChartFiltered={Object.keys(crossChartFilter).length > 0 ? crossChartFilter : undefined}
                    resetCrossChartFilter={handleResetCrossChartFilter}
                    handleShareChart={handleShareChart}
                    onComparisonOpen={handleComparisonOpenDrawer}
                    chartRef={barChartRef as React.RefObject<HTMLDivElement>}
                    exportToPNG={() => exportChartToPNG(barChartRef as React.RefObject<HTMLDivElement>, 'Revenue vs Expenses')}
                    exportToCSV={() => exportChartToCSV('bar', 'Revenue vs Expenses')}
                />
                <AGChartContainer
                    chartType="pie"
                    options={chartOptions.pie}
                    title="Financial Distribution"
                    isLoading={isLoading}
                    isDrilled={drillDownState.type === 'pie'}
                    resetDrillDown={handleResetDrillDown}
                    isCrossChartFiltered={Object.keys(crossChartFilter).length > 0 ? crossChartFilter : undefined}
                    resetCrossChartFilter={handleResetCrossChartFilter}
                    handleShareChart={handleShareChart}
                    onComparisonOpen={handleComparisonOpenDrawer}
                    chartRef={pieChartRef as React.RefObject<HTMLDivElement>}
                    exportToPNG={() => exportChartToPNG(pieChartRef as React.RefObject<HTMLDivElement>, 'Financial Distribution')}
                    exportToCSV={() => exportChartToCSV('pie', 'Financial Distribution')}
                />
                <AGChartContainer
                    chartType="donut"
                    options={chartOptions.donut}
                    title="Revenue by Category"
                    isLoading={isLoading}
                    isDrilled={drillDownState.type === 'donut'}
                    resetDrillDown={handleResetDrillDown}
                    isCrossChartFiltered={Object.keys(crossChartFilter).length > 0 ? crossChartFilter : undefined}
                    resetCrossChartFilter={handleResetCrossChartFilter}
                    handleShareChart={handleShareChart}
                    onComparisonOpen={handleComparisonOpenDrawer}
                    chartRef={donutChartRef as React.RefObject<HTMLDivElement>}
                    exportToPNG={() => exportChartToPNG(donutChartRef as React.RefObject<HTMLDivElement>, 'Revenue by Category')}
                    exportToCSV={() => exportChartToCSV('donut', 'Revenue by Category')}
                />
            </div>
            <EmailShareDrawer
                isOpen={emailDrawer.isOpen}
                onClose={handleCloseDrawer}
                chartTitle={emailDrawer.chartTitle}
                chartImage={emailDrawer.chartImage}
            />
            {comparisonDrawer.isOpen && <ComparisonDrawer
                isOpen={comparisonDrawer.isOpen}
                onClose={handleComparisonCloseDrawer}
                chartType={comparisonDrawer.chartType}
                chartLibrary="ag-charts-enterprise"
                testCase={testCase}
            />}
        </section>
    );
};

const AGChartContainer: React.FC<ChartContainerProps> = ({
    options,
    title,
    isLoading = false,
    isDrilled = false,
    resetDrillDown,
    isCrossChartFiltered,
    resetCrossChartFilter,
    handleShareChart,
    onComparisonOpen,
    chartType,
    chartRef,
    exportToPNG,
    exportToCSV
}) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!options || !containerRef.current) return;

        const chart = AgCharts.create({
            ...options,
            container: containerRef.current,
        });

        return () => {
            if (chart && chart.destroy) {
                chart.destroy();
            }
        };
    }, [options]);

    return (
        <ChartContainerView
            title={title}
            isDrilled={isDrilled}
            resetDrillDown={resetDrillDown}
            isLoading={isLoading}
            isCrossChartFiltered={isCrossChartFiltered}
            resetCrossChartFilter={resetCrossChartFilter}
            hasData={!!options}
            chartRef={chartRef}
            onShareChart={() => handleShareChart(title, chartRef)}
            onComparisonOpen={() => onComparisonOpen(chartType || '')}
              exportToPNG={exportToPNG}
            exportToCSV={exportToCSV}
        >
            <div ref={containerRef} className="min-h-[400px] w-full" />
        </ChartContainerView>
    );
};

export default AGChartsEnterprise;
