import { useState } from "react";
import { Form, useLoaderData, useNavigation } from "@remix-run/react";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { ArrowLeftRight, Brain, Frown, Leaf, Search, Sparkles } from "lucide-react";
import { findById } from "~/lib/stations.server";
import { todayISO } from "~/lib/format";
import { StationCombobox } from "~/components/StationCombobox";
import { DateChips } from "~/components/DateChips";
import { FavoritesList } from "~/components/FavoritesList";
import { HeroIllustration } from "~/components/HeroIllustration";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";

export const meta: MetaFunction = () => [
  { title: "Nomago Ride — find your bus" },
  {
    name: "description",
    content: "A cleaner way to browse Slovenian intercity bus schedules.",
  },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const fromId = url.searchParams.get("from") ?? "";
  const toId = url.searchParams.get("to") ?? "";
  const date = url.searchParams.get("date") ?? "";
  const [fromStation, toStation] = await Promise.all([
    fromId ? findById(fromId) : Promise.resolve(undefined),
    toId ? findById(toId) : Promise.resolve(undefined),
  ]);
  return {
    initial: {
      from: fromStation ? { id: fromStation.id, name: fromStation.name } : null,
      to: toStation ? { id: toStation.id, name: toStation.name } : null,
      date: date || todayISO(),
    },
  };
}

export default function Index() {
  const { initial } = useLoaderData<typeof loader>();
  const nav = useNavigation();
  const submitting =
    nav.state === "submitting" || (nav.state === "loading" && nav.formMethod === "GET");
  const [date, setDate] = useState(initial.date);
  const [swapKey, setSwapKey] = useState(0);
  const [fromInitial, setFromInitial] = useState(initial.from);
  const [toInitial, setToInitial] = useState(initial.to);

  function swap() {
    setFromInitial(toInitial);
    setToInitial(fromInitial);
    setSwapKey((k) => k + 1);
  }

  return (
    <div className="space-y-6 sm:space-y-7">
      <section className="relative">
        <div
          aria-hidden
          className="absolute inset-x-0 -top-6 -bottom-6 -z-10 bg-dots mask-radial-fade opacity-80"
        />
        <div className="grid items-center gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-3">
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
              <Sparkles className="h-3 w-3 text-accent" />
              Slovenian intercity bus search
            </p>
            <h1 className="text-balance text-5xl font-semibold leading-[1.05] tracking-[-0.035em] sm:text-6xl">
              Bus schedules,{" "}
              <span className="bg-gradient-to-br from-accent via-accent to-accent/60 bg-clip-text text-transparent">
                finally legible.
              </span>
            </h1>
            <p className="max-w-xl text-balance text-base text-muted-foreground sm:text-lg">
              Two stations, one date, every departure. Filter, sort, share — no
              dense cards, no carousels, no nonsense.
            </p>
          </div>
          <div className="relative h-40 sm:h-48 lg:h-56">
            <HeroIllustration />
          </div>
        </div>
      </section>

      <FavoritesList />

      <Card className="animate-scale-in overflow-visible p-4 sm:p-5">
        <Form method="get" action="/schedule" className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
            <StationCombobox
              key={`from-${swapKey}`}
              name="from"
              label="From"
              placeholder="e.g. Ljubljana"
              initialId={fromInitial?.id}
              initialLabel={fromInitial?.name}
            />
            <div className="flex justify-center sm:pb-1.5">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={swap}
                aria-label="Swap origin and destination"
                className="rounded-full"
              >
                <ArrowLeftRight className="h-4 w-4" />
              </Button>
            </div>
            <StationCombobox
              key={`to-${swapKey}`}
              name="to"
              label="To"
              placeholder="e.g. Maribor"
              initialId={toInitial?.id}
              initialLabel={toInitial?.name}
            />
          </div>

          <DateChips name="date" value={date} onChange={setDate} />

          <div className="flex justify-end">
            <Button
              type="submit"
              variant="accent"
              size="lg"
              disabled={submitting}
              className="accent-glow"
            >
              <Search className="h-4 w-4" />
              {submitting ? "Searching…" : "Find buses"}
            </Button>
          </div>
        </Form>
      </Card>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          {
            icon: Leaf,
            tag: "the planet",
            text: "Cars exhaust everything. Buses don't.",
          },
          {
            icon: Frown,
            tag: "the eyes",
            text: "Their UX missed the bus. We didn't.",
          },
          {
            icon: Brain,
            tag: "the sense",
            text: "Cars make traffic. Buses make sense.",
          },
        ].map(({ icon: Icon, tag, text }) => (
          <Card key={tag} className="hover-lift p-4">
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              <Icon className="h-3.5 w-3.5 text-accent" strokeWidth={2.25} />
              {tag}
            </div>
            <p className="mt-1.5 text-sm font-medium leading-snug">{text}</p>
          </Card>
        ))}
      </section>
    </div>
  );
}
