"use strict";

d3.tsv('./data/typemetrics.tsv', function (error, dataset) {

var axisData = d3.keys(dataset[0]).filter(function (d) { return d !== "FamilyName" && d !== "Spacing" && d !== "StyleName" && d !== "Grazie" && d !== "Bezier" && d !== "SimmetriaAggettiT" && d !== "AltezzaMassimaH" && d !== "PuntoMedioAstaOrizzontaleH" && d !== "PuntoMedioAstaVerticaleT" && d !== "AggettoSinistroT" && d !== "AggettoDestroT" && d !== "SimmetriaAggettiT"; }),

    sansData = dataset.filter(function (d) { return d.Grazie === 'Sans'; }),
    serifData = dataset.filter(function (d) { return d.Grazie === 'Serif'; }),
    width = 1000,
    height = 500,
    margin = 50,
    bins,
    SelX,
    xScale,
    yScale,

    svg = d3.select('#svg-histogram-container')
                .append('svg')
                .attr("viewBox", "0 0 " + width + " " + height)
                .attr("preserveAspectRatio", "xMaxYMin")
                .attr("meetOrSlice", "meet"),

    scatterClipPath = svg.append("clipPath")
                .attr("id", "histogram-area")
                .append("rect")
                .attr("x", margin)
                .attr("y", margin)
                .attr("width", width - (margin * 2))
                .attr("height", height - (margin * 2)),

    legend = d3.select('#svg-histogram-legend'),

    //Line generator for the histogram paths
    line = d3.svg.line()
            .interpolate("monotone")
            .x(function (d) { return xScale(d.x); })
            .y(function (d) { return yScale(d.y); });

    bins = 25;
    SelX = "xHeight";

    d3.select('#xAxisHistogram ul')
        .selectAll('li')
        .data(axisData)
        .enter()
        .append('li')
        .style({
            'cursor': 'pointer',
            'role': "menuitem",
            'tabindex': -1
        })
        .text(function (d) { return d; });

    //histogram function generator
    function histogramFunction (bins, SelX, fontType) {
        return d3.layout.histogram()
                .bins(bins)
                .value(function (d) { return d[SelX]; })
                (fontType);
    }

    function setXScale(SelX) {
        xScale = d3.scale.linear()
                    .domain(d3.extent(dataset, function (d) { return parseFloat(d[SelX], 10); })).nice()
                    .range([margin, width - margin]);
    }

    function updateAxis(axisName, axisScale, axisId) {
            axisName.scale(axisScale);
            svg.select('#' + axisId)
                .transition()
                .duration(1500)
                .call(axisName);
    }

    function getMaxValue(histogram) {
        return d3.max(histogram, function (d) { return d.y; });
    }

    //funziona
    function maxValueComparison(getMaxValueOne, getMaxValueTwo) {
        var values = [getMaxValueOne, getMaxValueTwo];
        return d3.max(values, function (d) {return d;});
    }
    //crea il valore max tra i due istogrammi
    

    function setYScale(maxValue) {
        yScale = d3.scale.linear()
                    .domain([0, (maxValue + 5)]).nice()
                    .range([height - margin, margin]);
    }

    histogramFunction(bins, SelX, sansData);
    histogramFunction(bins, SelX, serifData);
    setXScale(SelX);
    setYScale(maxValueComparison(getMaxValue(histogramFunction(bins, SelX, sansData)), getMaxValue(histogramFunction(bins, SelX, serifData))));

    var SansPath = svg.append("path")
                    .attr("clip-path", "url(#histogram-area)")
                    .attr("class", "sansElements")
                    .attr("id", "SansPath")
                    .style({
                        "fill": "none",
                        "stroke": "#32CD32",
                        "stroke-width": 1 + "px",
                        "visibility": "visible"
                    });
    var SerifPath = svg.append("path")
                    .attr("clip-path", "url(#histogram-area)")
                    .attr("class", "serifElements")
                    .attr("id", "SerifPath")
                    .style({
                        "fill": "none",
                        "stroke": "#DC143C",
                        "stroke-width": 1 + "px",
                        "visibility": "visible"
                    });
    svg.append('g')
        .attr('id', 'sansCircles' )
        .attr('class', 'sansElements')
        .attr("clip-path", "url(#histogram-area)");

    svg.append('g')
        .attr('id', 'serifCircles' )
        .attr('class', 'serifElements')
        .attr("clip-path", "url(#histogram-area)");

    function makeCircles (fontType, histogram, color) {
        var mainGroup = svg.select('#' + fontType + 'Circles' )

        svg.selectAll('.' + fontType + 'circleSubgroup').remove();

        mainGroup.append('g')
            .attr('id', fontType + 'FilledCircles')
            .selectAll('circle')
            .data(histogram)
            .enter()
            .append("g")
            .each(function (d) { d.forEach(function (e) { e.x = d.x; }); })
            .selectAll("circle")
            .data(function (d) { return d; })
            .enter()
            .append("circle")
            .attr({
                "class": fontType + 'circleSubgroup',
                "cx": function (d, i) { return xScale(d.x); },
                "cy": function (d, i) { return yScale(i+1); },
                "r": 2,
                "fill": color,
                "opacity": 0.25
            });
        mainGroup.append('g')
            .attr('id', fontType + 'PointCircles')
            .selectAll("circle")
            .data(histogram)
            .enter()
            .append("circle")
            .attr({
                'class': fontType + 'circleSubgroup',
                "cx": function (d) { return xScale(d.x); },
                "cy": function (d) { return yScale(d.y); },
                "r": 2,
                "stroke": color,
                "fill": "white"
            });

        mainGroup.selectAll("text")
                .data(histogram)
                .enter()
                .append("text")
                .text(function (d) { return d.y >= 1 ? d.y : null; })
                .attr({
                    'class': fontType + 'circleSubgroup',
                    "text-anchor": "middle",
                    "font-size": 10 + "px",
                    "fill": color,
                    "x": function (d) { return xScale(d.x); },
                    "y": function (d) { return yScale(d.y) - (5 * 1.5); },
                });
    }

    function pathUpdate (pathName, histogram) {
        pathName.transition()
            .duration(750)
            .attr("d", line(histogram));
    }
    makeCircles('sans', histogramFunction(bins, SelX, sansData), "#32CD32");
    pathUpdate(SansPath, histogramFunction(bins, SelX, sansData));
    makeCircles('serif', histogramFunction(bins, SelX, serifData), "#DC143C");
    pathUpdate(SerifPath, histogramFunction(bins, SelX, serifData));

    //X axis generator
    var xAxis = d3.svg.axis()
                    .scale(xScale)
                    .orient("bottom")
                    .ticks(20);
    svg.append("g")
        .attr("id", "xaxis")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + (height - margin) + ")")
        .call(xAxis);

    //Y axis generator
    var yAxis = d3.svg.axis()
                .scale(yScale)
                .tickSize(900)
                .orient("left");

    var gy = svg.append("g")
                .attr("id", "yaxis")
                .attr("class", "y axis")
                .attr("transform", "translate(" + (width - margin) + ", 0)")
                .call(yAxis);

    gy.selectAll("g")
        .filter(function (d) { return d; })
        .classed("minor", true);

    //service popover (empty)
    d3.select('#xAxisHistogram a').attr('data-content', imgDirectory('select'));

    $('#xAxisHistogram').on('click', '.dropdown-menu li', function () {
        SelX = $(this).text();
        $("#xAxisHistogramDropdown").html(SelX + ' <i class="fa fa-caret-down"></i>');
        $("#xAxisHistogramDropdown").val(SelX);
        var getInfo = $("#xAxisHistogramDropdown").val();
        d3.select('#xAxisHistogram a').attr('data-content', imgDirectory(getInfo));
        histogramFunction(bins, SelX, sansData);
        histogramFunction(bins, SelX, serifData);
        setXScale(SelX);
        setYScale(maxValueComparison(getMaxValue(histogramFunction(bins, SelX, sansData)), getMaxValue(histogramFunction(bins, SelX, serifData))));
        updateAxis(xAxis, xScale, 'xaxis');
        updateAxis(yAxis, yScale, 'yaxis');
        makeCircles('sans', histogramFunction(bins, SelX, sansData), "#32CD32");
        pathUpdate(SansPath, histogramFunction(bins, SelX, sansData));
        makeCircles('serif', histogramFunction(bins, SelX, serifData), "#DC143C");
        pathUpdate(SerifPath, histogramFunction(bins, SelX, serifData));
  	});

    d3.select('#histogramSlider').on('change', function() {
        bins = +($(this).val());
        histogramFunction(bins, SelX, sansData);
        histogramFunction(bins, SelX, serifData);
        setYScale(maxValueComparison(getMaxValue(histogramFunction(bins, SelX, sansData)), getMaxValue(histogramFunction(bins, SelX, serifData))));
        updateAxis(yAxis, yScale, 'yaxis');
        makeCircles('sans', histogramFunction(bins, SelX, sansData), "#32CD32");
        pathUpdate(SansPath, histogramFunction(bins, SelX, sansData));
        makeCircles('serif', histogramFunction(bins, SelX, serifData), "#DC143C");
        pathUpdate(SerifPath, histogramFunction(bins, SelX, serifData));
    })

    $('#SansLineCheckbox').on('change', function () {
        this.checked === true ? svg.selectAll('.sansElements').style('visibility', 'visible') : svg.selectAll('.sansElements').style('visibility', 'hidden');
    })

    $('#SerifLineCheckbox').on('click', function () {
        this.checked === true ? svg.selectAll('.serifElements').style('visibility', 'visible') : svg.selectAll('.serifElements').style('visibility', 'hidden');
    })

    function imgDirectory(getInfo) {
        var imageScale = d3.scale.ordinal()
            .domain(['select',"xHeight","CapHeight","Weight","Contrast","Lesser Thickness Slope","Superior Overshooting","Inferior Overshooting","Ascenders","Descenders","n Expansion","o Expansion","n/o Ratio","O Expansion","R Expansion","R/O Ratio","o Average Squaring","o Internal Squaring","o External Squaring"])	.range(['select.png','xHeight.png','capHeight.png','Weight.png','Contrast.png','LesThiSlo.png','OvershootingSup.png','OvershootingInf.png','Ascenders.png','Descenders.png','nExp.png','oExp.png','noRat.png','OCapsExp.png','RExp.png','RORat.png','oAvgSqu.png','oIntSqu.png','oExtSqu.png']);

        return '<img src="./img/typemetrics/' + imageScale(getInfo) + '">'
    }
});
