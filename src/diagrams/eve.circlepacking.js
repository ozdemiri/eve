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
        var that = this,
            diagram = eve.base.init(options),
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
            selectedNode = null,
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
                .each(function (d) { if (/^other[0-9]+$/.test(d.data[currentSerie.labelField])) d.data[currentSerie.labelField] = null; })
                .sum(function (d) { return +d[currentSerie.sizeField]; })
                .sort(function (a, b) { return b.value - a.value; });

            //create color scale
            scaleColor = d3.scaleLinear().range(diagram.legend.gradientColors).domain([-1, 5]);
            
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
                    //show tooltip
                    diagram.showTooltip(diagram.getContent(d, currentSerie, diagram.tooltip.format));
                })
                .on('mouseout', function (d) {
                    //hide tooltip
                    diagram.hideTooltip();
                });

            //set selcted node
            selectedNode = diagramG.selectAll('circle');

            //zoom
            zoomTo([root.x, root.y, root.r * 2 + margin]);
        }

        //internal zoom function
        function zoom(d) {
            //set focus
            var focus0 = focus; focus = d;

            //set transition
            var transition = d3.transition()
                .duration(d3.event.altKey ? 7500 : 750)
                .tween('zoom', function (d) {
                    //declare interpolation
                    var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + margin]);

                    //return zoom function
                    return function (t) {
                        zoomTo(i(t));
                    };
                });
        }

        //internal zoomto function
        function zoomTo(v) {
            //declare zoom by
            var k = diameter / v[2];

            //set view
            view = v;

            //set node transformation
            selectedNode.attr('transform', function (d) {
                return 'translate(' + (d.x - v[0]) * k + ',' + (d.y - v[1]) * k + ')';
            });

            //change radius of the current circle
            circles
                .transition(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr('r', function (d) { return d.r * k; });
        }

        //calculate scales and draw diagram
        calculateScales();

        //create diagram g
        var foreignSVG = diagram.svg.append('foreignObject')
            .attr('width', width)
            .attr('height', height)
            .attr('x', 0)
            .attr('y', 0)
            .append('xhtml:div')
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        //create diagram g
        var diagramG = foreignSVG.append('g')
            .attr('transform', 'translate(' + (width / 2) + ',' + (height / 2) + ')');

        //initialize diagram
        initDiagram();
        
        //update diagram
        diagram.update = function (data) {
            //set diagram data
            diagram.data = data;

            //re-calculate scales
            calculateScales();

            //update tree domain
            diagram.updateTreeDomain();

            //update legend
            diagram.updateLegend();

            //update circles data
            circles.data(root.descendants()).exit().remove();

            //set selcted node
            selectedNode = diagramG.selectAll('circle');

            //zoom
            zoomTo([root.x, root.y, root.r * 2 + margin]);
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
    e.circlePacking = function (options) {
        options.type = 'tree';
        return new circlePacking(options);
    };
})(eve);