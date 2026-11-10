// The standalone single-file build (npm run build:standalone) embeds the
// curated cars JSON on window, because fetch() does not work from file://.
// The normal dev/prod builds fetch it from /curated-cars.json.
export async function fetchCuratedCars<T>(): Promise<T[]> {
  const embedded = (window as unknown as { __CURATED_CARS__?: T[] }).__CURATED_CARS__;
  if (embedded) return embedded;

  const response = await fetch('/curated-cars.json');
  if (!response.ok) {
    throw new Error(`Failed to load cars: ${response.status}`);
  }
  return (await response.json()) as T[];
}
