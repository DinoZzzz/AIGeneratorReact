import { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, UserCheck, Lock } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ExaminerDialog } from '../components/examiners/ExaminerDialog';
import { examinerService } from '../services/examinerService';
import type { Profile, ReportType } from '../types';
import { useAuth } from '../context/AuthContext';

export const Examiners = () => {
    const { profile } = useAuth();
    const [examiners, setExaminers] = useState<Profile[]>([]);
    const [reportTypes, setReportTypes] = useState<ReportType[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedExaminer, setSelectedExaminer] = useState<Profile | null>(null);

    const isAdmin = profile?.role === 'admin';

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [examinersData, typesData] = await Promise.all([
                examinerService.getExaminers(),
                examinerService.getReportTypes()
            ]);
            setExaminers(examinersData);
            setReportTypes(typesData);
        } catch (error) {
            console.error('Failed to load examiners:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (examinerData: Partial<Profile>) => {
        await examinerService.saveExaminer(examinerData);
        await loadData();
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to remove this examiner?')) {
            await examinerService.deleteExaminer(id);
            await loadData();
        }
    };

    const openEdit = (examiner: Profile) => {
        setSelectedExaminer(examiner);
        setDialogOpen(true);
    };

    const openNew = () => {
        setSelectedExaminer(null);
        setDialogOpen(true);
    };

    const getAccreditationNames = (ids: number[]) => {
        if (!ids) return '';
        return ids
            .map(id => reportTypes.find(t => t.id === id)?.name)
            .filter(Boolean)
            .join(', ');
    };

    const filteredExaminers = examiners.filter(e =>
        (e.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (e.last_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (e.username?.toLowerCase() || '').includes(search.toLowerCase())
    );

    // Access control - only admins can view this page
    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <Lock className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                    <h2 className="text-2xl font-bold text-foreground mb-2">Access Denied</h2>
                    <p className="text-muted-foreground">
                        Only administrators can manage examiners.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Examiners</h1>
                    <p className="text-muted-foreground mt-1">Manage examiners and their accreditations.</p>
                </div>
                {isAdmin && (
                    <Button onClick={openNew}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Examiner
                    </Button>
                )}
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search examiners..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-card shadow-sm rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted/50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Full Name
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Username
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Email
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Accreditations
                                </th>
                                {isAdmin && (
                                    <th scope="col" className="relative px-6 py-3">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-border">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                        Loading...
                                    </td>
                                </tr>
                            ) : filteredExaminers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center">
                                            <UserCheck className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                            <p className="text-lg font-medium text-foreground">No examiners found</p>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Add examiners to manage their accreditations and assignments.
                                            </p>
                                            {isAdmin && (
                                                <Button onClick={openNew} variant="outline" className="mt-4">
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Add Examiner
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredExaminers.map((examiner) => (
                                    <tr key={examiner.id} className="hover:bg-muted/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-foreground">
                                                    {examiner.name} {examiner.last_name} {examiner.title}
                                                </span>
                                                {examiner.role === 'admin' && (
                                                    <span className="text-xs text-primary font-medium">Administrator</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                            {examiner.username}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                            {examiner.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                            {getAccreditationNames(examiner.accreditations)}
                                        </td>
                                        {isAdmin && (
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end space-x-2">
                                                    <Button variant="ghost" size="icon" onClick={() => openEdit(examiner)}>
                                                        <Pencil className="h-4 w-4 text-primary" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(examiner.id)}
                                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ExaminerDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                examiner={selectedExaminer}
                onSave={handleSave}
            />
        </div>
    );
};
