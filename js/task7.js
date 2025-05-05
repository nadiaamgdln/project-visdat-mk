const margin = { top: 40, right: 120, bottom: 60, left: 60 };
const width = 800 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

const svg = d3
  .select("#chart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Tooltip
const tooltip = d3
  .select("body")
  .append("div")
  .attr("id", "tooltip")
  .attr("class", "tooltip")
  .style("opacity", 0);

// Peta konversi angka ke label Bahasa Indonesia
const satisfactionMap = {
  "1": "Tidak Puas",
  "2": "Netral",
  "3": "Puas"
};

d3.csv("data/cleaned_data.csv").then((data) => {
  const filtered = data.filter(
    (d) => d.Company_Support_for_Remote_Work && d.Satisfaction_with_Remote_Work
  );

  const nested = d3.rollups(
    filtered,
    (v) => v.length,
    (d) => d.Company_Support_for_Remote_Work,
    (d) => d.Satisfaction_with_Remote_Work
  );

  const flattened = [];
  nested.forEach(([dukungan, values]) => {
    values.forEach(([kepuasan, jumlah]) => {
      flattened.push({
        dukungan,
        kepuasan,
        jumlah
      });
    });
  });

  const x0 = d3
    .scaleBand()
    .domain([...new Set(flattened.map((d) => d.dukungan))])
    .range([0, width])
    .padding(0.2);

  const x1 = d3
    .scaleBand()
    .domain(["1", "2", "3"])
    .range([0, x0.bandwidth()])
    .padding(0.05);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(flattened, (d) => d.jumlah)])
    .nice()
    .range([height, 0]);

  const color = d3
    .scaleOrdinal()
    .domain(["1", "2", "3"])
    .range(["#7d9ea9", "#a2b29f", "#6e7582"]);

  // Sumbu X
  svg
    .append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x0));

  // Sumbu Y
  svg.append("g").call(d3.axisLeft(y));

  // Label Sumbu
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", height + 50)
    .style("text-anchor", "middle")
    .attr("class", "axis-label")
    .text("Dukungan Perusahaan terhadap Kerja Jarak Jauh");

  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -50)
    .attr("x", -height / 2)
    .style("text-anchor", "middle")
    .attr("class", "axis-label")
    .text("Jumlah Karyawan");

  // Grup Bar
  const group = svg
    .selectAll(".group")
    .data(nested)
    .join("g")
    .attr("transform", (d) => `translate(${x0(d[0])},0)`);

  group
    .selectAll("rect")
    .data((d) =>
      d[1].map((v) => ({
        kepuasan: v[0],
        jumlah: v[1],
        dukungan: d[0]
      }))
    )
    .join("rect")
    .attr("x", (d) => x1(d.kepuasan))
    .attr("width", x1.bandwidth())
    .attr("y", (d) => y(d.jumlah))
    .attr("height", (d) => height - y(d.jumlah))
    .attr("fill", (d) => color(d.kepuasan))
    .on("mouseover", function (event, d) {
      tooltip
        .style("opacity", 1)
        .html(
          `<strong>Dukungan:</strong> ${d.dukungan}<br>
           <strong>Kepuasan:</strong> ${satisfactionMap[d.kepuasan] || d.kepuasan}<br>
           <strong>Jumlah:</strong> ${d.jumlah}`
        )
        .style("left", event.pageX + 12 + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mousemove", function (event) {
      tooltip
        .style("left", event.pageX + 12 + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", function () {
      tooltip.style("opacity", 0);
    });

  // Legend
  const legend = svg.append("g").attr("transform", `translate(${width + 20}, 0)`);

  legend
    .selectAll("rect")
    .data(["1", "2", "3"])
    .join("rect")
    .attr("x", 0)
    .attr("y", (d, i) => i * 22)
    .attr("width", 15)
    .attr("height", 15)
    .attr("fill", (d) => color(d));

  legend
    .selectAll("text")
    .data(["1", "2", "3"])
    .join("text")
    .attr("x", 20)
    .attr("y", (d, i) => i * 22 + 12)
    .text((d) => satisfactionMap[d])
    .attr("font-size", "13px");
});