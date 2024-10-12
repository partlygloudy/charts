
// Globals
let parseTime = d3.timeParse("%m/%d/%Y");

let chartSize;
let chartData;


// Run on page load
$(document).ready(function() {

    // Check the size of the page
    chartSize = checkChartSize();

    // Add tooltip box html to page
    addToolTipHtml();

    // Create the chart and add to page
    updateChart();

});


function updateChart() {

    // Request chart data
    d3.csv("/static/data/election-forecasts-2024.csv").then(function(data) {

        // Parse dates
        data.forEach(function(d) {
            d.Date = parseTime(d.Date);
            d["FiveThirtyEight"] = d["FiveThirtyEight"] === "" ? "-" : d["FiveThirtyEight"];
            d["Silver-Bulletin"] = d["Silver-Bulletin"] === "" ? "-" : d["Silver-Bulletin"];
            d["The-Economist"] = d["The-Economist"] === "" ? "-" : d["The-Economist"];
            d["Split-Ticket"] = d["Split-Ticket"] === "" ? "-" : d["Split-Ticket"];
            d["Polymarket"] = d["Polymarket"] === "" ? "-" : d["Polymarket"];
            d["Manifold"] = d["Manifold"] === "" ? "-" : d["Manifold"];
        });

        // Save chart data to variable
        chartData = data;

        // Draw the chart and append to page
        let newSvg = buildChart(chartData);
        $("#chart-body").append(newSvg);

    });

}

window.onresize = function() {
    let newChartSize = checkChartSize();
    if (chartSize !== newChartSize) {
        chartSize = newChartSize;
        resizeChart();
    }
}

function checkChartSize() {
    if (window.innerWidth < 500) {
        return "SMALL";
    } else if (window.innerWidth < 750) {
        return "MEDIUM";
    } else {
        return "LARGE"
    }
}

function resizeChart() {

    // Remove existing chart
    $("#chart-body svg").remove();

    // Redraw the chart
    let newSvg = buildChart(chartData);

    // Append the chart to the page
    $("#chart-body").append(newSvg);

}


function buildChart(data) {

    // ----- SCALES, PARAMS, CONSTANTS ------ //

    // Width and height in pixels of the svg viewBox
    let width;
    let height;

    if (chartSize === "LARGE") {
        width = 1100;
        height =  700;
    } else if (chartSize === "MEDIUM") {
        width = 800;
        height =  650;
    } else {
        width = 500;
        height = 500;
    }

    // Empty space on each side of chart (inside svg area)
    const paddingTop = 60;
    const paddingRight = 10;
    const paddingBottom = 30;
    const paddingLeft = 40;

    // Domain (min, max values) of the data along each axis
    const domainX = [parseTime("8/1/2024"), parseTime("11/5/2024")];
    const domainY = [-50, 50];

    // Range (min, max chart position in px) for each axis
    const rangeX = [paddingLeft, width-paddingRight];
    const rangeY = [height - paddingBottom, paddingTop];

    // Create the svg
    const svg = d3.create("svg")
        .attr("viewBox", [0, 0, width, height])
        .classed("svg-chart", true)
        .on("pointermove", pointerMoved);

    // Create scales for the x and y axes
    const xScale = d3.scaleTime().domain(domainX).range(rangeX);
    const yScale = d3.scaleLinear().domain(domainY).range(rangeY);

    // Use the x, y scales to create bottom, left 'axis functions' respectively
    const xAxis = d3.axisBottom(xScale).ticks(d3.timeMonth.every(1)).tickFormat(d3.timeFormat("%b"));
    const yAxis = d3.axisLeft(yScale);


    // ----- AXES & REFERENCE LINES ------ //

    // X axis
    svg.append("g")
        .attr("transform", `translate(0, ${height - paddingBottom})`)
        .call(xAxis)
        .selectAll(".tick:last-child text")
        .attr("dx", "-0.5em");  // Adjust the position of the text

    // Y axis & horizontal reference lines
    svg.append("g")
        .attr("transform", `translate(${paddingLeft}, 0)`)
        .call(yAxis)

        // Remove solid Y axis line
        .call(g => g.select(".domain").remove())

        // Convert ticks into full horizontal lines
        .call(g => {
            g.selectAll(".tick line")
                .attr("x2", width - paddingLeft - paddingRight)
                .classed("tick-y-cross", true)
        })

    // ----- FORECAST DATA ------ //

    // Filter data to exclude everything outside chart date range
    data = data.filter(d => d["Date"] >= domainX[0] && d["Date"] <= domainX[1]);

    // FiveThirtyEight
    let lineFiveThirtyEight = d3.line()
        .x(d => xScale(d["Date"]))
        .y(d => yScale(d["FiveThirtyEight"]))
        .defined(d => d["FiveThirtyEight"] !== "-");

    // Averages scaled to reach CSU modeled value for full season
    let lineSilverBulletin = d3.line()
        .x(d => xScale(d["Date"]))
        .y(d => yScale(d["Silver-Bulletin"]))
        .defined(d => d["Silver-Bulletin"] !== "-");

    // Averages scaled to reach CSU modeled value for full season
    let lineTheEconomist = d3.line()
        .x(d => xScale(d["Date"]))
        .y(d => yScale(d["The-Economist"]))
        .defined(d => d["The-Economist"] !== "-");

    // Averages scaled to reach CSU modeled value for full season
    let lineSplitTicket = d3.line()
        .x(d => xScale(d["Date"]))
        .y(d => yScale(d["Split-Ticket"]))
        .defined(d => d["Split-Ticket"] !== "-");

    // Averages scaled to reach CSU modeled value for full season
    let linePolymarket = d3.line()
        .x(d => xScale(d["Date"]))
        .y(d => yScale(d["Polymarket"]))
        .defined(d => d["Polymarket"] !== "-");

    // Averages scaled to reach CSU modeled value for full season
    let lineManifold = d3.line()
        .x(d => xScale(d["Date"]))
        .y(d => yScale(d["Manifold"]))
        .defined(d => d["Manifold"] !== "-");

    // Draw each path

    svg.append("path")
        .attr("d", lineFiveThirtyEight(data))
        .classed("chart-data", true)
        .attr("id", "chart-data-fivethirtyeight")

    svg.append("path")
        .attr("d", lineSilverBulletin(data))
        .classed("chart-data", true)
        .attr("id", "chart-data-silver-bulletin")

    svg.append("path")
        .attr("d", lineTheEconomist(data))
        .classed("chart-data", true)
        .attr("id", "chart-data-the-economist")

    svg.append("path")
        .attr("d", lineSplitTicket(data))
        .classed("chart-data", true)
        .attr("id", "chart-data-split-ticket")

    svg.append("path")
        .attr("d", linePolymarket(data))
        .classed("chart-data", true)
        .attr("id", "chart-data-polymarket")

    svg.append("path")
        .attr("d", lineManifold(data))
        .classed("chart-data", true)
        .attr("id", "chart-data-manifold")

    // ----- INTERACTIVE ELEMENTS ----- //

    // Get latest forecast value for each forecast source
    let latestData = data[data.length - 1];
    $("#tooltip-text-val-fivethirtyeight").text(latestData["FiveThirtyEight"]);
    $("#tooltip-text-val-silver-bulletin").text(latestData["Silver-Bulletin"]);
    $("#tooltip-text-val-the-economist").text(latestData["The-Economist"]);
    $("#tooltip-text-val-split-ticket").text(latestData["Split-Ticket"]);
    $("#tooltip-text-val-polymarket").text(latestData["Polymarket"]);
    $("#tooltip-text-val-manifold").text(latestData["Manifold"]);

    let latestDate = latestData["Date"];
    const selectedDateLine = svg.append("g")
        .append("line")
        .attr("x1", xScale(latestDate))
        .attr("y1", rangeY[0])
        .attr("x2", xScale(latestDate))
        .attr("y2", rangeY[1])
        .attr("id", "selected-date-marker");

    // Update the tooltip box date
    $("#tooltip-date").text(latestDate.toLocaleString('default', {
        month: 'long',
        year: "numeric",
        day: "numeric"
    }));

    // ----- EVENT HANDLING ------ //

    // Update the selected date marker and tooltip data as cursor moves

    let prevCursorMonth = undefined;
    let prevCursorDay = undefined;
    function pointerMoved(event) {

        // Get x, y positions of the pointer
        let [x, y] = d3.pointer(event);
        x = Math.min(x, xScale.range()[1]);
        x = Math.max(x, xScale.range()[0]);

        // Truncate the time for this date
        let cursorDate = xScale.invert(x);
        let cursorMonth = cursorDate.getMonth();
        let cursorDay = cursorDate.getDate();
        cursorDate.setHours(0);
        cursorDate.setMinutes(0);
        cursorDate.setSeconds(0);
        cursorDate.setMilliseconds(0);
        x = xScale(cursorDate);

        // Move current hovered date marker to the cursor's x position
        selectedDateLine
            .attr("x1", x)
            .attr("x2", x);

        // If cursor date has changed, update tooltip
        if (cursorMonth !== prevCursorMonth || cursorDay !== prevCursorDay) {

            // Record the cursor date to avoid scanning again on same date
            prevCursorMonth = cursorMonth;
            prevCursorDay = cursorDay;

            // Fetch the data for this date
            let dataForDate = undefined;
            data.some(d => {
                dataForDate = d;
                return d.Date.getMonth() === cursorMonth && d.Date.getDate() === cursorDay;
            });

            // Update the tooltip box
            $("#tooltip-date").text(cursorDate.toLocaleString('default', {
                month: 'long',
                year: "numeric",
                day: "numeric"
            }));

            $("#tooltip-text-val-fivethirtyeight").text(dataForDate["FiveThirtyEight"] + "%");
            $("#tooltip-text-val-silver-bulletin").text(dataForDate["Silver-Bulletin"] + "%");
            $("#tooltip-text-val-the-economist").text(dataForDate["The-Economist"] + "%");
            $("#tooltip-text-val-split-ticket").text(dataForDate["Split-Ticket"] + "%");
            $("#tooltip-text-val-polymarket").text(dataForDate["Polymarket"] + "%");
            $("#tooltip-text-val-manifold").text(dataForDate["Manifold"] + "%");

        }

    }

    // ----- RETURN FINISHED CHART ----- //

    // Serialize the svg so it can be rendered into template
    return svg.node();

}


function addToolTipHtml() {

    $("#chart-body").append(
        `
        <!-- Tooltip box, overlayed on chart SVG -->
        <div id="tooltip-box">
            <h3 id="tooltip-date"></h3>

            <div class="tooltip-row">
                <div class="tooltip-icon" id="tooltip-icon-fivethirtyeight"></div>
                <p class="tooltip-text"><span class="tooltip-text-label">FiveThirtyEight:</span> <span id="tooltip-text-val-fivethirtyeight">-</span></p>
            </div>

            <div class="tooltip-row">
                <div class="tooltip-icon" id="tooltip-icon-silver-bulletin"></div>
                <p class="tooltip-text"><span class="tooltip-text-label">Silver Bulletin:</span> <span id="tooltip-text-val-silver-bulletin">-</span></p>
            </div>

            <div class="tooltip-row">
                <div class="tooltip-icon" id="tooltip-icon-the-economist"></div>
                <p class="tooltip-text"><span class="tooltip-text-label">The Economist:</span> <span id="tooltip-text-val-the-economist">-</span></p>
            </div>

            <div class="tooltip-row">
                <div class="tooltip-icon" id="tooltip-icon-split-ticket"></div>
                <p class="tooltip-text"><span class="tooltip-text-label">Split Ticket:</span> <span id="tooltip-text-val-split-ticket">-</span></p>
            </div>

            <div class="tooltip-row">
                <div class="tooltip-icon" id="tooltip-icon-polymarket"></div>
                <p class="tooltip-text"><span class="tooltip-text-label">Polymarket:</span> <span id="tooltip-text-val-polymarket">-</span></p>
            </div>
            
            <div class="tooltip-row">
                <div class="tooltip-icon" id="tooltip-icon-manifold"></div>
                <p class="tooltip-text"><span class="tooltip-text-label">Manifold:</span> <span id="tooltip-text-val-manifold">-</span></p>
            </div>

        </div>
        `
    )

}