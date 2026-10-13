# TDD: Technical Design Document

## AgroConnect — Farmer-to-Consumer Agricultural Marketplace

| Field | Details |
|---|---|
| Project name | AgroConnect |
| Document | Technical Design Document (TDD) |
| Version | 1.0 |
| Status | Draft for course project |
| Architecture | Frontend-only single-page application |

## 1. Purpose

This document describes the proposed frontend architecture, components, routes, state management, data structures, styling, and testing approach for AgroConnect.

## 2. Technical Scope and Decisions

- Build a client-side web application with React.
- Use React Router for page navigation.
- Use JavaScript (or TypeScript if chosen by the team) for UI behavior.
- Use CSS or a selected CSS framework for responsive styling.
- Use predefined JavaScript sample data.
- Use React state/context for cart and product-list interactions.
- Optionally use `localStorage` for non-sensitive demo preferences/cart/listings.
- Do not create a backend API or database for this version.
- Do not implement real authentication, authorization, or payments.

## 3. Proposed Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| UI | React | Component-based interface |
| Language | JavaScript (ES6+) | Application logic |
| Build tool | Vite | Development server and production build |
| Routing | React Router | Client-side page navigation |
| Styling | CSS / CSS Modules | Layout and responsive design |
| Icons | Lucide React or similar | Consistent interface icons |
| State | React `useState`, `useContext`, optionally `useReducer` | Cart, products, and demo role state |
| Browser persistence (optional) | `localStorage` | Store non-sensitive demo state on one browser |
| Version control | Git and GitHub | Source history and collaboration |
| Deployment (optional) | GitHub Pages, Vercel, or Netlify | Host static frontend build |

**No database or backend framework is required for this version.**

## 4. Architecture Overview

```text
User's Browser
     |
     v
React Application (Vite)
     |
     +-- Shared Layout / Navigation
     |
     +-- Public Pages
     |     +-- Home
     |     +-- Shop / Product Details
     |     +-- Farmers / About
     |
     +-- Demo Role Selection / Login
     |     +-- Admin Dashboard
     |     +-- Farmer Dashboard
     |     +-- Customer Dashboard
     |
     +-- Shopping Features
     |     +-- Cart
     |     +-- Simulated Checkout
     |     +-- Sample Order Tracking
     |
     +-- Client-Side State
     |     +-- Sample Product Data
     |     +-- Cart State
     |     +-- Demo Listings
     |     +-- Demo Role / Profile
     |
     +-- Optional localStorage
           (one browser only; no shared server data)
```

All application logic and sample data run in the browser. There is no API server or database connection.

## 5. Route Design

Example routes (adapt to the final implementation):

| Route | Page | Access/demo role |
|---|---|---|
| `/` | Home | Public |
| `/shop` | Product catalog | Public |
| `/products/:productId` | Product details | Public |
| `/farmers` | Farmer directory | Public |
| `/about` | About | Public |
| `/login` | Role selection | Public |
| `/login/admin` | Admin demo login | Admin demo |
| `/login/farmer` | Farmer demo login | Farmer demo |
| `/login/customer` | Customer demo login | Customer demo |
| `/admin-dashboard` | Admin dashboard | Admin demo |
| `/farmer-dashboard` | Farmer dashboard | Farmer demo |
| `/customer-dashboard` | Customer dashboard | Customer demo |
| `/cart` | Shopping cart | Public/customer demo |
| `/checkout` | Simulated checkout | Customer demo |
| `/orders/:orderId` | Sample order tracking | Customer demo |
| `/farmer/products/new` | Add product | Farmer demo |
| `/farmer/products/:productId/edit` | Edit product | Farmer demo |
| `/profile` | Demo profile | Demo role |

Routes are client-side navigation only. A frontend route is not a security boundary; users can inspect or modify browser code/state.

## 6. Component Design

### 6.1 Shared components
- `App`: root application and route configuration.
- `SiteLayout`: shared header, navigation, main content, and footer.
- `Header`: logo, navigation, search shortcut, cart indicator, role entry.
- `Footer`: about links and contact information.
- `Button`: reusable button variants.
- `FormField`: labeled input with validation feedback.
- `ProductCard`: product image, title, price, unit, farmer, and actions.
- `ProductGrid`: responsive collection of product cards.
- `CategoryFilter`: category selection.
- `SearchBar`: product query input.
- `EmptyState`: no products, empty cart, or no orders.
- `ConfirmDialog`: confirmation for destructive demo actions.

### 6.2 Public pages
- `HomePage`
- `ShopPage`
- `ProductDetailsPage`
- `FarmersPage`
- `AboutPage`

### 6.3 Role and dashboard pages
- `RoleSelectionPage`
- `DemoLoginPage`
- `AdminDashboard`
- `FarmerDashboard`
- `CustomerDashboard`
- `ProfilePage`

### 6.4 Shopping pages
- `CartPage`
- `CheckoutDemoPage`
- `OrderTrackingPage`

### 6.5 Farmer listing components
- `FarmerProductList`
- `ProductForm`
- `ProductEditPage`

## 7. Suggested Repository Structure

```text
agroconnect/
├── public/
│   ├── images/
│   └── favicon.svg
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── common/
│   │   ├── layout/
│   │   └── products/
│   ├── context/
│   │   ├── CartContext.jsx
│   │   ├── ProductContext.jsx
│   │   └── DemoAuthContext.jsx
│   ├── data/
│   │   ├── products.js
│   │   ├── users.js
│   │   └── orders.js
│   ├── pages/
│   │   ├── public/
│   │   ├── auth/
│   │   ├── admin/
│   │   ├── farmer/
│   │   └── customer/
│   ├── routes/
│   │   └── AppRoutes.jsx
│   ├── styles/
│   │   ├── global.css
│   │   └── variables.css
│   ├── utils/
│   │   ├── currency.js
│   │   └── validation.js
│   ├── App.jsx
│   └── main.jsx
├── docs/
│   ├── PRD.md
│   ├── SRS.md
│   └── TDD.md
├── index.html
├── package.json
├── README.md
└── .gitignore
```

This is a suggested structure; it can be simplified for a small course project.

## 8. Client-Side Data Design

### 8.1 Product example

```js
{
  id: "p-001",
  name: "Fresh Tomatoes",
  category: "Vegetables",
  price: 120,
  unit: "kg",
  quantityAvailable: 25,
  description: "Fresh tomatoes from a local farm.",
  image: "/images/tomatoes.jpg",
  farmerId: "f-001",
  farmerName: "Green Valley Farm",
  isApproved: true
}
```

Prices are illustrative and should be formatted consistently (for example, BDT). Replace example values with the values selected for the project.

### 8.2 Demo profile example

```js
{
  id: "demo-customer",
  displayName: "Demo Customer",
  email: "customer@example.com",
  role: "customer"
}
```

Do not put real passwords or secrets in source files. If the UI includes password fields, treat them as a visual/demo form only and never present the result as secure authentication.

### 8.3 Cart example

```js
[
  { productId: "p-001", quantity: 2 },
  { productId: "p-004", quantity: 1 }
]
```

Calculate each line total as `product.price * quantity`, then sum the line totals for the subtotal. Any delivery fee should be clearly marked as a demonstration value.

### 8.4 Sample order example

```js
{
  id: "order-demo-001",
  items: [
    { productId: "p-001", name: "Fresh Tomatoes", quantity: 2, unitPrice: 120 }
  ],
  total: 240,
  status: "Processing",
  createdAt: "2026-10-01"
}
```

This represents sample display data, not a real transaction.

## 9. State Management

- **Products:** Initialize from `src/data/products.js`; farmer actions update shared React state.
- **Cart:** Store product IDs and quantities; derive prices from product data.
- **Demo role:** Store the currently selected demo role in application state. Avoid treating it as a secure identity.
- **Orders:** Read from sample data and optionally append a simulated order after checkout.
- **Persistence:** If implemented, read/write non-sensitive demo state to `localStorage` with safe parsing and fallback defaults.

When multiple pages must see the same product or cart changes, use React Context or lift state to a shared parent. Do not duplicate independent copies of the same state across unrelated pages.

## 10. Demo Login and Role Navigation

1. User selects Admin, Farmer, or Customer.
2. The selected role opens its matching demo login form.
3. Client-side form validation checks required fields.
4. On the demo action, set the selected role in application state.
5. Navigate to the corresponding dashboard.
6. Provide a logout action that clears the demo role and returns to role selection.

Do not use client-side role checks to protect real data. With no backend, role switching is for interface demonstration only.

## 11. UI/UX Guidelines

- Use forest green as the primary brand color, supported by white and light cream backgrounds.
- Use responsive product grids and readable cards.
- Make prices and Add to Cart actions easy to find.
- Use clear role labels and distinct dashboard navigation.
- Provide field labels, validation messages, confirmation dialogs, and success/error feedback.
- Ensure interactive elements work with keyboard input and have visible focus states.
- Provide alternative text for meaningful product images.
- Avoid displaying fake testimonials, fake ratings, or false claims as verified facts.

## 12. Error and Empty-State Handling

- Unknown product ID: show a not-found page and a link back to Shop.
- No search matches: show “No products found” and allow clearing filters.
- Empty cart: show a message and link to the catalog.
- Invalid form: show field-level messages.
- Invalid localStorage: fall back to default sample data without crashing.
- Missing image: display a placeholder image or neutral fallback.
- Invalid route: display a not-found page.

## 13. Testing Strategy

### Manual functional tests
- Navigate through all public pages.
- Select each role and verify the correct dashboard opens.
- Verify form validation for each login screen.
- Search, filter, and sort products.
- Add products to cart, adjust quantities, remove items, and verify totals.
- Add/edit/delete a farmer listing and check the current catalog state.
- Test admin sample-data actions and confirmation dialogs.
- Test simulated checkout without collecting payment details.
- Test logout and return navigation.
- Refresh pages to verify intended state behavior.

### Responsive and accessibility checks
- Test common mobile, tablet, and desktop widths.
- Use keyboard-only navigation.
- Check input labels, focus visibility, contrast, and image alt text.
- Check browser console for errors.

## 14. Build and Deployment

Typical local setup with Vite:

```bash
npm create vite@latest agroconnect -- --template react
cd agroconnect
npm install
npm install react-router-dom
npm run dev
```

The exact commands may change if a project repository already exists or another framework is selected.

Build for static hosting:

```bash
npm run build
```

The output is typically created in `dist/`. It can be hosted on a static frontend platform. Configure SPA fallback/rewrite rules if required so direct navigation to client-side routes works.

## 15. Risks and Technical Limitations

- Browser state can be cleared and is not shared across devices.
- Client-side role selection is not secure authorization.
- Demo checkout does not create a real purchase.
- Sample order statuses are not connected to delivery services.
- Product listing changes are not centrally visible to other users unless a backend is added later.

## 16. Future Technical Extensions

If the scope changes in a future version, a backend API and database could support shared products, user accounts, secure role authorization, orders, inventory, and payment-provider integration. These are explicitly outside the current frontend-only deliverable.
