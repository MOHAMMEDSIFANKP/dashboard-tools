'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    ChartComponent,
    SeriesCollectionDirective,
    SeriesDirective,
    Inject,
    LineSeries,
    ColumnSeries,
    Category,
    Legend,
    Tooltip,
    DataLabel,
    Export,
    ChartTheme,
    AccumulationChartComponent,
    AccumulationSeriesCollectionDirective,
    AccumulationSeriesDirective,
    AccumulationLegend,
    AccumulationDataLabel,
    AccumulationTooltip,
    PieSeries,
    AccumulationSelection,
    Highlight,
    Selection
} from '@syncfusion/ej2-react-charts';
import { registerLicense, enableRipple } from '@syncfusion/ej2-base';

import { useFetchChartDataMutation } from '@/lib/services/usersApi';
import { testCase2ProductId, useFetchTestCase2ChartDataMutation } from '@/lib/services/testCase2Api';
import { buildRequestBody } from '@/lib/services/buildWhereClause';
import { RootState } from '@/store/store';
import { useSelector } from 'react-redux';
import { transformTestCase2ToCommonFormat } from '@/lib/testCase2Transformer';
import { BarChartData, Dimensions, DonutChartData, LineChartData, PieChartData } from '@/types/Schemas';
import { ChartContainerView } from '@/components/charts/ChartContainerView';
import { GroupModal } from '@/components/GroupManagement';
import { DashboardActionButtonComponent } from '@/components/ui/action-button';
import { ChartContextMenu } from '@/components/charts/ChartContextMenu';
import { ErrorAlert } from '@/components/ui/status-alerts';
import { useEmailShareDrawer } from '@/hooks/useEmailShareDrawer';
import { EmailShareDrawer } from '@/components/drawer/EmailShareDrawer';
import { formatCurrency, SyncfusionCaptureChartScreenshot } from '@/utils/utils';
import { ComparisonDrawer } from '@/components/drawer/ChartComparisonDrawer';
import { useChartComparisonDrawer } from '@/hooks/useChartComparisonDrawer';

// Register Syncfusion license (uncomment and add your license key)
// @ts-ignore
registerLicense(process.env.NEXT_PUBLIC_SYNCFUSION_LICENSE_KEY);

interface ChartContainerProps {
    children: React.ReactNode;
    title: string;
    isLoading?: boolean;
    isDrilled?: boolean;
    resetDrillDown?: () => void;
    isCrossChartFiltered?: string;
    resetCrossChartFilter?: () => void;
    handleShareChart?: (title: string, chartRef: React.RefObject<ChartComponent | AccumulationChartComponent>) => void;
    onComparisonOpen: (chartType: string) => void;
    chartType?: string;
    chartRef?: React.RefObject<ChartComponent | AccumulationChartComponent | null>;

}

// Chart Theme Configuration
const chartTheme: ChartTheme = 'Material';
enableRipple(true);

const SyncfusionCharts: React.FC = () => {
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState<boolean>(false);
    const [dimensions, setDimensions] = useState<Dimensions | null>(null);
    const [crossChartFilter, setCrossChartFilter] = useState<string>('');

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


    const [contextMenu, setContextMenu] = useState<{
        isOpen: boolean;
        position: { x: number; y: number };
        category: string;
        value: any;
        chartType: string;
        dataType: string;
    } | null>(null);

    // Ref
    const lineChartRef = useRef<ChartComponent | null>(null);
    const barChartRef = useRef<ChartComponent | null>(null);
    const doughnutChartRef = useRef<AccumulationChartComponent | null>(null);
    const pieChartRef = useRef<AccumulationChartComponent | null>(null);

    // API Mutations
    const [fetchAllChartData] = useFetchChartDataMutation();
    const [FetchTestCase2AllChartData] = useFetchTestCase2ChartDataMutation();


    const fetchChartDataByTestCase = async () => {
        try {
            if (testCase === "test-case-1") {
                const res = await fetchAllChartData({
                    body: buildRequestBody(dimensions, 'all'),
                    crossChartFilter: crossChartFilter
                }).unwrap();
                if (!res?.success) throw new Error(res.message || "Error");
                return res;
            } else {
                const raw = await FetchTestCase2AllChartData({
                    body: buildRequestBody(dimensions, 'all'),
                    crossChartFilter: crossChartFilter,
                    productId: testCase2ProductId,
                    excludeNullRevenue: false
                }).unwrap();
                const transformed = transformTestCase2ToCommonFormat(raw);
                if (!transformed?.success) throw new Error(transformed.message || "Error");
                return transformed;
            }
        } catch (error) {
            console.log(error, 'Error fetching chart data');
            throw error;
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

            setChartData({
                line: result?.charts?.line?.data || [],
                bar: result?.charts?.bar?.data || [],
                pie: result?.charts?.pie?.data || [],
                donut: result?.charts?.donut?.data || [],
            });
        } catch (err: any) {
            const errorMessage = err?.data?.detail || err.message || 'Failed to fetch chart data';
            setError(errorMessage);
            console.error('Error fetching chart data:', err);
        } finally {
            setIsLoading(false);
        }
    }, [dimensions, crossChartFilter, testCase]);

    // Fetch data on component mount
    useEffect(() => {
        fetchChartData();
    }, [fetchChartData]);

    const handlePointClick = (args: any, chartType: string, dataType: string) => {
        const point = args.point;
        const category = point.x ? point.x.toString() : point.text;
        const value = point.y;
        const chartContainer = args.series.chart.element;
        const containerRect = chartContainer.getBoundingClientRect();

        const xPos = containerRect.left + args.x;
        const yPos = containerRect.top + args.y;


        setContextMenu({
            isOpen: true,
            position: { x: xPos, y: yPos },
            category: category,
            value: value,
            chartType: chartType,
            dataType: dataType
        });

    };

    // Determine x-axis key based on cross-chart filter
    const xKey = crossChartFilter ? 'period' : 'fiscalYear';

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
            // handleDrillDown(contextMenu.chartType, contextMenu.category, contextMenu.value, contextMenu.dataType);
            setContextMenu(null);
        }
    }, [contextMenu]);
    const handleResetCrossChartFilter = useCallback(() => {
        setCrossChartFilter('');
    }, []);

    const handleShareChart = async (
        title: string,
        chartRef: React.RefObject<ChartComponent | AccumulationChartComponent>
    ) => {
        if (!chartRef.current) return;
        try {
            const imageData = await SyncfusionCaptureChartScreenshot(chartRef);
            handleOpenDrawer(title, imageData);
        } catch (error) {
            console.error('Failed to capture chart:', error);
            setError('Failed to capture chart for sharing');
        }
    };
    return (
        <div className="p-5">
            <h1 className="text-2xl font-bold text-center mb-4">
                Financial Dashboard - Syncfusion Charts
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

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Line Chart */}
                <ChartContainer
                    chartType="line"
                    title="Revenue Trends Over Time"
                    isLoading={isLoading}
                    isCrossChartFiltered={crossChartFilter}
                    resetCrossChartFilter={handleResetCrossChartFilter}
                    handleShareChart={handleShareChart}
                    onComparisonOpen={handleComparisonOpenDrawer}
                    chartRef={lineChartRef}
                >
                    <ChartComponent
                        // id="line-chart"
                        style={{ textAlign: 'center' }}
                        height="400px"
                        theme={chartTheme}
                        ref={lineChartRef}
                        title="Revenue Trends Over Time"
                        subTitle="Showing financial metrix by fiscal Year"
                        primaryXAxis={{
                            valueType: 'Category',
                            title: 'Year',
                            labelRotation: -45,
                            labelStyle: { color: '#666' },
                        }}

                        primaryYAxis={{
                            title: 'Amount (USD)',
                            labelFormat: '${value}',
                            labelStyle: { color: '#666' },
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
                            // header: '<b>${series.name}</b>',
                            // format: '${point.x}: <b>${point.y}</b>'
                        }}
                        tooltipRender={(args) => {
                            const xValue = args.point.x;
                            const yValue = args.point.y;
                            const formattedY = formatCurrency(yValue);
                            args.text = `${xValue}: <b>${formattedY}</b>`;
                        }}

                        legendSettings={{
                            visible: true,
                            position: 'Bottom'
                        }}
                        enableAnimation={true}
                        pointClick={(args: any) => {
                            if (args.point.index === 0) return;
                            handlePointClick(args, 'line', args.series.name.toLowerCase().replace(' ', ''));
                        }}

                    >
                        <Inject services={[LineSeries, Category, Legend, Tooltip, DataLabel, Export, Highlight, Selection]} />
                        <SeriesCollectionDirective>
                            <SeriesDirective
                                dataSource={chartData.line}
                                xName={xKey}
                                yName="revenue"
                                type="Line"
                                name="Revenue"
                                width={3}
                                marker={{
                                    visible: true,
                                    width: 8,
                                    height: 8,
                                    shape: 'Circle',
                                    fill: '#058DC7',
                                    border: { width: 2, color: '#fff' },

                                }}
                                fill="#058DC7"
                            />
                            <SeriesDirective
                                dataSource={chartData.line}
                                xName={xKey}
                                yName="grossMargin"
                                type="Line"
                                name="Gross Margin"
                                width={3}
                                marker={{
                                    visible: true,
                                    width: 8,
                                    height: 8,
                                    shape: 'Diamond',
                                    fill: '#50B432',
                                    border: { width: 2, color: '#fff' }
                                }}
                                fill="#50B432"
                            />
                            <SeriesDirective
                                dataSource={chartData.line}
                                xName={xKey}
                                yName="netProfit"
                                type="Line"
                                name="Net Profit"
                                width={3}
                                marker={{
                                    visible: true,
                                    width: 8,
                                    height: 8,
                                    shape: 'Triangle',
                                    fill: '#ED561B',
                                    border: { width: 2, color: '#fff' }
                                }}
                                fill="#ED561B"
                            />
                        </SeriesCollectionDirective>
                    </ChartComponent>
                </ChartContainer>

                <ChartContainer
                    chartType="bar"
                    title="Revenue vs Expenses"
                    isLoading={isLoading}
                    isCrossChartFiltered={crossChartFilter}
                    handleShareChart={handleShareChart}
                    onComparisonOpen={handleComparisonOpenDrawer}
                    chartRef={barChartRef}
                >
                    <ChartComponent
                        // id="bar-chart"
                        height="400px"
                        style={{ textAlign: 'center' }}
                        ref={barChartRef}
                        theme={chartTheme}
                        title="Revenue vs Expenses"
                        subTitle="Showing financial metrix by fiscal Year"

                        primaryXAxis={{
                            valueType: 'Category',
                            title: 'Period',
                            labelRotation: -45,
                            labelStyle: { color: '#666' }
                        }}
                        primaryYAxis={{
                            title: 'Amount (USD)',
                            labelFormat: '${value}',
                            labelStyle: { color: '#666' }
                        }}
                        axisLabelRender={(args) => {
                            if (args.axis.name === 'primaryYAxis') {
                                args.text = formatCurrency(args.value);
                            }
                        }}
                        
                        tooltip={{
                            enable: true,
                            shared: false,
                            // header: '<b>${series.name}</b>',
                            // format: '${point.x}: <b>${point.y}</b>'
                        }}
                        tooltipRender={(args) => {
                            const xValue = args.point.x;
                            const yValue = args.point.y;
                            const formattedY = formatCurrency(yValue);
                            args.text = `${xValue}: <b>${formattedY}</b>`;
                        }}
                        legendSettings={{
                            visible: true,
                            position: 'Bottom'
                        }}
                        enableAnimation={true}
                    >
                        <Inject services={[ColumnSeries, Category, Legend, Tooltip, DataLabel, Export, Highlight, Selection]} />
                        <SeriesCollectionDirective>
                            <SeriesDirective
                                dataSource={chartData.bar}
                                xName={xKey}
                                yName="revenue"
                                type="Column"
                                name="Revenue"
                                fill="#058DC7"
                                columnSpacing={0.1}
                                columnWidth={0.7}
                                tooltipMappingName='toolTipMappingName'
                                dataLabel={{
                                    visible: false,
                                    position: 'Top',
                                    font: { fontWeight: '600', color: '#ffffff' }
                                }}
                            />
                            <SeriesDirective
                                dataSource={chartData.bar}
                                xName={xKey}
                                yName="expenses"
                                type="Column"
                                name="Expenses"
                                fill="#ED561B"
                                columnSpacing={0.1}
                                columnWidth={0.7}
                                dataLabel={{
                                    visible: false,
                                    position: 'Top',
                                    font: { fontWeight: '600', color: '#ffffff' }
                                }}
                            />
                        </SeriesCollectionDirective>
                    </ChartComponent>
                </ChartContainer>

                {/* Pie Chart */}
                <ChartContainer
                    chartType="pie"
                    title="Financial Distribution"
                    isLoading={isLoading}
                    isCrossChartFiltered={crossChartFilter}
                    handleShareChart={handleShareChart}
                    onComparisonOpen={handleComparisonOpenDrawer}
                    chartRef={pieChartRef}
                >
                    <AccumulationChartComponent
                        // id="pie-chart"
                        height="400px"
                        theme={chartTheme}
                        ref={pieChartRef}
                        title='Financial Distribution'
                        enableSmartLabels={true}
                        enableAnimation={true}
                        center={{ x: '50%', y: '50%' }}
                        enableBorderOnMouseMove={true}
                        tooltip={{
                            enable: true,
                            // format: '${point.x}: <b>${point.y}</b> (${point.percentage}%)'
                        }}
                        tooltipRender={(args) => {
                            const pointName = args.point.x;
                            const yValue = args.point.y;
                            const percentage = args.point.percentage;
                            const formattedY = formatCurrency(yValue);
                            args.text = `${pointName}: <b>${formattedY}</b> (${percentage?.toFixed(1)}%)`;
                        }}
                        legendSettings={{
                            visible: true,
                            position: 'Bottom'
                        }}
                    >
                        <Inject services={[PieSeries, AccumulationLegend, Export, AccumulationDataLabel, AccumulationTooltip, AccumulationSelection]} />
                        <AccumulationSeriesCollectionDirective>

                            <AccumulationSeriesDirective
                                dataSource={chartData.pie}
                                xName="catfinancialview"
                                yName="revenue"
                                type="Pie"
                                radius="80%"
                                startAngle={0}
                                endAngle={360}
                                dataLabel={{
                                    visible: true,
                                    name: 'catfinancialview',
                                    position: 'Outside',
                                    font: { fontWeight: '600' },
                                    connectorStyle: { length: '20px', type: 'Curve' }
                                }}
                                explode={true}
                                explodeOffset="10%"
                                explodeIndex={0}
                                palettes={['#058DC7', '#50B432', '#ED561B', '#DDDF00', '#24CBE5', '#64E572']}
                            />
                        </AccumulationSeriesCollectionDirective>
                    </AccumulationChartComponent>
                </ChartContainer>

                {/* Donut Chart */}
                <ChartContainer
                    chartType="donut"
                    title="Revenue by Category"
                    isLoading={isLoading}
                    isCrossChartFiltered={crossChartFilter}
                    handleShareChart={handleShareChart}
                    onComparisonOpen={handleComparisonOpenDrawer}
                    chartRef={doughnutChartRef}
                >
                    <AccumulationChartComponent
                        // id="donut-chart"
                        height="400px"
                        theme={chartTheme}
                        ref={doughnutChartRef}
                        title='Revenue by Category'
                        enableSmartLabels={true}
                        enableAnimation={true}
                        center={{ x: '50%', y: '50%' }}
                        enableBorderOnMouseMove={true}
                        tooltip={{
                            enable: true,
                            // format: '${point.x}: <b>${point.y}</b> (${point.percentage}%)'
                        }}
                        tooltipRender={(args) => {
                            const pointName = args.point.x;
                            const yValue = args.point.y;
                            const percentage = args.point.percentage;
                            const formattedY = formatCurrency(yValue);
                            args.text = `${pointName}: <b>${formattedY}</b> (${percentage?.toFixed(1)}%)`;
                        }}
                        legendSettings={{
                            visible: true,
                            position: 'Bottom'
                        }}
                    >
                        <Inject services={[PieSeries, AccumulationLegend, Export, AccumulationDataLabel, AccumulationTooltip, AccumulationSelection]} />
                        <AccumulationSeriesCollectionDirective>
                            <AccumulationSeriesDirective
                                dataSource={chartData.donut}
                                xName="cataccountingview"
                                yName="revenue"
                                type="Pie"
                                innerRadius="40%"
                                radius="80%"
                                startAngle={0}
                                endAngle={360}
                                dataLabel={{
                                    visible: true,
                                    name: 'cataccountingview',
                                    position: 'Outside',
                                    font: { fontWeight: '600' },
                                    connectorStyle: { length: '20px', type: 'Curve' }
                                }}
                                explode={false}
                                palettes={['#FF9655', '#FFF263', '#6AF9C4', '#058DC7', '#50B432', '#ED561B']}
                            />
                        </AccumulationSeriesCollectionDirective>
                    </AccumulationChartComponent>
                </ChartContainer>
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
                chartLibrary='syncfusion'
                testCase={testCase}
            />}
        </div>
    );
};

const ChartContainer: React.FC<ChartContainerProps> = ({
    children,
    title,
    isLoading = false,
    isDrilled = false,
    resetDrillDown,
    isCrossChartFiltered,
    resetCrossChartFilter,
    handleShareChart,
    onComparisonOpen,
    chartType = '',
    chartRef
}) => {
    const handleExportPNG = useCallback(() => {
        if (chartRef?.current) {
            chartRef.current.exportModule.export('PNG', title || 'export');
        }
    }, [chartRef]);

    const handleExportCSV = useCallback(() => {
        if (chartRef?.current) {
            chartRef.current.exportModule.export('CSV', title || 'export');
        }
    }, [chartRef]);

    return (
        <ChartContainerView
            title={title}
            isDrilled={isDrilled}
            resetDrillDown={resetDrillDown}
            isLoading={isLoading}
            isCrossChartFiltered={isCrossChartFiltered}
            resetCrossChartFilter={resetCrossChartFilter}
            hasData={true}
            //@ts-ignore
            onShareChart={() => handleShareChart(title, chartRef)}
            onComparisonOpen={() => onComparisonOpen(chartType || '')}
            exportToPNG={handleExportPNG}
            exportToCSV={handleExportCSV}
        >
            {children}
        </ChartContainerView>
    )
};


export default SyncfusionCharts;