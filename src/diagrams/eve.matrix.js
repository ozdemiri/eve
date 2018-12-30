/*!
 * eve.networkmatrix.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Base class for network matrix diagram.
 */
(function (e) {
    //define network matrix diagram class
    function networkMatrix(options) {
        //update x axis data type
        options.frozenYAxis = 'string';
        options.frozenXAxis = 'string';
        options.legend = { enabled: false };

        //create diagram base
        let diagram = eve.initVis(options),
            axis = eve.initClassicalAxis(diagram),
            currentSerie = diagram.series[0],
            bulletF = null,
            bullets = null,
            dataLimit = 1000,
            bulletOffset = 10,
            minMeasure = 0,
            maxMeasure = 0,
            xBandWidth = 0,
            yBandWidth = 0,
            minDiameter = currentSerie.minBulletSize,
            maxDiameter = currentSerie.maxBulletSize,
            measureRange = 0,
            currentMeasureValue = 0,
            colors = {},
            minFontSize = 8,
            bbox = null,
            labels = null,
            xPos = 0, yPos = 0,
            currentRadius = 0,
            currentFontSize = 0,
            currentColor = '',
            diameterRange = 0;

        //update serie bullet
        if (currentSerie.bullet.indexOf('image:' > -1))
            currentSerie.bullet = 'none';

        //create diagram g
        let diagramG = diagram.svg.append('g')
            .attr('class', 'eve-vis-g')
            .attr('transform', 'translate(' + diagram.plot.left + ',' + diagram.plot.top + ')');

        //create bullet function
        bulletF = d3.symbol().type(function (d) {
            return currentSerie.bullet === 'none' ? d3.symbolCircle : currentSerie.bullet.toSymbol();
        }).size(function (d) {
            return getBulletSize(d, true);
        });

        //gets size of the bullet
        let getBulletSize = function (d, isInit) {
            //calculate bullet size by the current data
            if (isInit)
                return 1;
            return measureRange === 0 ? maxDiameter : (+d[currentSerie.measureField] / measureRange * diameterRange - (minMeasure / measureRange * diameterRange) + minDiameter);
        };

        //gets bullet transform
        let getBulletTransform = function (d, isInit) {
            //set x position
            if (diagram.xDataType === 'string')
                xPos = axis.xScale(d[diagram.xField]) + axis.xScale.bandwidth() / 2;
            else
                xPos = axis.xScale(d[diagram.xField]);

            //set y position
            yPos = isInit ? diagram.plot.height : axis.yScale(d[currentSerie.yField]) + axis.yScale.bandwidth() / 2;

            //return translation
            return 'translate(' + xPos + ',' + yPos + ')';
        };

        //gets bullet transform
        let getLabelTransform = function (d, isInit) {
            //set x position
            if (diagram.xDataType === 'string')
                xPos = axis.xScale(d[diagram.xField]) + axis.xScale.bandwidth() / 2;
            else
                xPos = axis.xScale(d[diagram.xField]);

            //set y position
            yPos = isInit ? diagram.plot.height : axis.yScale(d[currentSerie.yField]) + axis.yScale.bandwidth() / 2;

            //return translation
            return 'translate(' + xPos + ',' + yPos + ')';
        };

        //calculates bubble diameters and measure scales
        let calculateScales = function () {
            //calculate scales and measures
            minMeasure = d3.min(diagram.data, function (d) { return +d[currentSerie.measureField]; }),
            maxMeasure = d3.max(diagram.data, function (d) { return +d[currentSerie.measureField]; }),
            xBandWidth = diagram.xDataType === 'string' ? (axis.xScale.bandwidth() - bulletOffset) : ((diagram.plot.width / bulletOffset) - bulletOffset),
            yBandWidth = axis.yScale.bandwidth(),
            maxDiameter = Math.pow(Math.min(xBandWidth, yBandWidth), 2),
            minDiameter = 25,
            measureRange = maxMeasure - minMeasure,
            diameterRange = maxDiameter - minDiameter;

            //map scale colors
            axis.yScale.domain().map(function (d, i) {
                colors[d] = i >= e.colors.length ? e.randColor() : e.colors[i];
            });
        };

        //animates bullets
        let animateBullets = function () {
            //create bullet function
            bulletF = d3.symbol().type(function (d) {
                return currentSerie.bullet === 'none' ? d3.symbolCircle : currentSerie.bullet.toSymbol();
            }).size(function (d) {
                return getBulletSize(d, false);
            });

            //select current serie bullets
            diagramG.selectAll('.eve-network-bullet')
                .attr('opacity', diagram.animation.effect === 'add' ? 0 : 1)
                .transition().duration(diagram.data.length > dataLimit ? 0 : diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * (diagram.data.length > dataLimit ? 0 : diagram.animation.delay); })
                .attr('opacity', 1)
                .attr('d', bulletF)
                .attr('transform', function (d) { return getBulletTransform(d, false); });

            //select current serie bullets
            diagramG.selectAll('.eve-network-label')
                .attr('fill-opacity', function (d) {
                    //get current measure value
                    currentMeasureValue = +d[currentSerie.measureField];
                    currentRadius = Math.abs(Math.sqrt(getBulletSize(d, false)));
                    bbox = this.getBBox();

                    //check measure stabiltiy
                    if (isNaN(currentMeasureValue) || currentMeasureValue === 0)
                        return 0;

                    //cehck label visibiliy
                    if (currentSerie.labelVisibility === 'always')
                        return 1;
                    else
                        return d.fontSize < minFontSize ? 0 : 1;
                })
                .transition().duration(diagram.data.length > dataLimit ? 0 : diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * (diagram.data.length > dataLimit ? 0 : diagram.animation.delay); })
                .attr('transform', function (d) { return getLabelTransform(d, false); });
        };

        //initializes bullets
        let initBullets = function () {
            //create network bullets
            bullets = diagramG.selectAll('.eve-network-bullet')
                .data(diagram.data)
                .enter().append('path')
                .attr('class', 'eve-network-bullet')
                .attr('d', bulletF)
                .attr('fill-opacity', currentSerie.showBullets ? currentSerie.bulletAlpha : 0)
                .attr('stroke-opacity', currentSerie.bulletStrokeAlpha)
                .attr('stroke-width', currentSerie.bulletStrokeSize)
                .attr('fill', function (d) { return colors[d[currentSerie.yField]]; })
                .attr('fill-opacity', function (d) {
                    //get current measure value
                    currentMeasureValue = +d[currentSerie.measureField];

                    //check measure stabiltiy
                    if (isNaN(currentMeasureValue) || currentMeasureValue === 0)
                        return 0;
                    return currentSerie.alpha;
                })
                .attr('transform', function (d) { return getBulletTransform(d, true); })
                .on('click', function (d) {
                    if (diagram.sliceClick)
                        diagram.sliceClick(d);
                })
                .on('mousemove', function (d, i) {
                    //get current measure value
                    currentMeasureValue = +d[currentSerie.measureField];

                    //set slice hover
                    if (currentMeasureValue) {
                        //show tooltip
                        d3.select(this).attr('fill-opacity', currentSerie.sliceHoverAlpha);
                        diagram.showTooltip(diagram.getContent(d, currentSerie, diagram.tooltip.format));
                    }
                })
                .on('mouseout', function (d, i) {
                    //get current measure value
                    currentMeasureValue = +d[currentSerie.measureField];

                    //set slice hover
                    if (currentMeasureValue)
                        d3.select(this).attr('fill-opacity', currentSerie.alpha);

                    //hide tooltip
                    diagram.hideTooltip();
                });

            //create labels
            labels = diagramG.selectAll('.eve-network-label')
                .data(diagram.data)
                .enter().append('text')
                .attr('class', 'eve-network-label')
                .style('pointer-events', 'none')
                .style('text-anchor', 'middle')
                .style('fill', function (d) {
                    currentColor = colors[d[currentSerie.yField]];
                    return currentSerie.labelFontColor === 'auto' ? diagram.getAutoColor(currentColor) : currentSerie.labelFontColor;
                })
                .style('font-family', currentSerie.labelFontFamily)
                .style('font-style', currentSerie.labelFontStyle === 'bold' ? 'normal' : currentSerie.labelFontStyle)
                .style('font-weight', currentSerie.labelFontStyle === 'bold' ? 'bold' : 'normal')
                .text(function (d) {
                    //return text content
                    return diagram.getContent(d, currentSerie, currentSerie.labelFormat)
                })
                .attr('transform', function (d) { return getLabelTransform(d, true); })
                .style('font-size', function (d) {
                    //set current radius
                    currentRadius = Math.abs(Math.sqrt(getBulletSize(d, false)) - 2);

                    //check whether the label font size is auto
                    if (currentSerie.labelFontSize === 'auto')
                        d.fontSize = Math.min(2 * currentRadius, (2 * currentRadius - 8) / Math.max(this.getComputedTextLength(), this.getBBox().height) * minFontSize);
                    else
                        d.fontSize = currentSerie.labelFontSize;

                    //if not out then set defined one
                    return d.fontSize > 0 ? d.fontSize + 'px' : '0px';
                })
                .attr('dy', '.35em');
        };

        //calculate environment variables
        calculateScales();

        //initialize bulets
        initBullets();

        //animate bulets
        animateBullets();

        //attach update function
        diagram.update = function (data, keepAxis) {
            //update diagram data
            diagram.data = data;

            //update legend
            diagram.calculateDomain();
            diagram.updateLegend();

            //update xy domain
            axis.update();

            //re-calculate scales
            calculateScales();

            //remove g
            if (diagram.animation.enabled) {
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
            } else {
                //remove immediately
                diagramG.remove();
            }

            //re-append g
            diagramG = diagram.svg.append('g')
                .attr('class', 'eve-vis-g')
                .attr('transform', 'translate(' + diagram.plot.left + ',' + diagram.plot.top + ')');

            //initialize bulets
            initBullets();

            //animate bullets
            animateBullets();
        };

        //attach clear content method to chart
        diagram.clear = function () {
            //remove g from the content
            diagram.svg.selectAll('.eve-vis-g').remove();
        };

        //return network matrix diagram
        return diagram;
    }

    //attach network matrix method into the eve
    e.networkMatrix = function (options) {
        options.masterType = 'xy';
        options.type = 'networkMatrix';

        //remove stacked
        if (options.yAxis)
            options.yAxis.stacked = false;

        //stack the options to the visualizations stack
        e.visualizations.push(options);

        return new networkMatrix(options);
    };

    //attach network matrix method into the eve
    e.networkmatrix = function (options) {
        options.masterType = 'xy';
        options.type = 'networkMatrix';

        //remove stacked
        if (options.yAxis)
            options.yAxis.stacked = false;

        //stack the options to the visualizations stack
        e.visualizations.push(options);

        return new networkMatrix(options);
    };
})(eve);
