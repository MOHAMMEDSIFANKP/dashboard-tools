import Link from 'next/link';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface ApiEndpoint {
    method: string;
    api: string;
    apiName: string;
    description?: string;
    testCase: string;
}

interface DashboardInfoCardProps {
    apiEndpoints: ApiEndpoint[];
    availableFeatures: { feature: string; supported: boolean, link?: string }[];
    dataRecords: { [testCase: string]: string };
    className?: string;
}

const DashboardInfoCard: React.FC<DashboardInfoCardProps> = ({
    apiEndpoints,
    availableFeatures,
    dataRecords,
    className = ""
}) => {
    const testCases = ["test-case-1", "test-case-2"];

    const getMethodColor = (method: string) => {
        switch (method.toUpperCase()) {
            case 'GET':
                return 'bg-green-100 text-green-800';
            case 'POST':
                return 'bg-blue-100 text-blue-800';
            case 'PUT':
                return 'bg-yellow-100 text-yellow-800';
            case 'DELETE':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <Card className={`m-5 transition-shadow duration-200 hover:shadow-md ${className}`}>
            <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-secondary to-white border border-border flex items-center justify-center shadow-sm">
                        <svg className="w-6 h-6 text-foreground/70" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <div>
                        <CardTitle className="text-xl">Test Information</CardTitle>
                        <CardDescription>Overview of features, records and API endpoints</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="grid grid-cols-1 gap-4">
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div className="rounded-xl border bg-secondary p-4 transition-colors">
                            <h3 className="text-sm font-semibold text-foreground/80 mb-3">Available Features</h3>
                            <div className="flex flex-wrap gap-2">
                                {availableFeatures.map((feature, index) => (
                                    <span
                                        key={index}
                                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium border shadow-sm hover:shadow-md hover:translate-y-[1px] cursor-pointer transition-colors ${feature?.supported ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}
                                    >
                                        <span className={`${feature?.supported ? 'text-green-500' : 'text-red-500'}`}>{feature?.supported ? '✓' : '✕'}</span>
                                        {feature?.feature}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-xl border bg-secondary p-4 transition-colors">
                            <h3 className="text-sm font-semibold text-foreground/80 mb-3 flex items-center gap-2">
                                <svg className="w-4 h-4 text-foreground/70" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16h8M8 12h8m-6 8h6a2 2 0 002-2V6a2 2 0 00-2-2H8a2 2 0 00-2 2v2" />
                                </svg>
                                Data Records Overview
                            </h3>
                            <div className="grid grid-cols-1 gap-3">
                                {testCases.map((testCase) => (
                                    <div
                                        key={testCase}
                                        className="flex items-center justify-between rounded-lg border bg-white px-4 py-3 shadow-sm transition-all duration-200 hover:shadow hover:-translate-y-[1px]"
                                    >
                                        <span className="text-sm font-medium text-foreground">
                                            {testCase.replace('-', ' ').toUpperCase()}
                                        </span>
                                        <span className="rounded-full bg-primary/10 text-primary text-xs font-semibold px-3 py-1">
                                            {dataRecords[testCase]}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {testCases.map((testCase) => (
                            <div key={testCase} className="rounded-xl border bg-secondary p-4 transition-colors">
                                <h3 className="text-sm font-semibold text-foreground/80 mb-3">
                                    API Endpoints {testCase.replace('-', ' ').toUpperCase()}
                                </h3>
                                <div className="space-y-2 text-sm">
                                    {apiEndpoints
                                        .filter((endpoint) => endpoint.testCase === testCase)
                                        .map((endpoint, index) => (
                                            <Link href={endpoint.api} key={index} className="group block">
                                                <div className="flex items-start gap-2 rounded-lg border bg-white px-3 py-2 transition-all duration-200 hover:bg-accent hover:-translate-y-[1px]">
                                                    <span
                                                        className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors ${getMethodColor(endpoint.method)}`}
                                                    >
                                                        {endpoint.method.toUpperCase()}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <code className="bg-muted px-2 py-1 rounded text-xs break-all transition-colors">
                                                            {endpoint.apiName}
                                                        </code>
                                                        {endpoint.description && (
                                                            <p className="text-muted-foreground mt-1 text-xs line-clamp-2">
                                                                {endpoint.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default DashboardInfoCard;
