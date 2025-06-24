'use client';
import React, { useState, useMemo } from 'react';
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
    Layers
} from "lucide-react";

import { AgCharts } from 'ag-charts-react';
import { AgChartOptions } from "ag-charts-community";

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
    measures: ChartAttribute[];
    dimensions: ChartAttribute[];
    groupBy?: string;
    filters: Record<string, string[]>;
}

interface ChartConfigurations {
    line: ChartConfig;
    bar: ChartConfig;
}

interface DraggableAttributeProps {
    attribute: ChartAttribute;
    isUsed: boolean;
}

interface ChartDropZoneProps {
    chartType: ChartType;
    config: ChartConfig;
    onAttributeDrop: (chartType: string, attribute: ChartAttribute, dropZone: 'measures' | 'dimensions') => void;
    onAttributeRemove: (chartType: string, attributeKey: string, attributeType: 'measure' | 'dimension') => void;
    onGroupByChange: (chartType: string, dimensionKey: string | undefined) => void;
    onFilterChange: (chartType: string, dimension: string, values: string[]) => void;
    data: FinancialData[];
}

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

const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
        return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
        return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(2)}`;
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
            className={`flex items-center gap-2 p-3 rounded-lg border-2 border-dashed transition-all duration-200 cursor-move ${isUsed
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
            <span className={`text-xs px-2 py-1 rounded-full ${attribute.type === 'measure' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                }`}>
                {attribute.type}
            </span>
        </div>
    );
};

// Chart Container with Drop Zone
const ChartDropZone: React.FC<ChartDropZoneProps> = ({
    chartType,
    config,
    onAttributeDrop,
    onAttributeRemove,
    onGroupByChange,
    onFilterChange,
    data
}) => {
    const [isDragOverMeasures, setIsDragOverMeasures] = useState<boolean>(false);
    const [isDragOverDimensions, setIsDragOverDimensions] = useState<boolean>(false);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, zone: 'measures' | 'dimensions'): void => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        if (zone === 'measures') {
            setIsDragOverMeasures(true);
        } else {
            setIsDragOverDimensions(true);
        }
    };

    const handleDragLeave = (zone: 'measures' | 'dimensions'): void => {
        if (zone === 'measures') {
            setIsDragOverMeasures(false);
        } else {
            setIsDragOverDimensions(false);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, zone: 'measures' | 'dimensions'): void => {
        e.preventDefault();
        setIsDragOverMeasures(false);
        setIsDragOverDimensions(false);

        try {
            const attributeData: ChartAttribute = JSON.parse(e.dataTransfer.getData('text/plain'));
            onAttributeDrop(chartType.key, attributeData, zone);
        } catch (error) {
            console.error('Error parsing dropped data:', error);
        }
    };

    // Process data based on filters and grouping
    const processedData = useMemo(() => {
        let filteredData = data;

        // Apply filters
        Object.entries(config.filters).forEach(([dimension, values]) => {
            if (values.length > 0) {
                filteredData = filteredData.filter(item =>
                    values.includes((item as any)[dimension]?.toString())
                );
            }
        });

        return filteredData;
    }, [data, config.filters]);

    // Get unique values for dimension filters
    const getDimensionValues = (dimensionKey: string) => {
        return [...new Set(data.map(item => (item as any)[dimensionKey]?.toString()))].filter(Boolean);
    };

    const chartOptions: AgChartOptions = useMemo(() => {
        if (config.measures.length === 0) {
            return {};
        }

        const series = config.measures.map(measure => ({
            type: chartType.key,
            xKey: config.groupBy || 'period',
            yKey: measure.key,
            yName: measure.label,
            stroke: measure.color,
            fill: measure.color,
            tooltip: { enabled: true },
        }));

        return {
            title: { text: `${chartType.label} - Financial Analysis` },
            data: processedData,
            series: series,
            axes: [
                {
                    type: 'category',
                    position: 'bottom',
                    title: { text: config.groupBy ? availableDimensions.find(d => d.key === config.groupBy)?.label || 'Group' : 'Period' },
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
            legend: { enabled: true, position: 'bottom' },
        };
    }, [config, chartType, processedData]);

    return (
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden">
            {/* Chart Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                <div className="flex items-center gap-2">
                    {getIcon(chartType.iconName, 16)}
                    <h3 className="font-semibold text-gray-800">{chartType.label}</h3>
                </div>
            </div>

            {/* Configuration Area */}
            <div className="p-4 bg-gray-50 border-b">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Measures Drop Zone */}
                    <div
                        className={`border-2 border-dashed rounded-lg p-3 transition-all duration-200 ${isDragOverMeasures ? 'border-blue-400 bg-blue-50' : 'border-blue-200 bg-blue-25'
                            }`}
                        onDragOver={(e) => handleDragOver(e, 'measures')}
                        onDragLeave={() => handleDragLeave('measures')}
                        onDrop={(e) => handleDrop(e, 'measures')}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSign size={16} className="text-blue-600" />
                            <span className="font-medium text-blue-800">Measures</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {config.measures.length === 0 ? (
                                <span className="text-sm text-gray-500">Drag measures here</span>
                            ) : (
                                config.measures.map((measure) => (
                                    <div
                                        key={measure.key}
                                        className="flex items-center gap-1 px-2 py-1 bg-white rounded-md border text-xs"
                                    >
                                        <div style={{ color: measure.color }}>
                                            {getIcon(measure.iconName, 12)}
                                        </div>
                                        <span>{measure.label}</span>
                                        <button
                                            onClick={() => onAttributeRemove(chartType.key, measure.key, 'measure')}
                                            className="ml-1 text-gray-400 hover:text-red-500"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Dimensions Drop Zone */}
                    <div
                        className={`border-2 border-dashed rounded-lg p-3 transition-all duration-200 ${isDragOverDimensions ? 'border-purple-400 bg-purple-50' : 'border-purple-200 bg-purple-25'
                            }`}
                        onDragOver={(e) => handleDragOver(e, 'dimensions')}
                        onDragLeave={() => handleDragLeave('dimensions')}
                        onDrop={(e) => handleDrop(e, 'dimensions')}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <Filter size={16} className="text-purple-600" />
                            <span className="font-medium text-purple-800">Dimensions</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {config.dimensions.length === 0 ? (
                                <span className="text-sm text-gray-500">Drag dimensions here</span>
                            ) : (
                                config.dimensions.map((dimension) => (
                                    <div
                                        key={dimension.key}
                                        className="flex items-center gap-1 px-2 py-1 bg-white rounded-md border text-xs"
                                    >
                                        <div style={{ color: dimension.color }}>
                                            {getIcon(dimension.iconName, 12)}
                                        </div>
                                        <span>{dimension.label}</span>
                                        <button
                                            onClick={() => onAttributeRemove(chartType.key, dimension.key, 'dimension')}
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

                {/* Group By and Filters */}
                {config.dimensions.length > 0 && (
                    <div className="mt-4 space-y-3">
                        {/* Group By Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Group By:</label>
                            <select
                                value={config.groupBy || ''}
                                onChange={(e) => onGroupByChange(chartType.key, e.target.value || undefined)}
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                            >
                                <option value="">Select dimension...</option>
                                {config.dimensions.map((dim) => (
                                    <option key={dim.key} value={dim.key}>{dim.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Filters */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {config.dimensions.map((dimension) => (
                                <div key={dimension.key}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Filter by {dimension.label}:
                                    </label>
                                    <select
                                        multiple
                                        value={config.filters[dimension.key] || []}
                                        onChange={(e) => {
                                            const selectedValues = Array.from(e.target.selectedOptions, option => option.value);
                                            onFilterChange(chartType.key, dimension.key, selectedValues);
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm h-20"
                                    >
                                        {getDimensionValues(dimension.key).map((value) => (
                                            <option key={value} value={value}>{value}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Chart Area */}
            <div className="h-96">
                {config.measures.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                            <BarChart3 size={48} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Add measures and dimensions to create a chart</p>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 h-full">
                        <AgCharts
                            className="w-full h-full"
                            options={chartOptions}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

const EnhancedDashboard: React.FC = () => {
    const [chartConfigurations, setChartConfigurations] = useState<ChartConfigurations>({
        line: {
            measures: [],
            dimensions: [],
            filters: {}
        },
        bar: {
            measures: [],
            dimensions: [],
            filters: {}
        }
    });

    const handleAttributeDrop = (chartType: string, attribute: ChartAttribute, dropZone: 'measures' | 'dimensions'): void => {
        if ((dropZone === 'measures' && attribute.type !== 'measure') ||
            (dropZone === 'dimensions' && attribute.type !== 'dimension')) {
            return; // Prevent dropping wrong type
        }

        setChartConfigurations(prev => ({
            ...prev,
            [chartType]: {
                ...prev[chartType as keyof ChartConfigurations],
                [dropZone]: [
                    ...prev[chartType as keyof ChartConfigurations][dropZone].filter(attr => attr.key !== attribute.key),
                    attribute
                ]
            }
        }));
    };

    const handleAttributeRemove = (chartType: string, attributeKey: string, attributeType: 'measure' | 'dimension'): void => {
        const arrayKey = attributeType === 'measure' ? 'measures' : 'dimensions';
        setChartConfigurations(prev => ({
            ...prev,
            [chartType]: {
                ...prev[chartType as keyof ChartConfigurations],
                [arrayKey]: prev[chartType as keyof ChartConfigurations][arrayKey].filter(attr => attr.key !== attributeKey)
            }
        }));
    };

    const handleGroupByChange = (chartType: string, dimensionKey: string | undefined): void => {
        setChartConfigurations(prev => ({
            ...prev,
            [chartType]: {
                ...prev[chartType as keyof ChartConfigurations],
                groupBy: dimensionKey
            }
        }));
    };

    const handleFilterChange = (chartType: string, dimension: string, values: string[]): void => {
        setChartConfigurations(prev => ({
            ...prev,
            [chartType]: {
                ...prev[chartType as keyof ChartConfigurations],
                filters: {
                    ...prev[chartType as keyof ChartConfigurations].filters,
                    [dimension]: values
                }
            }
        }));
    };

    const usedAttributeKeys = useMemo<Set<string>>(() => {
        return new Set([
            ...chartConfigurations.line.measures.map(attr => attr.key),
            ...chartConfigurations.line.dimensions.map(attr => attr.key),
            ...chartConfigurations.bar.measures.map(attr => attr.key),
            ...chartConfigurations.bar.dimensions.map(attr => attr.key)
        ]);
    }, [chartConfigurations]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Advanced Financial Analytics Dashboard
                    </h1>
                    <p className="text-gray-600">
                        Create interactive charts with measures and dimensions
                    </p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white rounded-xl shadow-lg p-6 mb-5">
                    {/* Measures Section */}
                    <div className="mb-6">
                        <h3 className="font-semibold text-blue-800 mb-4 flex items-center gap-2">
                            <DollarSign size={16} />
                            Measures
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            {availableMeasures.map((attribute) => (
                                <DraggableAttribute
                                    key={attribute.key}
                                    attribute={attribute}
                                    isUsed={usedAttributeKeys.has(attribute.key)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Dimensions Section */}
                    <div className="mb-6">
                        <h3 className="font-semibold text-purple-800 mb-4 flex items-center gap-2">
                            <Filter size={16} />
                            Dimensions
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            {availableDimensions.map((attribute) => (
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
                            {/* Measures Section */}
                            {/* <div className="mb-6">
                                <h3 className="font-semibold text-blue-800 mb-4 flex items-center gap-2">
                                    <DollarSign size={16} />
                                    Measures
                                </h3>
                                <div className="space-y-3">
                                    {availableMeasures.map((attribute) => (
                                        <DraggableAttribute
                                            key={attribute.key}
                                            attribute={attribute}
                                            isUsed={usedAttributeKeys.has(attribute.key)}
                                        />
                                    ))}
                                </div>
                            </div> */}

                            {/* Dimensions Section */}
                            {/* <div className="mb-6">
                                <h3 className="font-semibold text-purple-800 mb-4 flex items-center gap-2">
                                    <Filter size={16} />
                                    Dimensions
                                </h3>
                                <div className="space-y-3">
                                    {availableDimensions.map((attribute) => (
                                        <DraggableAttribute
                                            key={attribute.key}
                                            attribute={attribute}
                                            isUsed={usedAttributeKeys.has(attribute.key)}
                                        />
                                    ))}
                                </div>
                            </div> */}

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
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnhancedDashboard;