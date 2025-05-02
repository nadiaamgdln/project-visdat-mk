const margin = { top: 80, right: 30, bottom: 50, left: 70 };
const width = 800 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

const svg = d3.select("#heatmap")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

d3.csv("data/cleaned_data.csv").then(data => {
  const nested = d3.rollup(
    data,
    v => v.length,
    d => d.Number_of_Virtual_Meetings,
    d => d.Social_Isolation_Rating
  );

  const meetings = Array.from(new Set(data.map(d => d.Number_of_Virtual_Meetings))).sort((a, b) => +a - +b);
  const isolations = Array.from(new Set(data.map(d => d.Social_Isolation_Rating))).sort((a, b) => +a - +b);

  const x = d3.scaleBand().domain(meetings).range([0, width]).padding(0.05);
  const y = d3.scaleBand().domain(isolations).range([height, 0]).padding(0.05);

  const colorScale = d3.scaleSequential()
    .interpolator(d3.interpolateYlGnBu)
    .domain([0, d3.max(data, d => nested.get(d.Number_of_Virtual_Meetings)?.get(d.Social_Isolation_Rating) || 0)]);

  svg.append("g").call(d3.axisLeft(y));
  svg.append("g").attr("transform", `translate(0, ${height})`).call(d3.axisBottom(x));

  for (let [meetKey, innerMap] of nested.entries()) {
    for (let [isoKey, count] of innerMap.entries()) {
      svg.append("rect")
        .attr("x", x(meetKey))
        .attr("y", y(isoKey))
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .attr("fill", colorScale(count))
        .attr("class", "cell");
    }
  }

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + 40)
    .attr("text-anchor", "middle")
    .attr("class", "axis-label")
    .text("Number of Virtual Meetings");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -50)
    .attr("text-anchor", "middle")
    .attr("class", "axis-label")
    .text("Social Isolation Rating");

  // Legend
  const legendWidth = 120;
  const legendHeight = 10;

  const legendSvg = svg.append("g")
    .attr("transform", `translate(${(width - legendWidth) / 2}, -40)`);

  const legendScale = d3.scaleLinear()
    .domain(colorScale.domain())
    .range([0, legendWidth]);

  const legendAxis = d3.axisBottom(legendScale)
    .ticks(5)
    .tickFormat(d3.format("d"));

  const gradientId = "legend-gradient";

  const defs = svg.append("defs");
  const linearGradient = defs.append("linearGradient")
    .attr("id", gradientId)
    .attr("x1", "0%")
    .attr("x2", "100%");

  linearGradient.selectAll("stop")
    .data(d3.ticks(0, 1, 10))
    .enter()
    .append("stop")
    .attr("offset", d => `${d * 100}%`)
    .attr("stop-color", d => colorScale(colorScale.domain()[0] + d * (colorScale.domain()[1] - colorScale.domain()[0])));

  legendSvg.append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", `url(#${gradientId})`);

  legendSvg.append("g")
    .attr("transform", `translate(0, ${legendHeight})`)
    .call(legendAxis);

  legendSvg.append("text")
    .attr("x", 0)
    .attr("y", -10)
    .text("Jumlah Data");
});