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
        var diagram = eve.base.init(options),
            currentSerie = diagram.series[0],
            totalMeasure = 0,
            maxNodeLength = 0,
            maxTextLength = 0,
            autoMarginSides = 0,
            autoMarginTop = 0,
            margin = { left: 0, top: 0, bottom: diagram.margin.bottom, right: 0 },
            width = 0,
            height = 0,
            formatNumber = d3.format(''),
            sankey = null,
            path = null,
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

            
            //calculate auto margins
            autoMarginSides = diagram.xAxis.labelFormat ? (((diagram.xAxis.labelFontSize / 2) * (maxTextLength + 1)) + diagram.xAxis.labelFontSize) : 10;
            autoMarginTop = diagram.yAxis.labelFormat ? diagram.yAxis.labelFontSize * 2 : 10;
            margin.left = autoMarginSides;
            margin.right = autoMarginSides;
            margin.top = autoMarginTop;
            margin.bottom = autoMarginTop;

            //calculate dimension
            width = diagram.plot.width - margin.left - margin.right;
            height = diagram.plot.height - margin.top - margin.bottom;
        }

        //animates diagram
        function animateDiagram() {
            //animate links
            linkSVG
                .transition(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr('stroke', function (d) { return d.source.color; })
                .attr('stroke-width', function (d) { return Math.max(1, d.dy); });

            //animate nodes
            nodeSVG
                .transition(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr('transform', function (d) { return 'translate(' + d.x + ',' + (isNaN(d.y) ? 0 : d.y) + ')'; })
                .attr('height', function (d) { return d.dy; })
                .attr('fill', function (d) { return d.color; })
                .attr('stroke', function (d) { return d3.rgb(d.color).darker(2); });
        }

        //initializes diagram and draw links
        function initDiagram() {
            //set sankey function and create paths and links
            sankey = d3.sankey().nodeWidth(36).nodePadding(40).size([width, height]);
            path = sankey.link();
            sankey.nodes(diagram.data.nodes).links(diagram.data.links).layout(32);

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
                .sort(function (a, b) { return b.dy - a.dy; });

            //create nodes
            nodeSVG = diagramG
                .append('g')
                .selectAll('.eve-sankey-node')
                .data(diagram.data.nodes)
                .enter().append('rect')
                .attr('class', 'eve-sankey-node')
                .attr('transform', function (d) { return 'translate(' + d.x + ',' + (isNaN(d.y) ? 0 : d.y) + ')'; })
                .attr('width', sankey.nodeWidth())
                .attr('height', 0)
                .style('stroke-width', 1)
                .attr('fill', function (d) { return d.color; })
                .attr('stroke', function (d) { return d3.rgb(d.color).darker(0); })
                .on('mousemove', function (d, i) {
                    //show tooltip
                    diagram.showTooltip(diagram.getContent(d, currentSerie, diagram.tooltip.format));
                })
                .on('mouseout', function (d, i) {
                    //hide tooltip
                    diagram.hideTooltip();
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
        var diagramG = diagram.svg.append('g')
            .attr('transform', 'translate(' + diagram.plot.left + ',' + diagram.plot.top + ')');

        //init diagram and animate
        initDiagram();
        animateDiagram();

        //update diagram
        diagram.update = function (data) {
            //set diagram data
            diagram.data = data;

            //recalculate scales
            calculateScales();

            //update diagram g
            diagramG.attr('transform', 'translate(' + diagram.plot.left + ',' + diagram.plot.top + ')');

            //update data
            linkSVG.remove();
            nodeSVG.remove();
            
            //animate diagram
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
    e.sankey = function (options) {
        options.type = '';
        return new sankey(options);
    };
})(eve);