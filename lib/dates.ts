import { DateTime } from 'luxon';

export const getFullMonthDate = (date: Date) => DateTime.fromJSDate(date).toFormat('DDD');

export const getFullMonthDateFromString = (date: string) => getFullMonthDate(new Date(date));
