<div dir="rtl">

# 🪙 zarinpal-js

**SDK ساده و تمیز برای درگاه پرداخت زرین‌پال — TypeScript / Node.js**

[![license](https://img.shields.io/github/license/jnjal/zarinpal-js.svg)](https://github.com/jnjal/zarinpal-js/blob/main/LICENSE)
[![typescript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)

---

## ✨ چرا zarinpal-js؟

- 🚀 **ساده:** فقط ۳ خط کد تا اولین پرداخت
- 📝 **TypeScript:** تایپ‌های کامل و IntelliSense عالی
- 🔒 **امن:** اعتبارسنجی ورودی‌ها و مدیریت خطای حرفه‌ای
- 🧪 **تست‌شده:** ۱۲ تست واحد
- 📦 **سبک:** بدون وابستگی اضافی
- 🇮🇷 **فارسی:** پیام‌های خطا به فارسی

---

## 📦 نصب

```bash
git clone https://github.com/jnjal/zarinpal-js.git
cd zarinpal-js
npm install
npm run build
```

---

## 🚀 شروع سریع

### ۱. ساخت کلاینت

```typescript
import { Zarinpal } from 'zarinpal-js'

const zp = new Zarinpal({
  merchantId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  sandbox: true,  // برای تست
})
```

### ۲. ایجاد درخواست پرداخت

```typescript
const payment = await zp.requestPayment({
  amount: 50000,                    // مبلغ به تومان
  description: 'خرید اشتراک',       // توضیحات تراکنش
  callbackUrl: 'https://yoursite.com/verify',  // آدرس بازگشت
  email: 'user@example.com',        // اختیاری
  mobile: '09121234567',           // اختیاری
})

// هدایت کاربر به درگاه پرداخت
res.redirect(payment.url)
```

### ۳. وریفای پرداخت

```typescript
const verify = await zp.verifyPayment({
  amount: 50000,                    // ⚠️ باید با مبلغ درخواست برابر باشد
  authority: req.query.Authority,   // کد authority از URL بازگشتی
})

if (verify.success) {
  console.log('✅ پرداخت موفق!')
  console.log('📋 شماره رفرنس:', verify.refId)
} else {
  console.log('❌ پرداخت ناموفق:', verify.message)
}
```

---

## 📖 راهنمای کامل

### تنظیمات کلاینت

```typescript
const zp = new Zarinpal({
  merchantId: 'YOUR_MERCHANT_ID',  // الزامی
  sandbox: true,                   // پیش‌فرض: false
  timeout: 10000,                  // پیش‌فرض: 15000ms
})
```

### مثال کامل با Express.js

```typescript
import express from 'express'
import { Zarinpal } from 'zarinpal-js'

const app = express()
const zp = new Zarinpal({
  merchantId: process.env.ZARINPAL_MERCHANT_ID!,
  sandbox: true,
})

// ایجاد درخواست پرداخت
app.post('/pay', async (req, res) => {
  const payment = await zp.requestPayment({
    amount: 50000,
    description: 'خرید محصول',
    callbackUrl: `${req.protocol}://${req.get('host')}/verify`,
  })
  res.redirect(payment.url)
})

// وریفای پرداخت
app.get('/verify', async (req, res) => {
  const verify = await zp.verifyPayment({
    amount: 50000,
    authority: req.query.Authority as string,
  })

  if (verify.success) {
    res.json({ success: true, refId: verify.refId })
  } else {
    res.json({ success: false, message: verify.message })
  }
})
```

### مثال کامل با Next.js

```typescript
// app/api/pay/route.ts
import { Zarinpal } from 'zarinpal-js'

const zp = new Zarinpal({
  merchantId: process.env.ZARINPAL_MERCHANT_ID!,
  sandbox: process.env.NODE_ENV !== 'production',
})

export async function POST(req: Request) {
  const { amount, description } = await req.json()

  const payment = await zp.requestPayment({
    amount,
    description,
    callbackUrl: `${new URL(req.url).origin}/api/verify`,
  })

  return Response.redirect(payment.url)
}
```

---

## ⚠️ نکات مهم امنیتی

> **هرگز `merchant_id` رو در کلاینت (فرانت‌اند) قرار ندهید!**

> **همیشه مبلغ رو در وریفای با مبلغ اصلی مقایسه کنید.**

> **از `sandbox` فقط در محیط تست استفاده کنید.**

---

## 📋 کدهای خطای زرین‌پال

| کد | توضیح |
|-----|--------|
| 100 | ✅ عملیات با موفقیت انجام شد |
| 101 | ✅ پرداخت قبلاً وریفای شده است |
| -1 | ❌ اطلاعات ارسالی ناقص است |
| -2 | ❌ merchant_id صحیح نیست |
| -3 | ❌ مبلغ پرداختی مجاز نیست |
| -4 | ❌ شماره کارت صحیح نیست |
| -5 | ❌ مبلغ پرداختی از سقف مجاز بیشتر است |
| -6 | ❌ IP شما مسدود شده است |
| -7 | ❌ merchant_id فعال نیست |
| -11 | ❌ آدرس بازگشت نامعتبر است |
| -12 | ❌ توضیحات بیش از 100 کاراکتر است |
| -19 | ❌ مبلغ باید حداقل 10000 ریال باشد |

---

## 🧪 تست‌ها

```bash
npm test
```

---

## 📁 ساختار پروژه

```
zarinpal-js/
├── src/
│   ├── index.ts           # اکسپورت اصلی
│   ├── client.ts          # کلاس Zarinpal
│   ├── types.ts           # تایپ‌ها و اینترفیس‌ها
│   └── errors.ts          # ارورهای سفارشی
├── examples/
│   ├── express.ts         # مثال Express.js
│   └── nextjs.ts          # مثال Next.js
├── tests/
│   └── client.test.ts     # تست‌های واحد
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🤝 مشارکت

- ?
## 📄 لایسنس

[MIT](https://github.com/jnjal/zarinpal-js/blob/main/LICENSE)

</div>
