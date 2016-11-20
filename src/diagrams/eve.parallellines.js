/*!
 * eve.parallelLines.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Base class for parallelLines diagram.
 */
(function (e) {
    //define parallelLines diagram class
    function parallelLines(options) {
        //remove legend
        if (options.legend) {
            options.legend.enabled = false;
        } else {
            options.legend = {
                enabled: false
            };
        }

        //declare needed variables
        var diagram = eve.base.init(options),
            currentSerie = diagram.series[0],
            width = 0,
            height = 0,
            topMargin = 0,
            maxMeasure = Number.MIN_VALUE,
            measureFields = [],
            formattedMaxMeasure = '',
            groups = [],
            currentMeasureMax = 0,
            groupColors = [],
            xScale = null,
            yScales = {},
            dragging = {},
            line = d3.line(),
            axis = d3.axisLeft(),
            dimensions,
            dimensionsSVG,
            background, foreground;

        //calculates scales and dimensions
        function calculateScales() {
            //get measure fields
            measureFields = currentSerie.measureField.split(',');

            //get groups
            if(currentSerie.groupField)
                groups = e.getUniqueValues(diagram.data, currentSerie.groupField);
            else
                groups = e.getUniqueValues(diagram.data, currentSerie.sourceField);

            //iterate groups to create colors
            groups.forEach(function (g, i) {
                //create color for the current group
                groupColors.push(i >= e.colors.length ? e.randColor() : e.colors[i]);
            });

            //iterarte measure fields
            measureFields.forEach(function (m) {
                //get current measure max value
                currentMeasureMax = d3.max(diagram.data, function (d) { return +d[m]; });

                //check whether the current measure max 
                if (currentMeasureMax > maxMeasure)
                    maxMeasure = currentMeasureMax;
            });

            //format max measure
            formattedMaxMeasure = diagram.formatNumber(maxMeasure, diagram.yAxis.numberFormat);

            //calculate margins
            topMargin = diagram.xAxis.labelFontSize * 2;
            width = diagram.plot.width - diagram.margin.left - diagram.margin.right;
            height = diagram.plot.height - diagram.margin.top - diagram.margin.bottom - diagram.xAxis.labelFontSize * 2;

            //update scales
            xScale = d3.scalePoint().range([0, width]).padding(1);
            line = d3.line();
            axis = d3.axisLeft();
            yScales = {};

            //set dimensions
            dimensions = d3.keys(diagram.data[0]).filter(function (d) {
                return d != currentSerie.sourceField && d != currentSerie.groupField && (
                    yScales[d] = d3.scaleLinear()
                        .domain(d3.extent(diagram.data, function (p) { return +p[d]; }))
                        .range([height, 0])
                    );
            });

            //set axes for each measure
            xScale.domain(dimensions);
        }

        //animates lines
        function animateLines() {
            //create animation
            foreground
                .transition(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr('d', pathAnimated);
        }

        //initializes diagram
        function initDiagram() {
            //create panning columns
            background = diagramG.append("g")
                .attr("class", "eve-parallel-lines-background")
                .style('fill', 'none')
                .style('stroke', '#dddddd')
                .style('shape-rendering', 'crispEdges')
                .style('fill-opacity', 0)
                .selectAll("path")
                .data(diagram.data)
                .enter().append("path")
                .attr("d", path);

            //create lines visualization
            foreground = diagramG.append("g")
                .selectAll("path")
                .data(diagram.data)
                .enter().append("path")
                .attr('class', function (d, i) { return 'eve-parallel-lines-foreground eve-parallel-line-' + i; })
                .style('fill', 'none')
                .style('fill-opacity', 0)
                .style('stroke', function (d) {
                    //get index of data group
                  	var dataGroup = currentSerie.groupField ? d[currentSerie.groupField] : d[currentSerie.sourceField],
                        colorIndex = groups.indexOf(dataGroup),
                        lineColor = groupColors[colorIndex];

                    //return color
                    return lineColor;
                })
                .style('stroke-width', 2.5)
                .style('stroke-opacity', 0.8)
                .on('click', function (d, i) {
                    //check selected
                    if (d.selected) { d.selected = false; } else { d.selected = true; }

                    //text value
                    var valueAsClassName = 'eve-parallel-line-' + i;

                    //check whether the node is selected
                    if (d.selected) {
                        //decrease opacity of the all lines
                        diagramG.selectAll('.eve-parallel-lines-foreground').style('stroke-opacity', 0.1);

                        //increase opacity of the selected lines
                        diagramG.selectAll('.' + valueAsClassName).style('stroke-opacity', 1).style('stroke-width', 5);
                    } else {
                        //increase opacity of the all lines
                        diagramG.selectAll('.eve-parallel-lines-foreground').style('stroke-opacity', 1).style('stroke-width', 2.5);
                    }
                })
                .on("mousemove", function (d) {
                    //hide bubble
                    diagram.showTooltip(diagram.getContent(d, currentSerie, diagram.tooltip.format));
                })
                .on("mouseout", function (d) {
                    //hide bubble
                    diagram.hideTooltip();
                })
                .attr("d", path);

            //create dimensions
            dimensionsSVG = diagramG.selectAll(".dimension")
                .data(dimensions)
                .enter().append("g")
                .attr("class", "dimension")
                .attr("transform", function (d) { return "translate(" + xScale(d) + ")"; })
                .call(
                    //call drag
                    d3.drag()
                        .subject(function (d) { return { x: xScale(d) }; })
                        .on("start", function (d) {
                            //set dragging
                            dragging[d] = xScale(d);

                            //hide bcakground
                            background.attr("visibility", "hidden");
                        })
                        .on("drag", function (d) {
                            //set dragging
                            dragging[d] = Math.min(width, Math.max(0, d3.event.x));

                            //redraw foreground
                            foreground.attr("d", path);

                            //re-order dimensions
                            dimensions.sort(function (a, b) { return position(a) - position(b); });

                            //update x axis domains
                            xScale.domain(dimensions);

                            //transform diagram
                            dimensionsSVG.attr("transform", function (d) { return "translate(" + position(d) + ")"; });
                        })
                        .on("end", function (d, i) {
                            //delete dragging position
                            delete dragging[d];

                            //translate this pat
                            transition(d3.select(this)).attr("transform", "translate(" + xScale(d) + ")");

                            //redraw foreground
                            transition(foreground).attr("d", path);

                            //redraw background
                            background.attr("d", path)
                                .transition()
                                .delay(500)
                                .duration(0)
                                .attr("visibility", null);

                            //check if labels are enabled
                            if (diagram.yAxis.labelFormat) {
                                //declare needed variables
                                var nodeLine = foreground[0][i].getBBox(),
                                    nodePathString = d3.select(foreground[0][i]).attr('d'),
                                    posx = nodeLine.x + 10,
                                    posy = parseFloat(nodePathString.split(',')[1]) - 2;

                                //check whether the posY = 0
                                if (posy <= 0)
                                    posy = diagram.yAxis.labelFontSize;

                                //return translation
                                return 'translate(' + posx + ',' + posy + ')';
                            }
                        })
                );

            //create axis titles
            dimensionsSVG.append("g")
                .attr("class", "eve-parallel-lines-axis")
                .each(function (d) { d3.select(this).call(axis.scale(yScales[d])); })
                .append("text")
                .style("text-anchor", "middle")
                .style('fill', diagram.xAxis.labelFontColor)
                .style('font-size', diagram.xAxis.labelFontSize + 'px')
                .style('font-family', diagram.xAxis.labelFontFamily)
                .style('font-style', diagram.xAxis.labelFontStyle === 'bold' ? 'normal' : diagram.xAxis.labelFontStyle)
                .style('font-weight', diagram.xAxis.labelFontStyle === 'bold' ? 'bold' : 'normal')
                .attr("y", -9)
                .text(function (d) { return d; });

            //create pan brush
            dimensionsSVG.append("g")
                .attr("class", "eve-y-brush")
                .each(function (d) {
                    d3.select(this)
                        .call(
                            yScales[d].brush = d3.brushY(yScales[d])
                                .extent([[-8, 0], [10, height]])
                                .on("brush end", brush)
                        );
                })
                .selectAll("rect");

            //change domain colors
            diagramG.selectAll('.eve-parallel-lines-axis')
                .selectAll('path')
                .style('fill', 'none')
                .style('stroke', '#333333');

            //create axis
            diagramG.selectAll('.eve-parallel-lines-axis text')
                .style('fill', diagram.yAxis.labelFontColor)
                .style('font-size', diagram.yAxis.labelFontSize + 'px')
                .style('font-family', diagram.yAxis.labelFontFamily)
                .style('font-style', diagram.yAxis.labelFontStyle === 'bold' ? 'normal' : diagram.yAxis.labelFontStyle)
                .style('font-weight', diagram.yAxis.labelFontStyle === 'bold' ? 'bold' : 'normal')
                .text(function (d) {
                    //check current data type to set axis text
                    if (typeof d === 'string')
                        return d;
                    else
                        return diagram.formatNumber(d, diagram.yAxis.numberFormat);
                });
        }

        //set position
        function position(d) { var v = dragging[d]; return v == null ? xScale(d) : v; }

        //set transition
        function transition(g) { return g.transition().duration(diagram.animation.duration); }

        //creates path
        function path(d) {
            return line(dimensions.map(function (p) {
                return [position(p), yScales[p](0)];
            }));
        }

        //creates path animation
        function pathAnimated(d) {
            return line(dimensions.map(function (p) {
                return [position(p), yScales[p](+d[p])];
            }));
        }

        //handles a brush event, toggling the display of foreground lines.
        function brush() {
            //exit brush if there is no selection
            if (!d3.event.selection) return;

            //get active dimensions
            var actives = dimensions.filter(function (p) {
                return d3.event.selection.map(yScales[p].invert);
            });

            //get extents for the active dimensions
            var extents = actives.map(function (p) {
                return d3.event.selection.map(yScales[p].invert);
            });

            //declare selected items
            var selectedPaths = [];
            
            //make paths almost transparent
            foreground.style('stroke-opacity', 0.1);

            //get selected paths
            diagram.data.forEach(function (currentData, currentDataIndex) {
                //iterate all active dimensions
                actives.forEach(function (currentDimension, currentDimensionIndex) {
                    if (extents[currentDimensionIndex][1] <= +currentData[currentDimension] && extents[currentDimensionIndex][0] >= +currentData[currentDimension]) {
                        if (selectedPaths.indexOf('.eve-parallel-line-' + currentDataIndex) === -1)
                            selectedPaths.push('.eve-parallel-line-' + currentDataIndex);
                    }
                });
            });

            //select all selected paths
            selectedPaths.forEach(function (s) {
                diagramG.selectAll(s).style('stroke-opacity', 1);
            });
        }

        //calculate environment
        calculateScales();

        //create diagram g
        var diagramG = diagram.svg.append('g')
            .attr('transform', 'translate(' + diagram.margin.left + ',' + topMargin + ')');

        //initialize diagram
        initDiagram();
        animateLines();

        //update diagram
        diagram.update = function (data) {
            //set diagram data
            diagram.data = data;

            //recalculate scales
            calculateScales();

            //update diagram g
            diagramG.attr('transform', 'translate(' + diagram.margin.left + ',' + topMargin + ')');

            //clear diagram g content
            background.remove();
            foreground.remove();
            dimensionsSVG.remove();

            //re-initialize diagram
            initDiagram();
            animateLines();
        };

        //draws the chart into a canvas
        diagram.toCanvas = function () {
            //get the chart container
            var orgDiv = document.getElementById(diagram.container);
            /* create the promise for function response
            ** this is required for handling async canvas conversion
            */
            return new Promise(function (resolve) {
                //convert the final clone to canvas
                html2canvas(orgDiv).then(function (canvas) {
                    //return promise with canvas
                    resolve(canvas);
                });
            });
        };

        //returns the chart image 
        diagram.toImage = function () {
            //get the chart container
            var orgDiv = document.getElementById(diagram.container);
            /* create the promise for function response
            ** this is required for handling async canvas conversion
            */
            return new Promise(function (resolve) {
                //convert the final clone to canvas
                html2canvas(orgDiv).then(function (canvas) {
                    //return promise with canvas
                    resolve(canvas.toDataURL('image/png'));
                });
            });
        };

        //return abacus diagram
        return diagram;
    }

    //attach timeline method into the eve
    e.parallelLines = function (options) {
        options.type = '';
        return new parallelLines(options);
    };
})(eve);