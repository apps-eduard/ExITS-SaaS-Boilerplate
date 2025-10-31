
# 🧩 Reusable Table Logic (Angular + Express + Tailwind)

Help me implement a **reusable, DRY table logic** for my Angular + Express project.

It should support:

- Sorting (by any column, asc/desc)
- Pagination (page number, page size, total count)
- Filtering and search
- Lazy loading or server-side fetching when data is large

The implementation must be **generic** so all modules (Loans, Users, Transactions, etc.) can reuse the same table logic and UI.

---

## Frontend (Angular + Tailwind)

- Create a shared **TableService** or **DataTableUtility** that manages table state (page, sort, filters, search).  
- Use **Tailwind CSS** for the table UI and pagination controls (no Angular Material).  
- The table should be **responsive, minimal, and reusable** — support column headers with sorting icons, a search bar, and page size controls.  
- The service should decide between:
  - **Local mode**: client-side sort/filter/pagination for small data  
  - **API mode**: server-side fetch for large data  
- Provide an observable or state object (`tableView$`) that components can subscribe to for rendering table data and pagination info.

---

## Backend (Express + Knex)

- Create a **queryHelper** utility that applies sorting (`ORDER BY`), pagination (`LIMIT/OFFSET`), and filtering to any SQL/Knex query.  
- Accept query parameters: `page`, `pageSize`, `sortBy`, `sortDir`, `search`, `filters`  
- Return `{ data, total }` for frontend pagination  
- Must be **safe** (whitelist sortable/filterable columns) and **efficient** (only query total count once)

---

## Overall Requirements

- Keep the architecture **clean, modular, and extendable** for future features like column visibility, CSV export, or batch actions  
- Ensure frontend and backend share a **consistent query/response format**  
- Ensure the Tailwind UI is **simple, accessible, and consistent** across all table modules

---

## Optional Enhancements

- Add debounce to search inputs  
- Cancel previous API requests when new queries are triggered  
- Support both light/dark themes (Tailwind variants)
