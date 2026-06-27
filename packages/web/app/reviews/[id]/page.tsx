'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Sidebar } from '@/components/sidebar';
import { apiFetch, cn, severityColor, scoreColor, timeAgo } from '@/lib/utils';

export default function ReviewDetailPage() {
  const params = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<any>(`/api/reviews/${params.id}`)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <main className="ml-64 flex-1 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </main>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex">
        <Sidebar />
        <main className="ml-64 flex-1 p-8">
          <div className="card text-center py-20">
            <p className="text-gray-500">Review not found</p>
            <Link href="/reviews" className="btn btn-secondary mt-4">Back to Reviews</Link>
          </div>
        </main>
      </div>
    );
  }

  const { review, comments } = data;
  const groupedComments = comments.reduce((acc: any, c: any) => {
    if (!acc[c.file_path]) acc[c.file_path] = [];
    acc[c.file_path].push(c);
    return acc;
  }, {});

  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-64 min-h-screen flex-1 p-8">
        <div className="mb-6">
          <Link href="/reviews" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            ← Back to Reviews
          </Link>
        </div>

        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className={cn(
                'badge',
                review.status === 'completed' ? 'badge-success' :
                review.status === 'failed' ? 'badge-error' : 'badge-warning'
              )}>
                {review.status}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {review.repo_name}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold">{review.pr_title}</h1>
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span>by {review.pr_author}</span>
              <span>{timeAgo(review.created_at)}</span>
              {review.llm_provider && (
                <span className="badge badge-info">{review.llm_provider}/{review.llm_model}</span>
              )}
            </div>
          </div>
          {review.score !== null && (
            <div className="text-right">
              <div className={cn('text-5xl font-bold', scoreColor(review.score))}>
                {review.score}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">/100</div>
            </div>
          )}
        </div>

        {review.summary && (
          <div className="card mb-8">
            <h2 className="mb-4 text-lg font-semibold">Summary</h2>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap text-sm">{review.summary}</pre>
            </div>
          </div>
        )}

        {review.pr_url && (
          <a href={review.pr_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary mb-8">
            View on GitHub →
          </a>
        )}

        <h2 className="mb-4 text-lg font-semibold">
          Issues ({comments.length})
        </h2>

        {Object.keys(groupedComments).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedComments).map(([file, fileComments]: [string, any]) => (
              <div key={file} className="card">
                <div className="mb-4 flex items-center gap-2 border-b pb-3">
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  <code className="text-sm font-mono">{file}</code>
                  <span className="badge badge-info">{fileComments.length}</span>
                </div>
                <div className="space-y-4">
                  {fileComments.map((comment: any) => (
                    <div key={comment.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <span className={cn('badge', severityColor(comment.severity))}>
                          {comment.severity}
                        </span>
                        <span className="mt-1 text-xs text-gray-400">L{comment.line_number}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="badge badge-info">{comment.category}</span>
                        </div>
                        <p className="text-sm">{comment.message}</p>
                        {comment.suggestion && (
                          <pre className="mt-2 rounded-lg bg-gray-50 p-3 text-xs dark:bg-gray-800">
                            {comment.suggestion}
                          </pre>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <svg className="mx-auto h-12 w-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium">No issues found</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              This PR looks clean!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
