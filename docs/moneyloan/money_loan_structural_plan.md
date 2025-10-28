in create plan modal, I cannot click teh add feature



•	Use KNEX for any database changes
•	Maintain all camelCase
•	Maintain compact design
•	Maintain all buttons with icon
•	User Modern Design Interactive
•	Maintain Theme will work
•	Mobile responsive design


Backend Folder Structure
/backend
├── api/
│   └── src/
│       ├── modules/
│       └── /products
│           ├── /money-loan
│           ├── /bnlp
│           └── /pawnhop


Frontend Folder Structure
/frontend
└── web/
    └── src/
        └── app/
            └── features/
                └── /products
                    ├── /money-loan
                    ├── /bnlp
                    └── /pawnhop


Dashboard Menu – Money Loan Dashboard
________________________________________
1. Overview 📊
•	Total Loans 💵 – View total loans disbursed.
•	Collection Rate 📈 – View current collection rate.
•	Overdue % ⏳ – Percentage of loans that are overdue.
•	Outstanding Amount 💰 – Total outstanding balance for all loans.
•	Active Loans 🔄 – Number of loans currently active.
•	Default Rate 🚫 – Percentage of loans that have defaulted.
________________________________________
2. Customers 👥
•	All Customers 🧑‍🤝‍🧑 – View all customers.
•	New Customers ✨ – View newly registered customers.
•	KYC Pending ⏳ – List of customers with KYC verification pending.
•	High-Risk Flags ⚠️ – Customers with high-risk alerts (e.g., missed payments).
•	Customer Search 🔍 – Search customers by name, ID, loan status, etc.
________________________________________
3. Loans 💳
•	All Loans 📜 – View all loans issued.
•	Pending Approval 📝 – Loans waiting for approval.
•	Active Loans 🔄 – Loans that are currently being paid.
•	Overdue Loans 🕔 – Loans that have missed payment deadlines.
•	Closed/Paid Off ✅ – Loans that have been repaid in full and closed.
•	Loan Disbursement 💸 – Manage loan approval and disbursement.
•	Loan Calculator 🧮 – Tool to calculate loan eligibility or repayment schedules.
________________________________________
4. Payments 💳
•	Today’s Collections 📅 – Daily collections overview.
•	Payment History 📜 – View the history of all payments made by customers.
•	Bulk Import Payments 📤 – Import payments in bulk using CSV.
•	Refunds & Waivers 🔄 – Track refunds or waivers applied to loans.
•	Failed Payments ⚠️ – List of failed transactions and actions taken.
•	Payment Gateway Settings ⚙️ – Configure payment processing methods.
________________________________________
5. Interest & Rules 📊
•	Interest Rates 📉 – View and manage the loan interest rates.
•	Auto Rate Rules 🔄 – Automate interest rate rules (e.g., based on loan amount or customer profile).
•	Manual Overrides 🖊️ – Ability to manually adjust rates for specific customers or loans.
•	Interest Calculator 🧮 – Calculate interest for specific loans or customer scenarios.
________________________________________
6. Collections 💼
•	Overdue Workflow 📈 – View and manage overdue loan collection workflows.
•	Collection Strategies 📋 – View and adjust collection strategies (phone calls, email reminders, etc.).
•	Legal Actions ⚖️ – Track legal actions for defaulting customers (e.g., court cases).
•	Recovery Dashboard 🔄 – View the recovery status of overdue loans and collections.
________________________________________
7. KYC Verification ✅
•	Pending Reviews ⏳ – View customers whose KYC is under review.
•	Verified Customers ✅ – List of customers who have successfully completed KYC.
•	Rejected Customers ❌ – Customers who failed KYC verification.
•	KYC Audit Logs 📜 – Logs of all KYC-related activities for compliance tracking.
•	Onfido Webhook Logs 📡 – Logs from automated KYC service (if using third-party services like Onfido).
________________________________________
8. Reports 📈
•	Daily/Weekly/Monthly Reports 🗓️ – Reports on loan performance, payments, defaults, etc.
•	Tax Summary 🧾 – Generate tax summary for accounting and auditing.
•	Export Data 📤 – Export reports to CSV or PDF for external use.
•	Custom Queries 🧑‍💻 – Run custom reports and queries for in-depth insights.
________________________________________
9. Settings ⚙️
•	Roles & Permissions 🔑 – Manage user roles and access rights within the system.
•	Loan Product Settings 🏷️ – Define and modify loan products (e.g., loan terms, interest rates, etc.).
•	SMS/Email Templates 📨 – Manage communication templates for reminders, payments, and notifications.
•	Company Branding 🎨 – Manage logo, themes, and appearance of the platform.
•	API Keys 🔑 – Manage integration API keys for third-party services.
•	Audit Log 📜 – Track all system activities for security and compliance.
________________________________________
10. Audit Log 📜
•	System Activity Log 🔍 – View logs of all actions taken in the system for auditing purposes.
•	Data Changes 🔄 – Track changes to sensitive customer or loan data.
________________________________________
Additional Features (Optional)
1.	Notifications 🔔
o	View system-wide notifications and alerts (e.g., loan status updates, overdue payments).
2.	User Management 🧑‍💻
o	Manage admin, support, and staff accounts who have access to the system.
3.	Integration Settings 🔌
o	Manage external integrations such as payment gateways, credit score services, and KYC providers.
________________________________________
Icon Key:
•	📊: Analytics and data-driven actions.
•	💵 / 💳 / 💰: Monetary/Loan-related actions.
•	⚙️: Settings or configurations.
•	📜 / 📖: Logs or history.
•	✅ / ⚠️ / ❌: Status indicators for success, warnings, or errors.
•	📈 / 🧮: Calculations, statistics, and financial tools.
•	🔄: Active, ongoing processes or actions.
•	📅: Calendar, dates, or schedules.
•	🧑‍💻: User or role management.
•	🔑: Security or access-related tasks.


Customer Portal – SideNav Menu
________________________________________
1. Dashboard 🏠
•	Home (Overview: Balance, Next Due, Loan Health) 📊
•	Loan Summary 📈 – View an overview of all active loans.
•	Notifications 🔔 – System-wide updates (payment reminders, overdue warnings).
________________________________________
2. My Loans 💳
•	Active Loans 🔄 – View all currently active loans.
•	Repayment Schedule 📅 – View detailed repayment schedule for each loan.
•	Payment History 🧾 – History of all payments made.
•	Early Payoff Calculator 🧮 – Calculate savings when paying off loans early.
________________________________________
3. Make a Payment 💸
•	Quick Pay ⚡ – Make an instant payment for any loan.
•	Schedule Auto-Pay 🔄 – Set up automatic monthly payments.
•	Partial Payment 💰 – Make a partial payment towards your outstanding balance.
________________________________________
4. Apply for Loan 📝
•	New Application ➕ – Apply for a new loan.
•	Pre-Qualify (Instant Calculator) 🔍 – Check loan eligibility instantly.
________________________________________
5. Messages & Alerts 📩
•	Notifications 🔔 – View system notifications (payment due dates, loan status changes).
•	Reminders ⏰ – Personalized loan reminders.
•	Support Chat 💬 – Chat with customer support for queries and issues.
________________________________________
6. Profile 👤
•	Personal Info 📝 – Edit personal information such as name, address, etc.
•	Bank Accounts 💳 – Add or update your bank account information for payments.
•	Documents 🗂️ – Upload or view documents like ID, Proof of Income, etc.
•	Preferences ⚙️ – Set communication preferences (SMS, email).
________________________________________
Icon Breakdown:
•	🏠 Home: Dashboard and quick overview of financial status.
•	📊 / 📈: Analytics and graphs for loan health and status.
•	💳 / 💸 / 💰: Financial transactions (loan status, payments, etc.).
•	📝: Forms and applications (new loan application, profile editing).
•	📅: Calendar-based information (due dates, schedules).
•	🔔: Alerts and reminders for payments, notifications.
•	💬: Communication tools (chat, notifications).
•	🗂️: Document uploads and viewing.
•	⚙️: Settings or preferences for notifications and communication.
________________________________________

