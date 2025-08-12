import { Card } from '@/components/ui/card';
import { BookOpen, CheckCircle, ExternalLink, Layers } from 'lucide-react';
import Link from 'next/link';
import React from 'react'

const dashboardTools = [
        {
            name: 'AG Charts',
            type: 'Open Source',
            category: 'Chart Library',
            performance: 'High',
            usedIn: ['Test Case 1'],
            features: [
                'Interactive Charts',
                'Real-time Updates',
                'Multi-series Support',
                'Enterprise Grade',
                'Drill Down',
                'Legend Toggle',
                'Custom Buttons',
                'Export Options (PNG, SVG, CSV)',
                'Filtering Support',
                'Next.js Integration',
            ],
            documentation: 'https://charts.ag-grid.com/documentation/',
            status: 'Active'
        },
        {
            name: 'Chart.js',
            type: 'Open Source',
            category: 'Chart Library',
            performance: 'Medium',
            usedIn: ['Test Case 1'],
            features: [
                'Responsive',
                'Animated',
                'Canvas Based',
                'Lightweight',
                'Custom Buttons',
                'Legend Toggle',
                'Next.js Integration',
            ],
            documentation: 'https://www.chartjs.org/docs/',
            status: 'Active'
        },
        {
            name: 'React Plotly',
            type: 'Open Source',
            category: 'Chart Library',
            performance: 'High',
            usedIn: ['Test Case 1'],
            features: [
                'High Quality Export (PNG, JPEG, SVG)',
                'Interactive Charts',
                'Custom Config Buttons',
                'Legend Toggle',
                'Next.js Integration',
            ],
            documentation: 'https://plotly.com/javascript/react/',
            status: 'Active'
        },
        {
            name: 'Nivo Charts',
            type: 'Open Source',
            category: 'Chart Library',
            performance: 'High',
            usedIn: ['Test Case 1'],
            features: [
                'SVG Based',
                'Theme Support',
                'Legend Toggle',
                'Drill Down (Custom)',
                'Next.js Integration',
            ],
            documentation: 'https://nivo.rocks/',
            status: 'Active'
        },
        {
            name: 'Victory Charts',
            type: 'Open Source',
            category: 'Chart Library',
            performance: 'Medium',
            usedIn: ['Test Case 1'],
            features: [
                'Interactive Charts',
                'Legend Toggle',
                'Custom UI Controls',
                'Next.js Integration',
            ],
            documentation: 'https://formidable.com/open-source/victory/',
            status: 'Active'
        },
        {
            name: 'ECharts',
            type: 'Open Source',
            category: 'Chart Library',
            performance: 'High',
            usedIn: ['Test Case 1'],
            features: [
                'Interactive Charts',
                'Drill Down',
                'Custom Toolbox Configs',
                'Legend Toggle',
                'Export to Image',
                'Next.js Integration',
            ],
            documentation: 'https://echarts.apache.org/en/index.html',
            status: 'Active'
        },
        {
            name: 'AG Grid',
            type: 'Open Source',
            category: 'Data Grid',
            performance: 'High',
            usedIn: ['Test Case 1'],
            features: [
                'Virtual Scrolling',
                'Filtering',
                'Sorting',
                'Editable Cells',
                'Pagination',
                'Excel Export',
                'Column Reordering',
                'Next.js Integration'
            ],
            documentation: 'https://ag-grid.com/documentation/',
            status: 'Active'
        },
        {
            name: 'Tanstack Table',
            type: 'Open Source',
            category: 'Data Grid',
            performance: 'High',
            usedIn: ['Test Case 1'],
            features: [
                'Filtering',
                'Sorting',
                'Pagination',
                'Column Reordering',
                'Headless Customization',
                'Next.js Integration'
            ],
            documentation: 'https://tanstack.com/table/v8',
            status: 'Active'
        },
        {
            name: 'React Table',
            type: 'Open Source',
            category: 'Data Grid',
            performance: 'Medium',
            usedIn: ['Test Case 1'],
            features: [
                'Filtering',
                'Sorting',
                'Pagination',
                'Lightweight',
                'Next.js Integration'
            ],
            documentation: 'https://react-table.tanstack.com/',
            status: 'Active'
        },
        {
            name: 'AG Charts Enterprise',
            type: 'Paid',
            category: 'Chart Library',
            performance: 'High',
            usedIn: ['Test Case 2'],
            features: [
                'Enterprise Support',
                'Advanced Drill Down',
                'Cross-Chart Filtering',
                'Custom Tooltips',
                'Export Options',
                'Real-time Data',
                'Next.js Integration'
            ],
            documentation: 'https://charts.ag-grid.com/documentation/enterprise/',
            status: 'Not Active'
        },
        {
            name: 'Highcharts',
            type: 'Paid',
            category: 'Chart Library',
            performance: 'High',
            usedIn: ['Test Case 2'],
            features: [
                'Built-in Drill Down',
                'Zooming & Panning',
                'Exporting',
                'Cross-Chart Filtering',
                'Theme Customization',
                'Next.js Integration'
            ],
            documentation: 'https://www.highcharts.com/docs/',
            status: 'Active'
        },
        {
            name: 'Syncfusion Charts',
            type: 'Paid',
            category: 'Chart Library',
            performance: 'High',
            usedIn: ['Test Case 2'],
            features: [
                '50+ Chart Types',
                'Interactive Elements',
                'Export Options',
                'Enterprise Grade Support',
                'Next.js Integration'
            ],
            documentation: 'https://ej2.syncfusion.com/react/documentation/chart/getting-started/',
            status: 'Not Active'
        }
    ];

export const DashboardTools: React.FC = () => {
    return (
        <div className="space-y-8">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Dashboard Tools & Tables</h2>
                <p className="text-lg text-gray-600">Comprehensive evaluation of charting libraries and visualization tools</p>
            </div>

            <div className="home-dashbaord-tools grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dashboardTools.map((tool, index) => (
                    <Card key={index} className="p-6 hover:shadow-xl transition-all duration-300">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${tool.type === 'Commercial' ? 'bg-purple-100' : 'bg-green-100'
                                    }`}>
                                    <Layers className={`${tool.type === 'Commercial' ? 'text-purple-600' : 'text-green-600'
                                        }`} size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">{tool.name}</h3>
                                    <p className="text-sm text-gray-600">{tool.category}</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${tool.type === 'Commercial'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-green-100 text-green-800'
                                    }`}>
                                    {tool.type}
                                </span>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${tool.status === 'Active'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {tool.status}
                                </span>
                            </div>
                        </div>

                        {/* Performance Indicator */}
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-600">Performance</span>
                                <span className={`text-sm font-semibold ${tool.performance === 'High' ? 'text-green-600' : 'text-yellow-600'
                                    }`}>
                                    {tool.performance}
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full ${tool.performance === 'High' ? 'bg-green-500' : 'bg-yellow-500'
                                        }`}
                                    style={{ width: tool.performance === 'High' ? '90%' : '70%' }}
                                />
                            </div>
                        </div>

                        {/* Used In */}
                        <div className="mb-4">
                            <h4 className="text-sm font-semibold text-gray-900 mb-2">Used In</h4>
                            <div className="flex flex-wrap gap-1">
                                {tool.usedIn.map((testCase, i) => (
                                    <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                        {testCase}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Features */}
                        <div className="mb-4">
                            <h4 className="text-sm font-semibold text-gray-900 mb-2">Key Features</h4>
                            <div className="space-y-1">
                                {tool.features.map((feature, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <CheckCircle size={12} className="text-green-500" />
                                        <span className="text-xs text-gray-600">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Documentation Link */}
                        <Link href={tool?.documentation} target='_blank' className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                            <BookOpen size={16} />
                            View Documentation
                            <ExternalLink size={14} />
                        </Link>
                    </Card>
                ))}
            </div>
        </div>
    )
}
