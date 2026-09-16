import { z } from "zod";

export const ReadingIntentSchema = z.enum(["orient", "review", "learn", "implement", "reference"]);
export const ReadingDepthSchema = z.enum(["glance", "working", "deep"]);

export const FindingKindSchema = z.enum([
  "decision",
  "requirement",
  "invariant",
  "assumption",
  "risk",
  "question",
  "gap",
  "evidence",
  "concept",
  "dependency",
]);

export const FindingBasisSchema = z.enum(["stated", "inferred"]);

export const SourceRangeRefSchema = z.object({
  startLine: z.number().int().positive(),
  endLine: z.number().int().positive(),
});

export const FindingSchema = z.object({
  kind: FindingKindSchema,
  basis: FindingBasisSchema,
  text: z.string(),
  sourceRanges: z.array(SourceRangeRefSchema),
});

export const SectionAnalysisSchema = z.object({
  sectionId: z.string(),
  summary: z.string(),
  significance: z.string().nullable(),
  findings: z.array(FindingSchema),
});

export const ContextReceiptEntrySchema = z.object({
  role: z.enum(["profile", "explicit"]),
  path: z.string(),
  sha256: z.string(),
  bytes: z.number().int().nonnegative(),
});

export const WailArtifactSchema = z.object({
  schemaVersion: z.literal(1),
  promptVersion: z.string(),
  generatedAt: z.string(),
  document: z.object({
    title: z.string(),
    sourcePath: z.string().nullable(),
    sourceUrl: z.string().nullable(),
    contentHash: z.string(),
  }),
  request: z.object({
    intent: ReadingIntentSchema,
    depth: ReadingDepthSchema,
  }),
  context: z.array(ContextReceiptEntrySchema),
  overview: z.object({
    summary: z.string(),
    documentKind: z.string(),
    readingGuidance: z.array(z.string()),
    keyItems: z.array(FindingSchema),
  }),
  sections: z.array(SectionAnalysisSchema),
  provider: z.object({
    name: z.string(),
    model: z.string(),
    responseIds: z.array(z.string()),
    usage: z
      .object({
        inputTokens: z.number().optional(),
        outputTokens: z.number().optional(),
        totalTokens: z.number().optional(),
      })
      .optional(),
  }),
});
