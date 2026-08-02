import { DateTime } from 'luxon';

export const getFullMonthDate = (date: Date) => DateTime.fromJSDate(date).toFormat('DDD', { locale: 'en' });

export const getFullMonthDateFromString = (date: string) => getFullMonthDate(new Date(date));
