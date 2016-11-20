/*!
 * eve.circleClusters.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Base class for circleClusters diagram.
 */
(function (e) {
    //define circleClusters diagram class
    function circleClusters(options) {
        //hide legend
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
            xScale = null,
            yScale = null,
            xAxis = null,
            yAxis = null,
            xAxisSVG = null,
            yAxisSVG = null,
            xAxisGrid = null,
            sources = [],
            groups = [],
            margin = { left: 0, top: 5, bottom: 5, right: 0 },
            width = 0,
            height = 0,
            maxSourceLength = 0,
            maxGroupLength = 0,
            minMeasures = [],
            maxMeasures = [],
            currentMin = 0, currentMax = 0,
            minMeasure = 0,
            maxMeasure = 0,
            nodes = null,
            currentSource = '',
            currentSourceIndex = -1,
            currentSourceColor = '',
            currentMeasure = 0,
            padding = 3,
            maxRadius = 4,
            damper = 0.8,
            simulation = null,
            circles = null,
            sourceColors = [];

        //calculates scales and environmental variables
        function calculateScales() {
            //get sources
            sources = e.getUniqueValues(diagram.data, currentSerie.sourceField);

            //clear array values
            sourceColors = [];
            groups = [];
            nodes = [];

            //set source colors
            sources.forEach(function (s, i) {
                //create color for the current source
                sourceColors.push({
                    source: s,
                    color: i >= e.colors.length ? e.randColor() : e.colors[i]
                });
            });

            //set groups
            d3.keys(diagram.data[0]).map(function (d, i) {
                //check key if available
                if (d !== currentSerie.sourceField && d !== 'total') {
                    //push current key as column
                    groups.push(d);
                }
            });

            //set max group and source lengths
            maxGroupLength = d3.max(groups, function (d) { return d.toString().length; });
            maxSourceLength = d3.max(sources, function (d) { return d.toString().length; });

            //set margin
            margin.left = 5 + (((diagram.yAxis.labelFontSize / 2) * (maxSourceLength + 1)) + diagram.yAxis.labelFontSize);
            margin.right = 5 + (((diagram.yAxis.labelFontSize / 2) * (maxGroupLength + 1)) + diagram.yAxis.labelFontSize);
            margin.bottom = 5 + diagram.xAxis.labelFontSize;

            //set dimension
            width = diagram.plot.width - margin.left - margin.right;
            height = diagram.plot.height - margin.top - margin.top;

            //iterate data to set set measures array
            groups.forEach(function (currentGroup) {
                //get min and max values for the current measure
                currentMin = d3.min(diagram.data, function (d) { return +d[currentGroup]; });
                currentMax = d3.max(diagram.data, function (d) { return +d[currentGroup]; });

                //push current min and max
                minMeasures.push(parseFloat(currentMin));
                maxMeasures.push(parseFloat(currentMax));
            });

            //set min and max measure
            minMeasure = d3.min(minMeasures);
            maxMeasure = d3.max(maxMeasures);

            //set scales
            xScale = d3.scaleLinear().domain([minMeasure, maxMeasure]).range([0, width]);
            yScale = d3.scaleBand().domain(sources).range([(height - margin.bottom - margin.top), 0]).padding(0.1);

            //create axes
            xAxis = createXAxis();
            yAxis = d3.axisLeft().scale(yScale).tickSize(5);

            //iterate data to create nodes
            diagram.data.forEach(function (currentData) {
                //get current values
                currentSource = currentData[currentSerie.sourceField];
                currentSourceIndex = sources.indexOf(currentSource);
                currentSourceColor = sourceColors[currentSourceIndex].color;

                //iterate all keys in current data
                for (var key in currentData) {
                    //check whether the key is not matching with the source
                    if (key !== currentSerie.sourceField) {
                        //get current measure
                        currentMeasure = currentData[key] ? +currentData[key] : 0;

                        //check measure > 0
                        if (currentMeasure > 0) {
                            //push the current data into the nodes
                            nodes.push({
                                radius: maxRadius,
                                color: currentSourceColor,
                                cx: xScale(currentMeasure),
                                cy: yScale(currentSource) + yScale.bandwidth() / 2,
                                measure: currentMeasure,
                                source: currentSource,
                                group: key
                            });
                        }
                    }
                }
            });
        }

        //creates x axis
        function createXAxis() {
            //get single axis width
            var formattedAxisLength = diagram.formatNumber(maxMeasure, diagram.xAxis.numberFormat).toString().length,
                maxAxisLength = formattedAxisLength + (Math.ceil(formattedAxisLength / 3)),
                singleAxisWidth = ((diagram.xAxis.labelFontSize / 2) * (maxAxisLength + 4)) + diagram.xAxis.labelFontSize,
                autoTickCount = Math.ceil(width / singleAxisWidth);

            //return axis
            return d3.axisBottom().scale(xScale).tickSize(5).tickPadding(8).ticks(autoTickCount);
        }

        //updates axis
        function updateAxisStyle() {
            //set x axis grid domain style
            xAxisGrid.selectAll('.domain')
                .style('stroke', 'none')
                .style('stroke-width', '0px');

            //set y axis grid line style
            xAxisGrid.selectAll('line')
                .style('stroke-opacity', 1)
                .style('stroke-width', 1)
                .style('stroke', '#eeeeee');

            //select x axis path and change stroke
            xAxisSVG.selectAll('path')
                .style('stroke-opacity', diagram.xAxis.alpha)
                .style('stroke-width', diagram.xAxis.thickness + 'px')
                .style('stroke', diagram.xAxis.color);

            //select all lines in xaxis
            xAxisSVG.selectAll('line')
                .style('fill', 'none')
                .style('stroke-width', diagram.xAxis.thickness + 'px')
                .style('shape-rendering', 'crispEdges')
                .style('stroke-opacity', diagram.xAxis.alpha)
                .style('stroke', diagram.xAxis.color);

            //select all texts in xaxis
            xAxisSVG.selectAll('text')
                .style('fill', diagram.xAxis.labelFontColor)
                .style('font-size', diagram.xAxis.labelFontSize + 'px')
                .style('font-family', diagram.xAxis.labelFontFamily + ', Arial, Helvetica, Ubuntu')
                .style('font-style', diagram.xAxis.labelFontStyle === 'bold' ? 'normal' : diagram.xAxis.labelFontStyle)
                .style('font-weight', diagram.xAxis.labelFontStyle === 'bold' ? 'bold' : 'normal')
                .style('text-anchor', 'middle')
                .transition(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .text(function (d) { return d; });

            //select x axis path and change stroke
            yAxisSVG.selectAll('path')
                .style('stroke-opacity', diagram.yAxis.alpha)
                .style('stroke-width', diagram.yAxis.thickness + 'px')
                .style('stroke', diagram.yAxis.color);

            //select all lines in yaxis
            yAxisSVG.selectAll('line')
                .style('fill', 'none')
                .style('stroke-width', diagram.yAxis.thickness + 'px')
                .style('shape-rendering', 'crispEdges')
                .style('stroke-opacity', diagram.yAxis.alpha)
                .style('stroke', diagram.yAxis.color);

            //select all texts in yaxis
            yAxisSVG.selectAll('text')
                .style('fill', diagram.yAxis.labelFontColor)
                .style('font-size', diagram.yAxis.labelFontSize + 'px')
                .style('font-family', diagram.yAxis.labelFontFamily + ', Arial, Helvetica, Ubuntu')
                .style('font-style', diagram.yAxis.labelFontStyle === 'bold' ? 'normal' : diagram.yAxis.labelFontStyle)
                .style('font-weight', diagram.yAxis.labelFontStyle === 'bold' ? 'bold' : 'normal')
                .transition(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .text(function (d) { return d; });
        }

        //initializes axes for both cases
        function createAxes() {
            //create x axis grid
            xAxisGrid = diagramG.append('g')
                .attr('class', 'eve-x-grid')
                .attr('transform', function () { return 'translate(' + margin.left + ', ' + (height - margin.bottom - margin.top) + ')'; })
                .call(createXAxis().tickSize(-width, 0, 0).tickFormat(''));

            //create x axis svg
            xAxisSVG = diagramG.append('g')
                .style('fill', 'none')
                .style('shape-rendering', 'crispEdges')
                .attr('transform', 'translate(' + margin.left + ',' + (height - margin.bottom - margin.top) + ')')
                .attr('class', 'eve-x-axis')
                .call(xAxis);

            //create y axis left svg
            yAxisSVG = diagramG.append('g')
                .style('fill', 'none')
                .style('shape-rendering', 'crispEdges')
                .attr('transform', 'translate(' + margin.left + ')')
                .attr('class', 'eve-y-axis')
                .call(yAxis);

            //set axes styling
            updateAxisStyle();
        }

        //initializes diagram
        function initDiagram() {
            //create simulation
            simulation = d3.forceSimulation(nodes)
                .velocityDecay(0.2)
                .force('x', d3.forceX().strength(0.0005))
                .force('y', d3.forceY().strength(0.0005))
                .force('charge', d3.forceManyBody())
                .on('tick', ticked);

            //set simulation nodes
            simulation.nodes(nodes);

            //create circles
            circles = diagramG.selectAll("circle")
                .data(nodes)
                .enter().append("circle")
                .attr("r", function (d) { return d.radius; })
                .style("fill", function (d) { return d.color; })
                .on('mousemove', function (d, i) {
                    //show tooltip
                    diagram.showTooltip(diagram.getContent(d, currentSerie, diagram.tooltip.format));
                })
                .on('mouseout', function (d, i) {
                    //hide tooltip
                    diagram.hideTooltip();
                });
        }

        //handles ticked event for the simulation
        function ticked() {
            //attach collider to the circles
            circles
                .each(gravity(damper * 1))
                .each(collide(0.5))
                .style("fill", function (d) { return d.color; })
                .attr("cy", function (d) { return d.y; })
                .transition(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr("cx", function (d, i) { return margin.left + d.x; });
        }

        //moves nodes toward cluster focus.
        function gravity(alpha) {
            return function (d) {
                d.y += (d.cy - d.y) * alpha;
                d.x += (d.cx - d.x) * alpha;
            };
        }

        //resolves collisions between nodes.
        function collide(alpha) {
            var quadtree = d3.quadtree()
                .x(function (d) { return d.x; })
                .y(function (d) { return d.y; })
                .addAll(nodes);

            return function (d) {
                var r = d.radius + maxRadius + padding,
                    nx1 = d.x - r,
                    nx2 = d.x + r,
                    ny1 = d.y - r,
                    ny2 = d.y + r;

                quadtree.visit(function (quad, x1, y1, x2, y2) {
                    if (quad.data && (quad.data !== d)) {
                        var x = d.x - quad.data.x,
                            y = d.y - quad.data.y,
                            l = Math.sqrt(x * x + y * y),
                            r = d.radius + quad.data.radius + (d.color !== quad.data.color) * padding;
                        if (l < r) {
                            l = (l - r) / l * alpha;
                            d.x -= x *= l;
                            d.y -= y *= l;
                            quad.data.x += x;
                            quad.data.y += y;
                        }
                    }
                    return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
                });
            };
        }

        //calculate scales and draw environment
        calculateScales();

        //create diagram g
        var diagramG = diagram.svg.append('g')
            .attr('transform', 'translate(' + diagram.plot.left + ',' + diagram.plot.top + ')');

        //create axes and initialize
        createAxes();
        initDiagram();

        //update diagram
        diagram.update = function (data) {
            //set diagram data
            diagram.data = data;
            
            //re-calculate scales and environment
            calculateScales();

            //update x axis
            xAxisSVG
                .style('fill', 'none')
                .style('shape-rendering', 'crispEdges')
                .transition(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .call(xAxis);

            //update y axis
            yAxisSVG
                .style('fill', 'none')
                .style('shape-rendering', 'crispEdges')
                .transition(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .call(yAxis);

            //update axis style with new scale
            updateAxisStyle();

            //set simulation nodes
            simulation.stop();
            simulation.nodes(nodes);
            
            //add circles
            circles.data(nodes).exit().remove();

            //restart simulation
            simulation.restart();
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
    e.circleClusters = function (options) {
        return new circleClusters(options);
    };
})(eve);