var data = {
    getExtent: function(dataArray, key) {
        var min = 100000000,
            max = -1000000000;

        for ( var i=0; i < dataArray.length; i++ ) {
            if (key in dataArray[i]) {
                min = Math.min(min, dataArray[i][key]);
                max = Math.max(max, dataArray[i][key]);
            }
        }

        return [min, max];
    },
    getData: function(dataArray, key1, key2) {
        var pts = [];
        var current = [null, null];

        for ( var i=0; i < dataArray.length; i++ ) {
            if (key1 in dataArray[i])
                current[0] = dataArray[i][key1];
            if (key2 in dataArray[i])
                current[1] = dataArray[i][key2];

            if ( current[0] && current[1] ) {
                pts.push(current);
                current = [null, null];
            }
        }

        return pts;
    }
}

var polarChart = Backbone.View.extend({
    tagName: 'div',
    className: "polarChart",
    initialize: function(dataArray, r, a) {
        this.data = dataArray;
        this.r = r;
        this.a = a;

        this.config = {
            margin: {top: 0, right: 0, bottom: 0, left: 0}, // TODO : not configable?
            axisLabelsSomething: false
        };
    },
    render: function() {
        var view = this;

        var width = this.$el.width() - this.config.margin.left - this.config.margin.right,
            height = this.$el.height() - this.config.margin.top - this.config.margin.bottom,
            radius = Math.min(width, height) / 2 - 30;

        var domainExtent = data.getExtent(this.data, this.r);

        var r = d3.scale.linear()
            .domain(domainExtent)
            .range([0, radius]);

        //build axis
        var svg = d3.select(this.el).append("svg")
            .attr("width", width)
            .attr("height", height)
          .append("g")
            .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")rotate(-90)");

        this.renderAxes(svg, r, radius);

        var points = data.getData(this.data, this.r, this.a);

        svg.selectAll(".dot")
          .data(points)
        .enter().append("circle")
          .attr("class", "dot")
          .attr("r", 1.5)
          .attr("cx", function(d) { return r(d[0]) * Math.cos(rad(d[1])); })
          .attr("cy", function(d) { return r(d[0]) * Math.sin(rad(d[1])); })
    },
    renderAxes: function(svg, r, radius) {
        var gr = svg.append("g")
            .attr("class", "r axis")
          .selectAll("g")
            .data(r.ticks(5).slice(1))
          .enter().append("g");

        gr.append("circle")
            .attr("r", r);

        gr.append("text")
            .attr("y", function(d) { return -r(d) - 4; })
            .attr("transform", "rotate(105)")
            .style("text-anchor", "middle")
            .text(function(d) { return d; });

        var ga = svg.append("g")
            .attr("class", "a axis")
          .selectAll("g")
            .data(d3.range(0, 360, 30))
          .enter().append("g")
            .attr("transform", function(d) { return "rotate(" + d + ")"; });

        ga.append("line")
            .attr("x2", radius);

        var angleFormat = function(d) {
            return d + "°";
        }
        if (this.config.axisLabelsSomething) {
            angleFormat = function(d) {
                return  (d>180?-360+d:d)+ "°";
            }
        }

        ga.append("text")
            .attr("x", radius + 6)
            .attr("dy", ".35em")
            .style("text-anchor", function(d) { return d > 180 ? "end" : null; })
            .attr("transform", function(d) { return d > 180 ? "rotate(180 " + (radius + 6) + ",0)" : null; })
            .text(angleFormat);
    }

});
/*
function chart() {
  var width = 720, // default width
      height = 80; // default height

  function my() {
    // generate chart here, using `width` and `height`
  }



  my.width = function(value) {
    if (!arguments.length) return width;
    width = value;
    return my;
  };

  my.height = function(value) {
    if (!arguments.length) return height;
    height = value;
    return my;
  };

  return my;
}
*/
