'use client'
import React, { useState } from 'react';
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
    Menu
} from 'lucide-react';
import { Input } from '@/components/ui/input';
const SideBarLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [searchValue, setSearchValue] = useState('');

    const sidebarItems = [
        { icon: Home, label: 'Dashboard', href: '/dashboard', active: true },
        { icon: Package, label: 'Demo', href: '/dashboard' },
        { icon: ShoppingCart, label: 'Demo', href: '/dashboard' },
        { icon: Users, label: 'Customers', href: '/dashboard' },
        { icon: BarChart3, label: 'Analytics', href: '/dashboard' },
        { icon: Settings, label: 'Settings', href: '/dashboard' },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar */}
            <nav className="bg-white border-b border-gray-200 fixed w-full top-0 z-50">
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center gap-2">
                            <button className='transition duration-150 ease-in-out cursor-pointer'
                            onClick={() => setIsExpanded(!isExpanded)}
                            >
                                {isExpanded ? <ChevronRight className="h-5 w-5" /> : <Menu />}
                            </button>
                            <div className="flex-shrink-0">
                                <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="flex-1 flex justify-center px-2 lg:ml-6 lg:justify-end items-center">
                            <div className="max-w-lg w-full lg:max-w-xs">
                                <label htmlFor="search" className="sr-only">Search</label>
                                <div className="relative ">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <Input
                                        id="search"
                                        name="search"
                                        placeholder="Search..."
                                        type="search"
                                        value={searchValue}
                                        className='ps-10'
                                        onChange={(e) => setSearchValue(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

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
                                    <span className="hidden md:block text-gray-700 font-medium">John Doe</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="pt-16 flex">
                {/* Sidebar */}
                <aside className={`${isExpanded ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 min-h-screen transition-all duration-300 ease-in-out fixed left-0 top-16 z-40`}>
                    <div className="flex flex-col h-full">
                        {/* Navigation Items */}
                        <nav className="flex-1 px-4 py-4 space-y-2">
                            {sidebarItems.map((item, index) => {
                                const Icon = item.icon;
                                return (
                                    <a
                                        key={index}
                                        href={item.href}
                                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition duration-150 ease-in-out group ${item.active
                                                ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                            }`}
                                    >
                                        <Icon className={`h-5 w-5 ${isExpanded ? 'mr-3' : 'mx-auto'} transition-all duration-300 ease-in-out`} />
                                        {isExpanded && (
                                            <span className="transition-opacity duration-300 ease-in-out">
                                                {item.label}
                                            </span>
                                        )}
                                        {!isExpanded && (
                                            <div className="absolute left-16 bg-gray-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                                                {item.label}
                                            </div>
                                        )}
                                    </a>
                                );
                            })}
                        </nav>

                        {/* Bottom Section */}
                        <div className="p-4 border-t border-gray-200">
                            <div className="flex items-center">
                                <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                                    <User className="h-4 w-4 text-gray-600" />
                                </div>
                                {isExpanded && (
                                    <div className="ml-3 transition-opacity duration-300 ease-in-out">
                                        <p className="text-sm font-medium text-gray-700">John Doe</p>
                                        <p className="text-xs text-gray-500">john@example.com</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className={`flex-1 ${isExpanded ? 'ml-64' : 'ml-20'} transition-all duration-300 ease-in-out`}>
                    {children}
                </main>
            </div>
        </div>
    );
};

export default SideBarLayout;