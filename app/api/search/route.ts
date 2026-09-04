import { flexsearchFromSource } from "fumadocs-core/search/flexsearch";
import { source } from "@/lib/source";

const searchAPI = flexsearchFromSource(source);

export const dynamic = "force-static";

// staticGET exports the serialized flexsearch index ({ type: "default", raw });
// the client-side flexsearchStaticClient searches it locally (required for output: "export").
// NOTE: do NOT use createFromSource() here — its staticGET emits the live-query
// bundle ({ type: "advanced", ... }) with no `raw` key, which crashes the client.
export async function GET() {
  return searchAPI.staticGET();
}
