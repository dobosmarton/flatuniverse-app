import { Articles } from './components/articles';

type Props = {
  searchParams: { [key: string]: string | string[] | undefined };
};

export default async function ArticlesPage({ searchParams }: Props) {
  return <Articles searchParams={searchParams} />;
}

// revalidate every 24 hours
export const revalidate = 3600 * 24;
