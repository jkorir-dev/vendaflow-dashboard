# VendaFlow Dashboard

This is a simple web dashboard I built for independent social media merchants and online shop sellers to manage their items and track real profits.

## What it does
Small business owners usually track their stock and money in messy notebooks or chat notes, which makes it easy to lose track of stock and forget about platform fees. 

This project fixes that. It helps sellers:
* Register and login safely: You have to click "Sign Up" and make an account before you can log in. The system saves user profiles locally.
* Privacy lock: When you click "Logout", the dashboard completely hides the product list and drops all financial totals to zero so no one else can see your business numbers.
* Upload product images: Sellers can click the file input to upload pictures of their items. The app turns the image file into a text string so it saves directly inside the database.
* Interactive stock calendar: Includes a calendar picker so you can record the exact date items are brought into the shop.
* Automatic SKU codes: Generates a unique warehouse tracking code (SKU) for every item automatically when you hit submit.
* Live dollar converter: Connects to an external live currency API to display item prices in both KSh and US Dollars ($ USD) based on actual market exchange rates.
* Sales and fees automation: Has a "Simulate Sale" button that drops the stock count by 1 in real-time. The top cards automatically subtract the mandatory 10% marketplace commission fee so you see your real net profit instantly.
* Quality ratings: Adds a quick 5-star metric on the product card to help track supplier batch quality scores visually.
* Filter search bar: You can search for any item instantly by typing a title or SKU code in the live search input.

## Technologies I Used
* HTML for the responsive structure of the pages.
* CSS for the layout and colors (works nicely on mobile phones too).
* JavaScript for all the math calculations, forms, file handling, star ratings, and search features.
* JSON Server to act as my backend database API to save the items.
* Jest for running automated tests to make sure my code works perfectly.

## My API Endpoints
* GET /products - To load the product list onto the screen grid.
* POST /products - To add a new product to the database.
* PATCH /products/:id - To change the stock count when an item sells.
* DELETE /products/:id - To completely remove an item from the list.

## How to run it on your computer
1. Clone this folder down to your machine.
2. Open your terminal inside the project folder and run this to install dependencies:
   npm install
3. Start the background database server by running:
   npx json-server --watch db.json --port 3000
4. Run my automated test checks by running:
   npm test
5. Open index.html in your browser to use the application!
