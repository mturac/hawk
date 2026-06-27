'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { StatsCard } from '@/components/stats-card';
import { ReviewCard } from '@/components/review-card';
import { apiFetch } from '@/lib/utils';

interface DashboardData {
  stats: {
    total_reviews: number;
    completed: number;
    failed: number;
    avg_score: number;
    total_issues: number;
  };
  recentReviews: any[];
  topRepos: any[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<DashboardData>('/api/reviews/stats/overview')
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-64 min-h-screen flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Overview of your AI code reviews
          </p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          </div>
        )}

        {error && (
          <div className="card border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {data && (
          <>
            <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="Total Reviews"
                value={data.stats.total_reviews}
                icon={
                  <svg className="h-6 w-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                }
              />
              <StatsCard
                title="Avg Score"
                value={data.stats.avg_score ? `${data.stats.avg_score}/100` : 'N/A'}
                icon={
                  <svg className="h-6 w-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                }
              />
              <StatsCard
                title="Issues Found"
                value={data.stats.total_issues || 0}
                icon={
                  <svg className="h-6 w-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                }
              />
              <StatsCard
                title="Success Rate"
                value={data.stats.total_reviews > 0
                  ? `${Math.round((data.stats.completed / data.stats.total_reviews) * 100)}%`
                  : 'N/A'}
                icon={
                  <svg className="h-6 w-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <h2 className="mb-4 text-lg font-semibold">Recent Reviews</h2>
                <div className="space-y-4">
                  {data.recentReviews.length > 0 ? (
                    data.recentReviews.map((review: any) => (
                      <ReviewCard key={review.id} review={review} />
                    ))
                  ) : (
                    <div className="card text-center text-gray-500 dark:text-gray-400">
                      No reviews yet. Add a repository to get started.
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h2 className="mb-4 text-lg font-semibold">Top Repositories</h2>
                <div className="card space-y-4">
                  {data.topRepos.length > 0 ? (
                    data.topRepos.map((repo: any) => (
                      <div key={repo.full_name} className="flex items-center justify-between">
                        <span className="truncate text-sm">{repo.full_name}</span>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-gray-500 dark:text-gray-400">
                            {repo.review_count} reviews
                          </span>
                          {repo.avg_score && (
                            <span className="font-medium">{repo.avg_score}</span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No repositories configured yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
