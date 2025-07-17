'use client';
import React, { useEffect, useRef } from 'react';

export const ChartContextMenu: React.FC<{
    isOpen: boolean;
    position: { x: number; y: number };
    onClose: () => void;
    onFilter: () => void;
    onDrillDown: () => void;
    category: string;
    value: any;
}> = ({ isOpen, position, onClose, onFilter, onDrillDown, category, value }) => {
    const menuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);
    if (!isOpen) return null;

    return (
        <div
            ref={menuRef}
            className="fixed bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50 min-w-48"
            style={{ top: position.y, left: position.x }}
        >
            <div className="mb-2 px-2 py-1 text-sm text-gray-600 border-b">
                <strong>{category}</strong>: {value?.toFixed(2)}
            </div>
            <button
                onClick={onFilter}
                className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 rounded flex items-center gap-2"
            >
                <span>🔍</span> Cross Chart FIlter
            </button>
            <button
                onClick={onDrillDown}
                className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 rounded flex items-center gap-2"
            >
                <span>📊</span> Drill down
            </button>
            <button
                onClick={onClose}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded text-gray-500"
            >
                Cancel
            </button>
        </div>
    );
};
