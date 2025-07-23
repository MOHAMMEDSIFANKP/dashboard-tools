'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
import { ActionButton, DashboardActionButtonComponent } from '@/components/ui/action-button';
import { ErrorAlert, LoadingAlert } from '@/components/ui/status-alerts';
import { ChartSkelten } from '@/components/ui/ChartSkelten';
import HighchartsDrilldown from 'highcharts/modules/drilldown';
import { buildRequestBody, handleCrossChartFilteringFunc } from '@/lib/services/buildWhereClause';


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
        tooltip: { valueDecimals: 2 },
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
        title: { text: 'Revenue vs Expenses by Country' },
        subtitle: { text: 'Showing financial metrics by period' },
        xAxis: { title: { text: 'Period' } },
        yAxis: { title: { text: 'Amount (USD)' } },
        plotOptions: {
            column: {
                dataLabels: { enabled: true, format: '${point.y:,.0f}' },
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
                    format: '<b>{point.name}</b>: ${point.y:,.0f} ({point.percentage:.1f}%)',
                },
                showInLegend: true,
            },
        },
    },
    DONUT: {
        chart: { type: 'pie' as const },
        title: { text: 'Revenue by Category and Country' },
        subtitle: { text: 'Showing financial metrics' },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: {
                    enabled: true,
                    format: '<b>{point.name}</b>: ${point.y:,.0f}',
                },
                innerSize: '50%',
                showInLegend: true,
            },
        },
    },
} as const;

const FinancialDashboard: React.FC = () => {
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState<boolean>(false);
    const [dimensions, setDimensions] = useState<Dimensions | null>(null);
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

    const [fetchAllChartData] = useFetchChartDataMutation();
    const [fetchDrillDownData] = useFetchDrillDownDataMutation();
    const [drillDownData, setDrillDownData] = useState<any[]>([]);

    const handleCrossChartFiltering = (data: string) => {
        // @ts-ignore   
        setDimensions(handleCrossChartFilteringFunc(data));
    };


    // Memoized chart options
    const chartOptions = useMemo(() => {
        const options: Record<ChartType, Highcharts.Options | null> = {
            line: null,
            bar: null,
            pie: null,
            donut: null,
        };

        // Line Chart
        if (chartData.line.length > 0) {
            options.line = {
                ...CHART_CONFIG.COMMON,
                ...CHART_CONFIG.LINE,
                xAxis: {
                    ...CHART_CONFIG.LINE.xAxis,
                    categories: chartData.line?.map((item) => item.fiscalYear),
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
                                const category = point.category;
                                const value = point.y;

                                if (event.originalEvent?.ctrlKey || event.originalEvent?.metaKey) {
                                    handleDrillDown('line', category, value, 'revenue');
                                } else {
                                    handleCrossChartFiltering(category);
                                }
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
                                const category = point.category;
                                const value = point.y;

                                if (event.originalEvent?.ctrlKey || event.originalEvent?.metaKey) {
                                    handleDrillDown('line', category, value, 'grossMargin');
                                } else {
                                    handleCrossChartFiltering(category);
                                }
                            }
                        }

                    },
                    {
                        type: 'line',
                        name: 'Net Profit',
                        data: chartData.line?.map((item) => item.netProfit),

                    },
                ],
                drilldown: {
                    series: [

                    ]
                }
            };
        }

        // Bar Chart
        if (chartData.bar.length > 0) {
            options.bar = {
                ...CHART_CONFIG.COMMON,
                ...CHART_CONFIG.BAR,
                xAxis: {
                    ...CHART_CONFIG.BAR.xAxis,
                    categories: chartData.bar?.map((item) => item.fiscalYear),
                },
                series: [
                    {
                        type: 'column',
                        name: 'Revenue',
                        data: chartData.bar?.map((item) => item.revenue),
                    },
                    {
                        type: 'column',
                        name: 'Expenses',
                        data: chartData.bar?.map((item) => item.expenses),
                    },
                ],
            };
        }

        // Pie Chart
        if (chartData.pie.length > 0) {
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
                    },
                ],
            };
        }

        // Donut Chart
        if (chartData.donut.length > 0) {
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
                    },
                ],
            };
        }

        return options;
    }, [chartData]);

    // Fetch chart data handler
    const fetchChartData = useCallback(async (): Promise<void> => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await fetchAllChartData({
                body: buildRequestBody(dimensions, 'all'),
            }).unwrap();

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
    }, [dimensions, fetchAllChartData]);

    const handleDrillDown = useCallback(async (chartType: string, category: string, value: any, dataType: string) => {
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
                setDrillDownData(result.data);
                // The drill-down will be handled by Highcharts automatically
            } else {
                setError("No data available for this selection");
            }
        } catch (err: any) {
            setError(err?.data?.detail || err.message || "Failed to fetch drill-down data");
            console.error("Error in drill-down:", err);
        } finally {
            setIsLoading(false);
        }
    }, [fetchDrillDownData]);


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
                    options={chartOptions.line}
                    title="Line Charts"
                />
                <ChartContainer
                    options={chartOptions.bar}
                    title="Bar Chart"
                />
                <ChartContainer
                    options={chartOptions.pie}
                    title="Pie Chart"
                />
                <ChartContainer
                    options={chartOptions.donut}
                    title="Donut Chart"
                />
            </div>
        </section>
    );
};

const ChartContainer: React.FC<ChartContainerProps> = ({
    options,
    title,
    isLoading = false
}) => (
    <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-200">
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            {isLoading && (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            )}
        </div>

        {options ? (
            <div className="min-h-[400px]">
                <HighchartsReact
                    highcharts={Highcharts}
                    options={options}
                    immutable={false}
                />
            </div>
        ) : (
            <ChartSkelten />
        )}
    </div>
);

export default FinancialDashboard;