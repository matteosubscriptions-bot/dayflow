// Profili degli agenti, importabili anche lato client (nessun SDK server).
export type AgentKind = "PAMELA" | "SIMONE" | "CORINNE";

export interface AgentProfile {
  id: AgentKind;
  name: string;
  role: string;
  description: string;
  firstAction: string;
  initial: string;
}

export const AGENT_PROFILES: Record<AgentKind, AgentProfile> = {
  PAMELA: {
    id: "PAMELA",
    name: "Pamela",
    role: "Project manager",
    description:
      "Trasforma idee e note di progetto in obiettivi, step concreti e priorità.",
    firstAction: "Individua obiettivi, step e priorità di questa nota",
    initial: "P",
  },
  SIMONE: {
    id: "SIMONE",
    name: "Simone",
    role: "Social media manager · Copywriter",
    description:
      "Trasforma le idee di comunicazione in storie, reel e post per il tuo brand.",
    firstAction: "Trasforma questa nota in contenuti per i miei social",
    initial: "S",
  },
  CORINNE: {
    id: "CORINNE",
    name: "Corinne",
    role: "Counselor · Psicologa olistica",
    description:
      "Ti aiuta a osservare le dinamiche che emergono dalle tue riflessioni personali.",
    firstAction: "Aiutami a osservare le dinamiche di questa riflessione",
    initial: "C",
  },
};

export const AGENT_PROFILE_LIST = Object.values(AGENT_PROFILES);
