'use client';

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import HighchartsExporting from 'highcharts/modules/exporting';
import HighchartsExportData from 'highcharts/modules/export-data';
import HighchartsOfflineExporting from 'highcharts/modules/offline-exporting';

import { BarChartData, Dimensions, DonutChartData, LineChartData, PieChartData } from '@/types/Schemas';
import { GroupModal } from '@/components/GroupManagement';
import {
    useFetchDrillDownDataMutation,
    databaseName,
    useFetchChartDataWithCrossChartFilterMutation
} from '@/lib/services/usersApi';
import { DashboardActionButtonComponent } from '@/components/ui/action-button';
import { ErrorAlert, LoadingAlert } from '@/components/ui/status-alerts';
import HighchartsDrilldown from 'highcharts/modules/drilldown';
import { buildRequestBody } from '@/lib/services/buildWhereClause';
import { ChartContainerView } from '@/components/charts/ChartContainerView';
import { testCase2ProductId, useFetchTestCase2ChartDataWithCrossChartFilterMutation, useFetchTestCase2DrillDownDataMutation } from '@/lib/services/testCase2Api';
import { RootState } from '@/store/store';
import { useSelector } from 'react-redux';
import { transformTestCase2DrillDownData, transformTestCase2ToCommonFormat } from '@/lib/testCase2Transformer';
import { useEmailShareDrawer } from '@/hooks/useEmailShareDrawer';
import { EmailShareDrawer } from '@/components/drawer/EmailShareDrawer';
import { formatCurrency, HighchartsCaptureScreenshot } from '@/utils/utils';
import { ComparisonDrawer } from '@/components/drawer/ChartComparisonDrawer';
import { useChartComparisonDrawer } from '@/hooks/useChartComparisonDrawer';


// Initialize only once and only on client side
if (typeof window !== 'undefined') {
    if (typeof HighchartsExporting === 'function') {
        HighchartsExporting(Highcharts);
    }
    if (typeof HighchartsExportData === 'function') {
        HighchartsExportData(Highcharts);
    }
    if (typeof HighchartsOfflineExporting === 'function') {
        HighchartsOfflineExporting(Highcharts);
    }
    if (typeof HighchartsDrilldown === 'function') {
        HighchartsDrilldown(Highcharts);
    }
}

// Defaults Colors
Highcharts.setOptions({
    colors: [
        '#058DC7', '#50B432', '#ED561B', '#DDDF00', '#24CBE5', '#64E572',
        '#FF9655', '#FFF263', '#6AF9C4'
    ]
});

interface ChartContainerProps {
    options: Highcharts.Options | null;
    title: string;
    isLoading?: boolean;
    isDrilled?: boolean;
    resetDrillDown?: () => void;
    isCrossChartFiltered?: { Year?: string; selected_region?: string; selected_country?: string };
    resetCrossChartFilter?: () => void;
    handleShareChart: (title: string, chartRef: React.RefObject<HTMLDivElement>) => void;
    onComparisonOpen: (chartType: string) => void;
    chartType: string;
}

// Chart configuration constants
type ChartType = 'line' | 'bar' | 'pie' | 'donut';

// Chart configuration constants
const CHART_CONFIG = {
    COMMON: {
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
            pointFormatter: function (this: Highcharts.Point) {
                return `<span style="color:${this.color}">\u25CF</span> ${this.series.name}: <b>${formatCurrency(this.y as number)}</b><br/>`;
            }
        },
        plotOptions: {
            series: {
                animation: {
                    duration: 1000,
                },
            },
        },
    },
    LINE: {
        chart: { type: 'line' as const, zooming: { type: 'x' as const } },
        title: { text: 'Revenue Trends Over Time' },
        subtitle: { text: 'Showing financial metrics by period' },
        xAxis: { title: { text: 'Period' } },
        yAxis: {
            title: { text: 'Amount (USD)' },
            labels: {
                formatter: function (this: Highcharts.AxisLabelsFormatterContextObject) {
                    return formatCurrency(this.value as number);
                }
            },
            lineWidth: 1
        },
    },
    BAR: {
        chart: { type: 'column' as const, zooming: { type: 'x' as const } },
        title: { text: 'Revenue vs Expenses' },
        subtitle: { text: 'Showing financial metrics by period' },
        xAxis: { title: { text: 'Period' } },
        yAxis: {
            title: { text: 'Amount (USD)' },
            labels: {
                formatter: function (this: Highcharts.AxisLabelsFormatterContextObject) {
                    return formatCurrency(this.value as number);
                }
            },
            lineWidth: 1
        },
        plotOptions: {
            column: {
                dataLabels: {
                    enabled: true,
                    //@ts-ignore
                    formatter: function (this: Highcharts.PointLabelObject) {
                        return formatCurrency(this.y as number);
                    }
                },
            },
        },
    },
    PIE: {
        chart: { type: 'pie' as const },
        title: { text: 'Financial Distribution' },
        subtitle: { text: 'Showing financial metrics' },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: {
                    enabled: true,
                    //@ts-ignore
                    formatter: function (this: Highcharts.PointLabelObject) {
                        return `<b>${this.point.name}</b>: ${formatCurrency(this.y as number)} (${this.percentage?.toFixed(1)}%)`;
                    }
                },
                showInLegend: true,
            },
        },
    },
    DONUT: {
        chart: { type: 'pie' as const },
        title: { text: 'Revenue by Category' },
        subtitle: { text: 'Showing financial metrics' },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: {
                    enabled: false,
                    //@ts-ignore
                    formatter: function (this: Highcharts.PointLabelObject) {
                        return `<b>${this.point.name}</b>: ${formatCurrency(this.y as number)} (${this.percentage?.toFixed(1)}%)`;
                    }
                },
                innerSize: '50%',
                showInLegend: true,
            },
        },
    },
} as const;

const HighCharts: React.FC = () => {
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
    // Comparison drawer state
    const { comparisonDrawer, handleComparisonOpenDrawer, handleComparisonCloseDrawer } = useChartComparisonDrawer()

    const testCase = useSelector((state: RootState) => state.dashboard.selectedTestCase);

    // Test Case 1 API Mutations
    const [fetchChartDataWithCrossChartFilter] = useFetchChartDataWithCrossChartFilterMutation();
    const [fetchDrillDownData] = useFetchDrillDownDataMutation();

    // Test Case 2 API Mutations
    const [fetchTestCase2ChartDataWithCrossChartFilter] = useFetchTestCase2ChartDataWithCrossChartFilterMutation();
    const [fetchTestCase2DrillDownData] = useFetchTestCase2DrillDownDataMutation();

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

    const createDrillDownOptions = useCallback((type: ChartType, data: any[], title: string) => {
        if (!data.length) return null;

        const baseConfig = {
            ...CHART_CONFIG.COMMON,
            title: { text: title },
            subtitle: { text: 'Drill-down data' },
        };

        const columns = Object.keys(data[0]);
        const categoryKey = columns.find(key => key.includes('period') || key.includes('category')) || columns[0];
        const valueKey = columns.find(key => key.includes('value') || key.includes('amount')) || columns[1];

        switch (type) {
            case 'line':
                return {
                    ...baseConfig,
                    chart: { type: 'line' as const },
                    xAxis: {
                        categories: data.map(item => item[categoryKey]),
                        title: { text: categoryKey }
                    },
                    yAxis: { title: { text: `${valueKey} ($)` } },
                    series: [{
                        type: 'line',
                        name: valueKey,
                        data: data.map(item => item[valueKey]),
                    }],
                };

            case 'bar':
                return {
                    ...baseConfig,
                    chart: { type: 'column' as const },
                    xAxis: {
                        categories: data.map(item => item[categoryKey]),
                        title: { text: categoryKey }
                    },
                    yAxis: { title: { text: 'Amount ($)' } },
                    series: [{
                        type: 'column',
                        name: valueKey,
                        data: data.map(item => item[valueKey]),
                    }],
                };

            case 'pie':
            case 'donut':
                return {
                    ...baseConfig,
                    chart: { type: 'line' as const },
                    xAxis: {
                        categories: data.map(item => item[categoryKey]),
                        title: { text: categoryKey }
                    },
                    yAxis: { title: { text: 'Amount (USD)' } },
                    series: [{
                        type: 'line',
                        name: valueKey,
                        data: data.map(item => item[valueKey]),
                    }],
                };


            default:
                return {
                    ...baseConfig,
                    chart: { type: 'pie' as const },
                    plotOptions: {
                        pie: {
                            allowPointSelect: true,
                            cursor: 'pointer',
                            dataLabels: { enabled: true },
                            showInLegend: true,
                            ...(type === 'donut' ? { innerSize: '50%' } : {})
                        },
                    },
                    series: [{
                        type: 'pie',
                        name: 'Value',
                        data: data.map(item => ({
                            name: item[categoryKey],
                            y: item[valueKey],
                        })),
                    }],
                };
        }
    }, []);


    // Memoized chart options
    const chartOptions = useMemo(() => {
        const options: Record<ChartType, Highcharts.Options | null> = {
            line: null,
            bar: null,
            pie: null,
            donut: null,
        };

        if (drillDownState.type && drillDownState.data.length > 0) {
            const drillDownOption = createDrillDownOptions(drillDownState.type, drillDownState.data, drillDownState.title);
            // @ts-ignore
            options[drillDownState.type] = drillDownOption;
        }

        // Determine x-axis key based on year filter in crossChartFilter
        const xKey = crossChartFilter?.Year ? 'period' : 'fiscalYear';

        // Line Chart
        if (chartData.line.length > 0 && drillDownState.type !== 'line') {
            // Separate highlighted and non-highlighted data
            const regularLineData = chartData.line.filter(d => !d.ishighlighted);
            const highlightedLineData = chartData.line.filter(d => d.ishighlighted);
            const hasHighlightedLine = highlightedLineData.length > 0;
            
            const allCategories = chartData.line?.map((item) => item[xKey as keyof LineChartData] || item.fiscalYear);
            
            const baseSeries = [
                {
                    type: 'line',
                    name: 'Revenue',
                    data: regularLineData?.map((item) => item.revenue),
                    color: hasHighlightedLine ? 'rgba(5, 141, 199, 0.3)' : '#058DC7',
                    lineWidth: hasHighlightedLine ? 2 : 3,
                    cursor: 'pointer',
                    events: {
                        click: function (event: any) {
                            const point = event.point;
                            if (xKey === 'fiscalYear') {
                                const fiscalYear = String(point.category);
                                setCrossChartFilter(prev => ({ ...prev, Year: fiscalYear }));
                            }
                        }
                    }
                },
                {
                    type: 'line',
                    name: 'Gross Margin',
                    data: regularLineData?.map((item) => item.grossMargin),
                    color: hasHighlightedLine ? 'rgba(80, 180, 50, 0.3)' : '#50B432',
                    lineWidth: hasHighlightedLine ? 2 : 3,
                    cursor: 'pointer',
                    events: {
                        click: function (event: any) {
                            const point = event.point;
                            if (xKey === 'fiscalYear') {
                                const fiscalYear = String(point.category);
                                setCrossChartFilter(prev => ({ ...prev, Year: fiscalYear }));
                            }
                        }
                    }
                },
                {
                    type: 'line',
                    name: 'Net Profit',
                    data: regularLineData?.map((item) => item.netProfit),
                    color: hasHighlightedLine ? 'rgba(237, 86, 27, 0.3)' : '#ED561B',
                    lineWidth: hasHighlightedLine ? 2 : 3,
                    cursor: 'pointer',
                    events: {
                        click: function (event: any) {
                            const point = event.point;
                            if (xKey === 'fiscalYear') {
                                const fiscalYear = String(point.category);
                                setCrossChartFilter(prev => ({ ...prev, Year: fiscalYear }));
                            }
                        }
                    }
                },
            ];
            
            const highlightedSeries = hasHighlightedLine ? [
                {
                    type: 'line',
                    name: highlightedLineData[0]?.filterLabel ? `Revenue (${highlightedLineData[0].filterLabel})` : 'Revenue (Filtered)',
                    data: highlightedLineData?.map((item) => item.revenue),
                    color: '#058DC7',
                    lineWidth: 4,
                    cursor: 'pointer',
                    dashStyle: 'Dash',
                    events: {
                        click: function (event: any) {
                            const point = event.point;
                            if (xKey === 'fiscalYear') {
                                const fiscalYear = String(point.category);
                                setCrossChartFilter(prev => ({ ...prev, Year: fiscalYear }));
                            }
                        }
                    }
                },
                {
                    type: 'line',
                    name: highlightedLineData[0]?.filterLabel ? `Gross Margin (${highlightedLineData[0].filterLabel})` : 'Gross Margin (Filtered)',
                    data: highlightedLineData?.map((item) => item.grossMargin),
                    color: '#50B432',
                    lineWidth: 4,
                    cursor: 'pointer',
                    dashStyle: 'Dash',
                    events: {
                        click: function (event: any) {
                            const point = event.point;
                            if (xKey === 'fiscalYear') {
                                const fiscalYear = String(point.category);
                                setCrossChartFilter(prev => ({ ...prev, Year: fiscalYear }));
                            }
                        }
                    }
                },
                {
                    type: 'line',
                    name: highlightedLineData[0]?.filterLabel ? `Net Profit (${highlightedLineData[0].filterLabel})` : 'Net Profit (Filtered)',
                    data: highlightedLineData?.map((item) => item.netProfit),
                    color: '#ED561B',
                    lineWidth: 4,
                    cursor: 'pointer',
                    dashStyle: 'Dash',
                    events: {
                        click: function (event: any) {
                            const point = event.point;
                            if (xKey === 'fiscalYear') {
                                const fiscalYear = String(point.category);
                                setCrossChartFilter(prev => ({ ...prev, Year: fiscalYear }));
                            }
                        }
                    }
                },
            ] : [];
            
            options.line = {
                ...CHART_CONFIG.COMMON,
                ...CHART_CONFIG.LINE,
                //@ts-ignore
                xAxis: {
                    ...CHART_CONFIG.LINE.xAxis,
                    categories: allCategories,
                },
                //@ts-ignore
                series: [...baseSeries, ...highlightedSeries],
                drilldown: {
                    series: []
                }
            };
        }

        // Bar Chart
        if (chartData.bar.length > 0 && drillDownState.type !== 'bar') {
            // Separate highlighted and non-highlighted data
            const regularBarData = chartData.bar.filter(d => !d.ishighlighted);
            const highlightedBarData = chartData.bar.filter(d => d.ishighlighted);
            const hasHighlightedBar = highlightedBarData.length > 0;
            
            const allBarCategories = chartData.bar?.map((item) => String(item[xKey as keyof BarChartData] || ''));
            
            const baseBarSeries = [
                {
                    type: 'column',
                    name: 'Revenue',
                    data: regularBarData?.map((item) => item.revenue),
                    color: hasHighlightedBar ? 'rgba(5, 141, 199, 0.3)' : '#058DC7',
                    cursor: 'pointer',
                    events: {
                        click: function (event: any) {
                            const point = event.point;
                            if (xKey === 'fiscalYear') {
                                const fiscalYear = String(point.category);
                                setCrossChartFilter(prev => ({ ...prev, Year: fiscalYear }));
                            }
                        }
                    }
                },
                {
                    type: 'column',
                    name: 'Expenses',
                    data: regularBarData?.map((item) => item.expenses),
                    color: hasHighlightedBar ? 'rgba(237, 86, 27, 0.3)' : '#ED561B',
                    cursor: 'pointer',
                    events: {
                        click: function (event: any) {
                            const point = event.point;
                            if (xKey === 'fiscalYear') {
                                const fiscalYear = String(point.category);
                                setCrossChartFilter(prev => ({ ...prev, Year: fiscalYear }));
                            }
                        }
                    }
                },
            ];
            
            const highlightedBarSeries = hasHighlightedBar ? [
                {
                    type: 'column',
                    name: highlightedBarData[0]?.filterLabel ? `Revenue (${highlightedBarData[0].filterLabel})` : 'Revenue (Filtered)',
                    data: highlightedBarData?.map((item) => item.revenue),
                    color: '#058DC7',
                    cursor: 'pointer',
                    events: {
                        click: function (event: any) {
                            const point = event.point;
                            if (xKey === 'fiscalYear') {
                                const fiscalYear = String(point.category);
                                setCrossChartFilter(prev => ({ ...prev, Year: fiscalYear }));
                            }
                        }
                    }
                },
                {
                    type: 'column',
                    name: highlightedBarData[0]?.filterLabel ? `Expenses (${highlightedBarData[0].filterLabel})` : 'Expenses (Filtered)',
                    data: highlightedBarData?.map((item) => item.expenses),
                    color: '#ED561B',
                    cursor: 'pointer',
                    events: {
                        click: function (event: any) {
                            const point = event.point;
                            if (xKey === 'fiscalYear') {
                                const fiscalYear = String(point.category);
                                setCrossChartFilter(prev => ({ ...prev, Year: fiscalYear }));
                            }
                        }
                    }
                },
            ] : [];
            
            options.bar = {
                ...CHART_CONFIG.COMMON,
                ...CHART_CONFIG.BAR,
                xAxis: {
                    ...CHART_CONFIG.BAR.xAxis,
                    //@ts-ignore
                    categories: allBarCategories,
                },
                //@ts-ignore
                series: [...baseBarSeries, ...highlightedBarSeries],
            };
        }

        // Pie Chart
        if (chartData.pie.length > 0 && drillDownState.type !== 'pie') {
            const firstPie = chartData.pie[0] as any;
            const pieCategoryKey = firstPie?.continent ? 'continent' : 'catfinancialview';
            
            // Check if any item is highlighted
            const hasHighlightedPie = chartData.pie.some(item => item.ishighlighted);
            
            // Diverse color palette for pie chart
            const pieColors = [
                '#FF6384', // Pink/Red
                '#36A2EB', // Blue
                '#FFCE56', // Yellow
                '#4BC0C0', // Teal
                '#9966FF', // Purple
                '#FF9F40', // Orange
                '#FF6384', // Pink (repeat for more slices)
                '#C9CBCF', // Grey
            ];
            
            options.pie = {
                ...CHART_CONFIG.COMMON,
                ...CHART_CONFIG.PIE,
                series: [
                    {
                        type: 'pie',
                        name: 'Financial Metrics',
                        colors: pieColors,
                        data: chartData.pie.map(item => {
                            const isHighlighted = item.ishighlighted;
                            const shouldDim = hasHighlightedPie && !isHighlighted;
                            
                            return {
                                name: (item as any)[pieCategoryKey] || item?.catfinancialview,
                                y: item.revenue,
                                opacity: shouldDim ? 0.25 : 1,
                                sliced: isHighlighted,
                                selected: isHighlighted,
                                dataLabels: {
                                    style: {
                                        fontWeight: isHighlighted ? 'bold' : 'normal',
                                        fontSize: isHighlighted ? '14px' : '12px',
                                        color: isHighlighted ? '#000000' : '#666666'
                                    }
                                }
                            };
                        }),
                        cursor: 'pointer',
                        point: {
                            events: {
                                click: function (event: any) {
                                    const point = this;
                                    if (pieCategoryKey === 'continent' && point.name) {
                                        setCrossChartFilter(prev => ({ ...prev, selected_region: point.name, selected_country: undefined }));
                                    }
                                }
                            }
                        }
                    },
                ],
            };
        }

        // Donut Chart
        if (chartData.donut.length > 0 && drillDownState.type !== 'donut') {
            const firstDonut = chartData.donut[0] as any;
            const donutCategoryKey = firstDonut?.country ? 'country' : 'cataccountingview';
            
            // Check if any item is highlighted
            const hasHighlightedDonut = chartData.donut.some(item => item.ishighlighted);
            
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
                series: [
                    {
                        type: 'pie',
                        name: 'Revenue Distribution',
                        colors: donutColors,
                        data: chartData.donut.map(item => {
                            const isHighlighted = item.ishighlighted;
                            const shouldDim = hasHighlightedDonut && !isHighlighted;
                            
                            return {
                                name: (item as any)[donutCategoryKey] || item.cataccountingview,
                                y: item.revenue,
                                opacity: shouldDim ? 0.25 : 1,
                                sliced: isHighlighted,
                                selected: isHighlighted,
                                dataLabels: {
                                    style: {
                                        fontWeight: isHighlighted ? 'bold' : 'normal',
                                        fontSize: isHighlighted ? '14px' : '12px',
                                        color: isHighlighted ? '#000000' : '#666666'
                                    }
                                }
                            };
                        }),
                        cursor: 'pointer',
                        point: {
                            events: {
                                click: function (event: any) {
                                    const point = this;
                                    if (donutCategoryKey === 'country' && point.name) {
                                        // When selecting a country, clear the region filter
                                        setCrossChartFilter(prev => ({ ...prev, selected_country: point.name, selected_region: undefined }));
                                    }
                                }
                            }
                        }
                    },
                ],
            };
        }

        return options;
    }, [chartData, crossChartFilter, drillDownState, createDrillDownOptions, testCase]);

    const fetchChartDataByTestCase = async () => {
        try {
            if (testCase === "test-case-1") {
                const res = await fetchChartDataWithCrossChartFilter({ body: buildRequestBody(dimensions, 'all'), Year: crossChartFilter.Year, selected_region: crossChartFilter.selected_region, selected_country: crossChartFilter.selected_country }).unwrap();
                if (!res?.success) throw new Error(res.message || "Error");
                return res;
            } else {
                const raw = await fetchTestCase2ChartDataWithCrossChartFilter({ body: buildRequestBody(dimensions, 'all'), Year: crossChartFilter.Year, selected_region: crossChartFilter.selected_region, selected_country: crossChartFilter.selected_country, productId: testCase2ProductId, excludeNullRevenue: false }).unwrap();
                // const transformed = transformTestCase2ToCommonFormat(raw);
                // if (!transformed?.success) throw new Error(transformed.message || "Error");
                return raw;
            }
        } catch (error) {
            console.log(error, 'Error fetching chart data');

        }
    }

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
            // console.error('Error fetching chart data:', err);
        } finally {
            setIsLoading(false);
        }
    }, [dimensions, crossChartFilter, testCase, fetchChartDataWithCrossChartFilter, fetchTestCase2ChartDataWithCrossChartFilter]);

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

    // Share email 
    const handleShareChart = async (
        title: string,
        chartRef: React.RefObject<HTMLDivElement>
    ) => {
        if (!chartRef.current) return;
        try {
            const imageData = await HighchartsCaptureScreenshot(chartRef);
            handleOpenDrawer(title, imageData);
        } catch (error) {
            console.error('Failed to capture chart:', error);
            setError('Failed to capture chart for sharing');
        }
    };

    return (
        <section className="p-5">
            <h1 className="md:text-2xl font-bold text-center mb-4">
                Financial Dashboard - Highcharts
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
                <ChartContainer
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
                />
                <ChartContainer
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
                />
                <ChartContainer
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
                />
                <ChartContainer
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
                chartLibrary='highcharts'
                testCase={testCase}
            />}
        </section>
    );
};


const ChartContainer: React.FC<ChartContainerProps> = ({
    options,
    title,
    isLoading = false,
    isDrilled = false,
    resetDrillDown,
    isCrossChartFiltered,
    resetCrossChartFilter,
    handleShareChart,
    onComparisonOpen,
    chartType
}) => {
    const chartRef = useRef<HTMLDivElement>(null);
    return (
        <ChartContainerView
            title={title}
            isDrilled={isDrilled}
            resetDrillDown={resetDrillDown}
            isLoading={isLoading}
            isCrossChartFiltered={isCrossChartFiltered}
            resetCrossChartFilter={resetCrossChartFilter}
            hasData={!!options}
            chartRef={chartRef as React.RefObject<HTMLDivElement>}
            onShareChart={() => handleShareChart(title, chartRef as React.RefObject<HTMLDivElement>)}
            onComparisonOpen={() => onComparisonOpen(chartType || '')}
        >
            <div className="min-h-[400px]">
                <HighchartsReact
                    highcharts={Highcharts}
                    options={options}
                    immutable={false}
                />
            </div>
        </ChartContainerView>
    )
};

export default HighCharts;