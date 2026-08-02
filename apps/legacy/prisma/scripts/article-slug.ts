import { prismaClient } from '../../lib/prisma';
import { slugify } from '../../lib/utils';

const addSlugsToArticles = async () => {
  const articles = await prismaClient.article_metadata.findMany({
    select: {
      id: true,
      title: true,
    },
  });

  for (const article of articles) {
    const slug = slugify(article.title);
    await prismaClient.article_metadata.update({
      where: {
        id: article.id,
      },
      data: {
        slug,
      },
    });
  }
};

addSlugsToArticles();
