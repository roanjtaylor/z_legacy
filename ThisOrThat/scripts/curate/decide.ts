// decide.ts <branch> <itemId> <chosenIndex|null> <confidence> <score> [--flag "reason"]
//
// Convenience writer for decision.json. Pulls the chosen candidate's license (already
// resolved by search-wikimedia) straight from the manifest, so the judge only supplies
// the index, confidence, score, and optional flag — no license transcription.

import { readJson, writeJsonAtomic } from './lib/io.ts';
import { decisionPath, manifestPath } from './lib/paths.ts';
import type { CandidateManifest, ImageLicense, PickDecision } from './lib/types.ts';

function main() {
  const argv = process.argv.slice(2);
  const [branch, itemId, indexArg, confidence, scoreArg] = argv;
  if (!branch || !itemId || indexArg === undefined || !confidence) {
    console.error('Usage: decide.ts <branch> <itemId> <chosenIndex|null> <confidence> <score> [--flag "reason"]');
    process.exit(2);
  }
  const flagIdx = argv.indexOf('--flag');
  const flagged = flagIdx >= 0;
  const flagReason = flagged ? argv[flagIdx + 1] : undefined;
  const chosenIndex = indexArg === 'null' ? null : Number(indexArg);

  let license: ImageLicense = {
    license: 'unknown',
    attribution: 'unknown',
    sourceUrl: '',
  };

  if (chosenIndex !== null) {
    const manifest = readJson<CandidateManifest>(manifestPath(branch, itemId));
    const cand = manifest?.candidates.find((c) => c.index === chosenIndex);
    if (!cand) {
      console.error(`chosenIndex ${chosenIndex} not in manifest for ${itemId}`);
      process.exit(2);
    }
    if (!cand.license || !cand.license.sourceUrl) {
      console.error(`Candidate ${chosenIndex} has no resolved license — set it manually.`);
      process.exit(2);
    }
    license = {
      license: cand.license.license || 'unknown',
      attribution: cand.license.attribution || 'unknown',
      sourceUrl: cand.license.sourceUrl,
      author: cand.license.author,
      licenseUrl: cand.license.licenseUrl,
    };
  }

  const decision: PickDecision = {
    itemId,
    chosenIndex,
    confidence: confidence as PickDecision['confidence'],
    flagged: flagged || chosenIndex === null,
    flagReason,
    score: scoreArg ? Number(scoreArg) : undefined,
    license,
  };
  writeJsonAtomic(decisionPath(branch, itemId), decision);
  console.log(
    `decision for ${itemId}: index=${chosenIndex} ${confidence}` +
      `${decision.flagged ? ` FLAGGED (${flagReason ?? 'no image'})` : ''} [${license.license}]`
  );
}

main();
