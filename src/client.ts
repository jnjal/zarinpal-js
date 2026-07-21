// ─── ZarinPal Client ───────────────────────────────────────────────
// کلاس اصلی ارتباط با API زرین‌پال

import {
  ZarinpalConfig,
  PaymentRequestInput,
  PaymentRequestResponse,
  PaymentVerifyInput,
  PaymentVerifyResponse,
  UnverifiedInput,
  UnverifiedResponse,
  ZarinpalEndpoints,
} from './types.js';
import {
  ZarinpalError,
  ZarinpalValidationError,
  ZarinpalNetworkError,
} from './errors.js';

// ─── آدرس‌های API ─────────────────────────────────────────────────

const SANDBOX_ENDPOINTS: ZarinpalEndpoints = {
  request: 'https://sandbox.zarinpal.com/pg/v4/payment/request.json',
  verify: 'https://sandbox.zarinpal.com/pg/v4/payment/verify.json',
  startPay: 'https://sandbox.zarinpal.com/pg/StartPay/',
  unverified: 'https://sandbox.zarinpal.com/pg/v4/payment/unverified.json',
};

const PRODUCTION_ENDPOINTS: ZarinpalEndpoints = {
  request: 'https://api.zarinpal.com/pg/v4/payment/request.json',
  verify: 'https://api.zarinpal.com/pg/v4/payment/verify.json',
  startPay: 'https://api.zarinpal.com/pg/StartPay/',
  unverified: 'https://api.zarinpal.com/pg/v4/payment/unverified.json',
};

// ─── نسخه SDK ─────────────────────────────────────────────────────
const SDK_VERSION = '1.0.0';

/**
 * کلاینت زرین‌پال
 *
 * @example
 * ```ts
 * import { Zarinpal } from 'zarinpal-js'
 *
 * const zp = new Zarinpal({
 *   merchantId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
 *   sandbox: true,  // برای تست
 * })
 *
 * // ساخت درخواست پرداخت
 * const payment = await zp.requestPayment({
 *   amount: 50000,
 *   description: 'خرید اشتراک',
 *   callbackUrl: 'https://yoursite.com/verify',
 * })
 *
 * // هدایت کاربر به درگاه پرداخت
 * if (payment.url) {
 *   res.redirect(payment.url)
 * }
 *
 * // وریفای پرداخت (در callback)
 * const verify = await zp.verifyPayment({
 *   amount: 50000,
 *   authority: req.query.Authority as string,
 * })
 *
 * if (verify.success) {
 *   console.log('شماره رفرنس:', verify.refId)
 * }
 * ```
 */
export class Zarinpal {
  private readonly merchantId: string;
  private readonly endpoints: ZarinpalEndpoints;
  private readonly timeout: number;

  constructor(config: ZarinpalConfig) {
    if (!config.merchantId) {
      throw new ZarinpalValidationError('شناسه merchant الزامی است');
    }

    this.merchantId = config.merchantId;
    this.endpoints = config.sandbox ? SANDBOX_ENDPOINTS : PRODUCTION_ENDPOINTS;
    this.timeout = config.timeout || 15000;
  }

  // ─── درخواست پرداخت ─────────────────────────────────────────────

  /**
   * ساخت درخواست پرداخت جدید
   *
   * @param input - اطلاعات درخواست پرداخت
   * @returns URL درگاه پرداخت و authority
   */
  async requestPayment(input: {
    amount: number;
    description: string;
    callbackUrl: string;
    email?: string;
    mobile?: string;
  }): Promise<{ url: string; authority: string; fee: number }> {
    // اعتبارسنجی ورودی
    if (!input.amount || input.amount < 1000) {
      throw new ZarinpalValidationError('مبلغ باید حداقل 1000 تومان باشد');
    }
    if (!input.description) {
      throw new ZarinpalValidationError('توضیحات تراکنش الزامی است');
    }
    if (!input.callbackUrl) {
      throw new ZarinpalValidationError('آدرس بازگشت (callbackUrl) الزامی است');
    }

    const body: PaymentRequestInput = {
      merchant_id: this.merchantId,
      amount: input.amount,
      callback_url: input.callbackUrl,
      description: input.description,
      metadata: {
        email: input.email,
        mobile: input.mobile,
      },
    };

    const response = await this.request<PaymentRequestResponse>(
      this.endpoints.request,
      body
    );

    if (response.data.code !== 100) {
      throw new ZarinpalError(response.data.code);
    }

    return {
      url: `${this.endpoints.startPay}${response.data.authority}`,
      authority: response.data.authority,
      fee: response.data.fee,
    };
  }

  // ─── وریفای پرداخت ──────────────────────────────────────────────

  /**
   * وریفای (تایید) پرداخت
   *
   * @param input - اطلاعات وریفای
   * @returns نتیجه وریفای
   */
  async verifyPayment(input: {
    amount: number;
    authority: string;
  }): Promise<{
    success: boolean;
    refId: number;
    cardHash: string;
    cardPan: string;
    fee: number;
    message: string;
  }> {
    if (!input.authority) {
      throw new ZarinpalValidationError('کد authority الزامی است');
    }
    if (!input.amount || input.amount < 1000) {
      throw new ZarinpalValidationError('مبلغ باید حداقل 1000 تومان باشد');
    }

    const body: PaymentVerifyInput = {
      merchant_id: this.merchantId,
      amount: input.amount,
      authority: input.authority,
    };

    const response = await this.request<PaymentVerifyResponse>(
      this.endpoints.verify,
      body
    );

    return {
      success: response.data.code === 100 || response.data.code === 101,
      refId: response.data.ref_id,
      cardHash: response.data.card_hash,
      cardPan: response.data.card_pan,
      fee: response.data.fee,
      message: response.data.message,
    };
  }

  // ─── پرداخت‌های وریفای نشده ─────────────────────────────────────

  /**
   * دریافت لیست پرداخت‌های وریفای نشده
   */
  async getUnverified(): Promise<
    Array<{ amount: number; authority: string }>
  > {
    const body: UnverifiedInput = {
      merchant_id: this.merchantId,
    };

    const response = await this.request<UnverifiedResponse>(
      this.endpoints.unverified,
      body
    );

    return response.data.authorities;
  }

  // ─── درخواست HTTP خصوصی ─────────────────────────────────────────

  private async request<T>(url: string, body: unknown): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent': `zarinpal-js/${SDK_VERSION}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new ZarinpalNetworkError(
          `خطای HTTP ${response.status}: ${response.statusText}`
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof ZarinpalNetworkError) {
        throw error;
      }
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ZarinpalNetworkError('درخواست زمان‌بر شد (timeout)');
      }
      throw new ZarinpalNetworkError(
        'خطا در اتصال به سرور زرین‌پال',
        error instanceof Error ? error : undefined
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
