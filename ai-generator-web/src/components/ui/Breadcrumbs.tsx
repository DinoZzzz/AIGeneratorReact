import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
    label: string;
    path?: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
    return (
        <nav className="flex mb-4" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
                <li>
                    <div>
                        <Link to="/" className="text-gray-400 hover:text-gray-500">
                            <Home className="flex-shrink-0 h-5 w-5" aria-hidden="true" />
                            <span className="sr-only">Home</span>
                        </Link>
                    </div>
                </li>
                {items.map((item, index) => (
                    <li key={index}>
                        <div className="flex items-center">
                            <ChevronRight className="flex-shrink-0 h-5 w-5 text-gray-400" aria-hidden="true" />
                            {item.path ? (
                                <Link
                                    to={item.path}
                                    className="ml-2 text-sm font-medium text-gray-500 hover:text-gray-700"
                                >
                                    {item.label}
                                </Link>
                            ) : (
                                <span className="ml-2 text-sm font-medium text-gray-700">
                                    {item.label}
                                </span>
                            )}
                        </div>
                    </li>
                ))}
            </ol>
        </nav>
    );
};
