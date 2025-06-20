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
    X
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
    key: keyof Omit<FinancialData, 'fiscalyear' | 'period' | 'cataccountingview' | 'catfinancialview' | 'country' | 'continent'>;
    label: string;
    color: string;
    iconName: string;
}

interface ChartType {
    key: 'line' | 'bar';
    label: string;
    iconName: string;
}

interface ChartConfigurations {
    line: ChartAttribute[];
    bar: ChartAttribute[];
}

interface DraggableAttributeProps {
    attribute: ChartAttribute;
    isUsed: boolean;
}

interface ChartDropZoneProps {
    chartType: ChartType;
    selectedAttributes: ChartAttribute[];
    onAttributeDrop: (chartType: string, attribute: ChartAttribute) => void;
    onAttributeRemove: (chartType: string, attributeKey: string) => void;
    data: FinancialData[];
}

// Mock data for demonstration
const mockFinancialData: FinancialData[] = [
    {
        fiscalyear: 2025,
        period: "202501",
        cataccountingview: "Operations",
        catfinancialview: "Revenue",
        revenue: 150000,
        otherincome: 5000,
        grossmargin: 120000,
        operatingexpenses: 80000,
        operatingprofit: 40000,
        financialresult: 2000,
        earningsbeforetax: 42000,
        nonrecurringresult: 0,
        netprofit: 35000,
        country: "USA",
        continent: "North America"
    },
    {
        fiscalyear: 2025,
        period: "2025Q2",
        cataccountingview: "Operations",
        catfinancialview: "Revenue",
        revenue: 180000,
        otherincome: 7000,
        grossmargin: 140000,
        operatingexpenses: 85000,
        operatingprofit: 55000,
        financialresult: 3000,
        earningsbeforetax: 58000,
        nonrecurringresult: 0,
        netprofit: 48000,
        country: "USA",
        continent: "North America"
    },
    {
        fiscalyear: 2025,
        period: "2025Q3",
        cataccountingview: "Operations",
        catfinancialview: "Revenue",
        revenue: 200000,
        otherincome: 8000,
        grossmargin: 160000,
        operatingexpenses: 90000,
        operatingprofit: 70000,
        financialresult: 4000,
        earningsbeforetax: 74000,
        nonrecurringresult: 0,
        netprofit: 62000,
        country: "USA",
        continent: "North America"
    }
];

// Available chart attributes for dragging
const availableAttributes: ChartAttribute[] = [
    { key: 'revenue', label: 'Revenue', color: '#3B82F6', iconName: 'DollarSign' },
    { key: 'grossmargin', label: 'Gross Margin', color: '#10B981', iconName: 'TrendingUp' },
    { key: 'operatingprofit', label: 'Operating Profit', color: '#8B5CF6', iconName: 'Banknote' },
    { key: 'netprofit', label: 'Net Profit', color: '#F59E0B', iconName: 'Target' },
    { key: 'operatingexpenses', label: 'Operating Expenses', color: '#EF4444', iconName: 'Receipt' },
    { key: 'otherincome', label: 'Other Income', color: '#06B6D4', iconName: 'Plus' },
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

    return (
        <div
            draggable={!isUsed}
            onDragStart={handleDragStart}
            className={`flex items-center gap-2 p-3 rounded-lg border-2 border-dashed transition-all duration-200 cursor-move ${isUsed
                    ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                    : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50'
                }`}
        >
            <Grip size={16} className="text-gray-400" />
            <div style={{ color: attribute.color }}>
                {getIcon(attribute.iconName, 16)}
            </div>
            <span className={`text-sm font-medium ${isUsed ? 'text-gray-400' : 'text-gray-700'}`}>
                {attribute.label}
            </span>
        </div>
    );
};

// Chart Container with Drop Zone
const ChartDropZone: React.FC<ChartDropZoneProps> = ({
    chartType,
    selectedAttributes,
    onAttributeDrop,
    onAttributeRemove,
    data
}) => {
    const [isDragOver, setIsDragOver] = useState<boolean>(false);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        setIsDragOver(true);
    };

    const handleDragLeave = (): void => {
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
        setIsDragOver(false);

        try {
            const attributeData: ChartAttribute = JSON.parse(e.dataTransfer.getData('text/plain'));
            onAttributeDrop(chartType.key, attributeData);
        } catch (error) {
            console.error('Error parsing dropped data:', error);
        }
    };
    // @ts-ignore
    const chartOptions: AgChartOptions = useMemo(() => {
        if (selectedAttributes.length === 0) {
            return {};
        }

        const series = selectedAttributes.map(attr => ({
            type: chartType.key === 'bar' ? 'bar' : 'line',
            xKey: 'period',
            yKey: attr.key,
            yName: attr.label,
            stroke: attr.color,
            fill: attr.color,
            tooltip: { enabled: true },
        }));

        return {
            title: { text: `${chartType.label} - Financial Metrics` },
            data: data,
            series: series,
            axes: [
                {
                    type: 'category',
                    position: 'bottom',
                    title: { text: 'Period' },
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
    }, [selectedAttributes, chartType, data]);

    return (
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden">
            {/* Chart Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                <div className="flex items-center gap-2">
                    {getIcon(chartType.iconName, 16)}
                    <h3 className="font-semibold text-gray-800">{chartType.label}</h3>
                </div>
                <div className="flex items-center gap-2">
                    {selectedAttributes.map((attr) => (
                        <div
                            key={attr.key}
                            className="flex items-center gap-1 px-2 py-1 bg-white rounded-md border text-xs"
                        >
                            <div style={{ color: attr.color }}>
                                {getIcon(attr.iconName, 12)}
                            </div>
                            <span>{attr.label}</span>
                            <button
                                onClick={() => onAttributeRemove(chartType.key, attr.key)}
                                className="ml-1 text-gray-400 hover:text-red-500"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Drop Zone Area */}
            <div
                className={`h-80 transition-all duration-200 ${isDragOver
                        ? 'bg-blue-50 border-4 border-dashed border-blue-400'
                        : 'bg-white'
                    }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {selectedAttributes.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                            <BarChart3 size={48} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Drag attributes here to create a chart</p>
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
        line: [],
        bar: []
    });

    const handleAttributeDrop = (chartType: string, attribute: ChartAttribute): void => {
        setChartConfigurations(prev => ({
            ...prev,
            [chartType]: [...prev[chartType as keyof ChartConfigurations].filter(attr => attr.key !== attribute.key), attribute]
        }));
    };

    const handleAttributeRemove = (chartType: string, attributeKey: string): void => {
        setChartConfigurations(prev => ({
            ...prev,
            [chartType]: prev[chartType as keyof ChartConfigurations].filter(attr => attr.key !== attributeKey)
        }));
    };

    const usedAttributeKeys = useMemo<Set<string>>(() => {
        return new Set([
            ...chartConfigurations.line.map(attr => attr.key),
            ...chartConfigurations.bar.map(attr => attr.key)
        ]);
    }, [chartConfigurations]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Interactive Financial Dashboard
                    </h1>
                    <p className="text-gray-600">
                        Drag and drop attributes to create custom charts
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Sidebar - Available Attributes */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
                            <h3 className="font-semibold text-gray-800 mb-4">Available Attributes</h3>
                            <div className="space-y-3">
                                {availableAttributes.map((attribute) => (
                                    <DraggableAttribute
                                        key={attribute.key}
                                        attribute={attribute}
                                        isUsed={usedAttributeKeys.has(attribute.key)}
                                    />
                                ))}
                            </div>

                            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                                <h4 className="font-medium text-blue-900 mb-2">How to use:</h4>
                                <ol className="text-sm text-blue-800 space-y-1">
                                    <li>1. Drag attributes from the list</li>
                                    <li>2. Drop them onto chart areas</li>
                                    <li>3. Charts update automatically</li>
                                    <li>4. Click X to remove attributes</li>
                                </ol>
                            </div>
                        </div>
                    </div>

                    {/* Main Chart Area */}
                    <div className="lg:col-span-3">
                        <div className="grid grid-cols-1 xl:grid-cols-1 gap-6">
                            {chartTypes.map((chartType) => (
                                <ChartDropZone
                                    key={chartType.key}
                                    chartType={chartType}
                                    selectedAttributes={chartConfigurations[chartType.key]}
                                    onAttributeDrop={handleAttributeDrop}
                                    onAttributeRemove={handleAttributeRemove}
                                    data={mockFinancialData}
                                />
                            ))}
                        </div>

                        {/* Usage Statistics */}
                        <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
                            <h3 className="font-semibold text-gray-800 mb-4">Chart Configuration Status</h3>
                            <div className="grid grid-cols-1 gap-4">
                                {chartTypes.map((chartType) => (
                                    <div key={chartType.key} className="bg-gray-50 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            {getIcon(chartType.iconName, 16)}
                                            <span className="font-medium">{chartType.label}</span>
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {chartConfigurations[chartType.key].length} attributes selected
                                        </div>
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {chartConfigurations[chartType.key].map((attr) => (
                                                <span
                                                    key={attr.key}
                                                    className="px-2 py-1 bg-white rounded text-xs border"
                                                    style={{ borderColor: attr.color }}
                                                >
                                                    {attr.label}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnhancedDashboard;