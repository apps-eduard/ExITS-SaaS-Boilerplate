# Money Loan Calculator Guide

This guide documents the canonical backend calculator that powers every Money Loan preview. All channels (web admin, web customer, and mobile) now call the same NestJS endpoint, so the numbers shown to borrowers always align with the single source of truth.

---

## 1. Inputs and Default Assumptions

| Field | Description | Notes |
| --- | --- | --- |
| `loanAmount` | Principal requested by the borrower | Currency value (₱). |
| `termMonths` | Loan duration in whole months | Rounded to at least `1`. |
| `paymentFrequency` | `daily` \| `weekly` \| `biweekly` \| `monthly` | Controls payment count. |
| `interestRate` | Monthly interest percentage | Multiply by months for flat interest. |
| `interestType` | `flat` \| `reducing` \| `compound` | `flat` is current production default. |
| `processingFeePercentage` | Upfront processing fee % of principal | Deducted from proceeds, not repaid. |
| `platformFee` | Platform fee per month | Charged for each active month. |
| `latePenaltyPercentage` | Daily/periodic penalty rate | Stored for schedule tools; not used in base formula. |

All monetary inputs are treated as numbers. Consumers should coerce string values before passing them to the service.

---

## 2. Core Formulas

Given `A = loanAmount`, `T = termMonths`, `I = interestRate` (monthly %), `PF = processingFeePercentage`, and `PLF = platformFee` (per month):

1. **Processing Fee**
   
   ```
   processingFeeAmount = A × (PF / 100)
   ```

2. **Platform Fee (Total)**
   
   ```
   platformFeeTotal = PLF × T
   ```

3. **Interest (Flat Model)**
   
   ```
   interestAmount = A × (I / 100) × T
   ```

   For `reducing` and `compound` interest types, the service switches to amortized or compounded formulas but still assumes `I` is a monthly rate.

4. **Total Repayment**
   
   ```
   totalRepayable = A + interestAmount + platformFeeTotal
   ```

5. **Net Proceeds (Amount Released to Borrower)**
   
   ```
   netProceeds = A − (processingFeeAmount + platformFeeTotal)
   ```

6. **Number of Payments**
   
   ```
   payments =
     T × 30          when frequency = daily
     T × 4           when frequency = weekly
     ceil(T × 30 / 14) when frequency = biweekly
     T               when frequency = monthly
   ```

7. **Installment Amount**
   
   ```
   installmentAmount = totalRepayable / payments
   ```

8. **Effective Interest Rate (APR approximation)**
   
   ```
   effectiveRate = ((totalRepayable − netProceeds) / netProceeds) × (12 / T) × 100
   ```

---

## 3. Example Scenarios (5% monthly interest, ₱50 platform fee/month, 1% processing)

| Term & Frequency | Interest | Platform (total) | Net Proceeds | Total Repayment | Payments | Installment |
| --- | --- | --- | --- | --- | --- | --- |
| **1 month, daily** | ₱50 | ₱50 | ₱940 | ₱1,100 | 30 | ₱36.67 |
| **3 months, weekly** | ₱150 | ₱150 | ₱840 | ₱1,300 | 12 | ₱108.33 |
| **3 months, monthly** | ₱150 | ₱150 | ₱840 | ₱1,300 | 3 | ₱433.33 |

> ℹ️ The daily example above produces ₱36.67 per period. Some UX variants round to whole pesos (e.g., ₱37). Apply rounding at the display layer to avoid losing cent-level accuracy in downstream reports.

---

## 4. API Reference (Single Source of Truth)

Frontends call one of two HTTP endpoints, both backed by the same NestJS service:

| Audience | Endpoint | Notes |
| --- | --- | --- |
| Admin / Back-office | `POST /api/money-loan/calculate` | Requires platform auth. |
| Customer-authenticated | `POST /api/customers/auth/loan-preview` | Uses the logged-in customer context. |

### Request payload

```ts
interface LoanCalculationRequest {
   loanAmount: number;
   termMonths: number;
   paymentFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
   interestRate: number;              // monthly percentage
   interestType: 'flat' | 'reducing' | 'compound';
   processingFeePercentage?: number;
   platformFee?: number;              // fee per month
   latePenaltyPercentage?: number;
   disbursementDate?: string;         // optional ISO string
}
```

### Response payload

```ts
interface LoanCalculationPreview {
   calculation: LoanCalculationResult;
   schedule: LoanSchedulePreviewItem[];
}

interface LoanCalculationResult {
   loanAmount: number;
   termMonths: number;
   paymentFrequency: string;
   interestAmount: number;
   processingFeeAmount: number;
   platformFee: number;               // total for entire term
   netProceeds: number;
   totalRepayable: number;
   numPayments: number;
   installmentAmount: number;
   effectiveInterestRate: number;
   gracePeriodDays: number;
   totalDeductions: number;           // upfront fees only
   monthlyEquivalent?: number;
}

interface LoanSchedulePreviewItem {
   paymentNumber: number;
   dueDate: string;
   installmentAmount: number;
   principal: number;
   interest: number;
   remainingBalance: number;
   cumulativePaid: number;
}
```

### Example request

```http
POST /api/money-loan/calculate
Content-Type: application/json

{
   "loanAmount": 1000,
   "termMonths": 3,
   "paymentFrequency": "weekly",
   "interestRate": 5,
   "interestType": "flat",
   "processingFeePercentage": 1,
   "platformFee": 50,
   "latePenaltyPercentage": 1
}

// → 200 OK
// { "success": true, "data": { calculation, schedule } }
```

---

## 5. Integration Notes

- **Single Source of Truth**: Web (admin/customer) and mobile now proxy through lightweight wrappers (`LoanService.calculateLoanPreview` and `ApiService.calculateLoanPreview`). Do not reintroduce local math helpers.
- **Cache Carefully**: Components may memoize results per product/amount/term combination. Invalidate caches whenever inputs change to prevent stale figures.
- **Rounding**: The API returns raw decimal amounts. Apply product-specific rounding rules at the presentation layer (e.g., round up to nearest peso for payment prompts).
- **Validation**: Ensure UI validation keeps `loanAmount` within the product’s min/max range and rounds `termMonths` to whole integers before sending the preview request.
- **Platform Fee per Month**: Remember that platform fees stack with the number of active months. A longer term increases both net deductions and total repayment.

---

## 6. Future Enhancements

- Support configurable grace periods and penalty compounding inside `generateSchedule`.
- Add optional rounding strategies (round up, round down, bankers) as a parameter for installment calculations.
- Extend reducing/compound models with full amortization tables when product owners finalize requirements.

Keeping this documentation alongside the shared service helps engineers and product teams validate calculator numbers quickly across environments.
