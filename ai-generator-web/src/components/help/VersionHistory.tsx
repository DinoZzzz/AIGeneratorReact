import { GitBranch } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { VersionHistoryItem } from './versionHistoryData';

interface VersionHistoryProps {
    versionHistory: VersionHistoryItem[];
    language: string;
}

export const VersionHistory = ({ versionHistory, language }: VersionHistoryProps) => {
    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary font-medium">
                    <GitBranch className="h-5 w-5" />
                    {language === 'hr' ? 'Verzija' : 'Version'} {versionHistory[0]?.version}
                </div>
                <p className="text-muted-foreground mt-2">
                    {language === 'hr'
                        ? 'Pregled svih značajnih promjena i poboljšanja'
                        : 'Overview of all significant changes and improvements'}
                </p>
            </div>

            <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

                {versionHistory.map((item, index) => (
                    <div key={item.version} className="relative pl-16 pb-8 last:pb-0">
                        {/* Timeline dot */}
                        <div className={cn(
                            "absolute left-4 w-5 h-5 rounded-full border-2 bg-background",
                            index === 0 ? "border-primary bg-primary" : "border-border"
                        )} />

                        <div className="bg-card border border-border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                                <span className={cn(
                                    "text-lg font-bold",
                                    index === 0 ? "text-primary" : "text-foreground"
                                )}>
                                    v{item.version}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    {new Date(item.date).toLocaleDateString(language === 'hr' ? 'hr-HR' : 'en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </span>
                            </div>
                            <ul className="space-y-2">
                                {item.changes.map((change, changeIndex) => (
                                    <li key={changeIndex} className="flex items-start gap-2 text-muted-foreground">
                                        <span className="text-primary mt-1">&bull;</span>
                                        <span>{change}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
