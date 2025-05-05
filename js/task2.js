const colors = {
  1: d3
    .scaleLinear()
    .domain([0, 1])
    .range(["#BAD80A", "#009E49"])
    .interpolate(d3.interpolateRgb),
  2: d3
    .scaleLinear()
    .domain([0, 1])
    .range(["#FFF100", "#E81123"])
    .interpolate(d3.interpolateRgb),
  3: d3
    .scaleLinear()
    .domain([0, 1])
    .range(["#FF97B5", "#6E2A85"])
    .interpolate(d3.interpolateRgb),
};

const ageGroups = [
  { label: "20-29", min: 20, max: 29 },
  { label: "30-39", min: 30, max: 39 },
  { label: "40-49", min: 40, max: 49 },
  { label: "50-59", min: 50, max: 59 },
  { label: "60+", min: 60, max: 150 },
];

const expGroups = [
  { label: "0-4", min: 0, max: 4 },
  { label: "5-9", min: 5, max: 9 },
  { label: "10-14", min: 10, max: 14 },
  { label: "15-19", min: 15, max: 19 },
  { label: "20+", min: 20, max: 100 },
];

d3.csv("data/cleaned_data.csv").then((data) => {
  data.forEach((d) => {
    d.Age = +d.Age;
    d.Years_of_Experience = +d.Years_of_Experience;
    d.Stress_Level = +d.Stress_Level;
  });

  [1, 2, 3].forEach((level) => drawHeatmap(data, level));
});

function drawHeatmap(data, stressLevel) {
  const filtered = data.filter((d) => d.Stress_Level === stressLevel);
  const matrix = Array.from(ageGroups, (ag) =>
    Array.from(expGroups, (eg) => ({
      age: ag.label,
      exp: eg.label,
      value: filtered.filter(
        (d) =>
          d.Age >= ag.min &&
          d.Age <= ag.max &&
          d.Years_of_Experience >= eg.min &&
          d.Years_of_Experience <= eg.max
      ).length,
    }))
  ).flat();

  const width = 400,
    height = 400,
    padding = 60;

  const container = d3
    .select("#heatmaps")
    .append("div")
    .attr("class", "heatmap");

  container
    .append("div")
    .attr("class", "heatmap-title")
    .text(
      stressLevel === 1
        ? "Tingkat Stres Rendah"
        : stressLevel === 2
        ? "Tingkat Stres Sedang"
        : "Tingkat Stres Tinggi"
    );

  const svg = container
    .append("svg")
    .attr("width", width)
    .attr("height", height + 50);

  const x = d3
    .scaleBand()
    .domain(expGroups.map((d) => d.label))
    .range([padding, width - padding])
    .padding(0.05);

  const y = d3
    .scaleBand()
    .domain(ageGroups.map((d) => d.label))
    .range([height - padding, padding])
    .padding(0.05);

  const maxVal = d3.max(matrix, (d) => d.value);
  const color = (d) => colors[stressLevel](d / maxVal);

  const tooltip = container.append("div").attr("class", "tooltip");

  svg
    .selectAll("rect")
    .data(matrix)
    .join("rect")
    .attr("x", (d) => x(d.exp))
    .attr("y", (d) => y(d.age))
    .attr("width", x.bandwidth())
    .attr("height", y.bandwidth())
    .style("fill", (d) => color(d.value))
    .style("stroke", "#ccc")
    .on("mouseover", (event, d) => {
      tooltip
        .style("visibility", "visible")
        .html(
          `Umur: <b>${d.age}</b><br>Pengalaman: <b>${d.exp}</b><br>Jumlah: <b>${d.value}</b>`
        )
        .style("left", event.offsetX + 15 + "px")
        .style("top", event.offsetY - 20 + "px");
    })
    .on("mousemove", (event) => {
      tooltip
        .style("left", event.offsetX + 15 + "px")
        .style("top", event.offsetY - 20 + "px");
    })
    .on("mouseout", () => tooltip.style("visibility", "hidden"));

  svg
    .append("g")
    .attr("transform", `translate(0,${height - padding})`)
    .call(d3.axisBottom(x));

  svg
    .append("g")
    .attr("transform", `translate(${padding},0)`)
    .call(d3.axisLeft(y));

  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", height + padding - 80)
    .style("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Pengalaman Kerja");

  svg
    .append("text")
    .attr("x", -height / 2)
    .attr("y", padding - 50)
    .style("text-anchor", "middle")
    .style("font-size", "14px")
    .attr("transform", "rotate(-90)")
    .text("Usia");

  // Legend
  const legendWidth = 120;
  const legendHeight = 10;
  const legendX = (width - legendWidth) / 2;
  const legendY = height - padding + 60;

  const legendScale = d3
    .scaleLinear()
    .domain([0, maxVal])
    .range([0, legendWidth]);

  const defs = svg.append("defs");
  const gradId = `grad-${stressLevel}`;
  const grad = defs
    .append("linearGradient")
    .attr("id", gradId)
    .attr("x1", "0%")
    .attr("x2", "100%")
    .attr("y1", "0%")
    .attr("y2", "0%");

  for (let i = 0; i <= 10; i++) {
    grad
      .append("stop")
      .attr("offset", `${i * 10}%`)
      .attr("stop-color", colors[stressLevel](i / 10));
  }

  svg
    .append("rect")
    .attr("x", legendX)
    .attr("y", legendY)
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", `url(#${gradId})`);

  svg
    .append("g")
    .attr("transform", `translate(${legendX}, ${legendY + legendHeight})`)
    .call(d3.axisBottom(legendScale).ticks(4).tickSize(5))
    .select(".domain")
    .remove();

  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", legendY + legendHeight + 30)
    .style("text-anchor", "middle")
    .style("font-size", "12px")
    .style("font-style", "italic")
    .text("Jumlah individu");
}