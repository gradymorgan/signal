var metrics = [{'metric':'gws_20', 'group':'wind'},
               {'metric':'twd', 'group':'twd'},
               {'metric':'gws', 'group':'wind'},  //metric - avg + 180 to center.  TODO:  how to configure?
               {'metric':'gwd', 'group':'twd'},
               {'metric':'performance', 'group':'percent'},
               {'metric':'sog', 'group':'speed'},
               {'metric':'speed', 'group':'speed'},
               {'metric':'targetSpeed', 'group':'speed'},
               {'metric':'hdg', 'group':'heading'},
               {'metric':'cog', 'group':'heading'},
               {'metric':'aawa', 'group':'angle', 'transform':function(val) { return Math.abs(val) }},
               {'metric':'atwa', 'group':'angle', 'transform':function(val) { return Math.abs(val) }},
               {'metric':'targetAngle', 'group':'angle'},
               {'metric':'trim', 'group':'heel'},
               {'metric':'heel', 'group':'heel'},
               {'metric':'targetHeel', 'group':'heel'},
               {'metric':'vmg', 'group':'speed'} ];

var configs = {
    'twd': {circular: true},
    'wind': {showX: true},
    'percent': {rangeY: [80, 120]},
    'angle': {invertY: true}

    // 'heading': {circular: true}
};

var graphs = [];

function initialize() {
    showCheckboxes();
    showMap();
    showGraphs();
}

function showCheckboxes() {
    var keys = ['tws',  'sog', 'speed', 'hdg'];
    // if (localStorage.race_metrics) {
    //     keys = JSON.parse(localStorage.race_metrics);
    // }

    _(metrics).each(function(metric) {
        $('<label><input type="checkbox" class="metric">'+metric.metric+'</label>')
            .appendTo('#checkboxes')
            .find('input')
                .prop('checked', _.contains(keys, metric.metric))
                .val(metric.metric)
    })

    $('#checkboxes').on('change', '.metric', function() {
        if (this.checked) {
            keys.push(this.value);
        }
        else {
            keys = _.without(keys, this.value);
        }

        localStorage.race_metrics = JSON.stringify(keys);
        showGraphs();
    })
}

function showMap() {
    //TODO: highlight nearest data point for all series
    //TODO: map to boat

    var map = window.map = new mapView({model: window.race, el: '#map_canvas'});
    map.render();
}

function showGraphs() {

    var keys = ['gws', 'gws:avg', 'gwd', 'speed', 'targetSpeed', 'atwa', 'targetAngle'];
    // if (localStorage.race_metrics) {
    //     keys = JSON.parse(localStorage.race_metrics);
    // }

    _.each(graphs, function(graph) {
        graph.remove();
    });
    graphs = [];

    graphs = _(metrics)
                .filter(function(m){ return _.contains(keys, m.metric)})
                .groupBy(function(m) { return m.group })
                .map( function(ms, name) {
                    var graph = new graphView({race: window.race, series: _.pluck(ms, 'metric'), id: name+'_graph'}, configs[name]);
                    $('#graphs').append(graph.el);
                    graph.render();
                    return graph;
                }).value();

    var graph = new polarChart(window.race.data, 'gws', 'gwd');
    $('#graphs').append(graph.el);
    graph.render();


    var graph = new polarChart(window.race.data, 'speed', 'twa');
    // graph.$el.addClass('big');
    graph.config.axisLabelsSomething = true;
    $('#graphs').append(graph.el);
    graph.render();
}



//default race to example
var race_id = window.location.search.substr(1) || '2014_nas_6';

var racesPromise = $.ajax('data/races.js', {
    dataType: 'json'
}).promise();

var raceDataPromise = $.ajax('data/races/'+race_id+'.js', {
    dataType: 'json'
}).promise();

//load data
function init() {
    Handlebars.registerHelper('fixed', function(value, precision) {
        if (!_.isNumber(value)) {
            return "NaN";
        }
        precision = _.isNumber(precision)? precision: 1;
        return value.toFixed(precision);
    });

//build dropdown of all races, to easily navigate between them
Promise.all([racesPromise, raceDataPromise]).then(function(results) {
    try {
        var races = results[0];
        window.g_races = races;

        var raceData = results[1];

        var race = window.race = _.find(races, function(r) {
            return r.id == race_id;
        });

        race.data = raceData;
        var start = moment(race.date+' '+race.startTime, "YYYYMMDD HH:mm");
        race.stttt = start;

        var ret = buildOutData( race.data, start.valueOf(), race.calibration?race.calibration.awa:null, race.calibration?race.calibration.aws:null );

        race.metadata = raceStats(race);

        setHeader(race, races);

        //debug wind data
        var windExtent = d3.extent(race.data, function(d) { return d['tws']; });
        var windMean = d3.mean(race.data, function(d) { return d['tws']; });
        var windMedian = d3.median(race.data, function(d) { return d['tws']; });

        console.info("windSpeed: min, max, median, mean", windExtent, windMedian, windMean);
        console.info("windDir: ");

        _.extend(window.race, ret);

        var BOARD_COLORS = {
            'D-P': '#F2E9E9',
            'D-S': '#E9F2E9',
            'U-S': '#F5FFF5',
            'U-P': '#FFF5F5',
            'PS': '#fcfcfc'
        };

        _.each(window.race.maneuvers, function(d) {
            d.color = BOARD_COLORS[d.board];

            var c = ['board'];

            if ( d.board.charAt(0) == 'D' )
                c.push('downwind');

            if (d.board.charAt(2) == 'P') c.push('port');
            if (d.board.charAt(2) == 'S') c.push('starboard');

            d.className = c.join(' ');
        });

        initialize();
    }
    catch (e) {
        setTimeout(function() { throw e}, 1);
    }
});

    function setHeader(race, allRaces) {
        var source   = $("#header").html();
        var template = Handlebars.compile(source);

        var templateValues = _.extend({}, race);
        templateValues.date = moment(race.date, 'YYYYMMDD');

        templateValues.races = _(allRaces)
                    .filter({"boat": "Project Mayhem"})
                    .sortBy('date')
                    .reverse()
                    .map(function(r) {
                        var date = moment(r.date, 'YYYYMMDD');
                        return {
                            'url': 'race.html?'+r.id,
                            'display': [date.format('YYYY'), r.regatta, 'Race', r.race].join(' '),
                            'class': (r.id==race.id?" selected":"")
                        }
                    })
                    .value();


        if ( race.links ) {
            templateValues.video = race.links.video;
        }

        $('header').html(template(templateValues));
    }

    app.on('select-tack', function(tack, label) {
        if ( !label) return;

        var details = $('#graphs').empty();

        console.info(tack); window.tack = tack;

        var view = new tackView({tack: tack});
        view.$el.appendTo(details);
        view.render();
    });
}
