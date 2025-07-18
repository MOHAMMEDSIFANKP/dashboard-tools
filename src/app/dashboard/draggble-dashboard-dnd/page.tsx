'use client';

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
    Layers,
    Smartphone,
    ChevronUp,
    ChevronDown
} from "lucide-react";

// @dnd-kit imports
import {
    DndContext,
    DragOverlay,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
    DragOverEvent,
    Active,
    Over
} from '@dnd-kit/core';
import {
    useDraggable,
    useDroppable
} from '@dnd-kit/core';
import {
    sortableKeyboardCoordinates
} from '@dnd-kit/sortable';

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

interface DroppableZoneProps {
    id: string;
    type: 'measures' | 'dimensions';
    chartType: string;
    config: ChartConfig;
    onAttributeRemove: (chartType: string, attributeKey: string, attributeType: 'measure' | 'dimension') => void;
    isOver: boolean;
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

// DnD Kit Draggable Attribute Component
const DraggableAttribute: React.FC<DraggableAttributeProps> = ({ attribute, isUsed }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        isDragging,
    } = useDraggable({
        id: attribute.key,
        data: {
            attribute,
        },
        disabled: isUsed,
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    const bgColor = attribute.type === 'measure' ? 'bg-blue-50 border-blue-200' : 'bg-purple-50 border-purple-200';
    const hoverColor = attribute.type === 'measure' ? 'hover:bg-blue-100' : 'hover:bg-purple-100';

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`flex items-center gap-2 p-3 rounded-lg border-2 border-dashed transition-all duration-200 ${isUsed
                    ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                    : `${bgColor} ${hoverColor} cursor-grab active:cursor-grabbing`
                } ${isDragging ? 'opacity-50 shadow-lg z-50' : ''}`}
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

// DnD Kit Droppable Zone Component
const DroppableZone: React.FC<DroppableZoneProps> = ({
    id,
    type,
    chartType,
    config,
    onAttributeRemove,
    isOver
}) => {
    const { isOver: isOverDrop, setNodeRef } = useDroppable({
        id,
        data: {
            type,
            chartType,
        },
    });

    const attributes = type === 'measures' ? config.measures : config.dimensions;
    const bgColor = type === 'measures' ? 'border-blue-200 bg-blue-25' : 'border-purple-200 bg-purple-25';
    const overColor = type === 'measures' ? 'border-blue-400 bg-blue-50' : 'border-purple-400 bg-purple-50';

    return (
        <div
            ref={setNodeRef}
            className={`border-2 border-dashed rounded-lg p-3 transition-all duration-200 ${isOverDrop || isOver ? overColor : bgColor
                }`}
        >
            <div className="flex items-center gap-2 mb-2">
                {type === 'measures' ? (
                    <DollarSign size={16} className="text-blue-600" />
                ) : (
                    <Filter size={16} className="text-purple-600" />
                )}
                <span className={`font-medium ${type === 'measures' ? 'text-blue-800' : 'text-purple-800'}`}>
                    {type === 'measures' ? 'Measures' : 'Dimensions'}
                </span>
            </div>
            <div className="flex flex-wrap gap-2">
                {attributes.length === 0 ? (
                    <span className="text-sm text-gray-500">
                        Drag {type} here
                    </span>
                ) : (
                    attributes.map((attribute) => (
                        <div
                            key={attribute.key}
                            className="flex items-center gap-1 px-2 py-1 bg-white rounded-md border text-xs"
                        >
                            <div style={{ color: attribute.color }}>
                                {getIcon(attribute.iconName, 12)}
                            </div>
                            <span>{attribute.label}</span>
                            <button
                                onClick={() => onAttributeRemove(chartType, attribute.key, attribute.type)}
                                className="ml-1 text-gray-400 hover:text-red-500"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))
                )}
            </div>
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
                    <DroppableZone
                        id={`${chartType.key}-measures`}
                        type="measures"
                        chartType={chartType.key}
                        config={config}
                        onAttributeRemove={onAttributeRemove}
                        isOver={false}
                    />

                    {/* Dimensions Drop Zone */}
                    <DroppableZone
                        id={`${chartType.key}-dimensions`}
                        type="dimensions"
                        chartType={chartType.key}
                        config={config}
                        onAttributeRemove={onAttributeRemove}
                        isOver={false}
                    />
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

// Drag Overlay Component
const DragOverlayComponent: React.FC<{ activeId: string | null }> = ({ activeId }) => {
    if (!activeId) return null;

    const attribute = [
        ...availableMeasures,
        ...availableDimensions
    ].find(attr => attr.key === activeId);

    if (!attribute) return null;

    return (
        <div className="flex items-center gap-2 p-3 rounded-lg border-2 border-dashed bg-white shadow-lg opacity-90">
            <Grip size={16} className="text-gray-400" />
            <div style={{ color: attribute.color }}>
                {getIcon(attribute.iconName, 16)}
            </div>
            <span className="text-sm font-medium text-gray-700">
                {attribute.label}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${attribute.type === 'measure' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                }`}>
                {attribute.type}
            </span>
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

    const [activeId, setActiveId] = useState<string | null>(null);

    // DnD Kit sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 3,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over || !active.data.current?.attribute) {
            return;
        }

        const attribute = active.data.current.attribute as ChartAttribute;
        const overData = over.data.current;

        if (!overData || !overData.type || !overData.chartType) {
            return;
        }

        const { type, chartType } = overData;

        // Validate drop - measures can only go to measures zone, dimensions to dimensions zone
        if ((type === 'measures' && attribute.type !== 'measure') ||
            (type === 'dimensions' && attribute.type !== 'dimension')) {
            return;
        }

        handleAttributeDrop(chartType, attribute, type);
    };

    const handleAttributeDrop = (chartType: string, attribute: ChartAttribute, dropZone: 'measures' | 'dimensions'): void => {
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
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6">
                <div className="max-w-7xl mx-auto hidden lg:block">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Advanced Financial Analytics Dashboard
                        </h1>
                        <p className="text-gray-600">
                            Create interactive charts with measures and dimensions using @dnd-kit
                        </p>
                    </div>

                    {/* Available Attributes Section */}
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
                        {/* Sidebar - Instructions */}
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
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                {/* <MobileDashboard
                availableMeasures={availableMeasures}
                availableDimensions={availableDimensions}
                mobileConfig={mobileConfig}
                onAttributeToggle={handleMobileAttributeToggle}
                onGroupByChange={handleMobileGroupByChange}
                onFilterChange={handleMobileFilterChange}
                data={mockFinancialData}
            /> */}
                {/* Mobile Dashboard */}
            </div>
        </DndContext>
    );
};

export default EnhancedDashboard;

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
            tooltip: { enabled: true },
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
            legend: { enabled: true, position: 'bottom', fontSize: 10 },
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