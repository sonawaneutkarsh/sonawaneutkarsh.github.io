import { Trophy, Award } from "lucide-react";
import { achievements } from "@/data/achievements";
import type { Achievement } from "@/data/types";
import { Container } from "@/components/container";

function iconFor(achievement: Achievement) {
  if (achievement.label.includes("Hackathon")) return Trophy;
  return Award;
}

export function Achievements() {
  return (
    <section className="border-t border-line">
      <Container className="py-20 sm:py-24">
        <h2 className="eyebrow">Achievements</h2>
        <ul className="mt-6 space-y-4">
          {achievements.map((achievement) => {
            const Icon = iconFor(achievement);
            return (
              <li key={achievement.label} className="flex items-start gap-3">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-graphite" aria-hidden="true" />
                <div>
                  <p className="font-medium">{achievement.label}</p>
                  {achievement.detail ? <p className="mt-0.5 text-sm text-graphite">{achievement.detail}</p> : null}
                </div>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
