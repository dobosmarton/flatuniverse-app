'use server';

import { email_list, email_subscription } from '@prisma/client';
import { prismaClient } from '../prisma';
import * as templates from './templates';
import * as categoryService from '../categories/categories.server';
import { getFromEmail, getStartOfWeek } from './helpers';
import { constructQueryParams } from '../query-params';

export const subscribeToNewsletter = async (
  email: string,
  emailList: email_list = email_list.WEEKLY_SUMMARY
): Promise<email_subscription> => {
  const subscribed = await prismaClient.email_subscription.count({ where: { email, email_list: emailList } });

  if (subscribed) {
    throw new Error('Email already subscribed to the list!');
  }

  const subscription = await prismaClient.email_subscription.create({
    data: { email, email_list: emailList },
  });

  const fromEmail = getFromEmail();

  await templates.sendWelcomeEmail({
    from: fromEmail,
    to: email,
    productUrl: 'https://www.flatuniverse.app/',
    productName: 'Flat Universe',
  });

  return subscription;
};

export const sendWeeklySummaryEmail = async () => {
  const fromEmail = getFromEmail();

  const subscriptions = await prismaClient.email_subscription.findMany({
    where: { email_list: email_list.WEEKLY_SUMMARY },
    select: { email: true },
  });

  const categoryGroups = await categoryService.getCategoriesGroupedByNames(getStartOfWeek(new Date()), 0, 5);

  const formattedCategories = categoryGroups.map<templates.ArticleGroup>((group) => ({
    name: group.group_name,
    readMoreUrl: `https://www.flatuniverse.app?${constructQueryParams({
      categoryGroups: [group.group_name],
    })}`,
    articles: group.article_metadata_list
      .flatMap((metadata) => ({
        title: metadata.article_metadata.title,
        url: `https://www.flatuniverse.app/articles/${metadata.article_metadata.slug}`,
      }))
      .reduce<{ title: string; url: string }[]>((prev, curr) => {
        if (!prev.find((p) => p.title === curr.title)) {
          prev.push(curr);
        }

        return prev;
      }, []),
  }));

  await templates.sendWeeklySummaryEmail({
    from: fromEmail,
    to: subscriptions.map((s) => s.email),
    productUrl: 'https://www.flatuniverse.app/',
    productName: 'Flat Universe',
    articleGroups: formattedCategories,
  });
};
