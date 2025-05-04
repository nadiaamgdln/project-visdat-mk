const margin = { top: 40, right: 20, bottom: 60, left: 60 };
const width = 800 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

const svg = d3
  .select("#chart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

d3.csv("data/cleaned_data.csv").then((data) => {
  // Filter only rows with both values filled
  const filtered = data.filter(
    (d) => d.Company_Support_for_Remote_Work && d.Satisfaction_with_Remote_Work
  );

  // Count grouped values
  const nested = d3.rollups(
    filtered,
    (v) => v.length,
    (d) => d.Company_Support_for_Remote_Work,
    (d) => d.Satisfaction_with_Remote_Work
  );

  // Flatten nested array
  const flattened = [];
  nested.forEach(([support, values]) => {
    values.forEach(([satisfaction, count]) => {
      flattened.push({ support, satisfaction, count });
    });
  });

  const x0 = d3
    .scaleBand()
    .domain([...new Set(flattened.map((d) => d.support))])
    .range([0, width])
    .padding(0.2);

  const x1 = d3
    .scaleBand()
    .domain([...new Set(flattened.map((d) => d.satisfaction))])
    .range([0, x0.bandwidth()])
    .padding(0.05);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(flattened, (d) => d.count)])
    .nice()
    .range([height, 0]);

  const color = d3
    .scaleOrdinal()
    .domain(["Unsatisfied", "Neutral", "Satisfied"])
    .range(["#7d9ea9", "#a2b29f", "#6e7582"]);

  // X Axis
  svg
    .append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x0))
    .selectAll("text")
    .attr("transform", "translate(0,5)")
    .style("text-anchor", "middle");

  // Y Axis
  svg.append("g").call(d3.axisLeft(y));

  // Axis Labels
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", height + 50)
    .style("text-anchor", "middle")
    .attr("class", "axis-label")
    .text("Company Support for Remote Work");

  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -50)
    .attr("x", -height / 2)
    .style("text-anchor", "middle")
    .attr("class", "axis-label")
    .text("Jumlah Karyawan");

  // Bars
  const group = svg
    .selectAll(".group")
    .data(nested)
    .join("g")
    .attr("transform", (d) => `translate(${x0(d[0])},0)`);

  group
    .selectAll("rect")
    .data((d) =>
      d[1].map((v) => ({ satisfaction: v[0], count: v[1], support: d[0] }))
    )
    .join("rect")
    
    .attr("x", (d) => x1(d.satisfaction))
    .attr("y", (d) => y(d.count))
    .attr("width", x1.bandwidth())
    .attr("height", (d) => height - y(d.count))
    .attr("fill", (d) => color(d.satisfaction));

    const legend = svg
        .append("g")
        .attr("transform", `translate(${width + 20}, 0)`);

  const satisfactionLevels = [...new Set(flattened.map((d) => d.satisfaction))];

  legend
    .selectAll("rect")
    .data(satisfactionLevels)
    .join("rect")
    .attr("x", 0)
    .attr("y", (d, i) => i * 22)
    .attr("width", 15)
    .attr("height", 15)
    .attr("fill", (d) => color(d));

  legend
    .selectAll("text")
    .data(satisfactionLevels)
    .join("text")
    .attr("x", 20)
    .attr("y", (d, i) => i * 22 + 12)
    .text((d) => d)
    .attr("font-size", "13px");
});

group
  .selectAll("rect")
  .data((d) =>
    d[1].map((v) => ({ satisfaction: v[0], count: v[1], support: d[0] }))
  )
  .join("rect")
  .attr("x", (d) => x1(d.satisfaction))
  .attr("width", x1.bandwidth())
  .attr("y", (d) => y(d.count))
  .attr("height", (d) => height - y(d.count))
  .attr("fill", (d) => color(d.satisfaction))

  // Tooltip events
  .on("mouseover", function (event, d) {
    d3.select("#tooltip")
      .style("opacity", 1)
      .html(
        `<strong>Support:</strong> ${d.support}<br><strong>Satisfaction:</strong> ${d.satisfaction}<br><strong>Count:</strong> ${d.count}`
      )
      .style("left", event.pageX + 10 + "px")
      .style("top", event.pageY - 28 + "px");
  })
  .on("mousemove", function (event) {
    d3.select("#tooltip")
      .style("left", event.pageX + 10 + "px")
      .style("top", event.pageY - 28 + "px");
  })
  .on("mouseout", function () {
    d3.select("#tooltip").style("opacity", 0);
  });

  


