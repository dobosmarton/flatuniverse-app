export const getStartOfWeek = (date: Date) => {
  // Calculate the difference between the date's day of the month and its day of the week
  var diff = date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1);

  const _date = new Date();
  _date.setDate(diff);
  _date.setHours(0, 0, 0, 0);

  // Set the date to the start of the week by setting it to the calculated difference
  return _date;
};

export const getFromEmail = (): string => {
  const fromEmail = process.env.POSTMARK_FROM_EMAIL;
  if (!fromEmail) {
    throw new Error('POSTMARK_FROM_EMAIL is not set!');
  }
  return fromEmail;
};
