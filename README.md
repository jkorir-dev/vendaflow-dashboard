VendaFlow Dashboard

This is a simple web dashboard I built for independent social media merchants and online shop sellers to manage their items and track real profits.

What it does
Small business owners usually track their stock and money in messy notebooks or chat notes, which makes it easy to lose track of stock and forget about platform fees. 

This project fixes that. It helps sellers:
- Register and login safely: You have to click "Sign Up" and make an account before you can log in. The system saves user profiles locally.
- Privacy lock: When you click "Logout", the dashboard completely hides the product list and drops all financial totals to zero so no one else can see your business numbers.
- Upload product images: Sellers can click the file input to upload pictures of their items. The app turns the image file into a text string so it saves directly inside the database.
- Interactive stock calendar: Includes a calendar picker so you can record the exact date items are brought into the shop.
- Automatic SKU codes: Generates a unique warehouse tracking code (SKU) for every item automatically when you hit submit.
- Live dollar converter: Connects to an external live currency API to display item prices in both KSh and US Dollars ($ USD) based on actual market exchange rates.
- Sales and fees automation: Has a "Simulate Sale" button that drops the stock count by 1 in real-time. The top cards automatically subtract the mandatory 10% marketplace commission fee so you see your real net profit instantly.
- Quality ratings: Adds a quick 5-star metric on the product card to help track supplier batch quality scores visually.
- Filter search bar: You can search for any item instantly by typing a title or SKU code in the live search input.

Technologies I Used
- HTML for the responsive structure of the pages.
- CSS for the layout and colors (works nicely on mobile phones too).
- JavaScript for all the math calculations, forms, file handling, star ratings, and search features.
- JSON Server to act as my backend database API to save the items.
- Jest for running automated tests to make sure my code works perfectly.

My API Endpoints
- GET /products - To load the product list onto the screen grid.
- POST /products - To add a new product to the database.
- PATCH /products/:id - To change the stock count when an item sells.
- DELETE /products/:id - To completely remove an item from the list.

When running at `http://localhost:8080`, the app saves products through your local JSON Server at `http://localhost:3000`. `localhost` means the computer running the browser; a GitHub Pages visitor cannot reach the JSON Server on your computer. For shared inventory, this app supports Supabase as its public HTTPS API and database, with Supabase Auth and row-level security so each account only accesses its own inventory. The public anon key is intended for frontend use; never use the Supabase `service_role` key in this app.

Configure the shared GitHub Pages API
1. Create a Supabase project and run [supabase-schema.sql](supabase-schema.sql) in its SQL Editor.
2. In Supabase Authentication settings, enable email/password signups. If email confirmation is enabled, set the site URL and allowed redirect URL to `https://jkorir-dev.github.io/vendaflow-dashboard/`.
3. In GitHub, open **Settings → Secrets and variables → Actions → Variables** and add `VENDAFLOW_SUPABASE_URL` and `VENDAFLOW_SUPABASE_ANON_KEY` from the Supabase project settings. These are public frontend values; do not use a `service_role` key.
4. Ensure Pages uses **GitHub Actions**, then push to `main` or manually run the Pages workflow. The deployment injects those variables into `supabase-config.js` in the published site.
5. Locally, either continue using JSON Server with blank Supabase settings, or add the same project URL and anon key to `supabase-config.js` to use the shared inventory.

Without Supabase values, the localhost app uses local JSON Server and GitHub Pages falls back to browser-only storage. Local-only accounts are separate from Supabase accounts; create an account again when switching to Supabase. Supabase inventory is scoped to each authenticated account by database policies.

How to run it on your computer
1. Clone this folder down to your machine.
2. Open your terminal inside the project folder and install dependencies:
   `npm install`
3. Start the web app and database API together:
   `npm start`
4. Open `http://localhost:8080` in your browser. The dashboard loads and saves products through the JSON Server API at `http://localhost:3000`.
5. Run the dashboard API tests with `npm test`. The separate `js-analyzing-data-modules-syntax-lab` exercise has its own dependencies and tests; run `npm install` and `npm test` from that directory to test the lab.

To publish on GitHub Pages, set the repository's Pages source to **GitHub Actions**. The workflow in `.github/workflows/pages.yml` publishes the front end when changes are pushed to `main` or when started manually from the Actions tab.
