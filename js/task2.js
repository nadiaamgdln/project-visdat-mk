// Load the data (you can replace this with a fetch to your CSV)
const data = [
  { Employee_ID: "emp0001", Age: 32, Years_of_Experience: 13, Stress_Level: 2 },
  { Employee_ID: "emp0002", Age: 40, Years_of_Experience: 3, Stress_Level: 2 },
  // Add more data points here...
];

// Set up the margins, width, and height for the plot
const margin = { top: 40, right: 40, bottom: 60, left: 60 };
const width = 900 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// Create the SVG container for the scatter plot
const svg = d3
  .select("#scatterplot")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Set up the x and y scales based on the data range
const x = d3
  .scaleLinear()
  .domain([d3.min(data, (d) => d.Age) - 1, d3.max(data, (d) => d.Age) + 1]) // X-axis: Age
  .range([0, width]);

const y = d3
  .scaleLinear()
  .domain([
    d3.min(data, (d) => d.Years_of_Experience) - 1,
    d3.max(data, (d) => d.Years_of_Experience) + 1,
  ]) // Y-axis: Years of Experience
  .range([height, 0]);

// Set up the color scale for Stress Level
const color = d3.scaleSequential(d3.interpolateReds).domain([1, 4]); // Stress levels from 1 (low) to 4 (high)

// Create the scatter plot circles
svg
  .selectAll(".dot")
  .data(data)
  .enter()
  .append("circle")
  .attr("class", "dot")
  .attr("cx", (d) => x(d.Age))
  .attr("cy", (d) => y(d.Years_of_Experience))
  .attr("r", 8) // Adjust the size of the points
  .style("fill", (d) => color(d.Stress_Level))
  .style("stroke", "#fff")
  .style("stroke-width", 1.5)
  .on("mouseover", function (event, d) {
    const tooltip = d3.select("#tooltip");
    tooltip.style("display", "block").html(`
        <div><strong>Employee ID:</strong> ${d.Employee_ID}</div>
        <div><strong>Age:</strong> ${d.Age}</div>
        <div><strong>Experience:</strong> ${d.Years_of_Experience} years</div>
        <div><strong>Stress Level:</strong> ${d.Stress_Level}</div>
      `);
  })
  .on("mousemove", function (event) {
    const tooltip = d3.select("#tooltip");
    tooltip
      .style("left", event.pageX + 10 + "px")
      .style("top", event.pageY - 50 + "px");
  })
  .on("mouseout", function () {
    d3.select("#tooltip").style("display", "none");
  });

// Add x and y axis
svg
  .append("g")
  .attr("class", "x axis")
  .attr("transform", `translate(0,${height})`)
  .call(d3.axisBottom(x).ticks(5))
  .append("text")
  .attr("x", width / 2)
  .attr("y", 35)
  .attr("fill", "#333")
  .style("text-anchor", "middle")
  .text("Age");

svg
  .append("g")
  .attr("class", "y axis")
  .call(d3.axisLeft(y).ticks(5))
  .append("text")
  .attr("x", -40)
  .attr("y", height / 2)
  .attr("fill", "#333")
  .style("text-anchor", "middle")
  .attr("transform", "rotate(-90)")
  .text("Years of Experience");

// Add title to the scatter plot
svg
  .append("text")
  .attr("x", width / 2)
  .attr("y", -20)
  .attr("text-anchor", "middle")
  .style("font-size", "18px")
  .style("font-weight", "bold")
  .text("Usia dan Pengalaman Kerja vs Tingkat Stres");
