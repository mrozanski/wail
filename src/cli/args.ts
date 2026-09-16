import type { ReadingDepth, ReadingIntent } from "../analysis/types.js";
import { CliError } from "./errors.js";
import { ExitCode } from "./exitCodes.js";

const INTENTS: ReadingIntent[] = ["orient", "review", "learn", "implement", "reference"];
const DEPTHS: ReadingDepth[] = ["glance", "working", "deep"];

export type CliCommand = "analyze" | "build" | "open" | "context-explain";

export type ParsedArgs = {
  command: CliCommand;
  file: string | null;
  intent?: ReadingIntent;
  depth?: ReadingDepth;
  profile?: string;
  contextFiles: string[];
  noProfile: boolean;
  provider?: string;
  model?: string;
  force: boolean;
  format: "json" | "markdown";
  output?: string;
  consume: boolean;
  title?: string;
  sourceUrl?: string;
};

function usageError(message: string): never {
  throw new CliError(ExitCode.UsageError, message);
}

function takeValue(argv: string[], index: number, flag: string): string {
  const value = argv[index + 1];
  if (value === undefined) {
    usageError(`${flag} requires a value`);
  }
  return value;
}

export function parseArgs(argv: string[]): ParsedArgs {
  if (argv.length === 0) {
    usageError("expected a command: analyze, build, open, or context");
  }

  let command: CliCommand;
  let rest: string[];

  if (argv[0] === "context") {
    if (argv[1] !== "explain") {
      usageError('the "context" command only supports "explain"');
    }
    command = "context-explain";
    rest = argv.slice(2);
  } else if (argv[0] === "analyze" || argv[0] === "build" || argv[0] === "open") {
    command = argv[0];
    rest = argv.slice(1);
  } else {
    usageError(`unknown command "${argv[0]}"`);
  }

  const parsed: ParsedArgs = {
    command,
    file: null,
    contextFiles: [],
    noProfile: false,
    force: false,
    format: "json",
    consume: false,
  };

  let sawDoubleDash = false;
  let fileSeen = false;

  for (let i = 0; i < rest.length; i++) {
    const token = rest[i];

    if (!sawDoubleDash && token === "--") {
      sawDoubleDash = true;
      continue;
    }

    if (!sawDoubleDash && token.startsWith("--")) {
      switch (token) {
        case "--intent": {
          const value = takeValue(rest, i, token);
          if (!INTENTS.includes(value as ReadingIntent)) {
            usageError(`--intent must be one of ${INTENTS.join(", ")}`);
          }
          parsed.intent = value as ReadingIntent;
          i++;
          break;
        }
        case "--depth": {
          const value = takeValue(rest, i, token);
          if (!DEPTHS.includes(value as ReadingDepth)) {
            usageError(`--depth must be one of ${DEPTHS.join(", ")}`);
          }
          parsed.depth = value as ReadingDepth;
          i++;
          break;
        }
        case "--profile":
          parsed.profile = takeValue(rest, i, token);
          i++;
          break;
        case "--context":
          parsed.contextFiles.push(takeValue(rest, i, token));
          i++;
          break;
        case "--no-profile":
          parsed.noProfile = true;
          break;
        case "--provider":
          parsed.provider = takeValue(rest, i, token);
          i++;
          break;
        case "--model":
          parsed.model = takeValue(rest, i, token);
          i++;
          break;
        case "--force":
          parsed.force = true;
          break;
        case "--format": {
          const value = takeValue(rest, i, token);
          if (value !== "json" && value !== "markdown") {
            usageError("--format must be json or markdown");
          }
          parsed.format = value;
          i++;
          break;
        }
        case "--output":
          parsed.output = takeValue(rest, i, token);
          i++;
          break;
        case "--consume":
          parsed.consume = true;
          break;
        case "--keep-source":
          parsed.consume = false;
          break;
        case "--title":
          parsed.title = takeValue(rest, i, token);
          i++;
          break;
        case "--source-url":
          parsed.sourceUrl = takeValue(rest, i, token);
          i++;
          break;
        default:
          usageError(`unknown option "${token}"`);
      }
      continue;
    }

    if (fileSeen) {
      usageError(`unexpected extra argument "${token}"`);
    }
    parsed.file = token;
    fileSeen = true;
  }

  if (parsed.file === null && command !== "context-explain") {
    usageError(`command "${command}" requires a file path or "-" for stdin`);
  }

  if (parsed.file === "-" && !parsed.title) {
    usageError("reading from stdin requires --title");
  }

  if (command !== "analyze" && parsed.format !== "json") {
    usageError("--format is only valid for analyze");
  }

  if (command !== "build" && parsed.output) {
    usageError("--output is only valid for build");
  }

  if (command !== "open" && parsed.consume) {
    usageError("--consume is only valid for open");
  }

  return parsed;
}
