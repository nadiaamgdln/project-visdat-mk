// Set dimensions dan margin
const margin = { top: 20, right: 30, bottom: 180, left: 60 },
  width = 1500 - margin.left - margin.right,
  height = 700 - margin.top - margin.bottom;

// Buat SVG
const svg = d3
  .select("#scatterplot")
  .append("svg")
  .attr(
    "viewBox",
    `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`
  )
  .attr("preserveAspectRatio", "xMidYMid meet")
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Tooltip
const tooltip = d3
  .select("#scatterplot")
  .append("div")
  .attr("class", "tooltip")
  .style("position", "absolute")
  .style("opacity", 0)
  .style("background", "#fff")
  .style("border", "1px solid #ccc")
  .style("padding", "6px")
  .style("border-radius", "4px")
  .style("pointer-events", "none");

// Load data
d3.csv("data/cleaned_data.csv").then((data) => {
  data.forEach((d) => {
    d["Number_of_Virtual_Meetings"] = +d["Number_of_Virtual_Meetings"];
    d["Social_Isolation_Rating"] = +d["Social_Isolation_Rating"];
  });

  const groupedData = d3.rollups(
    data,
    v => v.length,
    d => d["Number_of_Virtual_Meetings"],
    d => d["Social_Isolation_Rating"]
  ).flatMap(([x, ys]) =>
    ys.map(([y, count]) => ({
      x: +x,
      y: +y,
      count: count
    }))
  );

  // Skala
  const x = d3
  .scaleLinear()
  .domain([
    d3.min(data, d => d["Number_of_Virtual_Meetings"]) - 0.5,
    d3.max(data, d => d["Number_of_Virtual_Meetings"]) + 0.5
  ])
  .range([0, width]);

  const y = d3
    .scaleLinear()
    .domain([0.5, 5.5])
    .range([height, 0]);

  const color = d3
    .scaleSequential()
    .domain([0, d3.max(groupedData, d => d.count)])
    .interpolator(d3.interpolateBlues); 

  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(
      d3.axisBottom(x)
        .tickValues(d3.range(0, d3.max(data, d => d["Number_of_Virtual_Meetings"]) + 1))
        .tickFormat(d3.format("d"))
    );

  svg.append("g")
    .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format("d")));

  // Label sumbu
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + 50)
    .style("text-anchor", "middle")
    .style("font-weight", "bold")
    .text("Jumlah Virtual Meeting per Minggu");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -45)
    .attr("x", -height / 2)
    .style("text-anchor", "middle")
    .style("font-weight", "bold")
    .text("Tingkat Isolasi Sosial");

    const radiusScale = d3.scaleSqrt()
    .domain([0, d3.max(groupedData, d => d.count)])
    .range([4, 20]);

  svg.selectAll("circle.dot")
    .data(groupedData)
    .enter()
    .append("circle")
    .attr("class", "dot")
    .attr("cx", d => x(d.x))
    .attr("cy", d => y(d.y))
    .attr("r", d => radiusScale(d.count))
    .attr("fill", d => color(d.count))
    .on("mouseover", (event, d) => {
      tooltip
        .style("opacity", 1)
        .html(`Virtual Meeting: ${d.x}<br>Isolasi Sosial: ${d.y}<br>Jumlah Orang: ${d.count}`)
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mousemove", (event) => {
      const tooltipWidth = tooltip.node().offsetWidth;
      const tooltipHeight = tooltip.node().offsetHeight;
      let xPos = event.pageX + 10;
      let yPos = event.pageY - 28;

      if (xPos + tooltipWidth > window.innerWidth) {
        xPos = event.pageX - tooltipWidth - 10;
      }
      if (yPos < 0) {
        yPos = event.pageY + 10;
      }

      tooltip.style("left", xPos + "px").style("top", yPos + "px");
    })
    .on("mouseout", () => {
      tooltip.style("opacity", 0);
    });

  svg.selectAll(".tick text")
    .style("font-size", "16px")
    .style("font-weight", "bold");

  // Legend
  const legendWidth = 300;
  const legendHeight = 25;
  const defs = svg.append("defs");

  const linearGradient = defs.append("linearGradient").attr("id", "legend-gradient");

  linearGradient
    .selectAll("stop")
    .data(d3.range(0, 1.01, 0.01).map(t => ({
      offset: `${t * 100}%`,
      color: d3.interpolateBlues(t),
    })))
    .enter()
    .append("stop")
    .attr("offset", d => d.offset)
    .attr("stop-color", d => d.color);

  svg.append("rect")
    .attr("x", width / 2 - legendWidth / 2)
    .attr("y", height + 90)
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#legend-gradient)");

  const legendScale = d3.scaleLinear()
    .domain(color.domain())
    .range([width / 2 - legendWidth / 2, width / 2 + legendWidth / 2]);

  svg.append("g")
    .attr("transform", `translate(0,${height + 90})`)
    .call(d3.axisBottom(legendScale).ticks(5).tickSize(legendHeight + 6))
    .call(g => g.selectAll("text").style("font-size", "18px").style("font-weight", "bold"))
    .select(".domain")
    .remove();

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + 170)
    .attr("text-anchor", "middle")
    .style("font-size", "20px")
    .style("font-weight", "bold")
    .text("Skala Warna: Jumlah Orang");  
});