/*!
 * eve.sunburst.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Base class for sunburst diagram.
 */
(function (e) {
    //define sunburst diagram class
    function sunburst(options) {
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
            maxTextLength = 0,
            autoMargin = 0,
            margin = { left: 0, top: 0, bottom: 0, right: 0 },
            width = 0,
            height = 0,
            diameter = 0,
            partitions = null,
            hierarchical = null,
            root = null,
            scaleColor = null,
            xScale = null,
            yScale = null,
            arc = null,
            tempArc,
            currentAncestors = null,
            currentColor = '',
            paths = null,
            labels = null;

        //calculates scales and environmental variables
        function calculateScales() {
            //create root
            hierarchical = d3.hierarchy(diagram.data)
                .each(function (d) { if (/^other[0-9]+$/.test(d.data[currentSerie.labelField])) d.data[currentSerie.labelField] = null; })
                .sum(function (d) { return +d[currentSerie.sizeField]; })
                .sort(function (a, b) { return b.value - a.value; });

            //get max text length
            maxTextLength = d3.max(hierarchical.descendants(), function (d) {
                return diagram.getContent(d, currentSerie, currentSerie.labelFormat).toString().length;
            });

            //set font size
            if (currentSerie.labelFontSize === 'auto')
                currentSerie.labelFontSize = 11;

            //calculate margins and dimensions
            autoMargin = currentSerie.labelFormat ? ((currentSerie.labelFontSize * (maxTextLength)) + 1) : 10;
            margin.left = diagram.margin.left + autoMargin;
            margin.right = diagram.margin.right + autoMargin;
            margin.top = diagram.margin.top;
            margin.bottom = diagram.margin.bottom;
            width = diagram.plot.width - margin.left - margin.right;
            height = diagram.plot.height - margin.top - margin.bottom;
            diameter = Math.abs(Math.min(diagram.plot.width - autoMargin, diagram.plot.height - autoMargin) / 2);

            //create partitions
            partitions = d3.partition().size([360, diameter]).padding(0);

            //create root data
            root = d3.hierarchy(diagram.data, function (d) { return d.children; }).sum(function (d) { return d.children ? 0 : d.size; });

            //update root with partitions
            partitions(root);
            
            //create scales
            xScale = d3.scaleLinear().domain([0, 360]).range([0, Math.PI * 2]).clamp(true);
            scaleColor = d3.scaleOrdinal(e.colors);

            //create arc
            arc = d3.arc()
                .startAngle(function (d) { return xScale(d.x0); })
                .endAngle(function (d) { return xScale(d.x1); })
                .innerRadius(function (d) { return d.y0; })
                .outerRadius(function (d) { return 10; });

            //create arc
            tempArc = d3.arc()
                .startAngle(function (d) { return xScale(d.x0); })
                .endAngle(function (d) { return xScale(d.x1); })
                .innerRadius(function (d) { return d.y0; })
                .outerRadius(function (d) { return d.y1; });
        }

        //animates diagram
        function animateDiagram() {
            //update arc
            arc = d3.arc()
                .startAngle(function (d) { return xScale(d.x0); })
                .endAngle(function (d) { return xScale(d.x1); })
                .innerRadius(function (d) { return d.y0; })
                .outerRadius(function (d) { return d.y1; });

            //update paths
            paths
                .attr('opacity', diagram.animation.effect === 'add' ? 0 : 1)
                .transition().duration(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr('opacity', 1)
                .attr('d', arc);

            //remove paths
            paths.exit().remove();

            //animate labels
            labels
                .attr('opacity', diagram.animation.effect === 'add' ? 0 : 1)
                .transition().duration(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr('opacity', 1)
                .attr('x', function (d) { return xScale(d.y0); })
                .attr('transform', function (d) {
                    //calculate rotation
                    if (d.depth > 0) {
                        //get center of the arc
                        let centroid = tempArc.centroid(d);

                        //return translation
                        return 'translate(' + centroid + ')rotate(' + getAngle(d, true) + ')';
                    } else {
                        return null;
                    }
                });

            //remove labels
            labels.exit().remove();
        }

        //initialize diagram and draw sunburst
        function initDiagram() {
            //gets expressioned data value
            let getExpressionedDataValue = function (d) {
                let expValue = d.value;
                let children = d.children ? d.children : [];

                if (children.length === 0)
                    return expValue;

                switch (currentSerie.expression) {
                    case "avg":
                        {
                            expValue = d.value / children.length;
                            if (diagram.data.averages[d.data.name] != null)
                                expValue = +diagram.data.averages[d.data.name];
                        }
                        break;
                    case "min":
                        {
                            expValue = d3.min(children, function (v) { return v.value; });
                            if (diagram.data.averages[d.data.name] != null)
                                expValue = +diagram.data.averages[d.data.name];
                        }
                        break;
                    case "max":
                        {
                            expValue = d3.max(children, function (v) { return v.value; });
                            if (diagram.data.averages[d.data.name] != null)
                                expValue = +diagram.data.averages[d.data.name];
                        }
                        break;
                }
                return expValue;
            };

            //create paths
            paths = diagramG.selectAll('path')
                .data(root.descendants())
                .enter().append('path')
                .attr('display', function (d) { return d.depth ? null : 'none'; })
                .attr('d', arc)
                .attr('class', 'eve-sunburst-node')
                .attr('stroke', 'rgb(255,255,255)')
                .attr('fill', function (d) { return scaleColor((d.children ? d : d.parent).data.name); })
                .attr('fill-rule', 'evenodd')
                .on('mousemove', function (d, i) {
                    //get current ancestors
                    currentAncestors = getNodeAncestors(d);

                    //select all paths and decrease opacity
                    diagramG.selectAll('.eve-sunburst-node').style('opacity', 0.3);

                    //select current node
                    diagramG.selectAll('.eve-sunburst-node')
                        .filter(function (node) { return (currentAncestors.indexOf(node) >= 0); })
                        .style('opacity', 1);

                    //update data value
                    d.expressionedDataValue = getExpressionedDataValue(d);
                    
                    //show tooltip
                    diagram.showTooltip(diagram.getContent(d, currentSerie, diagram.tooltip.format));
                })
                .on('mouseout', function (d, i) {
                    //select all paths and decrease opacity
                    diagramG.selectAll('.eve-sunburst-node').style('opacity', 1);

                    //hide tooltip
                    diagram.hideTooltip();
                });

            //create labels
            labels = diagramG.selectAll('text')
                .data(root.descendants())
                .enter().append('text')
                .style('fill', function (d) {
                    currentColor = scaleColor((d.children ? d : d.parent).data.name);
                    return currentSerie.labelFontColor === 'auto' ? d3.color(currentColor).brighter(5) : currentSerie.labelFontColor;
                })
                .style('font-size', currentSerie.labelFontSize + 'px')
                .style('font-family', currentSerie.labelFontFamily)
                .style('font-style', currentSerie.labelFontStyle === 'bold' ? 'normal' : currentSerie.labelFontStyle)
                .style('font-weight', currentSerie.labelFontStyle === 'bold' ? 'bold' : 'normal')
                .attr('text-anchor', 'middle')
                .text(function (d) {
                    return diagram.getContent(d, currentSerie, currentSerie.labelFormat);
                })
                .attr('dx', 0)
                .attr('dy', '.5em')
                .attr('x', function (d) { return xScale(d.y0); })
                .attr('transform', function (d) {
                    //calculate rotation
                    if (d.depth > 0) {
                        //get center of the arc
                        let centroid = arc.centroid(d);

                        //return translation
                        return 'translate(' + centroid + ')rotate(' + getAngle(d, true) + ')';
                    } else {
                        return null;
                    }
                });
        }

        //gets ancestors of the given node
        function getNodeAncestors(node) {
            //declare variables
            let path = [],
                current = node;

            //loop parent
            while (current.parent) {
                //unshift current from path
                path.unshift(current);

                //set current as parent
                current = current.parent;
            }

            //return path
            return path;
        }

        //gets text angle
        function getAngle(d, isInit) {
            let thetaDeg = 0;

            if (isInit)
                thetaDeg = (180 / Math.PI * (arc.startAngle()(d) + arc.endAngle()(d)) / 2 - 90);
            else
                thetaDeg = (180 / Math.PI * (tempArc.startAngle()(d) + tempArc.endAngle()(d)) / 2 - 90);

            return (thetaDeg > 90) ? thetaDeg - 180 : thetaDeg;
        }

        //calculate environment
        calculateScales();

        //create diagram g
        let diagramG = diagram.svg.append('g')
            .attr('class', 'eve-vis-g')
            .attr('transform', 'translate(' + (diagram.plot.width / 2) + ',' + (height / 2) + ')');

        //initialize diagram
        initDiagram();
        animateDiagram();

        //update diagram
        diagram.update = function (data) {
            //set diagram data
            diagram.data = data;

            //re-calculate scales
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
                .attr('transform', 'translate(' + (diagram.plot.width / 2) + ',' + (height / 2) + ')');

            //update data
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
    e.sunburst = function (options) {
        options.type = 'sunburst';

        //remove stacked
        if (options.yAxis)
            options.yAxis.stacked = false;

        //stack the options to the visualizations stack
        e.visualizations.push(options);

        return new sunburst(options);
    };
})(eve);