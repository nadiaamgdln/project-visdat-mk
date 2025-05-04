d3.csv("data/cleaned_data.csv").then(data => {
    const svg = d3.select("svg"),
          margin = { top: 50, right: 30, bottom: 80, left: 60 },
          width = +svg.attr("width") - margin.left - margin.right,
          height = +svg.attr("height") - margin.top - margin.bottom;
  
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
  
    const experienceRanges = ["1-5", "6-10", "11-15", "16-20", "21-25", "26-30", "31-35"];
    const satisfactionLevels = [1, 2, 3];
    const workLocations = ["onsite", "hybrid", "remote"];
  
    const colorMap = {
      "onsite-1": "#b9efff",
      "onsite-2": "#59a0a7",
      "onsite-3": "#1b6572",
      "hybrid-1": "#f5dbff",
      "hybrid-2": "#af7fc7",
      "hybrid-3": "#72348a",
      "remote-1": "#ffd1d1",
      "remote-2": "#ff8a8a",
      "remote-3": "#f65454"
    };
  
    const tooltip = d3.select("body").append("div").attr("class", "tooltip");
  
    function getExperienceRange(years) {
      for (const range of experienceRanges) {
        const [min, max] = range.split("-").map(Number);
        if (years >= min && years <= max) return range;
      }
      return null;
    }
  
    const groupedData = {};
    data.forEach(d => {
      const exp = getExperienceRange(+d.Years_of_Experience);
      const location = d.Work_Location;
      const sat = +d.Satisfaction_with_Remote_Work;
  
      if (!exp || !workLocations.includes(location) || !satisfactionLevels.includes(sat)) return;
  
      const key = `${exp}-${location}`;
      groupedData[key] ??= { experience: exp, location: location };
      groupedData[key][`${location}-${sat}`] = (groupedData[key][`${location}-${sat}`] || 0) + 1;
    });
  
    const chartData = [];
    experienceRanges.forEach(exp => {
      workLocations.forEach(loc => {
        const base = groupedData[`${exp}-${loc}`] || {};
        const entry = { experience: exp, location: loc };
        satisfactionLevels.forEach(sat => {
          entry[`${loc}-${sat}`] = base[`${loc}-${sat}`] || 0;
        });
        chartData.push(entry);
      });
    });
  
    const keys = [];
    workLocations.forEach(loc => {
      satisfactionLevels.forEach(sat => keys.push(`${loc}-${sat}`));
    });
  
    const x0 = d3.scaleBand()
      .domain(experienceRanges)
      .range([0, width])
      .paddingInner(0.1);
  
    const x1 = d3.scaleBand()
      .domain(workLocations)
      .range([0, x0.bandwidth()])
      .padding(0.05);
  
    const y = d3.scaleLinear()
      .domain([0, 400])
      .range([height, 0]);
  
    g.append("g")
      .call(d3.axisLeft(y).tickValues(d3.range(0, 401, 50)));
  
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x0));
  
    svg.append("text")
      .attr("x", margin.left + width / 2)
      .attr("y", height + margin.top + 50)
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .text("Years of Experience");
  
    svg.append("text")
      .attr("transform", `rotate(-90)`)
      .attr("x", -margin.top - height / 2)
      .attr("y", 20)
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .text("Number of Respondents");
  
    const barGroups = g.selectAll(".group")
      .data(chartData)
      .join("g")
      .attr("transform", d => `translate(${x0(d.experience) + x1(d.location)},0)`);
  
    keys.forEach(key => {
      barGroups.append("rect")
        .filter(d => key.startsWith(d.location))
        .attr("y", function(d) {
          let acc = 0;
          for (let sat = 1; sat <= +key.split("-")[1]; sat++) {
            acc += d[`${d.location}-${sat}`] || 0;
          }
          return y(acc);
        })
        .attr("height", d => {
          const value = d[key] || 0;
          return y(0) - y(value);
        })
        .attr("width", x1.bandwidth())
        .attr("fill", colorMap[key])
        .on("mouseover", function(event, d) {
          const value = d[key] || 0;
          tooltip.transition().duration(200).style("opacity", 0.95);
          tooltip.html(`
            <strong>Experience:</strong> ${d.experience}<br/>
            <strong>Work Location:</strong> ${d.location}<br/>
            <strong>Satisfaction:</strong> Level ${key.split("-")[1]}<br/>
            <strong>Respondents:</strong> ${value}
          `)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => tooltip.transition().duration(300).style("opacity", 0));
    });
  
    const legendContainer = d3.select("#legend");
  
    workLocations.forEach(loc => {
      satisfactionLevels.forEach(level => {
        const key = `${loc}-${level}`;
        const label = `${loc.charAt(0).toUpperCase() + loc.slice(1)} - Level ${level}`;
  
        const cell = legendContainer.append("div")
          .attr("class", "legend-cell");
  
        cell.append("div")
          .style("background-color", colorMap[key]);
  
        cell.append("span").text(label);
      });
    });
  });