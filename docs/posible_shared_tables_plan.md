🧩 1. Core Shared Tables (Common Across All Platforms)

These form your foundation layer — used by every platform.

Table Name	Purpose	Notes
customers	Main customer profile (name, contact, etc.)	Shared ID across all systems
customer_addresses	Customer’s address (home, work, etc.)	Linked via customer_id
customer_documents	ID proof, photos, or uploaded forms	Useful for KYC and verification
customer_contacts	Secondary contact info, guarantors, emergency contact	Optional per customer
tenants	The company or branch using your SaaS	Each tenant can have multiple customers
users	Tenant’s internal users (staff, admins)	For RBAC and authentication
customer_notes	Staff remarks, follow-ups, or CRM-type notes	Helps with cross-platform support
audit_logs	System-wide action tracking	Universal for all modules

💡 These tables are the “identity spine” — all platforms connect to them via customer_id and tenant_id.

🏦 2. MoneyLoan Platform Tables
Table Name	Purpose	Key Relation
loans_moneyloan	Main loan details (principal, interest, term, etc.)	customer_id, tenant_id
loan_schedules_moneyloan	Payment schedule per loan	Linked to loan_id
loan_payments_moneyloan	Records each payment transaction	Linked to loan_id
loan_penalties_moneyloan	Late fees or charges	Linked to loan_id
💳 3. BNPL Platform Tables
Table Name	Purpose	Key Relation
loans_bnpl	Each BNPL purchase agreement	customer_id, tenant_id
bnpl_merchants	Merchant or store partners	Shared by multiple tenants
bnpl_installments	Installment schedule and status	Linked to BNPL loan
bnpl_payments	Customer payments per installment	Linked to BNPL loan
💍 4. Pawnshop Platform Tables
Table Name	Purpose	Key Relation
loans_pawnshop	Pawn ticket / loan details	customer_id, tenant_id
collaterals_pawnshop	Items pledged (gold, gadgets, etc.)	Linked to pawn loan
pawn_renewals	Pawn renewals and extensions	Linked to pawn loan
pawn_redemptions	Records of item retrieval	Linked to pawn loan
pawn_auctions	For unclaimed items sold	Linked to pawn loan
🧭 5. Optional / Cross-Platform Support Tables
Table Name	Purpose	Notes
payments_master	Unified payment record (optional)	Can store all payment references across platforms
notifications	SMS/email notifications sent to customers	Centralized communication log
attachments	File uploads used by any platform	Store paths + reference ID and module type
transaction_logs	Financial movement logs (cross-platform ledger)	For audit and accounting consistency
🔗 Relationship Overview (Simplified)
tenants
  └── users
  └── customers
        ├── customer_addresses
        ├── customer_documents
        ├── loans_moneyloan
        ├── loans_bnpl
        └── loans_pawnshop

✅ Summary
Layer	Tables Example	Shared or Separate
Core (Shared)	customers, customer_addresses, tenants, users	🔹 Shared
MoneyLoan	loans_moneyloan, loan_schedules_moneyloan, loan_payments_moneyloan	🔸 Separate
BNPL	loans_bnpl, bnpl_merchants, bnpl_installments	🔸 Separate
Pawnshop	loans_pawnshop, collaterals_pawnshop, pawn_renewals	🔸 Separate