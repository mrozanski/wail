export const ExitCode = {
  Success: 0,
  UsageError: 1,
  InputError: 2,
  ConfigError: 3,
  ProviderError: 4,
  InvalidOutput: 5,
  WriteError: 6,
  BrowserOpenError: 7,
} as const;

export type ExitCode = (typeof ExitCode)[keyof typeof ExitCode];
