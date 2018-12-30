/*!
 * eve.force.js
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
    function force(options) {
        //remove legend
        if (options.legend) {
            options.legend.enabled = false;
        } else {
            options.legend = {
                enabled: false
            };
        }

        //declare needed variables
        let diagram = eve.initVis(options),
            currentSerie = diagram.series[0],
            width = 0, height = 0,
            root = null,
            autoLinkDistance = 0,
            currentIndex = 0,
            nodeSvg, linkSvg, simulation,
            minMeasure = 0, maxMeasure = 0,
            iteration = 0,
            rScale = null,
            currentColor = '',
            minFontSize = 8,
            nodes, links;

        diagram.simulations = [];

        //calculates scales and environmental varaibles
        function calculateScales() {
            //set dimension
            width = diagram.plot.width - diagram.plot.left - diagram.plot.right;
            height = diagram.plot.height - diagram.plot.top - diagram.plot.bottom;
            autoLinkDistance = Math.min(width, height) / 2 / 4;

            //create root
            root = d3.hierarchy(diagram.data);

            //get min and max measure
            minMeasure = diagram.domains.minY;
            maxMeasure = d3.max(diagram.data.children, function (d) { return +d.size; });

            //check whether the min and max radius is null
            if (!currentSerie.maxBulletSize)
                currentSerie.maxBulletSize = Math.sqrt(((width * height) / diagram.data.length) / Math.PI) - 5;
            if (!currentSerie.minBulletSize)
                currentSerie.minBulletSize = (currentSerie.maxBulletSize * minMeasure) / maxMeasure;

            //set r scale
            rScale = d3.scalePow().exponent(0.5).domain([minMeasure, maxMeasure]).range([currentSerie.minBulletSize, currentSerie.maxBulletSize]);

            //get nodes and links
            nodes = flatten(root);
            links = root.links();

            //set label position
            if (currentSerie.labelPosition === 'auto')
                currentSerie.labelPosition = 'outside';
        }

        //initializes diaram and starts simulation
        function initDiagram() {
            //create d3 force layout
            simulation = d3.forceSimulation()
                .force("link", d3.forceLink().id(function (d) { return d.id; }))
                .force("charge", d3.forceManyBody())
                .force("center", d3.forceCenter(width / 2, height / 2))
                .velocityDecay(root.links().length > 100 ? 0.9 : 0.2)
                .force("x", d3.forceX().strength(0.0005))
                .force("y", d3.forceY().strength(0.0005))
                .on('tick', ticked);
            diagram.simulations.push(simulation);
            //create tree layout
            setTreeLayout();
        }

        //sets tree layout
        function setTreeLayout() {
            //create links svg
            linkSvg = diagramG.selectAll(".eve-force-tree-link")
                .data(links, function (d) { return d.target.id; });

            //exit lik
            linkSvg.exit().remove();

            //create link lines
            let linkEnter = linkSvg.enter()
                .append("line")
                .attr('class', function (d) { return 'eve-force-tree-link eve-force-tree-link-' + d.source.id; })
                .style('stroke-width', '1px')
                .style('stroke', 'rgb(204,204,204)');

            //merge links
            linkSvg = linkEnter.merge(linkSvg);

            //create nodes svg
            nodeSvg = diagramG.selectAll(".eve-force-tree-node")
                .data(nodes, function (d) { return d.id; });

            //exit node
            nodeSvg.exit().remove();

            //create node
            let nodeEnter = nodeSvg.enter()
                .append("g")
                .attr('class', function (d) { return 'eve-force-tree-node eve-force-tree-node-' + d.id; })
                .on('click', nodeSelect)
                .on('dblclick', nodeClick)
                .call(d3.drag()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended));

            //create node circles
            nodeEnter.append("circle")
                .attr('r', function (d) {
                    //set radius
                    let rad = 0;

                    //check whether the node has size
                    if (d.data[currentSerie.sizeField] === undefined) {
                        //return size
                        rad = currentSerie.minBulletSize * 2;
                    } else {
                        rad = rScale(d.data[currentSerie.sizeField]);
                    }

                    //set data radius
                    d.cRadius = rad;

                    //return radius
                    return rad;
                })
                .style('fill', colorizeNode)
                .style('fill-opacity', 0.9)
                .style('stroke', colorizeNode)
                .style('stroke-opacity', 1)
                .style('stroke-width', '0px')
                .on('mousemove', function (d, i) {
                    //show tooltip
                    diagram.showTooltip(diagram.getContent(d, currentSerie, diagram.tooltip.format));
                })
                .on('mouseout', function (d, i) {
                    //hide tooltip
                    diagram.hideTooltip();
                });

            //check if labels are enabled
            if (currentSerie.labelFormat) {
                //create node texts
                nodeEnter.append("text")
                    .attr('class', function (d) { return 'eve-force-tree-text eve-force-tree-text-' + d.id; })
                    .attr("dy", ".35em")
                    .attr("x", function (d) {
                        //check if inside
                        if (currentSerie.labelPosition === 'inside')
                            return 0;
                        return d.children ? -8 : 8;
                    })
                    .style('pointer-events', 'none')
                    .style("text-anchor", function (d) {
                        if (currentSerie.labelPosition === 'inside')
                            return 'middle';
                        return d.children ? "end" : "start";
                    })
                    .style('fill', function (d, i) {
                        currentColor = colorizeNode(d, i);
                        return currentSerie.labelFontColor === 'auto' ? diagram.getAutoColor(currentColor) : currentSerie.labelFontColor;
                    })
                    .style('font-family', currentSerie.labelFontFamily)
                    .style('font-style', currentSerie.labelFontStyle === 'bold' ? 'normal' : currentSerie.labelFontStyle)
                    .style('font-weight', currentSerie.labelFontStyle === 'bold' ? 'bold' : 'normal')
                    .text(function (d) {
                        return diagram.getContent(d, currentSerie, currentSerie.labelFormat);
                    })
                    .style('font-size', function (d) {
                        //check whether the labels are inside
                        if (currentSerie.labelPosition === 'inside') {
                            d.fontSize = Math.min(2 * d.cRadius, (2 * d.cRadius - 8) / Math.max(this.getComputedTextLength(), this.getBBox().height) * minFontSize);
                        } else {
                            //return default font size
                            d.fontsize = currentSerie.labelFontSize === 'auto' ? minFontSize : currentSerie.labelFontSize;
                        }

                        if (d.fontSize < minFontSize)
                            d.fontSize = minFontSize;

                        return d.fontSize + 'px';
                    });
            }

            //merge node svgs
            nodeSvg = nodeEnter.merge(nodeSvg);

            //start nodes simulation
            simulation.nodes(nodes);

            //start links simulation
            simulation.force("link").links(links);
        }

        //create a fucntion to colorize nodes by data
        function colorizeNode(d) {
            //get current index from depth
            currentIndex = d.children ? d.depth : (d.depth + 1);

            //return relevant color
            return currentIndex >= e.colors.length ? e.randColor() : e.colors[currentIndex];
        }

        //flattens the root
        function flatten(root) {
            // hierarchical data to flat data for force layout
            let nodes = [];
            function recurse(node) {
                if (node.children) node.children.forEach(recurse);
                if (!node.id) node.id = ++iteration;
                else ++iteration;
                nodes.push(node);
            }
            recurse(root);
            return nodes;
        }

        //handles force simulation tick
        function ticked() {
            //re-place links
            linkSvg
                .attr("x1", width / 2)
                .attr("y1", height / 2)
                .attr("x2", width / 2)
                .attr("y2", height / 2)
                .attr('opacity', diagram.animation.effect === 'add' ? 0 : 1)
                .transition().duration(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr('opacity', 1)
                .attr("x1", function (d) { return d.source.x; })
                .attr("y1", function (d) { return d.source.y; })
                .attr("x2", function (d) { return d.target.x; })
                .attr("y2", function (d) { return d.target.y; });

            //re-place nodes
            nodeSvg
                .attr('opacity', diagram.animation.effect === 'add' ? 0 : 1)
                .attr("transform", 'translate(' + width / 2 + ',' + height / 2 + ')')
                .transition().duration(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr('opacity', 1)
                .attr("transform", function (d) { return 'translate(' + d.x + ',' + d.y + ')'; });
        }

        //create an select function for nodes
        function nodeSelect(d) {
            //check whether the default events prevented
            if (!d3.event.defaultPrevented) {
                //get all links specific to current node
                let currentLinks = diagramG.selectAll('.eve-force-tree-link-' + d.id),
                    currentNodes = diagramG.selectAll('.eve-force-tree-node-' + d.id),
                    currentTexts = null;

                //check whether the labels are enabled
                if (currentSerie.labelFormat)
                    currentTexts = diagramG.selectAll('.eve-force-tree-text-' + d.id);

                //set whether the current node is selected
                d.selected = !d.selected;

                //set to defaults all links
                linkSvg.style('stroke-width', '1px').style('stroke', 'rgb(204,204,204)');
                nodeSvg.style('fill-opacity', 0.9).style('stroke-opacity', 1);

                //check whether the current node is selected then highlight the links
                if (d.selected) {
                    //set opaque all nodes
                    nodeSvg.style('fill-opacity', 0.2).style('stroke-opacity', 0.2);

                    //highlight nodes
                    currentNodes.style('fill-opacity', 0.9).style('stroke-opacity', 1);

                    //check whether the current node has children
                    if (d.children) {
                        //check whether the children count > 0
                        if (d.children.length > 0) {
                            //iterate all children
                            d.children.forEach(function (cd) {
                                //select all child nodes
                                diagramG.selectAll('.eve-force-tree-node-' + cd.id).style('fill-opacity', 0.9).style('stroke-opacity', 1);

                                //check labels are enabled
                                if (currentSerie.labelFormat)
                                    diagramG.selectAll('.eve-force-tree-text-' + cd.id).style('fill-opacity', 1);
                            });
                        }
                    }

                    //highlight links
                    currentLinks.style('stroke', 'rgb(0,102,204)').style('stroke-width', '2px');

                    //check labels are enabled
                    if (currentSerie.labelFormat)
                        currentTexts.style('fill-opacity', 1);
                }
            }
        }

        //create an expand and collapse function for nodes
        function nodeClick(d) {
            if (d.children) {
                d._children = d.children;
                d.children = null;
                setTreeLayout();
                simulation.restart();
            } else {
                d.children = d._children;
                d._children = null;
                setTreeLayout();
                simulation.restart();
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

        //calculate envrionment
        calculateScales();

        //create diagram g
        let diagramG = diagram.svg.append('g')
            .attr('width', width)
            .attr('height', height)
            .attr('class', 'eve-vis-g');

        //initialize diagram
        initDiagram();

        //update diagram
        diagram.update = function (data) {
            //set diagram data
            diagram.data = data;

            //re-caluclate scales
            diagram.calculateDomain();
            calculateScales();

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
                .attr('class', 'eve-vis-g');

            //reinit
            initDiagram();
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
    e.force = function (options) {
        options.masterType = 'tree';
        options.type = "force";

        //remove stacked
        if (options.yAxis)
            options.yAxis.stacked = false;

        //stack the options to the visualizations stack
        e.visualizations.push(options);

        return new force(options);
    };
})(eve);