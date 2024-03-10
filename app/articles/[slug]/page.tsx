import { notFound } from 'next/navigation';
import { NewsletterSection } from '@/components/newsletter-section';
import { getArticleMetadataBySlug } from '@/lib/article-metadata/metadata.server';
import { SummaryPanel } from '@/components/article-metadata/summary-panel';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CalendarDaysIcon, NotebookTextIcon, User2Icon, UserIcon } from 'lucide-react';
import { ActionBar } from '../components/action-bar';
import { ActionBarContainer } from './components/action-bar-container';

type Props = {
  params: { slug: string };
};

export default async function ArticleDetails({ params }: Props) {
  const article = await getArticleMetadataBySlug(params.slug);

  if (!article) {
    return notFound();
  }

  const categoryGroups: string[] = Array.from(new Set(article.categories.map(({ category }) => category.group_name)));
  const link = article.links.find(({ link }) => link.title === 'pdf')?.link.href;

  return (
    <div className="flex flex-col px-8 py-12 sm:py-16 md:px-20 gap-4">
      <h1 className="text-2xl font-semibold">{article.title}</h1>

      <div className="flex flex-col gap-2">
        <div className="flex flex-row gap-4 ">
          <div>
            <CalendarDaysIcon size={20} />
          </div>
          <span>{`${article.published}`}</span>
        </div>

        <div className="flex flex-row gap-4">
          <div>
            <User2Icon size={20} />
          </div>
          <span>{`${article.authors.map(({ author }) => author.name).join(', ')}`}</span>
        </div>
      </div>

      <div className="gap-2">
        {categoryGroups.map((group) => (
          <Badge className={cn('m-1 cursor-pointer')} key={group}>
            {group}
          </Badge>
        ))}
        {article.categories.map(({ category }) => (
          <Badge key={category.short_name} className={'m-1 cursor-pointer'} variant={'secondary'}>
            {category.full_name}
          </Badge>
        ))}
      </div>

      <span className="text-base text-slate-600">{article.abstract}</span>

      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer">
          <div className=" flex items-center space-x-4 rounded-md border p-4">
            <NotebookTextIcon size={20} />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium leading-none">Read the research paper</p>
            </div>
          </div>
        </a>
      ) : null}

      <SummaryPanel>{article.generated_summary}</SummaryPanel>

      <ActionBarContainer>
        <ActionBar
          size="large"
          articleId={article.id}
          articleTitle={article.title}
          articleText={article.abstract.slice(0, 120)}
          articleSlug={article.slug}
        />
      </ActionBarContainer>

      <NewsletterSection />
    </div>
  );
}
