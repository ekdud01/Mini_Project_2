import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** shadcn/ui 공통 유틸: className 병합 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
