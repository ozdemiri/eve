/*!
 * eve.bubbleforce.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Base class for bubble force diagram.
 */
(function (e) {
    //bubble force class
    function bubbleForce(options) {
        //declare needed variables
        let diagram = eve.initVis(options),
            currentSerie = diagram.series[0],
            dataset = e.clone(diagram.data),
            simulation = null,
            width = 0, height = 0,
            padding = 1.5,
            nodeTexts,
            clusterPadding = 10,
            minMeasure = 0,
            maxMeasure = 0,
            rScale = null,
            nodes = null,
            circles = null,
            diagramG = null,
            groups = [],
            minFontSize = 8,
            circleBBox = null, textBBox = null,
            clusters = [];

        //set simulations
        diagram.simulations = [];

        //handle simulation ticked event
        function ticked() {
            //create circles
            circles
                .attr('opacity', diagram.animation.effect === 'add' ? 0 : 1)
                .transition().duration(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr('opacity', 1)
                .attr('cx', function (d) { return d.x; })
                .attr('cy', function (d) { return d.y; });

            //check whether the labels are enabled
            if (currentSerie.labelFormat) {
                //set label positions
                nodeTexts
                    .attr('fill-opacity', function (d, i) {
                        //get bboxes
                        circleBBox = circles._groups[0][i].getBBox();
                        textBBox = this.getBBox();

                        //check label visibility
                        if (currentSerie.labelVisibility === 'always')
                            return 1;
                        else
                            return textBBox.width > circleBBox.width ? 0 : 1;
                    })
                    .transition().duration(diagram.animation.duration)
                    .ease(diagram.animation.easing.toEasing())
                    .delay(function (d, i) { return i * diagram.animation.delay; })
                    .attr('x', function (d) {
                        return d.x;
                    })
                    .attr('y', function (d) {
                        return d.y;
                    });
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

            //stop simulation
            if (!d3.event.active) simulation.stop();
        }

        //creates clustering
        function clustering(alpha) {
            nodes.forEach(function (d) {
                let cluster = clusters[d.cluster];
                if (!cluster) return;
                if (cluster === d) return;
                let x = d.x - cluster.x,
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
            let quadtree = d3.quadtree()
                .x(function (d) { return d.x + 1.5; })
                .y(function (d) { return d.y + 1.5; })
                .addAll(nodes);

            nodes.forEach(function (d) {
                let r = d.r + currentSerie.maxBulletSize + Math.max(padding, clusterPadding),
                    nx1 = d.x - r,
                    nx2 = d.x + r,
                    ny1 = d.y - r,
                    ny2 = d.y + r;

                quadtree.visit(function (quad, x1, y1, x2, y2) {
                    if (quad.data && (quad.data !== d)) {
                        let x = d.x - quad.data.x,
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

        //sets defaults
        function setDefaults() {
            //set dimension
            width = diagram.plot.width - diagram.plot.left - diagram.plot.right;
            height = diagram.plot.height - diagram.plot.top - diagram.plot.bottom;

            //get min and max measure
            minMeasure = diagram.domains.minY;
            maxMeasure = diagram.domains.maxY;

            //set maximum bullet size
            if (!currentSerie.maxBulletSize)
                currentSerie.maxBulletSize = Math.sqrt(((width * height) / dataset.length) / Math.PI) - 5;

            //set minimum bullet size
            if (!currentSerie.minBulletSize)
                currentSerie.minBulletSize = (currentSerie.maxBulletSize * minMeasure) / maxMeasure;

            //set r scale to determine circle area
            rScale = d3.scalePow().exponent(0.5).domain([minMeasure, maxMeasure]).range([currentSerie.minBulletSize, currentSerie.maxBulletSize]);

            //generate the clusters due to dataset
            groups = e.getUniqueValues(dataset, currentSerie.groupField);
            clusters = new Array(groups.length);

            //create nodes
            nodes = d3.range(dataset.length).map(function (index) {
                //get current data
                let currentData = dataset[index],
                    radius = rScale(+currentData[currentSerie.measureField]);

                //check wether the radius less than 0
                if (radius < 0)
                    radius = 0.1;

                //set node
                let node = {
                    source: currentData[currentSerie.sourceField],
                    cluster: groups.indexOf(currentData[currentSerie.groupField]),
                    clusterName: currentData[currentSerie.groupField],
                    measure: +currentData[currentSerie.measureField],
                    r: radius
                };

                //iterate all additional fields
                if (diagram.additionalFields && diagram.additionalFields.length > 0) {
                    diagram.additionalFields.forEach(function (af) {
                        node[af.dataField] = currentData[af.dataField];
                    });
                }

                //set cluster
                if (!clusters[currentData.cluster] || (node.measure > clusters[currentData.cluster].measure))
                    clusters[currentData.cluster] = node;

                //return node
                return node;
            });
        }

        //renders the current diagram
        function renderDiagram() {
            //create circles
            circles = diagramG.append('g')
                .datum(nodes)
                .selectAll('.circle')
                .data(function (d) { return d; })
                .enter().append('circle')
                .attr('r', function (d) { return d.r; })
                .attr('cx', 0)
                .attr('cy', 0)
                .style('fill', function (d) {
                    //set slice color
                    if (currentSerie.groupField) {
                        if (diagram.legend.legendColors.length > 0) {
                            let groupColor = e.matchGroup(d.clusterName, diagram.legend.legendColors, 'color');
                            if (groupColor) {
                                d.sliceColor = groupColor;
                            } else {
                                d.sliceColor = d.cluster >= e.colors.length ? e.randColor() : e.colors[d.cluster];
                            }
                        }
                        else
                            d.sliceColor = d.cluster >= e.colors.length ? e.randColor() : e.colors[d.cluster];
                    } else {
                        if (diagram.legend.gradientColors[0] !== '')
                            d.sliceColor = diagram.legend.gradientColors[0];
                        else
                            d.sliceColor = d.cluster >= e.colors.length ? e.randColor() : e.colors[d.cluster];
                    }

                    //return slice color
                    return d.sliceColor;
                })
                .style('fill-opacity', 0.9)
                .on('mousemove', function (d, i) { diagram.showTooltip(diagram.getContent(d, currentSerie, diagram.tooltip.format)); })
                .on('mouseout', function (d, i) { diagram.hideTooltip(); })
                .call(d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended));

            //check whether the labels are enabled
            if (currentSerie.labelFormat) {
                //create texts
                nodeTexts = diagramG.selectAll('text')
                    .data(nodes).enter().append('text')
                    .attr('class', 'eve-force-tree-text')
                    .style('pointer-events', 'none')
                    .style('text-anchor', 'middle')
                    .style('fill', function (d) { return currentSerie.labelFontColor === 'auto' ? diagram.getAutoColor(d.sliceColor) : currentSerie.labelFontColor; })
                    .style('font-family', currentSerie.labelFontFamily)
                    .style('font-style', currentSerie.labelFontStyle === 'bold' ? 'normal' : currentSerie.labelFontStyle)
                    .style('font-weight', currentSerie.labelFontStyle === 'bold' ? 'bold' : 'normal')
                    .text(function (d) { return diagram.getContent(d, currentSerie, currentSerie.labelFormat) })
                    .style('font-size', function (d) {
                        //check whether the label font size is auto
                        if (currentSerie.labelFontSize === 'auto')
                            d.fontSize = Math.min(2 * d.r, (2 * d.r - 8) / Math.max(this.getComputedTextLength(), this.getBBox().height) * minFontSize);
                        else
                            d.fontSize = currentSerie.labelFontSize;

                        if (d.fontSize < minFontSize)
                            d.fontSize = minFontSize;

                        return d.fontSize + 'px';
                    })
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('dy', '.35em');
            }

            //create d3 force layout
            simulation = d3.forceSimulation(nodes)
                .alphaMin(0.04)
                .alphaDecay(0.05)
                .force("x", d3.forceX().strength(0.1))//groups.length <= 1 ? 0.1 : 0.0005))
                .force("y", d3.forceY().strength(0.1))//groups.length <= 1 ? 0.1 : 0.0005))
                .force("charge", groups.length <= 1 ? d3.forceManyBody(1) : null)
                .force("collision", collide)
                .force("cluster", clustering)
                .on("tick", ticked);

            //push the current simulation into stack
            diagram.simulations.push(simulation);

            //start simulation
            simulation.nodes(nodes);
        }

        //starts to initialize the diagram
        function initDiagram() {
            //set deault values to render diagram
            setDefaults();

            //create diagram g
            diagramG = diagram.svg.append('g')
                .attr('width', width)
                .attr('height', height)
                .attr('class', 'eve-vis-g')
                .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

            //now we can initialize the diagram
            renderDiagram();
        }

        //now we can initialize force
        initDiagram();

        //update diagram
        diagram.update = function (data) {
            //set diagram data
            diagram.data = data;
            dataset = data;

            //update domains and legend
            diagram.calculateDomain();
            diagram.updateLegend();

            //re-caluclate scales
            setDefaults();

            //remove g
            if (diagram.animation.effect) {
                //check whether the effect is fade
                if (diagram.animation.effect === 'fade') {
                    //remove with transition
                    diagramG.transition().duration(1000).style('opacity', 0).remove();
                } else if (diagram.animation.effect === 'dim') {
                    //remove with transition
                    diagramG.style('opacity', 0.15);
                } else if (diagram.animation.effect === 'add') {
                    //remove with transition
                    diagramG.style('opacity', 1);
                } else {
                    //remove immediately
                    diagramG.remove();
                }
            } else {
                //remove immediately
                diagramG.remove();
            }

            //re-append g
            diagramG = diagram.svg.append('g')
                .attr('width', width)
                .attr('height', height)
                .attr('class', 'eve-vis-g')
                .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

            //remove items
            renderDiagram();
        };

        //attach clear content method to chart
        diagram.clear = function () {
            //remove g from the content
            diagram.svg.selectAll('.eve-vis-g').remove();
        };

        //return abacus diagram
        return diagram;
    }

    //attach timeline method into the eve
    e.bubbleForce = function (options) {
        options.type = "bubbleForce";
        
        //remove stacked
        if (options.yAxis)
            options.yAxis.stacked = false;

        //stack the options to the visualizations stack
        e.visualizations.push(options);

        return new bubbleForce(options);
    };

    //attach timeline method into the eve
    e.bubbleDiagram = function (options) {
        options.type = "bubbleForce";

        //remove stacked
        if (options.yAxis)
            options.yAxis.stacked = false;

        //stack the options to the visualizations stack
        e.visualizations.push(options);

        return new bubbleForce(options);
    };
})(eve);