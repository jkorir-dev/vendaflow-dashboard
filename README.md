VendaFlow Dashboard

An independent merchant control center designed for social commerce sellers and online shop vendors to manage stock levels and automate profit tracking.

Core Features

- User Accounts and Session Gates: Vendors must register a profile via the sign-up panel before logging in. Clicking logout completely hides active catalog assets and zeroes out metrics cards to protect business data privacy.
- Dual-Mode Database Fallback: The application intelligently detects its environment. It communicates directly with a local backend JSON-Server REST API when running on a local development server, and switches automatically to persistent browser LocalStorage memory when viewed on a live GitHub Pages link to bypass network restrictions.
- Automatic Financial Computations: Top metric cards keep track of gross store sales, automatically calculate and subtract the 3% platform marketplace fee, and surface the accurate net payout value in real time.
- Stock Control Actions: Features a one-click sale simulation loop that decreases inventory counts instantly. Items that drop down to zero stock automatically switch to a distinct out-of-stock layout badge status.
- Smart Low Stock Alerts: Shows a restock warning when an item's quantity reaches three or fewer, or when its rolling seven-day sales rate projects it will run out within seven days. Forecasts use sales recorded in this browser; an item with no recorded sales still uses the quantity threshold.
- Customer WhatsApp Receipts: After a simulated sale, the merchant can enter the buyer's phone number. The app displays a clickable WhatsApp receipt link on the page; the merchant reviews it and taps Send in WhatsApp. This avoids popup blocking, and messages are not sent automatically.
- Warehouse SKU Generation: Programmatically strips text spacing and variables on form submission to engineer an immediate, unique tracking SKU code for every product batch.
- Live Global Currency Engine: Connects to an external exchange rate API to pull market data and automatically convert local pricing into US Dollars ($ USD) side-by-side with Kenyan Shillings (KSh).
- Strict Date Entry Boundaries: Integrates an interactive calendar picker with a built-in guard system that prevents merchants from accidentally logging future inventory dates ahead of the current calendar day.
- Quality ratings: Adds a quick 5-star metric on the product card to help track supplier batch quality scores visually.
- Active Filter Search: A live filter text input field allows vendors to narrow down items by matching product titles or custom tracking codes instantly.

Technologies Used

- HTML for structural layout and responsive forms.
- CSS for matrix layout grids and status colors.
- JavaScript ES6 Modules for data loops, authentication, and calculations.
- JSON Server for local mock backend persistence.
- Jest for running automated unit test coverage checks.

Backend Endpoints

- GET /products: Loads inventory assets onto the dashboard grid display.
- POST /products: Saves a newly formulated product payload.
- PATCH /products/:id: Modifies stock values when a sale triggers.
- DELETE /products/:id: Erases a data row from the active collection.

Installation and Launch

- Clone this folder down to your machine.
- Install project package dependencies by running npm install in your terminal.
- Launch the local mock database API background engine by running npx json-server --watch db.json --port 3000.
- Execute the unit test framework to inspect code coverage by running npm test.
- Open index.html in a web browser window tab to manage your vendor hub!












