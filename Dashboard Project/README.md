# Outsource Dashboard

A single-page dashboard for managing outsourcing projects and employees, with per-month data tracking.



## 📋 Features

- **Projects** — add, delete, view projects with budget and employee capacity
- **Employees** — add, delete employees with position, salary, and date of birth
- **Assign employees** to projects (capacity limit enforced)
- **Estimated income** calculated per position rate (Junior 1.2x → Architect 3.0x)
- **Monthly data** — separate data for each month/year period
- **Seed Data** — copy projects & employees from a previous month
- **Sort** — click any column header to sort ascending/descending
- **Search** — click ⌕ icon to filter rows by text
- **Validation** — all form fields validated before saving
- **localStorage** — data persists between browser sessions

## 🗂 Project Structure

```
dashboard/
├── index.html   — Page structure (HTML)
├── style.css    — Styles and layout (CSS)
├── app.js       — All logic (JavaScript)
└── README.md    — This file
```



## 📊 Income Calculation

Estimated income per employee = `salary × position_rate`

| Position  | Rate |
|-----------|------|
| Junior    | 1.2× |
| Middle    | 1.5× |
| Senior    | 2.0× |
| Lead      | 2.5× |
| Architect | 3.0× |
| BO        | 1.0× |

## ✅ Requirements Checklist

- [x] Projects table with all required columns
- [x] Employees table with all required columns
- [x] Add / Delete for both projects and employees
- [x] Form validation with error messages
- [x] Employee age validation (18+)
- [x] Assign employee to project via dropdown
- [x] Project capacity limit enforced
- [x] Estimated income calculation
- [x] Monthly period selector (sidebar)
- [x] Seed Data feature (copy from another month)
- [x] Sorting by all columns
- [x] Search/filter by text columns
- [x] Data saved to localStorage
- [x] Responsive layout
