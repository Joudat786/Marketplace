# Marketplace

A SaaS **app store** for business modules. Companies sign up, open a workspace, browse the catalogue, install apps, and pay. Platform operators publish apps, set plans, and collect payment.

This is **not an ERP**. Accounting, sales, HR, inventory, and customer invoicing are not in this repository. Those are meant to ship later as installable apps.

The Base44 project name is still `ERP تكويد (V1)`. Treat that as a leftover label.

---

## What works today

| Area | Status |
| --- | --- |
| Public landing, plans, login | Working |
| Company onboarding (CR, tax, owners, files) | Working |
| Workspaces, staff invites | Working (join-by-code is incomplete) |
| In-product app store (browse, install, uninstall) | Working |
| Plans, subscriptions, trials | Working |
| Payments: MyFatoorah and bank transfer | Working |
| Super-admin: clients, catalogue, branding, sidebar, SMS | Working |

## What does not work yet

| Area | Status |
| --- | --- |
| Company / admin home dashboards | Empty pages |
| Accounting, sales, HR, inventory, CRM | Not built |
| Invoices to a company’s own customers | Not built |
| Partners, support tickets, coupons, marketing | Title-only pages |
| Most client settings (email, shipping, backup, form designer) | Title-only pages |

There are **20 data tables**, all for the store (users, workspaces, apps, plans, payments). There is no Invoice, Product, Employee, or Stock table.

---

## Who it is for

- **Company (client)** — signs up, fills company papers, gets a workspace, installs apps from the in-product store, pays monthly.
- **Staff** — invited into a workspace with a role.
- **Platform owner (super admin)** — workspace `#1`. Publishes apps, sets prices, reviews bank transfers, brands the site.

Apps here are **not** iPhone or Play Store apps. They are modules listed inside this product at `/app-store`. The platform owner creates those listings in App Manager.

---

## Stack

| Layer | Tools |
| --- | --- |
| UI | React 18, Vite 6, Tailwind, Radix / shadcn |
| Routing | React Router 6 |
| Data | TanStack Query, Base44 SDK |
| Backend | Base44 entities + Deno functions |
| Payments | MyFatoorah, bank transfer |
| Locale | Arabic RTL, SAR, Asia/Riyadh |

---

## Repository layout

```
src/
  App.jsx                 Routes and auth gate
  pages/
    Landing.jsx           Public website
    client/               Company: store, workspaces, subscriptions, settings
    superadmin/           Platform operator screens
    payment/              Checkout and payment success
  components/             Layout, store, landing, admin, UI kit
  lib/                    Auth and workspace context
  api/base44Client.js     Base44 SDK client

base44/
  entities/               Data schemas (store only)
  functions/              Serverless jobs (register, pay, invite, …)

docs/                     Product documents (Word)
```

---

## Documentation

| File | What it is |
| --- | --- |
| [docs/App_Store_Assessment.docx](docs/App_Store_Assessment.docx) | Honest assessment: app store, not ERP. Built vs missing. |
| [docs/ERP_System_Documentation.docx](docs/ERP_System_Documentation.docx) | Longer technical overview (features, flows, code). Older framing still says “ERP”. |

Read the **assessment** first if you need a true picture of the product.

---

## Run locally

**Need:** Node.js, a Base44 app, and the two env values below.

```bash
npm install
```

Create `.env.local` in the project root:

```
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=https://your-app.base44.app
```

```bash
npm run dev
```

| Script | Purpose |
| --- | --- |
| `npm run dev` | Local Vite server |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | Type check (`jsconfig.json`) |

Without valid Base44 env values the UI starts, but login, data, and functions will fail. The backend is Base44 cloud, not this folder.

Pushing this GitHub repo updates the linked Base44 builder. Publish from [Base44](https://base44.com).

---

## GitHub

**https://github.com/Joudat786/Marketplace**

Branch: `main`.
