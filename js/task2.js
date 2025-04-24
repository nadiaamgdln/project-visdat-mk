const svg = d3.select("svg"),
  width = +svg.attr("width"),
  height = +svg.attr("height"),
  margin = { top: 40, right: 30, bottom: 60, left: 60 };

const chartWidth = width - margin.left - margin.right;
const chartHeight = height - margin.top - margin.bottom;

const g = svg
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select(".tooltip");

const color = d3
  .scaleOrdinal()
  .domain(["Low", "Medium", "High"])
  .range(["#8dd3c7", "#ffffb3", "#fb8072"]);

d3.csv("data/cleaned_data.csv").then((data) => {
  data.forEach((d) => {
    d.Age = +d.Age;
    d.Years_of_Experience = +d.Years_of_Experience;
    d.Stress_Level = +d.Stress_Level;
  });

  const ageGroups = [
    { label: "20–29", range: [20, 29] },
    { label: "30–39", range: [30, 39] },
    { label: "40–49", range: [40, 49] },
    { label: "50–59", range: [50, 59] },
  ];

  const expGroups = [
    { label: "0–4", range: [0, 4] },
    { label: "5–9", range: [5, 9] },
    { label: "10+", range: [10, 100] },
  ];

  function categorizeStress(level) {
    if (level === 1) return "Low";
    if (level === 2) return "Medium";
    if (level === 3) return "High";
    return "Unknown";
  }

  const nested = [];

  ageGroups.forEach((age) => {
    expGroups.forEach((exp) => {
      const filtered = data.filter(
        (d) =>
          d.Age >= age.range[0] &&
          d.Age <= age.range[1] &&
          d.Years_of_Experience >= exp.range[0] &&
          d.Years_of_Experience <= exp.range[1]
      );

      const count = {
        age: age.label,
        exp: exp.label,
        Low: 0,
        Medium: 0,
        High: 0,
      };

      filtered.forEach((d) => {
        const s = categorizeStress(d.Stress_Level);
        count[s]++;
      });

      nested.push(count);
    });
  });

  const stressKeys = ["Low", "Medium", "High"];

  const x0 = d3
    .scaleBand()
    .domain(ageGroups.map((d) => d.label))
    .range([0, chartWidth])
    .paddingInner(0.2);

  const x1 = d3
    .scaleBand()
    .domain(expGroups.map((d) => d.label))
    .range([0, x0.bandwidth()])
    .padding(0.1);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(nested, (d) => d.Low + d.Medium + d.High)])
    .nice()
    .range([chartHeight, 0]);

  const stacked = d3.stack().keys(stressKeys);
  const groupedData = d3.group(nested, (d) => d.age);

  g.append("g")
    .attr("transform", `translate(0,${chartHeight})`)
    .call(d3.axisBottom(x0))
    .selectAll("text")
    .style("font-size", "12px");

  g.append("g")
    .call(d3.axisLeft(y))
    .selectAll("text")
    .style("font-size", "12px");

  for (const [age, group] of groupedData) {
    const groupG = g.append("g").attr("transform", `translate(${x0(age)},0)`);

    const series = stacked(group);

    groupG
      .selectAll("g")
      .data(series)
      .enter()
      .append("g")
      .attr("fill", (d) => color(d.key))
      .selectAll("rect")
      .data((d) => d)
      .enter()
      .append("rect")
      .attr("x", (d) => x1(d.data.exp))
      .attr("y", (d) => y(d[1]))
      .attr("height", (d) => y(d[0]) - y(d[1]))
      .attr("width", x1.bandwidth())
      .on("mouseover", (event, d) => {
        const stressType = d3.select(event.target.parentNode).datum().key;
        tooltip
          .style("display", "block")
          .html(
            `Usia: ${d.data.age}<br>Pengalaman: ${d.data.exp} tahun<br>Stres: ${stressType}<br>Jumlah: ${d.data[stressType]}`
          );
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 20 + "px");
      })
      .on("mouseout", () => tooltip.style("display", "none"));
  }

  const legend = d3.select("#legend");
  stressKeys.forEach((k) => {
    const item = legend.append("div").attr("class", "legend-item");
    item
      .append("span")
      .attr("class", "legend-color")
      .style("background-color", color(k));
    item.append("span").text(k + " Stress");
  });
});
