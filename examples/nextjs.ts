// ─── مثال: Next.js API Route ───────────────────────────────────────
// نحوه استفاده از zarinpal-js در Next.js App Router

import { NextRequest, NextResponse } from 'next/server';
import { Zarinpal } from 'zarinpal-js';

// ─── ساخت کلاینت زرین‌پال ─────────────────────────────────────────
const zp = new Zarinpal({
  merchantId: process.env.ZARINPAL_MERCHANT_ID!,
  sandbox: process.env.NODE_ENV !== 'production',
});

// ─── POST /api/pay — ایجاد درخواست پرداخت ──────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { amount, description, email, mobile } = await req.json();

    const payment = await zp.requestPayment({
      amount: amount || 10000,
      description: description || 'خرید محصول',
      callbackUrl: `${req.nextUrl.origin}/api/verify`,
      email,
      mobile,
    });

    // هدایت کاربر به درگاه پرداخت
    return NextResponse.redirect(payment.url);
  } catch (error) {
    console.error('خطا:', error);
    return NextResponse.json(
      { error: 'خطا در اتصال به درگاه پرداخت' },
      { status: 500 }
    );
  }
}

// ─── GET /api/verify — وریفای پرداخت ───────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const authority = req.nextUrl.searchParams.get('Authority');
    const status = req.nextUrl.searchParams.get('Status');

    if (status !== 'OK') {
      return NextResponse.json({
        success: false,
        message: 'پرداخت لغو شد',
      });
    }

    const verify = await zp.verifyPayment({
      amount: 10000,
      authority: authority!,
    });

    if (verify.success) {
      return NextResponse.json({
        success: true,
        refId: verify.refId,
        message: 'پرداخت با موفقیت انجام شد',
      });
    }

    return NextResponse.json({
      success: false,
      message: verify.message,
    });
  } catch (error) {
    console.error('خطا:', error);
    return NextResponse.json(
      { error: 'خطا در وریفای پرداخت' },
      { status: 500 }
    );
  }
}
