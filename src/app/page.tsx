'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import {
    Banknote,
    TrendingUp,
    TrendingDown,
    Percent,
    DollarSign,
    Receipt,
    ArrowLeft,
    ArrowRight,
    BarChart3,
    Activity,
    CheckCircle,
    Target,
    AlertCircle,
    RefreshCw,
} from "lucide-react";
import { DonutChartData, LineChartData } from '@/types/Schemas';
import { AgCharts } from 'ag-charts-react';
import { AgChartOptions } from "ag-charts-community";
import { ColDef } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import {
    databaseName,
    useFetchChartDataMutation,
    useFetchSearchableDataQuery
} from '@/lib/services/usersApi';
import { buildRequestBody } from '@/lib/services/buildWhereClause';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Types
interface CardSchema {
    title: string;
    bgGradient: string;
    iconBg: string;
    icon: React.ReactNode;
    value: string;
    change: string;
    isPositive?: boolean;
}

interface PerformanceMetric {
    title: string;
    value: string;
    target: string;
    status: 'success' | 'warning' | 'error';
    icon: React.ReactNode;
}

interface KPIData {
    totalRevenue: number;
    netProfit: number;
    operatingProfit: number;
    operatingExpenses: number;
    profitMargin: number;
    lossPeriods: number;
}

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

// Constants
const SLIDES_COUNT = 3;
const DEFAULT_PAGINATION_LIMIT = 10;

// Utility functions
const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
        return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
        return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(2)}`;
};

const formatPercentage = (value: number): string => `${value.toFixed(1)}%`;

// Custom hooks
const useKPICalculations = (data: FinancialData[] | undefined): KPIData => {
    return useMemo(() => {
        if (!data || data.length === 0) {
            return {
                totalRevenue: 0,
                netProfit: 0,
                operatingProfit: 0,
                operatingExpenses: 0,
                profitMargin: 0,
                lossPeriods: 0
            };
        }

        const totals = data.reduce((acc, item) => ({
            revenue: acc.revenue + (Number(item.revenue) || 0),
            netProfit: acc.netProfit + (Number(item.netprofit) || 0),
            operatingProfit: acc.operatingProfit + (Number(item.operatingprofit) || 0),
            operatingExpenses: acc.operatingExpenses + (Number(item.operatingexpenses) || 0),
        }), {
            revenue: 0,
            netProfit: 0,
            operatingProfit: 0,
            operatingExpenses: 0
        });

        const profitMargin = totals.revenue > 0 ? (totals.netProfit / totals.revenue) * 100 : 0;
        const lossPeriods = data.filter(item => Number(item.netprofit) < 0).length;

        return {
            totalRevenue: totals.revenue,
            netProfit: totals.netProfit,
            operatingProfit: totals.operatingProfit,
            operatingExpenses: totals.operatingExpenses,
            profitMargin,
            lossPeriods
        };
    }, [data]);
};

// Components
const DashboardCard: React.FC<{ item: CardSchema }> = React.memo(({ item }) => (
    <Card className={`p-6 bg-gradient-to-br ${item.bgGradient} border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group`}>
        <div className='flex items-start justify-between mb-4'>
            <div className={`${item.iconBg} p-3 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300`}>
                {item.icon}
            </div>
            <div className='text-right'>
                <div className='text-2xl font-bold text-gray-800 mb-1 group-hover:text-gray-900 transition-colors'>
                    {item.value}
                </div>
                <div className={`text-sm font-medium flex items-center gap-1 ${item.isPositive !== false ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                    {item.isPositive !== false ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {item.change}
                </div>
            </div>
        </div>
        <div>
            <h3 className='text-sm font-semibold text-gray-600 uppercase tracking-wide'>
                {item.title}
            </h3>
        </div>
    </Card>
));

DashboardCard.displayName = 'DashboardCard';

const LoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin h-8 w-8 text-blue-500" />
        <span className="ml-2 text-gray-600">Loading...</span>
    </div>
);

const ErrorMessage: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
    <div className="flex items-center justify-center h-64 bg-red-50 rounded-lg">
        <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-700 font-medium mb-2">Error loading data</p>
            <p className="text-red-600 text-sm mb-4">{message}</p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                    Retry
                </button>
            )}
        </div>
    </div>
);

const SlideNavigation: React.FC<{
    currentSlide: number;
    totalSlides: number;
    onSlideChange: (slide: number) => void;
    onPrevious: () => void;
    onNext: () => void;
}> = ({ currentSlide, totalSlides, onSlideChange, onPrevious, onNext }) => (
    <div className='flex items-center gap-3'>
        <div className='flex gap-2'>
            {Array.from({ length: totalSlides }).map((_, index) => (
                <button
                    key={index}
                    onClick={() => onSlideChange(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${currentSlide === index ? 'bg-blue-500 w-6' : 'bg-gray-300 hover:bg-gray-400'
                        }`}
                    aria-label={`Go to slide ${index + 1}`}
                />
            ))}
        </div>
        <div className='flex items-center gap-1 bg-gray-50 rounded-lg p-1'>
            <button
                onClick={onPrevious}
                disabled={currentSlide === 0}
                className={`p-2 rounded-md transition-all duration-200 ${currentSlide === 0
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-white hover:shadow-sm hover:text-blue-500'
                    }`}
                aria-label="Previous slide"
            >
                <ArrowLeft size={16} />
            </button>
            <button
                onClick={onNext}
                disabled={currentSlide === totalSlides - 1}
                className={`p-2 rounded-md transition-all duration-200 ${currentSlide === totalSlides - 1
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-white hover:shadow-sm hover:text-blue-500'
                    }`}
                aria-label="Next slide"
            >
                <ArrowRight size={16} />
            </button>
        </div>
    </div>
);

// Main Dashboard Component
export default function Dashboard() {
    // State management
    const [searchParams, setSearchParams] = useState({
        tableName: databaseName,
        column_filters: {},
        limit: DEFAULT_PAGINATION_LIMIT,
        offset: 0,
    });

    const [chartOptions, setChartOptions] = useState<{
        line: AgChartOptions;
        donut: AgChartOptions;
    }>({
        line: {},
        donut: {},
    });

    const [currentSlide, setCurrentSlide] = useState(0);
    const [chartError, setChartError] = useState<string | null>(null);

    // API hooks
    const {
        data,
        error,
        isLoading,
        refetch
    } = useFetchSearchableDataQuery(searchParams);

    const [fetchAllChartData, { isLoading: isChartLoading }] = useFetchChartDataMutation();

    // Calculate KPIs
    const kpis = useKPICalculations(data?.data);

    // Chart data fetching
    const fetchChartDataHandler = useCallback(async () => {
        try {
            setChartError(null);
            const result = await fetchAllChartData({
                body: buildRequestBody({
                    "groupName": "test",
                    "filteredSelections": [
                        {
                            "dimension": "fiscalyear",
                            "members": ['2025']
                        }
                    ]
                }, 'all')
            }).unwrap();

            if (!result || !result.success) {
                throw new Error(result?.message || "Failed to fetch chart data");
            }

            // Process line chart data
            const lineData: LineChartData[] = result?.charts?.line?.success ? result?.charts?.line?.data || [] : [];
            const lineOpts: AgChartOptions = lineData.length ? {
                title: { text: "Revenue Trends Over Time" },
                subtitle: { text: "Showing financial metrics by period" },
                data: lineData,
                series: [
                    {
                        type: "line",
                        xKey: "period",
                        yKey: "revenue",
                        yName: "Revenue",
                        tooltip: { enabled: true },
                    },
                    {
                        type: "line",
                        xKey: "period",
                        yKey: "grossMargin",
                        yName: "Gross Margin",
                        tooltip: { enabled: true },
                    },
                    {
                        type: "line",
                        xKey: "period",
                        yKey: "netProfit",
                        yName: "Net Profit",
                        tooltip: { enabled: true },
                    },
                ],
                axes: [
                    { type: "category", label: { rotation: -50 }, position: "bottom", title: { text: "Period" } },
                    { type: "number", position: "left", title: { text: "Amount ($)" }, label: { formatter: (params: any) => formatCurrency(params.value) } },
                ],
                legend: { enabled: true, position: "bottom" },

            } : {};
            // Process donut chart data
            const donutData: DonutChartData[] = result?.charts?.donut?.success ? result?.charts?.donut?.data || [] : [];
            // @ts-ignore
            const donutOpts: AgChartOptions = donutData.length ? {
                title: { text: "Revenue by Category" },
                data: donutData,
                series: [{
                    type: "donut",
                    angleKey: "revenue",
                    labelKey: "cataccountingview",
                    tooltip: {
                        enabled: true,
                        renderer: (params) => ({
                            // @ts-ignore
                            content: `${params.labelKey}: ${formatCurrency(params.angleValue)}`
                        })
                    },
                    calloutLabel: { enabled: true },
                    sectorLabelKey: 'cataccountingview',
                }],
            } : {};

            setChartOptions({
                line: lineOpts,
                donut: donutOpts,
            });
        } catch (error) {
            console.error('Chart data fetch error:', error);
            setChartError(error instanceof Error ? error.message : 'Failed to load chart data');
        }
    }, [fetchAllChartData]);

    // Effects
    useEffect(() => {
        fetchChartDataHandler();
    }, [fetchChartDataHandler]);

    // Navigation handlers
    const handlePrevSlide = useCallback(() => {
        setCurrentSlide(prev => Math.max(0, prev - 1));
    }, []);

    const handleNextSlide = useCallback(() => {
        setCurrentSlide(prev => Math.min(SLIDES_COUNT - 1, prev + 1));
    }, []);

    const handleSlideChange = useCallback((slide: number) => {
        setCurrentSlide(slide);
    }, []);

    // Grid configuration
    const columnDefs: ColDef[] = useMemo(() => [
        {
            field: 'fiscalyear',
            headerName: 'Fiscal Year',
            sortable: true,
            filter: 'agNumberColumnFilter',
            floatingFilter: true,
            width: 120,
        },
        {
            field: 'period',
            headerName: 'Period',
            sortable: true,
            filter: 'agTextColumnFilter',
            floatingFilter: true,
            width: 120,
        },
        {
            field: 'cataccountingview',
            headerName: 'Accounting Category',
            sortable: true,
            filter: 'agTextColumnFilter',
            floatingFilter: true,
            width: 180,
        },
        {
            field: 'catfinancialview',
            headerName: 'Financial Category',
            sortable: true,
            filter: 'agTextColumnFilter',
            floatingFilter: true,
            width: 160,
        },
        {
            field: 'revenue',
            headerName: 'Revenue',
            sortable: true,
            filter: 'agNumberColumnFilter',
            floatingFilter: true,
            valueFormatter: (params) => formatCurrency(params.value),
            width: 120,
        },
        {
            field: 'otherincome',
            headerName: 'Other Income',
            sortable: true,
            filter: 'agNumberColumnFilter',
            floatingFilter: true,
            valueFormatter: (params) => formatCurrency(params.value),
            width: 140,
        },
        {
            field: 'grossmargin',
            headerName: 'Gross Margin',
            sortable: true,
            filter: 'agNumberColumnFilter',
            floatingFilter: true,
            valueFormatter: (params) => formatCurrency(params.value),
            width: 140,
        },
        {
            field: 'operatingexpenses',
            headerName: 'Operating Expenses',
            sortable: true,
            filter: 'agNumberColumnFilter',
            floatingFilter: true,
            valueFormatter: (params) => formatCurrency(params.value),
            width: 170,
        },
        {
            field: 'operatingprofit',
            headerName: 'Operating Profit',
            sortable: true,
            filter: 'agNumberColumnFilter',
            floatingFilter: true,
            valueFormatter: (params) => formatCurrency(params.value),
            width: 150,
        },
        {
            field: 'netprofit',
            headerName: 'Net Profit',
            sortable: true,
            filter: 'agNumberColumnFilter',
            floatingFilter: true,
            valueFormatter: (params) => formatCurrency(params.value),
            cellStyle: (params) => ({
                color: params.value >= 0 ? '#059669' : '#DC2626',
                fontWeight: 'bold'
            }),
            width: 130,
        },
        {
            field: 'country',
            headerName: 'Country',
            sortable: true,
            filter: 'agTextColumnFilter',
            floatingFilter: true,
            width: 120,
        },
        {
            field: 'continent',
            headerName: 'Continent',
            sortable: true,
            filter: 'agTextColumnFilter',
            floatingFilter: true,
            width: 120,
        },
    ], []);

    const defaultColDef = useMemo(() => ({
        resizable: true,
        sortable: true,
        filter: true,
        minWidth: 100,
        flex: 1,
    }), []);

    // KPI Cards configuration
    const cardsList: CardSchema[] = useMemo(() => [
        {
            title: "Total Revenue",
            bgGradient: "from-emerald-50 to-emerald-100",
            iconBg: "bg-emerald-500",
            icon: <Banknote size={24} className='text-white' />,
            value: formatCurrency(kpis.totalRevenue),
            change: "+12.5%",
            isPositive: true,
        },
        {
            title: "Net Profit",
            bgGradient: "from-blue-50 to-blue-100",
            iconBg: "bg-blue-500",
            icon: <DollarSign size={24} className='text-white' />,
            value: formatCurrency(kpis.netProfit),
            change: "+8.2%",
            isPositive: kpis.netProfit >= 0,
        },
        {
            title: "Operating Profit",
            bgGradient: "from-violet-50 to-violet-100",
            iconBg: "bg-violet-500",
            icon: <TrendingUp size={24} className='text-white' />,
            value: formatCurrency(kpis.operatingProfit),
            change: "+15.3%",
            isPositive: kpis.operatingProfit >= 0,
        },
        {
            title: "Operating Expenses",
            bgGradient: "from-amber-50 to-amber-100",
            iconBg: "bg-amber-500",
            icon: <Receipt size={24} className='text-white' />,
            value: formatCurrency(kpis.operatingExpenses),
            change: "+5.1%",
            isPositive: false,
        },
        {
            title: "Profit Margin",
            bgGradient: "from-teal-50 to-teal-100",
            iconBg: "bg-teal-500",
            icon: <Percent size={24} className='text-white' />,
            value: formatPercentage(kpis.profitMargin),
            change: "+2.8%",
            isPositive: kpis.profitMargin >= 0,
        },
        {
            title: "Loss Periods",
            bgGradient: "from-rose-50 to-rose-100",
            iconBg: "bg-rose-500",
            icon: <TrendingDown size={24} className='text-white' />,
            value: `${kpis.lossPeriods} Records`,
            change: "-1 Month",
            isPositive: false,
        },
    ], [kpis]);

    // Performance metrics
    const performanceMetrics: PerformanceMetric[] = useMemo(() => [
        {
            title: "YTD Performance",
            value: "94.2%",
            target: "Target: 90%",
            status: "success",
            icon: <Target size={20} />
        },
        {
            title: "Monthly Growth",
            value: "+12.8%",
            target: "vs Last Month",
            status: "success",
            icon: <TrendingUp size={20} />
        },
        {
            title: "Efficiency Ratio",
            value: "87.3%",
            target: "Target: 85%",
            status: "success",
            icon: <Activity size={20} />
        },
        {
            title: "Risk Level",
            value: "Low",
            target: "Stable Trend",
            status: "success",
            icon: <CheckCircle size={20} />
        }
    ], []);

    if (error) {
        return (
            <main className='dashboard min-h-screen bg-gradient-to-br from-gray-50 to-white'>
                <div className='container mx-auto px-4 py-8 max-w-[90%]'>
                    <ErrorMessage
                        //@ts-ignore
                        message={error?.message || 'Failed to load dashboard data'}
                        onRetry={() => refetch()}
                    />
                </div>
            </main>
        );
    }

    return (
        <main className='dashboard min-h-screen bg-gradient-to-br from-gray-50 to-white'>
            <div className='container mx-auto px-4 py-8 max-w-[90%]'>
                {/* Header */}
                <header className='mb-8'>
                    <h1 className='text-3xl font-bold text-gray-900 mb-2'>
                        Financial Dashboard
                    </h1>
                    <p className='text-gray-600'>
                        Comprehensive overview of your financial performance
                    </p>
                </header>

                {/* KPI Cards */}
                <section className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8'>
                    {cardsList.map((item) => (
                        <DashboardCard item={item} key={item.title} />
                    ))}
                </section>

                {/* Charts Section */}
                <section className='grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8'>
                    <div className='xl:col-span-2'>
                        <div className='relative bg-white rounded-2xl shadow-xl overflow-hidden'>
                            {/* Navigation Header */}
                            <div className='flex items-center justify-between p-4 border-b border-gray-100'>
                                <div className='flex items-center gap-2'>
                                    <BarChart3 size={20} className='text-blue-500' />
                                    <h3 className='font-semibold text-gray-800'>Analytics Overview</h3>
                                </div>
                                <SlideNavigation
                                    currentSlide={currentSlide}
                                    totalSlides={SLIDES_COUNT}
                                    onSlideChange={handleSlideChange}
                                    onPrevious={handlePrevSlide}
                                    onNext={handleNextSlide}
                                />
                            </div>

                            <div className='h-[450px] p-6'>
                                {isChartLoading ? (
                                    <LoadingSpinner />
                                ) : chartError ? (
                                    <ErrorMessage
                                        message={chartError}
                                        onRetry={fetchChartDataHandler}
                                    />
                                ) : (
                                    <div
                                        className='flex transition-transform duration-500 ease-in-out h-full'
                                        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                                    >
                                        {/* Revenue Trends Chart */}
                                        <div className='w-full flex-shrink-0'>
                                            <AgCharts
                                                className='w-full h-full'
                                                options={chartOptions.line}
                                            />
                                        </div>

                                        {/* Financial Distribution */}
                                        <div className='w-full flex-shrink-0'>
                                            <AgCharts
                                                className='w-full h-full'
                                                options={chartOptions.donut}
                                            />
                                        </div>

                                        {/* Performance Metrics */}
                                        <div className='w-full flex-shrink-0 p-4'>
                                            <div className='mb-6'>
                                                <h4 className='text-lg font-semibold text-gray-800'>Key Metrics</h4>
                                                <p className='text-sm text-gray-600'>Current period highlights</p>
                                            </div>
                                            <div className='grid grid-cols-2 gap-4'>
                                                {performanceMetrics.map((metric, index) => (
                                                    <div
                                                        key={index}
                                                        className='bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors'
                                                    >
                                                        <div className='flex items-center gap-2 mb-2'>
                                                            <div className={`text-${metric.status === 'success' ? 'green' :
                                                                metric.status === 'warning' ? 'yellow' : 'red'
                                                                }-500`}>
                                                                {metric.icon}
                                                            </div>
                                                            <span className='text-sm font-medium text-gray-600'>
                                                                {metric.title}
                                                            </span>
                                                        </div>
                                                        <div className='text-xl font-bold text-gray-800 mb-1'>
                                                            {metric.value}
                                                        </div>
                                                        <div className='text-xs text-gray-500'>
                                                            {metric.target}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar - Performance Metrics */}
                    <div className='bg-white rounded-2xl shadow-xl p-6'>
                        <div className='flex items-center gap-2 mb-6'>
                            <Activity size={20} className='text-purple-500' />
                            <h3 className='font-semibold text-gray-800'>Performance Metrics</h3>
                        </div>
                        <div className='space-y-4'>
                            {performanceMetrics.map((metric, index) => (
                                <div
                                    key={index}
                                    className='flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors'
                                >
                                    <div className='flex items-center gap-3'>
                                        <div className={`text-${metric.status === 'success' ? 'green' :
                                            metric.status === 'warning' ? 'yellow' : 'red'
                                            }-500`}>
                                            {metric.icon}
                                        </div>
                                        <div>
                                            <div className='font-medium text-gray-800'>{metric.value}</div>
                                            <div className='text-xs text-gray-500'>{metric.title}</div>
                                        </div>
                                    </div>
                                    <div className='text-xs text-gray-400 text-right'>
                                        {metric.target}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Data Grid */}
                <section className='bg-white rounded-2xl shadow-xl overflow-hidden'>
                    <div className='p-4 border-b border-gray-100'>
                        <h3 className='font-semibold text-gray-800'>Financial Data</h3>
                        <p className='text-sm text-gray-600'>Detailed financial records</p>
                    </div>
                    <div className="ag-theme-alpine" style={{ height: 550, width: '100%' }}>
                        {isLoading ? (
                            <LoadingSpinner />
                        ) : (
                            <AgGridReact
                                rowData={data?.data}
                                columnDefs={columnDefs}
                                defaultColDef={defaultColDef}
                                pagination={false}
                                paginationPageSize={20}
                                rowSelection="multiple"
                                animateRows={true}
                                suppressRowClickSelection={true}
                                enableCellTextSelection={true}
                            // onGridReady={(params) => {
                            //     params.api.sizeColumnsToFit();
                            // }}
                            />
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}