export type SourceRange = {
  startLine: number; // one-based, inclusive
  endLine: number; // one-based, inclusive
};

export type DocumentSection = {
  id: string;
  heading: string;
  level: number;
  ordinal: number;
  parentId: string | null;
  range: SourceRange;
  markdown: string;
};

export type StructuredDocument = {
  title: string;
  sourcePath: string | null;
  sourceUrl: string | null;
  contentHash: string;
  markdown: string;
  sections: DocumentSection[];
};
