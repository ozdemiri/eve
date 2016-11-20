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
        var diagram = eve.base.init(options),
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
            xPos = 0, yPos = 0;

        //calculates scales and environmental variables
        function calculateScales() {
            //calculate dimension
            width = diagram.plot.width - diagram.plot.left - diagram.plot.right;
            height = diagram.plot.height - diagram.plot.top - diagram.plot.bottom - titleHeight;

            //create scales
            xScale = d3.scaleLinear().domain([0, width]).range([0, width]);
            yScale = d3.scaleLinear().domain([0, height]).range([titleHeight, height]);
            colorScale = d3.scaleLinear().range(diagram.legend.gradientColors).domain(diagram.domains.y);
            titleColor = d3.rgb(diagram.legend.gradientColors[diagram.legend.gradientColors.length - 1]).darker();

            //create treemap function
            treemap = d3.treemap()
                .size([width, height])
                .tile(currentSerie.tileType.toTileType())
                .paddingInner(0)
                .round(true);

            //set node and root
            node = root = diagram.data;

            //create root data
            nodes = d3.hierarchy(root)
                .sum(function (d) { return d[currentSerie.sizeField]; })
                .sort(function (a, b) { return b.value - a.value; });

            //convert hierarchical data into treemap data
            treemap(nodes);
        }

        //animates rectangles
        function animateRectangles() {
            //animate rectangles
            rects
                .transition(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .style('fill', function (d) {
                    while (d.depth > 1)
                        d = d.parent;
                    return colorScale(d.value);
                })
                .attr('transform', function (d) {
                    //calculate x and y position of the current descendant
                    xPos = xScale(d.x0);
                    yPos = yScale(d.y0);

                    //return calculated translation
                    return 'translate(' + xPos + ',' + yPos + ')';
                })
                .attr('width', function (d) { return xScale(d.x1 - d.x0); })
                .attr('height', function (d) { return yScale(d.y1 - d.y0); });
        }

        //initializes diagram and draws rectangles
        function initDiagram() {
            //create grandparent g
            grandparent = diagramG.append('g')
                .attr('class', 'grandparent');

            //create grandparent rectangle
            grandparent.append('rect')
                .attr("y", 0)
                .attr("width", width)
                .attr("height", titleHeight)
                .style('fill', titleColor)
                .style('fill-opacity', 1);

            //append text of the grand parent
            grandparent.append("text")
                .attr("x", 6)
                .attr("y", (titleHeight - 11) / 2)
                .attr("dy", ".75em")
                .style('font-family', 'Tahoma')
                .style('font-size', 11)
                .style('fill', '#FFFFFF')
                .text('Treemap');

            //create treemap nodes
            rects = diagramG.selectAll('.eve-treemap-node')
                .data(nodes.descendants())
                .enter().append('rect')
                .attr('class', function (d) { return 'eve-treemap-node eve-treemap-node-level-' + d.depth; })
                .style('stroke', '#fff')
                .style('stroke-width', function (d) { return 1 / (d.depth + 1); })
                .style('fill', '#fff')
                .attr('transform', function (d) {
                    //calculate x and y position of the current descendant
                    xPos = xScale(d.x0);
                    yPos = titleHeight;

                    //return calculated translation
                    return 'translate(' + xPos + ',' + yPos + ')';
                })
                .attr('width', function (d) { return xScale(d.x1 - d.x0); })
                .attr('height', function (d) { return yScale(0); })
                .on('mousemove', function (d, i) {
                    //show tooltip
                    diagram.showTooltip(diagram.getContent(d, currentSerie, diagram.tooltip.format));
                })
                .on('mouseout', function (d, i) {
                    //hide tooltip
                    diagram.hideTooltip();
                });
                //.on('click', zoom);

            //create texts
            texts = diagramG.selectAll('.eve-treemap-text')
                .data(nodes.descendants())
                .enter().append('text')
                .attr('class', function (d) { return 'eve-treemap-text eve-treemap-text-level-' + d.depth; })
                .style('fill', currentSerie.labelFontColor)
                .style('font-size', currentSerie.labelFontSize)
                .style('font-family', currentSerie.labelFontFamily)
                .style('font-style', currentSerie.labelFontStyle === 'bold' ? 'normal' : currentSerie.labelFontStyle)
                .style('font-weight', currentSerie.labelFontStyle === 'bold' ? 'bold' : 'normal')
                .attr('text-anchor', 'start')
                .text(function (d) {
                    if (d.depth === currentZoomLevel)
                        return d.data[currentSerie.labelField] ? d.data[currentSerie.labelField] : '';
                    else
                        return '';
                })
                .attr('transform', function (d) {
                    //calculate x and y position of the current descendant
                    xPos = xScale(d.x0) + (xScale(d.x1 - d.x0) / 2) - (this.getBBox().width / 2);
                    yPos = yScale(d.y0) + (yScale(d.y1 - d.y0) / 2);

                    //return calculated translation
                    return 'translate(' + xPos + ',' + yPos + ')';
                });
        }

        //zooms to diagram
        function zoom(d) {
            //updte scales
            ancestors = d.ancestors();
            currentData = ancestors[ancestors.length - 2];
            xScale.domain([currentData.x0, currentData.x1]).range([0, width]);
            yScale.domain([currentData.y0, currentData.y1]).range([titleHeight, height]);

            //create transition
            animateRectangles();
            
            //set node and stop propagation
            d3.event.stopPropagation();
        }

        //calculate scales
        calculateScales();

        //create diagram g
        var diagramG = diagram.svg.append('g')
            .style('fill', '#fff')
            .attr('transform', 'translate(' + diagram.plot.left + ',' + diagram.plot.top + ')');

        //init diagram and animate
        initDiagram();
        animateRectangles();

        //update diagram
        diagram.update = function (data) {
            //set diagram data
            diagram.data = data;

            //re-calculate scales
            calculateScales();
            diagram.updateTreeDomain();
            diagram.updateLegend();

            //remove svgs
            rects.data(nodes.descendants()).exit().remove();
            texts.data(nodes.descendants()).exit().remove();

            //re-initialize diagram
            //initDiagram();
            animateRectangles();
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
    e.treemap = function (options) {
        options.type = 'tree';
        return new treeDiagram(options);
    };
})(eve);