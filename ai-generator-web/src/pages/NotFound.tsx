import { Link } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useLanguage } from '../context/LanguageContext';

export const NotFound = () => {
    const { language } = useLanguage();

    const isHr = language === 'hr';

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 space-y-6">
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                <AlertTriangle className="h-10 w-10 text-muted-foreground" />
            </div>

            <div className="space-y-2">
                <h1 className="text-4xl font-bold text-foreground">404</h1>
                <p className="text-lg text-muted-foreground max-w-md">
                    {isHr
                        ? 'Stranica koju tražite ne postoji ili je premještena.'
                        : 'The page you are looking for doesn\'t exist or has been moved.'}
                </p>
            </div>

            <Link to="/">
                <Button size="lg">
                    <Home className="h-4 w-4 mr-2" />
                    {isHr ? 'Povratak na početnu' : 'Back to Home'}
                </Button>
            </Link>
        </div>
    );
};
