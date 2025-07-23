import React from 'react'
import { ChartSkelten } from '../ui/ChartSkelten'
import { BarChart3, Download, FileDown, RotateCcw, X } from 'lucide-react'

interface ChartContainerViewProps {
    children: React.ReactNode;
    isDrilled?: boolean;
    resetDrillDown?: () => void;
    isLoading: boolean;
    isCrossChartFiltered?: boolean;
    resetCrossChartFilter?: () => void;
    hasData?: boolean;
    exportToPNG?: () => void;
    exportToCSV?: () => void;
    chartRef?: React.RefObject<HTMLDivElement>;
    title: string;
    className?: string;
}

export const ChartContainerView: React.FC<ChartContainerViewProps> = ({
    title, children,  isDrilled, resetDrillDown, isLoading = false, isCrossChartFiltered, resetCrossChartFilter, exportToCSV, exportToPNG, hasData , chartRef, className=''
}) => {
    return (
        <div className="group relative bg-gradient-to-br from-white via-slate-50 to-blue-50/30 p-6 rounded-2xl shadow-lg border border-white/60 hover:shadow-2xl hover:shadow-blue-100/50 transition-all duration-500 ease-in-out transform hover:-translate-y-1 backdrop-blur-sm">
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/40 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            {/* Header Section */}
            <div className="relative flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
                        <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text ">
                        {title}
                    </h3>
                </div>

                <div className="flex items-center space-x-3">
                    {/* Cross Chart Filter Reset Button */}
                    {isCrossChartFiltered && (
                        <button
                            onClick={resetCrossChartFilter}
                            className="cursor-pointer group/btn relative px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl shadow-lg hover:shadow-red-200 transform hover:scale-105 transition-all duration-300 ease-out font-medium text-sm overflow-hidden"
                        >
                            <div className="cursor-pointer absolute inset-0 bg-gradient-to-r from-red-400 to-red-500 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                            <div className="cursor-pointer relative flex items-center space-x-2">
                                <X className="cursor-pointer w-4 h-4" />
                                <span>Reset Filter</span>
                            </div>
                        </button>
                    )}

                    {/* Loading Spinner */}
                    {isLoading && (
                        <div className="relative">
                            <div className="animate-spin rounded-full h-8 w-8 border-4 border-gradient-to-r from-blue-400 to-indigo-500 border-t-transparent shadow-lg"></div>
                            <div className="absolute inset-0 animate-pulse rounded-full bg-blue-100/50"></div>
                        </div>
                    )}
                </div>
            </div>

            {hasData ? (
                <>
                    {/* Controls Section */}
                    <div className="relative flex justify-between items-center mb-6">
                        <div className="flex items-center space-x-3">
                            {isDrilled && (
                                <button
                                    onClick={resetDrillDown}
                                    className="cursor-pointer group/back relative px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 hover:text-gray-800 rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 ease-out font-medium text-sm overflow-hidden border border-gray-300/50"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-gray-100 opacity-0 group-hover/back:opacity-100 transition-opacity duration-300"></div>
                                    <div className="relative flex items-center space-x-2">
                                        <RotateCcw className="w-4 h-4 transition-transform duration-300 group-hover/back:-rotate-12" />
                                        <span>Back</span>
                                    </div>
                                </button>
                            )}
                        </div>

                        {/* Export Buttons */}
                        <div className="flex items-center space-x-3">
                           {exportToPNG &&  <button
                                onClick={exportToPNG}
                                className="cursor-pointer group/png relative px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl shadow-lg hover:shadow-emerald-200 transform hover:scale-105 transition-all duration-300 ease-out font-medium text-sm overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 opacity-0 group-hover/png:opacity-100 transition-opacity duration-300"></div>
                                <div className="relative flex items-center space-x-2">
                                    <Download className="w-4 h-4 transition-transform duration-300 group-hover/png:translate-y-0.5" />
                                    <span>PNG</span>
                                </div>
                                <div className="absolute inset-0 rounded-xl ring-0 group-hover/png:ring-2 group-hover/png:ring-emerald-300/50 transition-all duration-300"></div>
                            </button>}

                            <button
                                onClick={exportToCSV}
                                className="cursor-pointer group/csv relative px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-blue-200 transform hover:scale-105 transition-all duration-300 ease-out font-medium text-sm overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 group-hover/csv:opacity-100 transition-opacity duration-300"></div>
                                <div className="relative flex items-center space-x-2">
                                    <FileDown className="w-4 h-4 transition-transform duration-300 group-hover/csv:translate-y-0.5" />
                                    <span>CSV</span>
                                </div>
                                <div className="absolute inset-0 rounded-xl ring-0 group-hover/csv:ring-2 group-hover/csv:ring-blue-300/50 transition-all duration-300"></div>
                            </button>
                        </div>
                    </div>

                    {/* Chart Content */}
                    <div
                        ref={chartRef}
                        className="relative rounded-xl overflow-hidden bg-white/50 backdrop-blur-sm border border-white/60 shadow-inner transition-all duration-500 group-hover:bg-white/70"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className={`${className} relative`}>
                            {children}
                        </div>
                    </div>
                </>
            ) : (
                <div className="relative">
                    <ChartSkelten />
                </div>
            )}

            {/* Decorative elements */}
            <div className="absolute -top-1 -right-1 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="absolute -bottom-1 -left-1 w-16 h-16 bg-gradient-to-tr from-indigo-400/20 to-transparent rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100"></div>
        </div>
    )
}
