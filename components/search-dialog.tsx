"use client";

import {
  Component,
  lazy,
  Suspense,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  useSearchContext,
  type SharedProps,
} from "fumadocs-ui/contexts/search";

// Code-split: flexsearch + dialog UI only load after first open.
const SearchDialogInner = lazy(() => import("./search-dialog-inner"));

class SearchErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    // Search is an enhancement: never let it take down the page.
    if (this.state.failed) return null;
    return this.props.children;
  }
}

/**
 * Static-export search dialog. Mounts (and fetches `/api/search`) only after
 * the user first opens search, so a bad index can never break page load.
 */
export default function StaticSearchDialog(props: SharedProps) {
  const { open } = useSearchContext();
  const [everOpened, setEverOpened] = useState(open);

  useEffect(() => {
    if (open) setEverOpened(true);
  }, [open]);

  if (!everOpened) return null;

  return (
    <SearchErrorBoundary>
      <Suspense fallback={null}>
        <SearchDialogInner {...props} />
      </Suspense>
    </SearchErrorBoundary>
  );
}
