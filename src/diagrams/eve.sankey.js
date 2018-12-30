/*!
 * eve.sankey.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Base class for sankey diagram.
 */
(function (e) {
    //define sankey diagram class
    function sankey(options) {
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
            totalMeasure = 0,
            maxNodeLength = 0,
            maxTextLength = 0,
            autoMarginSides = 0,
            autoMarginTop = 0,
            margin = { left: 0, top: 0, bottom: diagram.margin.bottom, right: 0 },
            width = 0,
            height = 0,
            sankey = null,
            path = null,
            rects, axisLabels, labels,
            xPos = 0, yPos = 0,
            linkSVG = null,
            nodeSVG = null;

        //calculates scales and environmental variables
        function calculateScales() {
            //iterate nodes to create their colors
            diagram.data.nodes.forEach(function (n, i) {
                n.color = i >= e.colors.length ? e.randColor() : e.colors[i];
            });

            //set total measure
            totalMeasure = d3.sum(diagram.data.links, function (d) { return +d[currentSerie.measureField]; });
            maxNodeLength = d3.max(diagram.data.nodes, function (d) { return d.name.toString().length; });
            maxTextLength = maxNodeLength > totalMeasure.toString().length ? maxNodeLength : totalMeasure.toString().length;

            //set label font size
            if (currentSerie.labelFontSize === 'auto')
                currentSerie.labelFontSize = 11;

            //set label font color
            if (currentSerie.labelFontColor === 'auto')
                currentSerie.labelFontColor = '#333333';

            //calculate auto margins
            autoMarginSides = 10;
            autoMarginTop = diagram.xAxis.labelFormat ? diagram.xAxis.labelFontSize * 2 : 10;
            margin.left = autoMarginSides;
            margin.right = autoMarginSides;
            margin.top = autoMarginTop + diagram.xAxis.labelFontSize;
            margin.bottom = autoMarginTop;

            //calculate dimension
            width = diagram.plot.width - margin.left - margin.right;
            height = diagram.plot.height - margin.top - margin.bottom;
        }

        //animates diagram
        function animateDiagram() {
            //animate links
            linkSVG
                .attr('opacity', diagram.animation.effect === 'add' ? 0 : 1)
                .transition().duration(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr('opacity', 1)
                .attr('stroke', function (d) { return d.source.color; })
                .attr('stroke-width', function (d) { return Math.max(1, d.dy); });

            //animate nodes
            rects
                .attr('opacity', diagram.animation.effect === 'add' ? 0 : 1)
                .transition().duration(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr('opacity', 1)
                .attr('transform', function (d) { return 'translate(0,0)'; })
                .attr('height', function (d) {
                    return Math.abs(d.dy);
                })
                .attr('fill', function (d) { return d.color; })
                .attr('stroke', function (d) { return d3.rgb(d.color).darker(2); });

            //animate axis labels
            axisLabels
                .transition().duration(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr('transform', function (d) { return 'translate(0,' + (-1 * (diagram.xAxis.labelFontSize / 2)) + ')'; })

            //animate axis labels
            labels
                .style('text-anchor', function (d) {
                    return (d.x < width / 2) ? 'start' : 'end';
                })
                .transition().duration(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr('transform', function (d) {
                    xPos = d.x < width / 2 ? (sankey.nodeWidth() + 5) : -5;
                    yPos = (d.dy / 2);
                    return 'translate(' + xPos + ',' + yPos + ')';
                })
        }

        //initializes diagram and draw links
        function initDiagram() {
            //set sankey function and create paths and links
            sankey = d3.sankey().nodeWidth(36).nodePadding(5).size([width, height]);
            path = sankey.link();
            sankey.nodes(diagram.data.nodes).links(diagram.data.links).layout(32);

            //gets expressioned data value
            let getExpressionedDataValue = function (d) {
                let expValue = d.value;
                let children = (d.sourceLinks && d.sourceLinks.length) ? d.sourceLinks : d.targetLinks;

                if (children.length === 0)
                    return expValue;
                
                switch (currentSerie.expression) {
                    case "avg":
                        {
                            expValue = d.value / children.length; 

                            //get average value
                            var avgValue = diagram.data.averages[d.name];
                            if (avgValue != null)
                                expValue = avgValue;
                        }
                        break;
                    case "min":
                        {
                            expValue = d3.min(children, function (v) { return v.value; });
                            //get average value
                            var avgValue = diagram.data.averages[d.name];
                            if (avgValue != null)
                                expValue = avgValue;
                        }
                        break;
                    case "max":
                        {
                            expValue = d3.max(children, function (v) { return v.value; });
                            //get average value
                            var avgValue = diagram.data.averages[d.name];
                            if (avgValue != null)
                                expValue = avgValue;
                        }
                        break;
                }
                return expValue;
            };

            //create links
            linkSVG = diagramG
                .append('g')
                .selectAll('.eve-sankey-link')
                .data(diagram.data.links)
                .enter().append('path')
                .attr('class', 'eve-sankey-link')
                .style('stroke-opacity', 0.5)
                .style('fill', 'none')
                .style('fill-opacity', 0)
                .attr('d', path)
                .attr('stroke', function (d) { return d.source.color; })
                .attr('stroke-width', 1)
                .on('mousemove', function (d, i) {
                    //show tooltip
                    diagram.showTooltip(diagram.getContent(d, currentSerie, diagram.tooltip.format, d.source.name, d.target.name));
                })
                .on('mouseout', function (d, i) {
                    //hide tooltip
                    diagram.hideTooltip();
                })
                .sort(function (a, b) { return b.dy - a.dy; });

            //create nodes
            nodeSVG = diagramG
                .append('g')
                .selectAll('.eve-sankey-node')
                .data(diagram.data.nodes)
                .enter().append('g')
                .attr('class', 'eve-sankey-node')
                .attr('transform', function (d) {
                    xPos = d.x;
                    yPos = (isNaN(d.y) ? 0 : d.y);
                    return 'translate(' + xPos + ',' + yPos + ')';
                });

            //attach rectangles
            rects = nodeSVG.append('rect')
                .attr('width', sankey.nodeWidth())
                .attr('height', 0)
                .style('stroke-width', 1)
                .attr('fill', function (d) { return d.color; })
                .attr('stroke', function (d) { return d3.rgb(d.color).darker(0); })
                .on('mousemove', function (d, i) {
                    //update data value
                    d.expressionedDataValue = getExpressionedDataValue(d);
                    
                    //show value
                    diagram.showTooltip(diagram.getContent(d, currentSerie, (diagram.tooltip.format !== '' ? '{source}: {value}' : '')));
                })
                .on('mouseout', function (d, i) {
                    //hide tooltip
                    diagram.hideTooltip();
                });

            //attach axis labels
            axisLabels = nodeSVG.append('text')
                .style('fill', diagram.xAxis.labelFontColor)
                .style('font-size', diagram.xAxis.labelFontSize + 'px')
                .style('font-family', diagram.xAxis.labelFontFamily + ', Arial, Helvetica, Ubuntu')
                .style('font-style', diagram.xAxis.labelFontStyle === 'bold' ? 'normal' : diagram.xAxis.labelFontStyle)
                .style('font-weight', diagram.xAxis.labelFontStyle === 'bold' ? 'bold' : 'normal')
                .style('text-anchor', 'start')
                .text(function (d) {
                    return diagram.getContent(d, currentSerie, diagram.xAxis.labelFormat);
                });

            //attach labels
            labels = nodeSVG.append('text')
                .style('fill', currentSerie.labelFontColor)
                .style('font-size', currentSerie.labelFontSize + 'px')
                .style('font-family', currentSerie.labelFontFamily + ', Arial, Helvetica, Ubuntu')
                .style('font-style', currentSerie.labelFontStyle === 'bold' ? 'normal' : currentSerie.labelFontStyle)
                .style('font-weight', currentSerie.labelFontStyle === 'bold' ? 'bold' : 'normal')
                .style('text-anchor', 'start')
                .attr('dy', '.35em')
                .text(function (d) {
                    return diagram.getContent(d, currentSerie, currentSerie.labelFormat);
                });

            //attach drag
            nodeSVG.call(d3.drag()
                .subject(function (d) { return d; })
                .on('start', function (d) { this.parentNode.appendChild(this); })
                .on('drag', dragMove));
        }

        //create inner function to handle drag move
        function dragMove(d) {
            //select current node
            d3.select(this).attr("transform", "translate(" + d.x + "," + (d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))) + ")");

            //relayout sankey
            sankey.relayout();

            //update svg path
            linkSVG.attr("d", path);
        }

        //calculate environment
        calculateScales();

        //create diagram g
        let diagramG = diagram.svg.append('g')
            .attr('class', 'eve-vis-g')
            .attr('transform', 'translate(' + diagram.plot.left + ',' + margin.top + ')');

        //init diagram and animate
        initDiagram();
        animateDiagram();

        //update diagram
        diagram.update = function (data) {
            //set diagram data
            diagram.data = data;

            //recalculate scales
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
                .attr('class', 'eve-vis-g')
                .attr('transform', 'translate(' + diagram.plot.left + ',' + margin.top + ')');

            //animate diagram
            initDiagram();
            animateDiagram();
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
    e.sankey = function (options) {
        options.type = 'sankey';

        //remove stacked
        if (options.yAxis)
            options.yAxis.stacked = false;

        //stack the options to the visualizations stack
        e.visualizations.push(options);

        return new sankey(options);
    };
})(eve);