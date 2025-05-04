// ===== js/task8.js =====
const margin = { top: 60, right: 140, bottom: 60, left: 60 },
      width  = 900 - margin.left - margin.right,
      height = 450 - margin.top  - margin.bottom;

// buat SVG container
const svg = d3.select("#chart")
  .append("svg")
    .attr("width",  width + margin.left + margin.right)
    .attr("height", height + margin.top  + margin.bottom)
  .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// kategori & level stres
const categories = ["poor","average","good"];
const levels     = [1,2,3];

// palet warna
const color = d3.scaleOrdinal()
  .domain(levels)
  .range(d3.schemeSet1);

// siapkan tooltip
const tooltip = d3.select(".tooltip");

d3.csv("data/cleaned_data.csv").then(data => {
  // hitung frekuensi per kategori & level
  const counts = d3.rollups(
    data,
    v => v.length,
    d => d.Sleep_Quality,
    d => +d.Stress_Level
  );
  const totalByCat = {};
  counts.forEach(([cat, arr]) => {
    totalByCat[cat] = d3.sum(arr, d => d[1]);
  });

  // susun data untuk tiap garis, sertakan pct + count
  const lineData = levels.map(level => ({
    level,
    values: categories.map(cat => {
      const arr = counts.find(d => d[0] === cat)[1];
      const cnt = (arr.find(x => x[0] === level) || [level,0])[1];
      return {
        category: cat,
        pct:   cnt / totalByCat[cat] * 100,
        count: cnt
      };
    })
  }));

  // skala X & Y
  const x = d3.scalePoint()
    .domain(categories)
    .range([0, width])
    .padding(0.5);

  const yMax = d3.max(lineData, ld => d3.max(ld.values, v => v.pct));
  const y = d3.scaleLinear()
    .domain([0, yMax + 10])
    .range([height, 0])
    .nice();

  // grid horizontal
  svg.append("g")
    .attr("class","grid")
    .call(d3.axisLeft(y)
      .ticks(6)
      .tickSize(-width)
      .tickFormat("")
    );

  // gambar sumbu X & Y
  svg.append("g")
    .attr("transform",`translate(0,${height})`)
    .call(d3.axisBottom(x).tickSizeOuter(0));

  svg.append("g")
    .call(d3.axisLeft(y).ticks(6).tickFormat(d=>d+"%"));

  // label axis
  svg.append("text")
    .attr("x", width/2).attr("y", height+margin.bottom-10)
    .attr("text-anchor","middle")
    .text("Kualitas Tidur");
  svg.append("text")
    .attr("transform","rotate(-90)")
    .attr("x",-height/2).attr("y",-margin.left+15)
    .attr("text-anchor","middle")
    .text("Persentase Responden (%)");

  // line generator smooth
  const line = d3.line()
    .curve(d3.curveMonotoneX)
    .x(d=>x(d.category))
    .y(d=>y(d.pct));

  // gambar garis, titik, dan tooltip
  lineData.forEach(ld => {
    // path
    svg.append("path")
      .datum(ld.values)
      .attr("fill","none")
      .attr("stroke",color(ld.level))
      .attr("stroke-width",3)
      .attr("d",line);

    // titik
    svg.selectAll(`.dot-level-${ld.level}`)
      .data(ld.values)
      .enter()
      .append("circle")
        .attr("class",`dot-level-${ld.level}`)
        .attr("cx",d=>x(d.category))
        .attr("cy",d=>y(d.pct))
        .attr("r",6)
        .attr("fill",color(ld.level))
        .attr("stroke","#fff")
        .attr("stroke-width",2)
      .on("mouseover", (event, d) => {
        tooltip
          .style("opacity",1)
          .html(
            `<strong>${d.category}</strong><br>` +
            `Jumlah Responden: ${d.count}<br>` +
            `${d.pct.toFixed(1)}%`
          )
          .style("left", (event.pageX + 10) + "px")
          .style("top",  (event.pageY - 30) + "px");
      })
      .on("mouseout", () => {
        tooltip.style("opacity",0);
      });
  });

  // legend
  const legend = svg.append("g")
    .attr("transform",`translate(${width+20},0)`);
  levels.forEach((lvl,i) => {
    const g = legend.append("g")
      .attr("transform",`translate(0,${i*25})`);
    g.append("rect")
      .attr("class","legend-color")
      .attr("fill",color(lvl));
    g.append("text")
      .attr("x",20).attr("y",12)
      .attr("class","legend")
      .text(`Stres Level ${lvl}`);
  });

}).catch(err => console.error(err));
