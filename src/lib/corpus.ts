import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { PersonSchema } from "./schema";
import type { MyProfile, Person } from "./types";

const DATA_DIR = join(process.cwd(), "data");
const PEOPLE_DIR = join(DATA_DIR, "people");

let cachedPeople: Person[] | null = null;
let cachedProfile: MyProfile | null = null;

export function invalidateCorpusCache() {
  cachedPeople = null;
}

export async function getPeople(): Promise<Person[]> {
  if (cachedPeople) return cachedPeople;
  const files = await readdir(PEOPLE_DIR);
  const people: Person[] = [];
  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const raw = await readFile(join(PEOPLE_DIR, file), "utf-8");
    const data = JSON.parse(raw);
    try {
      const validated = PersonSchema.parse(data);
      people.push(validated as Person);
    } catch (err) {
      console.error(`[corpus] schema violation in ${file}:`, err);
      throw err;
    }
  }
  cachedPeople = people;
  return people;
}

export async function getPersonById(id: string): Promise<Person | undefined> {
  const all = await getPeople();
  return all.find((p) => p.id === id);
}

export async function getProfile(): Promise<MyProfile> {
  if (cachedProfile) return cachedProfile;
  const raw = await readFile(join(DATA_DIR, "me.json"), "utf-8");
  const data = JSON.parse(raw) as MyProfile;
  cachedProfile = data;
  return data;
}
