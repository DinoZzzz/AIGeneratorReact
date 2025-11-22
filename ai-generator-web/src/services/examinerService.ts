import type { Examiner, ReportType } from '../types';

const MOCK_REPORT_TYPES: ReportType[] = [
    { id: 1, type: 'Water' },
    { id: 2, type: 'Air' }
];

// Mock data based on C# SeedDataProvider
let MOCK_EXAMINERS: Examiner[] = [
    {
        id: '1',
        name: 'Antonia',
        lastName: 'Examiner',
        username: 'admin',
        title: 'Ing.',
        isAdmin: true,
        accreditations: [1, 2]
    },
    {
        id: '2',
        name: 'Dario',
        lastName: 'Inspector',
        username: 'debug',
        title: 'Tech',
        isAdmin: false,
        accreditations: [1]
    },
    {
        id: '3',
        name: 'Maja',
        lastName: 'Fieldtech',
        username: 'field',
        title: '',
        isAdmin: false,
        accreditations: [2]
    }
];

export const examinerService = {
    async getExaminers(): Promise<Examiner[]> {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        return [...MOCK_EXAMINERS];
    },

    async getReportTypes(): Promise<ReportType[]> {
        return MOCK_REPORT_TYPES;
    },

    async saveExaminer(examiner: Partial<Examiner>): Promise<Examiner> {
        await new Promise(resolve => setTimeout(resolve, 500));

        if (examiner.id) {
            // Update
            const index = MOCK_EXAMINERS.findIndex(e => e.id === examiner.id);
            if (index !== -1) {
                MOCK_EXAMINERS[index] = { ...MOCK_EXAMINERS[index], ...examiner } as Examiner;
                return MOCK_EXAMINERS[index];
            }
            throw new Error('Examiner not found');
        } else {
            // Create
            const newExaminer = {
                ...examiner,
                id: Math.random().toString(36).substr(2, 9),
            } as Examiner;
            MOCK_EXAMINERS.push(newExaminer);
            return newExaminer;
        }
    },

    async deleteExaminer(id: string): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, 500));
        MOCK_EXAMINERS = MOCK_EXAMINERS.filter(e => e.id !== id);
    }
};
