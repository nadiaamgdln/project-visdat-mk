const margin = { top: 50, right: 30, bottom: 70, left: 60 },
      width = 960 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

const svg = d3.select("#chart").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("body").append("div")
  .attr("class", "tooltip");

d3.csv("data/cleaned_data.csv").then(data => {
  // Bin hours worked
  data.forEach(d => {
    d.Hours_Worked_Per_Week = +d.Hours_Worked_Per_Week;
    d.Work_Life_Balance_Rating = +d.Work_Life_Balance_Rating;

    if (d.Hours_Worked_Per_Week < 30) d.bin = "<30";
    else if (d.Hours_Worked_Per_Week <= 40) d.bin = "30-40";
    else if (d.Hours_Worked_Per_Week <= 50) d.bin = "40-50";
    else d.bin = ">50";
  });

  // Nest data
  const nested = Array.from(d3.group(data, d => d.bin, d => d.Physical_Activity),
    ([bin, groups]) => ({
      bin,
      activities: Array.from(groups, ([activity, values]) => ({
        activity,
        avg: d3.mean(values, d => d.Work_Life_Balance_Rating)
      }))
    })
  );

  const bins = nested.map(d => d.bin);
  const activities = Array.from(new Set(data.map(d => d.Physical_Activity)));

  const x0 = d3.scaleBand().domain(bins).range([0, width]).padding(0.2);
  const x1 = d3.scaleBand().domain(activities).range([0, x0.bandwidth()]).padding(0.05);
  const y = d3.scaleLinear().domain([0, 5]).nice().range([height, 0]);
  const color = d3.scaleOrdinal().domain(activities).range(["#FFB347", "#779ECB", "#77DD77"]);

  svg.append("g").call(d3.axisLeft(y));
  svg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x0));

  svg.selectAll("g.bar-group")
    .data(nested)
    .enter()
    .append("g")
    .attr("transform", d => `translate(${x0(d.bin)},0)`)
    .selectAll("rect")
    .data(d => d.activities.map(a => ({ bin: d.bin, ...a })))
    .enter()
    .append("rect")
    .attr("x", d => x1(d.activity))
    .attr("y", d => y(d.avg))
    .attr("width", x1.bandwidth())
    .attr("height", d => height - y(d.avg))
    .attr("fill", d => color(d.activity))
    .on("mouseover", function (event, d) {
      tooltip.transition().duration(200).style("opacity", .9);
      tooltip.html(
        `<strong>Jam Kerja:</strong> ${d.bin}<br/>
         <strong>Aktivitas:</strong> ${d.activity}<br/>
         <strong>Rata-rata WLB:</strong> ${d.avg.toFixed(2)}`
      )
      .style("left", (event.pageX + 15) + "px")
      .style("top", (event.pageY - 30) + "px");
      d3.select(this).attr("opacity", 0.7);
    })
    .on("mouseout", function () {
      tooltip.transition().duration(500).style("opacity", 0);
      d3.select(this).attr("opacity", 1);
    });

  // Label Y
  svg.append("text")
    .attr("x", -height / 2)
    .attr("y", -40)
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Rata-rata Work-Life Balance");

  // Label X
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + 50)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Jam Kerja per Minggu");
});
