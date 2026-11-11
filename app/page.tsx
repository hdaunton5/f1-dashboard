const BASE = "https://api.jolpi.ca/ergast/f1/current";

type DriverStanding = {
  position: string;
  points: string;
  wins: string;
  Driver: { givenName: string; familyName: string; code: string };
  Constructors: { name: string }[];
};

type Race = {
  raceName: string;
  date: string;
  Circuit: {
    circuitName: string;
    Location: { locality: string; country: string };
  };
};

async function getJson(path: string) {
  const res = await fetch(`${BASE}/${path}`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export default async function Home() {
  const [standingsData, nextData] = await Promise.all([
    getJson("driverstandings.json"),
    getJson("next.json"),
  ]);

  const standings: DriverStanding[] =
    standingsData.MRData.StandingsTable.StandingsLists[0]?.DriverStandings ?? [];
  const nextRace: Race | undefined = nextData.MRData.RaceTable.Races[0];

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-xl font-bold">F1 Dashboard!!!</h1>

      <section className="mb-8 rounded-lg border p-4">
        <h2 className="mb-2 text-xl font-semibold">Next race</h2>
        {nextRace ? (
          <p>
            {nextRace.raceName} at {nextRace.Circuit.circuitName},{" "}
            {nextRace.Circuit.Location.locality}, on{" "}
            {new Date(nextRace.date).toLocaleDateString("en-GB", {
              dateStyle: "full",
            })}
          </p>
        ) : (
          <p>No more races this season.</p>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-xl font-semibold">Driver standings</h2>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="py-2">Pos</th>
              <th>Driver</th>
              <th>Team</th>
              <th>Wins</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s) => (
              <tr key={s.Driver.code} className="border-b">
                <td className="py-2">{s.position}</td>
                <td>
                  {s.Driver.givenName} {s.Driver.familyName}
                </td>
                <td>{s.Constructors[0]?.name}</td>
                <td>{s.wins}</td>
                <td>{s.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}