"use strict";

d3.tsv('./data/typemetrics.tsv', function (error, dataset) {

var axisData = d3.keys(dataset[0]).filter(function (d) { return d !== "FamilyName" && d !== "Spacing" && d !== "StyleName" && d !== "Grazie" && d !== "Bezier" && d !== "SimmetriaAggettiT" && d !== "AltezzaMassimaH" && d !== "PuntoMedioAstaOrizzontaleH" && d !== "PuntoMedioAstaVerticaleT" && d !== "AggettoSinistroT" && d !== "AggettoDestroT" && d !== "SimmetriaAggettiT"; }),

    sansData = dataset.filter(function (d) { return d.Grazie === 'Sans'; }),
    serifData = dataset.filter(function (d) { return d.Grazie === 'Serif'; }),
    tempData,
    width = 855,
    height = 860,
    margin = 50,
    SelX = 'xHeight',
    SelY = 'xHeight',
    SelCol = 'xHeight',
    SelFont,
    SelWeight,
    sansColScale,
    serifColScale,
    xScale,
    yScale,
    xAxis,
    yAxis,
    p0,
    p1,
    fontFamilies = _.sortBy(_.uniq(dataset, 'FamilyName'), 'FamilyName'),
    fontFamiliesGrouped = _.groupBy(dataset, 'FamilyName'),
    imageLink,

    svg = d3.select('#svg-scatterplot-container')
                .append('svg')
                .attr("viewBox", "0 0 " + width + " " + height)
                .attr("preserveAspectRatio", "xMaxYMin")
                .attr("meetOrSlice", "meet"),

    scatterClipPath = svg.append("clipPath")
                .attr("id", "scatterplot-area")
                .append("rect")
                .attr("x", margin)
                .attr("y", margin)
                .attr("width", width - (margin * 2))
                .attr("height", height - (margin * 2)),

    legend = d3.select('#svg-scatterplot-legend');

    legend.select('#fontFamily ul')
        .append('li')
        .style({
            'cursor': 'pointer',
            'role': "menuitem",
            'tabindex': -1
        })
        .text('---');

    legend.select('#fontWeight ul')
            .append('li')
            .style({
                'cursor': 'pointer',
                'role': "menuitem",
                'tabindex': -1
            })
            .text('---');

    legend.select('#fontFamily ul')
        .selectAll('li .availableFontFamily')
        .filter(function () { return this.class !== ".deselect"; })
        .data(fontFamilies)
        .enter()
        .append('li')
        .attr('class', 'availableFontFamily')
        .style({
            'cursor': 'pointer',
            'role': "menuitem",
            'tabindex': -1
        })
        .text(function (d) { return d.FamilyName; });

    d3.select('#xAxisScatterplot ul')
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

    d3.select('#yAxisScatterplot ul')
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

    d3.select('#circleColor ul')
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

    setXScale(SelX);
    setYScale(SelY);
    setColScale(SelCol);

    var linRegTot = svg.append("line")
                        .attr('id', 'linRegTot')
                        .style("stroke", "#353531"),

        linRegSans = svg.append("line")
                        .attr('id', 'linRegSans')
                        .style("stroke", "#32CD32"),

        linRegSerif = svg.append("line")
                        .attr('id', 'linRegSerif')
                        .style("stroke", "#DC143C"),

        tempLine = svg.append('line')
                        .attr('id', 'tempLine');

    function lineGenerator(SelX, SelY, inputData, lineName, duration) {
        var data = inputData.map(function (d) { return [(+d[SelX]), +d[SelY]]; }),
            linReg = regression('linear', data).points.sort(function (a, b) {return d3.ascending(a[0], b[0]); }),

            interpolator = d3.scale.linear(),
            FirstIndex = 0,
            LastIndex = (parseInt(linReg.length, 10) - 1);

        function pointAtX(a, b, x) {
            interpolator.domain([a[0], b[0]]).range([a[1], b[1]]);
            return [x, interpolator(x)];
        }

        p0 = pointAtX(linReg[FirstIndex], linReg[LastIndex], d3.min(xScale.domain()));
        p1 = pointAtX(linReg[FirstIndex], linReg[LastIndex], d3.max(xScale.domain()));

        lineName.transition()
            .duration(duration)
            .attr("x1", function () { return xScale(p0[0]); })
            .attr("y1", function () { return yScale(p0[1]); })
            .attr("x2", function () { return xScale(p1[0]); })
            .attr("y2", function () { return yScale(p1[1]); })
            .attr("clip-path", "url(#scatterplot-area)")
            .style({
                'opacity': 0.5,
                'stroke-width': 1,
                'stroke-dasharray': ("3, 3")
            });
    }

    lineGenerator(SelX, SelY, dataset, linRegTot, 1500);
    lineGenerator(SelX, SelY, sansData, linRegSans, 1500);
    lineGenerator(SelX, SelY, serifData, linRegSerif, 1500);

    var circles = svg.append("g")
                    .attr("id", "circles")
                    .attr("clip-path", "url(#scatterplot-area)")
                    .selectAll("circle")
                    .data(dataset)
                    .enter()
                    .append("circle")
                    .attr({
                        'class': function (d) { return (d.FamilyName).replace(/\s/g, "-"); },
                        'id': function (d) { return (d.FamilyName).replace(/\s/g, "-") + '_' + (d.StyleName).replace(/\s/g, "-"); }
                    })
                    .on('mouseover', function (d) {
                        svg.selectAll('circle')
                            .attr('opacity', 0.25);

                        d3.select(this)
                            .transition()
                            .duration(500)
                            .attr({
                                'r': 10,
                                'opacity': 1
                            })

                        //Get this circle's x/y values, then augment for the tooltip
                        var xPosition = (d3.select(this).attr("cx"));
                        var yPosition = parseFloat(d3.select(this).attr("cy"));

                        svg.append("text")
                            .attr({
                                "class": "circleTooltip",
                                "x": xPosition,
                                "y": yPosition - (height/15),
                                'pointer-events': 'none',
                                "text-anchor": (xPosition < (width/2)) ? "start" : "end"
                            })
                            .text("Family: " + d.FamilyName + ";" + "Style: " + d.StyleName + ";" + SelX + ": " + d[SelX] + ", " + SelY + ": " + d[SelY])
                            .call(wrap, 50, xPosition);
                    })
                    .on('mouseout', function (d) {
                        svg.selectAll('.circleTooltip').remove();
                        deselectCircles()
                        selectCircles(SelFont, 0)
                        selectSingleCircle(SelWeight, 0)

                    });

    updateCircles();
    deselectCircles();

    //X Axis creation
    xAxis = d3.svg.axis()
                .scale(xScale)
                .ticks(20)
                .orient("bottom");

    //Y Axis creation
    yAxis = d3.svg.axis()
                .scale(yScale)
                .ticks(20)
                .orient("left");

    //X Axis generator
    svg.append("g")
        .attr("class", "axis")
        .attr("id", "xaxis")
        .attr("transform", "translate(0," + (height - margin) + ")")
        .call(xAxis);

    //Y Axis generator
    svg.append("g")
        .attr("class", "axis")
        .attr("id", "yaxis")
        .attr("transform", "translate(" + margin + ", 0)")
        .call(yAxis);

    //Interaction with the dropdowns
    $('#fontFamily').on('click', '.dropdown-menu li', function () {
        SelFont = $(this).text();
        $("#fontFamilyDropdown").html(SelFont + ' <i class="fa fa-caret-down"></i>');
        $("#fontFamilyDropdown").val(SelFont);
        deselectCircles();
        if (SelFont !== '---') {
            selectCircles(SelFont, 500);
            setFontWeightDropdown(SelFont);
            tempData = dataset.filter(function (d) { return d['FamilyName'] == SelFont; })
            lineGenerator(SelX, SelY, tempData, tempLine, 0);
        }
        else if (SelFont === '---') {
            $("#fontWeightDropdown").html('--- <i class="fa fa-caret-down"></i>');
            $("#fontWeightDropdown").val('---');
            deselectCircles();
            setFontWeightDropdown(SelFont);
            tempData = [0,0];
            lineGenerator(SelX, SelY, tempData, tempLine, 0);
        }
      });

    $('#fontWeight').on('click', '.dropdown-menu li', function () {
        SelWeight = $(this).text();
        $("#fontWeightDropdown").html(SelWeight + ' <i class="fa fa-caret-down"></i>');
        $("#fontWeightDropdown").val(SelWeight);
        if (SelWeight !== '---') {
            selectCircles(SelFont, 500);
            selectSingleCircle(SelWeight, 500);
        }
        else { selectCircles(SelFont); }
      });

    //service popover (empty)
    d3.select('#xAxisScatterplot a').attr('data-content', imgDirectory('select'));
    d3.select('#yAxisScatterplot a').attr('data-content', imgDirectory('select'));
    d3.select('#circleColor a').attr('data-content', imgDirectory('select'));

    $('#xAxisScatterplot').on('click', '.dropdown-menu li', function () {
        SelX = $(this).text();
        $("#xAxisScatterplotDropdown").html(SelX + ' <i class="fa fa-caret-down"></i>');
        $("#xAxisScatterplotDropdown").val(SelX);
        var getInfo = $("#xAxisScatterplotDropdown").val();
        d3.select('#xAxisScatterplot a').attr('data-content', imgDirectory(getInfo));
        setXScale(SelX);
        updateCircles();
        updateAxis(xAxis, xScale, 'xaxis');
        lineGenerator(SelX, SelY, dataset, linRegTot, 1500);
        lineGenerator(SelX, SelY, sansData, linRegSans, 1500);
        lineGenerator(SelX, SelY, serifData, linRegSerif, 1500);
        lineGenerator(SelX, SelY, tempData, tempLine, 1500);
      });

    $('#yAxisScatterplot').on('click', '.dropdown-menu li', function () {
        SelY = $(this).text();
        $("#yAxisScatterplotDropdown").html(SelY + ' <i class="fa fa-caret-down"></i>');
        $("#yAxisScatterplotDropdown").val(SelY);
        var getInfo = $("#yAxisScatterplotDropdown").val()
        d3.select('#yAxisScatterplot a').attr('data-content', imgDirectory(getInfo));
        setYScale(SelY);
        updateCircles();
        updateAxis(yAxis, yScale, 'yaxis');
        lineGenerator(SelX, SelY, dataset, linRegTot, 1500);
        lineGenerator(SelX, SelY, sansData, linRegSans, 1500);
        lineGenerator(SelX, SelY, serifData, linRegSerif, 1500);
        lineGenerator(SelX, SelY, tempData, tempLine, 1500);
      });

    $('#circleColor').on('click', '.dropdown-menu li', function () {
        SelCol = $(this).text();
        $("#circleColorDropdown").html(SelCol + ' <i class="fa fa-caret-down"></i>');
        $("#circleColorDropdown").val(SelCol);
        var getInfo = $("#circleColorDropdown").val();
        d3.select('#circleColor a').attr('data-content', imgDirectory(getInfo));
        setColScale(SelCol);
        updateCircles();
        $('#SelColLegend').text(SelCol);
      });

    var sansCircles = circles.filter(function (d) {return d.Grazie === "Sans"; }),
        serifCircles = circles.filter(function (d) {return d.Grazie === "Serif"; }),

        monoSans = monoFont(sansCircles),
        monoSerif = monoFont(serifCircles),
        regularSans = regularFont(sansCircles),
        regularSerif = regularFont(serifCircles),
        lightSans = lightFont(sansCircles),
        lightSerif = lightFont(serifCircles),
        boldSans = boldFont(sansCircles),
        boldSerif = boldFont(serifCircles),
        ultraSans = ultraFont(sansCircles),
        ultraSerif = ultraFont(serifCircles);

    d3.select('#SansMonoCheckbox').on('change', function () {
        (this.checked === true) ?  monoSans.style("visibility", "visible") : monoSans.style("visibility", "hidden")}
    );
    d3.select('#SerifMonoCheckbox').on('change', function () {
        (this.checked === true) ?  monoSerif.style("visibility", "visible") : monoSerif.style("visibility", "hidden")}
    );

    d3.select('#SansLightCheckbox').on('change', function () {
        (this.checked === true) ?  lightSans.style("visibility", "visible") : lightSans.style("visibility", "hidden")}
    );
    d3.select('#SerifLightCheckbox').on('change', function () {
        (this.checked === true) ?  lightSerif.style("visibility", "visible") : lightSerif.style("visibility", "hidden")}
    );

    d3.select('#SansRegularCheckbox').on('change', function () {
        (this.checked === true) ?  regularSans.style("visibility", "visible") : regularSans.style("visibility", "hidden")}
    );
    d3.select('#SerifRegularCheckbox').on('change', function () {
        (this.checked === true) ?  regularSerif.style("visibility", "visible") : regularSerif.style("visibility", "hidden")}
    );

    d3.select('#SansBoldCheckbox').on('change', function () {
        (this.checked === true) ?  boldSans.style("visibility", "visible") : boldSans.style("visibility", "hidden")}
    );
    d3.select('#SerifBoldCheckbox').on('change', function () {
        (this.checked === true) ?  boldSerif.style("visibility", "visible") : boldSerif.style("visibility", "hidden")}
    );

    d3.select('#SansUltraCheckbox').on('change', function () {
        (this.checked === true) ?  ultraSans.style("visibility", "visible") : ultraSans.style("visibility", "hidden")}
    );
    d3.select('#SerifUltraCheckbox').on('change', function () {
        (this.checked === true) ?  ultraSerif.style("visibility", "visible") : ultraSerif.style("visibility", "hidden")}
    );

    function imgDirectory(getInfo) {
        var imageScale = d3.scale.ordinal()
            .domain(['select',"xHeight","CapHeight","Weight","Contrast","Lesser Thickness Slope","Superior Overshooting","Inferior Overshooting","Ascenders","Descenders","n Expansion","o Expansion","n/o Ratio","O Expansion","R Expansion","R/O Ratio","o Average Squaring","o Internal Squaring","o External Squaring"])
            .range(['select.png','xHeight.png','capHeight.png','Weight.png','Contrast.png','LesThiSlo.png','OvershootingSup.png','OvershootingInf.png','Ascenders.png','Descenders.png','nExp.png','oExp.png','noRat.png','OCapsExp.png','RExp.png','RORat.png','oAvgSqu.png','oIntSqu.png','oExtSqu.png']);

        return '<img src="./img/typemetrics/' + imageScale(getInfo) + '">'
    }

    function setXScale(SelX) {
        xScale = d3.scale.linear()
                    .domain(d3.extent(dataset, function (d) { return parseFloat(d[SelX], 10); })).nice()
                    .range([margin, width - margin]);
    }
    function setYScale(SelY) {
        yScale = d3.scale.linear()
                    .domain(d3.extent(dataset, function (d) { return parseFloat(d[SelY]); })).nice()
                    .range([height - margin, margin]);
    }

    function setColScale() {
        sansColScale = d3.scale.linear()
                        .domain(d3.extent(dataset, function (d) { return parseFloat(d[SelCol]); }))
                        .range(["#D6F5D6", "#32CD32"])
                        .interpolate(d3.interpolateRgb);

        serifColScale = d3.scale.linear()
                        .domain(d3.extent(dataset, function (d) { return parseFloat(d[SelCol]); }))
                        .range(["#F8D0D8", "#DC143C"])
                        .interpolate(d3.interpolateRgb);
    }

    function updateAxis(axisName, axisScale, axisId) {
            axisName.scale(axisScale);
            svg.select('#' + axisId)
                .transition()
                .duration(1500)
                .call(axisName);
    }

    function updateCircles() {
        circles.transition()
            .duration(1500)
            .attr({
                'cx': function (d) { return xScale(d[SelX]); },
                'cy': function (d) { return yScale(d[SelY]); },
                'fill': function (d) {
                    if (d.Grazie === "Sans") { return sansColScale(parseFloat(d[SelCol])); }
                    else { return serifColScale(parseFloat(d[SelCol])); }
                }
            });
    }

    function selectCircles(SelFont, duration) {
        svg.select('#circles')
            .selectAll('.' + (SelFont).replace(/\s/g, "-"))
            .transition()
            .duration(duration)
            .attr({
                'stroke': 'black',
                'stroke-width': 1,
                'opacity': 1,
                'r': 6
            });
    }

    function selectSingleCircle(SelWeight, duration) {
        svg.select('#circles')
            .select('#' + (SelFont).replace(/\s/g, "-") + '_' +(SelWeight).replace(/\s/g, "-"))
            .transition()
            .duration(duration)
            .attr({
                'stroke': 'black',
                'stroke-width': 2,
                'opacity': 1,
                'r': 10
            });
    }

    function deselectCircles() {
        circles.attr({
                'stroke': 'black',
                'stroke-width': 0,
                'r': 4,
                'opacity': 0.5
            });
    }

    function setFontWeightDropdown (SelFont) {
        legend.selectAll('.availableFontWeight')
            .remove();
        if (SelFont !== '---') {
            legend.select('#fontWeight ul')
                .selectAll('li .availableFontWeight')
                .data(fontFamiliesGrouped[SelFont])
                .enter()
                .append('li')
                .attr('class', 'availableFontWeight')
                .style({
                    'cursor': 'pointer',
                    'role': "menuitem",
                    'tabindex': -1
                })
                .text(function (d) { return d.StyleName; });
        }
    }

    function wrap(text, width, xPosition) {
        text.each(function() {
            var text = d3.select(this),
                words = text.text().split(/;/).reverse(),
                word,
                line = [],
                lineNumber = 0,
                lineHeight = 1.1, // ems
                y = text.attr("y"),
                dy = text.attr("dy") ? text.attr("dy") : 0,
                tspan = text.text(null).append("tspan").attr("x", xPosition).attr("y", y).attr("dy", dy + "em");
            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(" "));
                if (tspan.node().getComputedTextLength() > width) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
                    tspan = text.append("tspan").attr("x", xPosition).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                }
            }
        });
    }

    function monoFont(fontStyle) { return fontStyle.filter(function (d) { return d.Spacing === "Mono"; }); }

    function regularFont(fontStyle) { return fontStyle.filter(function (d) { return d.StyleName.match(/Regular/g) || d.StyleName.match(/Book/g) || d.StyleName.match(/Roman/g) || d.StyleName.match(/Normal/g) || d.StyleName.match(/^Text$/g) || d.StyleName.match(/^Condensed$/) || d.StyleName.match(/^Condensed Display$/) || d.StyleName.match(/^Condensed Caption$/) || d.StyleName.match(/^Condensed Subhead$/) || d.StyleName.match(/^Semicondensed$/) || d.StyleName.match(/^Extended$/) || d.StyleName.match(/^Semiextended$/) || d.StyleName.match(/^Caption$/) || d.StyleName.match(/^Display$/g) || d.StyleName.match(/^Subhead$/g) || d.StyleName.match(/Compact/g) || d.StyleName.match(/Sub-caption/g) || d.StyleName.match(/Mittelschrift/g) || d.StyleName.match(/Address/g) || d.StyleName.match(/Name/g) || d.StyleName.match(/Medium/g);
        });
    }

    function lightFont(fontStyle) { return fontStyle.filter(function (d) { return d.StyleName.match(/Light/g) || d.StyleName.match(/Ultralight/g) || d.StyleName.match(/Semilight/g) || d.StyleName.match(/Thin/g) || d.StyleName.match(/Hairline/g) || d.StyleName.match(/Extralight/g);
        });
    }

    function boldFont(fontStyle) { return fontStyle.filter(function (d) { return d.StyleName.match(/Bold/g) || d.StyleName.match(/Demi/g) || d.StyleName.match(/Semibold/g);
        });
    }

    function ultraFont(fontStyle) { return fontStyle.filter(function (d) { return d.StyleName.match(/Black/g) || d.StyleName.match(/Heavy/g) || d.StyleName.match(/Super/g) || d.StyleName.match(/^Ultra$/g) || d.StyleName.match(/Ultrabold/g) || d.StyleName.match(/Nord/g) || d.StyleName.match(/Extra Bold/g) || d.StyleName.match(/Extrabold/g);
        });
    }

});
