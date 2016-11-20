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
        var diagram = eve.base.init(options),
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
            currentAncestors = null,
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
            maxTextLength = d3.max(hierarchical.descendants(), function (d) { return d.data[currentSerie.labelField].toString().length; });

            //calculate margins and dimensions
            autoMargin = currentSerie.labelFormat ? ((diagram.xAxis.labelFontSize * (maxTextLength)) + 1) : 10;
            autoMargin = ((diagram.xAxis.labelFontSize * (maxTextLength)) + 1);
            margin.left = diagram.margin.left + autoMargin;
            margin.right = diagram.margin.right + autoMargin;
            margin.top = diagram.margin.top;
            margin.bottom = diagram.margin.bottom;
            width = diagram.plot.width - margin.left - margin.right;
            height = diagram.plot.height - margin.top - margin.bottom;
            diameter = Math.min(diagram.plot.width - autoMargin, diagram.plot.height - autoMargin) / 2;

            //create partitions
            partitions = d3.partition().size([360, diameter]).padding(0);

            //create root data
            root = d3.hierarchy(diagram.data, function (d) { return d.children; }).sum(function (d) { return d.children ? 0 : 1; });

            //update root with partitions
            partitions(root);

            //create scales
            xScale = d3.scaleLinear().domain([0, diameter]).range([0, Math.PI * 2]).clamp(true);
            yScale = d3.scaleLinear().domain([0, diameter]).range([0, Math.PI * 2]).clamp(true);
            scaleColor = d3.scaleOrdinal(e.colors);

            //create arc
            arc = d3.arc()
                .startAngle(function (d) { return xScale(d.x0); })
                .endAngle(function (d) { return xScale(d.x1); })
                .innerRadius(function (d) { return d.y0; })
                .outerRadius(function (d) { return 10; });
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
                .transition(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr('d', arc);

            //remove paths
            paths.exit().remove();

            //animate labels
            labels
                .transition(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .text(function (d) {
                    return diagram.xAxis.labelFormat.replaceAll('{source}', d.data.name).replaceAll('{measure}', diagram.formatNumber(d.data.size, diagram.xAxis.numberFormat));
                })
                .attr('dx', 0)
                .attr('dy', '.5em')
                .attr('x', function (d) { return xScale(d.y0); })
                .attr('transform', function (d) {
                    //calculate rotation
                    if (d.depth > 0) {
                        //get center of the arc
                        var centroid = arc.centroid(d);

                        //return translation
                        return 'translate(' + centroid + ')rotate(' + getAngle(d) + ')';
                    } else {
                        return null;
                    }
                });

            //remove labels
            labels.exit().remove();
        }

        //initialize diagram and draw sunburst
        function initDiagram() {
            //create paths
            paths = diagramG.selectAll('path')
                .data(root.descendants())
                .enter().append('path')
                .attr('display', function (d) { return d.depth ? null : 'none'; })
                .attr('d', arc)
                .attr('class', 'eve-sunburst-node')
                .attr('stroke', '#fff')
                .attr('fill', function (d) { return scaleColor((d.children ? d : d.parent).data.name); })
                .attr('fill-rule', 'evenodd')
                .on('mousemove', function (d, i) {
                    //get current ancestors
                    currentAncestors = getNodeAncestors(d);

                    //select all paths and decrease opacity
                    d3.selectAll('.eve-sunburst-node').style('opacity', 0.3);

                    //select current node
                    d3.selectAll('.eve-sunburst-node')
                        .filter(function (node) { return (currentAncestors.indexOf(node) >= 0); })
                        .style('opacity', 1);

                    //show tooltip
                    diagram.showTooltip(diagram.getContent(d, currentSerie, diagram.tooltip.format));
                })
                .on('mouseout', function (d, i) {
                    //select all paths and decrease opacity
                    d3.selectAll('.eve-sunburst-node').style('opacity', 1);

                    //hide tooltip
                    diagram.hideTooltip();
                });

            //create labels
            labels = diagramG.selectAll('text')
                .data(root.descendants())
                .enter().append('text')
                .style('fill', diagram.xAxis.labelFontColor)
                .style('font-size', diagram.xAxis.labelFontSize + 'px')
                .style('font-family', diagram.xAxis.labelFontFamily)
                .style('font-style', diagram.xAxis.labelFontStyle === 'bold' ? 'normal' : diagram.xAxis.labelFontStyle)
                .style('font-weight', diagram.xAxis.labelFontStyle === 'bold' ? 'bold' : 'normal')
                .attr('text-anchor', 'middle')
                .text(function (d) {
                    return diagram.xAxis.labelFormat.replaceAll('{source}', d.data.name).replaceAll('{measure}', diagram.formatNumber(d.data.size, diagram.xAxis.numberFormat));
                })
                .attr('dx', 0)
                .attr('dy', '.5em')
                .attr('x', function (d) { return xScale(d.y0); })
                .attr('transform', function (d) {
                    //calculate rotation
                    if (d.depth > 0) {
                        //get center of the arc
                        var centroid = arc.centroid(d);

                        //return translation
                        return 'translate(' + centroid + ')rotate(' + getAngle(d) + ')';
                    } else {
                        return null;
                    }
                });
        }

        //gets ancestors of the given node
        function getNodeAncestors(node) {
            //declare variables
            var path = [],
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
        function getAngle(d) {
            var thetaDeg = (180 / Math.PI * (arc.startAngle()(d) + arc.endAngle()(d)) / 2 - 90);
            return (thetaDeg > 90) ? thetaDeg - 180 : thetaDeg;
        }

        //calculate environment
        calculateScales();

        //create diagram g
        var diagramG = diagram.svg.append('g')
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

            //updaet g
            diagramG.attr('transform', 'translate(' + (diagram.plot.width / 2) + ',' + (height / 2) + ')');

            //remove paths and labels
            paths.remove();
            labels.remove();

            //update data
            initDiagram();
            animateDiagram();
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
    e.sunburst = function (options) {
        options.type = '';
        return new sunburst(options);
    };
})(eve);