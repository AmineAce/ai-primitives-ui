"use client";

import { flexsearchStaticClient } from "fumadocs-core/search/client/flexsearch-static";
import { useDocsSearch } from "fumadocs-core/search/client";
import {
  SearchDialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogHeader,
  SearchDialogIcon,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogOverlay,
} from "fumadocs-ui/components/dialog/search";
import type { SharedProps } from "fumadocs-ui/contexts/search";

/**
 * The actual dialog UI. Loaded lazily by `./search-dialog` on first open,
 * so the search index is never fetched during page load.
 */
export default function SearchDialogInner(props: SharedProps) {
  const { search, setSearch, query } = useDocsSearch({
    client: flexsearchStaticClient({ from: "/api/search" }),
  });

  return (
    <SearchDialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      search={search}
      onSearchChange={setSearch}
      isLoading={query.isLoading}
    >
      <SearchDialogOverlay />
      <SearchDialogContent>
        <SearchDialogHeader>
          <SearchDialogIcon />
          <SearchDialogInput />
          <SearchDialogClose />
        </SearchDialogHeader>
        {query.error ? (
          <div className="text-fg-muted px-4 py-6 text-center text-sm">
            Search index failed to load. Try reloading the page.
          </div>
        ) : (
          <SearchDialogList items={query.data !== "empty" ? query.data : []} />
        )}
      </SearchDialogContent>
    </SearchDialog>
  );
}
