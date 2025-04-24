d3.csv("data/cleaned_data.csv").then(function(data) {
  data.forEach(d => {
    d.Work_Location = d.Work_Location.toLowerCase();
    d.Productivity_Change = d.Productivity_Change.toLowerCase();
  });

  const workLocations = ["hybrid", "remote", "onsite"];
  const categories = ["increase", "decrease", "no change"];

  const grouped = {};
  workLocations.forEach(loc => {
    grouped[loc] = { total: 0 };
    categories.forEach(cat => {
      grouped[loc][cat] = 0;
    });
  });

  data.forEach(d => {
    if (grouped[d.Work_Location]) {
      grouped[d.Work_Location].total++;
      if (grouped[d.Work_Location][d.Productivity_Change] !== undefined) {
        grouped[d.Work_Location][d.Productivity_Change]++;
      }
    }
  });

  const finalData = [];
  workLocations.forEach(loc => {
    categories.forEach(cat => {
      const total = grouped[loc].total;
      const value = total > 0 ? (grouped[loc][cat] / total) * 100 : 0;
      finalData.push({
        work_location: loc,
        category: cat,
        value: value
      });
    });
  });

  const margin = { top: 60, right: 20, bottom: 70, left: 60 },
        width = 900 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

  const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x0 = d3.scaleBand()
    .domain(workLocations)
    .range([0, width])
    .paddingInner(0.2);

  const x1 = d3.scaleBand()
    .domain(categories)
    .range([0, x0.bandwidth()])
    .padding(0.05);

  const y = d3.scaleLinear()
    .domain([0, 50])
    .nice()
    .range([height, 0]);

  const color = d3.scaleOrdinal()
    .domain(categories)
    .range(["#a55166", "#d38c9d", "#e2b4c1"]);

  // Tooltip
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("padding", "8px")
    .style("background", "#fff")
    .style("border", "1px solid #ccc")
    .style("border-radius", "4px")
    .style("pointer-events", "none");

  svg.append("g")
    .selectAll("g")
    .data(workLocations)
    .enter()
    .append("g")
    .attr("transform", d => `translate(${x0(d)},0)`)
    .selectAll("rect")
    .data(d => categories.map(cat => {
      const item = finalData.find(fd => fd.work_location === d && fd.category === cat);
      return { category: cat, value: item.value };
    }))
    .enter()
    .append("rect")
    .attr("x", d => x1(d.category))
    .attr("width", x1.bandwidth())
    .attr("y", y(0))
    .attr("height", 0)
    .attr("fill", d => color(d.category))
    .on("mouseover", function(event, d) {
      d3.select(this).attr("opacity", 0.7);
      tooltip.transition().duration(200).style("opacity", .9);
      tooltip.html(`<strong>${d.category.toUpperCase()}</strong><br/>${d.value.toFixed(1)}%`)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function() {
      d3.select(this).attr("opacity", 1);
      tooltip.transition().duration(500).style("opacity", 0);
    })
    .transition()
    .duration(800)
    .attr("y", d => y(d.value))
    .attr("height", d => height - y(d.value));

  svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x0));

  svg.append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(y).ticks(10).tickFormat(d => d + "%"));

  // Axis labels
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + 50)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Lokasi Kerja");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -40)
    .attr("x", -height / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Persentase Responden (%)");

  // Legend
  const legendWrapper = svg.append("g")
    .attr("transform", `translate(${width - 180}, -30)`);

  legendWrapper.append("rect")
    .attr("width", 160)
    .attr("height", categories.length * 25 + 10)
    .attr("fill", "#ffffff")        
    .attr("stroke", "#ccc")      
    .attr("stroke-width", 1)
    .attr("rx", 10)
    .attr("ry", 10);

  const legend = legendWrapper.selectAll(".legend-item")
    .data(categories)
    .enter()
    .append("g")
    .attr("class", "legend-item")
    .attr("transform", (d, i) => `translate(10, ${i * 25 + 10})`);

  legend.append("rect")
    .attr("width", 18)
    .attr("height", 18)
    .attr("fill", d => color(d));

  legend.append("text")
    .attr("x", 25)
    .attr("y", 14)
    .style("font-size", "13px")
    .text(d =>
      d === "increase" ? "Meningkat" :
      d === "decrease" ? "Menurun" :
      "Tidak Berubah");
});