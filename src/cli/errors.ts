import type { ExitCode } from "./exitCodes.js";

export class CliError extends Error {
  readonly exitCode: ExitCode;

  constructor(exitCode: ExitCode, message: string) {
    super(message);
    this.exitCode = exitCode;
  }
}
