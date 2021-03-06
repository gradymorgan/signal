

var calibrateTackView = Backbone.View.extend({
tagName: 'div',
    className: "tackGraph",
    initialize: function(data, tack) {
        this.data = data;
        this.tack = tack;
    },
    render: function() {
        var view = this;
        
        var margin = {top: 15, right: 10, bottom: 5, left: 10};

        if ( this.showX ) {
            margin.top = 30;
        }

        var width = 200 - margin.left - margin.right,
            height = 200 - margin.top - margin.bottom;

        var zoom = false;

        
        var x = this.x = d3.scale.linear()
            .range([0, width])
            .domain(d3.extent( view.data, function(d) { return d.t } ) );

        var speedScale = d3.scale.linear()
            .range([height, 0])
            .domain([0, 30]);

        var windScale = d3.scale.linear()
            .range([height-5, 10])
            .domain([0, 90]);

        var hdgScale = d3.scale.linear()
            .range([height, 10])
            .domain([360,0]);
        
        
        //axis
        var ticks = [];
        for ( var i = -30; i < 65; i+=10 ) {
            ticks.push( moment(view.tack.timing.center).add(i, 'seconds') );
        }

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("top")
            .tickValues( ticks )
            .tickSize(3)
            .tickFormat(function(d) { return parseInt(moment(view.tack.timing.center).diff(d)/-1000); })


        var svg = this.svg = d3.select(this.el).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
          .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

        svg.append("g")
            .attr("class", "x axis")
            // .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        svg.append("g")         
            .attr("class", "grid")
            // .attr("transform", "translate(0," + margin.top + ")")
            .call( d3.svg.axis()
                .scale(x)
                .orient("top")
                .tickValues( ticks )
                .tickSize(-height, 0, 0)
                .tickFormat("")
            )



        function criticalPoint(point, scale, color, vertical) {
             var line = svg.append('line')
                .attr('class', 'timing center')
                .style('stroke', color);
                
            if ( vertical )
                line.attr({"x1": scale(point), "x2": scale(point), "y1": 0, "y2": height})
            else
                line.attr({"x1": 0, "x2": width, "y1": scale(point), "y2": scale(point)});

            return line;
        }

        function pathData(data, metric, scale) {
            var cleanData = _.compact(_.map( data, function(d) { if (metric in d) return [d.t, d[metric]] } ));

            var line = d3.svg.line()
                .interpolate("linear")
                .x(function(d) { return x(d[0]); })
                .y(function(d) { return scale(d[1]); });

            return line(cleanData);
        }

        function graph(metric, scale, color, width) {
            width = width || 1;

            return svg.append('path')
                .attr('class', 'tackLine')
                .attr('fill', 'none')
                .style('stroke', color)
                .style('stroke-width', width)
                .attr('d',  pathData(view.data, metric, scale));
        }

        //lines
        graph('aawa', windScale, 'red', 1);
        graph('gwd_20', hdgScale, 'blue', 1);
        graph('aws', speedScale, 'grey', 1);
        graph('gws_20', speedScale, 'black', 1);

        
        // var awd = line(view.data, 'awa', [height, height/3], function(scale) { scale.domain( [scale.domain()[1], scale.domain()[0]] ); });
        // var hd = line(view.data, 'hdgDelta');
        // var ta = line(view.data, 'targetAngle', null, null, wind[1]);
    }
});

var tackView = Backbone.View.extend({
    className: 'tack-view',
    template: "#tackscreen",
    regions: {
        map: ".tackMap",
        graph: ".tackGraph"
    },
    templateHelpers: function() {
        var a = _.extend({}, {
            duration: (this.tack.timing.end - this.tack.timing.start)/1000,
            recovery: (this.tack.timing.recovered - this.tack.timing.end)/1000,
            press: Math.abs(this.tack.maxTwa - this.tack.recoveryTwa),
            through: Math.min( (this.tack.recoveryHdg - this.tack.entryHdg + 360)%360, (this.tack.entryHdg - this.tack.recoveryHdg + 360)%360)
        }, this.tack);

        if ( _.isNull(a.loss) )
            a.loss = "NULL";
        else
            a.loss = a.loss.toFixed(1);

        return a;
    },

    initialize: function(options) {
        this.tack = options.tack;

        _.each(this.tack.timing, function(time, key) {
            options.tack.timing[key] = moment(options.tack.timing[key]);
        });

        this.model = new Backbone.Model({'type':'popover'});

        this.template = Handlebars.compile($("#tackscreen").html());
    },

    render: function() {
        var view = this;
        
        this.$el.html( this.template(this.templateHelpers()) );

        this.$('.summary').hide();
        this.$('h3').click( function() { view.$('.summary').toggle(); } );
        //map
        var refs = _.map([[this.tack.timing.start,this.tack.entryHdg], [this.tack.timing.end,this.tack.recoveryHdg]], function(p) {
            var time = p[0];
            var hdg = p[1];

            var pt = view.tack.track[_.sortedIndex(view.tack.track, {t: time}, function(d) { return d.t; })];
            return {
                lat: pt.lat,
                lon: pt.lon,
                hdg: hdg
            };
        });
        var track = new tackMap({model: {data:this.tack.track, up: this.tack.twd}, events: false, annotations: false, circles: moment(this.tack.time), references: refs}, this);
        this.$('.tackMap').append(track.el);
        track.render();

        var graph = new tackGraph(this.tack.data, this.tack, "wind", this);
        this.$('.tackGraphs').append(graph.el);
        graph.render(); 

        graph = new tackGraph(this.tack.data, this.tack, "speed", this);
        this.$('.tackGraphs').append(graph.el);
        graph.render();

    }
});

