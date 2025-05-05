// ===== js/task8.js =====
const margin = { top: 60, right: 160, bottom: 60, left: 60 },
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

// palet warna: Level 1 (paling stres) merah, 2 oranye, 3 hijau
const color = d3.scaleOrdinal()
  .domain(levels)
  .range(["#d62728", "#ff7f0e", "#2ca02c"]);

// tooltip container
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
      return { category: cat, pct: cnt/totalByCat[cat]*100, count: cnt };
    })
  }));

  // ambil range pct untuk zoom-in
  const allPct = lineData.flatMap(ld => ld.values.map(v => v.pct));
  const yMin = d3.min(allPct), yMax = d3.max(allPct);

  // skala X & Y (zoomed)
  const x = d3.scalePoint()
    .domain(categories)
    .range([0, width])
    .padding(0.5);
  const y = d3.scaleLinear()
    .domain([Math.max(0, yMin - 5), yMax + 5])
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

  // gambar axis
  svg.append("g")
    .attr("transform",`translate(0,${height})`)
    .call(d3.axisBottom(x).tickSizeOuter(0));
  svg.append("g")
    .call(d3.axisLeft(y).ticks(6).tickFormat(d => d + "%"));

  // axis labels
  svg.append("text")
    .attr("x", width/2).attr("y", height + margin.bottom - 10)
    .attr("text-anchor","middle")
    .text("Kualitas Tidur");
  svg.append("text")
    .attr("transform","rotate(-90)")
    .attr("x",-height/2).attr("y",-margin.left+15)
    .attr("text-anchor","middle")
    .text("Persentase Responden (%)");

  // line generator
  const line = d3.line()
    .curve(d3.curveMonotoneX)
    .x(d => x(d.category))
    .y(d => y(d.pct));

  // gambar garis + titik + animasi + tooltip
  lineData.forEach(ld => {
    // Tambahkan path garis
    const path = svg.append("path")
      .datum(ld.values)
      .attr("fill","none")
      .attr("stroke",color(ld.level))
      .attr("stroke-width",3)
      .attr("d",line);

    // Hitung panjang path untuk animasi
    const totalLength = path.node().getTotalLength();

    // Inisialisasi dasharray & dashoffset
    path
      .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
      .attr("stroke-dashoffset", totalLength)
      // Transisi agar garis ter-draw-in
      .transition()
        .duration(1500)
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0);

    // Titik-titik data
    svg.selectAll(`.dot-${ld.level}`)
      .data(ld.values)
      .enter()
      .append("circle")
        .attr("class",`dot-${ld.level}`)
        .attr("cx",d => x(d.category))
        .attr("cy",d => y(d.pct))
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
          .style("top",  (event.pageY - 40) + "px");
      })
      .on("mouseout", () => {
        tooltip.style("opacity",0);
      });
  });

  // ===== Legend (indikator warna) =====
  const legend = svg.append("g")
    .attr("class","legend")
    .attr("transform", `translate(${width + 20}, 0)`);

  levels.forEach((lvl, i) => {
    const g = legend.append("g")
      .attr("transform", `translate(0, ${i * 25})`);
    g.append("rect")
      .attr("width", 14)
      .attr("height", 14)
      .attr("fill", color(lvl))
      .attr("stroke", "#666")
      .attr("stroke-width", 0.5);
    g.append("text")
      .attr("x", 20)
      .attr("y", 12)
      .text(`Stres Level ${lvl}`);
  });

}).catch(err => console.error(err));
