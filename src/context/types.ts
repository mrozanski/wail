export type ContextReceiptEntry = {
  role: "profile" | "explicit";
  path: string;
  sha256: string;
  bytes: number;
};
