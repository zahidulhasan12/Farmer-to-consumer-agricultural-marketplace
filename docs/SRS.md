# SRS: Software Requirements Specification

## AgroConnect — Farmer-to-Consumer Agricultural Marketplace

| Field | Details |
|---|---|
| Project name | AgroConnect |
| Document | Software Requirements Specification (SRS) |
| Version | 1.0 |
| Status | Draft for course project |
| Implementation scope | Frontend-only; no database or backend |

## 1. Introduction

### 1.1 Purpose
This document specifies the functional and non-functional requirements for AgroConnect, a frontend web application prototype for a farmer-to-consumer agricultural marketplace. It is intended to guide design, implementation, and testing.

### 1.2 Scope
AgroConnect presents agricultural products and demonstrates separate interfaces for guests, customers, farmers, and administrators. The application uses static sample data and client-side state. It does not connect to a database or backend.

### 1.3 Definitions
- **Guest:** A visitor who has not entered a demo role.
- **Customer:** A demo role for browsing and shopping.
- **Farmer:** A demo role for managing product listings.
- **Admin:** A demo role for viewing and moderating sample marketplace content.
- **Client-side state:** Data held by the running frontend application.
- **localStorage:** Optional browser storage that persists data in one browser, not a server-side database.
- **Simulated checkout:** A user-interface flow that does not charge money or create a real order.

## 2. Overall Description

### 2.1 Product perspective
AgroConnect is a standalone frontend application running in a web browser. Its data layer consists of predefined JavaScript objects/arrays and, if implemented, optional browser storage.

### 2.2 User classes
1. Guest
2. Customer demo user
3. Farmer demo user
4. Admin demo user

### 2.3 Operating environment
- Modern desktop or mobile web browser.
- Node.js and npm for local development.
- React-based frontend, with a development server such as Vite.
- Git and GitHub for version control and project hosting.

### 2.4 Constraints
- No backend API.
- No relational or NoSQL database.
- No real authentication or secure access control.
- No real payment or fulfillment integration.
- Any state saved in the browser is local to that browser/device.

### 2.5 Assumptions
- The development team supplies suitable sample product images and descriptions.
- Users have JavaScript enabled.
- All example prices, quantities, orders, and user profiles are illustrative.

## 3. System Features and Functional Requirements

### 3.1 Homepage and navigation
- **SRS-FR-001:** The system shall display the AgroConnect name/logo and primary navigation.
- **SRS-FR-002:** The homepage shall display a marketplace introduction, featured products, categories, and calls to action.
- **SRS-FR-003:** Navigation shall provide access to Home, Shop, Farmers/About, and role login.
- **SRS-FR-004:** The layout shall adapt to different viewport widths.

### 3.2 Product catalog
- **SRS-FR-005:** The system shall display sample products as cards.
- **SRS-FR-006:** Each product card shall show at minimum a name, image, price, unit, and farmer/seller label where available.
- **SRS-FR-007:** Users shall be able to search products by name.
- **SRS-FR-008:** Users shall be able to filter products by category.
- **SRS-FR-009:** Users shall be able to sort products using supported options such as name or price.
- **SRS-FR-010:** Selecting a product shall open a detail view with description and available product information.
- **SRS-FR-011:** The catalog shall display a useful empty state when no products match the search/filter.

### 3.3 Role selection and demo login
- **SRS-FR-012:** The system shall provide role choices for Admin, Farmer, and Customer.
- **SRS-FR-013:** Each role shall have a clearly identified login form or login route.
- **SRS-FR-014:** The forms shall validate required fields and show understandable error messages.
- **SRS-FR-015:** A successful demo role selection/login shall navigate to the corresponding dashboard.
- **SRS-FR-016:** The UI shall communicate that demo login is not real authentication.
- **SRS-FR-017:** The system shall provide a way to return to role selection or the homepage.
- **SRS-FR-018:** Registration, if included, shall create only a temporary/local demo profile and shall not imply server-side account creation.

### 3.4 Customer functions
- **SRS-FR-019:** Customers shall be able to add a product to the cart.
- **SRS-FR-020:** Customers shall be able to change item quantities and remove items.
- **SRS-FR-021:** The cart shall calculate line totals and subtotal from product prices and quantities.
- **SRS-FR-022:** The cart shall display a clear empty-cart state.
- **SRS-FR-023:** The system shall provide a simulated checkout form.
- **SRS-FR-024:** The simulated checkout shall not request real payment-card information or charge money.
- **SRS-FR-025:** The system may display a sample order confirmation and tracking timeline.
- **SRS-FR-026:** Customers shall be able to view sample order history where implemented.

### 3.5 Farmer functions
- **SRS-FR-027:** Farmers shall have a dedicated dashboard.
- **SRS-FR-028:** Farmers shall be able to create a listing with product name, category, price, unit, quantity, description, and image reference.
- **SRS-FR-029:** Farmers shall be able to edit their own demo listings.
- **SRS-FR-030:** Farmers shall be able to remove a demo listing after confirmation.
- **SRS-FR-031:** Product forms shall validate required fields and numeric price/quantity values.
- **SRS-FR-032:** Updated listings shall be reflected in the current frontend state and catalog where the implementation supports shared client-side state.
- **SRS-FR-033:** Farmers shall be able to view sample order/listing summaries.

### 3.6 Admin functions
- **SRS-FR-034:** Admin shall have a dedicated dashboard.
- **SRS-FR-035:** The dashboard shall show sample counts or summaries for users, products, and orders.
- **SRS-FR-036:** Admin shall be able to inspect sample product listings and sample order/user records.
- **SRS-FR-037:** If moderation actions are implemented, the UI shall confirm before removing or changing a listing.
- **SRS-FR-038:** Admin actions shall operate only on demo data in the frontend.

### 3.7 General interface and feedback
- **SRS-FR-039:** Forms shall have labels and clear validation feedback.
- **SRS-FR-040:** Destructive actions shall request confirmation where appropriate.
- **SRS-FR-041:** Interactive controls shall provide visible feedback after actions.
- **SRS-FR-042:** The system shall provide About and contact/information content.

## 4. Non-Functional Requirements

- **SRS-NFR-001 Usability:** Common actions should be understandable without special training.
- **SRS-NFR-002 Responsive design:** Pages shall remain usable on mobile, tablet, and desktop screens.
- **SRS-NFR-003 Accessibility:** Use semantic landmarks, labeled form controls, keyboard access, visible focus, meaningful alt text, and sufficient contrast.
- **SRS-NFR-004 Performance:** Images shall be appropriately sized; components should avoid unnecessary re-rendering.
- **SRS-NFR-005 Maintainability:** Code shall be separated into reusable components and clear feature modules.
- **SRS-NFR-006 Compatibility:** The app should support current versions of major browsers.
- **SRS-NFR-007 Data handling:** Sample data shall not be described as centrally stored or shared.
- **SRS-NFR-008 Security limitation:** The frontend shall not claim to provide secure authentication, authorization, or protection of sensitive data.

## 5. Interface Requirements

### 5.1 Main pages
- Home / landing page
- Shop / product catalog
- Product details
- Farmer information
- About page
- Role selection
- Admin login and dashboard
- Farmer login and dashboard
- Customer login and dashboard
- Cart and simulated checkout
- Sample order tracking
- Product create/edit form
- Profile screen, if included

### 5.2 Visual design
- Primary palette: forest green, white, and light cream.
- Use agricultural imagery and consistent product cards.
- Maintain consistent spacing, typography, navigation, buttons, and form styling.
- Provide loading/empty/error states as appropriate, even if data is local.

## 6. Data Requirements (Client-Side Only)

The following sample data structures may be used. They are not database tables.

### Product
- `id`: string
- `name`: string
- `category`: string
- `price`: number
- `unit`: string
- `quantityAvailable`: number
- `description`: string
- `image`: string
- `farmerName`: string
- `isApproved`: boolean, if moderation is included

### Demo user/profile
- `id`: string
- `displayName`: string
- `email`: string
- `role`: `admin`, `farmer`, or `customer`

Do not store actual passwords in source code or browser storage. Demo role switching can be implemented without collecting a password, or with clearly documented non-sensitive test-only credentials.

### Cart item
- `productId`: string
- `quantity`: number

### Sample order
- `id`: string
- `items`: array of product/quantity snapshots
- `total`: number
- `status`: illustrative status string
- `createdAt`: display date string

## 7. Use Cases

### UC-01: Browse products
**Actor:** Guest or Customer  
**Precondition:** Product sample data is available.  
**Main flow:** Open Shop → view products → search/filter/sort → open product details.  
**Postcondition:** Matching products are displayed.

### UC-02: Add item to cart
**Actor:** Customer  
**Precondition:** A product is displayed.  
**Main flow:** Click Add to Cart → cart count updates → open cart → adjust quantity/remove item.  
**Postcondition:** Cart totals reflect the current items.

### UC-03: Manage a product listing
**Actor:** Farmer demo user  
**Precondition:** Farmer dashboard is open.  
**Main flow:** Open listing form → enter valid product details → save → listing appears in current UI state.  
**Postcondition:** The sample catalog reflects the change where shared state is used.

### UC-04: Review marketplace data
**Actor:** Admin demo user  
**Precondition:** Admin dashboard is open.  
**Main flow:** Review sample summaries → inspect sample records → optionally perform a demo moderation action.  
**Postcondition:** UI reflects the demo action.

### UC-05: Simulated checkout
**Actor:** Customer  
**Precondition:** Cart contains at least one item.  
**Main flow:** Open checkout → enter non-sensitive demonstration details → submit → show confirmation/tracking demo.  
**Postcondition:** A sample confirmation is shown; no payment or real order is created.

## 8. Validation Rules

- Required text fields must not be blank.
- Product price must be a valid non-negative number; if zero-priced items are not intended, require a value greater than zero.
- Quantity must be a non-negative integer.
- Cart quantity must be at least one and cannot exceed available sample stock if stock validation is implemented.
- Email fields should use basic browser/client-side format validation.
- Errors must be displayed near the relevant field or in an accessible message.

## 9. Testing Requirements

- Verify navigation links and role-specific routing.
- Test product search, category filters, sorting, and empty results.
- Test cart add/remove/quantity changes and total calculations.
- Test product form validation and add/edit/delete behavior.
- Test admin demo actions and confirmation prompts.
- Test login form validation and role destination.
- Test responsive layouts and keyboard navigation.
- Confirm checkout is clearly simulated and does not collect payment details.
- Verify no database or backend connection is required.

## 10. Acceptance Criteria

The application satisfies the SRS when the must-have functional requirements are implemented, the major user flows can be demonstrated with sample data, errors and empty states are handled, responsive layouts are usable, and the repository clearly documents that authentication and transactions are simulations.
