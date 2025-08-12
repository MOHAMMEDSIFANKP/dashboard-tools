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
    useFetchChartDataMutation,
    useFetchDrillDownDataMutation,
    databaseName
} from '@/lib/services/usersApi';
import { DashboardActionButtonComponent } from '@/components/ui/action-button';
import { ErrorAlert, LoadingAlert } from '@/components/ui/status-alerts';
import HighchartsDrilldown from 'highcharts/modules/drilldown';
import { buildRequestBody } from '@/lib/services/buildWhereClause';
import { ChartContextMenu } from '@/components/charts/ChartContextMenu';
import { ChartContainerView } from '@/components/charts/ChartContainerView';
import { testCase2ProductId, useFetchTestCase2ChartDataMutation, useFetchTestCase2DrillDownDataMutation } from '@/lib/services/testCase2Api';
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
    isCrossChartFiltered?: string;
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
        yAxis: { title: { text: 'Amount (USD)' } },
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
            }
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
                    enabled: true,
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
    const [crossChartFilter, setCrossChartFilter] = useState<string>('');
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
    const [fetchAllChartData] = useFetchChartDataMutation()
    const [fetchDrillDownData] = useFetchDrillDownDataMutation();

    // Test Case 2 API Mutations
    const [FetchTestCase2AllChartData] = useFetchTestCase2ChartDataMutation();
    const [fetchTestCase2DrillDownData] = useFetchTestCase2DrillDownDataMutation();
    const [contextMenu, setContextMenu] = useState<{
        isOpen: boolean;
        position: { x: number; y: number };
        category: string;
        value: any;
        chartType: string;
        dataType: string;
    } | null>(null);

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
                    yAxis: { title: { text: `${valueKey} (USD)` } },
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
                    yAxis: { title: { text: 'Amount (USD)' } },
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

        // Determine x-axis key based on cross-chart filter
        const xKey = crossChartFilter ? 'period' : 'fiscalYear';

        // Line Chart
        if (chartData.line.length > 0 && drillDownState.type !== 'line') {
            options.line = {
                ...CHART_CONFIG.COMMON,
                ...CHART_CONFIG.LINE,
                //@ts-ignore
                xAxis: {
                    ...CHART_CONFIG.LINE.xAxis,
                    categories: chartData.line?.map((item) => item[xKey as keyof LineChartData] || item.fiscalYear),
                },
                series: [
                    {
                        type: 'line',
                        name: 'Revenue',
                        data: chartData.line?.map((item) => item.revenue),
                        cursor: 'pointer',
                        events: {
                            click: function (event: any) {
                                const point = event.point;
                                const category = point.category.slice(0, 4);
                                const value = point.y;
                                setContextMenu({
                                    isOpen: true,
                                    position: { x: event.x, y: event.y },
                                    category: category,
                                    value: value,
                                    chartType: 'line',
                                    dataType: 'revenue'
                                });
                            }
                        }

                    },
                    {
                        type: 'line',
                        name: 'Gross Margin',
                        data: chartData.line?.map((item) => item.grossMargin),
                        cursor: 'pointer',
                        events: {
                            click: function (event: any) {
                                const point = event.point;
                                const category = point.category.slice(0, 4);
                                const value = point.y;
                                setContextMenu({
                                    isOpen: true,
                                    position: { x: event.x, y: event.y },
                                    category: category,
                                    value: value,
                                    chartType: 'line',
                                    dataType: 'grossMargin'
                                });
                            }
                        }

                    },
                    {
                        type: 'line',
                        name: 'Net Profit',
                        data: chartData.line?.map((item) => item.netProfit),
                        cursor: 'pointer',
                        events: {
                            click: function (event: any) {
                                const point = event.point;
                                const category = point.category.slice(0, 4);
                                const value = point.y;
                                setContextMenu({
                                    isOpen: true,
                                    position: { x: event.x, y: event.y },
                                    category: category,
                                    value: value,
                                    chartType: 'line',
                                    dataType: 'netProfit'
                                });
                            }
                        }
                    },
                ],
                drilldown: {
                    series: [

                    ]
                }
            };
        }

        // Bar Chart
        if (chartData.bar.length > 0 && drillDownState.type !== 'bar') {
            options.bar = {
                ...CHART_CONFIG.COMMON,
                ...CHART_CONFIG.BAR,
                xAxis: {
                    ...CHART_CONFIG.BAR.xAxis,
                    //@ts-ignore
                    categories: chartData.bar?.map((item) => item[xKey as keyof LineChartData]),
                },
                series: [
                    {
                        type: 'column',
                        name: 'Revenue',
                        data: chartData.bar?.map((item) => item.revenue),
                        // events: {
                        //     click: function (event: any) {
                        //         const point = event.point;
                        //         const category = point.category.slice(0, 4);
                        //         const value = point.y;
                        //         handleDrillDown('bar', category, value, 'revenue');
                        //     }
                        // }
                    },
                    {
                        type: 'column',
                        name: 'Expenses',
                        data: chartData.bar?.map((item) => item.expenses),
                        // events: {
                        //     click: function (event: any) {
                        //         const point = event.point;
                        //         const category = point.category.slice(0, 4);
                        //         const value = point.y;
                        //         handleDrillDown('bar', category, value, 'expenses');
                        //     }
                        // }
                    },
                ],

            };
        }

        // Pie Chart
        if (chartData.pie.length > 0 && drillDownState.type !== 'pie') {
            options.pie = {
                ...CHART_CONFIG.COMMON,
                ...CHART_CONFIG.PIE,
                series: [
                    {
                        type: 'pie',
                        name: 'Financial Metrics',
                        data: chartData.pie.map(item => ({
                            name: item?.catfinancialview,
                            y: item.revenue,
                        })),
                        // events: {
                        //     click: function (event: any) {
                        //         const point = event.point;
                        //         const category = point?.name;
                        //         const value = point.y;
                        //         handleDrillDown('pie', category, value, 'revenue');
                        //     }
                        // }
                    },
                ],
            };
        }

        // Donut Chart
        if (chartData.donut.length > 0 && drillDownState.type !== 'donut') {
            options.donut = {
                ...CHART_CONFIG.COMMON,
                ...CHART_CONFIG.DONUT,
                series: [
                    {
                        type: 'pie',
                        name: 'Revenue Distribution',
                        data: chartData.donut.map(item => ({
                            name: item.cataccountingview,
                            y: item.revenue,
                        })),
                        // events: {
                        //     click: function (event: any) {
                        //         const point = event.point;
                        //         const category = point?.name;
                        //         const value = point.y;
                        //         handleDrillDown('donut', category, value, 'revenue');
                        //     }
                        // }
                    },
                ],
            };
        }

        return options;
    }, [chartData, crossChartFilter, drillDownState, createDrillDownOptions, testCase]);

    const fetchChartDataByTestCase = async () => {
        try {
            if (testCase === "test-case-1") {
                const res = await fetchAllChartData({ body: buildRequestBody(dimensions, 'all'), crossChartFilter: crossChartFilter }).unwrap();
                if (!res?.success) throw new Error(res.message || "Error");
                return res;
            } else {
                const raw = await FetchTestCase2AllChartData({ body: buildRequestBody(dimensions, 'all'), crossChartFilter: crossChartFilter, productId: testCase2ProductId, excludeNullRevenue: false }).unwrap();
                const transformed = transformTestCase2ToCommonFormat(raw);
                if (!transformed?.success) throw new Error(transformed.message || "Error");
                return transformed;
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
    }, [dimensions, crossChartFilter, testCase, fetchAllChartData, FetchTestCase2AllChartData]);

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
        setCrossChartFilter('');
    }, []);

    // Context Menu handlers
    const handleContextMenuClose = useCallback(() => {
        setContextMenu(null);
    }, []);
    const handleContextMenuFilter = useCallback(() => {
        if (contextMenu) {
            setCrossChartFilter(contextMenu.category);
            setContextMenu(null);
        }
    }, [contextMenu]);
    const handleContextMenuDrillDown = useCallback(() => {
        if (contextMenu) {
            handleDrillDown(contextMenu.chartType, contextMenu.category, contextMenu.value, contextMenu.dataType);
            setContextMenu(null);
        }
    }, [contextMenu]);

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

            <ChartContextMenu
                isOpen={contextMenu?.isOpen || false}
                position={contextMenu?.position || { x: 0, y: 0 }}
                onClose={handleContextMenuClose}
                onFilter={handleContextMenuFilter}
                onDrillDown={handleContextMenuDrillDown}
                category={contextMenu?.category || ''}
                value={contextMenu?.value || ''}
            />

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
                    isCrossChartFiltered={crossChartFilter}
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
                    isCrossChartFiltered={crossChartFilter}
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
                    isCrossChartFiltered={crossChartFilter}
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
                    isCrossChartFiltered={crossChartFilter}
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