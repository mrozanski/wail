export type ReadingIntent = "orient" | "review" | "learn" | "implement" | "reference";
export type ReadingDepth = "glance" | "working" | "deep";

export type FindingKind =
  | "decision"
  | "requirement"
  | "invariant"
  | "assumption"
  | "risk"
  | "question"
  | "gap"
  | "evidence"
  | "concept"
  | "dependency";

export type FindingBasis = "stated" | "inferred";

export type SourceRangeRef = {
  startLine: number;
  endLine: number;
};

export type Finding = {
  kind: FindingKind;
  basis: FindingBasis;
  text: string;
  sourceRanges: SourceRangeRef[];
};

export type SectionAnalysis = {
  sectionId: string;
  summary: string;
  significance: string | null;
  findings: Finding[];
};

export type WailArtifact = {
  schemaVersion: 1;
  promptVersion: string;
  generatedAt: string;
  document: {
    title: string;
    sourcePath: string | null;
    sourceUrl: string | null;
    contentHash: string;
  };
  request: {
    intent: ReadingIntent;
    depth: ReadingDepth;
  };
  context: import("../context/types.js").ContextReceiptEntry[];
  overview: {
    summary: string;
    documentKind: string;
    readingGuidance: string[];
    keyItems: Finding[];
  };
  sections: SectionAnalysis[];
  provider: {
    name: string;
    model: string;
    responseIds: string[];
    usage?: {
      inputTokens?: number;
      outputTokens?: number;
      totalTokens?: number;
    };
  };
};
