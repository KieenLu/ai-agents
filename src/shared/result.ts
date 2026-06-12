export type Result<T> = SuccessResult<T> | ErrorResult;

export interface SuccessResult<T> {
  success: true;
  value: T;
}

export interface ErrorResult {
  success: false;
  error: string;
  code: string;
}

export function success<T>(value: T): SuccessResult<T> {
  return { success: true, value };
}

export function error(message: string, code: string): ErrorResult {
  return { success: false, error: message, code };
}

export function isSuccess<T>(result: Result<T>): result is SuccessResult<T> {
  return result.success === true;
}

export function isError<T>(result: Result<T>): result is ErrorResult {
  return result.success === false;
}