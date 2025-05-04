// ===== js/task8.js =====
const width  = 900;
const height = 500;
const radius = Math.min(width, height) / 2 - 40;

// buat SVG group di tengah
const svg = d3.select("#chart")
  .append("svg")
    .attr("width",  width)
    .attr("height", height)
  .append("g")
    .attr("transform", `translate(${width/2},${height/2})`);

// skema warna
const colorCat = d3.scaleOrdinal()
  .domain(["poor","average","good"])
  .range(["#6baed6","#31a354","#e6550d"]);
const colorLvl = d3.scaleOrdinal()
  .domain(["1","2","3"])
  .range(["#deebf7","#bae4b3","#fdae6b"]);

// tooltip
const tooltip = d3.select(".tooltip");

// muat data dan render nested donut
d3.csv("data/cleaned_data.csv").then(data => {
  // hitung total per kategori
  const cats = ["poor","average","good"];
  const lvls = ["1","2","3"];
  const catCounts = {};
  cats.forEach(cat => {
    catCounts[cat] = data.filter(d => d.Sleep_Quality === cat).length;
  });

  // susun array nested: tiap kombinasi category×level
  const nested = cats.flatMap(cat => {
    const arr = data.filter(d => d.Sleep_Quality === cat);
    return lvls.map(lvl => ({
      category: cat,
      level:     lvl,
      count:     arr.filter(d => d.Stress_Level === lvl).length
    }));
  });

  // data untuk inner ring (kategori saja)
  const innerData = cats.map(cat => ({
    category: cat,
    count:    catCounts[cat]
  }));

  // pie generator tanpa sorting
  const pie = d3.pie()
    .value(d => d.count)
    .sort(null);

  // arc untuk inner & outer
  const arcInner = d3.arc()
    .innerRadius(radius * 0.4)
    .outerRadius(radius * 0.7);
  const arcOuter = d3.arc()
    .innerRadius(radius * 0.72)
    .outerRadius(radius * 0.95);

  // gambar inner donut (kategori)
  svg.append("g")
    .selectAll("path")
    .data(pie(innerData))
    .enter().append("path")
      .attr("d", arcInner)
      .attr("fill", d => colorCat(d.data.category))
      .on("mouseover", (e,d) => {
        tooltip
          .style("opacity",1)
          .html(`
            <strong>Kategori Tidur: ${d.data.category}</strong>
            <br>Jumlah Responden: ${d.data.count}
            <br>Proporsi: ${(d.data.count/data.length*100).toFixed(1)}%
          `)
          .style("left", (e.pageX+10)+"px")
          .style("top",  (e.pageY-30)+"px");
      })
      .on("mouseout", () => tooltip.style("opacity",0));

  // gambar outer donut (stres level dalam tiap kategori)
  svg.append("g")
    .selectAll("path")
    .data(pie(nested))
    .enter().append("path")
      .attr("d", arcOuter)
      .attr("fill", d => colorLvl(d.data.level))
      .on("mouseover", (e,d) => {
        tooltip
          .style("opacity",1)
          .html(`
            <strong>Stres Level: ${d.data.level}</strong>
            <br>Kategori Tidur: ${d.data.category}
            <br>Jumlah Responden: ${d.data.count}
            <br>Proporsi: ${(d.data.count/catCounts[d.data.category]*100).toFixed(1)}%
          `)
          .style("left", (e.pageX+10)+"px")
          .style("top",  (e.pageY-30)+"px");
      })
      .on("mouseout", () => tooltip.style("opacity",0));

  // legend di kanan
  const legend = svg.append("g")
    .attr("transform", `translate(${radius+20}, -${radius})`);

  // legend kategori
  cats.forEach((cat,i) => {
    const g = legend.append("g")
      .attr("transform", `translate(0, ${i*20})`);
    g.append("rect")
      .attr("width", 14).attr("height", 14)
      .attr("fill", colorCat(cat));
    g.append("text")
      .attr("x", 18).attr("y", 12)
      .text(`Tidur: ${cat}`)
      .style("font-size","12px");
  });

  // legend stres level
  lvls.forEach((lvl,i) => {
    const g = legend.append("g")
      .attr("transform", `translate(0, ${cats.length*20 + i*20 + 10})`);
    g.append("rect")
      .attr("width", 14).attr("height", 14)
      .attr("fill", colorLvl(lvl));
    g.append("text")
      .attr("x", 18).attr("y", 12)
      .text(`Stres Level ${lvl}`)
      .style("font-size","12px");
  });
})
.catch(err => console.error("Error loading data:", err));
