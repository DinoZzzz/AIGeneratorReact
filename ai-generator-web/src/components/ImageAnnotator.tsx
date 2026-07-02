import { useRef, useState, useEffect, useCallback } from 'react';
import { Pencil, Square, Circle, ArrowUpRight, Type, Undo2, Redo2, Trash2, Save, X } from 'lucide-react';
import { Button } from './ui/Button';
import { useLanguage } from '../context/LanguageContext';
import { cn } from '../lib/utils';

type Tool = 'draw' | 'rectangle' | 'circle' | 'arrow' | 'text';

interface Point {
    x: number;
    y: number;
}

interface Annotation {
    tool: Tool;
    color: string;
    lineWidth: number;
    points?: Point[];
    start?: Point;
    end?: Point;
    text?: string;
}

interface ImageAnnotatorProps {
    imageUrl: string;
    onSave: (blob: Blob) => void;
    onCancel: () => void;
}

const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#000000', '#ffffff'];
const LINE_WIDTHS = [2, 4, 6];

export function ImageAnnotator({ imageUrl, onSave, onCancel }: ImageAnnotatorProps) {
    const { t } = useLanguage();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [tool, setTool] = useState<Tool>('draw');
    const [color, setColor] = useState('#ef4444');
    const [lineWidth, setLineWidth] = useState(4);
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const [redoStack, setRedoStack] = useState<Annotation[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(null);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

    // Load image
    useEffect(() => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            setImage(img);
        };
        img.src = imageUrl;
    }, [imageUrl]);

    // Resize canvas to fit container while maintaining aspect ratio
    useEffect(() => {
        if (!image || !containerRef.current) return;

        const updateSize = () => {
            const container = containerRef.current;
            if (!container) return;

            const maxWidth = container.clientWidth - 32; // padding
            const maxHeight = window.innerHeight - 200; // toolbar + actions
            const ratio = Math.min(maxWidth / image.width, maxHeight / image.height, 1);

            setCanvasSize({
                width: Math.floor(image.width * ratio),
                height: Math.floor(image.height * ratio),
            });
        };

        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, [image]);

    // Redraw canvas
    const redraw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !image) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Draw original image scaled to canvas size
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        // Draw all annotations
        const allAnnotations = currentAnnotation
            ? [...annotations, currentAnnotation]
            : annotations;

        for (const ann of allAnnotations) {
            ctx.strokeStyle = ann.color;
            ctx.fillStyle = ann.color;
            ctx.lineWidth = ann.lineWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            switch (ann.tool) {
                case 'draw':
                    if (ann.points && ann.points.length > 1) {
                        ctx.beginPath();
                        ctx.moveTo(ann.points[0].x, ann.points[0].y);
                        for (let i = 1; i < ann.points.length; i++) {
                            ctx.lineTo(ann.points[i].x, ann.points[i].y);
                        }
                        ctx.stroke();
                    }
                    break;

                case 'rectangle':
                    if (ann.start && ann.end) {
                        ctx.beginPath();
                        ctx.rect(
                            ann.start.x,
                            ann.start.y,
                            ann.end.x - ann.start.x,
                            ann.end.y - ann.start.y
                        );
                        ctx.stroke();
                    }
                    break;

                case 'circle':
                    if (ann.start && ann.end) {
                        const rx = Math.abs(ann.end.x - ann.start.x) / 2;
                        const ry = Math.abs(ann.end.y - ann.start.y) / 2;
                        const cx = ann.start.x + (ann.end.x - ann.start.x) / 2;
                        const cy = ann.start.y + (ann.end.y - ann.start.y) / 2;
                        ctx.beginPath();
                        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                    break;

                case 'arrow':
                    if (ann.start && ann.end) {
                        const dx = ann.end.x - ann.start.x;
                        const dy = ann.end.y - ann.start.y;
                        const angle = Math.atan2(dy, dx);
                        const headLen = 15;

                        ctx.beginPath();
                        ctx.moveTo(ann.start.x, ann.start.y);
                        ctx.lineTo(ann.end.x, ann.end.y);
                        ctx.stroke();

                        // Arrowhead
                        ctx.beginPath();
                        ctx.moveTo(ann.end.x, ann.end.y);
                        ctx.lineTo(
                            ann.end.x - headLen * Math.cos(angle - Math.PI / 6),
                            ann.end.y - headLen * Math.sin(angle - Math.PI / 6)
                        );
                        ctx.moveTo(ann.end.x, ann.end.y);
                        ctx.lineTo(
                            ann.end.x - headLen * Math.cos(angle + Math.PI / 6),
                            ann.end.y - headLen * Math.sin(angle + Math.PI / 6)
                        );
                        ctx.stroke();
                    }
                    break;

                case 'text':
                    if (ann.start && ann.text) {
                        const fontSize = Math.max(14, ann.lineWidth * 4);
                        ctx.font = `bold ${fontSize}px sans-serif`;
                        // Background for legibility
                        const metrics = ctx.measureText(ann.text);
                        const padding = 4;
                        ctx.fillStyle = ann.color === '#ffffff' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)';
                        ctx.fillRect(
                            ann.start.x - padding,
                            ann.start.y - fontSize - padding,
                            metrics.width + padding * 2,
                            fontSize + padding * 2
                        );
                        ctx.fillStyle = ann.color;
                        ctx.fillText(ann.text, ann.start.x, ann.start.y);
                    }
                    break;
            }
        }
    }, [image, annotations, currentAnnotation]);

    // Re-run on canvasSize changes too: resizing the <canvas> element clears
    // its bitmap, so everything must be repainted even though redraw() itself
    // doesn't read canvasSize.
    useEffect(() => {
        redraw();
    }, [redraw, canvasSize]);

    const getCanvasPoint = (e: React.MouseEvent | React.TouchEvent): Point => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top,
        };
    };

    const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
        const point = getCanvasPoint(e);

        if (tool === 'text') {
            const text = prompt(t('annotation.textPrompt'));
            if (text) {
                const ann: Annotation = { tool, color, lineWidth, start: point, text };
                setAnnotations(prev => [...prev, ann]);
                setRedoStack([]);
            }
            return;
        }

        setIsDrawing(true);
        if (tool === 'draw') {
            setCurrentAnnotation({ tool, color, lineWidth, points: [point] });
        } else {
            setCurrentAnnotation({ tool, color, lineWidth, start: point, end: point });
        }
    };

    const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !currentAnnotation) return;
        const point = getCanvasPoint(e);

        if (tool === 'draw') {
            setCurrentAnnotation(prev =>
                prev ? { ...prev, points: [...(prev.points || []), point] } : null
            );
        } else {
            setCurrentAnnotation(prev =>
                prev ? { ...prev, end: point } : null
            );
        }
    };

    const handlePointerUp = () => {
        if (!isDrawing || !currentAnnotation) return;
        setIsDrawing(false);
        setAnnotations(prev => [...prev, currentAnnotation]);
        setCurrentAnnotation(null);
        setRedoStack([]);
    };

    const undo = () => {
        if (annotations.length === 0) return;
        const last = annotations[annotations.length - 1];
        setAnnotations(prev => prev.slice(0, -1));
        setRedoStack(prev => [last, ...prev]);
    };

    const redo = () => {
        if (redoStack.length === 0) return;
        const first = redoStack[0];
        setRedoStack(prev => prev.slice(1));
        setAnnotations(prev => [...prev, first]);
    };

    const clearAll = () => {
        setAnnotations([]);
        setRedoStack([]);
    };

    const handleSave = () => {
        if (!image) return;
        // Create a full-resolution canvas for export
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = image.width;
        exportCanvas.height = image.height;
        const ctx = exportCanvas.getContext('2d');
        if (!ctx) return;

        // Draw original image at full resolution
        ctx.drawImage(image, 0, 0);

        // Scale factor from display canvas to full resolution
        const scaleX = image.width / canvasSize.width;
        const scaleY = image.height / canvasSize.height;

        // Draw annotations scaled to full resolution
        for (const ann of annotations) {
            ctx.strokeStyle = ann.color;
            ctx.fillStyle = ann.color;
            ctx.lineWidth = ann.lineWidth * scaleX;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            switch (ann.tool) {
                case 'draw':
                    if (ann.points && ann.points.length > 1) {
                        ctx.beginPath();
                        ctx.moveTo(ann.points[0].x * scaleX, ann.points[0].y * scaleY);
                        for (let i = 1; i < ann.points.length; i++) {
                            ctx.lineTo(ann.points[i].x * scaleX, ann.points[i].y * scaleY);
                        }
                        ctx.stroke();
                    }
                    break;

                case 'rectangle':
                    if (ann.start && ann.end) {
                        ctx.beginPath();
                        ctx.rect(
                            ann.start.x * scaleX,
                            ann.start.y * scaleY,
                            (ann.end.x - ann.start.x) * scaleX,
                            (ann.end.y - ann.start.y) * scaleY
                        );
                        ctx.stroke();
                    }
                    break;

                case 'circle':
                    if (ann.start && ann.end) {
                        const rx = Math.abs(ann.end.x - ann.start.x) / 2 * scaleX;
                        const ry = Math.abs(ann.end.y - ann.start.y) / 2 * scaleY;
                        const cx = (ann.start.x + (ann.end.x - ann.start.x) / 2) * scaleX;
                        const cy = (ann.start.y + (ann.end.y - ann.start.y) / 2) * scaleY;
                        ctx.beginPath();
                        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                    break;

                case 'arrow':
                    if (ann.start && ann.end) {
                        const sx = ann.start.x * scaleX;
                        const sy = ann.start.y * scaleY;
                        const ex = ann.end.x * scaleX;
                        const ey = ann.end.y * scaleY;
                        const dx = ex - sx;
                        const dy = ey - sy;
                        const angle = Math.atan2(dy, dx);
                        const headLen = 15 * scaleX;

                        ctx.beginPath();
                        ctx.moveTo(sx, sy);
                        ctx.lineTo(ex, ey);
                        ctx.stroke();

                        ctx.beginPath();
                        ctx.moveTo(ex, ey);
                        ctx.lineTo(ex - headLen * Math.cos(angle - Math.PI / 6), ey - headLen * Math.sin(angle - Math.PI / 6));
                        ctx.moveTo(ex, ey);
                        ctx.lineTo(ex - headLen * Math.cos(angle + Math.PI / 6), ey - headLen * Math.sin(angle + Math.PI / 6));
                        ctx.stroke();
                    }
                    break;

                case 'text':
                    if (ann.start && ann.text) {
                        const fontSize = Math.max(14, ann.lineWidth * 4) * scaleX;
                        ctx.font = `bold ${fontSize}px sans-serif`;
                        const metrics = ctx.measureText(ann.text);
                        const padding = 4 * scaleX;
                        ctx.fillStyle = ann.color === '#ffffff' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)';
                        ctx.fillRect(
                            ann.start.x * scaleX - padding,
                            ann.start.y * scaleY - fontSize - padding,
                            metrics.width + padding * 2,
                            fontSize + padding * 2
                        );
                        ctx.fillStyle = ann.color;
                        ctx.fillText(ann.text, ann.start.x * scaleX, ann.start.y * scaleY);
                    }
                    break;
            }
        }

        exportCanvas.toBlob(blob => {
            if (blob) onSave(blob);
        }, 'image/png');
    };

    const tools: { id: Tool; icon: typeof Pencil; label: string }[] = [
        { id: 'draw', icon: Pencil, label: t('annotation.draw') },
        { id: 'rectangle', icon: Square, label: t('annotation.rectangle') },
        { id: 'circle', icon: Circle, label: t('annotation.circle') },
        { id: 'arrow', icon: ArrowUpRight, label: t('annotation.arrow') },
        { id: 'text', icon: Type, label: t('annotation.text') },
    ];

    return (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
                <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-foreground mr-2">{t('annotation.title')}</h2>

                    {/* Tools */}
                    <div className="flex gap-1 border-r border-border pr-2">
                        {tools.map(t => (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setTool(t.id)}
                                className={cn(
                                    "p-2 rounded-md transition-colors",
                                    tool === t.id
                                        ? "bg-primary text-primary-foreground"
                                        : "hover:bg-muted text-muted-foreground"
                                )}
                                title={t.label}
                            >
                                <t.icon className="h-4 w-4" />
                            </button>
                        ))}
                    </div>

                    {/* Colors */}
                    <div className="flex gap-1 border-r border-border pr-2">
                        {COLORS.map(c => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => setColor(c)}
                                className={cn(
                                    "w-6 h-6 rounded-full border-2 transition-transform",
                                    color === c ? "border-primary scale-110" : "border-border"
                                )}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>

                    {/* Line width */}
                    <div className="flex gap-1 border-r border-border pr-2">
                        {LINE_WIDTHS.map(w => (
                            <button
                                key={w}
                                type="button"
                                onClick={() => setLineWidth(w)}
                                className={cn(
                                    "p-2 rounded-md transition-colors",
                                    lineWidth === w ? "bg-muted" : "hover:bg-muted/50"
                                )}
                                title={`${w}px`}
                            >
                                <div
                                    className="rounded-full bg-foreground"
                                    style={{ width: w * 2 + 4, height: w * 2 + 4 }}
                                />
                            </button>
                        ))}
                    </div>

                    {/* Undo/Redo */}
                    <div className="flex gap-1">
                        <button
                            type="button"
                            onClick={undo}
                            disabled={annotations.length === 0}
                            className="p-2 rounded-md hover:bg-muted disabled:opacity-30 text-muted-foreground"
                            title={t('annotation.undo')}
                        >
                            <Undo2 className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={redo}
                            disabled={redoStack.length === 0}
                            className="p-2 rounded-md hover:bg-muted disabled:opacity-30 text-muted-foreground"
                            title={t('annotation.redo')}
                        >
                            <Redo2 className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={clearAll}
                            disabled={annotations.length === 0}
                            className="p-2 rounded-md hover:bg-muted disabled:opacity-30 text-muted-foreground"
                            title={t('annotation.clear')}
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={onCancel}>
                        <X className="h-4 w-4 mr-1" />
                        {t('annotation.cancel')}
                    </Button>
                    <Button type="button" size="sm" onClick={handleSave} disabled={annotations.length === 0}>
                        <Save className="h-4 w-4 mr-1" />
                        {t('annotation.save')}
                    </Button>
                </div>
            </div>

            {/* Canvas area */}
            <div ref={containerRef} className="flex-1 flex items-center justify-center overflow-auto bg-muted/30 p-4">
                {canvasSize.width > 0 && (
                    <canvas
                        ref={canvasRef}
                        width={canvasSize.width}
                        height={canvasSize.height}
                        className="shadow-lg rounded cursor-crosshair touch-none"
                        onMouseDown={handlePointerDown}
                        onMouseMove={handlePointerMove}
                        onMouseUp={handlePointerUp}
                        onMouseLeave={handlePointerUp}
                        onTouchStart={handlePointerDown}
                        onTouchMove={handlePointerMove}
                        onTouchEnd={handlePointerUp}
                    />
                )}
            </div>
        </div>
    );
}
