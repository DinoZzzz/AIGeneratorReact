import { Download, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { ReportFile } from '../../types';

interface AttachmentsGalleryProps {
    reportFiles: ReportFile[];
    t: (key: string) => string;
}

export const AttachmentsGallery = ({ reportFiles, t }: AttachmentsGalleryProps) => {
    if (reportFiles.length === 0) return null;

    return (
        <div className="bg-card shadow rounded-lg overflow-hidden border border-border">
            <div className="px-6 py-4 border-b border-border">
                <h2 className="text-lg font-medium text-foreground">{t('exportDetails.attachments')} ({reportFiles.length})</h2>
            </div>
            <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {reportFiles.map((file) => {
                        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.file_name);
                        const { data } = supabase.storage
                            .from('report-files')
                            .getPublicUrl(file.file_path);

                        return (
                            <div
                                key={file.id}
                                className="border border-border rounded-lg overflow-hidden bg-muted/30 hover:shadow-md transition-shadow"
                            >
                                {isImage ? (
                                    <a
                                        href={data.publicUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block"
                                    >
                                        <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
                                            <img
                                                src={data.publicUrl}
                                                alt={file.description || file.file_name}
                                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                                                loading="lazy"
                                                decoding="async"
                                            />
                                        </div>
                                    </a>
                                ) : (
                                    <a
                                        href={data.publicUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block"
                                    >
                                        <div className="aspect-video bg-muted flex items-center justify-center">
                                            <FileText className="h-12 w-12 text-muted-foreground" />
                                        </div>
                                    </a>
                                )}
                                <div className="p-3">
                                    <p className="text-sm font-medium text-foreground truncate" title={file.file_name}>
                                        {file.file_name}
                                    </p>
                                    {file.description && (
                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                            {file.description}
                                        </p>
                                    )}
                                    <a
                                        href={data.publicUrl}
                                        download
                                        className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 mt-2"
                                    >
                                        <Download className="h-3 w-3" />
                                        {t('exportDetails.download')}
                                    </a>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
