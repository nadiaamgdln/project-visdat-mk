d3.csv("data/cleaned_data.csv").then(function(data) {
  const margin = {top: 40, right: 20, bottom: 50, left: 60},
        width = 700 - margin.left - margin.right,
        height = 450 - margin.top - margin.bottom;

  const container = d3.select("#heatmap")
    .append("div")
    .style("display", "flex")
    .style("flex-direction", "column")
    .style("align-items", "center")
    .style("margin-top", "10px");

  const svg = container.append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const tooltip = d3.select("body")
    .append("div")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background-color", "white")
    .style("border", "1px solid #ccc")
    .style("padding", "8px")
    .style("border-radius", "4px")
    .style("pointer-events", "none")
    .style("font-size", "12px");

  const groupedData = {};
  data.forEach(d => {
    const hours = +d.Hours_Worked_Per_Week;
    const rating = +d.Work_Life_Balance_Rating;
    const activity = d.Physical_Activity.toLowerCase();

    if (hours >= 20 && hours <= 60) {
      let bin;
      if (hours === 60) {
        bin = 60;
      } else {
        bin = Math.floor(hours / 5) * 5;
      }

      const key = `${bin}_${rating}_${activity}`;
      if (!groupedData[key]) groupedData[key] = 0;
      groupedData[key] += 1;
    }
  });

  const xGroups = [20, 25, 30, 35, 40, 45, 50, 55, 60];
  const yGroups = [1, 2, 3, 4, 5];

  const xScale = d3.scaleBand()
    .domain(xGroups)
    .range([0, width])
    .padding(0.05);

  const yScale = d3.scaleBand()
    .domain(yGroups)
    .range([height, 0])
    .padding(0.05);

  const colorScale = d3.scaleOrdinal()
    .domain(["daily", "weekly"])
    .range(["#4c1d3d", "#852e4e"]);

  // Draw cells
  Object.keys(groupedData).forEach(key => {
    const [bin, rating, activity] = key.split("_");
    const count = groupedData[key];
    const binNum = +bin;
    const binText = binNum === 60 ? "60" : `${binNum}-${binNum+4}`;

    svg.append("rect")
      .attr("x", xScale(binNum))
      .attr("y", yScale(+rating))
      .attr("width", xScale.bandwidth())
      .attr("height", yScale.bandwidth())
      .style("fill", colorScale(activity))
      .style("stroke", "#fff")
      .on("mouseover", function(event) {
        tooltip
          .style("opacity", 1)
          .html(`<strong>Hours:</strong> ${binText}<br/>
                 <strong>WLB Rating:</strong> ${rating}<br/>
                 <strong>Activity:</strong> ${activity}<br/>
                 <strong>Count:</strong> ${count}`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
        d3.select(this).style("stroke", "#333");
      })
      .on("mousemove", function(event) {
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function() {
        tooltip.style("opacity", 0);
        d3.select(this).style("stroke", "#fff");
      });

      svg.append("text")
      .attr("x", xScale(binNum) + xScale.bandwidth() / 2)
      .attr("y", yScale(+rating) + yScale.bandwidth() / 2)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("font-size", "13px") // ➔ Ukuran lebih besar
      .attr("fill", "#fff")       // ➔ Warna putih
      .style("font-weight", "bold") // ➔ Tebal biar makin kelihatan
      .text(count);
  });

  // X axis
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale).tickFormat(d => {
      if (d === 60) return "60";
      return `${d}-${d+4}`;
    }));

  svg.append("text")
    .attr("text-anchor", "middle")
    .attr("x", width / 2)
    .attr("y", height + 40)
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .text("Hours Worked per Week");

  // Y axis
  svg.append("g")
    .call(d3.axisLeft(yScale));

  svg.append("text")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -40)
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .text("Work-Life Balance Rating");

  const legend = container.append("div")
    .style("display", "flex")
    .style("justify-content", "center")
    .style("margin-top", "10px")
    .style("gap", "20px");
  
  legend.append("div")
    .style("display", "flex")
    .style("align-items", "center")
    .html(`<div style="width: 15px; height: 15px; background-color: #4c1d3d; margin-right: 5px;"></div>Daily Activity`);
  
  legend.append("div")
    .style("display", "flex")
    .style("align-items", "center")
    .html(`<div style="width: 15px; height: 15px; background-color: #852e4e; margin-right: 5px;"></div>Weekly Activity`);
});
