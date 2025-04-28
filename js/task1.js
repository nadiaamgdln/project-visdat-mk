// Full 3D-style Pie Chart with Multiple Slices
d3.csv("data/cleaned_data.csv").then((data) => {
  // Normalisasi data: Jika kosong, ubah menjadi "None"
  data.forEach(d => {
    if (!d.Mental_Health_Condition || d.Mental_Health_Condition.trim() === "") {
      d.Mental_Health_Condition = "None";
    }
  });

  const counts = d3.rollup(
    data,
    v => v.length,
    d => d.Mental_Health_Condition
  );

  const dataset = Array.from(counts, ([label, value]) => ({ label, value }));

  const width = 900,
        height = 600,
        radius = Math.min(width, height) / 2.5;
  const depth = 20;

  const pastelColors = ["#82CAFA", "#FDFBD4", "#FFACB7", "#C1E1C1"]; // Tambah 1 warna untuk None

  const color = d3.scaleOrdinal()
    .domain(dataset.map(d => d.label))
    .range(pastelColors);

  const pie = d3.pie()
    .sort(null)
    .value(d => d.value);

  const arc = d3.arc()
    .innerRadius(0)
    .outerRadius(radius);
  const arcLower = d3.arc()
    .innerRadius(0)
    .outerRadius(radius);

  const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2 - 30})`);

  const pieData = pie(dataset);

  // Render slices dengan depth
  pieData.forEach((d) => {
    for (let z = depth; z > 0; z--) {
      svg.append("path")
        .attr("d", arcLower(d))
        .attr("fill", d3.color(color(d.data.label)).darker(1.5))
        .attr("transform", `translate(0, ${z})`)
        .attr("opacity", 0.3);
    }
  });

  // Tooltip
  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background", "#fff")
    .style("border", "1px solid #ccc")
    .style("border-radius", "8px")
    .style("padding", "16px 20px")
    .style("box-shadow", "0 4px 10px rgba(0,0,0,0.25)")
    .style("font-size", "16px")
    .style("pointer-events", "none")
    .style("max-width", "220px")
    .style("z-index", "9999")
    .style("color", "#222");

  svg.selectAll("path.top")
    .data(pieData)
    .enter()
    .append("path")
    .attr("class", "top")
    .attr("d", arc)
    .attr("fill", d => color(d.data.label))
    .attr("stroke", "#fff")
    .attr("stroke-width", "2px")
    .on("mouseover", function (event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr("transform", "translate(0, -5)");

      tooltip.transition().duration(200).style("opacity", 0.9);
      tooltip.html(`<strong>${d.data.label}</strong><br/>Jumlah: ${d.data.value}`)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 30) + "px");
    })
    .on("mouseout", function () {
      d3.select(this)
        .transition()
        .duration(200)
        .attr("transform", "translate(0, 0)");

      tooltip.transition().duration(300).style("opacity", 0);
    });

  // Hitung total untuk persentase
  const total = d3.sum(dataset, d => d.value);

  // Label nama + persentase
  const labelGroup = svg.selectAll("g.label")
    .data(pieData)
    .enter()
    .append("g")
    .attr("transform", d => `translate(${arc.centroid(d)})`)
    .attr("text-anchor", "middle");

  // Nama kondisi (atas)
  labelGroup.append("text")
    .text(d => d.data.label)
    .attr("dy", "-0.3em")
    .style("font-size", "18px")
    .style("font-weight", "800")
    .style("fill", "#222");

  // Persentase (bawah) tanpa pembulatan
  labelGroup.append("text")
    .text(d => `${((d.data.value / total) * 100).toFixed(2)}%`)
    .attr("dy", "1.2em")
    .style("font-size", "16px")
    .style("fill", "#555");
});
