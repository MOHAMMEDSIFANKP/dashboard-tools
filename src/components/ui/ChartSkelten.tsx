import React from 'react'

export const ChartSkelten: React.FC<any> = () => {
    return (
        <div className="flex items-center justify-center h-64 text-gray-500 bg-gray-50 rounded-lg">
            <div className="text-center">
                <svg
                    className="mx-auto h-12 w-12 text-gray-400 mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                </svg>
                <p className="text-sm font-medium">No data available</p>
                <p className="text-xs text-gray-400 mt-1">Chart will appear when data is loaded</p>
            </div>
        </div>
    )
}
