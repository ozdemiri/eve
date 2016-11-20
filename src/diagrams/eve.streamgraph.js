/*!
 * eve.streamgraph.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Base class for streamgraph diagram.
 */
(function (e) {
    //define streamgraph diagram class
    function streamgraph(options) {
        //check the x position of the diagram
        if (!options.yAxis) {
            options.yAxis = { position: 'right' };
        } else {
            if (!options.yAxis.position)
                options.yAxis.position = 'right';
        }

        //make max y value frozen
        options.frozenMaxY = true;

        //declare needed variables
        var that = this,
            diagram = eve.base.init(options),
            axis = eve.base.createAxis(diagram),
            stackedData = null,
            currentSerie = null,
            currentDataSet = null,
            areaSeries = null,
            areaPolygons = null,
            xField = diagram.xField,
            groupName = '',
            tooltipContent = '',
            diffMinBase = 0,
            stack = d3.stack().keys(diagram.serieNames).offset(d3.stackOffsetSilhouette).order(d3.stackOrderInsideOut),
            colors = [],
            areaF = null,
            bulletF = null,
            colorRatio = 100 / diagram.series.length,
            mouseX = null,
            invertedX = null,
            invertedY = null,
            areaLabels = null;

        //create diagram g
        var diagramG = diagram.svg.append('g')
            .attr('transform', 'translate(' + diagram.plot.left + ',' + diagram.plot.top + ')');

        //animates streamgraph
        function animateStream() {
            //create area function
            areaF = d3.area()
                .curve(d3.curveCardinal)
                .x(function (d) { return axis.xScale(d.data[xField]); })
                .y0(function (d) { return axis.yScale(d[0]) / 2; })
                .y1(function (d) { return axis.yScale(d[1]) / 2; });

            //transform area polygons
            areaPolygons
                .transition(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr('d', areaF);
        }

        //creates colors
        function createColors() {
            //clear colors
            colors.length = 0;

            //iterate all series to create colors
            diagram.series.forEach(function (s, i) {
                //switch legend type
                switch (diagram.legend.type) {
                    case 'gradient':
                        colors.push(e.gradient(diagram.legend.gradientColors[0], diagram.legend.gradientColors[1], 100 - (i * colorRatio)));
                        break;
                    default:
                        colors.push(s.color);
                        break;
                }
            });
        }

        //sort data
        diagram.data.sort(function (a, b) {
            return ((a[diagram.xField] < b[diagram.xField]) ? -1 : ((a[diagram.xField] > b[diagram.xField]) ? 1 : 0));
        });

        //calculate diff min base
        diffMinBase = Math.abs(axis.yScale(0) - axis.yScale(diagram.domains.y[0]));

        //create chart series
        currentSerie = null;

        //set stacked data
        stackedData = stack(diagram.data);

        //iterate all stacked data
        stackedData.forEach(function (s) {
            //iterate all currnet stack array
            s.forEach(function (d) {
                //update current data
                d.serieIndex = s.index;
            });
        });

        //create new colors
        createColors();

        //create area function
        areaF = d3.area()
            .curve(d3.curveCardinal)
            .x(function (d) { return axis.xScale(d.data[xField]); })
            .y0(function (d) { return axis.yScale(d[0]) / 2; })
            .y1(function (d) { return axis.yScale(d[0]) / 2; });

        //create area for the streams
        areaPolygons = diagramG.selectAll('.eve-streamgraph-layer')
            .data(stackedData)
            .enter().append('path')
            .attr('class', 'eve-streamgraph-layer')
            .attr('d', areaF)
            .attr('fill', function (d, i) { return colors[i]; })
            .attr('stroke', function (d, i) { return colors[i]; })
            .attr('fill-opacity', function (d, i) { return diagram.series[d.index].alpha; })
            .attr('stroke-opacity', function (d, i) { return diagram.series[d.index].sliceStrokeAlpha; })
            .attr('stroke-width', function (d, i) { return diagram.series[d.index].sliceStrokeThickness; });

        //append hover events
        diagramG.selectAll('.eve-streamgraph-layer')
            .on('mouseover', function (d, i) {
                //set slice hover
                d3.select(this).attr('fill-opacity', diagram.series[i].sliceHoverAlpha);
            })
            .on('mousemove', function (d, i) {
                //get mouse x position
                mouseX = d3.mouse(this);
                mouseX = mouseX[0];

                //get inverted x value by mouse
                invertedX = Math.ceil(axis.xScale.invert(mouseX));
                
                //iterate all in current data
                d.forEach(function (a) {
                    //check data matches with inverted x
                    if (a.data[xField] === invertedX) {
                        //show tooltip
                        diagram.showTooltip(diagram.getContent(a, diagram.series[i], diagram.tooltip.format));
                    }
                });
            })
            .on('mouseout', function (d, i) {
                //set slice hover
                d3.select(this).attr('fill-opacity', diagram.series[i].alpha);

                //hide tooltip
                diagram.hideTooltip();
            });

        //animate streams
        animateStream();

        //updates diagram
        diagram.update = function (data) {
            //set chart data
            diagram.data = data;

            //sort data
            diagram.data.sort(function (a, b) {
                return ((a[diagram.xField] < b[diagram.xField]) ? -1 : ((a[diagram.xField] > b[diagram.xField]) ? 1 : 0));
            });

            //update xy domain
            axis.updateAxis();
            diagram.updateLegend();

            //create chart series
            currentSerie = null;

            //set stacked data
            stackedData = stack.keys(diagram.serieNames).offset(d3.stackOffsetSilhouette).order(d3.stackOrderInsideOut)(diagram.data);

            //iterate all stacked data
            stackedData.forEach(function (s) {
                //iterate all currnet stack array
                s.forEach(function (d) {
                    //update current data
                    d.serieIndex = s.index;
                });
            });

            //create new colors
            createColors();

            //update svg data
            areaPolygons.data(stackedData).exit().remove();

            //animate streamgraph
            animateStream();
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

    //attach streamgraph method into the eve
    e.streamGraph = function (options) {
        options.type = 'xy';
        return new streamgraph(options);
    };
})(eve);