import { useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";
import { add, isSaved, remove, subscribe } from "~/lib/favorites";
import { Button } from "~/components/ui/button";

type Props = {
  from: { id: string; name: string };
  to: { id: string; name: string };
};

export function SaveRouteButton({ from, to }: Props) {
  const [mounted, setMounted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pulse, setPulse] = useState(false);
  const firstRender = useRef(true);

  useEffect(() => {
    setMounted(true);
    setSaved(isSaved(from.id, to.id));
    return subscribe(() => setSaved(isSaved(from.id, to.id)));
  }, [from.id, to.id]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (saved) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 400);
      return () => clearTimeout(t);
    }
  }, [saved]);

  function toggle() {
    if (saved) remove(from.id, to.id);
    else add({ from, to });
  }

  return (
    <Button
      type="button"
      variant={saved ? "accent" : "outline"}
      size="md"
      onClick={toggle}
      disabled={!mounted}
      aria-pressed={saved}
      title={saved ? "Remove from favorites" : "Save this route"}
      className={saved ? "accent-glow" : undefined}
    >
      <Star
        className={`h-4 w-4 ${pulse ? "animate-pulse-once" : ""}`}
        fill={saved ? "currentColor" : "none"}
        strokeWidth={2}
      />
      {saved ? "Saved" : "Save"}
    </Button>
  );
}
