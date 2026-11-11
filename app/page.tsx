import type { ReactNode } from "react";
import { Barlow_Condensed, IBM_Plex_Sans } from "next/font/google";

/* ---------- Fonts ---------- */

const display = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});
const body = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
const D = display.className; // condensed face for headings and big numbers

/* ---------- Data ---------- */

const BASE = "https://api.jolpi.ca/ergast/f1/current";

type DriverStanding = {
  position: string;
  points: string;
  wins: string;
  Driver: { givenName: string; familyName: string; code: string };
  Constructors: { name: string }[];
};

type ConstructorStanding = {
  position: string;
  points: string;
  wins: string;
  Constructor: { constructorId: string; name: string };
};

type Race = {
  round?: string;
  raceName: string;
  date: string;
  time?: string;
  Circuit: {
    circuitName: string;
    Location: { locality: string; country: string };
  };
};

type RaceResult = {
  position: string;
  points: string;
  grid: string;
  status: string;
  Driver: { givenName: string; familyName: string; code: string };
  Constructor: { name: string };
  Time?: { time: string };
};

type LastRace = {
  raceName: string;
  date: string;
  Results: RaceResult[];
};

async function getJson(path: string) {
  const res = await fetch(`${BASE}/${path}`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

/* ---------- Team colours (approximate) ---------- */

const TEAM_COLOURS: Record<string, string> = {
  Mercedes: "#00BFA5",
  "Red Bull": "#3671C6",
  Ferrari: "#E8002D",
  McLaren: "#FF8000",
  "RB F1 Team": "#6692FF",
  "Alpine F1 Team": "#FF87BC",
  "Haas F1 Team": "#9AA0A6",
  "Aston Martin": "#229971",
  Williams: "#64C4FF",
  Audi: "#7B2D3B",
  "Cadillac F1 Team": "#1D1D1F",
};

function teamColour(name?: string) {
  return (name && TEAM_COLOURS[name]) || "#8A8F96";
}

/* ---------- Small helpers ---------- */

function raceMoment(race: Race) {
  const iso = race.time ? `${race.date}T${race.time}` : `${race.date}T12:00:00Z`;
  return { when: new Date(iso), hasTime: Boolean(race.time) };
}

function formatDay(date: Date, timeZone: string) {
  return date.toLocaleDateString("en-GB", { dateStyle: "full", timeZone });
}

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

/* ---------- Components ---------- */

function SectionHead({ title, note }: { title: string; note?: string }) {
  return (
    <div className="flex items-end justify-between gap-4 border-t-4 border-[#15171C] pb-2 pt-3">
      <h2 className={`${D} text-3xl font-bold uppercase leading-none`}>
        {title}
      </h2>
      {note && <p className="text-sm text-[#5F6673]">{note}</p>}
    </div>
  );
}

function TowerRow({
  pos,
  colour,
  primary,
  secondary,
  points,
  gap,
}: {
  pos: string;
  colour: string;
  primary: ReactNode;
  secondary: string;
  points: string;
  gap: string;
}) {
  return (
    <li className="grid grid-cols-[2.25rem_1fr_auto] items-center gap-3 border-b border-[#D5D8DE] py-2.5">
      <span
        className={`${D} text-right text-2xl font-semibold tabular-nums text-[#5F6673]`}
      >
        {pos}
      </span>
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden
          className="h-9 w-1.5 shrink-0"
          style={{ background: colour }}
        />
        <div className="min-w-0">
          <p className="truncate leading-tight">{primary}</p>
          <p className="truncate text-xs text-[#5F6673]">{secondary}</p>
        </div>
      </div>
      <div className="text-right">
        <p
          className={`${D} text-2xl font-bold leading-none tabular-nums`}
        >
          {points}
        </p>
        <p className="mt-0.5 text-xs tabular-nums text-[#5F6673]">{gap}</p>
      </div>
    </li>
  );
}

const RESULT_GRID =
  "grid grid-cols-[2rem_1fr_auto_2.5rem] items-center gap-3 px-4 sm:grid-cols-[2rem_1fr_3rem_auto_2.5rem]";

/* ---------- Page ---------- */

export default async function Home() {
  const [standingsData, nextData, constructorsData, lastData] =
    await Promise.all([
      getJson("driverstandings.json"),
      getJson("next.json"),
      getJson("constructorstandings.json"),
      getJson("last/results.json"),
    ]);

  const table = standingsData.MRData.StandingsTable;
  const season: string = table.season;
  const round: string | undefined = table.StandingsLists[0]?.round;
  const drivers: DriverStanding[] =
    table.StandingsLists[0]?.DriverStandings ?? [];
  const teams: ConstructorStanding[] =
    constructorsData.MRData.StandingsTable.StandingsLists[0]
      ?.ConstructorStandings ?? [];
  const nextRace: Race | undefined = nextData.MRData.RaceTable.Races[0];
  const lastRace: LastRace | undefined = lastData.MRData.RaceTable.Races[0];

  const leaderDriverPts = Number(drivers[0]?.points ?? 0);
  const leaderTeamPts = Number(teams[0]?.points ?? 0);

  const next = nextRace ? raceMoment(nextRace) : null;

  const podium = lastRace?.Results.slice(0, 3) ?? [];
  const podiumSlots = [
    { r: podium[1], h: "9rem" },
    { r: podium[0], h: "11rem" },
    { r: podium[2], h: "7.5rem" },
  ];

  return (
    <div
      className={`${body.className} min-h-screen bg-[#F2F3F5] text-[#15171C]`}
    >
      {/* Header */}
      <header className="border-b border-[#D5D8DE]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <span aria-hidden className="h-7 w-2 bg-[#E10600]" />
            <h1 className={`${D} text-3xl font-extrabold uppercase leading-none`}>
              F1 Dashboard
            </h1>
          </div>
          <p className="text-right text-sm text-[#5F6673]">
            {season} season{round ? `, after round ${round}` : ""}
          </p>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-10 px-5 py-8 lg:grid-cols-12">
        {/* Right column on desktop, first on mobile */}
        <div className="order-1 space-y-10 lg:order-2 lg:col-span-5">
          {/* Next race */}
          <section aria-labelledby="next-race" style={{ background: "#23262C" }}>
            <div
              aria-hidden
              className="h-2"
              style={{
                background:
                  "repeating-linear-gradient(90deg, #E10600 0 16px, #F2F3F5 16px 32px)",
              }}
            />
            <div className="p-6 text-zinc-100">
              {nextRace && next ? (
                <>
                  <p className="text-sm text-zinc-400">
                    Next race{nextRace.round ? `, round ${nextRace.round}` : ""}
                  </p>
                  <h2
                    id="next-race"
                    className={`${D} mt-1 text-5xl font-extrabold uppercase leading-[0.95]`}
                  >
                    {nextRace.raceName}
                  </h2>
                  <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-5 gap-y-1.5 text-sm">
                    <dt className="text-zinc-400">Circuit</dt>
                    <dd>{nextRace.Circuit.circuitName}</dd>
                    <dt className="text-zinc-400">Location</dt>
                    <dd>
                      {nextRace.Circuit.Location.locality},{" "}
                      {nextRace.Circuit.Location.country}
                    </dd>
                    <dt className="text-zinc-400">Date</dt>
                    <dd>
                      {formatDay(
                        next.when,
                        next.hasTime ? "Europe/London" : "UTC",
                      )}
                    </dd>
                    {next.hasTime && (
                      <>
                        <dt className="text-zinc-400">Lights out</dt>
                        <dd>
                          {next.when.toLocaleTimeString("en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "Europe/London",
                          })}{" "}
                          UK time
                        </dd>
                      </>
                    )}
                  </dl>
                </>
              ) : (
                <>
                  <h2
                    id="next-race"
                    className={`${D} text-4xl font-extrabold uppercase leading-none`}
                  >
                    Season complete
                  </h2>
                  <p className="mt-3 text-sm text-zinc-400">
                    There are no more races on the {season} calendar. The next
                    race will appear here once the new season is published.
                  </p>
                </>
              )}
            </div>
          </section>

          {/* Last race */}
          {lastRace && (
            <section aria-labelledby="last-race">
              <SectionHead title="Last race" />
              <h3 id="last-race" className="mt-3 text-lg font-semibold">
                {lastRace.raceName}
              </h3>
              <p className="text-sm text-[#5F6673]">
                {formatDay(new Date(`${lastRace.date}T12:00:00Z`), "UTC")}
              </p>

              <ol className="mt-4 flex items-end gap-2">
                {podiumSlots.map(({ r, h }) =>
                  r ? (
                    <li
                      key={r.Driver.code}
                      className="flex min-w-0 flex-1 flex-col justify-between p-3"
                      style={{
                        minHeight: h,
                        background: "#E4E7EB",
                        borderTop: `4px solid ${teamColour(r.Constructor.name)}`,
                      }}
                    >
                      <span
                        className={`${D} text-5xl font-extrabold leading-none`}
                      >
                        {r.position}
                      </span>
                      <div className="min-w-0">
                        <p className="break-words text-sm font-semibold uppercase leading-tight">
                          {r.Driver.familyName}
                        </p>
                        <p className="truncate text-xs text-[#5F6673]">
                          {r.Constructor.name}
                        </p>
                        <p className="mt-1 text-xs tabular-nums">
                          {r.Time?.time ?? r.status}
                        </p>
                      </div>
                    </li>
                  ) : null,
                )}
              </ol>

              <details className="mt-5 border border-[#D5D8DE]">
                <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E10600]">
                  Full classification
                </summary>
                <div className="border-t border-[#D5D8DE] pb-2">
                  <div
                    className={`${RESULT_GRID} py-2 text-xs text-[#5F6673]`}
                  >
                    <span className="text-right">Pos</span>
                    <span>Driver</span>
                    <span className="hidden text-right sm:block">Grid</span>
                    <span className="text-right">Time or status</span>
                    <span className="text-right">Pts</span>
                  </div>
                  <ol>
                    {lastRace.Results.map((r) => (
                      <li
                        key={r.Driver.code}
                        className={`${RESULT_GRID} border-t border-[#E4E7EB] py-2 text-sm`}
                      >
                        <span
                          className={`${D} text-right text-lg font-semibold tabular-nums`}
                        >
                          {r.position}
                        </span>
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            aria-hidden
                            className="h-6 w-1 shrink-0"
                            style={{ background: teamColour(r.Constructor.name) }}
                          />
                          <span className="truncate">
                            {r.Driver.givenName}{" "}
                            <span className="font-semibold uppercase">
                              {r.Driver.familyName}
                            </span>
                          </span>
                        </div>
                        <span className="hidden text-right tabular-nums text-[#5F6673] sm:block">
                          {r.grid === "0" ? "Pit" : r.grid}
                        </span>
                        <span className="text-right text-xs tabular-nums sm:text-sm">
                          {r.Time?.time ?? r.status}
                        </span>
                        <span className="text-right font-semibold tabular-nums">
                          {r.points}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              </details>
            </section>
          )}

          {/* Constructors */}
          <section aria-labelledby="teams">
            <SectionHead title="Constructors" note={`${plural(teams.length, "team")}`} />
            <h3 id="teams" className="sr-only">
              Constructor standings
            </h3>
            <ol>
              {teams.map((t) => {
                const pts = Number(t.points);
                const wins = Number(t.wins);
                return (
                  <TowerRow
                    key={t.Constructor.constructorId}
                    pos={t.position}
                    colour={teamColour(t.Constructor.name)}
                    primary={
                      <span className="font-semibold uppercase">
                        {t.Constructor.name}
                      </span>
                    }
                    secondary={wins > 0 ? plural(wins, "win") : "No wins"}
                    points={t.points}
                    gap={
                      t.position === "1"
                        ? "Leader"
                        : `\u2212${leaderTeamPts - pts}`
                    }
                  />
                );
              })}
            </ol>
          </section>
        </div>

        {/* Drivers: the timing tower */}
        <section
          aria-labelledby="drivers"
          className="order-2 lg:order-1 lg:col-span-7"
        >
          <SectionHead title="Drivers" note="Championship points and gap to leader" />
          <h3 id="drivers" className="sr-only">
            Driver standings
          </h3>
          <ol>
            {drivers.map((d) => {
              const pts = Number(d.points);
              const wins = Number(d.wins);
              const team = d.Constructors[0]?.name ?? "";
              return (
                <TowerRow
                  key={d.Driver.code}
                  pos={d.position}
                  colour={teamColour(team)}
                  primary={
                    <>
                      {d.Driver.givenName}{" "}
                      <span className="font-semibold uppercase">
                        {d.Driver.familyName}
                      </span>
                    </>
                  }
                  secondary={`${team}${wins > 0 ? `, ${plural(wins, "win")}` : ""}`}
                  points={d.points}
                  gap={
                    d.position === "1"
                      ? "Leader"
                      : `\u2212${leaderDriverPts - pts}`
                  }
                />
              );
            })}
          </ol>
        </section>
      </main>

      <footer className="border-t border-[#D5D8DE]">
        <p className="mx-auto max-w-6xl px-5 py-6 text-sm text-[#5F6673]">
          Data from the Jolpica F1 API, refreshed hourly. Team colours are
          approximate. Created by HD
        </p>
      </footer>
    </div>
  );
}
