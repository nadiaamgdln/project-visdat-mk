/**
 * Load data from CSV file asynchronously and render scatter plot
 */
let data, scatterplot;

// Load the data
d3.csv("data/cleaned_data.csv")
  .then((_data) => {
    data = _data;

    // Convert string values to numbers
    data.forEach((d) => {
      d.Age = +d.Age;
      d.Social_Isolation_Rating = +d.Social_Isolation_Rating;
      // Ensure other numeric fields are properly converted
      d.Stress_Level = +d.Stress_Level;
      d.Work_Life_Balance_Rating = +d.Work_Life_Balance_Rating;
    });

    // Initialize and update the visualization
    scatterplot = new Scatterplot({ parentElement: "#scatterplot" }, data);
    scatterplot.updateVis();

    // Generate insights
    generateInsights(data);
  })
  .catch((error) => console.error("Error loading data:", error));

/**
 * Generate insights from the data
 */
function generateInsights(data) {
  // Group data by mental health condition
  const conditionGroups = d3.group(data, (d) => d.Mental_Health_Condition);

  // Calculate average age and isolation by condition
  let insights = "Berdasarkan visualisasi:<ul>";

  conditionGroups.forEach((group, condition) => {
    const avgAge = d3.mean(group, (d) => d.Age).toFixed(1);
    const avgIsolation = d3
      .mean(group, (d) => d.Social_Isolation_Rating)
      .toFixed(1);
    const count = group.length;
    const percentage = ((count / data.length) * 100).toFixed(1);

    insights += `<li><strong>${condition}</strong>: ${count} karyawan (${percentage}%) dengan rata-rata usia ${avgAge} tahun dan tingkat isolasi ${avgIsolation}</li>`;
  });

  // Add overall pattern
  const highIsolationGroup = data.filter((d) => d.Social_Isolation_Rating >= 4);
  const youngHighIsolation = highIsolationGroup.filter(
    (d) => d.Age < 35
  ).length;
  const oldHighIsolation = highIsolationGroup.filter((d) => d.Age >= 50).length;

  insights += `<li>Di antara karyawan dengan tingkat isolasi tinggi (rating ≥ 4), ${youngHighIsolation} berusia di bawah 35 tahun dan ${oldHighIsolation} berusia 50 tahun atau lebih</li>`;
  insights += "</ul>";

  document.getElementById("insights").innerHTML = insights;
}

/**
 * Event listeners
 */

// Listen to window resize event and update the chart
let pageLoad = true;
d3.select(window).on("resize", () => {
  if (pageLoad) {
    pageLoad = false;
  } else {
    scatterplot.updateVis();
  }
});

class Scatterplot {
  /**
   * Class constructor with basic chart configuration
   * @param {Object}
   * @param {Array}
   */
  constructor(_config, _data) {
    this.config = {
      parentElement: _config.parentElement,
      containerHeight: 500,
      margin: { top: 25, right: 20, bottom: 50, left: 60 },
      tooltipPadding: 15,
      legendHeight: 30,
    };
    this.data = _data;
    this.initVis();
  }

  /**
   * We initialize scales/axes and append static elements, such as axis titles.
   */
  initVis() {
    let vis = this;

    // Get unique mental health conditions for color scale
    vis.conditions = [
      ...new Set(vis.data.map((d) => d.Mental_Health_Condition)),
    ];

    // Manually define the color scale to ensure "none" gets gray
    const colorRange = [
      "#5E4FA2", // Depression
      "#3288BD", // Anxiety
      "#ABDDA4", // Burnout
      "#CCCCCC", // None (gray)
    ];
    
    // Map conditions to appropriate colors
    const colorMap = {};
    vis.conditions.forEach((condition, i) => {
      if (condition.toLowerCase() === "none") {
        colorMap[condition] = "#888888"; // Gray for "none"
      } else if (i < colorRange.length - 1) {
        colorMap[condition] = colorRange[i];
      } else {
        // If there are more conditions than colors, use the last color
        colorMap[condition] = colorRange[colorRange.length - 2];
      }
    });

    // Initialize scales with specific color for "none"
    vis.colorScale = d3
      .scaleOrdinal()
      .domain(vis.conditions)
      .range(vis.conditions.map(c => colorMap[c] || "#888888"));

    vis.xScale = d3.scaleLinear();
    vis.yScale = d3.scaleLinear();

    // Initialize axes
    vis.xAxis = d3.axisBottom(vis.xScale).ticks(10).tickPadding(10);

    vis.yAxis = d3.axisLeft(vis.yScale).ticks(5).tickPadding(10);

    // Define size of SVG drawing area
    vis.svg = d3.select(vis.config.parentElement).append("svg");

    // Append group element that will contain our actual chart
    vis.chart = vis.svg
      .append("g")
      .attr(
        "transform",
        `translate(${vis.config.margin.left},${vis.config.margin.top})`
      );

    // Append empty x-axis group and move it to the bottom of the chart
    vis.xAxisG = vis.chart.append("g").attr("class", "axis x-axis");

    // Append y-axis group
    vis.yAxisG = vis.chart.append("g").attr("class", "axis y-axis");

    // Append axis titles
    vis.chart
      .append("text")
      .attr("class", "axis-title x-axis-title")
      .attr("text-anchor", "middle")
      .text("Usia (tahun)");

    vis.chart
      .append("text")
      .attr("class", "axis-title y-axis-title")
      .attr("text-anchor", "middle")
      .text("Tingkat Isolasi Sosial (1-5)");

    // Create legend
    this.createLegend();
  }

  /**
   * Create a legend for mental health conditions
   */
  createLegend() {
    let vis = this;

    const legend = d3.select("#condition-legend");

    // Add legend items
    vis.conditions.forEach((condition) => {
      const legendItem = legend
        .append("li")
        .attr("class", "legend-btn")
        .attr("data-condition", condition);

      legendItem
        .append("span")
        .attr("class", "legend-symbol")
        .style("background", vis.colorScale(condition));

      legendItem.append("text").text(` ${condition}`);
    });

    // Add event listeners to legend items
    d3.selectAll(".legend-btn").on("click", function () {
      // Toggle 'inactive' class
      d3.select(this).classed("inactive", !d3.select(this).classed("inactive"));

      // Filter data and update vis
      vis.filterData();
    });
  }

  /**
   * Filter data based on selected conditions
   */
  filterData() {
    let vis = this;

    // Get active conditions
    let selectedConditions = [];
    d3.selectAll(".legend-btn:not(.inactive)").each(function () {
      selectedConditions.push(d3.select(this).attr("data-condition"));
    });

    // Filter data
    if (selectedConditions.length > 0) {
      vis.filteredData = vis.data.filter((d) =>
        selectedConditions.includes(d.Mental_Health_Condition)
      );
    } else {
      vis.filteredData = vis.data;
    }

    vis.updateVis();
  }

  /**
   * Prepare the data and scales before rendering
   */
  updateVis() {
    let vis = this;

    if (!vis.filteredData) {
      vis.filteredData = vis.data;
    }

    // Update dimensions based on the current screen size
    vis.config.containerWidth = document.getElementById(
      vis.config.parentElement.substring(1)
    ).clientWidth;

    // Calculate inner chart size
    vis.config.width =
      vis.config.containerWidth -
      vis.config.margin.left -
      vis.config.margin.right;
    vis.config.height =
      vis.config.containerHeight -
      vis.config.margin.top -
      vis.config.margin.bottom;

    // Update SVG dimensions
    vis.svg
      .attr("width", vis.config.containerWidth)
      .attr("height", vis.config.containerHeight);

    // Update axis positions
    vis.xAxisG.attr("transform", `translate(0,${vis.config.height})`);

    // Update axis titles
    vis.chart
      .select(".x-axis-title")
      .attr("y", vis.config.height + 40)
      .attr("x", vis.config.width / 2);

    vis.chart
      .select(".y-axis-title")
      .attr("transform", `translate(-40,${vis.config.height / 2}) rotate(-90)`);

    // Add grid lines
    vis.xAxis.tickSize(-vis.config.height);
    vis.yAxis.tickSize(-vis.config.width);

    // Set accessor functions
    vis.colorValue = (d) => d.Mental_Health_Condition;
    vis.xValue = (d) => d.Age;
    vis.yValue = (d) => d.Social_Isolation_Rating;
    vis.radiusValue = (d) => d.Stress_Level;

    // Update scale domains
    vis.xScale
      .range([0, vis.config.width])
      .domain([20, d3.max(vis.filteredData, vis.xValue) + 2])
      .nice();

    vis.yScale.range([vis.config.height, 0]).domain([0, 5.5]).nice();

    vis.renderVis();
  }

  /**
   * Bind data to visual elements
   */
  renderVis() {
    let vis = this;

    // Add jitter to prevent overplotting
    const jitterWidth = 0.5;

    // Add circles with jitter for better visualization of overlapping points
    const circles = vis.chart
      .selectAll(".point")
      .data(vis.filteredData)
      .join("circle")
      .attr("class", "point")
      .attr("r", (d) => 3 + vis.radiusValue(d) * 0.7)
      .attr("cy", (d) =>
        vis.yScale(
          vis.yValue(d) + (Math.random() * jitterWidth - jitterWidth / 2)
        )
      )
      .attr("cx", (d) =>
        vis.xScale(
          vis.xValue(d) + (Math.random() * jitterWidth - jitterWidth / 2)
        )
      )
      .attr("fill", (d) => vis.colorScale(vis.colorValue(d)))
      .attr("opacity", 0.7);

    // Add tooltip functionality
    circles
      .on("mouseover", (event, d) => {
        d3
          .select("#tooltip")
          .style("display", "block")
          .style("left", event.pageX + vis.config.tooltipPadding + "px")
          .style("top", event.pageY + vis.config.tooltipPadding + "px").html(`
            <div class="tooltip-title">Karyawan: ${d.Employee_ID}</div>
            <ul>
              <li>Usia: ${d.Age} tahun</li>
              <li>Isolasi Sosial: ${d.Social_Isolation_Rating}/5</li>
              <li>Kondisi Mental: ${d.Mental_Health_Condition}</li>
              <li>Tingkat Stres: ${d.Stress_Level}/5</li>
              <li>Kualitas Tidur: ${d.Sleep_Quality}</li>
              <li>Lokasi Kerja: ${d.Work_Location}</li>
            </ul>
          `);
      })
      .on("mouseleave", () => {
        d3.select("#tooltip").style("display", "none");
      });

    // Update axes
    vis.xAxisG.call(vis.xAxis).call((g) => g.select(".domain").remove());

    vis.yAxisG.call(vis.yAxis).call((g) => g.select(".domain").remove());

    // Add a trend line to show relationship between age and social isolation
    const trend = vis.calculateTrendLine(vis.filteredData);

    vis.chart.selectAll(".trend-line").remove();
    vis.chart
      .append("line")
      .attr("class", "trend-line")
      .attr("x1", vis.xScale(trend.x1))
      .attr("y1", vis.yScale(trend.y1))
      .attr("x2", vis.xScale(trend.x2))
      .attr("y2", vis.yScale(trend.y2))
      .attr("stroke", "#888")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "5,5");
  }

  /**
   * Calculate a simple trend line
   */
  calculateTrendLine(data) {
    const xMean = d3.mean(data, (d) => d.Age);
    const yMean = d3.mean(data, (d) => d.Social_Isolation_Rating);

    // Calculate slope and intercept for least squares line
    let numerator = 0;
    let denominator = 0;

    data.forEach((d) => {
      numerator += (d.Age - xMean) * (d.Social_Isolation_Rating - yMean);
      denominator += Math.pow(d.Age - xMean, 2);
    });

    const slope = numerator / denominator;
    const intercept = yMean - slope * xMean;

    // Get points for the line
    const x1 = d3.min(data, (d) => d.Age);
    const y1 = slope * x1 + intercept;
    const x2 = d3.max(data, (d) => d.Age);
    const y2 = slope * x2 + intercept;

    return { x1, y1, x2, y2 };
  }
}