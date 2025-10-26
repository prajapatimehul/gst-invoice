# GST Invoice System - Project Guide

## Business Info
- **Name**: EXAMPLE BUSINESS SERVICES PVT LTD
- **GSTIN**: 24AABCE1234F1Z5 (Configure in Settings)
- **LUT**: AD240101234567X (Export without IGST)
- **Service**: IT Consulting (HSN/SAC: 998313)
- **State**: Gujarat (Code: 24)

---

## Invoice Series

### DT-Series (Direct Clients)
- **Format**: DT-01, DT-02, DT-03...
- **Location**: `invoices/direct-clients/`
- **Starting**: DT-01

### GT-Series (Upwork Clients)
- **Format**: GT-01, GT-02, GT-03...
- **Location**: `invoices/upwork-clients/`
- **Numbering**: Continuous throughout the year (configurable starting number)

### 📋 Invoice Numbering
- **GT-series continues throughout the year** (no quarterly reset)
- **Configurable starting number** in app settings
- Example: If you set starting number to 13, invoices will be GT-13, GT-14, GT-15...
- Track the last used number and set it as starting number for next batch
- **Sequential numbering** ensures no gaps in invoice series

---

## Key Rules

### Amounts
- **USE GROSS AMOUNTS** - The full billing amount before platform fees
- For Upwork: Use the gross earnings (NOT the net received amount)
- Example: $1,600 gross = Invoice shows $1,600 (not $1,438.40 after fees)
- Direct clients: Full invoiced amount

### One Invoice Per Client Per Month
- Each client gets ONE invoice per month
- Combine all work done for that client in the month
- Use month-end date or last work date as invoice date
- Track monthly totals per client

### Exchange Rates ⭐ UPDATED

**🚨 CRITICAL FOR GST COMPLIANCE**: Each invoice must use the exchange rate for its specific invoice date!

#### NEW: Per-Invoice-Date Exchange Rates

The app now automatically fetches the correct exchange rate for EACH invoice's date:

**Example (Multi-Month CSV):**
- ABC Inch - July (Jul 25, 2025) → Uses rate for Jul 25
- ABC Inch - August (Aug 29, 2025) → Uses rate for Aug 29
- XYZ LLC - September (Sep 5, 2025) → Uses rate for Sep 5

#### Two Modes:

**1. Manual Mode** (Recommended for Single-Month Batches)
- Enter ONE exchange rate in settings
- All invoices in batch use this rate
- Best for processing one month at a time
- Verify rate from [RBI Reference Rate Archive](https://www.rbi.org.in/scripts/referenceratearchive.aspx)

**2. Auto Mode** (For Multi-Month CSVs)
- Leave exchange rate field empty
- App automatically fetches rate FOR EACH invoice date
- Uses frankfurter.app API (European Central Bank data)
- ⚠️ **Note**: NOT official RBI rates, but close approximation
- Each invoice gets its own date-specific rate

#### RBI vs API Rates

**RBI Limitation:**
- ❌ No public API available from RBI or FBIL
- ✅ Official source: Manual download from RBI website
- ✅ For strict GST compliance: Download RBI rates, process month-by-month with manual entry

**frankfurter.app API:**
- ✅ Automated per-date fetching
- ✅ Based on European Central Bank data
- ⚠️ Close approximation but NOT official RBI rates
- ✅ Suitable for multi-month processing

---

## File Structure
```
invoice-app/                     # 🏠 Main application (ROOT)
├── app/                         # Next.js app pages
├── components/                  # UI components
│   ├── features/                # Feature components
│   └── ui/                      # Shadcn UI components
├── lib/                         # Core business logic
│   ├── csvParser.ts             # Parse Upwork CSV
│   ├── invoiceProcessor.ts      # Generate invoices with per-date rates
│   ├── exchangeRateMulti.ts     # Fetch exchange rates per invoice date
│   ├── pdfGeneratorExact.ts     # Generate PDF invoices
│   └── utils.ts                 # Utility functions
├── types/                       # TypeScript type definitions
├── public/                      # Static assets
├── BankWise.xls                 # Exchange rate reference (historical)
├── Refernce/                    # Reference invoices (read-only)
├── Template/                    # Legacy Excel templates
├── CLAUDE.md                    # 📖 This file - Project documentation
├── package.json                 # Dependencies
└── next.config.js               # Next.js configuration

../                              # Parent directory (legacy Python tools)
├── generate_invoice.py          # Legacy: Python invoice generator
├── parse_upwork_report.py       # Legacy: Python CSV parser
└── invoices/                    # Legacy: Old generated invoices
```

## Next.js Web App (invoice-app/)

### Features
- 🎨 **Modern UI** - Beautiful Notion-like interface
- 📤 **Drag & Drop** - Easy CSV upload
- ⚙️ **Configurable Settings** - Business info & starting invoice number
- 👁️ **Live Preview** - Preview invoices before download
- 📄 **Batch Processing** - One invoice per client per month
- 💾 **Client-side** - All processing in browser (zero-cost hosting)

### Configuration (Settings Button)
1. **Business Details**
   - Name, GSTIN, LUT
   - Service description, HSN/SAC
   - State and State Code
2. **Starting Invoice Number**
   - Set the first invoice number for the batch
   - Example: Set to 13 to generate GT-13, GT-14, GT-15...
   - Update this number after each batch to continue sequence
3. **Exchange Rate (Optional)**
   - **Single Month Processing**: Check [RBI official rates](https://www.rbi.org.in/scripts/referenceratearchive.aspx) and enter manually
   - **Multi-Month Processing**: Leave empty - app fetches rate for EACH invoice date automatically
   - **Manual = One rate for all invoices in batch**
   - **Auto = Per-invoice-date rates from API**
   - App shows exchange rate used for each invoice in the list

### Usage
```bash
# From invoice-app directory (project root)
npm install
npm run dev
# Open http://localhost:3000 or http://localhost:3001
```

1. Click **Settings** button to configure
2. Set **Starting Invoice Number** (e.g., last used + 1)
3. **Upload CSV** - Drag & drop Upwork transaction report
4. **Preview** - Click any invoice to preview
5. **Download** - Download individual or all PDFs

### Deployment
Deploy to Vercel for free:
```bash
# From invoice-app directory
vercel
# Follow prompts to deploy
```

---

## Invoice Format

### Required Fields
- Invoice Number (DT-XX or GT-XX)
- Invoice Date (DD-MMM-YYYY)
- Client Name + " - Upwork" (for Upwork clients)
- Client Location + Country
- Service: "IT Consulting and Support Services"
- USD Amount (GROSS)
- Exchange Rate
- INR Amount = USD × Rate
- Amount in Indian words
- GSTIN, LUT, HSN/SAC codes

### Tax Details
- IGST Rate: 0% (Export under LUT)
- Tax Amount: NIL
- Header: "SUPPLY MEANT FOR EXPORT..."

---

## Workflow

### Direct Client Invoice
```bash
python3 generate_invoice.py \
  --type DT \
  --client "Client Name" \
  --location "City, Country" \
  --amount 5000 \
  --date "15-Oct-2025"
```

### Upwork Invoices (Monthly Batch)
```bash
python3 parse_upwork_report.py upwork_report.csv --monthly
```
This generates one invoice per client per month automatically.

### Manual Upwork Invoice
```bash
python3 generate_invoice.py \
  --type GT \
  --client "Client Name - Upwork" \
  --location "United States" \
  --amount 3200 \
  --date "31-Jul-2025"
```

---

## PDF Generation

### Current Method (LibreOffice)
- Uses LibreOffice headless mode
- Command: `soffice --headless --convert-to pdf`
- Works but may have formatting differences from Excel

### Goal: Google Sheets Parity
- PDF should look exactly like Google Sheets export
- Need to ensure:
  - Same fonts and sizes
  - Proper alignment
  - Correct margins
  - No extra spacing
  - Clean borders

### Options to Explore
1. **Excel native export** (requires Excel on Mac)
2. **Google Sheets API** (upload → export as PDF)
3. **Improved LibreOffice settings** (better page setup)
4. **Python PDF libraries** (render from Excel data)

---

## CA Submission Package

### Monthly/Quarterly Includes:
1. **Sales Invoices**
   - All DT-series PDFs (direct clients)
   - All GT-series PDFs (Upwork)

2. **Supporting Documents**
   - Bank statements (USD receipts)
   - Exchange rate references

3. **Summary Report**
   - Total income (USD + INR)
   - Invoice list with dates
   - Client breakdown

---

## Commands

### Generate Invoice
```bash
# Interactive mode
python3 generate_invoice.py

# Direct client
python3 generate_invoice.py --type DT --client "ABC" --amount 5000

# Upwork client
python3 generate_invoice.py --type GT --client "XYZ - Upwork" --amount 3000
```

### Parse Upwork Report
```bash
# Monthly invoices (one per client per month)
python3 parse_upwork_report.py report.csv --monthly

# Per-transaction invoices (not recommended)
python3 parse_upwork_report.py report.csv
```

### Convert Excel to PDF
```bash
# Single file
python3 generate_invoice.py --convert invoices/direct-clients/DT-01.xlsx

# Batch convert
for file in invoices/upwork-clients/*.xlsx; do
    python3 generate_invoice.py --convert "$file"
done
```

---

## Important Notes

### Upwork Amount Calculation
- ⚠️ Always use GROSS amount (before Upwork fees)
- Upwork shows: Gross, Service Fee, WHT, Net
- Invoice uses: Gross amount only
- Your bank receives: Net amount
- CA needs to know: Gross = service value provided

### Yearly Sequential Numbering
- ⚠️ Invoice numbers CONTINUE throughout the year (no quarterly reset)
- **Configurable starting number** - Set in app settings before generating invoices
- No gaps in invoice numbers
- Track last used number and use it as starting number for next batch
- GT-series: Continuous sequence (e.g., GT-01, GT-02... GT-50, GT-51...)
- **Example for a year**:
  - January: GT-01, GT-02, GT-03
  - February: GT-04, GT-05, GT-06 (continues from previous month)
  - March: GT-07, GT-08, GT-09 (continues sequentially)
  - ...and so on throughout the year

### Date Format
- Always use: DD-MMM-YYYY
- Example: 15-Oct-2025, 04-Jul-25

### Client Names
- **Upwork CSV**: Uses "Agency" column for actual client company names (e.g., "ABC Inc", "XYZ LLC")
- **Invoice Display**: Automatically appends " - Upwork" suffix to client names
- **Example**: "ABC Inch - Upwork"
- Direct clients: Use actual company name
- Keep consistent across months

### Upwork CSV Field Mapping
- **Client Name**: Uses "Agency" field (not "Account Name")
- **Amount**: Uses "Amount $" field (gross amount before fees)
- **Transaction Types**: Only "Hourly" and "Fixed-price" transactions are processed
- **Grouping**: One invoice per client per month based on transaction dates

---

## Compliance Checklist

- ✅ GSTIN: Configure your GSTIN in Settings
- ✅ LUT No: Configure your LUT number in Settings
- ✅ HSN/SAC: 998313
- ✅ IGST Rate: 0%
- ✅ Export header text
- ✅ Currency conversion documented
- ✅ Sequential invoice numbers
- ✅ Gross amounts (not net)

---

## Development Tasks

- [ ] Improve PDF generation (Google Sheets quality)
- [ ] Add invoice tracking database
- [ ] Auto-detect last invoice number
- [ ] Validate GSTIN format
- [ ] Summary report generator
- [ ] Backup system

---

**Last Updated**: October 13, 2025

---

## Quick Start (Web App)

1. **Open the app**: `npm run dev` (from invoice-app directory)
2. **Configure settings** (first time):
   - Click Settings button
   - Set Starting Invoice Number (e.g., 1 for first batch, 13 for continuing)
   - **Optional**: Enter Exchange Rate
     - **For Single Month**: Enter RBI rate from [RBI website](https://www.rbi.org.in/scripts/referenceratearchive.aspx)
     - **For Multi-Month CSV**: Leave empty - app will fetch rate per invoice date
   - Save settings
3. **Generate invoices**:
   - Upload Upwork transaction CSV (can span multiple months)
   - App automatically:
     - Uses "Agency" field for client company names
     - Groups by client and month (one invoice per client per month)
     - **Fetches correct exchange rate for EACH invoice date** (if manual rate not set)
   - Review generated invoices - each shows its specific exchange rate
   - Preview any invoice before download
   - Download all PDFs at once
4. **For next batch**:
   - Update starting number to last invoice number + 1
   - Update/remove exchange rate as needed
