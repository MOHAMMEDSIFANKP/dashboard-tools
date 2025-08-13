// 'use client';

// import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
// import { AgCharts } from 'ag-charts-enterprise';
// import { AgChartOptions } from 'ag-charts-enterprise';

// import { BarChartData, Dimensions, DonutChartData, LineChartData, PieChartData } from '@/types/Schemas';
// import { GroupModal } from '@/components/GroupManagement';
// import {
//     useFetchChartDataMutation,
//     useFetchDrillDownDataMutation,
//     databaseName
// } from '@/lib/services/usersApi';
// import { DashboardActionButtonComponent } from '@/components/ui/action-button';
// import { ErrorAlert, LoadingAlert } from '@/components/ui/status-alerts';
// import { buildRequestBody } from '@/lib/services/buildWhereClause';
// import { ChartContextMenu } from '@/components/charts/ChartContextMenu';
// import { ChartContainerView } from '@/components/charts/ChartContainerView';
// import { testCase2ProductId, useFetchTestCase2ChartDataMutation, useFetchTestCase2DrillDownDataMutation } from '@/lib/services/testCase2Api';
// import { RootState } from '@/store/store';
// import { useSelector } from 'react-redux';
// import { transformTestCase2DrillDownData, transformTestCase2ToCommonFormat } from '@/lib/testCase2Transformer';
// import { useEmailShareDrawer } from '@/hooks/useEmailShareDrawer';
// import { EmailShareDrawer } from '@/components/drawer/EmailShareDrawer';
// import { formatCurrency } from '@/utils/utils';
// import { ComparisonDrawer } from '@/components/drawer/ChartComparisonDrawer';
// import { useChartComparisonDrawer } from '@/hooks/useChartComparisonDrawer';

// // Initialize AG Charts Enterprise
// if (typeof window !== 'undefined') {
//     // AG Charts Enterprise initialization would go here
//     // AgCharts.setLicenseKey('your-license-key'); // Add your enterprise license key
// }

// interface ChartContainerProps {
//     options: AgChartOptions | null;
//     title: string;
//     isLoading?: boolean;
//     isDrilled?: boolean;
//     resetDrillDown?: () => void;
//     isCrossChartFiltered?: string;
//     resetCrossChartFilter?: () => void;
//     handleShareChart: (title: string, chartRef: React.RefObject<HTMLDivElement>) => void;
//     onComparisonOpen: (chartType: string) => void;
//     chartType: string;
//     chartRef: React.RefObject<HTMLDivElement>;
// }

// // Chart configuration constants
// type ChartType = 'line' | 'bar' | 'pie' | 'donut';

// // AG Charts Enterprise configuration constants
// const CHART_CONFIG = {
//     COMMON: {
//         background: {
//             fill: 'white',
//         },
//         padding: {
//             top: 20,
//             right: 20,
//             bottom: 20,
//             left: 20,
//         },
//         legend: {
//             position: 'bottom',
//             spacing: 40,
//         },
//         toolbar: {
//             enabled: true,
//         },
//         contextMenu: {
//             enabled: true,
//         },
//         animation: {
//             enabled: true,
//             duration: 1000,
//         },
//     },
//     LINE: {
//         title: {
//             text: 'Revenue Trends Over Time',
//             fontSize: 18,
//             fontWeight: 'bold',
//         },
//         subtitle: {
//             text: 'Showing financial metrics by period',
//             fontSize: 14,
//         },
//         axes: [
//             {
//                 type: 'category',
//                 position: 'bottom',
//                 title: {
//                     text: 'Period',
//                     fontSize: 14,
//                 },
//                 line: {
//                     color: '#e0e0e0',
//                 },
//                 tick: {
//                     color: '#e0e0e0',
//                 },
//             },
//             {
//                 type: 'number',
//                 position: 'left',
//                 title: {
//                     text: 'Amount (USD)',
//                     fontSize: 14,
//                 },
//                 label: {
//                     formatter: ({ value }: any) => formatCurrency(value),
//                 },
//                 line: {
//                     color: '#e0e0e0',
//                 },
//                 tick: {
//                     color: '#e0e0e0',
//                 },
//             },
//         ],
//     },
//     BAR: {
//         title: {
//             text: 'Revenue vs Expenses',
//             fontSize: 18,
//             fontWeight: 'bold',
//         },
//         subtitle: {
//             text: 'Showing financial metrics by period',
//             fontSize: 14,
//         },
//         axes: [
//             {
//                 type: 'category',
//                 position: 'bottom',
//                 title: {
//                     text: 'Period',
//                     fontSize: 14,
//                 },
//                 line: {
//                     color: '#e0e0e0',
//                 },
//                 tick: {
//                     color: '#e0e0e0',
//                 },
//             },
//             {
//                 type: 'number',
//                 position: 'left',
//                 title: {
//                     text: 'Amount (USD)',
//                     fontSize: 14,
//                 },
//                 label: {
//                     formatter: ({ value }: any) => formatCurrency(value),
//                 },
//                 line: {
//                     color: '#e0e0e0',
//                 },
//                 tick: {
//                     color: '#e0e0e0',
//                 },
//             },
//         ],
//     },
//     PIE: {
//         title: {
//             text: 'Financial Distribution',
//             fontSize: 18,
//             fontWeight: 'bold',
//         },
//         subtitle: {
//             text: 'Showing financial metrics',
//             fontSize: 14,
//         },
//     },
//     DONUT: {
//         title: {
//             text: 'Revenue by Category',
//             fontSize: 18,
//             fontWeight: 'bold',
//         },
//         subtitle: {
//             text: 'Showing financial metrics',
//             fontSize: 14,
//         },
//     },
// } as const;

// const AGChartsEnterprise: React.FC = () => {
//     const [error, setError] = useState<string | null>(null);
//     const [isLoading, setIsLoading] = useState<boolean>(false);
//     const [isGroupModalOpen, setIsGroupModalOpen] = useState<boolean>(false);
//     const [dimensions, setDimensions] = useState<Dimensions | null>(null);
//     const [crossChartFilter, setCrossChartFilter] = useState<string>('');
//     const [drillDownState, setDrillDownState] = useState<{
//         type: ChartType | null;
//         data: any[];
//         title: string;
//     }>({
//         type: null,
//         data: [],
//         title: ''
//     });

//     const [chartData, setChartData] = useState<{
//         line: LineChartData[];
//         bar: BarChartData[];
//         pie: PieChartData[];
//         donut: DonutChartData[];
//     }>({
//         line: [],
//         bar: [],
//         pie: [],
//         donut: [],
//     });

//     const { emailDrawer, handleOpenDrawer, handleCloseDrawer } = useEmailShareDrawer();
//     const { comparisonDrawer, handleComparisonOpenDrawer, handleComparisonCloseDrawer } = useChartComparisonDrawer();

//     const testCase = useSelector((state: RootState) => state.dashboard.selectedTestCase);

//     // Test Case 1 API Mutations
//     const [fetchAllChartData] = useFetchChartDataMutation();
//     const [fetchDrillDownData] = useFetchDrillDownDataMutation();

//     // Test Case 2 API Mutations
//     const [FetchTestCase2AllChartData] = useFetchTestCase2ChartDataMutation();
//     const [fetchTestCase2DrillDownData] = useFetchTestCase2DrillDownDataMutation();

//     const [contextMenu, setContextMenu] = useState<{
//         isOpen: boolean;
//         position: { x: number; y: number };
//         category: string;
//         value: any;
//         chartType: string;
//         dataType: string;
//     } | null>(null);

//     // Chart refs for AG Charts
//     const lineChartRef = useRef<AgCharts | null>(null);
//     const barChartRef = useRef<AgCharts | null>(null);
//     const pieChartRef = useRef<AgCharts | null>(null);
//     const donutChartRef = useRef<AgCharts | null>(null);

//     // Handle drill down using API
//     const handleDrillDown = useCallback(async (chartType: string, category: string, value: any, dataType: string) => {
//         setIsLoading(true);
//         setError(null);

//         try {
//             const result: any = testCase === "test-case-1"
//                 ? await fetchDrillDownData({
//                     table_name: databaseName,
//                     chart_type: chartType,
//                     category: category,
//                     data_type: dataType,
//                     value: value
//                 }).unwrap()
//                 : transformTestCase2DrillDownData(await fetchTestCase2DrillDownData({
//                     productId: testCase2ProductId,
//                     chartType: chartType,
//                     category: category,
//                     dataType: dataType,
//                     value: value
//                 }).unwrap());

//             if (result.success && result.data && result.data.length > 0) {
//                 setDrillDownState({
//                     type: chartType as ChartType,
//                     data: result.data,
//                     title: result.title || `${dataType} Breakdown for ${category}`
//                 });
//             } else {
//                 setError("No data available for this selection");
//             }
//         } catch (err: any) {
//             setError(err?.data?.detail || err.message || "Failed to fetch drill-down data");
//             console.error("Error in drill-down:", err);
//         } finally {
//             setIsLoading(false);
//         }
//     }, [fetchDrillDownData, fetchTestCase2DrillDownData, testCase]);

//     const createDrillDownOptions = useCallback((type: ChartType, data: any[], title: string): AgChartOptions | null => {
//         if (!data.length) return null;

//         const columns = Object.keys(data[0]);
//         const categoryKey = columns.find(key => key.includes('period') || key.includes('category')) || columns[0];
//         const valueKey = columns.find(key => key.includes('value') || key.includes('amount')) || columns[1];

//         const baseConfig = {
//             ...CHART_CONFIG.COMMON,
//             title: {
//                 text: title,
//                 fontSize: 18,
//                 fontWeight: 'bold',
//             },
//             subtitle: {
//                 text: 'Drill-down data',
//                 fontSize: 14,
//             },
//             data: data,
//         };

//         switch (type) {
//             case 'line':
//                 return {
//                     ...baseConfig,
//                     ...CHART_CONFIG.LINE,
//                     series: [{
//                         type: 'line',
//                         xKey: categoryKey,
//                         yKey: valueKey,
//                         yName: valueKey,
//                         stroke: '#058DC7',
//                         strokeWidth: 3,
//                         marker: {
//                             enabled: true,
//                             fill: '#058DC7',
//                             stroke: '#058DC7',
//                             strokeWidth: 2,
//                             size: 6,
//                         },
//                         tooltip: {
//                             renderer: ({ datum, xKey, yKey }: any) => ({
//                                 content: `${xKey}: ${datum[xKey]}<br/>${yKey}: ${formatCurrency(datum[yKey])}`
//                             }),
//                         },
//                     }],
//                 };

//             case 'bar':
//                 return {
//                     ...baseConfig,
//                     ...CHART_CONFIG.BAR,
//                     series: [{
//                         type: 'bar',
//                         direction: 'vertical',
//                         xKey: categoryKey,
//                         yKey: valueKey,
//                         yName: valueKey,
//                         fill: '#50B432',
//                         stroke: '#50B432',
//                         strokeWidth: 1,
//                         tooltip: {
//                             renderer: ({ datum, xKey, yKey }: any) => ({
//                                 content: `${xKey}: ${datum[xKey]}<br/>${yKey}: ${formatCurrency(datum[yKey])}`
//                             }),
//                         },
//                         label: {
//                             enabled: true,
//                             formatter: ({ value }: any) => formatCurrency(value),
//                         },
//                     }],
//                 };

//             case 'pie':
//             case 'donut':
//                 return {
//                     ...baseConfig,
//                     ...CHART_CONFIG.PIE,
//                     series: [{
//                         type: 'pie',
//                         angleKey: valueKey,
//                         categoryKey: categoryKey,
//                         innerRadiusRatio: type === 'donut' ? 0.5 : 0,
//                         fills: ['#058DC7', '#50B432', '#ED561B', '#DDDF00', '#24CBE5', '#64E572'],
//                         strokes: ['#058DC7', '#50B432', '#ED561B', '#DDDF00', '#24CBE5', '#64E572'],
//                         strokeWidth: 2,
//                         tooltip: {
//                             renderer: ({ datum, angleKey, categoryKey }: any) => ({
//                                 content: `${datum[categoryKey]}: ${formatCurrency(datum[angleKey])}`
//                             }),
//                         },
//                         label: {
//                             enabled: true,
//                             formatter: ({ datum, angleKey, categoryKey }: any) => 
//                                 `${datum[categoryKey]}: ${formatCurrency(datum[angleKey])}`,
//                         },
//                     }],
//                 };

//             default:
//                 return {
//                     ...baseConfig,
//                     series: [{
//                         type: 'line',
//                         xKey: categoryKey,
//                         yKey: valueKey,
//                         yName: valueKey,
//                         stroke: '#058DC7',
//                         strokeWidth: 3,
//                     }],
//                 };
//         }
//     }, []);

//     // Memoized chart options
//     const chartOptions = useMemo(() => {
//         const options: Record<ChartType, AgChartOptions | null> = {
//             line: null,
//             bar: null,
//             pie: null,
//             donut: null,
//         };

//         if (drillDownState.type && drillDownState.data.length > 0) {
//             const drillDownOption = createDrillDownOptions(drillDownState.type, drillDownState.data, drillDownState.title);
//             options[drillDownState.type] = drillDownOption;
//         }

//         // Determine x-axis key based on cross-chart filter
//         const xKey = crossChartFilter ? 'period' : 'fiscalYear';

//         // Line Chart
//         if (chartData.line.length > 0 && drillDownState.type !== 'line') {
//             options.line = {
//                 ...CHART_CONFIG.COMMON,
//                 ...CHART_CONFIG.LINE,
//                 data: chartData.line,
//                 series: [
//                     {
//                         type: 'line',
//                         xKey: xKey,
//                         yKey: 'revenue',
//                         yName: 'Revenue',
//                         stroke: '#058DC7',
//                         strokeWidth: 3,
//                         marker: {
//                             enabled: true,
//                             fill: '#058DC7',
//                             stroke: '#058DC7',
//                             strokeWidth: 2,
//                             size: 6,
//                         },
//                         tooltip: {
//                             renderer: ({ datum, yKey }: any) => ({
//                                 content: `Revenue: ${formatCurrency(datum[yKey])}<br/>Period: ${datum[xKey]}`
//                             }),
//                         },
//                         listeners: {
//                             nodeClick: (event: any) => {
//                                 const { datum } = event;
//                                 const category = crossChartFilter ? datum[xKey]?.slice(0, 4) : datum[xKey];
//                                 setContextMenu({
//                                     isOpen: true,
//                                     position: { x: event.event.pageX, y: event.event.pageY },
//                                     category: category,
//                                     value: datum.revenue,
//                                     chartType: 'line',
//                                     dataType: 'revenue'
//                                 });
//                             }
//                         }
//                     },
//                     {
//                         type: 'line',
//                         xKey: xKey,
//                         yKey: 'grossMargin',
//                         yName: 'Gross Margin',
//                         stroke: '#50B432',
//                         strokeWidth: 3,
//                         marker: {
//                             enabled: true,
//                             fill: '#50B432',
//                             stroke: '#50B432',
//                             strokeWidth: 2,
//                             size: 6,
//                         },
//                         tooltip: {
//                             renderer: ({ datum, yKey }: any) => ({
//                                 content: `Gross Margin: ${formatCurrency(datum[yKey])}<br/>Period: ${datum[xKey]}`
//                             }),
//                         },
//                         listeners: {
//                             nodeClick: (event: any) => {
//                                 const { datum } = event;
//                                 const category = crossChartFilter ? datum[xKey]?.slice(0, 4) : datum[xKey];
//                                 setContextMenu({
//                                     isOpen: true,
//                                     position: { x: event.event.pageX, y: event.event.pageY },
//                                     category: category,
//                                     value: datum.grossMargin,
//                                     chartType: 'line',
//                                     dataType: 'grossMargin'
//                                 });
//                             }
//                         }
//                     },
//                     {
//                         type: 'line',
//                         xKey: xKey,
//                         yKey: 'netProfit',
//                         yName: 'Net Profit',
//                         stroke: '#ED561B',
//                         strokeWidth: 3,
//                         marker: {
//                             enabled: true,
//                             fill: '#ED561B',
//                             stroke: '#ED561B',
//                             strokeWidth: 2,
//                             size: 6,
//                         },
//                         tooltip: {
//                             renderer: ({ datum, yKey }: any) => ({
//                                 content: `Net Profit: ${formatCurrency(datum[yKey])}<br/>Period: ${datum[xKey]}`
//                             }),
//                         },
//                         listeners: {
//                             nodeClick: (event: any) => {
//                                 const { datum } = event;
//                                 const category = crossChartFilter ? datum[xKey]?.slice(0, 4) : datum[xKey];
//                                 setContextMenu({
//                                     isOpen: true,
//                                     position: { x: event.event.pageX, y: event.event.pageY },
//                                     category: category,
//                                     value: datum.netProfit,
//                                     chartType: 'line',
//                                     dataType: 'netProfit'
//                                 });
//                             }
//                         }
//                     },
//                 ],
//             };
//         }

//         // Bar Chart
//         if (chartData.bar.length > 0 && drillDownState.type !== 'bar') {
//             options.bar = {
//                 ...CHART_CONFIG.COMMON,
//                 ...CHART_CONFIG.BAR,
//                 data: chartData.bar,
//                 series: [
//                     {
//                         type: 'bar',
//                         direction: 'vertical',
//                         xKey: xKey,
//                         yKey: 'revenue',
//                         yName: 'Revenue',
//                         fill: '#058DC7',
//                         stroke: '#058DC7',
//                         strokeWidth: 1,
//                         tooltip: {
//                             renderer: ({ datum, yKey }: any) => ({
//                                 content: `Revenue: ${formatCurrency(datum[yKey])}<br/>Period: ${datum[xKey]}`
//                             }),
//                         },
//                         label: {
//                             enabled: true,
//                             formatter: ({ value }: any) => formatCurrency(value),
//                         },
//                         listeners: {
//                             nodeClick: (event: any) => {
//                                 const { datum } = event;
//                                 const category = crossChartFilter ? datum[xKey]?.slice(0, 4) : datum[xKey];
//                                 handleDrillDown('bar', category, datum.revenue, 'revenue');
//                             }
//                         }
//                     },
//                     {
//                         type: 'bar',
//                         direction: 'vertical',
//                         xKey: xKey,
//                         yKey: 'expenses',
//                         yName: 'Expenses',
//                         fill: '#ED561B',
//                         stroke: '#ED561B',
//                         strokeWidth: 1,
//                         tooltip: {
//                             renderer: ({ datum, yKey }: any) => ({
//                                 content: `Expenses: ${formatCurrency(datum[yKey])}<br/>Period: ${datum[xKey]}`
//                             }),
//                         },
//                         label: {
//                             enabled: true,
//                             formatter: ({ value }: any) => formatCurrency(value),
//                         },
//                         listeners: {
//                             nodeClick: (event: any) => {
//                                 const { datum } = event;
//                                 const category = crossChartFilter ? datum[xKey]?.slice(0, 4) : datum[xKey];
//                                 handleDrillDown('bar', category, datum.expenses, 'expenses');
//                             }
//                         }
//                     },
//                 ],
//             };
//         }

//         // Pie Chart
//         if (chartData.pie.length > 0 && drillDownState.type !== 'pie') {
//             options.pie = {
//                 ...CHART_CONFIG.COMMON,
//                 ...CHART_CONFIG.PIE,
//                 data: chartData.pie,
//                 series: [{
//                     type: 'pie',
//                     angleKey: 'revenue',
//                     categoryKey: 'catfinancialview',
//                     fills: ['#058DC7', '#50B432', '#ED561B', '#DDDF00', '#24CBE5', '#64E572'],
//                     strokes: ['#058DC7', '#50B432', '#ED561B', '#DDDF00', '#24CBE5', '#64E572'],
//                     strokeWidth: 2,
//                     tooltip: {
//                         renderer: ({ datum, angleKey, categoryKey }: any) => ({
//                             content: `${datum[categoryKey]}: ${formatCurrency(datum[angleKey])}`
//                         }),
//                     },
//                     label: {
//                         enabled: true,
//                         formatter: ({ datum, angleKey, categoryKey }: any) => 
//                             `${datum[categoryKey]}: ${formatCurrency(datum[angleKey])}`,
//                     },
//                     listeners: {
//                         nodeClick: (event: any) => {
//                             const { datum } = event;
//                             handleDrillDown('pie', datum.catfinancialview, datum.revenue, 'revenue');
//                         }
//                     }
//                 }],
//             };
//         }

//         // Donut Chart
//         if (chartData.donut.length > 0 && drillDownState.type !== 'donut') {
//             options.donut = {
//                 ...CHART_CONFIG.COMMON,
//                 ...CHART_CONFIG.DONUT,
//                 data: chartData.donut,
//                 series: [{
//                     type: 'pie',
//                     angleKey: 'revenue',
//                     categoryKey: 'cataccountingview',
//                     innerRadiusRatio: 0.5,
//                     fills: ['#DDDF00', '#24CBE5', '#64E572', '#FF9655', '#FFF263', '#6AF9C4'],
//                     strokes: ['#DDDF00', '#24CBE5', '#64E572', '#FF9655', '#FFF263', '#6AF9C4'],
//                     strokeWidth: 2,
//                     tooltip: {
//                         renderer: ({ datum, angleKey, categoryKey }: any) => ({
//                             content: `${datum[categoryKey]}: ${formatCurrency(datum[angleKey])}`
//                         }),
//                     },
//                     label: {
//                         enabled: true,
//                         formatter: ({ datum, angleKey, categoryKey }: any) => 
//                             `${datum[categoryKey]}: ${formatCurrency(datum[angleKey])}`,
//                     },
//                     listeners: {
//                         nodeClick: (event: any) => {
//                             const { datum } = event;
//                             handleDrillDown('donut', datum.cataccountingview, datum.revenue, 'revenue');
//                         }
//                     }
//                 }],
//             };
//         }

//         return options;
//     }, [chartData, crossChartFilter, drillDownState, createDrillDownOptions, handleDrillDown]);

//     const fetchChartDataByTestCase = async () => {
//         try {
//             if (testCase === "test-case-1") {
//                 const res = await fetchAllChartData({ body: buildRequestBody(dimensions, 'all'), crossChartFilter: crossChartFilter }).unwrap();
//                 if (!res?.success) throw new Error(res.message || "Error");
//                 return res;
//             } else {
//                 const raw = await FetchTestCase2AllChartData({ body: buildRequestBody(dimensions, 'all'), crossChartFilter: crossChartFilter, productId: testCase2ProductId, excludeNullRevenue: false }).unwrap();
//                 const transformed = transformTestCase2ToCommonFormat(raw);
//                 if (!transformed?.success) throw new Error(transformed.message || "Error");
//                 return transformed;
//             }
//         } catch (error) {
//             console.log(error, 'Error fetching chart data');
//         }
//     };

//     // Fetch chart data handler
//     const fetchChartData = useCallback(async (): Promise<void> => {
//         setIsLoading(true);
//         setError(null);

//         try {
//             const result: any = await fetchChartDataByTestCase();

//             if (!result?.success) {
//                 throw new Error(result?.message || 'Failed to fetch chart data');
//             }

//             const { charts } = result;

//             setChartData({
//                 line: charts?.line?.success ? charts.line.data || [] : [],
//                 bar: charts?.bar?.success ? charts.bar.data || [] : [],
//                 pie: charts?.pie?.success ? charts.pie.data || [] : [],
//                 donut: charts?.donut?.success ? charts.donut.data || [] : [],
//             });

//         } catch (err: any) {
//             const errorMessage = err?.data?.detail || err.message || 'Failed to fetch chart data';
//             setError(errorMessage);
//         } finally {
//             setIsLoading(false);
//         }
//     }, [dimensions, crossChartFilter, testCase, fetchAllChartData, FetchTestCase2AllChartData]);

//     // Fetch data when dimensions change
//     useEffect(() => {
//         fetchChartData();
//     }, [fetchChartData]);

//     // Event handlers
//     const handleCreateGroup = useCallback((data: Dimensions): void => {
//         setDimensions(data);
//     }, []);

//     const handleResetGroup = useCallback((): void => {
//         setDimensions(null);
//     }, []);

//     const handleCloseModal = useCallback((): void => {
//         setIsGroupModalOpen(false);
//     }, []);

//     const handleOpenModal = useCallback((): void => {
//         setIsGroupModalOpen(true);
//     }, []);

//     const handleDismissError = useCallback((): void => {
//         setError(null);
//     }, []);

//     const handleResetDrillDown = useCallback(() => {
//         setDrillDownState({
//             type: null,
//             data: [],
//             title: ''
//         });
//     }, []);

//     const handleResetCrossChartFilter = useCallback(() => {
//         setCrossChartFilter('');
//     }, []);

//     // Context Menu handlers
//     const handleContextMenuClose = useCallback(() => {
//         setContextMenu(null);
//     }, []);

//     const handleContextMenuFilter = useCallback(() => {
//         if (contextMenu) {
//             setCrossChartFilter(contextMenu.category);
//             setContextMenu(null);
//         }
//     }, [contextMenu]);

//     const handleContextMenuDrillDown = useCallback(() => {
//         if (contextMenu) {
//             handleDrillDown(contextMenu.chartType, contextMenu.category, contextMenu.value, contextMenu.dataType);
//             setContextMenu(null);
//         }
//     }, [contextMenu, handleDrillDown]);

//     // Share email handler
//     const handleShareChart = async (
//         title: string,
//         chartRef: React.RefObject<HTMLDivElement>
//     ) => {
//         if (!chartRef.current) return;
//         try {
//             // AG Charts Enterprise screenshot functionality
//             const chart = chartRef.current.querySelector('canvas');
//             if (chart) {
//                 const imageData = chart.toDataURL('image/png');
//                 handleOpenDrawer(title, imageData);
//             }
//         } catch (error) {
//             console.error('Failed to capture chart:', error);
//             setError('Failed to capture chart for sharing');
//         }
//     };

//     return (
//         <section className="p-5">
//             <h1 className="md:text-2xl font-bold text-center mb-4">
//                 Financial Dashboard - AG Charts Enterprise
//             </h1>

//             <GroupModal
//                 isOpen={isGroupModalOpen}
//                 onClose={handleCloseModal}
//                 // @ts-ignore
//                 onCreateGroup={handleCreateGroup}
//             />

//             <div className="flex flex-col mb-4">
//                 {dimensions?.groupName && (
//                     <p className="text-sm text-gray-500 mb-2">
//                         Current Group Name:{' '}
//                         <span className="capitalize font-bold">{dimensions.groupName}</span>
//                     </p>
//                 )}

//                 <DashboardActionButtonComponent
//                     isLoading={isLoading}
//                     handleResetGroup={handleResetGroup}
//                     handleOpenModal={handleOpenModal}
//                     fetchAllChartDataHandle={fetchChartData}
//                 />
//             </div>

//             <ChartContextMenu
//                 isOpen={contextMenu?.isOpen || false}
//                 position={contextMenu?.position || { x: 0, y: 0 }}
//                 onClose={handleContextMenuClose}
//                 onFilter={handleContextMenuFilter}
//                 onDrillDown={handleContextMenuDrillDown}
//                 category={contextMenu?.category || ''}
//                 value={contextMenu?.value || ''}
//             />

//             {error && (<ErrorAlert message={error} onDismiss={handleDismissError} />)}

//             {isLoading && <LoadingAlert />}

//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
//                 <AGChartContainer
//                     chartType="line"
//                     options={chartOptions.line}
//                     title="Revenue Trends"
//                     isLoading={isLoading}
//                     isDrilled={drillDownState.type === 'line'}
//                     resetDrillDown={handleResetDrillDown}
//                     isCrossChartFiltered={crossChartFilter}
//                     resetCrossChartFilter={handleResetCrossChartFilter}
//                     handleShareChart={handleShareChart}
//                     onComparisonOpen={handleComparisonOpenDrawer}
//                 chartRef={lineChartRef}
//             />
//             <AGChartContainer
//                 chartType="bar"
//                 options={chartOptions.bar}
//                 title="Revenue vs Expenses"
//                 isLoading={isLoading}
//                 isDrilled={drillDownState.type === 'bar'}
//                 resetDrillDown={handleResetDrillDown}
//                 isCrossChartFiltered={crossChartFilter}
//                 resetCrossChartFilter={handleResetCrossChartFilter}
//                 handleShareChart={handleShareChart}
//                 onComparisonOpen={handleComparisonOpenDrawer}
//                 chartRef={barChartRef}
//             />
//             <AGChartContainer
//                 chartType="pie"
//                 options={chartOptions.pie}
//                 title="Financial Distribution"
//                 isLoading={isLoading}
//                 isDrilled={drillDownState.type === 'pie'}
//                 resetDrillDown={handleResetDrillDown}
//                 isCrossChartFiltered={crossChartFilter}
//                 resetCrossChartFilter={handleResetCrossChartFilter}
//                 handleShareChart={handleShareChart}
//                 onComparisonOpen={handleComparisonOpenDrawer}
//                 chartRef={pieChartRef}
//             />
//             <AGChartContainer
//                 chartType="donut"
//                 options={chartOptions.donut}
//                 title="Revenue by Category"
//                 isLoading={isLoading}
//                 isDrilled={drillDownState.type === 'donut'}
//                 resetDrillDown={handleResetDrillDown}
//                 isCrossChartFiltered={crossChartFilter}
//                 resetCrossChartFilter={handleResetCrossChartFilter}
//                 handleShareChart={handleShareChart}
//                 onComparisonOpen={handleComparisonOpenDrawer}
//                 chartRef={donutChartRef}
//             />
//         </div>
//         <EmailShareDrawer
//             isOpen={emailDrawer.isOpen}
//             onClose={handleCloseDrawer}
//             chartTitle={emailDrawer.chartTitle}
//             chartImage={emailDrawer.chartImage}
//         />
//         {comparisonDrawer.isOpen && <ComparisonDrawer
//             isOpen={comparisonDrawer.isOpen}
//             onClose={handleComparisonCloseDrawer}
//             chartType={comparisonDrawer.chartType}
//             chartLibrary='ag-charts'
//             testCase={testCase}
//         />}
//     </section>
// );
// };

// const AGChartContainer: React.FC<ChartContainerProps> = ({
//     options,
//     title,
//     isLoading = false,
//     isDrilled = false,
//     resetDrillDown,
//     isCrossChartFiltered,
//     resetCrossChartFilter,
//     handleShareChart,
//     onComparisonOpen,
//     chartType,
//     chartRef
// }) => {
//     const containerRef = useRef<HTMLDivElement>(null);
    
//     useEffect(() => {
//         if (!options || !containerRef.current) return;
        
//         const chart = AgCharts.create({
//             ...options,
//             container: containerRef.current,
//         });
        
//         return () => {
//             if (chart) {
//                 AgCharts.destroy(chart);
//             }
//         };
//     }, [options]);

//     return (
//         <ChartContainerView
//             title={title}
//             isDrilled={isDrilled}
//             resetDrillDown={resetDrillDown}
//             isLoading={isLoading}
//             isCrossChartFiltered={isCrossChartFiltered}
//             resetCrossChartFilter={resetCrossChartFilter}
//             hasData={!!options}
//             chartRef={chartRef}
//             onShareChart={() => handleShareChart(title, chartRef)}
//             onComparisonOpen={() => onComparisonOpen(chartType || '')}
//         >
//             <div ref={containerRef} className="min-h-[400px] w-full" />
//         </ChartContainerView>
//     );
// };

// export default AGChartsEnterprise;
import React from 'react'

function page() {
  return (
    <div>page</div>
  )
}

export default page
