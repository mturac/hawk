'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { apiFetch, cn, timeAgo } from '@/lib/utils';

export default function ReposPage() {
  const [repos, setRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newRepo, setNewRepo] = useState({ owner: '', name: '' });
  const [adding, setAdding] = useState(false);
  const [webhookInfo, setWebhookInfo] = useState<any>(null);

  useEffect(() => {
    loadRepos();
  }, []);

  function loadRepos() {
    setLoading(true);
    apiFetch<any>('/api/repos')
      .then((data) => setRepos(data.repos))
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  async function handleAddRepo(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    try {
      const result = await apiFetch<any>('/api/repos', {
        method: 'POST',
        body: JSON.stringify({
          owner: newRepo.owner,
          name: newRepo.name,
          full_name: `${newRepo.owner}/${newRepo.name}`,
        }),
      });
      setWebhookInfo(result);
      setNewRepo({ owner: '', name: '' });
      loadRepos();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setAdding(false);
    }
  }

  async function handleToggleRepo(id: number, enabled: boolean) {
    await apiFetch(`/api/repos/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ enabled }),
    });
    loadRepos();
  }

  async function handleDeleteRepo(id: number) {
    if (!confirm('Are you sure you want to delete this repository?')) return;
    await apiFetch(`/api/repos/${id}`, { method: 'DELETE' });
    loadRepos();
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-64 min-h-screen flex-1 p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Repositories</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Manage repositories for AI code review
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
            {showAdd ? 'Cancel' : '+ Add Repository'}
          </button>
        </div>

        {showAdd && (
          <div className="card mb-8">
            <h2 className="mb-4 text-lg font-semibold">Add Repository</h2>
            <form onSubmit={handleAddRepo} className="flex gap-4">
              <input
                type="text"
                placeholder="owner"
                value={newRepo.owner}
                onChange={(e) => setNewRepo({ ...newRepo, owner: e.target.value })}
                className="rounded-lg border bg-transparent px-3 py-2 text-sm"
                required
              />
              <span className="flex items-center text-gray-400">/</span>
              <input
                type="text"
                placeholder="repo-name"
                value={newRepo.name}
                onChange={(e) => setNewRepo({ ...newRepo, name: e.target.value })}
                className="rounded-lg border bg-transparent px-3 py-2 text-sm"
                required
              />
              <button type="submit" className="btn btn-primary" disabled={adding}>
                {adding ? 'Adding...' : 'Add'}
              </button>
            </form>
          </div>
        )}

        {webhookInfo && (
          <div className="card mb-8 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
            <h3 className="font-semibold text-green-800 dark:text-green-400">Repository Added!</h3>
            <p className="mt-2 text-sm">
              Set up a GitHub webhook with these settings:
            </p>
            <div className="mt-3 space-y-2 text-sm">
              <div>
                <span className="font-medium">URL:</span>{' '}
                <code className="rounded bg-green-100 px-2 py-1 dark:bg-green-800">{webhookInfo.webhook_url}</code>
              </div>
              <div>
                <span className="font-medium">Secret:</span>{' '}
                <code className="rounded bg-green-100 px-2 py-1 dark:bg-green-800">{webhookInfo.webhook_secret}</code>
              </div>
              <div>
                <span className="font-medium">Events:</span> Pull requests
              </div>
            </div>
            <button className="btn btn-secondary mt-4" onClick={() => setWebhookInfo(null)}>
              Dismiss
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          </div>
        ) : repos.length > 0 ? (
          <div className="space-y-4">
            {repos.map((repo: any) => (
              <div key={repo.id} className="card flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{repo.full_name}</h3>
                  <div className="mt-1 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>{repo.review_count || 0} reviews</span>
                    {repo.avg_score && <span>Avg: {repo.avg_score}</span>}
                    <span>Added {timeAgo(repo.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    className={cn('btn', repo.enabled ? 'btn-secondary' : 'btn-danger')}
                    onClick={() => handleToggleRepo(repo.id, !repo.enabled)}
                  >
                    {repo.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                  <button
                    className="btn btn-ghost text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={() => handleDeleteRepo(repo.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-20">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium">No repositories</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Add a repository to start receiving AI code reviews.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
