const margin = { top: 20, right: 30, bottom: 100, left: 80 },
  width = 1000 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;

const svg = d3.select("#chart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom + 40)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("body")
  .append("div")
  .attr("id", "tooltip")
  .style("position", "absolute")
  .style("opacity", 0)
  .style("background", "#fff7fb")
  .style("border", "1px solid #e0cbe2")
  .style("padding", "10px")
  .style("border-radius", "8px")
  .style("pointer-events", "none")
  .style("font-size", "14px");

d3.csv("data/cleaned_data.csv").then(data => {
  data = data.filter(d => d.Access_to_Mental_Health_Resources !== "" && d.Mental_Health_Condition !== "");

  data.forEach(d => {
    d.Access = d.Access_to_Mental_Health_Resources === "1" ? "Memiliki akses" : "Tidak memiliki akses";
    d.Condition = d.Mental_Health_Condition;
  });

  const conditionTypes = Array.from(new Set(data.map(d => d.Condition))).slice(0, 4); // pakai hanya 4 jenis

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
    .domain(["Tidak memiliki akses", "Memiliki akses"])
    .range([0, width])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(stackedData, d => conditionTypes.reduce((sum, k) => sum + d[k], 0))])
    .nice()
    .range([height, 0]);

  const pastelColors = ["#ffd1dc", "#c7ceea", "#b5ead7", "#ffdac1"];

  const color = d3.scaleOrdinal()
    .domain(conditionTypes)
    .range(pastelColors);

  const stackedSeries = d3.stack()
    .keys(conditionTypes)(stackedData);

  svg.append("g")
    .selectAll("g")
    .data(stackedSeries)
    .join("g")
    .attr("fill", d => color(d.key))
    .attr("fill-opacity", 0.9)
    .selectAll("rect")
    .data(d => d)
    .join("rect")
    .attr("x", d => x(d.data.Access))
    .attr("y", d => y(d[1]))
    .attr("height", d => y(d[0]) - y(d[1]))
    .attr("width", x.bandwidth())
    .on("mouseover", function (event, d) {
      const category = d3.select(this.parentNode).datum().key;
      const value = d.data[category];
      tooltip.transition().duration(200).style("opacity", 1);
      tooltip.html(`<strong>${category}</strong><br/>${value} responden`)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mousemove", function (event) {
      tooltip.style("left", (event.pageX + 10) + "px")
             .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function () {
      tooltip.transition().duration(200).style("opacity", 0);
    });

  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

  svg.append("g")
    .call(d3.axisLeft(y));

  svg.append("text")
    .attr("text-anchor", "middle")
    .attr("x", width / 2)
    .attr("y", height + 40)
    .attr("class", "axis-label")
    .style("font-weight", "bold")
    .text("Akses ke Layanan Kesehatan Mental");

  svg.append("text")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("y", -60)
    .attr("x", -height / 2)
    .attr("class", "axis-label")
    .style("font-weight", "bold")
    .text("Jumlah Responden");

  const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${(width - conditionTypes.length * 120) / 2}, ${height + 70})`);

  conditionTypes.forEach((key, i) => {
    const legendGroup = legend.append("g")
      .attr("transform", `translate(${i * 120}, 0)`);

    legendGroup.append("rect")
      .attr("width", 18)
      .attr("height", 18)
      .attr("fill", color(key))
      .attr("stroke", "#666");

    legendGroup.append("text")
      .attr("x", 24)
      .attr("y", 14)
      .style("font-size", "15px")
      .text(key);
  });
});