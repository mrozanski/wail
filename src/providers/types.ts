import type { StructuredDocument } from "../document/types.js";
import type { ContextReceiptEntry } from "../context/types.js";
import type { ReadingDepth, ReadingIntent, SectionAnalysis, WailArtifact } from "../analysis/types.js";

export type ProviderAnalysisRequest = {
  document: StructuredDocument;
  intent: ReadingIntent;
  depth: ReadingDepth;
  context: ContextReceiptEntry[];
};

export type ProviderAnalysisResult = {
  overview: WailArtifact["overview"];
  sections: SectionAnalysis[];
  provider: WailArtifact["provider"];
};

export interface AnalysisProvider {
  analyze(request: ProviderAnalysisRequest): Promise<ProviderAnalysisResult>;
}
