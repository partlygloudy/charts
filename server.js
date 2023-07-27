
// Module imports
import express from 'express';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import fs from "fs";


// define __filename and __dirname for use by template renderer
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


// Create and configure express app
const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));


// Load chart data manifest for quick access
const manifest = JSON.parse(
    fs.readFileSync("static/manifest.json", "utf8")
);


/**
 * Add logging for all incoming requests
 */
app.use((req, res, next) => {
    console.log(`Received ${req.method} request to ${req.url}`);
    next();
});


/**
 * Request handler for all static file requests
 */
app.use('/static', express.static("static"));


/**
 * Request handler for the main webpage. Responds to GET
 * requests to the / endpoint. Serves index.html
 */
app.get("/", function (request, response) {

    // Render charts home page
    response.render("index");

})


/**
 * Request handler for a specific chart, for viewing on the charts website
 */
app.get("/web/:chart", function (request, response) {

    // Get manifest data for the requested chart
    const chartData = manifest["data"][request.params.chart];

    // Render the web chart viewer template with the correct data
    response.render("chart", {
        chartPageTitle: chartData["pageTitle"],
        chartStylesheet: chartData["chartStylesheet"],
        chartScript: chartData["chartScript"],
        chartTitle: chartData["chartTitle"],
        chartSubtitle: chartData["chartSubtitle"],
    });

})


/**
 * Request handler for a specific chart, formatted for embedding within an iframe
 */
app.get("/embed/:chart", function (request, response) {

    // Fill in all the required data for rendering the specified chart

    // Render the embedded chart template with the correct data
    response.render("embed");

})


// Start the server
app.listen(3000, function () {
    console.log("App available at http://localhost:3000")
})