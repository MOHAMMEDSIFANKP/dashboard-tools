'use client'
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Search,
    Bell,
    User,
    Home,
    Package,
    ShoppingCart,
    Users,
    BarChart3,
    Settings,
    ChevronLeft,
    ChevronRight,
    Menu,
    X,
    Grid3X3,
    Layout,
    Table,
    PieChart,
    LineChart,
    TrendingUp,
    Activity,
    Zap,
    DollarSign,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { usePathname } from 'next/navigation';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedTestCase } from '@/store/slices/dashboardSlice';
import { RootState } from '@/store/store';

interface SideBarLayoutProps {
    children: React.ReactNode;
}

const SideBarLayout: React.FC<SideBarLayoutProps> = ({ children }) => {
    const pathname = usePathname();
    const [isExpanded, setIsExpanded] = useLocalStorage<boolean>('sidebar-expanded', true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');

    const sidebarItems = [
        // === Custom Features / Internal ===
        { icon: Home, label: 'Home', href: '/', active: pathname === '/', section: 'Custom Features' },
        { icon: Home, label: 'Dashboard', href: '/dashboard', active: pathname === '/dashboard', section: 'Custom Features' },
        { icon: Layout, label: 'Draggable Dashboard', href: '/dashboard/draggble-dashboard', active: pathname === '/dashboard/draggble-dashboard', section: 'Custom Features' },
        { icon: Grid3X3, label: 'DnD Draggable', href: '/dashboard/draggble-dashboard-dnd', active: pathname === '/dashboard/draggble-dashboard-dnd', section: 'Custom Features' },
        // { icon: Table, label: 'Redux + RTK', href: '/redux', active: pathname === '/redux', section: 'Custom Features' },
        // === Open Source Tools ===
        { icon: BarChart3, label: 'AG Charts', href: '/ag-charts', active: pathname === '/ag-charts', section: 'Open Source' },
        { icon: PieChart, label: 'Chart JS', href: '/chart-js', active: pathname === '/chart-js', section: 'Open Source' },
        { icon: LineChart, label: 'React Plotly', href: '/react-plotly', active: pathname === '/react-plotly', section: 'Open Source' },
        { icon: TrendingUp, label: 'Nivo Charts', href: '/nivo-charts', active: pathname === '/nivo-charts', section: 'Open Source' },
        { icon: Activity, label: 'Victory Charts', href: '/victory-charts', active: pathname === '/victory-charts', section: 'Open Source' },
        { icon: Zap, label: 'ECharts', href: '/echarts', active: pathname === '/echarts', section: 'Open Source' },
        { icon: Table, label: 'AG Grid (List)', href: '/ag-table', active: pathname === '/ag-table', section: 'Open Source' },
        { icon: Table, label: 'TanStack Table', href: '/tanStack-table', active: pathname === '/tanStack-table', section: 'Open Source' },
        { icon: Table, label: 'React Table', href: '/react-table', active: pathname === '/react-table', section: 'Open Source' },


        // === Paid Tools ===
        { icon: DollarSign, label: 'Highcharts', href: '/highcharts', active: pathname === '/highcharts', section: 'Paid Tools' },


    ];



    // Close mobile menu when pathname changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    // Close mobile menu when clicking outside
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setIsMobileMenuOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleDesktopSidebar = () => {
        setIsExpanded(!isExpanded);
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
        <div className="flex flex-col h-[93vh] bg-white shadow-md transition-all duration-300 ease-in-out overflow-y-auto">
            {/* Mobile Header */}
            {isMobile && (
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                    <button
                        onClick={toggleMobileMenu}
                        className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full transition duration-150 ease-in-out"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
            )}

            {/* Navigation Items */}
            <nav className="flex-1 px-4 py-4 space-y-2">
                {(() => {
                    let lastSection = '';
                    return sidebarItems.map((item, index) => {
                        const Icon = item.icon;
                        const showSectionHeader = item.section !== lastSection;
                        lastSection = item.section;

                        return (
                            <React.Fragment key={index}>
                                {showSectionHeader && isExpanded && (
                                    <div className="text-xs text-white font-bold uppercase mt-4 mb-1 pl-2 bg-[#0b2545] py-1 rounded-[10px]">
                                        {item.section}
                                    </div>
                                )}
                                <Link
                                    href={item.href}
                                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition duration-150 ease-in-out group ${item.active
                                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                        }`}
                                >
                                    <Icon className={`h-5 w-5 ${isMobile || isExpanded ? 'mr-3' : 'mx-auto'
                                        } transition-all duration-300 ease-in-out`} />
                                    {(isMobile || isExpanded) && (
                                        <span className="transition-opacity duration-300 ease-in-out">
                                            {item.label}
                                        </span>
                                    )}
                                    {!isMobile && !isExpanded && (
                                        <div className="absolute left-16 bg-gray-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                                            {item.label}
                                        </div>
                                    )}
                                </Link>
                            </React.Fragment>
                        );
                    });
                })()}
            </nav>


            {/* Bottom Section */}
            <div className="p-4 border-t border-gray-200">
                <div className="flex items-center">
                    <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-gray-600" />
                    </div>
                    {(isMobile || isExpanded) && (
                        <div className="ml-3 transition-opacity duration-300 ease-in-out min-w-0">
                            <p className="text-sm font-medium text-gray-700 truncate">John Doe</p>
                            <p className="text-xs text-gray-500 truncate">john@example.com</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar */}
            <nav className="bg-white border-b border-gray-200 fixed w-full top-0 z-50">
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center gap-2">
                            {/* Desktop Sidebar Toggle */}
                            <button
                                className='hidden md:block transition duration-150 ease-in-out cursor-pointer p-1 hover:bg-gray-100 rounded'
                                onClick={toggleDesktopSidebar}
                            >
                                {isExpanded ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                            </button>

                            {/* Mobile Menu Toggle */}
                            <button
                                className='md:hidden transition duration-150 ease-in-out cursor-pointer p-1 hover:bg-gray-100 rounded'
                                onClick={toggleMobileMenu}
                            >
                                <Menu className="h-5 w-5" />
                            </button>

                            <div className="flex-shrink-0">
                                <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="flex-1 flex justify-center px-2 lg:ml-6 lg:justify-end items-center">
                            <div className="max-w-lg w-full lg:max-w-xs">
                                <label htmlFor="search" className="sr-only">Search</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <Input
                                        id="search"
                                        name="search"
                                        placeholder="Search..."
                                        type="search"
                                        value={searchValue}
                                        className='pl-10'
                                        onChange={(e) => setSearchValue(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <TestCaseSwitcher />
                        {/* Profile & Notifications */}
                        <div className="flex items-center space-x-4">
                            <button className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full transition duration-150 ease-in-out">
                                <Bell className="h-6 w-6" />
                            </button>
                            <div className="relative">
                                <button className="flex items-center space-x-3 text-sm bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out">
                                    <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                                        <User className="h-5 w-5 text-white" />
                                    </div>
                                    <span className="hidden lg:block text-gray-700 font-medium">John Doe</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                    onClick={toggleMobileMenu}
                />
            )}

            {/* Mobile Sidebar */}
            <aside className={`md:hidden fixed left-0 top-16 z-50 w-64 bg-white border-r border-gray-200 h-[calc(100vh-4rem)] transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>
                <SidebarContent isMobile={true} />
            </aside>

            {/* Desktop Layout */}
            <div className="pt-16 hidden md:flex">
                {/* Desktop Sidebar */}
                <aside className={`${isExpanded ? 'w-64' : 'w-20'
                    } bg-white border-r border-gray-200 min-h-screen transition-all duration-300 ease-in-out fixed left-0 top-16 z-40`}>
                    <SidebarContent />
                </aside>

                {/* Desktop Main Content */}
                <main className={`flex-1 ${isExpanded ? 'ml-64' : 'ml-20'
                    } transition-all duration-300 ease-in-out`}>
                    {children}
                </main>
            </div>

            {/* Mobile Main Content */}
            <main className="md:hidden pt-0">
                {children}
            </main>
        </div>
    );
};


function TestCaseSwitcher() {
    const dispatch = useDispatch();
    const testCase = useSelector((state: RootState) => state.dashboard.selectedTestCase);

    const toggleTestCase = () => {
        const newCase = testCase === "test-case-1" ? "test-case-2" : "test-case-1";
        dispatch(setSelectedTestCase(newCase));
    };


    return (
        <div className="flex items-center justify-between gap-4 p-4  w-fit">
            <div className='hidden md:block'>
                <div className="text-sm font-semibold text-gray-700">
                    {`Currently Using: Test Case ${testCase}`}
                </div>
                <div className="text-xs text-gray-500">
                    Toggle to test dashboard response behavior
                </div>
            </div>
            <button
                onClick={toggleTestCase}
                className={`relative flex items-center h-8 w-20 rounded-full transition-colors duration-300 ${testCase === "test-case-1" ? "bg-blue-600" : "bg-green-600"
                    }`}
            >
                <span className={`absolute ${testCase === "test-case-1" ? 'right-1' : 'left-1'} text-white text-[9px]`}>
                    {testCase === "test-case-1" ? "Test Case 1" : "Test Case 2"}
                </span>
                <div
                    className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow-md transform transition-transform duration-300 ${testCase === "test-case-2" ? "translate-x-12" : ""
                        }`}
                />
            </button>
        </div>
    );
}

export default SideBarLayout;