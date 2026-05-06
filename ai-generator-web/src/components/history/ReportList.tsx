import React from 'react';
import { Loader2, Download, GripVertical, Pencil } from 'lucide-react';
import clsx from 'clsx';
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent, DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ReportExportForm } from '../../types';

interface ReportListProps {
    reportList: ReportExportForm[];
    title: string;
    typeId: 1 | 2;
    selectedIds: Set<string>;
    downloadingFormId: string | null;
    onToggleSelect: (id: string) => void;
    onSetSelectedIds: (ids: Set<string>) => void;
    onDownloadReport: (formId: string) => void;
    onNavigateToReport: (formId: string, typeId: number) => void;
    onDragEnd: (event: DragEndEvent, typeId: 1 | 2) => void;
    t: (key: string) => string;
}

const SortableRow = ({ item, children }: { item: ReportExportForm; children: (props: { attributes: DraggableAttributes; listeners: DraggableSyntheticListeners }) => React.ReactNode }) => {
    const id = item.form_id || item.report_form?.id || item.id;
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : 'auto',
        position: isDragging ? 'relative' as const : undefined,
    };

    const isSection = !!item.report_form?.section_name;

    return (
        <tr
            ref={setNodeRef}
            style={style}
            className={clsx(
                isSection ? 'bg-muted/30 hover:bg-muted/50' : 'hover:bg-muted/50',
                'transition-colors'
            )}
        >
            {children({ attributes, listeners })}
        </tr>
    );
};

export const ReportList = ({
    reportList,
    title,
    typeId,
    selectedIds,
    downloadingFormId,
    onToggleSelect,
    onSetSelectedIds,
    onDownloadReport,
    onNavigateToReport,
    onDragEnd,
    t,
}: ReportListProps) => {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        })
    );

    if (reportList.length === 0) return null;

    const nonSectionReports = reportList.filter(f => !f.report_form?.section_name);
    const allNonSectionsSelected = nonSectionReports.length > 0 && nonSectionReports.every(f => {
        const fid = f.form_id || f.report_form?.id;
        return fid && selectedIds.has(fid);
    });

    const handleSelectAll = () => {
        const newSelected = new Set(selectedIds);
        reportList.forEach(f => {
            if (f.report_form?.section_name) return;
            const fid = f.form_id || f.report_form?.id;
            if (fid) {
                if (allNonSectionsSelected) newSelected.delete(fid);
                else newSelected.add(fid);
            }
        });
        onSetSelectedIds(newSelected);
    };

    return (
        <div className="bg-card shadow rounded-lg overflow-hidden border border-border">
            <div className="px-4 sm:px-6 py-4 border-b border-border bg-muted/30">
                <h2 className="text-lg font-medium text-foreground">{title} ({reportList.length})</h2>
            </div>

            {/* Mobile Card View */}
            <div className="block md:hidden divide-y divide-border">
                {reportList.map((item, index) => {
                    const formId = item.form_id || item.report_form?.id;
                    const isSelected = formId ? selectedIds.has(formId) : false;
                    const displayOrdinal = item.ordinal && item.ordinal > 0 ? item.ordinal : index + 1;

                    if (item.report_form && item.report_form.section_name) {
                        return (
                            <div key={item.id} className="p-4 bg-muted/50 border-b border-border">
                                <div className="flex items-center gap-3">
                                    <div className="pt-1">
                                        <input
                                            type="checkbox"
                                            className="rounded border-input text-primary focus:ring-ring h-5 w-5"
                                            checked={isSelected}
                                            onChange={() => formId && onToggleSelect(formId)}
                                        />
                                    </div>
                                    <div className="flex-1 text-center">
                                        <h3 className="font-bold text-lg text-foreground">
                                            {item.report_form.section_name}
                                        </h3>
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div key={item.id} className="p-4 space-y-3 bg-card">
                            <div className="flex items-start gap-3">
                                <div className="pt-1 w-5"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="text-xs font-medium text-muted-foreground">#{displayOrdinal}</span>
                                            <div className="font-medium text-foreground">
                                                {item.type_id === 1 ? t('exportDetails.water') : t('exportDetails.air')} {t('exportDetails.report')}
                                            </div>
                                        </div>
                                        <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${item.report_form?.satisfies
                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                                            }`}>
                                            {item.report_form?.satisfies ? t('common.yes') : t('common.no')}
                                        </span>
                                    </div>

                                    <div className="text-sm text-muted-foreground">
                                        <span className="font-medium">{t('exportDetails.dionica')}:</span> {item.report_form?.dionica || item.report_form?.stock || '-'}
                                    </div>

                                    <div className="flex justify-end gap-2 pt-2">
                                        <button
                                            onClick={() => formId && onNavigateToReport(formId, item.type_id)}
                                            disabled={!formId}
                                            className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-border rounded-md text-sm font-medium text-foreground hover:bg-accent transition-colors disabled:opacity-50"
                                        >
                                            <Pencil className="h-4 w-4 mr-2" /> {t('exportDetails.edit')}
                                        </button>
                                        <button
                                            onClick={() => formId && onDownloadReport(formId)}
                                            disabled={!formId || downloadingFormId === formId}
                                            className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-border rounded-md text-sm font-medium text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
                                        >
                                            {downloadingFormId === formId ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <Download className="h-4 w-4 mr-2" /> {t('exportDetails.download')}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Desktop Table View */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => onDragEnd(e, typeId)}>
                <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="w-10 px-6 py-3">
                                    <input
                                        type="checkbox"
                                        className="rounded border-input text-primary focus:ring-ring"
                                        checked={allNonSectionsSelected}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th className="w-10 px-6 py-3"></th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    {t('exportDetails.ordinal')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    {t('exportDetails.type')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    {t('exportDetails.satisfies')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    {t('exportDetails.dionica')}
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    {t('exportDetails.action')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-border">
                            <SortableContext items={reportList.map(r => r.form_id || r.report_form?.id || '')} strategy={verticalListSortingStrategy}>
                                {reportList.map((item, index) => {
                                    const formId = item.form_id || item.report_form?.id;
                                    const isSelected = formId ? selectedIds.has(formId) : false;
                                    const displayOrdinal = item.ordinal && item.ordinal > 0 ? item.ordinal : index + 1;

                                    if (item.report_form && item.report_form.section_name) {
                                        return (
                                            <SortableRow key={item.id} item={item}>
                                                {({ attributes, listeners }) => (
                                                    <>
                                                        <td className="px-6 py-4 whitespace-nowrap"></td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-muted-foreground cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
                                                            <GripVertical className="h-4 w-4" />
                                                        </td>
                                                        <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-center">
                                                            <span className="font-bold text-lg text-foreground">
                                                                {item.report_form?.section_name}
                                                            </span>
                                                        </td>
                                                    </>
                                                )}
                                            </SortableRow>
                                        );
                                    }

                                    return (
                                        <SortableRow key={item.id} item={item}>
                                            {({ attributes, listeners }) => (
                                                <>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <input
                                                            type="checkbox"
                                                            className="rounded border-input text-primary focus:ring-ring"
                                                            checked={isSelected}
                                                            onChange={() => formId && onToggleSelect(formId)}
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-muted-foreground cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
                                                        <GripVertical className="h-4 w-4" />
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                                        #{displayOrdinal}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                                        {item.type_id === 1 ? t('exportDetails.water') : t('exportDetails.air')}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.report_form?.satisfies
                                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                                                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                                                            }`}>
                                                            {item.report_form?.satisfies ? t('common.yes') : t('common.no')}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                                        {item.report_form?.dionica || item.report_form?.stock || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                                        <button
                                                            onClick={() => formId && onNavigateToReport(formId, item.type_id)}
                                                            disabled={!formId}
                                                            className="text-muted-foreground hover:text-foreground inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                            title={t('exportDetails.edit')}
                                                        >
                                                            <Pencil className="h-4 w-4 mr-1" /> {t('exportDetails.edit')}
                                                        </button>
                                                        <button
                                                            onClick={() => formId && onDownloadReport(formId)}
                                                            disabled={!formId || downloadingFormId === formId}
                                                            className="text-primary hover:text-primary/80 inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                        >
                                                            {downloadingFormId === formId ? (
                                                                <>
                                                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" /> {t('exportDetails.downloading')}
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Download className="h-4 w-4 mr-1" /> {t('exportDetails.download')}
                                                                </>
                                                            )}
                                                        </button>
                                                    </td>
                                                </>
                                            )}
                                        </SortableRow>
                                    );
                                })}
                            </SortableContext>
                        </tbody>
                    </table>
                </div>
            </DndContext>
        </div>
    );
};
