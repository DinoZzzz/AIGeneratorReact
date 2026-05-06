import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Trash2, FileDown, Pencil, Type, GripVertical, Copy } from 'lucide-react';
import clsx from 'clsx';
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent, DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ReportForm } from '../../../types';

interface ReportsTableProps {
    title: string;
    reports: ReportForm[];
    filteredReports: ReportForm[];
    selectedIds: Set<string>;
    customerId: string;
    constructionId: string;
    onToggleSelect: (id: string) => void;
    onSetSelectedIds: (ids: Set<string>) => void;
    onDelete: (id: string) => void;
    onDuplicate: (report: ReportForm) => void;
    onExportPDF: (report: ReportForm) => void;
    onUpdateSectionName: (id: string, currentName: string) => void;
    onDragEnd: (event: DragEndEvent) => void;
    t: (key: string) => string;
}

const SortableRow = ({ report, children }: { report: ReportForm; children: (props: { attributes: DraggableAttributes; listeners: DraggableSyntheticListeners }) => React.ReactNode }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: report.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const isSection = report.section_name && !report.draft_id;

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

export const ReportsTable = ({
    title,
    filteredReports,
    selectedIds,
    customerId,
    constructionId,
    onToggleSelect,
    onSetSelectedIds,
    onDelete,
    onDuplicate,
    onExportPDF,
    onUpdateSectionName,
    onDragEnd,
    t,
}: ReportsTableProps) => {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        })
    );

    const getReportEditPath = (report: ReportForm) => {
        return report.type_id === 1
            ? `/customers/${customerId}/constructions/${constructionId}/reports/${report.id}`
            : `/customers/${customerId}/constructions/${constructionId}/reports/air/${report.id}`;
    };

    const nonSectionReports = filteredReports.filter(r => !r.section_name);
    const allNonSectionsSelected = nonSectionReports.length > 0 && nonSectionReports.every(r => r.id && selectedIds.has(r.id));

    const handleSelectAll = () => {
        const newSelected = new Set(selectedIds);
        filteredReports.forEach(r => {
            if (r.section_name) return;
            if (r.id) {
                if (allNonSectionsSelected) newSelected.delete(r.id);
                else newSelected.add(r.id);
            }
        });
        onSetSelectedIds(newSelected);
    };

    return (
        <div className="bg-card shadow rounded-lg overflow-hidden border border-border">
            <div className="px-6 py-4 border-b border-border bg-muted/30">
                <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            </div>

            {/* Mobile Card View */}
            <div className="block md:hidden divide-y divide-border">
                {filteredReports.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center">
                            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                            <p className="text-lg font-medium text-foreground">{t('reports.noData')}</p>
                        </div>
                    </div>
                ) : (
                    filteredReports.map((report) => {
                        const isSection = report.section_name && !report.draft_id;

                        if (isSection) {
                            return (
                                <div
                                    key={report.id}
                                    className="p-4 bg-muted/30 border-l-4 border-primary flex justify-between items-center"
                                >
                                    <div className="font-bold text-foreground">{report.section_name}</div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => report.section_name && onUpdateSectionName(report.id, report.section_name)}
                                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => report.id && onDelete(report.id)}
                                            className="p-2 text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div
                                key={report.id}
                                className={clsx(
                                    "p-4 space-y-3 transition-colors",
                                    report.id && selectedIds.has(report.id) ? "bg-primary/5" : ""
                                )}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center space-x-3">
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                className="rounded border-input text-primary focus:ring-ring h-5 w-5"
                                                checked={report.id ? selectedIds.has(report.id) : false}
                                                onChange={() => report.id && onToggleSelect(report.id)}
                                                aria-label={t('reports.selectReport')}
                                            />
                                        </div>
                                        <div>
                                            <div className="font-medium text-foreground">
                                                {report.type_id === 1 ? report.draft?.name || '-' : `${t('reports.air')} - ${report.draft?.name || '-'}`}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {new Date(report.examination_date).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                    <span className={clsx(
                                        "px-2.5 py-0.5 inline-flex text-xs font-medium rounded-full",
                                        report.satisfies
                                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                    )}>
                                        {report.satisfies ? t('reports.satisfies') : t('reports.failed')}
                                    </span>
                                </div>

                                <div className="pl-8 space-y-1">
                                    <div className="text-sm text-foreground font-medium">
                                        {t('reports.dionica')}: {report.dionica || report.stock || '-'}
                                    </div>
                                </div>

                                <div className="pl-8 flex justify-end space-x-2 pt-2">
                                    <button
                                        onClick={() => onExportPDF(report)}
                                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
                                        title={t('reports.exportPdf')}
                                    >
                                        <FileDown className="h-4 w-4" />
                                    </button>
                                    <Link
                                        to={getReportEditPath(report)}
                                        className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors"
                                        title={t('reports.edit')}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Link>
                                    <button
                                        onClick={() => onDuplicate(report)}
                                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
                                        title={t('reports.duplicate') || 'Duplicate'}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => report.id && onDelete(report.id)}
                                        className="p-2 text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                                        title={t('reports.delete')}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Desktop Table View */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted/50 sticky top-0 z-10">
                            <tr>
                                <th className="w-10 px-6 py-3">
                                    <input
                                        type="checkbox"
                                        className="rounded border-input text-primary focus:ring-ring"
                                        checked={allNonSectionsSelected}
                                        onChange={handleSelectAll}
                                        aria-label={`Select all ${title} reports`}
                                    />
                                </th>
                                <th className="w-10 px-6 py-3"></th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('reports.date')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('reports.dionica')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('reports.draft')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('reports.status')}</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('reports.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-border">
                            <SortableContext items={filteredReports.map(r => r.id)} strategy={verticalListSortingStrategy}>
                                {filteredReports.map((report) => {
                                    const isSection = report.section_name && !report.draft_id;

                                    if (isSection) {
                                        return (
                                            <SortableRow key={report.id} report={report}>
                                                {({ attributes, listeners }) => (
                                                    <>
                                                        <td className="w-10 px-6 py-4" {...attributes} {...listeners}>
                                                            <GripVertical className="h-5 w-5 text-muted-foreground/50 cursor-grab active:cursor-grabbing" />
                                                        </td>
                                                        <td colSpan={5} className="px-6 py-4">
                                                            <div className="flex items-center justify-center font-bold text-foreground">
                                                                <Type className="h-4 w-4 mr-2 text-muted-foreground" />
                                                                {report.section_name}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                                            <button
                                                                onClick={() => report.section_name && onUpdateSectionName(report.id, report.section_name)}
                                                                className="text-muted-foreground hover:text-foreground inline-flex items-center"
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => report.id && onDelete(report.id)}
                                                                className="text-destructive hover:text-destructive/80 inline-flex items-center"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </td>
                                                    </>
                                                )}
                                            </SortableRow>
                                        );
                                    }

                                    return (
                                        <SortableRow key={report.id} report={report}>
                                            {({ attributes, listeners }) => (
                                                <>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <input
                                                            type="checkbox"
                                                            className="rounded border-input text-primary focus:ring-ring"
                                                            checked={report.id ? selectedIds.has(report.id) : false}
                                                            onChange={() => report.id && onToggleSelect(report.id)}
                                                            aria-label={`${t('reports.selectReport')} ${report.draft?.name || ''} - ${new Date(report.examination_date).toLocaleDateString()}`}
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-muted-foreground cursor-grab active:cursor-grabbing" {...attributes} {...listeners} aria-label={t('reports.dragToReorder')}>
                                                        <GripVertical className="h-5 w-5" />
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                                        {new Date(report.examination_date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground font-medium">
                                                        {report.dionica || report.stock || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                                        {report.draft?.name || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={clsx(
                                                            "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                                                            report.satisfies
                                                                ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                                                                : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400"
                                                        )}>
                                                            {report.satisfies ? t('reports.satisfies') : t('reports.failed')}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                                        <button
                                                            onClick={() => onExportPDF(report)}
                                                            className="text-muted-foreground hover:text-foreground inline-flex items-center action-link"
                                                            title={t('reports.exportPdf')}
                                                        >
                                                            <FileDown className="h-4 w-4" />
                                                        </button>
                                                        <Link
                                                            to={getReportEditPath(report)}
                                                            className="text-primary hover:text-primary/80 inline-flex items-center action-link"
                                                            title={t('reports.edit')}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Link>
                                                        <button
                                                            onClick={() => onDuplicate(report)}
                                                            className="text-muted-foreground hover:text-foreground inline-flex items-center action-link"
                                                            title={t('reports.duplicate') || 'Duplicate'}
                                                        >
                                                            <Copy className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => report.id && onDelete(report.id)}
                                                            className="text-destructive hover:text-destructive/80 inline-flex items-center action-link"
                                                            title={t('reports.delete')}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </td>
                                                </>
                                            )}
                                        </SortableRow>
                                    );
                                })}
                            </SortableContext>
                            {filteredReports.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-4 text-center text-sm text-muted-foreground">
                                        {t('reports.noData')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </DndContext>
        </div>
    );
};
