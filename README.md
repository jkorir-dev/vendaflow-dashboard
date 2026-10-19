# VendaFlow Dashboard

This is a simple web dashboard I built for small shop owners who sell items online or on social media. 

## What it does
Small business owners usually track their stock and money in messy notebooks or spreadsheets, which makes it easy to lose track of profits. 

This project fixes that problem. It helps sellers:
* Add new products using a simple form.
* Automatically get a unique tracking code (SKU) for every item.
* Automatically subtract a 10% marketplace fee so they can see their real profit.
* Search for any item instantly by typing a name or code in the search bar.
* Click a "Simulate Sale" button to drop the stock number. When it hits zero, it says "Out of Stock" automatically.

## Technologies I Used
* HTML for the structure of the pages.
* CSS for the layout and colors (it works nicely on phones too).
* JavaScript for all the calculations, forms, and search features.
* JSON Server to act as my backend database to save the items.
* Jest for running automated tests to make sure my code works.

## My API Paths
* GET /products - To load all products onto the screen.
* POST /products - To add a new product to the database.
* PATCH /products/:id - To change the stock count when an item sells.
* DELETE /products/:id - To completely remove an item from the list.

## How to run it on your computer
1. Clone this folder down to your machine.
2. Open your terminal inside the folder and run this to install dependencies:
   npm install
3. Start the mock backend database server by running:
   npx json-server --watch db.json --port 3000
4. Run my automated code tests by running:
   npm test
5. Open index.html in your browser to use the app!
