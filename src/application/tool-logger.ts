import { ToolCallLogEntry } from '../domain/report';
import { SuccessResult, ErrorResult } from '../shared/result';

export interface ToolCall<TInput extends Record<string, unknown>, TResult> {
  toolName: string;
  input: TInput;
  output: SuccessResult<TResult> | ErrorResult;
  timestamp: string;
  sequenceNumber: number;
}

export class ToolLogger {
  private logs: ToolCall<Record<string, unknown>, unknown>[] = [];
  private sequenceNumber: number = 0;

  log<TInput extends Record<string, unknown>, TResult>(
    toolName: string,
    input: TInput,
    output: TResult
  ): void {
    this.sequenceNumber += 1;
    const logEntry: ToolCall<Record<string, unknown>, unknown> = {
      toolName,
      input,
      output: { success: true, value: output },
      timestamp: new Date().toISOString(),
      sequenceNumber: this.sequenceNumber,
    };
    this.logs.push(logEntry);
  }

  logError<TInput extends Record<string, unknown>>(
    toolName: string,
    input: TInput,
    errorMessage: string
  ): void {
    this.sequenceNumber += 1;
    const logEntry: ToolCall<Record<string, unknown>, unknown> = {
      toolName,
      input,
      output: { success: false, error: errorMessage, code: 'TOOL_ERROR' },
      timestamp: new Date().toISOString(),
      sequenceNumber: this.sequenceNumber,
    };
    this.logs.push(logEntry);
  }

  getLogs(): ToolCallLogEntry[] {
    return this.logs.map(log => ({
      toolName: log.toolName,
      input: log.input,
      output: log.output,
      timestamp: log.timestamp,
      sequenceNumber: log.sequenceNumber,
    }));
  }

  clear(): void {
    this.logs = [];
    this.sequenceNumber = 0;
  }
}