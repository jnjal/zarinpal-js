// ─── ZarinPal Errors ───────────────────────────────────────────────
// مدیریت خطاهای سفارشی زرین‌پال

import { ZARINPAL_STATUS_CODES } from './types.js';

/**
 * خطای اصلی زرین‌پال
 * وقتی API زرین‌پال کد خطایی غیر از 100 یا 101 برگردونه، این ارور پرتاب میشه
 */
export class ZarinpalError extends Error {
  /** کد خطا از API زرین‌پال */
  public readonly code: number;

  /** توضیحات خطا به فارسی */
  public readonly description: string;

  constructor(code: number, message?: string) {
    const description = ZARINPAL_STATUS_CODES[code] || 'خطای ناشناخته';
    const errorMessage = message || `زرین‌پال: ${description} (کد: ${code})`;
    super(errorMessage);
    this.name = 'ZarinpalError';
    this.code = code;
    this.description = description;
  }
}

/**
 * خطای مربوط به اعتبارسنجی ورودی‌ها
 */
export class ZarinpalValidationError extends Error {
  constructor(message: string) {
    super(`خطای اعتبارسنجی: ${message}`);
    this.name = 'ZarinpalValidationError';
  }
}

/**
 * خطای مربوط به شبکه و اتصال
 */
export class ZarinpalNetworkError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(`خطای شبکه: ${message}`);
    this.name = 'ZarinpalNetworkError';
  }
}
