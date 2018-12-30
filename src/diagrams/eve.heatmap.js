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
        let diagram = eve.initVis(options),
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
            labels = null,
            rowLabels = null,
            bbox = null,
            rScale = null,
            currentColor = null,
            minSize = 0,
            currentMeasure = 0,
            currentRadius = 0,
            minFontSize = 8,
            colDataProps = '',
            colLabels = null;

        //calculates scales and envirpnment
        function calculateScales(keepAxis) {
            //get rows and cols
            rows = diagram.xAxis.values ? diagram.xAxis.values : e.getUniqueValues(diagram.data, currentSerie.sourceField);
            cols = diagram.yAxis.values ? diagram.yAxis.values : e.getUniqueValues(diagram.data, currentSerie.targetField);
            rowDataProps = typeof diagram.data[0][currentSerie.sourceField];
            colDataProps = typeof diagram.data[0][currentSerie.targetField]; 

            //check x field data type
            rows.sort(d3.ascending);
            cols.sort(d3.ascending);

            //get max lengths
            rowMaxLength = d3.max(rows, function (d) {
                let dType = e.getType(d);
                if (dType === "date")
                    return e.formatDate(d).toString().length;

                return d ? d.toString().length : 0;
            });
            colMaxLength = d3.max(cols, function (d) {
                let dType = e.getType(d);
                if (dType === "date")
                    return e.formatDate(d).toString().length;

                return d ? d.toString().length : 0;
            });

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

            //set min size
            minSize = Math.min(wGridSize, hGridSize);

            //create color domain. this required for 3 or more color legends
            let colorDomain = d3.range(diagram.domains.minY, diagram.domains.maxY, (diagram.domains.maxY - diagram.domains.minY) / (diagram.legend.gradientColors.length - 1));
            colorDomain.push(diagram.domains.maxY);

            //create color scaleColor
            scaleColor = d3.scaleLinear().range(diagram.legend.gradientColors).domain(colorDomain);
            rScale = d3.scalePow().exponent(0.5).domain([diagram.domains.minY, diagram.domains.maxY]).range([minSize, minSize]);
        }

        //animates diagram
        function animateDiagram() {
            //animate rectangles
            rects
                .attr('opacity', diagram.animation.effect === 'add' ? 0 : 1)
                .transition().duration(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr('opacity', 1)
                .attr('x', function (d) { return cols.indexOf(d[currentSerie.targetField]) * wGridSize; })
                .attr('y', function (d) { return rows.indexOf(d[currentSerie.sourceField]) * hGridSize; })
                .attr("width", wGridSize)
                .attr("height", hGridSize)
                .style('fill', function (d) {
                    if (d[currentSerie.measureField])
                        return scaleColor(+d[currentSerie.measureField]);
                    else
                        return 'none';
                });

            //animate labels
            labels
                .style('fill-opacity', function (d) {
                    //get bbox
                    bbox = this.getBBox();
                    if (currentSerie.labelFontSize !== 'auto')
                        return 1;
                    if (currentSerie.labelVisibility === 'always')
                        return 1;
                    return wGridSize > bbox.width ? 1 : 0;
                })
                .transition().duration(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr('x', function (d) {
                    bbox = this.getBBox();
                    return (cols.indexOf(d[currentSerie.targetField]) * wGridSize) + wGridSize / 2 - bbox.width / 2;
                })
                .attr('y', function (d) {
                    return (rows.indexOf(d[currentSerie.sourceField]) * hGridSize) + (hGridSize / 2) + (d.fontSize / 2);
                })

            //animate row labels
            rowLabels
                .transition().duration(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr("x", 0)
                .attr("y", function (d, i) { return i * hGridSize; })
                .attr("transform", function (d, i) {
                    //declare variables
                    let bbox = this.getBBox(),
                        posY = (bbox.height / 2) + (hGridSize / 2) - 4;

                    //return translation
                    return "translate(-6," + posY + ")";
                });

            //animate col labels
            colLabels
                .transition().duration(diagram.animation.duration)
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

            //create labels
            labels = diagramG.selectAll('.eve-heatmap-labels')
                .data(diagram.data)
                .enter().append('text')
                .attr("class", "eve-heatmap-labels")
                .style('pointer-events', 'none')
                .style('text-anchor', 'start')
                .style('fill', function (d) {
                    currentColor = scaleColor(+d[currentSerie.measureField]);
                    return currentSerie.labelFontColor === 'auto' ? diagram.getAutoColor(currentColor) : currentSerie.labelFontColor;
                })
                .style('font-family', currentSerie.labelFontFamily)
                .style('font-style', currentSerie.labelFontStyle === 'bold' ? 'normal' : currentSerie.labelFontStyle)
                .style('font-weight', currentSerie.labelFontStyle === 'bold' ? 'bold' : 'normal')
                .text(function (d) {
                    //return text content
                    return diagram.getContent(d, currentSerie, currentSerie.labelFormat)
                })
                .style('font-size', function (d) {
                    currentMeasure = +d[currentSerie.measureField];
                    currentRadius = rScale(currentMeasure);

                    //set font size
                    if (currentSerie.labelFontSize === 'auto')
                        d.fontSize = Math.min(2 * currentRadius, (2 * currentRadius - 8) / Math.max(this.getComputedTextLength(), this.getBBox().height) * minFontSize);
                    else
                        d.fontSize = currentSerie.labelFontSize;

                    if (d.fontSize < minFontSize)
                        d.fontSize = minFontSize;

                    return d.fontSize + 'px';
                })
                .attr('x', 0)
                .attr('y', function (d) {
                    return (rows.indexOf(d[currentSerie.sourceField]) * hGridSize) + (hGridSize / 2) + (d.fontSize / 2);
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
                .text(function (d) {
                    let dType = e.getType(d);
                    return dType === "date" ? e.formatDate(d) : d;
                })
                .attr("transform", "translate(-6,0)");

            //create col labels
            colLabels = diagramG.selectAll('.eve-heatmap-cols')
                .data(cols)
                .enter().append('text')
                .attr("x", 0)
                .attr("y", function (d, i) { return i * wGridSize; })
                .attr('class', 'eve-heatmap-cols')
                .style('fill', diagram.xAxis.labelFontColor)
                .style('font-size', diagram.xAxis.labelFontSize + 'px')
                .style('font-family', diagram.xAxis.labelFontFamily + ', Arial, Helvetica, Ubuntu')
                .style('font-style', diagram.xAxis.labelFontStyle === 'bold' ? 'normal' : diagram.xAxis.labelFontStyle)
                .style('font-weight', diagram.xAxis.labelFontStyle === 'bold' ? 'bold' : 'normal')
                .text(function (d) {
                    let dType = e.getType(d);
                    return dType === "date" ? e.formatDate(d) : d;
                })
                .attr("transform", "translate(0, -6)rotate(-90)");
        }

        //calculate envirnment
        calculateScales();

        //create diagram g
        let diagramG = diagram.svg.append('g')
            .attr('class', 'eve-vis-g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        //initialize diagram and animate
        initDiagram();
        animateDiagram();

        //update diagram
        diagram.update = function (data, keepAxis) {
            //set diagram data
            diagram.data = data;

            //update legend
            diagram.calculateDomain();
            diagram.updateLegend();

            //re-calculate scales
            calculateScales(keepAxis);

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
                .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            //re-initialize heatmap
            initDiagram();

            //recall animation
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
    e.heatmap = function (options) {
        options.type = 'heatmap';

        //remove stacked
        if (options.yAxis)
            options.yAxis.stacked = false;

        //stack the options to the visualizations stack
        e.visualizations.push(options);

        return new heatmap(options);
    };
})(eve);