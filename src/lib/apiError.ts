import type { AxiosError } from 'axios';

/** Extrai mensagem legível de respostas NestJS / Axios. */
export function getApiErrorMessage(error: unknown, fallback = 'Ocorreu um erro. Tente novamente.'): string {
  const err = error as AxiosError<{ message?: string | string[]; error?: string }>;
  const data = err.response?.data;
  if (!data) return err.message || fallback;
  if (typeof data.message === 'string') return data.message;
  if (Array.isArray(data.message)) return data.message.join(', ');
  if (typeof data.error === 'string') return data.error;
  return fallback;
}
