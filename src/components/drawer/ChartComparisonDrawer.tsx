//src\components\drawer\ChartComparisonDrawer.tsx
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, BarChart3, TrendingUp, PieChart, Activity, Calendar, ArrowRight, Loader2, Sparkles, Target } from "lucide-react";
import { formatCurrency } from "@/utils/utils";
import { CustomSelect } from "../ui/inputs";
import { useFetchAvailableYearsQuery, useFetchComparisonDataMutation } from "@/lib/services/usersApi";

// Ag charts
import { AgCharts } from "ag-charts-react";
import { AgChartOptions } from "ag-charts-community";
// Chart js
import { Chart as ChartJS, registerables } from "chart.js";
import { Line, Bar, Pie, Doughnut } from "react-chartjs-2";
// React Plotly
import Plot from 'react-plotly.js';
// Nivo Charts
import { ResponsiveLine } from '@nivo/line';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import { ChartLibrary } from "@/types/Schemas";
// Victory Chart
import {
    VictoryChart,
    VictoryLine,
    VictoryBar,
    VictoryPie,
    VictoryTheme,
    VictoryAxis,
    VictoryTooltip,
    VictoryLegend,
    VictoryScatter,
    VictoryGroup
} from 'victory';
// Echarts
import ReactECharts from 'echarts-for-react';
import { testCase2ProductId, useFetchTestCase2AvailableYearsQuery, useFetchTestCase2ComparisonDataMutation } from "@/lib/services/testCase2Api";

ChartJS.register(...registerables);

type YearOption = { label: string; value: string };

interface ComparisonDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    chartType?: string;
    chartLibrary: ChartLibrary;
    testCase: string;
}

interface ComparisonData {
    year1Data?: {
        data: any[];
        columns: string[];
        year: string;
    };
    year2Data?: {
        data: any[];
        columns: string[];
        year: string;
    };
    loading: boolean;
    error: string | null;
}

const chartTypes = [
    { key: "line", label: "Line Chart", iconName: "Activity" },
    { key: "bar", label: "Bar Chart", iconName: "BarChart3" },
    { key: "pie", label: "Pie Chart", iconName: "PieChart" },
    { key: "donut", label: "Donut Chart", iconName: "Target" },
];

const getIcon = (iconName: string, size: number = 16) => {
    const iconProps = { size };
    switch (iconName) {
        case "BarChart3":
            return <BarChart3 {...iconProps} />;
        case "TrendingUp":
            return <TrendingUp {...iconProps} />;
        case "PieChart":
            return <PieChart {...iconProps} />;
        case "Activity":
            return <Activity {...iconProps} />;
        case "Target":
            return <Target {...iconProps} />;
        default:
            return <BarChart3 {...iconProps} />;
    }
};

export const ComparisonDrawer: React.FC<ComparisonDrawerProps> = ({
    isOpen,
    onClose,
    title = "Financial Year Comparison",
    chartType = "line",
    chartLibrary = "ag-charts",
    testCase = 'test-case-1'
}) => {
    const [selectedYear1, setSelectedYear1] = useState<number | null>(2021);
    const [selectedYear2, setSelectedYear2] = useState<number | null>(null);
    const [comparisonData, setComparisonData] = useState<ComparisonData>({
        loading: false,
        error: null,
    });


    const {
        data: availableYears = [],
        error: yearsError,
        isLoading: yearsLoading,
    } = testCase === 'test-case-1'
            ? useFetchAvailableYearsQuery('sample_100k')
            : useFetchTestCase2AvailableYearsQuery(testCase2ProductId);

    // const [triggerComparison, { isLoading: isComparing }] = useFetchComparisonDataMutation();
    const [triggerComparisonTC1, { isLoading: isComparingTC1 }] = useFetchComparisonDataMutation();
    const [triggerComparisonTC2, { isLoading: isComparingTC2 }] = useFetchTestCase2ComparisonDataMutation();


    useEffect(() => {
        if (!isOpen) {
            setSelectedYear1(null);
            setSelectedYear2(null);
            setComparisonData({ loading: false, error: null });
        }
    }, [isOpen]);

    const handleCompare = async () => {
        if (!selectedYear1 || !selectedYear2) return;

        setComparisonData({ loading: true, error: null });

        try {
            let result;


            if (testCase === 'test-case-1') {
                result = await triggerComparisonTC1({
                    tableName: 'sample_100k',
                    chartType,
                    year1: selectedYear1,
                    year2: selectedYear2,
                }).unwrap();
            } else {
                result = await triggerComparisonTC2({
                    productId: testCase2ProductId,
                    chartType,
                    year1: selectedYear1,
                    year2: selectedYear2,
                }).unwrap();
            }

            setComparisonData({
                year1Data: {
                    data: result.comparison.data[result.comparison.year1].data,
                    columns: result.comparison.data[result.comparison.year1].columns,
                    year: result.comparison.year1,
                },
                year2Data: {
                    data: result.comparison.data[result.comparison.year2].data,
                    columns: result.comparison.data[result.comparison.year2].columns,
                    year: result.comparison.year2,
                },
                loading: false,
                error: null,
            });
        } catch (error: any) {
            setComparisonData({
                loading: false,
                error: error.message || "Failed to fetch comparison data",
            });
        }
    };


    const isFormValid = selectedYear1 && selectedYear2;
    const hasComparisonData = comparisonData.year1Data && comparisonData.year2Data;

    const chartRenderer = (side: "left" | "right") => {
        if (!comparisonData.year1Data || !comparisonData.year2Data) {
            return <div className="text-center text-gray-500">No data available</div>;
        }

        const data = side === "left" ? comparisonData.year1Data : comparisonData.year2Data;

        switch (chartLibrary) {
            case "ag-charts":
                return (
                    <AGChartsRenderer
                        chartType={chartType}
                        data={data.data}
                        columns={data.columns}
                        year={data.year}
                    />
                );
            case "chart-js":
                return (
                    <ChartJSRenderer
                        chartType={chartType}
                        data={data.data}
                        columns={data.columns}
                        year={data.year}
                    />
                );
            case "plotly":
                return (
                    <PlotlyRenderer
                        chartType={chartType}
                        data={data.data}
                        columns={data.columns}
                        year={data.year}
                    />
                );
            case "nivo":
                return (
                    <NivoRenderer
                        chartType={chartType}
                        data={data.data}
                        columns={data.columns}
                        year={data.year}
                    />
                );
            case "victory":
                return (
                    <VictoryRenderer
                        chartType={chartType}
                        data={data.data}
                        columns={data.columns}
                        year={data.year}
                    />
                );
            case "echarts":
                return (
                    <EChartsRenderer
                        chartType={chartType}
                        data={data.data}
                        columns={data.columns}
                        year={data.year}
                    />
                );
            default:
                return <div className="text-center text-gray-500">Chart library not implemented yet</div>;
        }
    };
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 max-h-[80%] flex flex-col"
                    >
                        {/* Drag Handle */}
                        <div className="flex justify-center pt-3 pb-2">
                            <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500 rounded-xl">
                                    <Calendar size={20} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                                    <p className="text-sm text-gray-500">Compare data across different years</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto">
                            {/* Configuration Section */}
                            <div className="p-6 border-b border-gray-100">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Year 1 Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">First Year</label>
                                        <CustomSelect
                                            options={availableYears?.years}
                                            value={selectedYear1 ? { value: selectedYear1, label: selectedYear1.toString() } : null}
                                            onChange={(option) => setSelectedYear1(option ? Number(option.value) : null)}
                                            placeholder={yearsLoading ? "Loading..." : "Select year"}
                                            isDisabled={yearsLoading}
                                            className="w-full bg-white rounded-xl shadow-sm transition-all hover:shadow-md"
                                        />
                                    </div>

                                    {/* Year 2 Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Second Year</label>
                                        <CustomSelect
                                            options={(availableYears?.years || []).filter(
                                                (year: YearOption) => year.value !== String(selectedYear1)
                                            )}
                                            value={selectedYear2 ? { value: selectedYear2, label: selectedYear2.toString() } : null}
                                            onChange={(option) => setSelectedYear2(option ? Number(option.value) : null)}
                                            placeholder={!selectedYear1 ? "Select first year" : "Select year"}
                                            isDisabled={!selectedYear1 || yearsLoading}
                                            className="w-full bg-white rounded-xl shadow-sm transition-all hover:shadow-md"
                                        />
                                    </div>

                                    {/* Compare Button */}
                                    <div className="flex flex-col justify-end">
                                        <button
                                            onClick={handleCompare}
                                            disabled={!isFormValid || comparisonData.loading}
                                            className="w-full px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold"
                                        >
                                            {comparisonData.loading ? (
                                                <>
                                                    <Loader2 size={16} className="animate-spin" />
                                                    Loading...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles size={16} />
                                                    Compare
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Selected Configuration Summary */}
                                {isFormValid && (
                                    <div className="mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-200">
                                        <div className="flex items-center justify-center gap-6 text-sm">
                                            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-blue-100">
                                                <Calendar size={14} className="text-blue-600" />
                                                <span className="font-semibold">{selectedYear1}</span>
                                            </div>
                                            <ArrowRight size={20} className="text-blue-600" />
                                            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-blue-100">
                                                <Calendar size={14} className="text-blue-600" />
                                                <span className="font-semibold">{selectedYear2}</span>
                                            </div>
                                            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-blue-100">
                                                {getIcon(chartTypes.find((t) => t.key === chartType)?.iconName || "BarChart3", 14)}
                                                <span className="font-semibold">
                                                    {chartTypes.find((t) => t.key === chartType)?.label}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Error Display */}
                            {comparisonData.error && (
                                <div className="p-6 border-b border-gray-100">
                                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                                        <div className="flex items-center gap-3 text-red-800">
                                            <X size={16} />
                                            <span className="font-semibold">Error</span>
                                        </div>
                                        <p className="text-red-700 text-sm mt-2">{comparisonData.error}</p>
                                    </div>
                                </div>
                            )}

                            {/* Comparison Results */}
                            {hasComparisonData && (
                                <div className="p-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* Year 1 */}
                                        <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
                                            <div className="p-5 border-b bg-blue-50">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-blue-500 rounded-xl">
                                                            <Calendar size={16} className="text-white" />
                                                        </div>
                                                        <h4 className="font-bold text-gray-900">
                                                            {comparisonData?.year1Data?.year || ''}
                                                        </h4>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-5">
                                                <div className="h-64 md:h-80">{chartRenderer("left")}</div>
                                            </div>
                                        </div>

                                        {/* Year 2 */}
                                        <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
                                            <div className="p-5 border-b bg-green-50">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-green-500 rounded-xl">
                                                            <Calendar size={16} className="text-white" />
                                                        </div>
                                                        <h4 className="font-bold text-gray-900">
                                                            {comparisonData?.year2Data?.year}
                                                        </h4>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-5">
                                                <div className="h-64 md:h-80">{chartRenderer("right")}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Instructions */}
                            {!hasComparisonData && (
                                <div className="p-12 text-center">
                                    <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-2xl mb-6">
                                        <TrendingUp size={32} className="text-blue-600" />
                                    </div>
                                    <h4 className="text-xl font-bold text-gray-900 mb-3">Ready to Compare</h4>
                                    <p className="text-gray-600 max-w-md mx-auto">
                                        Select two years and a chart type, then click "Compare" to view side-by-side analysis.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-4">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-xl cursor-pointer text-sm hover:bg-gray-200"
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};



interface AGChartsRendererProps {
    chartType: string;
    data: any[];
    columns: string[];
    year: string;
}

export const AGChartsRenderer: React.FC<AGChartsRendererProps> = ({
    chartType,
    data,
    columns,
    year,
}) => {
    const getChartOptions = (): AgChartOptions => {
        const isTimeSeries = chartType === "line" || chartType === "bar";
        const isPieLike = chartType === "pie" || chartType === "donut";
        // const xKey = isTimeSeries ? "period" : columns.find((col) => col !== "revenue");

        if (isTimeSeries) {
            const yKeys = columns.filter((col) => col !== "period");

            return {
                title: { text: `Financial Year ${year} - ${chartType.charAt(0).toUpperCase() + chartType.slice(1)}` },
                data,
                series: yKeys.map((yKey) => ({
                    type: chartType,
                    xKey: "period",
                    yKey,
                    yName: yKey,

                })),
                axes: [
                    {
                        type: "category",
                        position: "bottom",
                        label: { rotation: -45 },
                    },
                    {
                        type: "number",
                        position: "left",
                        label: { formatter: (params) => formatCurrency(params.value) },
                    },
                ],
            };
        }

        if (isPieLike) {
            const angleKey = "revenue";
            const labelKey = columns.find((col) => col !== "revenue");

            return {
                title: { text: `Financial Year ${year} - ${chartType.charAt(0).toUpperCase() + chartType.slice(1)}` },
                data,
                series: [
                    {
                        // @ts-ignore
                        type: chartType,
                        angleKey,
                        labelKey,
                        callout: { strokeWidth: 2 },
                        innerRadius: chartType === "donut" ? "40%" : undefined,
                        tooltip: {
                            renderer: (params: any) => {
                                return `<div class="p-2 bg-white border border-gray-200 rounded shadow">
                  <div class="font-semibold">${params.datum[labelKey!]}</div>
                  <div>Revenue: ${formatCurrency(params.datum[angleKey])}</div>
                </div>`;
                            },
                        },
                    },
                ],
            };
        }

        return { data: [] };
    };

    return (
        <div className="w-full h-full">
            <AgCharts options={getChartOptions()} />
        </div>
    );
};


interface ChartJSRendererProps {
    chartType: string;
    data: any[];
    columns: string[];
    year: string;
}

export const ChartJSRenderer: React.FC<ChartJSRendererProps> = ({
    chartType,
    data,
    columns,
    year,
}) => {
    const isTimeSeries = chartType === "line" || chartType === "bar";
    const isPieLike = chartType === "pie" || chartType === "donut";

    const getChartData = () => {
        if (isTimeSeries) {
            return {
                labels: data.map((item) => item.period),
                datasets: columns
                    .filter((col) => col !== "period")
                    .map((key) => ({
                        label: key,
                        data: data.map((item) => item[key]),
                        // backgroundColor: `rgba(54, 162, 235, 0.6)`,
                        // borderColor: `rgba(54, 162, 235, 1)`,
                        borderWidth: 2,
                    })),
            };
        }

        if (isPieLike) {
            const labelKey = columns.find((col) => col !== "revenue");
            return {
                labels: data.map((item) => item[labelKey!]),
                datasets: [
                    {
                        data: data.map((item) => item.revenue),
                        backgroundColor: [
                            "rgba(255, 99, 132, 0.6)",
                            "rgba(54, 162, 235, 0.6)",
                            "rgba(255, 206, 86, 0.6)",
                            "rgba(75, 192, 192, 0.6)",
                        ],
                        borderColor: [
                            "rgba(255, 99, 132, 1)",
                            "rgba(54, 162, 235, 1)",
                            "rgba(255, 206, 86, 1)",
                            "rgba(75, 192, 192, 1)",
                        ],
                        borderWidth: 1,
                    },
                ],
            };
        }

        return { labels: [], datasets: [] };
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            tooltip: {
                callbacks: {
                    label: (context: any) => {
                        return `${context.dataset.label || ""}: ${formatCurrency(context.raw)}`;
                    },
                },
            },
            legend: {
                position: "bottom" as const,
            },
            title: {
                display: true,
                text: `Financial Year ${year} - ${chartType.charAt(0).toUpperCase() + chartType.slice(1)}`,
            },
        },
        scales: isTimeSeries
            ? {
                y: {
                    ticks: {
                        callback: (value: any) => formatCurrency(value),
                    },
                },
            }
            : undefined,
    };

    return (
        <div className="w-full h-full p-4">
            {chartType === "line" && <Line data={getChartData()} options={options} />}
            {chartType === "bar" && <Bar data={getChartData()} options={options} />}
            {chartType === "pie" && <Pie data={getChartData()} options={options} />}
            {chartType === "donut" && <Doughnut data={getChartData()} options={options} />}
        </div>
    );
};

interface PlotlyRendererProps {
    chartType: string;
    data: any[];
    columns: string[];
    year: string;
}

export const PlotlyRenderer: React.FC<PlotlyRendererProps> = ({
    chartType,
    data,
    columns,
    year,
}) => {
    const isTimeSeries = chartType === 'line' || chartType === 'bar';
    const isPieLike = chartType === 'pie' || chartType === 'donut';

    const getPlotlyData = () => {
        if (isTimeSeries) {
            const yKeys = columns.filter(col => col !== 'period');
            return yKeys.map(key => ({
                type: chartType,
                x: data.map(item => item.period),
                y: data.map(item => item[key]),
                name: key,
                hovertemplate: '<b>%{fullData.name}</b><br>' +
                    'Year: %{x}<br>' +
                    'Amount: $%{y:,.0f}<br>' +
                    '<extra></extra>',

            }));
        }

        if (isPieLike) {
            const labelKey = columns.find(col => col !== 'revenue');
            return [{
                type: 'pie',
                labels: data.map(item => item[labelKey!]),
                values: data.map(item => item.revenue),
                textinfo: 'label+percent',
                insidetextorientation: 'radial',
                hole: chartType === 'donut' ? 0.4 : 0,
                pull: 0.05,
                textposition: 'outside',
                // hovertemplate: `%{label}<br>Revenue: %{value:$,.2f}<extra></extra>`,
                hovertemplate: '<b>%{label}</b><br>' +
                    'Revenue: $%{value:,.0f}<br>' +
                    'Percentage: %{percent}<br>' +
                    '<extra></extra>',
            }];
        }

        return [];
    };

    const layout = {
        title: `Financial Year ${year} - ${chartType.charAt(0).toUpperCase() + chartType.slice(1)}`,
        margin: { t: 40, b: 80, l: 60, r: 40 },
        hovermode: 'closest',
        showlegend: true,
        legend: {
            orientation: 'h',
            y: -0.2,
        },
        selected: {
            marker: {
                size: 14,
                color: '#1D4ED8',
                line: {
                    color: '#1E3A8A',
                    width: 3
                }
            }
        },
        unselected: {
            marker: {
                opacity: 0.7
            }
        },
        ...(isTimeSeries ? {
            xaxis: {
                title: 'Period',
                tickangle: 0,
                tickformat: 'digits'
            },
            yaxis: {
                title: 'Amount',
                // tickformat: '$,.2f',
            },
        } : {}),
    };

    return (
        <div className="w-full h-full p-4">
            <Plot
                data={getPlotlyData()}
                layout={layout}
                config={{
                    displayModeBar: true,
                    responsive: true,
                    displaylogo: false,
                }}
                style={{ width: '100%', height: '100%' }}
                useResizeHandler
            />
        </div>
    );
};


interface NivoRendererProps {
    chartType: string;
    data: any[];
    columns: string[];
    year: string;
}

export const NivoRenderer: React.FC<NivoRendererProps> = ({
    chartType,
    data,
    columns,
    year,
}) => {
    const isTimeSeries = chartType === 'line' || chartType === 'bar';
    const isPieLike = chartType === 'pie' || chartType === 'donut';

    const commonProps = {
        margin: { top: 50, right: 130, bottom: 50, left: 60 },
        // colors: { scheme: 'nivo' },
        animate: true,
        // enableSlices: 'x',
    };

    if (isTimeSeries) {
        const yKeys = columns.filter(col => col !== 'period');
        const chartData = yKeys.map(key => ({
            id: key,
            data: data.map(item => ({
                x: item.period,
                y: item[key],
            })),
        }));

        if (chartType === 'line') {
            return (
                <div className="w-full h-full">
                    <ResponsiveLine
                        data={chartData}
                        {...commonProps}
                        xScale={{ type: 'point' }}
                        yScale={{
                            type: 'linear',
                            min: 'auto',
                            max: 'auto',
                        }}
                        axisBottom={{
                            tickRotation: 0,
                            legend: 'Period',
                            legendOffset: 36,
                            legendPosition: 'middle',
                        }}
                        axisLeft={{
                            legend: 'Amount',
                            legendOffset: -40,
                            legendPosition: 'middle',
                            format: value => formatCurrency(value),
                        }}
                        pointSize={10}
                        pointColor={{ theme: "background" }}
                        pointBorderWidth={2}
                        pointBorderColor={{ from: "serieColor" }}
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
                            },
                        ]}
                    />
                </div>
            );
        } else { // bar chart
            return (
                <div className="w-full h-full">
                    <ResponsiveBar
                        data={data.map(item => ({
                            period: item.period,
                            ...yKeys.reduce((acc, key) => ({ ...acc, [key]: item[key] }), {}),
                        }))}
                        {...commonProps}
                        keys={yKeys}
                        indexBy="period"
                        groupMode="grouped"
                        axisBottom={{
                            tickRotation: 0,
                            legend: 'Period',
                            legendOffset: 36,
                            legendPosition: 'middle',
                        }}
                        axisLeft={{
                            legend: 'Amount',
                            legendOffset: -40,
                            format: value => formatCurrency(value),
                        }}
                        labelSkipWidth={12}
                        labelSkipHeight={12}
                        legends={[
                            {
                                dataFrom: 'keys',
                                anchor: 'bottom-right',
                                direction: 'column',
                                justify: false,
                                translateX: 120,
                                translateY: 0,
                                itemsSpacing: 2,
                                itemWidth: 100,
                                itemHeight: 20,
                                itemDirection: 'left-to-right',
                                itemOpacity: 0.85,
                                symbolSize: 20,
                            },
                        ]}
                        tooltip={({ id, value, color, indexValue }) => (
                            <div
                                style={{
                                    background: 'rgba(0, 0, 0, 0.9)',
                                    color: 'white',
                                    padding: '8px 12px',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
                                }}
                            >
                                <div style={{ backgroundColor: color }} className="p-2 w-2"></div>
                                <strong>{id}</strong>: ${value?.toLocaleString()}
                                <br />
                                <span style={{ opacity: 0.8 }}>Year: {indexValue}</span>
                            </div>
                        )}
                    />
                </div>
            );
        }
    }

    if (isPieLike) {
        const labelKey = columns.find(col => col !== 'revenue');
        const pieData = data.map(item => ({
            id: item[labelKey!],
            label: item[labelKey!],
            value: item.revenue,
        }));

        return (
            <div className="w-full h-full">
                <ResponsivePie
                    data={pieData}
                    margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                    innerRadius={chartType === 'donut' ? 0.5 : 0}
                    padAngle={0.7}
                    cornerRadius={3}
                    activeOuterRadiusOffset={8}
                    borderWidth={1}
                    borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                    arcLinkLabelsSkipAngle={10}
                    arcLinkLabelsTextColor="#333333"
                    arcLinkLabelsThickness={2}
                    arcLinkLabelsColor={{ from: 'color' }}
                    arcLabelsSkipAngle={10}
                    arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                    legends={[
                        {
                            anchor: 'bottom',
                            direction: 'row',
                            justify: false,
                            translateX: 0,
                            translateY: 56,
                            itemsSpacing: 0,
                            itemWidth: 100,
                            itemHeight: 18,
                            itemTextColor: '#999',
                            itemDirection: 'left-to-right',
                            itemOpacity: 1,
                            symbolSize: 18,
                            symbolShape: 'circle',
                        },
                    ]}
                    tooltip={({ datum }) => (
                        <div className="bg-white p-2 border border-gray-200 rounded shadow">
                            <strong>{datum.label}</strong>: {formatCurrency(datum.value)}
                        </div>
                    )}
                />
            </div>
        );
    }

    return <div className="text-center text-gray-500">Unsupported chart type</div>;
};


interface VictoryRendererProps {
    chartType: string;
    data: any[];
    columns: string[];
    year: string;
}

export const VictoryRenderer: React.FC<VictoryRendererProps> = ({
    chartType,
    data,
    columns,
    year,
}) => {
    const isTimeSeries = chartType === 'line' || chartType === 'bar';
    const isPieLike = chartType === 'pie' || chartType === 'donut';

    if (isTimeSeries) {
        // Filter out period and get all measure columns
        const yKeys = columns.filter(col => !['period', 'fiscalYear'].includes(col));

        return (
            <div className="w-full h-full p-4">
                <VictoryChart
                    theme={VictoryTheme.material}
                    domainPadding={20}
                    //   height={400}
                    width={1000}
                    padding={{ top: 50, bottom: 80, left: 60, right: 50 }}
                >
                    <VictoryLegend
                        x={125}
                        y={10}
                        orientation="horizontal"
                        gutter={20}
                        data={yKeys.map(key => ({
                            name: key,
                            symbol: { fill: getColorForKey(key) }
                        }))}
                    />

                    <VictoryAxis
                        tickFormat={(x) => x}
                        style={{ tickLabels: { fontSize: 10, angle: -45 } }}
                    />
                    <VictoryAxis
                        dependentAxis
                        tickFormat={(y) => formatCurrency(y)}
                    />

                    {chartType === 'line' ? (
                        <VictoryGroup>
                            {yKeys.map(key => (
                                <VictoryLine
                                    key={`line-${key}`}
                                    data={data}
                                    x="period"
                                    y={key}
                                    style={{
                                        data: {
                                            stroke: getColorForKey(key),
                                            strokeWidth: 2
                                        }
                                    }}
                                    labels={({ datum }) => `${key}: ${formatCurrency(datum[key])}`}
                                    labelComponent={<VictoryTooltip />}
                                />
                            ))}
                            {yKeys.map(key => (
                                <VictoryScatter
                                    key={`scatter-${key}`}
                                    data={data}
                                    x="period"
                                    y={key}
                                    size={4}
                                    style={{
                                        data: {
                                            fill: getColorForKey(key),
                                            stroke: getColorForKey(key),
                                            strokeWidth: 1
                                        }
                                    }}
                                />
                            ))}
                        </VictoryGroup>
                    ) : (
                        <VictoryGroup offset={15} colorScale="qualitative">
                            {yKeys.map(key => (
                                <VictoryBar
                                    key={`bar-${key}`}
                                    data={data}
                                    x="period"
                                    y={key}
                                    style={{
                                        data: {
                                            fill: getColorForKey(key),
                                            stroke: getColorForKey(key),
                                            strokeWidth: 1
                                        }
                                    }}
                                    labels={({ datum }) => `${key}: ${formatCurrency(datum[key])}`}
                                    labelComponent={<VictoryTooltip />}
                                />
                            ))}
                        </VictoryGroup>
                    )}
                </VictoryChart>
            </div>
        );
    }

    if (isPieLike) {
        const labelKey = columns.find(col => col !== 'revenue');
        const pieData = data.map(item => ({
            x: item[labelKey!],
            y: item.revenue
        }));

        return (
            <div className="w-full h-full p-4">
                <VictoryPie
                    data={pieData}
                    colorScale={['#4bc0c0', '#ff6384', '#36a2eb', '#ffce56', '#9966ff', '#ff9f40']}
                    labels={({ datum }) => `${datum.x}: ${formatCurrency(datum.y)}`}
                    labelComponent={<VictoryTooltip />}
                    innerRadius={chartType === 'donut' ? 50 : 0}
                    height={400}
                    padding={{ top: 50, bottom: 50, left: 50, right: 50 }}
                />
            </div>
        );
    }

    return <div className="text-center text-gray-500">Unsupported chart type</div>;
};

function getColorForKey(key: string): string {
    const colors: Record<string, string> = {
        revenue: '#4bc0c0',
        expenses: '#ff6384',
        grossMargin: '#36a2eb',
        netProfit: '#9966ff'
    };
    return colors[key] || '#ffce56';
}


interface EChartsRendererProps {
    chartType: string;
    data: any[];
    columns: string[];
    year: string;
}

export const EChartsRenderer: React.FC<EChartsRendererProps> = ({
    chartType,
    data,
    columns,
    year,
}) => {
    const isTimeSeries = chartType === 'line' || chartType === 'bar';
    const isPieLike = chartType === 'pie' || chartType === 'donut';

    const getOption = () => {
        if (isTimeSeries) {
            const yKeys = columns.filter(col => col !== 'period');

            return {
                title: {
                    text: `Financial Year ${year} - ${chartType.charAt(0).toUpperCase() + chartType.slice(1)}`,
                    left: 'center'
                },
                tooltip: {
                    trigger: 'axis',
                    formatter: (params: any) => {
                        return params.map((p: any) =>
                            `${p.seriesName}: ${formatCurrency(p.value)}`
                        ).join('<br/>');
                    }
                },
                legend: {
                    data: yKeys,
                    bottom: 0
                },
                xAxis: {
                    type: 'category',
                    data: data.map(item => item.period),
                    axisLabel: {
                        rotate: 45
                    }
                },
                yAxis: {
                    type: 'value',
                    axisLabel: {
                        formatter: (value: number) => formatCurrency(value)
                    }
                },
                series: yKeys.map(key => ({
                    name: key,
                    type: chartType,
                    data: data.map(item => item[key]),
                    itemStyle: {
                        color: getColorForKey(key)
                    }
                }))
            };
        }

        if (isPieLike) {
            const labelKey = columns.find(col => col !== 'revenue');

            return {
                title: {
                    text: `Financial Year ${year} - ${chartType.charAt(0).toUpperCase() + chartType.slice(1)}`,
                    left: 'center'
                },
                tooltip: {
                    trigger: 'item',
                    formatter: '{b}: {c} ({d}%)'
                },
                legend: {
                    orient: 'horizontal',
                    bottom: 0,
                    data: data.map(item => item[labelKey!])
                },
                series: [{
                    type: 'pie',
                    radius: chartType === 'donut' ? ['40%', '70%'] : '70%',
                    data: data.map(item => ({
                        name: item[labelKey!],
                        value: item.revenue
                    })),
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: 'rgba(0, 0, 0, 0.5)'
                        }
                    },
                    itemStyle: {
                        color: (params: any) => getColorForIndex(params.dataIndex)
                    }
                }]
            };
        }

        return {};
    };

    return (
        <div className="w-full h-full">
            <ReactECharts
                option={getOption()}
                style={{ height: '100%', width: '100%' }}
                notMerge={true}
                lazyUpdate={true}
                theme={"theme_name"}
            />
        </div>
    );
};

function getColorForIndex(index: number): string {
    const colors = ['#4bc0c0', '#ff6384', '#36a2eb', '#ffce56', '#9966ff', '#ff9f40'];
    return colors[index % colors.length];
}
