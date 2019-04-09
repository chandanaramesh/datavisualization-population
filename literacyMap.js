(function() {
    d3.queue()
        .defer(d3.json, "data.json")
        .defer(d3.json, "ne_10m_admin_0_Kashmir_Occupied.json")
        .await(function(error, topoMain, topoKashmir) {
            var districts, disputed;
            if (error) throw error;

            // Features for districts and disputed areas
            districts   = topojson.feature(topoMain, topoMain.objects.data);
            disputed    = topojson.feature(topoKashmir, topoKashmir.objects.ne_10m_admin_0_Kashmir_Occupied);

            // Radio HTML
            d3.select("#select").call(selectFilter());
            var filter  = d3.select('#select input[name="gender"]:checked').node().value;

            // Color codes for districts based on Literacy Rates
            colorCode(districts.features, filter);
            colorDisputed(disputed.features);

            // Map render
            var map     = districtMap(districts, disputed).width(800).height(700).scale(1200).propTag(filter);
            d3.select("#map").call(map);

            // On change of selection re-render
            d3.selectAll("#select input[name=gender]").on("change", function() {
                filter  = d3.select('#select input[name="gender"]:checked').node().value;
                colorCode(districts.features, filter);
                map     = districtMap(districts, disputed).width(800).height(700).scale(1200).propTag(filter);
                d3.select("#map").call(map);
            });
        });
}());

function selectFilter() {
    function render(selection) {
      selection.each(function() {
        d3.select(this).html("<form>"+
                             "<input type='radio' name='gender' value='TotalMarried' checked> ALL<br>"+
                             "<input type='radio' name='gender' value='FemaleMarried'> FEMALE<br>"+
                             "<input type='radio' name='gender' value='MaleMarried'> MALE"+
                             "</form>");
      });
    } // render
return render;
} // selectFilter

function colorCode(data, filter) {
    var color = d3.scale.threshold()
                  .domain([0.4, 2.6, 4.8, 5, 7, 10, 12, 17, 40, 42, 45, 46, 46.5, 47, 47.5, 50, ,52, 52.5, 55, 57, 60])
                  .range(["#fff7fb", "#ece2f0", "#d0d1e6", "#a6bddb", "#67a9cf", "#3690c0", "#02818a", "#016450", "#edf8b1", "#c7e9b4", "#7fcdbb", "#41b6c4", "#1d91c0", "#225ea8", "#253494", "#081d58", "#1d91c0", "#225ea8", "#0c2c84", "#071a4f"]);
    data.forEach(function(d) {
        if (isNaN(d.properties[filter])) { d.properties[filter] = 77; }
        d.color       = color(d.properties[filter]);
    });
}

function colorDisputed(data) {
    var color         = "#eaeafa";
    data.forEach(function(d) {
        d.color       = color;
    });
}

//Bar Chart
var margin = {top: 100, right: 40, bottom: 30, left: 20},
    //width = 960 - margin.left - margin.right,
    width = 1300 - margin.left - margin.right,
    height = 700 - margin.top - margin.bottom,
    barWidth = Math.floor(width / 19) - 1;

var x = d3.scale.linear()
    .range([barWidth / 2, width - barWidth / 2]);

var y = d3.scale.linear()
    .range([height, 0]);

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("right")
    .tickSize(-width)
    .tickFormat(function(d) { return Math.round(d / 1e6) + "M"; });

// An SVG element with a bottom-right origin.
var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// A sliding container to hold the bars by birthyear.
var birthyears = svg.append("g")
    .attr("class", "birthyears");

// A label for the current year.
var title = svg.append("text")
    .attr("class", "title")
    .attr("dy", ".71em")
    .text("2011");

d3.csv("pop.csv", function(error, data) {
	
	

  // Convert strings to numbers.
  data.forEach(function(d) {
    d.people = +d.people;
    d.year = +d.year;
    d.age = +d.age;
  });

  // Compute the extent of the data set in age and years.
  var age1 = d3.max(data, function(d) { return d.age; }),
      year0 = d3.min(data, function(d) { return d.year; }),
      year1 = d3.max(data, function(d) { return d.year; }),
      year = year1;

  // Update the scale domains.
  x.domain([year1 - age1, year1]);
  y.domain([0, d3.max(data, function(d) { return d.people; })]);

  // Produce a map from year and birthyear to [male, female].
  data = d3.nest()
      .key(function(d) { return d.year; })
      .key(function(d) { return d.year - d.age; })
      .rollup(function(v) { return v.map(function(d) { return d.people; }); })
      .map(data);

  // Add an axis to show the population values.
  svg.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate(" + width + ",0)")
      .call(yAxis)
    .selectAll("g")
    .filter(function(value) { return !value; })
      .classed("zero", true);

  // Add labeled rects for each birthyear (so that no enter or exit is required).
  var birthyear = birthyears.selectAll(".birthyear")
      .data(d3.range(year0 - age1, year1 + 1, 5))
    .enter().append("g")
      .attr("class", "birthyear")
      .attr("transform", function(birthyear) { return "translate(" + x(birthyear) + ",0)"; });

  birthyear.selectAll("rect")
      .data(function(birthyear) { return data[year][birthyear] || [0, 0]; })
    .enter().append("rect")
      .attr("x", -barWidth / 2)
      .attr("width", barWidth)
      .attr("y", y)
      .attr("height", function(value) { return height - y(value); });

  // Add labels to show birthyear.
  //birthyear.append("text")
  //    .attr("y", height - 4)
  //    .text(function(birthyear) { return birthyear; });

  // Add labels to show age (separate; not animated).
  svg.selectAll(".age")
      .data(d3.range(0, age1 + 1, 5))
    .enter().append("text")
      .attr("class", "age")
      .attr("x", function(age) { return x(year - age); })
      .attr("y", height + 4)
      .attr("dy", ".71em")
      .text(function(age) { return age; });

  // Allow the arrow keys to change the displayed year.
  window.focus();
  d3.select(window).on("keydown", function() {
    switch (d3.event.keyCode) {
      case 37: year = Math.max(year0, year - 10); break;
      case 39: year = Math.min(year1, year + 10); break;
    }
    update();
  });

  function update() {
    if (!(year in data)) return;
    title.text(year);

    birthyears.transition()
        .duration(750)
        .attr("transform", "translate(" + (x(year1) - x(year)) + ",0)");

    birthyear.selectAll("rect")
        .data(function(birthyear) { return data[year][birthyear] || [0, 0]; })
      .transition()
        .duration(750)
        .attr("y", y)
        .attr("height", function(value) { return height - y(value); });
  }
});
