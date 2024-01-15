const state = {
    data: [],
    passengerClass: "",
    selectedSex: null,
    selectedSurvived: null
  };
  
  function createHistogram(svgSelector) {
    const margin = {
      top: 40,
      bottom: 10,
      left: 120,
      right: 20
    };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
  
    const svg = d3
      .select(svgSelector)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);
  
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
  
    const xscale = d3.scaleLinear().range([0, width]);
    const yscale = d3.scaleLinear().range([0, height]);
  
    const xaxis = d3.axisTop().scale(xscale);
    const g_xaxis = g.append("g").attr("class", "x axis");
    const yaxis = d3.axisLeft().scale(yscale);
    const g_yaxis = g.append("g").attr("class", "y axis");
  
    function update(new_data) {
      xscale.domain([0, d3.max(new_data, (d) => d.length)]);
      yscale.domain([new_data[0].x0, new_data[new_data.length - 1].x1]);
  
      g_xaxis.transition().call(xaxis);
      g_yaxis.transition().call(yaxis);
  
      const rect = g
        .selectAll("rect")
        .data(new_data)
        .join(
          (enter) => {
            const rect_enter = enter
              .append("rect")
              .attr("x", 0)
              .attr("y", 0)
              .attr("width", 0)
              .attr("height", 0);
            rect_enter.append("title");
            return rect_enter;
          },
          (update) => update,
          (exit) => exit.remove()
        );
  
      rect
        .transition()
        .attr("height", (d) => yscale(d.x1) - yscale(d.x0) - 2)
        .attr("width", (d) => xscale(d.length))
        .attr("y", (d) => yscale(d.x0) + 1);
  
      rect.select("title").text((d) => `${d.x0}: ${d.length}`);
    }
  
    return update;
  }
  
  function createPieChart(svgSelector, stateAttr, colorScheme) {
    const margin = 10;
    const radius = 100;
  
    const svg = d3
      .select(svgSelector)
      .attr("width", radius * 2 + margin * 2)
      .attr("height", radius * 2 + margin * 2);
  
    const g = svg
      .append("g")
      .attr("transform", `translate(${radius + margin},${radius + margin})`);
  
    const pie = d3
      .pie()
      .value((d) => d.values.length)
      .sortValues(null)
      .sort(null);
    const arc = d3.arc().outerRadius(radius).innerRadius(0);
  
    const cscale = d3.scaleOrdinal(colorScheme);
  
    function update(new_data) {
      const pied = pie(new_data);
  
      cscale.domain(new_data.map((d) => d.key));
  
      const path = g
        .selectAll("path")
        .data(pied, (d) => d.data.key)
        .join(
          (enter) => {
            const path_enter = enter.append("path");
            path_enter.append("title");
            path_enter.on("click", (e, d) => {
              if (state.selected === d.data.key) {
                state.selectedContitnent = null;
              } else {
                state.selectedContinent = d.data.key;
              }
              updateApp();
            });
            return path_enter;
          }
        );
  
      path
        .classed("selected", (d) => d.data.key === state.selectedContinent)
        .attr("d", arc)
        .style("fill", (d) => cscale(d.data.key));
  
      path.select("title").text((d) => `${d.data.key}: ${d.data.values.length}`);
    }
  
    return update;
  }
  
  const ageHistogram = createHistogram("#age");
  const continentPieChart = createPieChart("#continent", "selectedContinent", d3.schemeSet3);
  
  function filterData() {
    return state.data.filter((d) => {
      if (state.passengerClass && d.pclass !== state.passengerClass) {
        return false;
      }
      if (state.selectedContinent && d.continent !== state.selectedContinent) {
        return false;
      }
      return true;
    });
  }
  
  function wrangleData(filtered) {
    const ageHistogram = d3
      .bin()
      .domain([0, 100])
      .thresholds(10)
      .value((d) => d.age);
  
    const ageHistogramData = ageHistogram(filtered);
  
    const continentPieData = ["Asia", "Europe","Africa","North America","South America","Oceania"].map((key) => ({
      key,
      values: filtered.filter((d) => d.continent === key)
    }));
  
    return {
      ageHistogramData,
      continentPieData
    };
  }
  
  function updateApp() {
    const filtered = filterData();
  
    const { ageHistogramData, continentPieData } = wrangleData(filtered);
    ageHistogram(ageHistogramData);
    continentPieChart(continentPieData);
  
    d3.select("#selectedContinent").text(state.selectedContinent || "None");
  }
  
  d3.csv(
    "Global_Education.csv"
  ).then((parsed) => {
    state.data = parsed.map((row) => {
      row.age = parseInt(row.age, 10);
      row.fare = parseFloat(row.fare);
      return row;
    });
  
    updateApp();
  });
  
  d3.select("#educational-level").on("change", function () {
    const selected = d3.select(this).property("value");
    state.passengerClass = selected;
    updateApp();
  });