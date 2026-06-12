import { ToolCallLogEntry } from '../../domain/report';

export class ToolCallLogger {
  private static instance: ToolCallLogger;
  private logs: ToolCallLogEntry[] = [];
  private sequence = 0;

  static getInstance(): ToolCallLogger {
    if (!ToolCallLogger.instance) {
      ToolCallLogger.instance = new ToolCallLogger();
    }
    return ToolCallLogger.instance;
  }

  log<TInput extends Record<string, unknown>, TResult>(
    toolName: string,
    input: TInput,
    output: TResult
  ): void {
    this.sequence += 1;
    this.logs.push({
      toolName,
      input,
      output,
      timestamp: new Date().toISOString(),
      sequenceNumber: this.sequence,
    });
  }

  getLogs(): ToolCallLogEntry[] {
    return [...this.logs];
  }

  clear(): void {
    this.logs = [];
    this.sequence = 0;
  }
}