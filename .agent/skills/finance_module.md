---
name: SchoolMatica Finance Module
description: How the finance/accounting system works - fees, invoices, payments, ledger, and reconciliation
---

# Finance Module Skill

## Overview
The SchoolMatica finance system manages school fees, invoices, payments, account ledgers, credit notes, and bank reconciliation. All amounts are in **South African Rand (ZAR)**.

## Database Models

### FeeStructure
- Defines fee amounts per grade per year
- `grade: Int?` — null = all grades, 0 = Grade R, 1-12 = Grade 1-12
- `components: Json` — array of `{name, amount, optional, description}`
- `baseAmount: Float` — sum of mandatory (non-optional) components
- Has many `FeeDiscount`, `Invoice`

### Invoice
- Auto-numbered: `INV-YYYY-NNN`
- Links to `FeeStructure`, `Student`, `ParentContact`
- `lineItems: Json` — array of `{description, amount, quantity}`
- Tracks `subtotal`, `discountAmount`, `taxAmount`, `totalAmount`, `paidAmount`, `balanceDue`
- Statuses: Draft → Sent → Partially Paid → Paid / Overdue / Cancelled

### Payment
- Auto-numbered: `PAY-YYYY-NNN`
- Methods: EFT, Card, Cash, SnapScan, PayFast, Ozow, Apple Pay, Debit Order
- Statuses: Pending → Processing → Completed / Failed / Refunded

### AccountLedger
- Running balance per student
- Types: Invoice (debit), Payment (credit), Credit, Adjustment, WriteOff
- **Critical**: Balance must be cumulative (`prevBalance + debit - credit`)

### CreditNote
- Auto-numbered: `CN-YYYY-NNN`
- For refunds, adjustments, corrections
- Can be voided

## API Routes (16 total)
| Endpoint | Methods | Purpose |
|----------|---------|---------|
| `/api/fees/structures` | GET, POST | List/create fee structures |
| `/api/fees/structures/[id]` | GET, PATCH, DELETE | Get/update/deactivate structure |
| `/api/fees/invoices` | GET, POST | List/create invoices |
| `/api/fees/invoices/[id]` | GET, PATCH | Get/update invoice status |
| `/api/fees/invoices/[id]/remind` | POST | Send payment reminder |
| `/api/fees/invoices/bulk` | POST | Bulk generate from fee structure |
| `/api/fees/payments` | GET, POST | List/record payments |
| `/api/fees/payments/[id]/receipt` | GET | Get payment receipt |
| `/api/fees/discounts` | GET, POST | List/create discounts |
| `/api/fees/discounts/[id]` | GET, PATCH, DELETE | Manage discounts |
| `/api/fees/ledger/[studentId]` | GET | Student account statement |
| `/api/fees/credit-notes` | GET, POST | List/create credit notes |
| `/api/fees/credit-notes/[id]` | PATCH | Void credit note |
| `/api/fees/reconcile` | POST | Bank reconciliation |
| `/api/fees/bank-reconcile` | POST | Bank statement upload |
| `/api/fees/reports` | GET | Financial reports |

## UI Components
- `fees-client.tsx` — Main fees page (6 tabs: overview, invoices, payments, structures, discounts, bank recon)
- `create-fee-structure-dialog.tsx` — Fee structure creation with components
- `create-invoice-dialog.tsx` — Single invoice creation
- `bulk-invoice-dialog.tsx` — Bulk invoice generation from fee structure
- `record-payment-dialog.tsx` — Record payment against invoice
- `create-discount-dialog.tsx` — Create discount/bursary
- `bank-reconciliation-tab.tsx` — Bank statement reconciliation

## Key Business Rules
1. Grade R is stored as `0` in the database, not `null`
2. `null` grade on fee structure means "All Grades"
3. Invoice numbers are generated atomically via `generateInvoiceNumber()`
4. Bulk invoices skip students who already have invoices for the same structure+term
5. Discounts can be percentage or fixed amount
6. Fee structures use soft-delete (`isActive: false`)
7. Education fees in SA are generally VAT-exempt
