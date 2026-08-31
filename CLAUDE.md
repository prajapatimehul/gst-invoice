# GST Invoice Generator — Guide for Claude Code

This repository generates **GST-compliant invoices for Indian freelancers and
small service businesses** — zero-rated exports under LUT, domestic taxable
invoices, and reverse-charge self-invoices for imported services.

It is designed to be driven by Claude Code. You describe a quarter's billing;
Claude Code reads your private config, writes a generation script, and produces
the PDFs your accountant needs.

> **This file is public and contains no real business data.** Every value below
> is a placeholder. Real details live in `CLAUDE.local.md`, which is gitignored.

---

## 🚨 Rules for Claude Code — read before doing anything

1. **Read `CLAUDE.local.md` first.** It holds the user's real GSTIN, LUT, address,
   invoice series counters, and client list. If it does not exist, tell the user
   to run `cp CLAUDE.local.md.example CLAUDE.local.md` and fill it in. **Never
   invent or guess** a GSTIN, LUT number, address, or invoice number.

2. **Never commit real financial data.** `data/`, `output/`, `scripts/*` (except
   `scripts/templates/`), `CLAUDE.local.md`, and `*.pdf` are gitignored and must
   stay that way. Before any commit, check the staged diff for GSTINs, LUT ARNs,
   bank account numbers, client names, and personal addresses.

3. **Never renumber or reuse an invoice number.** GST requires a gapless,
   sequential series. If an invoice is wrong, cancel it and issue a new number —
   do not silently regenerate over it. Confirm the next number with the user
   before generating a batch, and remind them to update `CLAUDE.local.md` after.

4. **Never round or "clean up" an amount.** Invoice values must match the source
   documents (platform CSV, bank statement, contract) exactly.

5. **Ask when the source data is ambiguous.** A missing exchange rate, an
   unmatched bank credit, or an unclear client address is a question for the
   user, not something to fill in with a plausible value.

---

## Two ways to use this project

### 1. Web app — Upwork CSVs, bulk export invoices

A Next.js app that runs entirely in the browser. Best for the common case: a
month or quarter of Upwork earnings turned into one invoice per client per month.

```bash
npm install
npm run dev          # http://localhost:3000
```

Configure business details via **Settings** (saved to browser `localStorage`,
never sent anywhere), upload the Upwork transaction CSV, preview, download PDFs.

### 2. Script workflow — everything else

For anything the UI does not cover — domestic invoices, RCM self-invoices,
non-USD currencies, per-transfer invoicing, mixed platforms in one series —
Claude Code writes a per-quarter TypeScript script that reuses the same PDF
generator and helpers.

```bash
npx tsx scripts/generate-<quarter>.ts
```

Start from a template in `scripts/templates/` (see below). Your own scripts in
`scripts/` stay local and gitignored.

---

## Repository layout

```
├── app/                     # Next.js App Router pages
├── components/
│   ├── features/            # Settings, FileUpload, InvoicePreview, InvoiceSummary
│   └── ui/                  # Shadcn UI primitives
├── lib/
│   ├── csvParser.ts         # Parse Upwork transaction CSV
│   ├── invoiceProcessor.ts  # Group by client+month, assign invoice numbers
│   ├── exchangeRateMulti.ts # Fetch a rate per invoice date
│   ├── pdfGeneratorExact.ts # Traditional GST invoice PDF (use this one)
│   ├── pdfGeneratorAdvanced.ts / pdfGenerator.ts  # Alternate layouts
│   └── utils.ts             # numberToIndianWords, formatInvoiceDate
├── types/invoice.ts         # Invoice, BusinessInfo, InvoiceType
├── scripts/templates/       # ✅ Sanitized starting points (committed)
├── scripts/                 # 🔒 Your real per-quarter scripts (gitignored)
├── data/                    # 🔒 Source documents (gitignored)
├── output/                  # 🔒 Generated PDFs (gitignored)
├── CLAUDE.md                # 📖 This file — public, generic
└── CLAUDE.local.md          # 🔒 Your real business details (gitignored)
```

### Per-quarter convention

Keep one folder per quarter so a filing can be reconstructed later:

```
data/<quarter>/              # e.g. data/apr-jun-2026/
├── <platform>-transactions.csv
├── bank-statement.xlsx
├── rbi-rates-<quarter>.json     # RBI reference rates you looked up
├── firc/                        # e-FIRCs / BRCs from your bank
├── expense-bills/               # supplier invoices backing RCM self-invoices
└── client-docs/                 # customer GST certificates, contracts

scripts/generate-<quarter>.ts    # the script that built this quarter
output/<quarter>/                # the PDFs it produced + a summary CSV
```

---

## Invoice series

Series prefixes are **your choice** — record them in `CLAUDE.local.md`. The
recommended structure is one series per tax treatment:

| Series | Covers | Tax treatment |
|---|---|---|
| `<PREFIX>-NN` | All export invoices (platforms + direct foreign clients) | 0% IGST, zero-rated under LUT |
| `<PREFIX>L-NN` | Domestic invoices to Indian customers | CGST+SGST (same state) or IGST (other state) |
| `<PREFIX>-RCM-NN` | Self-invoices for services imported from abroad | IGST 18% under reverse charge |

Rules that apply to every series:

- **Continuous within a financial year**, reset on 1 April. A fresh series each
  FY is compliant as long as the GSTIN is unchanged.
- **Gapless and sequential.** No skipped numbers, no reuse.
- **Numbers are issued in date order.** If you issue an invoice early (for a
  compliance request, say), later invoices dated *before* it still take *higher*
  numbers — the number is already spent.

The web app also ships legacy prefixes in `types/invoice.ts` (`GT` Upwork
earnings, `GRC` Upwork platform fees, `DT` direct export, `G` direct,
`EM` unified). Use these or define your own in a script.

---

## GST rules the invoices must satisfy

### Export invoices (zero-rated under LUT)

- **IGST rate 0%**, tax amount NIL, supplied under a valid LUT for that FY.
- Header must carry the export declaration: *"SUPPLY MEANT FOR EXPORT UNDER LETTER
  OF UNDERTAKING WITHOUT PAYMENT OF INTEGRATED TAX"*.
- The LUT ARN printed must be the one valid on the **invoice date** — an invoice
  dated 02-Apr uses the new FY's LUT, not last year's.
- Show both the foreign-currency amount and the INR equivalent, with the
  exchange rate and its date.

### Domestic invoices (taxable)

- Customer in the **same state** as you → **CGST 9% + SGST 9%**.
- Customer in a **different state** → **IGST 18%**.
- Print the customer's GSTIN and place of supply. B2B invoices without a
  customer GSTIN cannot be claimed as ITC by the customer.

### RCM self-invoices (imported services)

- Required under **Section 31(3)(f) of the CGST Act** when you buy services from
  a supplier outside India (cloud subscriptions, platform fees, ads, SaaS).
- **IGST 18% payable in cash**, then claimable as input tax credit.
- One self-invoice per supplier per month, in its own series.
- Convert the foreign value at the RBI reference rate on the self-invoice date
  (Rule 34).
- Keep the supplier's invoice PDF in `data/<quarter>/expense-bills/` as backing.

### Amounts

- **Always use GROSS amounts** — the full value of the service before platform
  fees or withholding. Upwork showing `$1,600 gross / $1,438.40 net` means the
  invoice reads **$1,600**. The platform fee is a separate expense (and the
  subject of its own RCM self-invoice).
- Direct clients: the full invoiced amount.

### Dates and formats

- Invoice date format: **DD-MMM-YY** (e.g. `26-Jul-26`), via `formatInvoiceDate()`.
- Amount in words: Indian numbering (lakh/crore), via `numberToIndianWords()`.
- One invoice per client per month for platform work, dated the month-end or the
  last work date. Per-transfer invoicing is also valid — pick one and stay
  consistent per client.

---

## Exchange rates

**Each invoice must use the exchange rate for its own invoice date.** A batch
spanning three months needs three different rates.

### RBI reference rate — official, use for filings

The [RBI Reference Rate Archive](https://www.rbi.org.in/scripts/referenceratearchive.aspx)
is the authoritative source. There is **no public RBI API** — rates are looked up
manually and cached as JSON in `data/<quarter>/rbi-rates-<quarter>.json`:

```json
{
  "2026-07-09": { "USD": 95.3746 },
  "2026-07-27": { "USD": 96.1856, "EUR": 101.2233 }
}
```

RBI publishes on business days only. For an invoice dated on a **weekend or
holiday**, use the **nearest preceding business day's** rate and record that
substitution in a note on the script — your accountant will be asked about it.

### frankfurter.app — automatic, approximate

`lib/exchangeRateMulti.ts` fetches a per-date rate from
[frankfurter.app](https://frankfurter.app) (European Central Bank data) when no
manual rate is set. Convenient for multi-month batches, but **not official RBI
rates**. For a filing that has to withstand scrutiny, use RBI rates.

In the web app: enter a rate in Settings to apply one rate to the whole batch;
leave it empty for automatic per-date fetching.

---

## Upwork CSV mapping

Export from **Upwork → Reports → Transactions** as CSV.

| Invoice field | CSV column | Notes |
|---|---|---|
| Client name | `Agency` | Falls back to `Account Name` when empty |
| Amount | `Amount` / `Amount $` | Gross, before fees |
| Date | `Date` | Drives grouping and the exchange-rate lookup |

- Only **client earnings** rows become export invoices: `Hourly`, `Fixed Price`,
  `Fixed-price`, `Milestone`, `Bonus`.
- **Platform fee** rows (`Connects`, `Subscription`, `Service Fee`, withdrawal
  fees) are *not* revenue — they belong on an RCM self-invoice.
- Upwork renames these columns periodically. If parsing yields `Unknown` clients
  or zero rows, inspect the CSV header and update `lib/csvParser.ts`.

---

## Generating a quarter — the recipe

When the user asks for a quarter's invoices, work through this in order:

1. **Read `CLAUDE.local.md`** — business details, next invoice numbers, clients,
   LUT valid for the quarter's dates.
2. **Inventory `data/<quarter>/`** — list what source documents are present and
   tell the user what is missing before starting.
3. **Reconcile revenue against the bank statement.** Every credit should map to
   an invoice, and every invoice to a credit (or an explained timing difference).
   Report anything unmatched instead of quietly dropping it.
4. **Collect exchange rates.** Ask the user to look up RBI rates for each
   distinct invoice date and save them to `data/<quarter>/rbi-rates-<quarter>.json`.
   Flag weekend/holiday dates that need the preceding business day.
5. **Assign invoice numbers** in date order, continuing from `CLAUDE.local.md`.
   Show the user the full mapping and get confirmation before generating.
6. **Write `scripts/generate-<quarter>.ts`** from the matching template. Keep the
   invoice data as a plain array at the top so it is reviewable at a glance.
7. **Run it** — `npx tsx scripts/generate-<quarter>.ts` — writing PDFs plus a
   summary CSV to `output/<quarter>/`.
8. **Verify** totals against the source documents, then hand over the summary.
9. **Remind the user** to update the next invoice numbers in `CLAUDE.local.md`.

Separately, generate RCM self-invoices for the quarter's imported services from
the bills in `data/<quarter>/expense-bills/`.

---

## Script templates

`scripts/templates/` holds sanitized starting points. Copy one, do not edit it
in place:

```bash
cp scripts/templates/export-invoices.template.ts scripts/generate-apr-jun-2027.ts
```

| Template | Produces |
|---|---|
| `export-invoices.template.ts` | Zero-rated export invoices under LUT, multi-currency, per-date RBI rates |
| `domestic-invoice.template.ts` | Domestic taxable invoice with CGST+SGST or IGST |
| `rcm-self-invoice.template.ts` | Reverse-charge self-invoices for imported services |

Each is filled with obvious placeholders (`<YOUR ...>`, `PLACEHOLDER`) and
throws at startup if they have not been replaced.

---

## Compliance checklist

Before handing a batch to an accountant:

- [ ] GSTIN correct and matching the registration certificate
- [ ] LUT ARN valid for every invoice date in the batch
- [ ] Invoice numbers sequential and gapless within the financial year
- [ ] HSN/SAC present on every line
- [ ] Export invoices: 0% IGST + export declaration header
- [ ] Domestic invoices: correct CGST+SGST vs IGST split, customer GSTIN shown
- [ ] RCM self-invoices issued for every imported service in the period
- [ ] Gross amounts used, not net-of-fees
- [ ] Exchange rate and its date shown on every foreign-currency invoice
- [ ] Amount in words matches the numeric total
- [ ] Totals reconcile to the bank statement
- [ ] Nothing real staged for commit (`git diff --cached`)

---

## Disclaimer

This project generates documents from data you supply. It is not tax advice, and
the maintainers are not accountants. GST rules change. **Have your invoices
reviewed by a qualified chartered accountant before filing.** You are
responsible for the accuracy of everything you file.
