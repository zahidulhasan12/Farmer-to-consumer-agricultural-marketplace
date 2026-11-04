# PRD: Product Requirements Document

## AgroConnect — Farmer-to-Consumer Agricultural Marketplace

| Field | Details |
|---|---|
| Project name | AgroConnect |
| Document | Product Requirements Document (PRD) |
| Version | 1.0 |
| Status | Draft for course project |
| Project type | Frontend-only web application |
| Target users | Admins, farmers, and customers |

## 1. Product Overview

AgroConnect is a web-based agricultural marketplace concept that connects farmers directly with customers. Farmers can showcase agricultural products and manage sample listings, while customers can browse products, search and filter the catalog, and interact with a simulated shopping cart. An admin interface provides a demonstration of platform oversight.

**Scope constraint:** This version is a frontend-only demonstration. It does not use a database or backend server. Product listings, accounts, and orders use predefined sample data and client-side state. Any persistence through browser storage is optional and limited to the current browser.

## 2. Problem Statement

Customers may find it difficult to discover products directly from local farmers, while farmers may lack a simple online showcase for their produce. AgroConnect demonstrates a straightforward digital storefront where customers can explore sample agricultural products and farmers can present their offerings.

## 3. Product Vision

Provide a clear, accessible, responsive interface that demonstrates how a direct farmer-to-consumer marketplace could work, without requiring backend infrastructure for this course project.

## 4. Goals and Success Criteria

### Goals
- Present agricultural products in an organized, visually appealing catalog.
- Provide separate user experiences for Admin, Farmer, and Customer roles.
- Demonstrate navigation, forms, filtering, client-side state, and responsive UI.
- Make the project easy to run, understand, and maintain in a GitHub repository.
- Keep the implementation within a frontend-only scope.

### Success criteria
- Visitors can navigate from the homepage to the shop, farmer information, and About page.
- Customers can search/filter sample products and add/remove items from a cart.
- Farmer demo users can add, edit, and remove product listings in client-side state.
- Admin demo users can view sample platform data and perform defined demo actions.
- Each role has a separate dashboard view.
- Main pages work on desktop and mobile-sized screens.
- The README explains setup steps and the lack of real backend authentication or persistence.

## 5. Target Users and Roles

### 5.1 Guest
- View the homepage and About page.
- Browse available sample products and farmer profiles.
- Open product detail pages.
- Navigate to login or registration.

### 5.2 Customer
- View and search products.
- Filter by category and sort products.
- View product details and farmer information.
- Add products to a cart and adjust quantities.
- Complete a simulated checkout and view sample order status.
- View and edit demo profile information where supported.

### 5.3 Farmer
- View a farmer dashboard.
- Create, edit, and delete sample product listings.
- Set product name, category, price, unit, quantity, description, and image.
- View sample orders associated with their listings.
- Edit demo profile information.

### 5.4 Admin
- View summary cards and sample marketplace activity.
- Review sample users, products, and orders.
- Demonstrate listing approval/removal or other moderation actions supported by the UI.
- Access an admin-specific dashboard.

**Role limitation:** In this frontend-only build, role selection and demo login are not secure identity verification. They must not be represented as production-grade authorization.

## 6. Product Scope

### In scope
- Responsive landing page and shared navigation.
- Product catalog, category filters, search, sorting, and product details.
- Demo login and registration screens with role selection.
- Separate Admin, Farmer, and Customer dashboard layouts.
- Client-side cart and simulated checkout.
- Sample order tracking.
- Farmer product-listing forms and local UI updates.
- Admin demo management screens.
- About and contact information pages.
- Reusable components and clear project structure.

### Out of scope
- Database or backend API.
- Real account creation, password storage, or password reset.
- Real authentication, authorization, or account verification.
- Real payments, refunds, or financial transactions.
- Real-time inventory synchronization across users/devices.
- Actual delivery integrations, maps, or notifications.
- Production deployment guarantees, audit logs, and server-side moderation.

## 7. Main User Journeys

### Customer journey
1. Open the homepage.
2. Browse or search the product catalog.
3. Select a product to view its details.
4. Add the product to the cart and adjust quantity.
5. Open the cart and review the subtotal and demo delivery fee.
6. Submit the simulated checkout.
7. View a sample confirmation or order-tracking screen.

### Farmer journey
1. Open the role-selection/login page.
2. Enter the farmer demo flow.
3. View the farmer dashboard.
4. Open the product management page.
5. Add, edit, or remove a listing.
6. View the updated listing in client-side state.

### Admin journey
1. Open the role-selection/login page.
2. Enter the admin demo flow.
3. View summary statistics and sample marketplace records.
4. Review products, users, or orders.
5. Perform available demonstration moderation actions.

## 8. Functional Requirements Summary

| ID | Requirement | Priority |
|---|---|---|
| PR-01 | Display a homepage with navigation, marketplace introduction, categories, and featured products | Must |
| PR-02 | Display product cards and product detail pages | Must |
| PR-03 | Search, filter, and sort sample products | Must |
| PR-04 | Provide role selection for Admin, Farmer, and Customer | Must |
| PR-05 | Provide role-specific demo login screens or forms | Must |
| PR-06 | Provide separate role dashboards | Must |
| PR-07 | Support cart add, remove, and quantity updates | Must |
| PR-08 | Provide simulated checkout and sample order tracking | Should |
| PR-09 | Allow farmers to add, edit, and remove listings in client-side state | Must |
| PR-10 | Allow admin to view and moderate sample data through demo controls | Should |
| PR-11 | Provide About and farmer information pages | Should |
| PR-12 | Provide responsive layouts and accessible form feedback | Must |

## 9. Non-Functional Requirements

- **Usability:** Labels, navigation, and actions should be easy to understand.
- **Responsiveness:** Layouts should adapt to desktop, tablet, and mobile widths.
- **Performance:** Avoid unnecessarily large assets and expensive repeated rendering.
- **Accessibility:** Use semantic HTML, keyboard-operable controls, visible focus, labels, and sufficient contrast.
- **Maintainability:** Use reusable React components and organized modules.
- **Reliability:** Empty states, invalid form entries, and missing product data should be handled gracefully.
- **Privacy:** Do not request or store real sensitive personal information in this demo.
- **Security honesty:** Clearly identify authentication, orders, and checkout as simulations.

## 10. Product Content and Design

- Product examples may include tomatoes, spinach, carrots, potatoes, eggs, grains, and honey.
- Use a fresh agricultural visual style with forest green, white, and light cream.
- Product cards should show an image, product name, price, unit, farmer name, and relevant action.
- Use consistent typography, spacing, buttons, form controls, and status labels.
- Include useful empty states, validation messages, and confirmation prompts.

## 11. Assumptions and Constraints

- The project is for a web development course.
- No database is required for this version.
- Sample data can be stored in JavaScript files.
- React state is used for interactions; optional `localStorage` may preserve demo state in one browser.
- Browser storage is not a shared database and can be cleared by the user.
- A backend can be considered in a future version but is not part of this scope.

## 12. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Users assume demo login is secure | Label it as a demonstration and avoid real passwords |
| Data disappears on refresh | Explain state behavior; optionally use localStorage for non-sensitive demo data |
| Scope becomes too large | Prioritize catalog, cart, role dashboards, and farmer listings |
| Product images increase load time | Optimize and reuse appropriately sized assets |
| UI behaves inconsistently across roles | Test role navigation and each dashboard separately |

## 13. Future Enhancements (Not in Current Scope)

- Backend API and database.
- Secure authentication and server-side role authorization.
- Real order processing and payment gateway.
- Inventory management shared across users.
- Delivery tracking and notifications.
- Reviews, ratings, and farmer verification.

## 14. Acceptance Criteria

The project is ready for demonstration when:
- All core pages are reachable through navigation.
- The three roles have clearly distinct demo entry points and dashboards.
- Product search and category filtering work on sample data.
- Cart quantities and totals update correctly.
- Farmer listing actions update the displayed sample catalog during the session.
- Admin screens display and operate on clearly identified demo data.
- The site works at common desktop and mobile widths.
- Setup instructions and limitations are documented in the repository.
