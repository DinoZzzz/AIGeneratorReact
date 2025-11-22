import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Checkbox } from '../ui/Checkbox';
import type { Examiner, ReportType } from '../../types';
import { examinerService } from '../../services/examinerService';

interface ExaminerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    examiner: Examiner | null;
    onSave: (examiner: Partial<Examiner>) => Promise<void>;
}

export const ExaminerDialog = ({ open, onOpenChange, examiner, onSave }: ExaminerDialogProps) => {
    const [loading, setLoading] = useState(false);
    const [reportTypes, setReportTypes] = useState<ReportType[]>([]);
    const [formData, setFormData] = useState<Partial<Examiner>>({
        name: '',
        lastName: '',
        username: '',
        title: '',
        password: '',
        isAdmin: false,
        accreditations: []
    });

    useEffect(() => {
        loadReportTypes();
    }, []);

    useEffect(() => {
        if (open) {
            if (examiner) {
                setFormData({
                    id: examiner.id,
                    name: examiner.name,
                    lastName: examiner.lastName,
                    username: examiner.username,
                    title: examiner.title || '',
                    password: '', // Don't show password
                    isAdmin: examiner.isAdmin,
                    accreditations: examiner.accreditations
                });
            } else {
                setFormData({
                    name: '',
                    lastName: '',
                    username: '',
                    title: '',
                    password: '',
                    isAdmin: false,
                    accreditations: []
                });
            }
        }
    }, [open, examiner]);

    const loadReportTypes = async () => {
        const types = await examinerService.getReportTypes();
        setReportTypes(types);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.lastName || !formData.username || (!examiner && !formData.password)) {
            alert('Please fill in all required fields');
            return;
        }

        if (formData.accreditations?.length === 0) {
            alert('Please select at least one accreditation');
            return;
        }

        setLoading(true);
        try {
            await onSave(formData);
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            alert('Failed to save examiner');
        } finally {
            setLoading(false);
        }
    };

    const toggleAccreditation = (typeId: number) => {
        const current = formData.accreditations || [];
        const newAccreditations = current.includes(typeId)
            ? current.filter(id => id !== typeId)
            : [...current, typeId];

        setFormData({ ...formData, accreditations: newAccreditations });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{examiner ? 'Edit Examiner' : 'New Examiner'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">First Name</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                                id="lastName"
                                value={formData.lastName}
                                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                value={formData.username}
                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">{examiner ? 'New Password (leave blank to keep current)' : 'Password'}</Label>
                        <Input
                            id="password"
                            type="password"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            required={!examiner}
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="isAdmin"
                            checked={formData.isAdmin}
                            onCheckedChange={(checked) => setFormData({ ...formData, isAdmin: checked as boolean })}
                        />
                        <Label htmlFor="isAdmin">Administrator</Label>
                    </div>

                    <div className="space-y-2">
                        <Label>Accreditations</Label>
                        <div className="border rounded-md p-4 space-y-2 max-h-40 overflow-y-auto">
                            {reportTypes.map(type => (
                                <div key={type.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`type-${type.id}`}
                                        checked={formData.accreditations?.includes(type.id)}
                                        onCheckedChange={() => toggleAccreditation(type.id)}
                                    />
                                    <Label htmlFor={`type-${type.id}`}>{type.type}</Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end space-x-2 mt-6">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
