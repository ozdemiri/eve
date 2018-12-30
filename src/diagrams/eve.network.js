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
        let diagram = eve.initVis(options),
            currentSerie = diagram.series[0],
            simulation = null,
            nodeLinks, nodeCircles, textSVG,
            minMeasure = Number.MAX_VALUE,
            maxMeasure = Number.MIN_VALUE,
            rScale = null,
            colorScale = null,
            nodes = [],
            links = [],
            sources = [],
            targets = [],
            groups = [],
            measures = {},
            node = {},
            currentSource = '',
            currentTarget = '',
            currentGroup = '',
            currentMeasure = 0,
            minFontSize = 8,
            radius = currentSerie.maxBulletSize / 2,
            currentColor = '',
            width = 0, height = 0;

        //clear simulations
        diagram.simulations = [];

        //gets node class
        let getNodeClass = function (d) {
            let nodeID = d.id.toString().toLowerCase().replaceAll(" ", "_");
            return "nodes node_" + nodeID;
        };

        //gets link class
        let getLinkClass = function (d) {
            let sourceID = d.source.toString().toLowerCase().replaceAll(" ", "_");
            let targetID = d.target.toString().toLowerCase().replaceAll(" ", "_");
            return "links link_" + sourceID + " link_" + targetID;
        };

        //handles node click
        let handleNodeClick = function (d) {
            //set whether the sliced clicked
            if (!d.clicked) {
                d.clicked = true;
            } else {
                d.clicked = null;
            }

            //get node id
            let nodeID = d.id.toString().toLowerCase().replaceAll(" ", "_");

            //dim the links and nodes
            nodeLinks.attr("opacity", 0.1);
            nodeCircles.attr("opacity", 0.1);

            //check if its clicked
            if (d.clicked) {
                //show selected links and nodes
                diagramG.selectAll(".link_" + nodeID).attr("opacity", 1);
                diagramG.selectAll(".node_" + nodeID).attr("opacity", 1);

                //iterate all links to find target position
                diagramG.selectAll(".link_" + nodeID).each(function () {
                    let sourceID = arguments[0].sourceValue.toString().toLowerCase().replaceAll(" ", "");
                    let targetID = arguments[0].targetValue.toString().toLowerCase().replaceAll(" ", "");
                    diagramG.selectAll(".node_" + targetID).attr("opacity", 1);
                    diagramG.selectAll(".node_" + sourceID).attr("opacity", 1);
                });
            } else {
                //dim the links and nodes
                nodeLinks.attr("opacity", 1);
                nodeCircles.attr("opacity", 1);
            }
        };

        //gets dataset for the selected source and target
        let getDataValue = function (sourceVal, targetVal) {
            //get filtered sources and measure value
            let filteredData = diagram.data.filter(function (d) {
                return (d[currentSerie.sourceField] === sourceVal && d[currentSerie.targetField] === targetVal) || (d[currentSerie.sourceField] === targetVal && d[currentSerie.targetField] === sourceVal);
            });
            let dataVal = 0;
            
            switch (currentSerie.expression) {
                case "sum":
                    {
                        dataVal = d3.sum(filteredData, function (d) { return d[currentSerie.measureField]; });
                    }
                    break;
                case "avg":
                    {
                        dataVal = d3.mean(filteredData, function (d) { return d[currentSerie.measureField]; });
                    }
                    break;
                case "min":
                    {
                        dataVal = d3.min(filteredData, function (d) { return d[currentSerie.measureField]; });
                    }
                    break;
                case "max":
                    {
                        dataVal = d3.max(filteredData, function (d) { return d[currentSerie.measureField]; });
                    }
                    break;
                default:
                    {
                        dataVal = filteredData.length;
                    }
                    break;
            }
            return dataVal;
        };

        //calculates scales and environmental varaibles
        function calculateScales() {
            //clear items
            nodes = [];
            links = [];

            //set dimension
            width = diagram.plot.width - diagram.plot.left - diagram.plot.right;
            height = diagram.plot.height - diagram.plot.top - diagram.plot.bottom;

            //get sources, targets and groups
            sources = e.getUniqueValues(diagram.data, currentSerie.sourceField);
            targets = e.getUniqueValues(diagram.data, currentSerie.targetField);
            groups = e.getUniqueValues(diagram.data, currentSerie.groupField);

            //calculates measures
            let calculateMeasures = function () {
                //iterate all sources to set measures
                sources.forEach(function (s) {
                    //get filtered sources and measure value
                    let filteredSources = diagram.data.filter(function (d) { return d[currentSerie.sourceField] === s; });
                    let measureValue = d3.sum(filteredSources, function (d) { return +d[currentSerie.measureField]; });

                    //set measure
                    measures[s] = measureValue;

                    //check whether the measure value is less than min value
                    if (measures[s] < minMeasure)
                        minMeasure = measures[s];

                    //check whether the measure value is greater than max value
                    if (measures[s] > maxMeasure)
                        maxMeasure = measures[s];
                });

                //iterate all targets to set measures
                targets.forEach(function (s) {
                    //get filtered sources and measure value
                    let filteredTargets = diagram.data.filter(function (d) { return d[currentSerie.targetField] === s; });
                    let measureVal = d3.sum(filteredTargets, function (d) { return +d[currentSerie.measureField]; });

                    //set measure
                    if (measures[s])
                        measures[s] += measureVal;
                    else
                        measures[s] = measureVal;

                    //check whether the measure value is less than min value
                    if (measures[s] < minMeasure)
                        minMeasure = measures[s];

                    //check whether the measure value is greater than max value
                    if (measures[s] > maxMeasure)
                        maxMeasure = measures[s];
                });

                //set max bullet size
                if (!currentSerie.maxBulletSize)
                    currentSerie.maxBulletSize = Math.sqrt(((width * height) / diagram.data.length) / Math.PI) - 5;

                //set min bullet size
                if (!currentSerie.minBulletSize)
                    currentSerie.minBulletSize = (currentSerie.maxBulletSize * minMeasure) / maxMeasure;

                //set r scale for circle diameters
                rScale = d3.scalePow().exponent(0.5).domain([minMeasure, maxMeasure]).range([currentSerie.minBulletSize, currentSerie.maxBulletSize]);

                //create color scale
                colorScale = d3.scaleLinear().range(diagram.legend.gradientColors).domain([minMeasure, maxMeasure]);
            };

            //creates nodes and links
            let createNodesAndLinks = function () {
                //declare needed variables
                let nodeNames = [];

                //iterate all data to set nodes and links
                for (let i = 0; i < diagram.data.length; i++) {
                    let currentData = diagram.data[i];
                    let sourceValue = currentData[currentSerie.sourceField];
                    let targetValue = currentData[currentSerie.targetField];
                    let measureValue = +currentData[currentSerie.measureField];
                    let groupValue = currentSerie.groupField ? currentData[currentSerie.groupField] : "";
                    let groupIndex = (groups.length > 0 && groupValue) ? groups.indexOf(groupValue) : 0;
                    let nodeColor = colorScale(measureValue);
                    let expValue = getDataValue(sourceValue, targetValue);

                    //set current source value as node
                    if (nodeNames.indexOf(sourceValue) === -1) {
                        //set current node
                        let currentNode = {
                            id: sourceValue,
                            group: groupIndex,
                            measure: measures[sourceValue],
                            color: colorScale(measures[sourceValue]),
                            sourceValue: sourceValue,
                            targetValue: targetValue,
                            groupValue: groupValue,
                            measureValue: measureValue
                        };

                        //set node color
                        nodeColor = groupIndex >= e.colors.length ? e.randColor() : e.colors[groupIndex];

                        //check whether the legend is not enabled
                        if (!diagram.legend.enabled)
                            currentNode.color = nodeColor;

                        //push to stack
                        nodes.push(currentNode);
                        nodeNames.push(sourceValue);
                    }

                    //set current target value as node
                    if (nodeNames.indexOf(targetValue) === -1) {
                        //set current node
                        let currentNode = {
                            id: targetValue,
                            group: groupIndex,
                            measure: measures[targetValue],
                            color: colorScale(measures[targetValue]),
                            sourceValue: sourceValue,
                            targetValue: targetValue,
                            groupValue: groupValue,
                            measureValue: measureValue
                        };

                        //set node color
                        nodeColor = groupIndex >= e.colors.length ? e.randColor() : e.colors[groupIndex];

                        //check whether the legend is not enabled
                        if (!diagram.legend.enabled)
                            currentNode.color = nodeColor;

                        //push to stack
                        nodes.push(currentNode);
                        nodeNames.push(targetValue);
                    }

                    //create the link
                    links.push({
                        source: sourceValue,
                        target: targetValue,
                        measure: measureValue,
                        sourceValue: sourceValue,
                        targetValue: targetValue,
                        measureValue: measureValue,
                        groupValue: groupValue,
                        value: i,
                        expressionedDataValue: currentSerie.expression ? expValue : measureValue
                    });
                }

                //sort nodes
                nodes.sort(function (a, b) {
                    //extract the type of the value
                    let valueType = typeof a.id;
                    if (valueType === "string") {
                        if (a.id < b.id) { return -1; } if (a.id > b.id) { return 1; } return 0;
                    } else if (valueType === "number") {
                        return a.id - b.id;
                    } else {
                        return new Date(a.id) - new Date(b.id);
                    }
                });

                //sort links
                links.sort(function (a, b) {
                    //extract the type of the value
                    let valueType = typeof a.source;
                    if (valueType === "string") {
                        if (a.source < b.source) { return -1; } if (a.source > b.source) { return 1; } return 0;
                    } else if (valueType === "number") {
                        return a.source - b.source;
                    } else {
                        return new Date(a.source) - new Date(b.source);
                    }
                });
            };

            //create nodes and links
            calculateMeasures();
            createNodesAndLinks();
        }

        //initializes diaram and starts simulation
        function initDiagram() {
            //create d3 force layout
            simulation = d3.forceSimulation()
                .force("link", d3.forceLink().id(function (d) { return d.id; }))
                .force("charge", d3.forceManyBody())
                .force("center", d3.forceCenter(width / 2, height / 2));

            //add to simulations
            diagram.simulations.push(simulation);

            //create links
            nodeLinks = diagramG.append("g")
                .selectAll("line")
                .data(links)
                .enter().append("line")
                .attr("class", getLinkClass)
                .style("stroke-width", function (d) { return rScale(d.measure); })
                .style("stroke", "rgb(204,204,204)")
                .on("mousemove", function (d, i) {
                    //show tooltip
                    diagram.showTooltip(diagram.getContent(d, currentSerie, diagram.tooltip.format));
                })
                .on("mouseout", function (d, i) {
                    //hide tooltip
                    diagram.hideTooltip();
                })

            //create circles
            nodeCircles = diagramG.append("g")
                .selectAll("circle")
                .data(nodes)
                .enter().append("circle")
                .attr("class", getNodeClass)
                .style("fill", function (d) { return d.color; })
                .style("stroke", "none")
                .attr("r", function (d) { return rScale(d.measure); })
                .on("click", handleNodeClick)
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
                    .style('pointer-events', 'none')
                    .style("text-anchor", function (d) {
                        if (currentSerie.labelPosition === 'inside')
                            return 'middle';
                        return d.children ? "end" : "start";
                    })
                    .style('fill', function (d) {
                        currentColor = d.color;
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
                        if (currentSerie.labelFontSize === 'auto') {
                            radius = rScale(d.measure);
                            d.fontSize = Math.min(2 * radius, (2 * radius - 8) / Math.max(this.getComputedTextLength(), this.getBBox().height) * minFontSize);
                        } else {
                            //return default font size
                            d.fontSize = currentSerie.labelFontSize;
                        }

                        if (d.fontSize < minFontSize)
                            d.fontSize = minFontSize;

                        //return font size
                        return d.fontSize + 'px';
                    })
                    .style("opacity", function (d) {
                        //get computed length of the text
                        let compLength = this.getBBox().width;
                        let circleArea = 2 * rScale(d.measure);
                        if (circleArea > compLength)
                            return 1;
                        return 0;
                    });
            }

            //start nodes simulation
            simulation.nodes(nodes).on("tick", ticked);

            //start links simulation
            simulation.force("link").links(links);
        }

        //handles dragstarted event
        function dragstarted(d) {
            if (!d3.event.active)
                simulation.alphaTarget(0.05).restart();

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

        //handles simulation ticked event
        function ticked() {
            //set links position
            nodeLinks
                //.attr('opacity', 1)
                .attr("x1", function (d) { return d.source.x; })
                .attr("y1", function (d) { return d.source.y; })
                .attr("x2", function (d) { return d.target.x; })
                .attr("y2", function (d) { return d.target.y; });

            //set circles position
            nodeCircles
                //.attr('opacity', 1)
                .attr("cx", function (d) { return d.x; })
                .attr("cy", function (d) { return d.y; });

            //check whether the labels are enabled
            if (currentSerie.labelFormat) {
                //create texts
                textSVG
                    .attr('x', function (d) { return d.x - this.getBBox().width / 2; })
                    .attr('y', function (d) { return d.y + d.fontSize / 2 - 2; });
            }
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

            //update domains and legend
            diagram.calculateDomain();
            diagram.updateLegend();

            //re-caluclate scales
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

            //remove items
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
    e.networkForce = function (options) {
        options.type = "networkForce";

        //remove stacked
        if (options.yAxis)
            options.yAxis.stacked = false;

        //stack the options to the visualizations stack
        e.visualizations.push(options);

        return new networkForce(options);
    };

    //attach timeline method into the eve
    e.networkDiagram = function (options) {
        options.type = "networkForce";

        //remove stacked
        if (options.yAxis)
            options.yAxis.stacked = false;

        //stack the options to the visualizations stack
        e.visualizations.push(options);

        return new networkForce(options);
    };
})(eve);