(function (window) {

  function choice(items) {
    return items[Math.floor(Math.random()*items.length)]
  }

  function splineCurve(previous, current, next, t) {
    // http://scaledinnovation.com/analytics/splines/aboutSplines.html

    var d01 = Math.sqrt(Math.pow(current.x - previous.x, 2) + Math.pow(current.y - previous.y, 2));
    var d12 = Math.sqrt(Math.pow(next.x - current.x, 2) + Math.pow(next.y - current.y, 2));

    var s01 = d01 / (d01 + d12);
    var s12 = d12 / (d01 + d12);

    // If all points are the same, s01 & s02 will be inf
    s01 = isNaN(s01) ? 0 : s01;
    s12 = isNaN(s12) ? 0 : s12;

    var fa = t * s01; // scaling factor for triangle Ta
    var fb = t * s12;

    return {
      previous: {
        x: current.x - fa * (next.x - previous.x),
        y: current.y - fa * (next.y - previous.y)
      },
      next: {
        x: current.x + fb * (next.x - previous.x),
        y: current.y + fb * (next.y - previous.y)
      }
    };
  };

  function kernelDensityEstimator(kernel, X) {
    return function(V) {
      return X.map(x => {
        const difs = Array.from(V,v => kernel(x - v));
        const mean = difs.reduce((a,b) => a+b) / difs.length;
        return {x, y:mean};
      });
    };
  };

  function kernelEpanechnikov(k) {
    return function(v) {
      return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
    };
  };

  function plotDensity(element, width, height, random, color, densityplier, left=false) {
    var svg = d3.select(element)
        .append('svg')
        .attr('class', 'densities')
        .attr("width", width)
        .attr("height", height)
        .append("g")

    var maxX = height - 100;
    var x = d3.scaleLinear()
        .domain([-20, 120]) // the -20 should be parameterized? Navbar?
        .range([0, height]);

    var kde = kernelDensityEstimator(kernelEpanechnikov(25), x.ticks(100))
    var data = Array(200).fill(1).map(x => random()).filter(x => x < 95 && x > 0)
    var density = kde(data)

    var widthRange = left ? [0, width] : [width, 0];

    var y = d3.scaleLinear()
        .domain([0, densityplier])
        .range(widthRange)


    svg.append("path")
      .attr("class", "mypath")
      .datum(density)
      .attr("fill", "transparent")
      .attr("stroke", color.stroke)
      .attr("stroke-width", 5)
      .attr("stroke-linejoin", "round")
      .attr("d",  d3.line()
            .curve(d3.curveBasis)
            .x(function(d) { return y(d.y); })
            .y(function(d) { return x(d.x); })
           )
      .attr("opacity", ".4")
  };

  function densityBorder(element, width, height, colors, num, densityplier) {
    for (var i = 0; i <= num; i++) {
      var mean = d3.randomUniform(0, 80)();
      var sd = d3.randomUniform(15, 25)();
      plotDensity(element, width, height, d3.randomNormal(mean,sd), colors[i%3], densityplier)
    }
  }


  function dataCloud(element, width, height, dots, colors) {
    var svg = d3.select(element)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")

    svg.selectAll('dot')
      .data(Array(dots).fill(1).map(d => ({x: d3.randomNormal(width/2, width/10)(), y: d3.randomNormal(height/2, height/10)(), color: choice(colors)})))
      .enter()
      .append('circle')
      .attr("fill", d => d.color.stroke)
      .attr("stroke", d => d.color.stroke)
      .attr("r", d3.randomUniform(2.5,2.5))
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr("opacity", ".8")
  };

  window.DSC = { dataCloud: dataCloud, densityBorder: densityBorder }

})(window)


window.addEventListener('load', (event) => {
  setTimeout(() => {

    var colors = [{fill: "rgb(177, 148, 40, .25)", stroke: "rgb(177, 148, 40, .75)"},
                  {fill: "rgb(0, 154, 166, .25)", stroke: "rgb(0, 154, 166, .75)"},
                  {fill: "rgb(174, 77, 41, .25)", stroke: "rgb(174, 77, 41, .75)"}]

    var num = width > 1000 ? 12 : 8;
    var densityplier = d3.scaleLinear().domain([360, 1800]).range([0.05, 0.15])
    var width = document.body.offsetWidth;
    var height = document.body.scrollHeight;

    DSC.densityBorder(document.getElementById("container"), width, height, colors, num, densityplier(width))

    Array
      .from(document.getElementsByTagName('h2'))
      .forEach(e => DSC.dataCloud(e, 800, 400, 85, colors))

  }, 0)
});
