const margin = { top: 80, right: 30, bottom: 50, left: 70 };
const width = 1000 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

const svg = d3.select("#heatmap")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Tooltip
const tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip");

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
        .attr("class", "cell")
        .on("mouseover", function (event) {
          d3.select(this).attr("stroke", "#000").attr("stroke-width", 2);
          tooltip
            .style("opacity", 1)
            .style("transform", "translateY(-5px)") // animasi naik dikit
            .html(`
              <strong>Virtual Meetings:</strong> ${meetKey}<br/>
              <strong>Isolation Rating:</strong> ${isoKey}<br/>
              <strong>Jumlah Data:</strong> ${count}
            `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 30) + "px");
        })
        .on("mousemove", function (event) {
          tooltip
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 30) + "px");
        })
        .on("mouseout", function () {
          d3.select(this).attr("stroke", "white").attr("stroke-width", 1);
          tooltip
            .style("opacity", 0)
            .style("transform", "translateY(0px)"); // reset posisi animasi
        });
    }
  }

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + 40)
    .attr("text-anchor", "middle")
    .attr("class", "axis-label")
    .style("font-weight", "bold") // Menambahkan bold
    .text("Number of Virtual Meetings");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -50)
    .attr("text-anchor", "middle")
    .attr("class", "axis-label")
    .style("font-weight", "bold") // Menambahkan bold
    .text("Social Isolation Rating");

  // Legend
  const legendWidth = 300; // Lebar legend
  const legendHeight = 20; // Tinggi legend
  const legendSpacing = 10;

  const legendSvg = svg.append("g")
    .attr("transform", `translate(${width / 2 - legendWidth / 2}, ${-margin.top / 2 - legendHeight - 20})`);  // Naikkan legend lebih tinggi

  // Membuat skala warna untuk legend
  const legendScale = d3.scaleLinear()
    .domain(colorScale.domain())  // Menyesuaikan dengan domain warna
    .range([0, legendWidth]);

  // Membuat gradient untuk legend
  const defs = svg.append("defs");
  const linearGradient = defs.append("linearGradient")
    .attr("id", "legend-gradient")
    .attr("x1", "0%")
    .attr("x2", "100%")
    .attr("y1", "0%")
    .attr("y2", "0%");

  linearGradient.selectAll("stop")
    .data(d3.ticks(0, 1, 10))
    .enter()
    .append("stop")
    .attr("offset", d => `${d * 100}%`)
    .attr("stop-color", d => colorScale(colorScale.domain()[0] + d * (colorScale.domain()[1] - colorScale.domain()[0])));

  // Menambahkan kotak legend horizontal
  legendSvg.append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", `url(#legend-gradient)`);

  // Menambahkan axis untuk legend horizontal
  legendSvg.append("g")
    .attr("transform", `translate(0, ${legendHeight + legendSpacing})`)  // Menambahkan jarak ke bawah untuk axis
    .call(d3.axisBottom(legendScale)
      .ticks(5)
      .tickFormat(d3.format(".0f")));  // Format nilai dalam legenda

  // Menambahkan keterangan "Jumlah Data"
  legendSvg.append("text")
    .attr("x", legendWidth / 2)
    .attr("y", legendHeight + legendSpacing + 35)
    .attr("text-anchor", "middle")
    .style("font-weight", "bold")  // Bold
    .text("Jumlah Data");
});