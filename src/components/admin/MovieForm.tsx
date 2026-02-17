'use client';

import { useEffect, useRef } from 'react';
import { useForm, useFieldArray, UseFormRegister, FieldErrors } from 'react-hook-form';
import Link from 'next/link';
import { Movie } from '@/types/movie';
import * as XLSX from 'xlsx';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    HiOutlineArrowLeft,
    HiOutlinePlus,
    HiOutlineTrash,
    HiOutlineFilm,
    HiOutlineArrowUpTray,
    HiOutlineBarsArrowDown,
} from 'react-icons/hi2';

export interface EpisodeInput {
    title: string;
    driveId: string;
}

export interface MovieFormData {
    title: string;
    posterUrl: string;
    backdropUrl: string;
    description: string;
    category: 'movie' | 'series';
    isCompleted: boolean;
    episodes: EpisodeInput[];
}

interface MovieFormProps {
    initialData?: Movie;
    onSubmit: (data: MovieFormData) => Promise<void>;
    submitting: boolean;
}

/* ─── Sortable Episode Row ─────────────────────────────────────── */

interface SortableEpisodeRowProps {
    id: string;
    index: number;
    category: string;
    episodeTitle: string;
    register: UseFormRegister<MovieFormData>;
    errors: FieldErrors<MovieFormData>;
    onRemove: () => void;
    disableRemove: boolean;
}

function SortableEpisodeRow({
    id,
    index,
    category,
    episodeTitle,
    register,
    errors,
    onRemove,
    disableRemove,
}: SortableEpisodeRowProps) {
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
        zIndex: isDragging ? 50 : undefined,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-start gap-3 p-3 bg-white/[0.02] border rounded-xl group ${isDragging ? 'border-purple-500/40 shadow-lg shadow-purple-500/10' : 'border-white/5'
                }`}
        >
            {/* Drag Handle (6 dots) */}
            <button
                type="button"
                {...attributes}
                {...listeners}
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center mt-0.5 cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-300 transition-colors touch-none"
                title="Drag to reorder"
            >
                <svg width="14" height="18" viewBox="0 0 14 18" fill="currentColor">
                    <circle cx="4" cy="3" r="1.5" />
                    <circle cx="10" cy="3" r="1.5" />
                    <circle cx="4" cy="9" r="1.5" />
                    <circle cx="10" cy="9" r="1.5" />
                    <circle cx="4" cy="15" r="1.5" />
                    <circle cx="10" cy="15" r="1.5" />
                </svg>
            </button>

            {/* Episode number indicator */}
            <div className="flex-shrink-0 w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center mt-0.5">
                <span className="text-zinc-500 text-xs font-mono">{index + 1}</span>
            </div>

            {/* Episode Title */}
            <div className="flex-1 min-w-0 group/ep relative">
                <input
                    {...register(`episodes.${index}.title` as const, {
                        required: 'Episode title is required',
                    })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                    placeholder={category === 'movie' ? 'Full Movie' : `Episode ${index + 1}`}
                />
                {episodeTitle && (
                    <div className="absolute left-0 bottom-full mb-2 z-50 max-w-[280px] px-3 py-2 rounded-lg bg-zinc-800/95 backdrop-blur-sm border border-white/10 shadow-xl shadow-black/40 text-white text-xs font-medium leading-relaxed opacity-0 invisible group-hover/ep:opacity-100 group-hover/ep:visible transition-all duration-200 pointer-events-none whitespace-normal break-words">
                        {episodeTitle}
                        <div className="absolute -bottom-1 left-4 w-2 h-2 bg-zinc-800/95 border-r border-b border-white/10 rotate-45" />
                    </div>
                )}
                {errors.episodes?.[index]?.title && (
                    <p className="text-red-400 text-xs mt-1">
                        {errors.episodes[index]?.title?.message}
                    </p>
                )}
            </div>

            {/* Drive ID */}
            <div className="flex-1 min-w-0">
                <input
                    {...register(`episodes.${index}.driveId` as const, {
                        required: 'Drive ID is required',
                    })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-mono"
                    placeholder="Google Drive File ID"
                />
                {errors.episodes?.[index]?.driveId && (
                    <p className="text-red-400 text-xs mt-1">
                        {errors.episodes[index]?.driveId?.message}
                    </p>
                )}
            </div>

            {/* Delete Button */}
            <button
                type="button"
                onClick={onRemove}
                disabled={disableRemove}
                className="flex-shrink-0 p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed mt-0.5"
                title="Remove episode"
            >
                <HiOutlineTrash className="w-4 h-4" />
            </button>
        </div>
    );
}

/**
 * Reusable movie/series form component.
 * Works in both Create and Edit modes based on whether `initialData` is provided.
 */
export default function MovieForm({ initialData, onSubmit, submitting }: MovieFormProps) {
    const isEditMode = !!initialData;

    const form = useForm<MovieFormData>({
        defaultValues: {
            title: '',
            posterUrl: '',
            backdropUrl: '',
            description: '',
            category: 'movie',
            isCompleted: true,
            episodes: [{ title: 'Full Movie', driveId: '' }],
        },
    });

    const {
        register,
        control,
        handleSubmit,
        watch,
        reset,
        getValues,
        setValue,
        formState: { errors },
    } = form;

    const { fields, append, remove, move } = useFieldArray({
        control,
        name: 'episodes',
    });

    const category = watch('category');
    const fileInputRef = useRef<HTMLInputElement>(null);

    /**
     * Handle Excel file import for bulk episode addition.
     * Expects 2 columns: episode title & Google Drive ID.
     * Supports headers: Title/Tên tập (col 1), Drive ID/ID (col 2).
     */
    const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = new Uint8Array(evt.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

                if (rows.length === 0) {
                    alert('File Excel trống hoặc không đúng định dạng.');
                    return;
                }

                // Detect column names flexibly
                const headers = Object.keys(rows[0]);
                const titleKey = headers.find((h) =>
                    /^(title|tên\s*tập|ten\s*tap|episode|ep)/i.test(h.trim())
                ) ?? headers[0];
                const driveIdKey = headers.find((h) =>
                    /^(drive\s*id|id|driveid|drive)/i.test(h.trim())
                ) ?? headers[1];

                if (!titleKey || !driveIdKey) {
                    alert('Không tìm thấy cột "Tên tập" và "ID". Vui lòng kiểm tra lại file.');
                    return;
                }

                const episodes: EpisodeInput[] = rows
                    .filter((row) => String(row[titleKey]).trim() && String(row[driveIdKey]).trim())
                    .map((row) => ({
                        title: String(row[titleKey]).trim(),
                        driveId: String(row[driveIdKey]).trim(),
                    }));

                if (episodes.length === 0) {
                    alert('Không tìm thấy tập hợp lệ nào trong file.');
                    return;
                }

                // Append all parsed episodes
                episodes.forEach((ep) => append(ep));
                alert(`Đã nhập thành công ${episodes.length} tập!`);
            } catch (err) {
                console.error('Excel import error:', err);
                alert('Lỗi khi đọc file Excel. Vui lòng kiểm tra lại định dạng.');
            }
        };
        reader.readAsArrayBuffer(file);

        // Reset input so the same file can be re-selected
        e.target.value = '';
    };

    /**
     * Sort all episodes alphabetically by title (A → Z).
     */
    const handleSortByTitle = () => {
        const current = getValues('episodes');
        const sorted = [...current].sort((a, b) =>
            a.title.localeCompare(b.title, 'vi', { numeric: true, sensitivity: 'base' })
        );
        setValue('episodes', sorted);
    };

    // dnd-kit sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = fields.findIndex((f) => f.id === active.id);
            const newIndex = fields.findIndex((f) => f.id === over.id);
            if (oldIndex !== -1 && newIndex !== -1) {
                move(oldIndex, newIndex);
            }
        }
    };

    // Populate form when initialData is provided (Edit mode)
    useEffect(() => {
        if (initialData) {
            reset({
                title: initialData.title,
                posterUrl: initialData.posterUrl,
                backdropUrl: initialData.backdropUrl ?? '',
                description: initialData.description ?? '',
                category: initialData.category,
                isCompleted: initialData.isCompleted,
                episodes: initialData.episodes
                    .sort((a, b) => a.order - b.order)
                    .map((ep) => ({
                        title: ep.title,
                        driveId: ep.driveId,
                    })),
            });
        }
    }, [initialData, reset]);

    return (
        <div className="min-h-screen bg-zinc-950">
            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-xl bg-zinc-950/80 border-b border-white/5">
                <div className="max-w-3xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center h-14 gap-4">
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
                        >
                            <HiOutlineArrowLeft className="w-5 h-5" />
                            <span className="text-sm font-medium">Library</span>
                        </Link>
                        <div className="h-5 w-px bg-white/10" />
                        <h1 className="text-sm font-medium text-white">
                            {isEditMode ? 'Edit Title' : 'Add New Title'}
                        </h1>
                    </div>
                </div>
            </header>

            {/* Form */}
            <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    {/* --- Basic Info Section --- */}
                    <section className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                <HiOutlineFilm className="w-4 h-4 text-purple-400" />
                            </div>
                            <h2 className="text-lg font-semibold text-white">Basic Information</h2>
                        </div>

                        {/* Title */}
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-zinc-300 mb-2">
                                Title <span className="text-red-400">*</span>
                            </label>
                            <input
                                id="title"
                                {...register('title', { required: 'Title is required' })}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                                placeholder="e.g., Inception, Breaking Bad"
                            />
                            {errors.title && (
                                <p className="text-red-400 text-sm mt-1">{errors.title.message}</p>
                            )}
                        </div>

                        {/* Poster URL */}
                        <div>
                            <label htmlFor="posterUrl" className="block text-sm font-medium text-zinc-300 mb-2">
                                Poster URL <span className="text-red-400">*</span>
                            </label>
                            <input
                                id="posterUrl"
                                {...register('posterUrl', { required: 'Poster URL is required' })}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                                placeholder="https://image.tmdb.org/..."
                            />
                            {errors.posterUrl && (
                                <p className="text-red-400 text-sm mt-1">{errors.posterUrl.message}</p>
                            )}
                        </div>

                        {/* Backdrop URL */}
                        <div>
                            <label htmlFor="backdropUrl" className="block text-sm font-medium text-zinc-300 mb-2">
                                Backdrop URL <span className="text-zinc-500">(optional)</span>
                            </label>
                            <input
                                id="backdropUrl"
                                {...register('backdropUrl')}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                                placeholder="https://image.tmdb.org/..."
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-zinc-300 mb-2">
                                Description <span className="text-zinc-500">(optional)</span>
                            </label>
                            <textarea
                                id="description"
                                rows={3}
                                {...register('description')}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all resize-none"
                                placeholder="A brief description of the movie or series..."
                            />
                        </div>

                        {/* Category & Status */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="category" className="block text-sm font-medium text-zinc-300 mb-2">
                                    Category <span className="text-red-400">*</span>
                                </label>
                                <select
                                    id="category"
                                    {...register('category')}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                                >
                                    <option value="movie" className="bg-zinc-900">Movie</option>
                                    <option value="series" className="bg-zinc-900">Series</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="isCompleted" className="block text-sm font-medium text-zinc-300 mb-2">
                                    Status
                                </label>
                                <select
                                    id="isCompleted"
                                    {...register('isCompleted', { setValueAs: (v) => v === 'true' || v === true })}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                                >
                                    <option value="true" className="bg-zinc-900">Completed</option>
                                    <option value="false" className="bg-zinc-900">Ongoing</option>
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* --- Episodes Section --- */}
                    <section className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                                    <span className="text-indigo-400 text-sm font-bold">#</span>
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-white">
                                        {category === 'movie' ? 'Video Source' : 'Episodes'}
                                    </h2>
                                    <p className="text-zinc-500 text-xs mt-0.5">
                                        {category === 'movie'
                                            ? 'Add the Google Drive file ID for the movie'
                                            : 'Add Drive IDs for each episode'}
                                    </p>
                                </div>
                            </div>

                            {/* Actions: Sort + Import Excel + Add */}
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleSortByTitle}
                                    disabled={fields.length <= 1}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-sm font-medium rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Sort episodes A → Z"
                                >
                                    <HiOutlineBarsArrowDown className="w-4 h-4" />
                                    Sort
                                </button>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-sm font-medium rounded-lg transition-all"
                                >
                                    <HiOutlineArrowUpTray className="w-4 h-4" />
                                    Import
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={handleExcelImport}
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={() => append({ title: '', driveId: '' })}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 text-sm font-medium rounded-lg transition-all"
                                >
                                    <HiOutlinePlus className="w-4 h-4" />
                                    Add
                                </button>
                            </div>
                        </div>

                        {/* Validation: at least 1 episode */}
                        {fields.length === 0 && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                                <p className="text-red-400 text-sm">At least one episode is required.</p>
                            </div>
                        )}

                        {/* Episode Rows — Drag & Drop */}
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={fields.map((f) => f.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="space-y-3">
                                    {fields.map((field, index) => (
                                        <SortableEpisodeRow
                                            key={field.id}
                                            id={field.id}
                                            index={index}
                                            category={category}
                                            episodeTitle={watch(`episodes.${index}.title`)}
                                            register={register}
                                            errors={errors}
                                            onRemove={() => remove(index)}
                                            disableRemove={fields.length <= 1}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </section>

                    {/* Submit Button */}
                    <div className="flex items-center gap-4">
                        <button
                            type="submit"
                            disabled={submitting || fields.length === 0}
                            className="flex-1 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 active:scale-[0.98]"
                        >
                            {submitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    {isEditMode ? 'Saving...' : 'Adding...'}
                                </span>
                            ) : isEditMode ? (
                                'Save Changes'
                            ) : (
                                `Add ${category === 'movie' ? 'Movie' : 'Series'}`
                            )}
                        </button>

                        <Link
                            href="/"
                            className="px-6 py-3.5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/5 font-medium rounded-xl transition-all"
                        >
                            Cancel
                        </Link>
                    </div>
                </form>
            </main>
        </div>
    );
}
