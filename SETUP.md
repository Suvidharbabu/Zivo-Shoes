# Zivo — Setup Guide (for beginners)

This guide takes you from zero to a live store. Do the steps **in order**. Each step says exactly where to click.

You will create accounts on four free services:

| Service | What it does for Zivo |
|---|---|
| **Supabase** | Database, user logins, product image storage |
| **Razorpay** | Takes payments (cards, UPI, netbanking) |
| **Resend** | Sends order confirmation emails (you already have an account) |
| **Vercel** | Hosts the website on the internet |

> 🔐 **Golden rule:** some keys are secret. Never paste secret keys into chat, screenshots, GitHub or anywhere public. They go only in `.env.local` (on your computer) and in Vercel's settings.

---

## Contents

1. [Install the tools and run the project locally](#1-install-the-tools-and-run-the-project-locally)
2. [Set up Supabase](#2-set-up-supabase)
3. [Make your account an admin](#3-make-your-account-an-admin)
4. [Set up Razorpay (test mode)](#4-set-up-razorpay-test-mode)
5. [Fill in `.env.local`](#5-fill-in-envlocal)
6. [Set up Resend emails](#6-set-up-resend-emails)
7. [Deploy to Vercel](#7-deploy-to-vercel)
8. [Switch Razorpay to live mode](#8-switch-razorpay-to-live-mode)
9. [Common errors and fixes](#9-common-errors-and-fixes)
10. [Final test checklist](#10-final-test-checklist)

---

## 1. Install the tools and run the project locally

### 1.1 Install the prerequisites

1. **Node.js (LTS)**: this is already installed on this computer (v24). On another computer, download the **LTS** version from <https://nodejs.org> and install it with the default options.
2. **Git**: already installed. Otherwise get it from <https://git-scm.com>.
3. **VS Code**: already installed.

To check, open a **new** terminal in VS Code (menu **Terminal → New Terminal**) and run:

```bash
node -v
npm -v
git --version
```

Each command should print a version number. If you see *"node is not recognized"*, close VS Code completely and open it again (see [Common errors](#9-common-errors-and-fixes)).

### 1.2 Install the project's packages

In the VS Code terminal, inside the `Zivo Shoes` folder:

```bash
npm install
```

This creates a `node_modules` folder. It can take a minute or two.

> ⚠️ **OneDrive note:** this project is inside your OneDrive folder. OneDrive tries to sync `node_modules` and `.next` (thousands of files), which can make things slow or cause "EPERM / file is locked" errors. If that happens, either **pause OneDrive syncing** while you work (click the OneDrive cloud icon in the taskbar → ⚙️ → *Pause syncing*), or move the project to a folder outside OneDrive such as `C:\Projects\Zivo Shoes`.

### 1.3 Run the website

You need Supabase set up first (Step 2) and `.env.local` filled in (Step 5). Once they are:

```bash
npm run dev
```

Open <http://localhost:3000> in your browser. To stop the server, click the terminal and press **Ctrl + C**.

---

## 2. Set up Supabase

### 2.1 Create the project

1. Go to <https://supabase.com> and sign up (the free plan is fine).
2. Click **New project**.
3. **Name:** `zivo`. **Database password:** click *Generate a password* and save it somewhere safe. **Region:** *South Asia (Mumbai)*, the closest to Indian customers.
4. Click **Create new project** and wait about 2 minutes until it's ready.

### 2.2 Run the SQL files (in this exact order)

The files are in the `supabase/` folder of this project.

1. In Supabase, click **SQL Editor** in the left sidebar.
2. Click **+ New query**.
3. In VS Code, open **`supabase/schema.sql`**, select everything (**Ctrl + A**), copy it (**Ctrl + C**), and paste it into the Supabase editor.
4. Click **Run** (or press **Ctrl + Enter**). You should see *"Success. No rows returned"*.
5. Click **+ New query** again.
6. Open **`supabase/seed.sql`**, then copy, paste and **Run** it the same way.

| Order | File | What it does |
|---|---|---|
| 1st | `supabase/schema.sql` | Creates the tables, security rules (RLS), triggers, the payment function and the `product-images` storage bucket |
| 2nd | `supabase/seed.sql` | Adds the 3 categories and 9 products with UK sizes 6–11 and stock |

✅ **Check:** click **Table Editor** in the sidebar. You should see tables such as `products` (9 rows), `categories` (3 rows) and `product_variants` (54 rows).

> Both files are safe to run again. They skip anything that already exists.

### 2.3 Check Storage

`schema.sql` already created the image bucket. To confirm, click **Storage** in the sidebar. You should see a bucket called **`product-images`** marked **Public**. You don't need to change anything.

(The 9 sample product images are part of the website itself, in `public/products/`. Images you upload from the admin panel go into this bucket.)

### 2.4 Configure Auth (logins and emails)

1. Go to **Authentication → Sign In / Providers** (called **Providers** in some versions) and make sure **Email** is enabled.
   - **Confirm email** is ON by default. New customers must click a link in an email before they can log in. This is recommended for a real store.
   - For quick testing you can turn it **OFF**, and sign-ups will log in immediately.
2. Go to **Authentication → URL Configuration**:
   - **Site URL:** `http://localhost:3000` for now. You'll change it to your Vercel URL in Step 7.
   - **Redirect URLs:** click **Add URL** and add both of these:
     - `http://localhost:3000/**`
     - `https://YOUR-VERCEL-APP.vercel.app/**` (add this after Step 7, when you know the URL)
   - Click **Save**.
3. **About Supabase's built-in email:** it is only for testing. It sends very few emails per hour and may only deliver to your own team's addresses. Before launch, set up custom SMTP so sign-up and password-reset emails reach every customer. You can use your Resend account for this (see [Step 6.4](#64-optional-but-recommended-use-resend-for-supabase-login-emails-too)).

### 2.5 Find your API keys

Go to **Project Settings** (⚙️ at the bottom of the sidebar):

| What you need | Where to find it | Goes into |
|---|---|---|
| Project URL | **Data API** (or **API**) → *Project URL*, e.g. `https://abcdxyz.supabase.co` | `NEXT_PUBLIC_SUPABASE_URL` |
| Public key | **API Keys** → the **publishable** key (`sb_publishable_…`), or the legacy **anon** key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Secret key 🔐 | **API Keys** → a **secret** key (`sb_secret_…`), or the legacy **service_role** key | `SUPABASE_SERVICE_ROLE_KEY` |

> 🔐 The secret / service_role key can bypass all security rules. Keep it secret, and never put `NEXT_PUBLIC_` in front of its name.

---

## 3. Make your account an admin

1. Start the site (`npm run dev`), open <http://localhost:3000/signup> and create your account. Confirm your email if asked.
2. In Supabase, open **SQL Editor → + New query** and run this, **using your own email**:

   ```sql
   update public.profiles
   set role = 'admin'
   where email = 'you@example.com';
   ```

   You should see *"Success. 1 rows affected"*. If it says 0 rows, the email doesn't match exactly, or you haven't signed up yet.
3. On the website, **log out and log back in**.
4. Open the account menu (👤 icon). You should now see **Admin dashboard**, or you can go to <http://localhost:3000/admin>.

The admin area has:

- **Products**: add, edit and delete products, prices and stock per size.
- **Images**: pick a product to upload images, replace an image, edit each image's **description** (used as alt text and a caption), reorder images, choose the **primary** image, or delete images.
- **Orders**: filter by status, change status (pending → paid → shipped → delivered / cancelled), see payment IDs, and resend the confirmation email.

Customers who aren't admins get a *404 Not Found* page at `/admin`. The database also blocks them from changing products, even if they try another way.

To remove admin rights later, run the same SQL with `role = 'customer'`.

---

## 4. Set up Razorpay (test mode)

Test mode uses fake money, so you can test everything without real payments.

### 4.1 Create the account and get test keys

1. Sign up at <https://razorpay.com> → **Sign Up**. You can use test mode before completing KYC.
2. In the Dashboard, make sure the top bar shows **Test Mode**. If it doesn't, use the toggle to switch to it.
3. Go to **Account & Settings → API Keys** (older dashboards: **Settings → API Keys**).
4. Click **Generate Test Key**. You'll see:
   - **Key ID**, which starts with `rzp_test_`, for `NEXT_PUBLIC_RAZORPAY_KEY_ID`
   - **Key Secret** 🔐, for `RAZORPAY_KEY_SECRET`. **It's shown only once, so copy it now.** If you lose it, regenerate the key.

### 4.2 Make sure payments are captured automatically

Go to **Account & Settings → Payment Capture** and make sure it's set to **Automatic** (the default). Otherwise payments stay "authorized" and the webhook won't confirm them.

### 4.3 Set up the webhook (backup payment confirmation)

The website confirms payments right after checkout. The webhook is a **backup**: if a customer closes the tab right after paying, Razorpay still tells your server.

The webhook needs a public URL, so **do this after deploying to Vercel (Step 7)**. Payments still work locally without it.

1. Go to **Account & Settings → Webhooks** (older dashboards: **Settings → Webhooks**) and click **+ Add New Webhook**.
2. **Webhook URL:** `https://YOUR-VERCEL-APP.vercel.app/api/razorpay/webhook`
3. **Secret:** make up a long random password, for example 32+ letters and numbers. Put this **same value** in `RAZORPAY_WEBHOOK_SECRET` in Vercel.
4. **Active events:** tick
   - `payment.captured`
   - `order.paid`
   - `payment.failed`
5. Click **Create Webhook**.

### 4.4 Test payment details (test mode only)

| Method | What to enter |
|---|---|
| **Card (Visa)** | `4100 2800 0000 1007`, any future expiry date, any CVV |
| **Card (Mastercard)** | `5555 5100 0008 1006`, any future expiry date, any CVV |
| Card OTP | Any **4–10 digit** OTP means success. **Fewer than 4 digits** means failure. |
| **UPI: success** | `success@razorpay` |
| **UPI: failure** | `failure@razorpay` |
| **Netbanking** | Pick any bank, then click **Success** (or **Failure**) on the test page |

Razorpay sometimes updates these, so the latest list is here: <https://razorpay.com/docs/payments/payments/test-card-details/> and <https://razorpay.com/docs/payments/payments/test-upi-details/>.

---

## 5. Fill in `.env.local`

`.env.local` holds your keys on your computer. It is **ignored by Git**, so it never goes to GitHub.

1. In VS Code, right-click **`.env.example`** → **Copy**, then right-click the project folder → **Paste**. Rename the copy to **`.env.local`**.
   Or run this in the terminal: `copy .env.example .env.local` (PowerShell) or `cp .env.example .env.local` (Git Bash).
2. Open `.env.local` and replace each placeholder:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000

NEXT_PUBLIC_SUPABASE_URL=https://abcdxyz.supabase.co        # Step 2.5
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...            # Step 2.5 (publishable / anon)
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...                     # Step 2.5 (secret / service_role) 🔐

NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...                    # Step 4.1
RAZORPAY_KEY_SECRET=...                                     # Step 4.1 🔐
RAZORPAY_WEBHOOK_SECRET=...                                 # Step 4.3 🔐 (any value locally)

RESEND_API_KEY=re_...                                       # Step 6.1 🔐
EMAIL_FROM=Zivo <onboarding@resend.dev>                     # Step 6.2
```

3. Save the file, then **restart** `npm run dev` (Ctrl + C, then run it again). Next.js reads `.env.local` only when it starts.

Rules:
- No spaces around `=`, and no quotes needed.
- Only variables that start with `NEXT_PUBLIC_` are visible in the browser. The 🔐 ones must **never** start with `NEXT_PUBLIC_`.

---

## 6. Set up Resend emails

You already have a Resend account, so you only need an API key and a sender address.

### 6.1 Create an API key

1. Log in at <https://resend.com> and go to **API Keys → Create API Key**.
2. **Name:** `zivo`. **Permission:** *Sending access*. **Domain:** *All domains*.
3. Copy the key (it starts with `re_`, and **it's shown only once**) into `RESEND_API_KEY`.

### 6.2 Choose the sender (`EMAIL_FROM`)

- **For testing:** `Zivo <onboarding@resend.dev>`. In this mode, Resend only delivers to **the email address you signed up to Resend with**. So place your test orders with an account that uses that same email.
- **For real customers:** verify your own domain (next step), then use something like `Zivo <orders@yourdomain.com>`.

### 6.3 Verify your domain (needed before launch)

1. In Resend go to **Domains → Add Domain** and enter a domain you own, e.g. `zivo.in`.
2. Resend shows some **DNS records** (TXT / MX / CNAME). Add them in your domain provider's DNS settings (GoDaddy, Hostinger, Cloudflare…).
3. Click **Verify**. It can take anywhere from a few minutes to a few hours.
4. Change `EMAIL_FROM` to `Zivo <orders@yourdomain.com>`, both locally and in Vercel.

### 6.4 (Optional, but recommended) Use Resend for Supabase login emails too

After your domain is verified, go to Supabase → **Authentication → Emails → SMTP Settings** (or **Project Settings → Auth → SMTP**), turn on **Custom SMTP** and enter:

| Field | Value |
|---|---|
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | a Resend API key |
| Sender email | e.g. `no-reply@yourdomain.com` |
| Sender name | `Zivo` |

Sign-up confirmations and password resets will then reach every customer.

### 6.5 How order emails work

- An email is sent **automatically** once, when an order becomes *paid*.
- Customers see a **"Resend confirmation email"** button on the order confirmation page and in **My Orders → order**. It has a 60-second wait between sends and a limit of 5 sends per order.
- Admins see the same button on **Admin → Orders → order**, along with how many emails were sent and the last error, if any.
- To check delivery, open Resend → **Emails** to see every email, its status and any errors.

---

## 7. Deploy to Vercel

### 7.1 Import the project

1. The code is already on GitHub: <https://github.com/Suvidharbabu/Zivo-Shoes>.
2. Go to <https://vercel.com>, click **Sign Up → Continue with GitHub**, and allow access.
3. Click **Add New… → Project**, find **Zivo-Shoes** and click **Import**.
4. Leave **Framework Preset** as *Next.js* and leave the build settings unchanged.

### 7.2 Add the environment variables

Before clicking Deploy, open **Environment Variables** and add **every variable from your `.env.local`**, one by one (name and value). You can also paste the whole file into the first box and Vercel splits it up.

For `NEXT_PUBLIC_SITE_URL`, enter your future Vercel URL, e.g. `https://zivo-shoes.vercel.app`. You can fix it after the first deploy.

Click **Deploy** and wait about 2 minutes. 🎉

### 7.3 After the first deploy

1. Copy your live URL (e.g. `https://zivo-shoes.vercel.app`).
2. **Vercel:** go to **Settings → Environment Variables**, set `NEXT_PUBLIC_SITE_URL` to that URL, then **Deployments → ⋯ → Redeploy**. Env var changes only apply after a redeploy.
3. **Supabase:** go to **Authentication → URL Configuration**:
   - **Site URL:** your Vercel URL
   - **Redirect URLs:** add `https://zivo-shoes.vercel.app/**` and keep the localhost one for local testing.
4. **Razorpay:** create the webhook now ([Step 4.3](#43-set-up-the-webhook-backup-payment-confirmation)) with `https://zivo-shoes.vercel.app/api/razorpay/webhook`, and make sure `RAZORPAY_WEBHOOK_SECRET` in Vercel matches.

From now on, every `git push` to `main` makes Vercel redeploy automatically.

---

## 8. Switch Razorpay to live mode

Only do this when you're ready to take **real money**.

1. **Activate your account:** in the Razorpay Dashboard, complete **KYC / account activation** (business details, PAN, bank account, website URL). Razorpay reviews your website, so it should be live, with contact, terms, privacy, refund and shipping policy pages, before you apply.
2. When activated, switch the toggle at the top to **Live Mode**.
3. Go to **Account & Settings → API Keys → Generate Live Key**. The live Key ID starts with `rzp_live_`.
4. In live mode, go to **Webhooks → + Add New Webhook** again. Live mode has its own webhooks. Use the same URL and events, and a **new** secret.
5. In **Vercel → Settings → Environment Variables**, update:
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID` = live Key ID
   - `RAZORPAY_KEY_SECRET` = live Key Secret
   - `RAZORPAY_WEBHOOK_SECRET` = the live webhook secret
6. **Redeploy** (Deployments → ⋯ → Redeploy).
7. Do a small real test purchase (e.g. change a product's price to ₹1 in Admin), check the order becomes *paid*, then refund it from the Razorpay Dashboard (**Transactions → Payments → Refund**).

> Keep using test keys in your local `.env.local` so local testing never charges real money.
>
> Refunds are done in the Razorpay Dashboard. Marking an order *cancelled* in Zivo admin does **not** refund it automatically.

---

## 9. Common errors and fixes

| Problem | Fix |
|---|---|
| `node` / `npm` **is not recognized** | Close VS Code completely and reopen it, so it picks up the new PATH. If it still fails, reinstall Node LTS from nodejs.org and restart the computer. |
| **EPERM**, *"operation not permitted"*, *"file is locked"* or very slow installs | OneDrive is syncing `node_modules`. Pause OneDrive syncing, or move the project outside OneDrive (see 1.2). Then delete `node_modules` and `.next` and run `npm install` again. |
| *"Your project's URL and Key are required…"* or *"Supabase is not configured"* | `.env.local` is missing, misnamed (it must be exactly `.env.local`) or has a typo. Fix it, then restart `npm run dev`. On Vercel, check the env vars and redeploy. |
| Home page says **"We couldn't load products right now"** | The keys are wrong, or `schema.sql` / `seed.sql` weren't run. Re-check Step 2.2 and Step 5. |
| Products appear, but **the list is empty** | `seed.sql` wasn't run, or ran before `schema.sql`. Run schema, then seed. |
| **`/admin` shows 404** | Your profile isn't admin yet. Run the SQL in Step 3 with the exact email, then **log out and in**. |
| **Sign-up email never arrives** | Check spam. Supabase's built-in email is heavily rate-limited, so wait and retry, set up custom SMTP (6.4), or turn off *Confirm email* while testing (2.4). |
| **"That link is invalid or has expired"** | Open the email link **in the same browser** you signed up or requested the reset from, and within an hour. Also check the Redirect URLs in Supabase (2.4 / 7.3). |
| Email link goes to **localhost** on the live site | Update **Site URL** and **Redirect URLs** in Supabase (7.3). |
| Checkout says **"Payments are not set up yet"** | `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` or `SUPABASE_SERVICE_ROLE_KEY` is missing. Add them and restart or redeploy. |
| The **Pay** button stays disabled | The Razorpay script is blocked. Turn off ad-blockers for the site and check your internet connection. |
| Payment succeeded but the order is still **"Payment pending"** | Usually fixes itself within seconds via the webhook. Check the webhook exists (4.3), that its secret matches `RAZORPAY_WEBHOOK_SECRET`, and that Payment Capture is *Automatic* (4.2). In Razorpay → Webhooks you can see each delivery and retry it. |
| Webhook shows **400 Invalid signature** | The webhook secret in Razorpay and `RAZORPAY_WEBHOOK_SECRET` in Vercel don't match. Make them identical and redeploy. |
| **No order confirmation email** | Check Resend → **Emails** for errors. In test mode (`onboarding@resend.dev`), emails only go to your Resend account's email address, so verify a domain (6.3) for customers. Admin → Orders → order shows the last email error. |
| Uploading an image fails with **"new row violates row-level security policy"** | You're not an admin (Step 3), or your session is old, so log out and in. |
| Upload fails: **"mime type not supported"** or **"too large"** | Only JPG, PNG, WebP and AVIF up to 5 MB are allowed. |
| Uploaded images don't show (**"hostname is not configured"**) | Your Supabase URL must end in `.supabase.co`. If you use a custom domain, add it to `images.remotePatterns` in `next.config.ts`. |
| **Port 3000 is already in use** | Another `npm run dev` is running. Close that terminal, or run `npm run dev -- -p 3001`. |
| Vercel **build fails** | Open the failed deployment → **Build Logs**. Usually an env var is missing. Run `npm run build` locally to see the same error. |
| Changed `.env.local` but nothing changed | Restart `npm run dev`. On Vercel, **redeploy** after changing env vars. |

---

## 10. Final test checklist

Go through this in test mode before going live:

- [ ] The home page shows categories and featured products
- [ ] Category pages, search, price filters and sorting work
- [ ] The product page shows sizes, stock, and "Add to cart" works
- [ ] As a guest, add to cart, log in, and the cart items are still there
- [ ] Change quantity and size in the cart, and remove an item
- [ ] Checkout with a new address, pay with `success@razorpay`, and the confirmation page shows **paid**
- [ ] The confirmation email arrives, and **Resend confirmation email** works
- [ ] The order appears in **My Orders**
- [ ] Payment with `failure@razorpay` shows an error, and the order doesn't appear in My Orders
- [ ] In Admin, change the order status to *shipped* and the customer sees it
- [ ] In Admin, add a product, upload images, edit an image description, set the primary image, reorder, delete an image
- [ ] Forgot password → email link → set a new password → log in
- [ ] A non-admin account gets 404 at `/admin`
- [ ] On the deployed site, Razorpay → Webhooks shows successful (200) deliveries

> 📸 **Image licence reminder:** some of the sample images (e.g. two of the boots) are stock photos with watermarks. Before launch, replace them with photos you own or have licensed, using **Admin → Images → Replace**.
