const margin = { top: 40, right: 40, bottom: 60, left: 60 };
const width = 960 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

const svg = d3.select("#chart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

d3.csv("data/cleaned_data.csv").then(data => {
  data.forEach(d => {
    d.Number_of_Virtual_Meetings = +d.Number_of_Virtual_Meetings;
    d.Social_Isolation_Rating = +d.Social_Isolation_Rating;
  });

  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => d.Number_of_Virtual_Meetings))
    .nice()
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain(d3.extent(data, d => d.Social_Isolation_Rating))
    .nice()
    .range([height, 0]);

  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

  svg.append("g")
    .call(d3.axisLeft(y));

  svg.selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", d => x(d.Number_of_Virtual_Meetings))
    .attr("cy", d => y(d.Social_Isolation_Rating))
    .attr("r", 4)
    .on("mouseover", function(event, d) {
      tooltip.transition().duration(100).style("opacity", 1);
      tooltip.html(`Meetings: ${d.Number_of_Virtual_Meetings}<br>Isolation: ${d.Social_Isolation_Rating}`)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 20) + "px");
    })
    .on("mouseout", function() {
      tooltip.transition().duration(200).style("opacity", 0);
    });

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + 40)
    .attr("text-anchor", "middle")
    .text("Number of Virtual Meetings");

  svg.append("text")
    .attr("x", -height / 2)
    .attr("y", -40)
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .text("Social Isolation Rating");
});