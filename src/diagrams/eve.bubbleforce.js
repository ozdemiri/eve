/*!
 * eve.bubbleForce.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Base class for force diagram.
 */
(function (e) {
    //define force diagram class
    function bubbleForce(options) {
        //declare needed variables
        var diagram = eve.base.init(options),
            currentSerie = diagram.series[0],
            simulation = null,
            width = 0, height = 0,
            padding = 1.5,
            nodeTexts,
            clusterPadding = 10,
            minMeasure = 0,
            maxMeasure = 0,
            rScale = null,
            colorScale = null,
            nodes = null,
            circles = null,
            groups = [],
            clusters = [];

        //calculates scales and environmental varaibles
        function calculateScales() {
            //set dimension
            width = diagram.plot.width - diagram.plot.left - diagram.plot.right;
            height = diagram.plot.height - diagram.plot.top - diagram.plot.bottom;

            //get min and max measure
            minMeasure = diagram.domains.y[0];
            maxMeasure = diagram.domains.y[1];

            //check whether the min and max radius is null
            if (!currentSerie.maxBulletSize) 
                currentSerie.maxBulletSize = Math.sqrt(((width * height) / diagram.data.length) / Math.PI) - 5;
            if (!currentSerie.minBulletSize) 
                currentSerie.minBulletSize = (currentSerie.maxBulletSize * minMeasure) / maxMeasure;

            //set r scale
            rScale = d3.scalePow().exponent(0.5).domain([minMeasure, maxMeasure]).range([currentSerie.minBulletSize, currentSerie.maxBulletSize]);

            //get clusters
            groups = e.getUniqueValues(diagram.data, currentSerie.groupField);
            clusters = new Array(groups.length);
            
            //create color scale
            colorScale = d3.scaleLinear().range(diagram.legend.gradientColors).domain([minMeasure, maxMeasure]);

            //create nodes
            nodes = d3.range(diagram.data.length).map(function (index) {
                //get current data
                var currentData = diagram.data[index],
                    radius = rScale(+currentData[currentSerie.measureField]);

                //check wether the radius less than 0
                if (radius < 0)
                    radius = 0.1;

                //set node
                var node = {
                    source: currentData[currentSerie.sourceField],
                    cluster: groups.indexOf(currentData[currentSerie.groupField]),
                    clusterName: currentData[currentSerie.groupField],
                    measure: +currentData[currentSerie.measureField],
                    r: radius
                };

                //set cluster
                if (!clusters[currentData.cluster] || (node.measure > clusters[currentData.cluster].measure))
                    clusters[currentData.cluster] = node;

                //return node
                return node;
            });
        }

        //initializes diaram and starts simulation
        function initDiagram() {
            //create circles
            circles = diagramG.append('g')
                .datum(nodes)
                .selectAll('.circle')
                .data(function (d) { return d; })
                .enter().append('circle')
                .attr('r', function (d) { return d.r; })
                .style('fill', function (d) {
                    if (diagram.legend.enabled)
                        return colorScale(d.measure);
                    return d.cluster >= e.colors.length ? e.randColor() : e.colors[d.cluster];
                })
                .style('fill-opacity', 0.9)
                .on('mousemove', function (d, i) {
                    //show tooltip
                    diagram.showTooltip(diagram.getContent(d, currentSerie, diagram.tooltip.format));
                })
                .on('mouseout', function (d, i) {
                    //hide tooltip
                    diagram.hideTooltip();
                })
                .call(d3.drag()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended));

            //check whether the labels are enabled
            if (currentSerie.labelFormat) {
                //create texts
                nodeTexts = diagramG.selectAll('text')
                    .data(nodes).enter().append('text')
                    .attr('class', 'eve-force-tree-text')
                    .style('fill', currentSerie.labelFontColor)
                    .style('font-size', currentSerie.labelFontSize + 'px')
                    .style('font-family', currentSerie.labelFontFamily)
                    .style('font-style', currentSerie.labelFontStyle === 'bold' ? 'normal' : currentSerie.labelFontStyle)
                    .style('font-weight', currentSerie.labelFontStyle === 'bold' ? 'bold' : 'normal')
                    .style('text-anchor', 'middle')
                    .text(function (d) {
                        //return formatted
                        return currentSerie.labelFormat.replaceAll('{source}', d.source).replaceAll('{measure}', diagram.formatNumber(d.measure, currentSerie.numberFormat));
                    });
            }

            //create d3 force layout
            simulation = d3.forceSimulation(nodes)
                .velocityDecay(0.2)
                .force("x", d3.forceX().strength(0.0005))
                .force("y", d3.forceY().strength(0.0005))
                .force("collide", collide)
                .force("cluster", clustering)
                .on("tick", ticked);

            //start simulation
            simulation.nodes(nodes);
        }

        //handle simulation ticked event
        function ticked() {
            circles
                .attr('cx', 0)
                .attr('cy', 0)
                .transition(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr('cx', function (d) { return d.x; })
                .attr('cy', function (d) { return d.y; });

            //check whether the labels are enabled
            if (currentSerie.labelFormat) {
                //set label positions
                nodeTexts
                    .attr('x', 0)
                    .attr('y', 0)
                    .transition(diagram.animation.duration)
                    .ease(diagram.animation.easing.toEasing())
                    .delay(function (d, i) { return i * diagram.animation.delay; })
                    .attr('x', function (d) { return d.x; })
                    .attr('y', function (d) { return d.y + currentSerie.labelFontSize / 2; });
            }
        }

        //handles drag start event
        function dragstarted(d) {
            if (!d3.event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        //handles dragged event
        function dragged(d) {
            d.fx = d3.event.x;
            d.fy = d3.event.y;
        }

        //handles drag ended event
        function dragended(d) {
            //set fixed drag as true
            d.fixed = true;

            //set fixed class
            d3.select(this).classed("fixed", true);
        }

        //creates clustering
        function clustering(alpha) {
            nodes.forEach(function (d) {
                var cluster = clusters[d.cluster];
                if (cluster === d) return;
                var x = d.x - cluster.x,
                    y = d.y - cluster.y,
                    l = Math.sqrt(x * x + y * y),
                    r = d.r + cluster.r;
                if (l !== r) {
                    l = (l - r) / l * alpha;
                    d.x -= x *= l;
                    d.y -= y *= l;
                    cluster.x += x;
                    cluster.y += y;
                }
            });
        }

        //handles collision
        function collide(alpha) {
            var quadtree = d3.quadtree()
                .x(function (d) { return d.x; })
                .y(function (d) { return d.y; })
                .addAll(nodes);

            nodes.forEach(function (d) {
                var r = d.r + currentSerie.maxBulletSize + Math.max(padding, clusterPadding),
                    nx1 = d.x - r,
                    nx2 = d.x + r,
                    ny1 = d.y - r,
                    ny2 = d.y + r;

                quadtree.visit(function (quad, x1, y1, x2, y2) {
                    if (quad.data && (quad.data !== d)) {
                        var x = d.x - quad.data.x,
                            y = d.y - quad.data.y,
                            l = Math.sqrt(x * x + y * y),
                            r = d.r + quad.data.r + (d.cluster === quad.data.cluster ? padding : clusterPadding);
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
            });
        }

        //calculate envrionment
        calculateScales();

        //create diagram g
        var diagramG = diagram.svg.append('g')
            .attr('width', width)
            .attr('height', height)
            .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

        //initialize diagram
        initDiagram();

        //update diagram
        diagram.update = function (data) {
            //set diagram data
            diagram.data = data;

            //re-caluclate scales
            calculateScales();

            //update domains and legend
            diagram.updateXYDomain();
            diagram.updateLegend();

            //remove items
            circles.remove();
            if (nodeTexts)
                nodeTexts.remove();

            //remove items
            initDiagram();
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
    e.bubbleForce = function (options) {
        return new bubbleForce(options);
    };
})(eve);