import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { format, parseISO } from 'date-fns';
import { getArticleMetadataBySlug } from '@/lib/article-metadata/metadata.server';

// Image generation
export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl?.searchParams.get('slug');

    if (!slug) {
      return new Response('Slug is required', { status: 400 });
    }

    const article = await getArticleMetadataBySlug(slug);

    if (!article) {
      return new Response('Article not found', { status: 404 });
    }

    const date = article.published;

    return new ImageResponse(
      (
        // ImageResponse JSX element
        <div
          style={{
            background: 'linear-gradient(45deg, rgba(59, 178, 93, 0.20) 0%, rgba(59, 121, 178, 0.20) 100%)',
            display: 'flex',
            height: '100%',
            width: '100%',
            alignItems: 'flex-start',
            flexDirection: 'column',
            justifyContent: 'space-between',
            letterSpacing: '-.02em',
            padding: '64px 48px',
            color: '#222',
          }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              width: 'auto',
              maxWidth: '70%',
            }}>
            <p
              style={{
                fontWeight: 'bold',
                fontSize: '48px',
                lineHeight: 1.1,
              }}>
              {article.title}
            </p>

            <p
              style={{
                fontSize: '20px',
              }}>
              {article.abstract.slice(0, 260)}
            </p>

            <p
              style={{
                fontSize: '20px',
              }}>
              {format(parseISO(date.toDateString()), 'LLLL d, yyyy')}
            </p>
          </div>
        </div>
      ),
      // ImageResponse options
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    return new Response('Failed to generate OG Image', { status: 500 });
  }
}
