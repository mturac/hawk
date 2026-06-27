import Link from 'next/link';
import { cn, timeAgo, scoreColor } from '@/lib/utils';

interface ReviewCardProps {
  review: {
    id: number;
    pr_title: string;
    pr_url: string;
    pr_author: string;
    score: number | null;
    issues_found: number;
    status: string;
    created_at: string;
    repo_name: string;
  };
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <Link href={`/reviews/${review.id}`}>
      <div className="card group cursor-pointer transition-all hover:shadow-md">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className={cn(
                'badge',
                review.status === 'completed' ? 'badge-success' :
                review.status === 'failed' ? 'badge-error' :
                'badge-warning'
              )}>
                {review.status}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {review.repo_name}
              </span>
            </div>
            <h3 className="mt-2 truncate text-sm font-medium group-hover:text-brand-500">
              {review.pr_title}
            </h3>
            <div className="mt-2 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span>by {review.pr_author}</span>
              <span>{timeAgo(review.created_at)}</span>
            </div>
          </div>
          {review.status === 'completed' && review.score !== null && (
            <div className={cn('text-2xl font-bold', scoreColor(review.score))}>
              {review.score}
            </div>
          )}
        </div>
        {review.issues_found > 0 && (
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            {review.issues_found} issue{review.issues_found !== 1 ? 's' : ''} found
          </div>
        )}
      </div>
    </Link>
  );
}
