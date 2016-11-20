/*!
 * eve.networkForce.js
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
    function networkForce(options) {
        //declare needed variables
        var diagram = eve.base.init(options),
            currentSerie = diagram.series[0],
            simulation = null,
            nodeLinks, nodeCircles, textSVG,
            minMeasure = 0,
            maxMeasure = 0,
            rScale = null,
            colorScale = null,
            nodes = [],
            links = [],
            sources = [],
            targets = [],
            groups = [],
            node = {},
            currentSource = '',
            currentTarget = '',
            currentGroup = '',
            currentMeasure = 0,
            width = 0, height = 0;

        //calculates scales and environmental varaibles
        function calculateScales() {
            //clear items
            nodes = [];
            links = [];
            
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

            //create color scale
            colorScale = d3.scaleLinear().range(diagram.legend.gradientColors).domain([minMeasure, maxMeasure]);

            //get sources, targets and groups
            sources = e.getUniqueValues(diagram.data, currentSerie.sourceField);
            targets = e.getUniqueValues(diagram.data, currentSerie.targetField);
            groups = e.getUniqueValues(diagram.data, currentSerie.groupField);

            //create data
            links = diagram.data.map(function(d) {
                //create nodes
                currentSource = d[currentSerie.sourceField];
                currentTarget = d[currentSerie.targetField];
                currentGroup = d[currentSerie.groupField];
                currentMeasure = +d[currentSerie.measureField];

                //set source nodes
                if (findInNodes(currentSource) === -1) {
                    //create a node
                    node = {
                        id: currentSource,
                        group: groups.indexOf(currentGroup),
                        color: colorScale(currentMeasure)
                    };

                    //set node color if legend disabled
                    if(!diagram.legend.enabled)
                        node.color = node.group >= e.colors.length ? e.randColor() : e.colors[node.group];

                    //push current temporary node int the nodes
                    nodes.push(node);
                }

                //set target nodes
                if (findInNodes(currentTarget) === -1) {
                    //create a node
                    node = {
                        id: currentTarget,
                        group: groups.indexOf(currentGroup),
                        color: colorScale(currentMeasure)
                    };

                    //set node color if legend disabled
                    if(!diagram.legend.enabled)
                        node.color = node.group >= e.colors.length ? e.randColor() : e.colors[node.group]; 
                    
                    //push current temporary node int the nodes
                    nodes.push(node);
                }

                //return link data
                if(!isNaN(currentMeasure) && currentMeasure > 0) {
                    return {
                        source: currentSource,
                        target: currentTarget,
                        group: currentGroup,
                        measure: currentMeasure
                    };
                }
            });
        }

        //finds given value in nodes
        function findInNodes(v) {
            var ind = -1;
            nodes.forEach(function (n, i) {
                if (n.id === v)
                    ind = i;
            });
            return ind;
        }

        //initializes diaram and starts simulation
        function initDiagram() {
            //create d3 force layout
            simulation = d3.forceSimulation()
                .force("link", d3.forceLink().id(function (d) { return d.id; }))
                .force("charge", d3.forceManyBody())
                .velocityDecay(0.2)
                .force("x", d3.forceX())
                .force("y", d3.forceY())
                .force("center", d3.forceCenter(width / 2, height / 2));

            //create links
            nodeLinks = diagramG.append("g")
                .attr("class", "links")
                .selectAll("line")
                .data(links)
                .enter().append("line")
                .attr("stroke-width", function (d) { return rScale(d.measure); })
                .style('stroke', '#cccccc');

            //create circles
            nodeCircles = diagramG.append("g")
                .attr("class", "nodes")
                .selectAll("circle")
                .data(nodes)
                .enter().append("circle")
                .style('fill', function (d) { return d.color; })
                .style('stroke', 'none')
                .attr('r', currentSerie.maxBulletSize / 2)
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
                textSVG = diagramG.append('g').selectAll('text')
                    .data(nodes).enter().append('text')
                    .attr('class', 'pagos-force-texts')
                    .style('fill', currentSerie.labelFontColor)
                    .style('font-size', currentSerie.labelFontSize + 'px')
                    .style('font-family', currentSerie.labelFontFamily)
                    .style('font-style', currentSerie.labelFontStyle === 'bold' ? 'normal' : currentSerie.labelFontStyle)
                    .style('font-weight', currentSerie.labelFontStyle === 'bold' ? 'bold' : 'normal')
                    .style('text-anchor', 'start')
                    .text(function (d) { return currentSerie.labelFormat.replaceAll('{label}', d.id); });
            }

            //start nodes simulation
            simulation.nodes(nodes).on("tick", ticked);

            //start links simulation
            simulation.force("link").links(links);
        }

        //handles simulation ticked event
        function ticked() {
            //set links position
            nodeLinks
                .attr("x1", width / 2)
                .attr("y1", height / 2)
                .attr("x2", width / 2)
                .attr("y2", height / 2)
                .transition(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr("x1", function (d) { return d.source.x; })
                .attr("y1", function (d) { return d.source.y; })
                .attr("x2", function (d) { return d.target.x; })
                .attr("y2", function (d) { return d.target.y; });

            //set circles position
            nodeCircles
                .attr('cx', width / 2)
                .attr('cy', height / 2)
                .transition(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr("cx", function (d) { return d.x; })
                .attr("cy", function (d) { return d.y; });

            //check whether the labels are enabled
            if (currentSerie.labelFormat) {
                //create texts
                textSVG
                    .attr('x', width / 2)
                    .attr('y', height / 2)
                    .transition(diagram.animation.duration)
                    .ease(diagram.animation.easing.toEasing())
                    .delay(function (d, i) { return i * diagram.animation.delay; })
                    .attr('x', function (d) { return d.x + (currentSerie.maxBulletSize / 2) + 5; })
                    .attr('y', function (d) { return d.y + (currentSerie.labelFontSize / 2); });
            }
        }

        //handles dragstarted event
        function dragstarted(d) {
            if (!d3.event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        //handles dragges event
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
        var diagramG = diagram.svg.append('g')
            .attr('width', width)
            .attr('height', height);

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
            nodeCircles.remove();
            nodeLinks.remove();
            if (textSVG)
                textSVG.remove();

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
    e.networkForce = function (options) {
        return new networkForce(options);
    };
})(eve);