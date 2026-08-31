# Script templates

Starting points for generating invoices outside the web UI. Every value in these
files is a placeholder — nothing real is committed here.

| Template | Produces | Tax treatment |
|---|---|---|
| `export-invoices.template.ts` | A batch of export invoices, one PDF each plus a summary CSV | 0% IGST, zero-rated under LUT |
| `domestic-invoice.template.ts` | A single domestic invoice for an Indian customer | CGST+SGST (same state) or IGST (other state) |
| `rcm-self-invoice.template.ts` | Self-invoices for services imported from abroad | IGST 18% under reverse charge |

## Usage

Copy a template into `scripts/` — never edit it in place, so the next quarter
still has a clean starting point:

```bash
cp scripts/templates/export-invoices.template.ts scripts/generate-apr-jun-2027.ts
```

Fill in the `CONFIGURATION` block at the top from your `CLAUDE.local.md`, then:

```bash
npx tsx scripts/generate-apr-jun-2027.ts
```

`scripts/*` is gitignored apart from this folder, so your filled-in scripts —
which contain your GSTIN, LUT, and client names — stay on your machine.

## Notes

- Each template throws at startup if any `<PLACEHOLDER>` is left unreplaced, so a
  half-configured script cannot produce an invoice with fake details on it.
- Duplicate invoice numbers are rejected. GST requires a gapless, sequential
  series — assign numbers in date order and update `CLAUDE.local.md` afterwards.
- Exchange rates are supplied explicitly rather than fetched. Use the official
  [RBI reference rate](https://www.rbi.org.in/scripts/referenceratearchive.aspx)
  for the invoice date, falling back to the nearest preceding business day for
  weekends and holidays, and note the substitution on the invoice.
- Amounts must be **gross** — the full service value before platform fees or
  withholding.
