/*!
 * eve.treemap.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Base class for treemap diagram.
 */
(function (e) {
    //define treemap diagram class
    function treeDiagram(options) {
        //declare needed variables
        let diagram = eve.initVis(options),
            currentSerie = diagram.series[0],
            titleHeight = 25,
            titleColor = '',
            width = 0,
            height = 0,
            xScale = null,
            yScale = null,
            colorScale = null,
            treemap = null,
            grandparent = null,
            node = null,
            nodes = null,
            root = null,
            rects = null,
            texts = null,
            currentZoomLevel = 1,
            currentData = null,
            ancestors = null,
            currentColor = '',
            maxDepth = 0,
            widthScale = null,
            transitioning,
            minFontSize = 8,
            currentRadius = 0,
            currentRectWidth = 0,
            currentRectHeight = 0,
            currentDepth = 1,
            labelSVG = null,
            rectSVG = null,
            xPos = 0, yPos = 0;

        //calculates scales and environmental variables
        function calculateScales() {
            //calculate dimension
            width = diagram.plot.width - diagram.plot.left * 2 - diagram.plot.right;
            height = diagram.plot.height - diagram.plot.top - diagram.plot.bottom - titleHeight;

            //create scales
            xScale = d3.scaleLinear().domain([0, width]).range([0, width]);
            yScale = d3.scaleLinear().domain([0, height]).range([titleHeight, height + titleHeight]);

            //create color domain. this required for 3 or more color legends
            let colorDomain = d3.range(diagram.domains.minY, diagram.domains.maxY, (diagram.domains.maxY - diagram.domains.minY) / (diagram.legend.gradientColors.length - 1));
            colorDomain.push(diagram.domains.maxY);

            colorScale = d3.scaleLinear().range(diagram.legend.gradientColors).domain(colorDomain);
            titleColor = d3.rgb(diagram.legend.gradientColors[diagram.legend.gradientColors.length - 1]).darker();

            //create pack
            let pack = d3.pack()
                .padding(2)
                .size([diagram.plot.width, diagram.plot.height]);

            //create hierarchical data
            let hierarchical = d3.hierarchy(diagram.data)
                .each(function (d) { if (/^other[0-9]+$/.test(d.data[currentSerie.sourceField])) d.data[currentSerie.sourceField] = null; })
                .sum(function (d) { return +d[currentSerie.sizeField]; })
                .sort(function (a, b) { return b.value - a.value; });

            //create nodes from hierarchical data
            let nodes = pack(hierarchical).descendants();

            //get max depth
            maxDepth = d3.max(nodes, function (d) { return d.depth; })
            widthScale = d3.scaleLinear().domain([1, 2]).range([maxDepth, 0]);

            //create treemap layout
            treemap = d3.layout.treemap()
                .children(function (d, depth) {
                    d.value = d.size ? d.size : 0;
                    return depth ? null : d._children;
                })
                .sort(function (a, b) { return a.value - b.value; })
                .ratio(height / width * 0.5 * (1 + Math.sqrt(5)))
                .round(false);
        }

        //initializes diagram
        function initDiagram() {
            //create grandparent
            grandparent = diagramG.append("g").attr("class", "grandparent");

            //attach a rectangle to grandparent
            grandparent.append("rect")
                .attr("y", 0)
                .attr("width", width)
                .attr("height", titleHeight)
                .style('fill', titleColor);

            //attach a text to grandparent
            grandparent.append("text")
                .attr("x", 6)
                .attr("y", 6)
                .attr("dy", ".75em");

            //initialize data
            initialize(diagram.data);
            accumulate(diagram.data);
            layout(diagram.data);
            display(diagram.data);
        }

        //initializes root data
        function initialize(root) {
            root.x = root.y = 0;
            root.dx = width;
            root.dy = height;
            root.depth = 0;
        }

        //accumulates tree childrens
        function accumulate(d) {
            return (d._children = d.children)
                ? d.value = d.children.reduce(function (p, v) { return p + accumulate(v); }, 0)
                : d.value;
        }

        //computes layout
        function layout(d) {
            if (d._children) {
                treemap.nodes({ _children: d._children });
                d._children.forEach(function (c) {
                    c.x = d.x + c.x * d.dx;
                    c.y = d.y + c.y * d.dy;
                    c.dx *= d.dx;
                    c.dy *= d.dy;
                    c.parent = d;
                    c._depth = d.depth + 1;
                    layout(c);
                });
            }
        }

        //displays related data
        function display(d) {
            //set grandparent's text
            grandparent.datum(d.parent).on("click", transition).select("text").text(name(d));

            //create grandparent g
            let grandparentG = diagramG.insert("g", ".grandparent").datum(d).attr("class", "depth").attr('transform', 'translate(0,4)');

            //create children g
            let childrenG = grandparentG.selectAll("g").data(d._children).enter().append("g");

            childrenG.selectAll(".parent")
                .data(function (d) { return d._children ? [d] : []; })
                .enter().append("rect")
                .attr("class", "parent")
                .style('fill', "none")
                .style('stroke-width', 7)
                .style('stroke', '#ffffff')
                .style('stroke-opacity', currentSerie.bulletStrokeAlpha)
                .call(rect);

            //filter children to set childrens
            childrenG
                .filter(function (d) { return d._children; })
                .classed("children", true)
                .on("click", transition)

            //append a child rectangle to g
            rectSVG = childrenG.selectAll(".child")
                .data(function (d) { return d._children || [d]; })
                .enter().append("rect")
                .attr("class", "child")
                .style('fill', function (d) {
                    if (d.value > diagram.domains.maxY)
                        return colorScale(diagram.domains.maxY);
                    else
                        return colorScale(d.value);
                })
                .style('fill-opacity', 0.9)
                .style('stroke-width', 1)
                .style('stroke', '#ffffff')
                .style('stroke-opacity', currentSerie.bulletStrokeAlpha)
                .on('mousemove', function (d) {
                    //show tooltip
                    diagram.showTooltip(diagram.getContent(d, currentSerie, diagram.tooltip.format));
                })
                .on('mouseout', function (d) {
                    //hide tooltip
                    diagram.hideTooltip();
                })
                .call(rect);

            //append a text that represents the data
            labelSVG = childrenG.append("text")
                .attr("dy", ".75em")
                .style('pointer-events', 'none')
                .style('text-anchor', 'middle')
                .style('font-family', currentSerie.labelFontFamily)
                .style('font-style', currentSerie.labelFontStyle === 'bold' ? 'normal' : currentSerie.labelFontStyle)
                .style('font-weight', currentSerie.labelFontStyle === 'bold' ? 'bold' : 'normal')
                .style('font-size', minFontSize + 'px')
                .text(function (d) {
                    return diagram.getContent(d, currentSerie, currentSerie.labelFormat)
                })
                .style('fill', function (d) {
                    return currentSerie.labelFontColor === 'auto' ? diagram.getAutoColor(colorScale(d.value)) : currentSerie.labelFontColor;
                })
                .style('font-size', function (d) {
                    if (!transitioning) {
                        //get current radius
                        currentRectWidth = xScale(d.x + d.dx) - xScale(d.x);
                        currentRectHeight = yScale(d.y + d.dy) - yScale(d.y);

                        //set radius
                        currentRadius = Math.max(currentRectWidth, currentRectHeight) / 4;

                        //set font size
                        if (currentSerie.labelFontSize === 'auto')
                            d.fontSize = Math.min(2 * currentRadius, (2 * currentRadius - 8) / Math.max(this.getComputedTextLength(), this.getBBox().height) * minFontSize);
                        else
                            d.fontSize = currentSerie.labelFontSize;

                        //return font size
                        return d.fontSize + 'px';
                    }
                })
                .style('fill-opacity', function (d) {
                    bbox = this.getBBox();
                    currentRectWidth = xScale(d.x + d.dx) - xScale(d.x);
                    if (currentSerie.labelFontSize === 'auto') {
                        return d.fontSize < minFontSize ? 0 : 1;
                    } else {
                        if (currentSerie.labelVisibility === 'always')
                            return 1;
                        else
                            return bbox.width < currentRectWidth ? 1 : 0;
                    }
                })
                .call(text);

            //handle transition
            function transition(d) {
                //check if not transition and data
                if (transitioning || !d) return;

                //update transitioning effect
                transitioning = true;

                //create transitions
                let displayG = display(d),
                    t1 = grandparentG.transition().duration(750),
                    t2 = displayG.transition().duration(750);

                //update the domain only after entering new elements.
                xScale.domain([d.x, d.x + d.dx]);
                yScale.domain([d.y, d.y + d.dy]);

                //enable anti-aliasing during the transition.
                diagramG.style("shape-rendering", null);

                //draw child nodes on top of parent nodes.
                diagramG.selectAll(".depth").sort(function (a, b) { return a.depth - b.depth; });

                //fade-in entering text.
                displayG.selectAll("text").style("fill-opacity", 0);

                //transition to the new view.
                t1.selectAll("text").call(text).style("fill-opacity", 0);
                t2.selectAll("text").call(text).style("fill-opacity", 1);
                t1.selectAll("rect").call(rect);
                t2.selectAll("rect").call(rect);

                //remove the old node when the transition is finished.
                t1.remove().each(function () {
                    diagramG.style("shape-rendering", "crispEdges");
                    transitioning = false;
                });

                //set label svg
                labelSVG
                    .style('font-size', function (d) {
                        //get current radius
                        currentRectWidth = xScale(d.x + d.dx) - xScale(d.x);
                        currentRectHeight = yScale(d.y + d.dy) - yScale(d.y);

                        //set radius
                        currentRadius = Math.max(currentRectWidth, currentRectHeight) / 4;

                        //set font size
                        if (currentSerie.labelFontSize === 'auto')
                            d.fontSize = Math.min(2 * currentRadius, (2 * currentRadius - 8) / Math.max(this.getComputedTextLength(), this.getBBox().height) * minFontSize);
                        else
                            d.fontSize = currentSerie.labelFontSize;

                        //return font size
                        return d.fontSize + 'px';
                    });
            }

            return childrenG;
        }

        //places tree map data
        function text(text) {
            //update text positions
            text
                .attr("x", function (d) {
                    bbox = this.getBBox();
                    currentRectWidth = xScale(d.x + d.dx) - xScale(d.x);
                    currentRectHeight = yScale(d.y + d.dy) - yScale(d.y);
                    return xScale(d.x) + currentRectWidth / 2;
                })
                .attr("y", function (d) {
                    bbox = this.getBBox();
                    currentRectWidth = xScale(d.x + d.dx) - xScale(d.x);
                    currentRectHeight = yScale(d.y + d.dy) - yScale(d.y);
                    return yScale(d.y) + currentRectHeight / 2 - bbox.height / 2;
                });
        }

        //places tree map rectangle
        function rect(rect) {
            //update rectangle positions
            rect.attr("x", function (d) { return xScale(d.x); })
                .attr("y", function (d) { return yScale(d.y); })
                .attr("width", function (d) { return xScale(d.x + d.dx) - xScale(d.x); })
                .attr("height", 0)
                .attr('opacity', diagram.animation.effect === 'add' ? 0 : 1)
                .transition().duration(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr('opacity', 1)
                .attr("height", function (d) { return yScale(d.y + d.dy) - yScale(d.y); })
        }

        //finds name of the treemap data
        function name(d) {
            return d.parent
                ? name(d.parent) + "." + d.name
                : d.name;
        }

        //calculate scales
        calculateScales();

        //create diagram g
        let diagramG = diagram.svg.append('g')
            .style('fill', 'rgb(255,255,255)')
            .attr('class', 'eve-vis-g')
            .attr('transform', 'translate(' + diagram.plot.left + ',' + diagram.plot.top + ')');

        //init diagram and animate
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
                .style('fill', 'rgb(255,255,255)')
                .attr('class', 'eve-vis-g')
                .attr('transform', 'translate(' + diagram.plot.left + ',' + diagram.plot.top + ')');

            //re-init
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
    e.treemap = function (options) {
        options.masterType = 'tree';
        options.type = 'treemap';

        //remove stacked
        if (options.yAxis)
            options.yAxis.stacked = false;

        //stack the options to the visualizations stack
        e.visualizations.push(options);

        return new treeDiagram(options);
    };
})(eve);