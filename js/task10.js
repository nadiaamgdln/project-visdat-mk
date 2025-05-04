let data, barchart;

      // Load the data
      d3.csv("data/cleaned_data.csv")
        .then((_data) => {
          data = _data;

          // Convert string values to numbers
          data.forEach((d) => {
            d.Age = +d.Age;
            d.Social_Isolation_Rating = +d.Social_Isolation_Rating;
            d.Stress_Level = +d.Stress_Level;
            d.Work_Life_Balance_Rating = +d.Work_Life_Balance_Rating;
          });

          // Define age groups for X-axis
          const defineAgeGroup = (age) => {
            if (age < 30) return '20-29';
            else if (age < 40) return '30-39';
            else if (age < 50) return '40-49';
            else if (age < 60) return '50-59';
            else return '60+';
          };

          // Add age group to each data point
          data.forEach(d => {
            d.Age_Group = defineAgeGroup(d.Age);
          });

          // Initialize and update the visualization
          barchart = new StackedBarChart({ parentElement: "#barchart" }, data);
          barchart.updateVis();

          // Generate insights
          generateInsights(data);
        })
        .catch((error) => console.error("Error loading data:", error));

      /**
       * Generate insights from the data
       */
      function generateInsights(data) {
        // Group data by mental health condition
        const conditionGroups = d3.group(data, (d) => d.Mental_Health_Condition);

        // Calculate average age and isolation by condition
        let insights = "Berdasarkan visualisasi:<ul>";

        conditionGroups.forEach((group, condition) => {
          const avgAge = d3.mean(group, (d) => d.Age).toFixed(1);
          const avgIsolation = d3
            .mean(group, (d) => d.Social_Isolation_Rating)
            .toFixed(1);
          const count = group.length;
          const percentage = ((count / data.length) * 100).toFixed(1);

          insights += `<li><strong>${condition}</strong>: ${count} karyawan (${percentage}%) dengan rata-rata usia ${avgAge} tahun dan tingkat isolasi ${avgIsolation}</li>`;
        });

        // Add overall pattern
        const highIsolationGroup = data.filter((d) => d.Social_Isolation_Rating >= 4);
        const youngHighIsolation = highIsolationGroup.filter(
          (d) => d.Age < 35
        ).length;
        const oldHighIsolation = highIsolationGroup.filter((d) => d.Age >= 50).length;

        insights += `<li>Di antara karyawan dengan tingkat isolasi tinggi (rating ≥ 4), ${youngHighIsolation} berusia di bawah 35 tahun dan ${oldHighIsolation} berusia 50 tahun atau lebih</li>`;
        insights += "</ul>";

        document.getElementById("insights").innerHTML = insights;
      }

      // Listen to window resize event and update the chart
      let pageLoad = true;
      d3.select(window).on("resize", () => {
        if (pageLoad) {
          pageLoad = false;
        } else {
          barchart.updateVis();
        }
      });

      class StackedBarChart {
        /**
         * Class constructor with basic chart configuration
         * @param {Object}
         * @param {Array}
         */
        constructor(_config, _data) {
          this.config = {
            parentElement: _config.parentElement,
            containerHeight: 500,
            margin: { top: 25, right: 20, bottom: 80, left: 60 },
            tooltipPadding: 15,
            legendHeight: 30,
          };
          this.data = _data;
          this.initVis();
        }

        initVis() {
          let vis = this;

          // Get unique mental health conditions for color scale
          vis.conditions = [
            ...new Set(vis.data.map((d) => d.Mental_Health_Condition)),
          ];

          // Get unique age groups for X-axis
          vis.ageGroups = ['20-29', '30-39', '40-49', '50-59', '60+'];

          // Manually define the color scale to ensure "none" gets gray
          const colorRange = [
            "#5E4FA2",
            "#3288BD", 
            "#ABDDA4", 
            "#CCCCCC", 
          ];
          
          // Map conditions to appropriate colors
          const colorMap = {};
          vis.conditions.forEach((condition, i) => {
            if (condition.toLowerCase() === "none") {
              colorMap[condition] = "#888888"; 
            } else if (i < colorRange.length - 1) {
              colorMap[condition] = colorRange[i];
            } else {
              // If there are more conditions than colors, use the last color
              colorMap[condition] = colorRange[colorRange.length - 2];
            }
          });

          // Initialize scales with specific color for "none"
          vis.colorScale = d3
            .scaleOrdinal()
            .domain(vis.conditions)
            .range(vis.conditions.map(c => colorMap[c] || "#888888"));

          vis.xScale = d3.scaleBand();
          vis.yScale = d3.scaleLinear();

          // Initialize axes
          vis.xAxis = d3.axisBottom(vis.xScale).tickPadding(10);

          vis.yAxis = d3.axisLeft(vis.yScale).ticks(5).tickPadding(10);

          // Define size of SVG drawing area
          vis.svg = d3.select(vis.config.parentElement).append("svg");

          // Append group element that will contain our actual chart
          vis.chart = vis.svg
            .append("g")
            .attr(
              "transform",
              `translate(${vis.config.margin.left},${vis.config.margin.top})`
            );

          // Append empty x-axis group and move it to the bottom of the chart
          vis.xAxisG = vis.chart.append("g").attr("class", "axis x-axis");

          // Append y-axis group
          vis.yAxisG = vis.chart.append("g").attr("class", "axis y-axis");

          // Append axis titles
          vis.chart
            .append("text")
            .attr("class", "axis-title x-axis-title")
            .attr("text-anchor", "middle")
            .text("Kelompok Usia (tahun)")
            .attr("dy", "2em");

          vis.chart
            .append("text")
            .attr("class", "axis-title y-axis-title")
            .attr("text-anchor", "middle")
            .text("Jumlah Karyawan");

          // Create legend
          this.createLegend();
        }

        createLegend() {
          let vis = this;

          const legend = d3.select("#condition-legend");

          // Add legend items
          vis.conditions.forEach((condition) => {
            const legendItem = legend
              .append("li")
              .attr("class", "legend-btn")
              .attr("data-condition", condition);

            legendItem
              .append("span")
              .attr("class", "legend-symbol")
              .style("background", vis.colorScale(condition));

            legendItem.append("text").text(` ${condition}`);
          });

          // Add event listeners to legend items
          d3.selectAll(".legend-btn").on("click", function () {
            // Toggle 'inactive' class
            d3.select(this).classed("inactive", !d3.select(this).classed("inactive"));

            // Filter data and update vis
            vis.filterData();
          });
        }

        filterData() {
          let vis = this;

          // Get active conditions
          let selectedConditions = [];
          d3.selectAll(".legend-btn:not(.inactive)").each(function () {
            selectedConditions.push(d3.select(this).attr("data-condition"));
          });

          // Filter data
          if (selectedConditions.length > 0) {
            vis.filteredData = vis.data.filter((d) =>
              selectedConditions.includes(d.Mental_Health_Condition)
            );
          } else {
            vis.filteredData = vis.data;
          }

          vis.updateVis();
        }

        updateVis() {
          let vis = this;

          if (!vis.filteredData) {
            vis.filteredData = vis.data;
          }

          // Update dimensions based on the current screen size
          vis.config.containerWidth = document.querySelector(
            vis.config.parentElement
          ).clientWidth;

          // Calculate inner chart size
          vis.config.width =
            vis.config.containerWidth -
            vis.config.margin.left -
            vis.config.margin.right;
          vis.config.height =
            vis.config.containerHeight -
            vis.config.margin.top -
            vis.config.margin.bottom;

          // Update SVG dimensions
          vis.svg
            .attr("width", vis.config.containerWidth)
            .attr("height", vis.config.containerHeight);

          // Update axis positions
          vis.xAxisG.attr("transform", `translate(0,${vis.config.height})`);

          // Update axis titles
          vis.chart
            .select(".x-axis-title")
            .attr("y", vis.config.height + 40)
            .attr("x", vis.config.width / 2);

          vis.chart
            .select(".y-axis-title")
            .attr("transform", `translate(-40,${vis.config.height / 2}) rotate(-90)`);

          // Add grid lines
          vis.xAxis.tickSize(0);
          vis.yAxis.tickSize(-vis.config.width);

          // Prepare data for stacked bar chart
          vis.stackedData = this.prepareStackedData();

          // Update scale domains
          vis.xScale
            .range([0, vis.config.width])
            .domain(vis.ageGroups)
            .padding(0.2);

          // For grouped bar chart, adjust y-scale domain based on maximum count in any group
          vis.yScale
            .range([vis.config.height, 0])
            .domain([0, d3.max(vis.stackedData, d => {
              return d3.max(vis.conditions, condition => d[condition] || 0);
            }) + 1])
            .nice();

          vis.renderVis();
        }

        prepareStackedData() {
          let vis = this;
          
          // Create a data structure for stacked bar chart
          const stackedData = [];
          
          // Group data by age groups
          const ageGroupData = d3.group(vis.filteredData, d => d.Age_Group);
          
          // For each age group, count the number of people by mental health condition
          vis.ageGroups.forEach(ageGroup => {
            const ageData = {
              ageGroup: ageGroup
            };
            
            // Initialize all conditions with zero
            vis.conditions.forEach(condition => {
              ageData[condition] = 0;
            });
            
            // Count occurrences of each condition in this age group
            const groupData = ageGroupData.get(ageGroup) || [];
            groupData.forEach(d => {
              ageData[d.Mental_Health_Condition] = (ageData[d.Mental_Health_Condition] || 0) + 1;
            });
            
            stackedData.push(ageData);
          });
          
          return stackedData;
        }

        renderVis() {
          let vis = this;

          // Clear existing bars
          vis.chart.selectAll('.bar-group').remove();

          // Create a grouped bar chart instead of stacked
          const barGroups = vis.chart.selectAll('.bar-group')
            .data(vis.stackedData)
            .join('g')
            .attr('class', 'bar-group')
            .attr('transform', d => `translate(${vis.xScale(d.ageGroup)}, 0)`);

          // Calculate inner band scale for grouping
          const conditionScale = d3.scaleBand()
            .domain(vis.conditions)
            .range([0, vis.xScale.bandwidth()])
            .padding(0.1);

          // Create a bar for each condition in each age group
          vis.conditions.forEach(condition => {
            barGroups.append('rect')
              .attr('class', 'bar')
              .attr('x', d => conditionScale(condition))
              .attr('width', conditionScale.bandwidth())
              .attr('y', d => vis.yScale(d[condition] || 0))
              .attr('height', d => vis.config.height - vis.yScale(d[condition] || 0))
              .attr('fill', vis.colorScale(condition))
              .attr('opacity', 0.9)
              .attr('stroke', '#fff')
              .attr('stroke-width', 0.5)
              .attr('data-condition', condition)
              .on('mouseover', function(event, d) {
                // Show tooltip with information about this bar
                const condition = d3.select(this).attr('data-condition');
                const count = d[condition] || 0;
                
                d3.select('#tooltip')
                  .style('display', 'block')
                  .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')
                  .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
                  .html(`
                    <div class="tooltip-title my-10">Kelompok Usia: ${d.ageGroup}</div>
                    <ul>
                      <li>Kondisi Mental: ${condition}</li>
                      <li>Jumlah Karyawan: ${count}</li>
                    </ul>
                  `);
              })
              .on('mouseleave', () => {
                d3.select('#tooltip').style('display', 'none');
              });
          });

          // Update axes
          vis.xAxisG
            .call(vis.xAxis)
            .call(g => g.select('.domain').remove())
            .selectAll('text')
            .attr('transform', 'rotate(-45)')
            .style('text-anchor', 'end');

          vis.yAxisG
            .call(vis.yAxis)
            .call(g => g.select('.domain').remove());
        }
      }

      // Function to resize parent iframe if needed
      function resizeParent() {
        setTimeout(() => {
          const height = document.documentElement.scrollHeight;
          if (window.parent && window.parent.postMessage) {
            window.parent.postMessage({ type: "setHeight", height: height }, "*");
          }
        }, 100); 
      }
    
      window.addEventListener("load", resizeParent);
      window.addEventListener("resize", resizeParent);