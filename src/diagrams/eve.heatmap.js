/*!
 * eve.heatmap.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Base class for heatmap diagram.
 */
(function (e) {
    //define heatmap diagram class
    function heatmap(options) {
        //declare needed variables
        var diagram = eve.base.init(options),
            currentSerie = diagram.series[0],
            rows = [],
            cols = [],
            margin = { left: 0, right: diagram.margin.right, top: 0, bottom: diagram.margin.bottom },
            width = 0,
            height = 0,
            rowMaxLength = 0,
            colMaxLength = 0,
            rowAutoMargin = 0,
            colAutoMargin = 0,
            wGridSize = 0,
            hGridSize = 0,
            scaleColor = null,
            rects = null,
            rowLabels = null,
            colLabels = null;

        //calculates scales and envirpnment
        function calculateScales() {
            //get rows and cols
            rows = e.getUniqueValues(diagram.data, currentSerie.sourceField);
            cols = e.getUniqueValues(diagram.data, currentSerie.targetField);

            //sort rows and cols
            rows.sort();
            cols.sort();

            //get max lengths
            rowMaxLength = d3.max(rows, function(d) { return d.toString().length; });
            colMaxLength = d3.max(cols, function(d) { return d.toString().length; });

            //calculate auto margins
            rowAutoMargin = ((diagram.yAxis.labelFontSize / 2) * (rowMaxLength + 1)) + diagram.yAxis.labelFontSize;
            colAutoMargin = ((diagram.xAxis.labelFontSize / 2) * (colMaxLength + 1)) + diagram.xAxis.labelFontSize;

            //calculate margin and dimensions
            margin.left = diagram.margin.left + rowAutoMargin;
            margin.top = diagram.margin.top + colAutoMargin;
            width = diagram.plot.width - diagram.plot.left - diagram.plot.right - margin.left - margin.right;
            height = diagram.plot.height - diagram.plot.top - diagram.plot.bottom - margin.top - margin.bottom;
            wGridSize = width / cols.length;
            hGridSize = height / rows.length;

            //create color scaleColor
            scaleColor = d3.scaleLinear().range(diagram.legend.gradientColors).domain(diagram.domains.y);
        }

        //animates diagram
        function animateDiagram() {
            //colorize them
            rects
                .transition(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr('x', function (d) { return cols.indexOf(d[currentSerie.targetField]) * wGridSize; })
                .attr('y', function (d) { return rows.indexOf(d[currentSerie.sourceField]) * hGridSize; })
                .attr("width", wGridSize)
                .attr("height", hGridSize)
                .style('fill', function(d) { return scaleColor(+d[currentSerie.measureField]); });

            //animate row labels
            rowLabels
                .transition(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr("x", 0)
                .attr("y", function (d, i) { return i * hGridSize; })
                .attr("transform", function (d, i) {
                    //declare variables
                    var bbox = this.getBBox(),
                        posY = (bbox.height / 2) + (hGridSize / 2) - 4;

                    //return translation
                    return "translate(-6," + posY + ")";
                });

            //animate col labels
            colLabels
                .transition(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr("x", 0)
                .attr("y", function (d, i) { return i * wGridSize; })
                .attr("transform", "translate(" + wGridSize / 2 + ", -6)rotate(-90)");
        }

        //initializes diagram
        function initDiagram() {
            //create rectangles
            rects = diagramG.selectAll('.eve-heatmap-data')
                .data(diagram.data)
                .enter().append('rect')
                .attr("class", "eve-heatmap-data eve-heatmap-cell")
                .attr('x', 0)
                .attr('y', function (d) { return rows.indexOf(d[currentSerie.sourceField]) * hGridSize; })
                .attr("width", 0)
                .attr("height", hGridSize)
                .style('fill', function (d) { return scaleColor(+d[currentSerie.measureField]); })
                .on('mousemove', function (d, i) {
                    //show tooltip
                    diagram.showTooltip(diagram.getContent(d, currentSerie, diagram.tooltip.format));
                })
                .on('mouseout', function (d, i) {
                    //hide tooltip
                    diagram.hideTooltip();
                });

            //create row labels
            rowLabels = diagramG.selectAll('.eve-heatmap-rows')
                .data(rows)
                .enter().append('text')
                .attr("x", 0)
                .attr("y", function (d, i) { return i * hGridSize; })
                .style("text-anchor", "end")
                .attr('class', 'eve-heatmap-rows')
                .style('fill', diagram.yAxis.labelFontColor)
                .style('font-size', diagram.yAxis.labelFontSize + 'px')
                .style('font-family', diagram.yAxis.labelFontFamily + ', Arial, Helvetica, Ubuntu')
                .style('font-style', diagram.yAxis.labelFontStyle === 'bold' ? 'normal' : diagram.yAxis.labelFontStyle)
                .style('font-weight', diagram.yAxis.labelFontStyle === 'bold' ? 'bold' : 'normal')
                .text(function(d) { return d; })
                .attr("transform", "translate(-6,0)");

            //create col labels
            colLabels = diagramG.selectAll('.eve-heatmap-cols')
                .data(cols)
                .enter().append('text')
                .attr("x", 0)
                .attr("y", function (d, i) { return i * wGridSize; })
                .attr('class', 'eve-heatmap-cols')
                .style('fill', diagram.yAxis.labelFontColor)
                .style('font-size', diagram.yAxis.labelFontSize + 'px')
                .style('font-family', diagram.yAxis.labelFontFamily + ', Arial, Helvetica, Ubuntu')
                .style('font-style', diagram.yAxis.labelFontStyle === 'bold' ? 'normal' : diagram.yAxis.labelFontStyle)
                .style('font-weight', diagram.yAxis.labelFontStyle === 'bold' ? 'bold' : 'normal')
                .text(function(d) { return d; })
                .attr("transform", "translate(0, -6)rotate(-90)");
        }

        //calculate envirnment
        calculateScales();

        //create diagram g
        var diagramG = diagram.svg.append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        //initialize diagram and animate
        initDiagram();
        animateDiagram();

        //update diagram
        diagram.update = function (data) {
            //set diagram data
            diagram.data = data;

            //update legend
            diagram.updateXYDomain();
            diagram.updateLegend();

            //re-calculate scales
            calculateScales();

            //update rectangles and labels
            rects.data(diagram.data).exit().remove();
            rowLabels.data(rows).exit().remove();
            colLabels.data(cols).exit().remove();

            //recall animation
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
    e.heatmap = function (options) {
        return new heatmap(options);
    };
})(eve);