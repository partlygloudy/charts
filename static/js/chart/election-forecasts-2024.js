
// Globals
let parseTime = d3.timeParse("%m/%d/%Y");

let chartSize;
let chartData;

let selectedForecasts = [];
let selectedCandidate = "harris";
let selectedMetric = "pct"
let selectedData = "harris-pct";
let selected2020Data = "biden-2020-pct";
let selected2016Data = "clinton-2016-pct";
let is2016Active = false;
let is2020Active = false;

// Run on page load
$(document).ready(function() {

    // Check the size of the page
    chartSize = checkChartSize();

    // Add tooltip and data select overlays
    overlayToolTip();
    overlayDataSelect();

    // Add click handlers to forecast labels
    $(".tooltip-row").click(clickForecastLabel);
    $(".data-select-button").click(clickDataSelectButton);

    // Create the chart and add to page
    updateChart();

});


function updateChart() {

    // Request chart data
    d3.csv("/static/data/election-forecasts-2024.csv").then(function(data) {

        // Parse dates
        data.forEach(function(d) {
            d["date"] = parseTime(d["date"]);
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
        remakeChart();
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

function remakeChart() {

    // Remove existing chart
    $("#chart-body svg").remove();

    // Redraw the chart
    let newSvg = buildChart(chartData);

    // Append the chart to the page
    $("#chart-body").append(newSvg);

    // If any forecasts are actively selected, highlight them
    highlightSelectedForecasts();

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
    const paddingLeft = 50;

    // Domain (min, max values) of the data along each axis
    const domainX = [parseTime("8/1/2024"), parseTime("11/5/2024")];
    let domainY;

    // Set Y domain based on data source
    if (selectedData === "harris-pct") {
        domainY = [10, 90];
    } else if (selectedData === "trump-pct") {
        domainY = [10, 90];
    } else if (selectedData === "harris-margin") {
        domainY = [-80, 80];
    } else if (selectedData === "trump-margin") {
        domainY = [-80, 80];
    }

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
    const yAxis = d3.axisLeft(yScale).tickFormat(d => `${d}%`);


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
    data = data.filter(d => d["date"] >= domainX[0] && d["date"] <= domainX[1]);

    // FiveThirtyEight
    let line538 = d3.line()
        .x(d => xScale(d["date"]))
        .y(d => yScale(d["538-" + selectedData]))
        .defined(d => d["538-" + selectedData] !== "-")
        .curve(d3.curveBasis);

    // Silver Bulletin
    let lineSB = d3.line()
        .x(d => xScale(d["date"]))
        .y(d => yScale(d["sb-" + selectedData]))
        .defined(d => d["sb-" + selectedData] !== "-")
        .curve(d3.curveBasis);

    // Economist
    let lineEcon = d3.line()
        .x(d => xScale(d["date"]))
        .y(d => yScale(d["econ-" + selectedData]))
        .defined(d => d["econ-" + selectedData] !== "-")
        .curve(d3.curveBasis);

    // Split Ticket
    let lineST = d3.line()
        .x(d => xScale(d["date"]))
        .y(d => yScale(d["st-"+ selectedData]))
        .defined(d => d["st-" + selectedData] !== "-")
        .curve(d3.curveBasis);

    // Polymarket
    let linePoly = d3.line()
        .x(d => xScale(d["date"]))
        .y(d => yScale(d["poly-" + selectedData]))
        .defined(d => d["poly-" + selectedData] !== "-")
        .curve(d3.curveBasis);

    // Manifold
    let lineMani = d3.line()
        .x(d => xScale(d["date"]))
        .y(d => yScale(d["mani-" + selectedData]))
        .defined(d => d["mani-" + selectedData] !== "-")
        .curve(d3.curveBasis);

    // PredictIt
    let linePI = d3.line()
        .x(d => xScale(d["date"]))
        .y(d => yScale(d["pi-" + selectedData]))
        .defined(d => d["pi-" + selectedData] !== "-")
        .curve(d3.curveBasis);

    // 538 (2020)
    let line538_2020 = d3.line()
        .x(d => xScale(d["date"]))
        .y(d => yScale(d[selected2020Data]))
        .defined(d => d[selected2020Data] !== "-")
        .curve(d3.curveBasis);

    // 538 (2016)
    let line538_2016 = d3.line()
        .x(d => xScale(d["date"]))
        .y(d => yScale(d[selected2016Data]))
        .defined(d => d[selected2016Data] !== "-")
        .curve(d3.curveBasis);
    
    // Draw each path

    svg.append("path")
        .attr("d", line538(data))
        .classed("chart-data", true)
        .attr("id", "chart-data-538")

    svg.append("path")
        .attr("d", lineSB(data))
        .classed("chart-data", true)
        .attr("id", "chart-data-sb")

    svg.append("path")
        .attr("d", lineEcon(data))
        .classed("chart-data", true)
        .attr("id", "chart-data-econ")

    svg.append("path")
        .attr("d", lineST(data))
        .classed("chart-data", true)
        .attr("id", "chart-data-st")

    svg.append("path")
        .attr("d", linePoly(data))
        .classed("chart-data", true)
        .attr("id", "chart-data-poly")

    svg.append("path")
        .attr("d", lineMani(data))
        .classed("chart-data", true)
        .attr("id", "chart-data-mani")

    svg.append("path")
        .attr("d", linePI(data))
        .classed("chart-data", true)
        .attr("id", "chart-data-pi")

    svg.append("path")
        .attr("d", line538_2020(data))
        .classed("chart-data", true)
        .attr("id", "chart-data-538-2020")

    svg.append("path")
        .attr("d", line538_2016(data))
        .classed("chart-data", true)
        .attr("id", "chart-data-538-2016")


    // ----- MARKERS / LABELS ----- //

    // 50% line (for % plots) / 0% line (for margin plots)
    let midpoint = (selectedData === "harris-pct" || selectedData === "trump-pct") ? 50 : 0;
    svg.append("g")
        .append("line")
        .attr("x1", xScale(domainX[0]))
        .attr("y1", yScale(midpoint))
        .attr("x2", xScale(domainX[1]))
        .attr("y2", yScale(midpoint))
        .attr("id", "chart-data-y-midpoint");


    // ----- INTERACTIVE ELEMENTS ----- //

    // Get latest forecast value for each forecast source
    let latestDataIdx = data.length - 1;
    while (latestDataIdx > 0 && data[latestDataIdx]["poly-" + selectedData] === "-") {
        latestDataIdx -= 1;
    }

    let latestData = data[latestDataIdx];
    $("#tooltip-text-val-538").text(latestData["538-" + selectedData]);
    $("#tooltip-text-val-sb").text(latestData["sb-" + selectedData]);
    $("#tooltip-text-val-econ").text(latestData["econ-" + selectedData]);
    $("#tooltip-text-val-st").text(latestData["st-" + selectedData]);
    $("#tooltip-text-val-poly").text(latestData["poly-" + selectedData]);
    $("#tooltip-text-val-mani").text(latestData["mani-" + selectedData]);
    $("#tooltip-text-val-pi").text(latestData["pi-" + selectedData]);
    $("#tooltip-text-val-538-2020").text(latestData[selected2020Data]);
    $("#tooltip-text-val-538-2016").text(latestData[selected2016Data]);

    let latestDate = latestData["date"];
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
                return d["date"].getMonth() === cursorMonth && d["date"].getDate() === cursorDay;
            });

            // Update the tooltip box
            $("#tooltip-date").text(cursorDate.toLocaleString('default', {
                month: 'long',
                year: "numeric",
                day: "numeric"
            }));

            $("#tooltip-text-val-538").text(dataForDate["538-" + selectedData] + "%");
            $("#tooltip-text-val-sb").text(dataForDate["sb-" + selectedData] + "%");
            $("#tooltip-text-val-econ").text(dataForDate["econ-" + selectedData] + "%");
            $("#tooltip-text-val-st").text(dataForDate["st-" + selectedData] + "%");
            $("#tooltip-text-val-poly").text(dataForDate["poly-" + selectedData] + "%");
            $("#tooltip-text-val-mani").text(dataForDate["mani-" + selectedData] + "%");
            $("#tooltip-text-val-pi").text(dataForDate["pi-" + selectedData] + "%");
            $("#tooltip-text-val-538-2020").text(dataForDate[selected2020Data] + "%");
            $("#tooltip-text-val-538-2016").text(dataForDate[selected2016Data] + "%");

        }

    }

    // ----- RETURN FINISHED CHART ----- //

    // Serialize the svg so it can be rendered into template
    return svg.node();

}


function clickForecastLabel(e) {

    let newSelection;

    // Get the forecast that was clicked on
    if ($(e.currentTarget).hasClass("538")){
        newSelection = "538";
    } else if ($(e.currentTarget).hasClass("sb")){
        newSelection = "sb";
    } else if ($(e.currentTarget).hasClass("econ")) {
        newSelection = "econ";
    } else if ($(e.currentTarget).hasClass("st")) {
        newSelection = "st";
    } else if ($(e.currentTarget).hasClass("poly")) {
        newSelection = "poly";
    } else if ($(e.currentTarget).hasClass("mani")) {
        newSelection = "mani";
    } else if ($(e.currentTarget).hasClass("pi")) {
        newSelection = "pi";
    } else if ($(e.currentTarget).hasClass("538-2016")) {
        newSelection = "538-2016";
    } else if ($(e.currentTarget).hasClass("538-2020")) {
        newSelection = "538-2020";
    } else {
        newSelection = "none";
    }

    // Add / remove it from the list of selected forecasts
    if (newSelection !== "none") {

        // Handle clicks on past year labels
        if (newSelection === "538-2016") {
            is2016Active = !is2016Active;
        } else if (newSelection === "538-2020") {
            is2020Active = !is2020Active;
        } else {

            // If not already selected, add new selection
            if (!selectedForecasts.includes(newSelection)) {
                selectedForecasts.push(newSelection);
            }

            // Else remove selection
            else {
                selectedForecasts = selectedForecasts.filter(f => f !== newSelection);
            }

        }

    }

    // Update series highlighting
    highlightSelectedForecasts();

}


function highlightSelectedForecasts() {

    $(".chart-data").removeClass("chart-data-foregrounded");
    $(".tooltip-row").removeClass("tooltip-selected");

    if (selectedForecasts.length === 0) {
        $(".chart-data").removeClass("chart-data-backgrounded");
    } else {
        $(".chart-data").addClass("chart-data-backgrounded");
        for (let forecast of selectedForecasts) {
            $("#chart-data-" + forecast).removeClass("chart-data-backgrounded")
                .addClass("chart-data-foregrounded");
            $(".tooltip-row." + forecast).addClass("tooltip-selected")
        }
    }

    // Handle prev year reference line visibility
    if (is2016Active) {
        $("#chart-data-538-2016").css("visibility", "visible");
        $("#tooltip-row-2016").removeClass("hidden");
        $("#tooltip-icon-538-2016").removeClass("hidden");
    } else {
        $("#chart-data-538-2016").css("visibility", "hidden");
        $("#tooltip-row-2016").addClass("hidden");
        $("#tooltip-icon-538-2016").addClass("hidden");
    }

    if (is2020Active) {
        $("#chart-data-538-2020").css("visibility", "visible");
        $("#tooltip-row-2020").removeClass("hidden");
        $("#tooltip-icon-538-2020").removeClass("hidden");
    } else {
        $("#chart-data-538-2020").css("visibility", "hidden");
        $("#tooltip-row-2020").addClass("hidden");
        $("#tooltip-icon-538-2020").addClass("hidden");
    }

}


function clickDataSelectButton(e) {

    let prevSelectedData = selectedData;

    // Determine which button was pressed
    if ($(e.currentTarget).hasClass("select-harris")) {
        selectedCandidate = "harris"
    } else if ($(e.currentTarget).hasClass("select-trump")) {
        selectedCandidate = "trump";
    } else if ($(e.currentTarget).hasClass("select-margin")) {
        selectedMetric = "margin";
    } else if ($(e.currentTarget).hasClass("select-pct")) {
        selectedMetric = "pct";
    }

    selectedData = selectedCandidate + "-" + selectedMetric;
    selected2020Data = selectedCandidate === "harris" ? "biden-2020-" + selectedMetric : "trump-2020-" + selectedMetric
    selected2016Data = selectedCandidate === "harris" ? "clinton-2016-" + selectedMetric : "trump-2016-" + selectedMetric

    // If already selected button is pressed, do nothing
    if (prevSelectedData === selectedData) {
        return;
    }

    // Update selector button styling
    $(".data-select-button").removeClass("selected");

    if (selectedCandidate === "harris") {
        $(".select-harris").addClass("selected");
    } else {
        $(".select-trump").addClass("selected");
    }

    if (selectedMetric === "margin") {
        $(".select-margin").addClass("selected");
    } else {
        $(".select-pct").addClass("selected");
    }

    // Update plot to show selected data
    remakeChart();

}


function overlayToolTip() {

    $("#chart-body").append(
        `
        <!-- Tooltip box, overlayed on chart SVG -->
        
        <div id="tooltip-wrapper">
        
            <div id="tooltip-prev-years">
            
                <div class="tooltip-row tooltip-row-past 538-2016 hidden" id="tooltip-row-2016">
                    <div class="tooltip-icon hidden" id="tooltip-icon-538-2016"></div>
                    <p class="tooltip-text"><span class="tooltip-text-label tooltip-text-label-past">538 (2016):</span> <span id="tooltip-text-val-538-2016">-</span></p>
                </div>
                
                <div class="tooltip-row tooltip-row-past 538-2020 hidden" id="tooltip-row-2020">
                    <div class="tooltip-icon hidden" id="tooltip-icon-538-2020"></div>
                    <p class="tooltip-text"><span class="tooltip-text-label tooltip-text-label-past">538 (2020):</span> <span id="tooltip-text-val-538-2020">-</span></p>
                </div>
                
            </div>
        
            <div id="tooltip-box">
                <h3 id="tooltip-date"></h3>
    
                <div class="tooltip-row 538">
                    <div class="tooltip-icon" id="tooltip-icon-538"></div>
                    <p class="tooltip-text"><span class="tooltip-text-label">538:</span> <span id="tooltip-text-val-538">-</span></p>
                </div>
    
                <div class="tooltip-row sb">
                    <div class="tooltip-icon" id="tooltip-icon-sb"></div>
                    <p class="tooltip-text"><span class="tooltip-text-label">Silver Bulletin*:</span> <span id="tooltip-text-val-sb">-</span></p>
                </div>
    
                <div class="tooltip-row econ">
                    <div class="tooltip-icon" id="tooltip-icon-econ"></div>
                    <p class="tooltip-text"><span class="tooltip-text-label">The Economist*:</span> <span id="tooltip-text-val-econ">-</span></p>
                </div>
    
                <div class="tooltip-row st">
                    <div class="tooltip-icon" id="tooltip-icon-st"></div>
                    <p class="tooltip-text"><span class="tooltip-text-label">Split Ticket:</span> <span id="tooltip-text-val-st">-</span></p>
                </div>
    
                <div class="tooltip-row poly">
                    <div class="tooltip-icon" id="tooltip-icon-poly"></div>
                    <p class="tooltip-text"><span class="tooltip-text-label">Polymarket:</span> <span id="tooltip-text-val-poly">-</span></p>
                </div>
                
                <div class="tooltip-row mani">
                    <div class="tooltip-icon" id="tooltip-icon-mani"></div>
                    <p class="tooltip-text"><span class="tooltip-text-label">Manifold:</span> <span id="tooltip-text-val-mani">-</span></p>
                </div>
                
                <div class="tooltip-row pi">
                    <div class="tooltip-icon" id="tooltip-icon-pi"></div>
                    <p class="tooltip-text"><span class="tooltip-text-label">PredictIt**:</span> <span id="tooltip-text-val-pi">-</span></p>
                </div>
    
            </div>
            
        </div>
        `
    )

}


function overlayDataSelect() {

    $("#chart-body").append(
        `
        <!-- Tooltip box, overlayed on chart SVG -->
        <div id="data-select-wrapper">
        
            <div class="data-select-row">
                <div class="data-select-button select-harris selected button-left">Harris</div>
                <div class="data-select-button select-trump" >Trump</div>
            </div>
            
            <div class="data-select-row">
                <div class="data-select-button select-pct selected button-left">Win %</div>
                <div class="data-select-button select-margin">% Lead</div>
            </div>

        </div>
        `
    )

}