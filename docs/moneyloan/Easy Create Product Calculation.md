💳 Easy Create Product
Loan Terms

1 Month

2 Months

Quarter (3 Months)

6 Months

🧾 1. Loan Product Inputs
Parameter	Description	Example
Loan Amount (A)	Principal amount borrowed	1000
Loan Term (T)	1 Month / 2 Months / Quarter / 6 Months	1 Month
Payment Frequency (F)	Daily / Weekly / Monthly	Weekly
Interest Rate (I%)	For full loan term	5%
Processing Fee (PF%)	% of principal	0%
Platform Fee (PLF)	Fixed amount	50
Late Penalty (%)	% per day late	1%
Grace Period (GP)	Days allowed after due date before penalty starts (Weekly or Monthly only)	1 day for Weekly, 3 days for Monthly
📊 2. Basic Loan Calculations
Formula	Description
Interest Amount = Loan Amount × (Interest% / 100)	Total interest for the term
Processing Fee Amount = Loan Amount × (Processing Fee% / 100)	Deducted upfront
Net Proceeds = Loan Amount − Interest − Processing Fee − Platform Fee	Amount released to borrower
Total Repayable = Loan Amount + Interest	Without penalties
📆 3. Installment Calculation
Payment Frequency	Formula for # of Payments	Example (1 month term)
Daily	Term × 30	30 payments
Weekly	Term × 4	4 payments
Monthly	Term × 1	1 payment

📘 Installment Amount = Total Repayable ÷ Number of Payments

⚖️ 4. Grace Period & Late Penalty Rules
Type	Description
Daily Payments	No grace period (penalty applies immediately after missed day).
Weekly Payments	Grace period = 1 day after due date. Penalty applies from Day 2 onward.
Monthly Payments	Grace period = 3 days after due date. Penalty applies from Day 4 onward.
Penalty Formula

If payment is made after the grace period:

Effective Late Days = max(0, DaysLate - GracePeriod)
Penalty = Installment × LatePenalty% × EffectiveLateDays

Penalty Payment Options

Pay immediately with that week/month’s installment

Carry forward and pay in later week(s)

Accumulate until loan end

💰 5. Total Payment Calculation
Total Due (if penalties paid at end) = Total Repayable + Total Penalty

🧮 6. Example – Weekly (1 Month Loan, with 1-Day Grace Period)
Week	Installment	Days Late	Grace (1d)	Effective Late Days	Penalty	Total Due
1	262.50	1	1	0	0	262.50
2	262.50	2	1	1	2.63	265.13
3	262.50	0	1	0	0	262.50
4	262.50	3	1	2	5.25	267.75
Total Penalty					7.88	
Total Repayable with Penalty						1057.88
🧮 7. Example – Monthly (1 Month Loan, with 3-Day Grace Period)
Month	Installment	Days Late	Grace (3d)	Effective Late Days	Penalty	Total Due
1	1050	5	3	2	1050 × 1% × 2 = 21	1071
Total Penalty					21	
Total Repayable with Penalty						1071
🧠 8. Generalized Formula (For System Use)
Name	Formula
InterestAmt	A × (I / 100)
ProcessingFeeAmt	A × (PF / 100)
TotalRepayable	A + InterestAmt
NetProceeds	A - InterestAmt - ProcessingFeeAmt - PLF
NumPayments	T × (30 if Daily, 4 if Weekly, 1 if Monthly)
Installment	TotalRepayable / NumPayments
EffectiveLateDays	max(0, DaysLate - GracePeriod)
Penalty	Installment × (LatePenalty / 100) × EffectiveLateDays
TotalDue	Installment + Penalty
TotalWithPenalty	TotalRepayable + SUM(Penalties)