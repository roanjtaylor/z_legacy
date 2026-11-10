import { getPeople } from "@/lib/corpus";
import { CurateBoard } from "./CurateBoard";

export default async function CuratePage() {
  const people = await getPeople();
  const rows = people
    .map((p) => ({
      id: p.id,
      name: p.name,
      imageUrl: p.imageUrl,
      confidence: p.confidence,
      countryOfOrigin: p.countryOfOrigin,
      researchLinks: p.researchLinks ?? {
        linkedin: null,
        company: null,
        others: [],
        cluster: "",
        hint: "",
      },
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold">Curate research links</h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-600">
          Paste LinkedIn + company + one verification link per founder. These
          links get saved into <code>data/people/&lt;id&gt;.json</code> under{" "}
          <code>researchLinks</code>. Once all are filled in, ask Claude Code to
          run the research pass — it will use these links to produce accurate
          timelines without burning API credits.
        </p>
      </header>
      <CurateBoard initial={rows} />
    </main>
  );
}
