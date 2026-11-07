import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Branch, CompareMode, CompareView, CritiqueMeta, EloState, HeatsBracket, Item } from '../types';
import { groupSizeForView } from '../types';
import { createEloState, createGridState, getCurrentPanel, resolveGridPanel, selectEloWinner } from '../lib/elo';
import { createHeatsBracket, getCurrentHeat, selectHeatWinner } from '../lib/heats';
import { recordJudgment } from '../lib/judgments';

interface Session {
  branch: Branch;
  mode: CompareMode;
  view: CompareView;
  items: Item[];
  elo: EloState | null;
  heats: HeatsBracket | null;
}

interface SessionContextValue {
  session: Session | null;
  start: (branch: Branch, mode: CompareMode, view: CompareView, items: Item[]) => void;
  /** The items currently on screen (2 for pair, up to 4 for quad). */
  contestants: () => Item[];
  /** Record the chosen item as winner over the others on screen, then advance. */
  choose: (focus: Item, meta?: CritiqueMeta) => void;
  reset: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

function contestantsOf(s: Session): Item[] {
  if (s.mode === 'elo' && s.elo) {
    if (s.view === 'quad') return getCurrentPanel(s.elo) ?? [];
    const m = s.elo.matchups?.[s.elo.currentIndex];
    return m ? [m.a, m.b] : [];
  }
  if (s.mode === 'tournament' && s.heats) return getCurrentHeat(s.heats) ?? [];
  return [];
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);

  const start = (branch: Branch, mode: CompareMode, view: CompareView, items: Item[]) => {
    setSession({
      branch,
      mode,
      view,
      items,
      elo: mode === 'elo' ? (view === 'quad' ? createGridState(items, 4) : createEloState(items)) : null,
      heats: mode === 'tournament' ? createHeatsBracket(items, groupSizeForView(view)) : null,
    });
  };

  const contestants = () => (session ? contestantsOf(session) : []);

  // Record outside the state updater so React StrictMode's double-invoke can't
  // double-log; `session` from this render's closure is current between clicks.
  const choose = (focus: Item, meta?: CritiqueMeta) => {
    if (!session) return;
    const onScreen = contestantsOf(session);
    if (!onScreen.some((i) => i.id === focus.id)) return;

    recordJudgment({
      ts: new Date().toISOString(),
      branch: session.branch.id,
      mode: session.mode,
      view: session.view,
      focus: focus.id,
      winners: [focus.id],
      losers: onScreen.filter((i) => i.id !== focus.id).map((i) => i.id),
      dims: meta?.dims,
      note: meta?.note,
    });

    setSession((prev) => {
      if (!prev) return prev;
      if (prev.mode === 'elo' && prev.elo) {
        const elo = prev.view === 'quad' ? resolveGridPanel(prev.elo, focus.id) : selectEloWinner(prev.elo, focus);
        return { ...prev, elo };
      }
      if (prev.mode === 'tournament' && prev.heats) return { ...prev, heats: selectHeatWinner(prev.heats, focus) };
      return prev;
    });
  };

  const reset = () => setSession(null);

  return (
    <SessionContext.Provider value={{ session, start, contestants, choose, reset }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
