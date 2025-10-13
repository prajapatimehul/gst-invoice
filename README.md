# GST Invoice Generator

Transform your Upwork earnings into GST-compliant export invoices in seconds. A beautiful, modern Next.js application with **per-invoice-date exchange rates** and professional PDF generation.

## ✨ Features

- 🎨 **Beautiful Notion-like UI** - Clean, modern interface with smooth animations
- 📤 **Drag & Drop Upload** - Easy CSV file upload from Upwork reports
- ⚡ **Instant Processing** - 100% client-side, no server required
- 📊 **Smart Grouping** - Automatically groups transactions by client and month (one invoice per client per month)
- 💰 **Gross Amount Calculation** - Uses correct gross amounts before Upwork fees
- 📄 **Professional PDF Generation** - Creates exact GST-compliant invoice format
- 📅 **Per-Invoice-Date Exchange Rates** - ⭐ Fetches correct rate for EACH invoice date (GST compliant)
- 🔢 **Continuous Yearly Numbering** - GT-01, GT-02, GT-03... throughout the year (no quarterly reset)
- 🏢 **Client Company Names** - Automatically uses "Agency" field from CSV (e.g., "ABC Inch")
- 👁️ **Live PDF Preview** - Preview actual PDF before downloading
- ⚙️ **Configurable** - Business info, starting invoice numbers, manual exchange rates
- 🔒 **100% Private** - All processing happens in your browser
- 💸 **Zero Cost Hosting** - Deploy on Vercel's free tier

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Shadcn UI** - Beautiful, accessible components
- **jsPDF** - Client-side PDF generation
- **PapaParse** - CSV parsing
- **Lucide Icons** - Modern icon library

## Getting Started

### Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Build

```bash
npm run build
npm start
```

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/invoice-app)

1. Push this code to a GitHub repository
2. Connect your GitHub repo to Vercel
3. Click "Deploy"
4. Your app will be live in minutes!

## 📖 How to Use

### First Time Setup
1. Click **Settings** button (top right)
2. Configure:
   - Business details (Name, GSTIN, LUT, Service, HSN, State)
   - Starting invoice number (e.g., 1 for first batch, or last used + 1)
   - **Optional**: Manual exchange rate (for single-month processing)
3. Save settings (stored in browser localStorage)

### Generate Invoices
1. **Export Transaction Report from Upwork**
   - Go to Upwork Reports → Transactions
   - Select date range (can span multiple months)
   - Export as CSV
   - Ensure CSV includes "Agency" field

2. **Upload CSV**
   - Drag and drop the CSV file
   - Or click to browse and select

3. **Review Generated Invoices**
   - View summary: Total invoices, USD amount, INR amount
   - See list of all invoices with:
     - Client company names (from Agency field)
     - Invoice dates
     - Amounts (USD and INR)
     - **Exchange rate used for each invoice**
   - App automatically:
     - Groups by client and month (one invoice per client per month)
     - Fetches correct exchange rate for each invoice date (if manual rate not set)
     - Generates sequential invoice numbers

4. **Preview & Download**
   - **Preview**: Click any invoice to see actual PDF
   - **Download Individual**: Click download icon on invoice
   - **Download All**: Click "Download All PDFs" button

### For Next Batch
- Update starting invoice number to (last used + 1)
- Upload new CSV
- Generate and download

## 📋 Invoice Details

- **Series**: GT-XX (Upwork clients), DT-XX (Direct clients)
- **Numbering**: **Continuous yearly sequence** (GT-01, GT-02... no quarterly reset)
- **Configurable Starting Number**: Set in settings (e.g., start from GT-13)
- **Tax**: 0% IGST (Export under LUT - no tax payment)
- **Format**: Exact GST-compliant format with all mandatory fields
- **Date Format**: DD-MMM-YY (e.g., 26-Jul-25)
- **Client Names**: Actual company names from CSV "Agency" field
- **Exchange Rates**: ⭐ Per-invoice-date rates (critical for GST compliance)

## Business Information

Configure your business details in the Settings (⚙️ button):
- **Name**: Your business name
- **GSTIN**: Your GST identification number
- **LUT**: Your Letter of Undertaking number
- **Service**: IT Consulting and Support Services (or your service)
- **HSN/SAC**: 998313 (or your HSN/SAC code)

## 📁 Project Structure

```
invoice-app/                     # 🏠 Main application (ROOT)
├── app/                         # Next.js App Router
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Main invoice generator page
│   └── globals.css              # Global styles
├── components/
│   ├── ui/                      # Shadcn UI components
│   └── features/                # Feature components
│       ├── FreelancerConfig.tsx # Settings dialog
│       ├── InvoiceGenerator.tsx # Main generator UI
│       ├── InvoicePreview.tsx   # PDF preview modal
│       └── InvoiceSummary.tsx   # Generated invoices list
├── lib/                         # Core business logic
│   ├── csvParser.ts             # Parse Upwork CSV files
│   ├── invoiceProcessor.ts      # Group transactions, generate invoices
│   ├── exchangeRateMulti.ts     # ⭐ Fetch per-date exchange rates
│   ├── pdfGeneratorExact.ts     # Generate PDF invoices (exact format)
│   └── utils.ts                 # Utility functions (date, number formatting)
├── types/
│   └── invoice.ts               # TypeScript type definitions
├── public/                      # Static assets
├── Refernce/                    # Reference invoices (for format matching)
├── Template/                    # Legacy Excel templates
├── BankWise.xls                 # Historical exchange rates reference
├── CLAUDE.md                    # 📖 Comprehensive project documentation
├── README.md                    # This file
├── package.json                 # Dependencies
└── next.config.js               # Next.js configuration
```

For detailed documentation, see **[CLAUDE.md](./CLAUDE.md)**

---

## 💱 Exchange Rates: Manual vs Auto Mode

### **Manual Mode** (Recommended for Single Month)
- Enter ONE exchange rate in settings
- All invoices in batch use this rate
- Best for processing one month at a time
- Verify rate from [RBI Reference Rate Archive](https://www.rbi.org.in/scripts/referenceratearchive.aspx)
- ✅ Official RBI rates
- ✅ GST compliant

### **Auto Mode** (For Multi-Month CSVs)
- Leave exchange rate field empty
- App automatically fetches rate for **EACH invoice date**
- Uses frankfurter.app API (European Central Bank data)
- ⚠️ NOT official RBI rates (close approximation)
- ✅ Suitable for multi-month processing
- ✅ Per-date rate fetching (critical for GST)

**Example:**
```
CSV with Jul, Aug, Sep transactions:
- Invoice for Jul 25 → Uses Jul 25 rate (₹86.51)
- Invoice for Aug 29 → Uses Aug 29 rate (₹84.12)
- Invoice for Sep 5  → Uses Sep 5 rate (₹83.95)
```

---

## 🐛 Troubleshooting

### Port 3000 Already in Use
```bash
# App will automatically use 3001
# Check with: lsof -i :3000
```

### CSV Parse Error
- Ensure CSV is from Upwork transaction report
- Check that "Agency", "Amount $", "Date" columns exist
- Only "Hourly" and "Fixed-price" transactions are processed

### Client Name Shows "Unknown"
- CSV must have "Agency" column with actual company names
- Falls back to "Account Name" if Agency is empty
- Check your Upwork CSV export includes Agency field

### Exchange Rate Fetch Failed
- Check internet connection
- API might be temporarily down
- Use manual exchange rate as fallback

---

## 📚 Additional Resources

- **[CLAUDE.md](./CLAUDE.md)** - Comprehensive project documentation
- **[Refernce/](./Refernce/)** - Reference invoice PDFs
- **[Template/](./Template/)** - Legacy Excel templates
- **[RBI Reference Rates](https://www.rbi.org.in/scripts/referenceratearchive.aspx)** - Official exchange rates

---

## 📄 License

MIT License - Feel free to use and modify for your purposes.

---

## 👤 Author

Built for **MEHULKUMAR SHANTIBHAI PRAJAPATI**

**Last Updated**: October 13, 2025
