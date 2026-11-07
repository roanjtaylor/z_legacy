import { useEffect, useState } from 'react';
import { loadBranch, type BranchData } from '../data/loadBranch';

export function useBranchData(id: string | undefined) {
  const [data, setData] = useState<BranchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    setLoading(true);
    setError(null);
    loadBranch(id)
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e instanceof Error ? e.message : String(e)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id]);

  return { data, loading, error };
}
