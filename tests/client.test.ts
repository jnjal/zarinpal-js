// ─── تست‌های zarinpal-js ───────────────────────────────────────────
// تست‌ها با test runner داخلی Node.js (node:test)

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Zarinpal } from '../src/client.js';
import { ZarinpalError, ZarinpalValidationError } from '../src/errors.js';
import { ZARINPAL_STATUS_CODES } from '../src/types.js';

// ─── تست ساخت کلاینت ─────────────────────────────────────────────

describe('Zarinpal Client', () => {
  const TEST_MERCHANT_ID = 'test-merchant-id-123456';

  it('باید با merchant_id ساخته بشه', () => {
    const zp = new Zarinpal({ merchantId: TEST_MERCHANT_ID });
    assert.ok(zp, 'کلاینت باید ساخته بشه');
  });

  it('باید بدون merchant_id خطا بده', () => {
    assert.throws(
      () => new Zarinpal({ merchantId: '' }),
      ZarinpalValidationError
    );
  });

  it('باید sandbox mode رو درست تشخیص بده', () => {
    const sandbox = new Zarinpal({ merchantId: TEST_MERCHANT_ID, sandbox: true });
    const production = new Zarinpal({ merchantId: TEST_MERCHANT_ID, sandbox: false });
    assert.ok(sandbox, 'sandbox mode فعال باشه');
    assert.ok(production, 'production mode فعال باشه');
  });
});

// ─── تست اعتبارسنجی ورودی‌ها ─────────────────────────────────────

describe('Zarinpal Validation', () => {
  const zp = new Zarinpal({ merchantId: 'test-id' });

  it('requestPayment باید برای مبلغ کمتر از 1000 خطا بده', async () => {
    try {
      await zp.requestPayment({
        amount: 500,
        description: 'تست',
        callbackUrl: 'https://example.com/verify',
      });
      assert.fail('باید خطا می‌داد');
    } catch (error) {
      assert.ok(error instanceof ZarinpalValidationError);
    }
  });

  it('requestPayment باید بدون description خطا بده', async () => {
    try {
      await zp.requestPayment({
        amount: 10000,
        description: '',
        callbackUrl: 'https://example.com/verify',
      });
      assert.fail('باید خطا می‌داد');
    } catch (error) {
      assert.ok(error instanceof ZarinpalValidationError);
    }
  });

  it('requestPayment باید بدون callbackUrl خطا بده', async () => {
    try {
      await zp.requestPayment({
        amount: 10000,
        description: 'تست',
        callbackUrl: '',
      });
      assert.fail('باید خطا می‌داد');
    } catch (error) {
      assert.ok(error instanceof ZarinpalValidationError);
    }
  });

  it('verifyPayment باید بدون authority خطا بده', async () => {
    try {
      await zp.verifyPayment({
        amount: 10000,
        authority: '',
      });
      assert.fail('باید خطا می‌داد');
    } catch (error) {
      assert.ok(error instanceof ZarinpalValidationError);
    }
  });
});

// ─── تست کدهای وضعیت ──────────────────────────────────────────────

describe('ZarinPal Status Codes', () => {
  it('باید کد 100 (موفقیت) رو داشته باشه', () => {
    assert.equal(ZARINPAL_STATUS_CODES[100], 'عملیات با موفقیت انجام شد');
  });

  it('باید کد 101 (وریفای شده) رو داشته باشه', () => {
    assert.equal(ZARINPAL_STATUS_CODES[101], 'پرداخت قبلاً وریفای شده است');
  });

  it('باید خطای merchant_id نامعتبر رو داشته باشه', () => {
    assert.equal(ZARINPAL_STATUS_CODES[-2], 'merchant_id صحیح نیست');
  });
});

// ─── تست ارورها ───────────────────────────────────────────────────

describe('ZarinPal Errors', () => {
  it('ZarinpalError باید کد و توضیحات داشته باشه', () => {
    const error = new ZarinpalError(-2);
    assert.equal(error.code, -2);
    assert.equal(error.description, 'merchant_id صحیح نیست');
    assert.ok(error.message.includes('زرین‌پال'));
  });

  it('ZarinpalValidationError باید پیام مناسب داشته باشه', () => {
    const error = new ZarinpalValidationError('مبلغ نامعتبر');
    assert.ok(error.message.includes('مبلغ نامعتبر'));
    assert.equal(error.name, 'ZarinpalValidationError');
  });
});
