import { timingSafeEqual } from 'node:crypto';

export const isAuthorizedRunRequest = (req, runToken) => {
  // Scheduled runs do not need a token; the public HTTP trigger always does.
  const headerToken = req.headers['x-run-token'];
  if (!runToken || typeof headerToken !== 'string') return false;
  const expected = Buffer.from(runToken);
  const supplied = Buffer.from(headerToken);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
};

export const formatDateTime = (isoValue) => {
  try {
    return new Intl.DateTimeFormat('hr-HR', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: 'Europe/Zagreb',
    }).format(new Date(isoValue));
  } catch {
    return isoValue;
  }
};
