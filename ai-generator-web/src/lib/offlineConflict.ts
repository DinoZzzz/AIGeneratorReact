export const isConflictErrorMessage = (message?: string): boolean => {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return (
    normalized.includes('conflict') ||
    normalized.includes('duplicate key') ||
    normalized.includes('already exists') ||
    normalized.includes('23505') ||
    normalized.includes('409')
  );
};

