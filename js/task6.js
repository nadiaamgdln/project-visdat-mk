const margin = { top: 50, right: 30, bottom: 100, left: 80 },
  width = 700 - margin.left - margin.right,
  height = 400 - margin.top - margin.bottom;

const svg = d3.select("#chart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom + 80)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

d3.csv("data/cleaned_data.csv").then(data => {
  data = data.filter(d => d.Access_to_Mental_Health_Resources !== "" && d.Mental_Health_Condition !== "");

  data.forEach(d => {
    d.Access = d.Access_to_Mental_Health_Resources === "1" ? "Mudah" : "Susah";
    d.Condition = d.Mental_Health_Condition;
  });

  const conditionTypes = Array.from(new Set(data.map(d => d.Condition)));

  const groupedData = d3.rollup(
    data,
    v => {
      const result = {};
      conditionTypes.forEach(k => result[k] = v.filter(d => d.Condition === k).length);
      return result;
    },
    d => d.Access
  );

  const stackedData = Array.from(groupedData, ([key, values]) => ({
    Access: key,
    ...values
  }));

  const x = d3.scaleBand()
    .domain(["Susah", "Mudah"])
    .range([0, width])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(stackedData, d => conditionTypes.reduce((sum, k) => sum + d[k], 0))])
    .nice()
    .range([height, 0]);

  const color = d3.scaleOrdinal()
    .domain(conditionTypes)
    .range(d3.schemeSet2);

  const stackedSeries = d3.stack()
    .keys(conditionTypes)(stackedData);

  svg.append("g")
    .selectAll("g")
    .data(stackedSeries)
    .join("g")
    .attr("fill", d => color(d.key))
    .selectAll("rect")
    .data(d => d)
    .join("rect")
    .attr("x", d => x(d.data.Access))
    .attr("y", d => y(d[1]))
    .attr("height", d => y(d[0]) - y(d[1]))
    .attr("width", x.bandwidth());

  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

  svg.append("g")
    .call(d3.axisLeft(y));

  // Labels
  svg.append("text")
    .attr("text-anchor", "middle")
    .attr("x", width / 2)
    .attr("y", height + 50)
    .attr("class", "axis-label")
    .text("Akses ke Layanan Kesehatan Mental");

  svg.append("text")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("y", -60)
    .attr("x", -height / 2)
    .attr("class", "axis-label")
    .text("Jumlah Responden");

  // Legend (di bawah)
  const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(0, ${height + 70})`);

  let offsetX = 0;
  conditionTypes.forEach((key, i) => {
    const legendGroup = legend.append("g")
      .attr("transform", `translate(${offsetX}, 0)`);

    legendGroup.append("rect")
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", color(key));

    legendGroup.append("text")
      .attr("x", 20)
      .attr("y", 12)
      .text(key);

    offsetX += key.length * 9 + 40; 
  });
});