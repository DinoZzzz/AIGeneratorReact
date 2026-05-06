import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface BreadcrumbItem {
    label: string;
    path?: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
    const { t } = useLanguage();
    return (
        <nav className="flex mb-4" aria-label={t('common.breadcrumb')}>
            <ol className="flex items-center space-x-2">
                <li>
                    <div>
                        <Link to="/" className="text-muted-foreground hover:text-muted-foreground">
                            <Home className="flex-shrink-0 h-5 w-5" aria-hidden="true" />
                            <span className="sr-only">{t('common.home')}</span>
                        </Link>
                    </div>
                </li>
                {items.map((item, index) => (
                    <li key={index}>
                        <div className="flex items-center">
                            <ChevronRight className="flex-shrink-0 h-5 w-5 text-muted-foreground" aria-hidden="true" />
                            {item.path ? (
                                <Link
                                    to={item.path}
                                    className="ml-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                                >
                                    {item.label}
                                </Link>
                            ) : (
                                <span className="ml-2 text-sm font-medium text-foreground">
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
