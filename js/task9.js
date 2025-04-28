// Data hasil olahan
const data = [
    { Experience_Group: "0-2", Work_Location: "hybrid", Satisfaction: 1.99 },
    { Experience_Group: "0-2", Work_Location: "onsite", Satisfaction: 2.08 },
    { Experience_Group: "0-2", Work_Location: "remote", Satisfaction: 1.95 },
    { Experience_Group: "3-5", Work_Location: "hybrid", Satisfaction: 2.11 },
    { Experience_Group: "3-5", Work_Location: "onsite", Satisfaction: 2.03 },
    { Experience_Group: "3-5", Work_Location: "remote", Satisfaction: 1.95 },
    { Experience_Group: "6-10", Work_Location: "hybrid", Satisfaction: 1.91 },
    { Experience_Group: "6-10", Work_Location: "onsite", Satisfaction: 1.91 },
    { Experience_Group: "6-10", Work_Location: "remote", Satisfaction: 1.91 },
    { Experience_Group: "10+", Work_Location: "hybrid", Satisfaction: 2.02 },
    { Experience_Group: "10+", Work_Location: "onsite", Satisfaction: 2.05 },
    { Experience_Group: "10+", Work_Location: "remote", Satisfaction: 1.97 }
];

// Setting chart
const margin = { top: 40, right: 20, bottom: 70, left: 50 },
      width = 800 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Skala
const x0 = d3.scaleBand()
    .domain([...new Set(data.map(d => d.Experience_Group))])
    .range([0, width])
    .padding(0.2);

const x1 = d3.scaleBand()
    .domain(["remote", "onsite", "hybrid"])
    .range([0, x0.bandwidth()])
    .padding(0.05);

const y = d3.scaleLinear()
    .domain([0, 5])
    .range([height, 0]);

const color = d3.scaleOrdinal()
    .domain(["remote", "onsite", "hybrid"])
    .range(["#69b3a2", "#4C9AFF", "#FFA500"]);

// Axis
svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x0));

svg.append("g")
    .call(d3.axisLeft(y));

// Tooltip
const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip");

// Group data untuk batang
const groups = svg.selectAll("g.bar-group")
    .data(d3.group(data, d => d.Experience_Group))
    .join("g")
    .attr("transform", d => `translate(${x0(d[0])},0)`);

// Bars
groups.selectAll("rect")
    .data(d => d[1])
    .join("rect")
    .attr("x", d => x1(d.Work_Location))
    .attr("y", y(0)) // animasi: start dari bawah
    .attr("width", x1.bandwidth())
    .attr("height", 0)
    .attr("fill", d => color(d.Work_Location))
    .attr("class", "bar")
    .on("mouseover", (event, d) => {
        tooltip.transition()
            .duration(200)
            .style("opacity", 0.9);
        tooltip.html(
            `<strong>Experience:</strong> ${d.Experience_Group}<br/>
             <strong>Location:</strong> ${d.Work_Location}<br/>
             <strong>Satisfaction:</strong> ${d.Satisfaction.toFixed(2)}`
        )
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", () => {
        tooltip.transition()
            .duration(500)
            .style("opacity", 0);
    })
    .transition()
    .duration(800)
    .delay((d, i) => i * 100)
    .attr("y", d => y(d.Satisfaction))
    .attr("height", d => height - y(d.Satisfaction));

// Legend
const legend = svg.append("g")
    .attr("transform", `translate(${width - 100}, 0)`);

["remote", "onsite", "hybrid"].forEach((loc, i) => {
    const legendRow = legend.append("g")
        .attr("transform", `translate(0, ${i * 20})`);

    legendRow.append("rect")
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", color(loc));

    legendRow.append("text")
        .attr("x", -10)
        .attr("y", 12)
        .attr("text-anchor", "end")
        .text(loc)
        .style("font-size", "12px");
});