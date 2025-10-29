Golden Rule for Stack

Database Layer (PostgreSQL)

Always use snake_case for table names and column names.

Keep table names plural and consistent.

Avoid camelCase or spaces; follow SQL conventions.

Backend Layer (Express / Node.js)

Use camelCase for all variables, objects, and properties.

Never expose database naming directly; rely on a mapping layer (Knex/ORM) to convert snake_case → camelCase.

Keep business logic clean and DB-agnostic.

Frontend Layer (Angular)

Use camelCase for all variables, models, and API responses.

Bind directly to objects coming from the backend; no renaming needed.

Single Conversion Point

Let the ORM/query builder handle all mapping between snake_case and camelCase.

Avoid manual conversions anywhere else.

Consistency & Naming Conventions

Table names: plural (e.g., users, products)

Column names: snake_case (e.g., first_name, created_at)

Backend / frontend objects: camelCase (e.g., firstName, createdAt)

Validation & Contracts

Keep backend validation strict (e.g., required fields, types).

Frontend models should match backend contract (camelCase).