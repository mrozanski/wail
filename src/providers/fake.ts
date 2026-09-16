import type { AnalysisProvider, ProviderAnalysisRequest, ProviderAnalysisResult } from "./types.js";

/**
 * Deterministic, no-network provider for Phase 1. It never invents findings — an
 * empty findings list is the honest default until a real provider is wired in.
 */
export class FakeProvider implements AnalysisProvider {
  async analyze(request: ProviderAnalysisRequest): Promise<ProviderAnalysisResult> {
    const sections = request.document.sections.map((section) => ({
      sectionId: section.id,
      summary: section.heading.length > 0 ? section.heading : "Untitled section",
      significance: null,
      findings: [],
    }));

    return {
      overview: {
        summary: `Fake analysis of ${request.document.sections.length} section(s) for intent "${request.intent}".`,
        documentKind: "unknown",
        readingGuidance: [],
        keyItems: [],
      },
      sections,
      provider: {
        name: "fake",
        model: "fake-v1",
        responseIds: ["fake-response-1"],
      },
    };
  }
}
