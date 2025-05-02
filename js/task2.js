const svg = d3.select("svg"),
  margin = { top: 40, right: 30, bottom: 60, left: 60 },
  width = parseInt(svg.style("width")) - margin.left - margin.right,
  height = parseInt(svg.style("height")) - margin.top - margin.bottom;

svg
  .attr(
    "viewBox",
    `0 0 ${width + margin.left + margin.right} ${
      height + margin.top + margin.bottom
    }`
  )
  .attr("preserveAspectRatio", "xMidYMid meet");

const g = svg
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select(".tooltip");

const color = d3
  .scaleOrdinal()
  .domain(["Low", "Medium", "High"])
  .range(["#7FD671", "#FFF176", "#f44d4d"]);

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

  function categorizeStress(l) {
    return l === 1 ? "Low" : l === 2 ? "Medium" : l === 3 ? "High" : "Unknown";
  }

  // 1) hitung per kombinasi usia+pengalaman
  const nested = [];
  ageGroups.forEach((a) => {
    expGroups.forEach((e) => {
      const cnt = { age: a.label, exp: e.label, Low: 0, Medium: 0, High: 0 };
      data.forEach((d) => {
        if (
          d.Age >= a.range[0] &&
          d.Age <= a.range[1] &&
          d.Years_of_Experience >= e.range[0] &&
          d.Years_of_Experience <= e.range[1]
        ) {
          cnt[categorizeStress(d.Stress_Level)]++;
        }
      });
      nested.push(cnt);
    });
  });

  // 2) scales & axes
  const keys = ["Low", "Medium", "High"];
  const x0 = d3
    .scaleBand()
    .domain(ageGroups.map((d) => d.label))
    .range([0, width])
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
    .range([height, 0]);

  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x0))
    .selectAll("text")
    .style("font-size", "12px");

  g.append("g")
    .call(d3.axisLeft(y))
    .selectAll("text")
    .style("font-size", "12px");

  // 3) draw bars
  const seriesByAge = d3.group(nested, (d) => d.age);
  const stack = d3.stack().keys(keys);

  for (const [age, group] of seriesByAge) {
    const grp = g.append("g").attr("transform", `translate(${x0(age)},0)`);
    const series = stack(group);

    grp
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
      .on("mouseover", (e, d) => {
        const t = d3.select(e.target.parentNode).datum().key;
        tooltip
          .style("display", "block")
          .html(
            `Usia: ${d.data.age}<br>Pengalaman: ${d.data.exp} tahun<br>Stres: ${t}<br>Jumlah: ${d.data[t]}`
          );
      })
      .on("mousemove", (e) => {
        const tip = tooltip.node();
        const tw = tip ? tip.offsetWidth : 0;
        const container = document.querySelector(".chart-container");
        const rect = container.getBoundingClientRect();

        // posisi kursor relatif ke container
        let x = e.clientX - rect.left + 10;
        let y = e.clientY - rect.top - 20;

        // flip kalau terlalu mepet kanan container
        if (e.clientX + tw + 20 > rect.right) {
          x = e.clientX - rect.left - tw - 10;
        }

        tooltip.style("left", x + "px").style("top", y + "px");
      })
      .on("mouseout", () => tooltip.style("display", "none"));
  }

  // 4) render legend di <ul id="legend-list">
  const legendList = d3.select("#legend-list");
  keys.forEach((k) => {
    const li = legendList.append("li");
    li.append("span")
      .attr("class", "legend-symbol")
      .style("background-color", color(k));
    li.append("span").text(` ${k} Stress`);
  });

  // 5) isi insights ala Task 5
  let html = "<h3>Keterangan:</h3><ul>";
  nested.forEach((d) => {
    html += `<li>Usia ${d.age}, Pengalaman ${d.exp} tahun: Low ${d.Low}, Medium ${d.Medium}, High ${d.High}</li>`;
  });
  html += "</ul>";
  document.getElementById("insights").innerHTML = html;
});
