d3.csv("data/cleaned_data.csv").then(function(data) {
  const margin = {top: 40, right: 20, bottom: 50, left: 60},
        width = 800 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

  const xGroups = [20, 25, 30, 35, 40, 45, 50, 55, 60];
  const yGroups = [1, 2, 3, 4, 5];

  const xScale = d3.scaleBand().domain(xGroups).range([0, width]).padding(0.05);
  const yScale = d3.scaleBand().domain(yGroups).range([height, 0]).padding(0.05);

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

  const mainContainer = d3.select("#heatmap")
    .style("display", "flex")
    .style("flex-direction", "row")
    .style("align-items", "center")
    .style("gap", "40px");

  ["daily", "weekly"].forEach(activityType => {
    const container = mainContainer.append("div")
      .style("display", "flex")
      .style("flex-direction", "column")
      .style("align-items", "center")
      .style("margin-top", "10px");

    container.append("h3")
      .text(activityType.charAt(0).toUpperCase() + activityType.slice(1) + " Activity Heatmap")
      .style("margin-bottom", "10px");

    const svg = container.append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom + 80) // tambah space buat legend
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top - 20})`);

    const groupedData = {};
    data.forEach(d => {
      const hours = +d.Hours_Worked_Per_Week;
      const rating = +d.Work_Life_Balance_Rating;
      const activity = d.Physical_Activity.toLowerCase();

      if (activity === activityType && hours >= 20 && hours <= 60) {
        let bin = (hours === 60) ? 60 : Math.floor(hours / 5) * 5;
        const key = `${bin}_${rating}`;
        groupedData[key] = (groupedData[key] || 0) + 1;
      }
    });

    // Hitung skala warna berdasarkan jumlah responden
    const counts = Object.values(groupedData);
    const maxCount = d3.max(counts);

    const colorScales = {
      daily: d3.scaleLinear().domain([0, maxCount]).range(["#9CAF88", "#00573F"]), // sage → hijau botol
      weekly: d3.scaleLinear().domain([0, maxCount]).range(["#FFFDD0", "#5C4033"]) // cream → coklat tua
    };

    Object.keys(groupedData).forEach(key => {
      const [bin, rating] = key.split("_");
      const count = groupedData[key];
      const binNum = +bin;
      const binText = binNum === 60 ? "60" : `${binNum}-${binNum+4}`;

      svg.append("rect")
        .attr("x", xScale(binNum))
        .attr("y", yScale(+rating))
        .attr("width", xScale.bandwidth())
        .attr("height", yScale.bandwidth())
        .style("fill", colorScales[activityType](count))
        .style("stroke", "#fff")
        .on("mouseover", function(event) {
          tooltip
            .style("opacity", 1)
            .html(`<strong>Hours:</strong> ${binText}<br/>
                   <strong>WLB Rating:</strong> ${rating}<br/>
                   <strong>Activity:</strong> ${activityType}<br/>
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
        .attr("font-size", "13px")
        .attr("fill", "#fff")
        .style("font-weight", "bold")
        .text(count);
    });

    // Axis X
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat(d => d === 60 ? "60" : `${d}-${d+4}`));

    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("x", width / 2)
      .attr("y", height + 40)
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .text("Hours Worked per Week");

    // Axis Y
    svg.append("g").call(d3.axisLeft(yScale));
    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -45)
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .text("Work-Life Balance Rating");

    // Legend
    const legendWidth = 120;
    const legendHeight = 10;
    const legendX = (width - legendWidth) / 2;
    const legendY = height + 60;

    const legendScale = d3.scaleLinear()
      .domain([0, maxCount])
      .range([0, legendWidth]);

    const defs = svg.append("defs");
    const gradId = `grad-${activityType}`;

    const grad = defs.append("linearGradient")
      .attr("id", gradId)
      .attr("x1", "0%")
      .attr("x2", "100%")
      .attr("y1", "0%")
      .attr("y2", "0%");

    for (let i = 0; i <= 10; i++) {
      grad.append("stop")
        .attr("offset", `${i * 10}%`)
        .attr("stop-color", colorScales[activityType](i / 10 * maxCount));
    }

    svg.append("rect")
      .attr("x", legendX)
      .attr("y", legendY)
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", `url(#${gradId})`);

    svg.append("g")
      .attr("transform", `translate(${legendX}, ${legendY + legendHeight})`)
      .call(d3.axisBottom(legendScale).ticks(4).tickSize(5))
      .select(".domain").remove();

    svg.append("text")
      .attr("x", width / 2)
      .attr("y", legendY + legendHeight + 30)
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-style", "italic")
      .text("Jumlah Responden");
  });
});