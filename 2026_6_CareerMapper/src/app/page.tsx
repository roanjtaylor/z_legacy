import { Main } from "@/components/Main";
import { getPeople, getProfile } from "@/lib/corpus";

export default async function Page() {
  const [people, profile] = await Promise.all([getPeople(), getProfile()]);
  return <Main people={people} profile={profile} />;
}
