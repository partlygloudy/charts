
// Globals
let parseTime = d3.timeParse("%m/%d/%y");


// Run on page load
$(document).ready(function() {

    // Create the chart and add to page
    updateChart();

});


function updateChart() {

    // Request chart data
    d3.csv("/static/data/ace-forecast-2023.csv").then(function(data) {

        // Parse dates
        data.forEach(function(d) {
            d.Date = parseTime(d.Date);
        });

        // Build chart from the data
        let newSvg = buildChart(data);

        // Update the chart on the page
        $("#chart-body").append(newSvg);

    });

}


function buildChart(data) {

    // ----- SCALES, PARAMS, CONSTANTS ------ //

    // Width and height in pixels of the svg viewBox
    const width = 1200;
    const height = 600;

    // Empty space on each side of chart (inside svg area)
    const paddingTop = 50;
    const paddingRight = 10;
    const paddingBottom = 20;
    const paddingLeft = 30;

    // Domain (min, max values) of the data along each axis
    const domainX = [parseTime("7/6/23"), parseTime("11/1/23")];
    const domainY = [0, 180];

    // Range (min, max chart position in px) for each axis
    const rangeX = [paddingLeft, width-paddingRight];
    const rangeY = [height - paddingBottom, paddingTop];

    // Create the svg
    const svg = d3.create("svg")
        .attr("viewBox", [0, 0, width, height])
        .classed("svg-chart", true);

    // Create scales for the x and y axes
    const xScale = d3.scaleTime().domain(domainX).range(rangeX);
    const yScale = d3.scaleLinear().domain(domainY).range(rangeY);

    // Use the x, y scales to create bottom, left 'axis functions' respectively
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);


    // ----- AXES & REFERENCE LINES ------ //


    // X axis
    svg.append("g")
        .attr("transform", `translate(0, ${height - paddingBottom})`)
        .call(xAxis)

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

        // Add label above Y axis
        .call(g => g.append("text")
            .attr("x", -paddingLeft)
            .attr("y", 10)
            .attr("fill", "black")
            .attr("text-anchor", "start")
            .text("↑ Accumulated Cyclone Energy"));

    // Vertical line marking September 30
    svg.append("g")
        .append("line")
        .attr("x1", xScale(parseTime("9/30/23")))
        .attr("y1", rangeY[0])
        .attr("x2", xScale(parseTime("9/30/23")))
        .attr("y2", rangeY[1] - 10)
        .attr("id", "end-date-marker");


    // ----- FORECAST DATA ------ //

    // Historical ACE averages by date
    let lineHist = d3.line()
        .x(d => xScale(d["Date"]))
        .y(d => yScale(d["Historical"]))

    // Averages scaled to reach CSU modeled value for full season
    let lineCSU = d3.line()
        .x(d => xScale(d["Date"]))
        .y(d => yScale(d["CSU-Model"]))

    // Predicted Sept. 30 value on each date (quartiles)
    let areaQuartiles = d3.area()
        .defined(d => d["Predicted-LQ"] != 0)
        .x(d => xScale(d["Date"]))
        .y0(d => yScale(d["Predicted-LQ"]))
        .y1(d => yScale(d["Predicted-UQ"]))

    // Predicted Sept. 30 value on each date (median)
    let linePredMedian = d3.line()
        .defined(d => d["Predicted-Median"] != 0)
        .x(d => xScale(d["Date"]))
        .y(d => yScale(d["Predicted-Median"]))

    // Actual value measured on each date
    let lineActual = d3.line()
        .defined(d => d["Actual"] != 0)
        .x(d => xScale(d["Date"]))
        .y(d => yScale(d["Actual"]))

    // Draw each path

    svg.append("path")
        .attr("d", lineHist(data))
        .classed("chart-data", true)
        .attr("id", "chart-data-historical")

    svg.append("path")
        .attr("d", lineCSU(data))
        .classed("chart-data", true)
        .attr("id", "chart-data-csu")

    svg.append("path")
        .attr("d", areaQuartiles(data))
        .classed("chart-data", true)
        .attr("id", "chart-data-quartiles")

    svg.append("path")
        .attr("d", linePredMedian(data))
        .classed("chart-data", true)
        .attr("id", "chart-data-median")

    svg.append("path")
        .attr("d", lineActual(data))
        .classed("chart-data", true)
        .attr("id", "chart-data-actual")


    // Get date of latest prediction and latest prediction values
    let latestDate = null;
    let latestMedian = null;
    let latestLQ = null;
    let latestUQ = null;
    let latestDeviation = null;

    data.forEach(d => {

        if (d["Predicted-Median"] != 0) {
            latestDate = d["Date"];
            latestMedian = d["Predicted-Median"];
            latestLQ = d["Predicted-LQ"];
            latestUQ = d["Predicted-UQ"];
            latestDeviation = d["Deviation"];
        }

    })

    // Current prediction projected forward
    svg.append("g")
        .append("line")
        .attr("x1", xScale(latestDate))
        .attr("y1", yScale(latestMedian))
        .attr("x2", xScale(parseTime("9/30/23")))
        .attr("y2", yScale(latestMedian))
        .attr("id", "chart-data-median-proj");

    // Current quartiles projected forward
    svg.append("rect")
        .attr("x", xScale(latestDate))
        .attr("y", yScale(latestUQ))
        .attr("width", xScale(parseTime("9/30/23")) - xScale(latestDate))
        .attr("height", yScale(latestLQ) - yScale(latestUQ))
        .attr("id", "chart-data-quartiles-proj")

    // Predicted value for each date
    let linePredicted = d3.line()
        .defined(d => d["Actual"] == 0)
        .x(d => xScale(d["Date"]))
        .y(d => yScale(parseFloat(d["CSU-Model"]) + parseFloat(latestDeviation)))

    svg.append("path")
        .attr("d", linePredicted(data))
        .classed("chart-data", true)
        .attr("id", "chart-data-prediction")


    // ----- EVENT HANDLING ------ //



    // ----- RETURN FINISHED CHART ----- //

    // Serialize the svg so it can be rendered into template
    return svg.node();

}