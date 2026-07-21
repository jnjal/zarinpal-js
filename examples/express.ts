// ─── مثال: Express.js ──────────────────────────────────────────────
// نحوه استفاده از zarinpal-js در پروژه Express.js

import express from 'express';
import { Zarinpal } from '../src/index.js';

const app = express();
app.use(express.json());

// ─── ساخت کلاینت زرین‌پال ─────────────────────────────────────────
const zp = new Zarinpal({
  merchantId: process.env.ZARINPAL_MERCHANT_ID || 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  sandbox: true,  // برای تست، در production بذارید false
});

// ─── مرحله ۱: ایجاد درخواست پرداخت ────────────────────────────────
app.post('/pay', async (req, res) => {
  try {
    const { amount, description, email, mobile } = req.body;

    const payment = await zp.requestPayment({
      amount: amount || 10000,        // مبلغ به تومان
      description: description || 'خرید محصول',
      callbackUrl: `${req.protocol}://${req.get('host')}/verify`,
      email,
      mobile,
    });

    console.log('🔑 Authority:', payment.authority);
    console.log('🔗 URL:', payment.url);
    console.log('💰 کارمزد:', payment.fee, 'تومان');

    // هدایت کاربر به درگاه پرداخت
    res.redirect(payment.url);
  } catch (error) {
    console.error('❌ خطا در ایجاد درخواست:', error);
    res.status(500).json({ error: 'خطا در اتصال به درگاه پرداخت' });
  }
});

// ─── مرحله ۲: وریفای پرداخت (بازگشت از درگاه) ─────────────────────
app.get('/verify', async (req, res) => {
  try {
    const { Authority, Status } = req.query;

    // بررسی وضعیت پرداخت
    if (Status !== 'OK') {
      return res.status(400).json({
        success: false,
        message: 'پرداخت توسط کاربر لغو شد',
      });
    }

    // وریفای با زرین‌پال
    const verify = await zp.verifyPayment({
      amount: 10000,  // ⚠️ باید با مبلغ درخواست برابر باشد
      authority: Authority as string,
    });

    if (verify.success) {
      console.log('✅ پرداخت موفق!');
      console.log('📋 شماره رفرنس:', verify.refId);
      console.log('💳 شماره کارت (رمزنگاری شده):', verify.cardHash);

      res.json({
        success: true,
        refId: verify.refId,
        cardPan: verify.cardPan,
        fee: verify.fee,
      });
    } else {
      console.log('❌ پرداخت ناموفق:', verify.message);
      res.json({
        success: false,
        message: verify.message,
      });
    }
  } catch (error) {
    console.error('❌ خطا در وریفای:', error);
    res.status(500).json({ error: 'خطا در وریفای پرداخت' });
  }
});

// ─── شروع سرور ────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 سرور روی پورت ${PORT} اجرا شد`);
  console.log(`💳 برای پرداخت: http://localhost:${PORT}/pay`);
});
