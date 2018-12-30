/*!
 * eve.circlePacking.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Base class for circlePacking diagram.
 */
(function (e) {
    //define circlePacking diagram class
    function circlePacking(options) {
        //declare needed variables
        let that = this,
            diagram = eve.initVis(options),
            currentSerie = diagram.series[0],
            margin = (diagram.margin.left + diagram.margin.right + diagram.margin.bottom + diagram.margin.top) / 4,
            width = diagram.plot.width - diagram.plot.left - diagram.plot.right,
            height = diagram.plot.height - diagram.plot.top - diagram.plot.bottom,
            diameter = Math.min(width, height),
            pack = null,
            root = null,
            focus = null,
            maxDepth = 0,
            nodes = null,
            view = null,
            circles = null,
            labels = null,
            selectedNode = null,
            minFontSize = 8,
            currentColor = '',
            xPos = 0, yPos = 0,
            scaleColor = null;

        //calculates scales and circle packing environment
        function calculateScales() {
            //calculate dimensions
            width = diagram.plot.width - diagram.plot.left - diagram.plot.right;
            height = diagram.plot.height - diagram.plot.top - diagram.plot.bottom;
            diameter = Math.min(width, height);

            //create pack
            pack = d3.pack().padding(2).size([diameter - margin, diameter - margin]);

            //create root
            root = d3.hierarchy(diagram.data)
                .each(function (d) {
                    if (/^other[0-9]+$/.test(d.data[currentSerie.labelField]))
                        d.data[currentSerie.labelField] = null;
                })
                .sum(function (d) { return +d[currentSerie.sizeField]; })
                .sort(function (a, b) { return b.value - a.value; });

            //create color domain. this required for 3 or more color legends
            let minD = -1,
                maxD = 5,
                colorDomain = d3.range(minD, maxD, ((maxD - minD) / (diagram.legend.gradientColors.length - 1)));

            colorDomain.push(maxD);
            
            //create color scale
            scaleColor = d3.scaleLinear().range(diagram.legend.gradientColors).domain(colorDomain);
            
            //set environmental values
            focus = root;
            nodes = pack(root);

            //iterate all nodes to set max depth
            nodes.each(function (node) {
                if (node.depth > maxDepth)
                    maxDepth = node.depth;
            });
        }

        //initializes diagram
        function initDiagram() {
            //create circles
            circles = diagramG.selectAll('circle')
                .data(root.descendants())
                .enter().append('circle')
                .attr('class', function (d) { return d.parent ? d.children ? 'eve-cp-node' : 'eve-cp-node node--leaf' : 'eve-cp-node node--root'; })
                .style('cursor', 'pointer')
                .style('fill', function (d) {
                    if (d.children) {
                        if (d.depth === 0)
                            return scaleColor(maxDepth);
                        else
                            return scaleColor(d.depth);
                    } else {
                        return null;
                    }
                })
                .on('click', function (d) {
                    //check the current item
                    if (focus !== d) {
                        if (d.depth == maxDepth)
                            zoom(d.parent);
                        else
                            zoom(d);

                        //stop defaut
                        d3.event.stopPropagation();
                    }

                    //raise click event
                    if (diagram.sliceClick)
                        diagram.sliceClick(d.data);
                })
                .on('mousemove', function (d) {
                    if (d.data.children)
                        d.data._measureValue = d3.sum(d.data.children, function (a) { return a.size; });
                    else
                        d.data._measureValue = d.data.size;

                    //show tooltip
                    diagram.showTooltip(diagram.getContent(d, currentSerie, diagram.tooltip.format));
                })
                .on('mouseout', function (d) {
                    //hide tooltip
                    diagram.hideTooltip();
                });

            //create labels
            labels = diagramG.selectAll('text')
                .data(root.descendants())
                .enter().append('text')
                .attr('class', 'eve-circlepacking-labels')
                .style('text-shadow', '0 1px 0 #fff, 1px 0 0 #fff, 0 -1px 0 #fff, -1px 0 0 #fff')
                .style('pointer-events', 'none')
                .style('text-anchor', 'middle')
                .style('fill', function (d) {
                    //set auto color
                    if (currentSerie.labelFontColor === 'auto') {
                        if (d.children) {
                            if (d.depth === 0)
                                currentColor = scaleColor(maxDepth);
                            else
                                currentColor = scaleColor(d.depth);

                            //return font color
                            return diagram.getAutoColor(currentColor);
                        } else {
                            return '#333333';
                        }
                    } else {
                        return currentSerie.labelFontColor;
                    }
                })
                .style('font-family', currentSerie.labelFontFamily)
                .style('font-style', currentSerie.labelFontStyle === 'bold' ? 'normal' : currentSerie.labelFontStyle)
                .style('font-weight', currentSerie.labelFontStyle === 'bold' ? 'bold' : 'normal')
                .text(function (d) {
                    if (d.data.children)
                        d.data._measureValue = d3.sum(d.data.children, function (a) { return a.size; });
                    else
                        d.data._measureValue = d.data.size;

                    //return text content
                    return diagram.getContent(d, currentSerie, currentSerie.labelFormat);
                })
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
                .attr('transform', 'translate(0,0)')
                .attr('dy', '.35em');

            //set selcted node
            selectedNode = diagramG.selectAll('circle');

            //zoom
            zoomTo([root.x, root.y, root.r * 2 + margin]);
        }

        //internal zoom function
        function zoom(d) {
            //set focus
            let focus0 = focus; focus = d,
                descendantsData = root.descendants();

            //set transition
            let transition = d3.transition()
                .duration(d3.event.altKey ? 7500 : 750)
                .tween('zoom', function (d) {
                    //declare interpolation
                    let i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + margin]);

                    //return zoom function
                    return function (t) {
                        zoomTo(i(t));
                    };
                });

            //hide all texts
            labels
                .style('fill-opacity', 0);

            //zoom texts
            transition
                .selectAll('.eve-circlepacking-labels')
                .filter(function (d) {
                    return d.parent === focus || this.style.display === 'inline';
                })
                .style('fill-opacity', function (d) {
                    return d.parent === focus ? 1 : 0;
                })
                .on('start', function (d) {
                    if (d.parent === focus)
                        this.style.display = 'inline';
                })
                .on('end', function (d) {
                    if (d.parent !== focus)
                        this.style.display = 'none';
                });
        }

        //internal zoomto function
        function zoomTo(v) {
            //declare zoom by
            let k = diameter / v[2];

            //set view
            view = v;

            //set node transformation
            selectedNode
                .attr('transform', function (d) {
                    return 'translate(' + (d.x - v[0]) * k + ',' + (d.y - v[1]) * k + ')';
                });

            //change radius of the current circle
            circles
                .attr('opacity', diagram.animation.effect === 'add' ? 0 : 1)
                .transition().duration(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr('opacity', 1)
                .attr('r', function (d) { return d.r * k; });

            //change labels
            labels
                .style('fill-opacity', function (d) {
                    return d.parent === focus ? 1 : 0;
                })
                .transition().duration(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .style("font-size", function (d) {
                    //check whether the label font size is auto
                    let fontSize = Math.min(2 * d.r, (2 * d.r - 8) / this.getComputedTextLength() * 24);

                    if (fontSize < minFontSize)
                        fontSize = minFontSize;

                    //check depth of the label
                    if (d.depth > 1)
                        d.fontSize = fontSize;

                    return d.fontSize + "px";
                })
                .attr('transform', function (d) {
                    //set x and y pos
                    xPos = (d.x - v[0]) * k;
                    yPos = (d.y - v[1]) * k;

                    //return new translation
                    return 'translate(' + xPos + ',' + yPos + ')';
                });
        }

        //calculate scales and draw diagram
        calculateScales();

        //create diagram g
        let diagramG = diagram.svg.append('g')
            .attr('transform', 'translate(' + diagram.plot.left + ',' + diagram.plot.top + ')')
            .append('svg')
            .attr('width', width - diagram.plot.left)
            .attr('height', height)
            .attr('fill', diagram.backColor)
            .attr('stroke', 'none')
            .append('g')
            .attr('class', 'eve-vis-g')
            .attr('transform', 'translate(' + (width / 2) + ',' + (height / 2) + ')');

        //initialize diagram
        initDiagram();

        //update diagram
        diagram.update = function (data) {
            //set diagram data
            diagram.data = data;

            //update tree domain
            diagram.calculateDomain();

            //update legend
            diagram.updateLegend();

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
                .attr('transform', 'translate(' + diagram.plot.left + ',' + diagram.plot.top + ')')
                .append('svg')
                .attr('width', width - diagram.plot.left)
                .attr('height', height)
                .attr('fill', diagram.backColor)
                .attr('stroke', 'none')
                .append('g')
                .attr('class', 'eve-vis-g')
                .attr('transform', 'translate(' + (width / 2) + ',' + (height / 2) + ')');

            //reinitialize diagram
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
    e.circlePacking = function (options) {
        options.masterType = 'tree';
        options.type = "circlePacking";

        //remove stacked
        if (options.yAxis)
            options.yAxis.stacked = false;

        //stack the options to the visualizations stack
        e.visualizations.push(options);

        return new circlePacking(options);
    };

    //attach timeline method into the eve
    e.circlepacking = function (options) {
        options.masterType = 'tree';
        options.type = "circlePacking";

        //remove stacked
        if (options.yAxis)
            options.yAxis.stacked = false;

        //stack the options to the visualizations stack
        e.visualizations.push(options);

        return new circlePacking(options);
    };
})(eve);