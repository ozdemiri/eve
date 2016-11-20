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
        options.legend = { enabled: false };
        
        //create diagram base
        var diagram = eve.base.init(options),
            axis = eve.base.createAxis(diagram),
            currentSerie = diagram.series[0],
            bulletF = null,
            bullets = null,
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
            diameterRange = 0;

        //update serie bullet
        if (currentSerie.bullet.indexOf('image:' > -1))
            currentSerie.bullet = 'none';

        //create diagram g
        var diagramG = diagram.svg.append('g')
            .attr('transform', 'translate(' + diagram.plot.left + ',' + diagram.plot.top + ')');

        //gets size of the bullet
        var getBulletSize = function (d, isInit) {
            //calculate bullet size by the current data
            if (isInit)
                return 1;
            return measureRange === 0 ? maxDiameter : (+d[currentSerie.measureField] / measureRange * diameterRange - (minMeasure / measureRange * diameterRange) + minDiameter);
        };

        //gets bullet transform
        var getBulletTransform = function(d, isInit) {
            //declare x and y positions
            var xPos = 0,
                yPos = 0;

            //set x position
            if (diagram.xFieldDataType === 'string')
                xPos = axis.xScale(d[diagram.xField]) + axis.xScale.bandwidth() / 2;
            else
                xPos = axis.xScale(d[diagram.xField]);

            //set y position
            yPos = isInit ? diagram.plot.height : axis.yScale(d[currentSerie.yField]) + axis.yScale.bandwidth() / 2;

            //return translation
            return 'translate(' + xPos + ',' + yPos + ')';
        };
        
        //calculates bubble diameters and measure scales
        var calculateScales = function () {
            //calculate scales and measures
            minMeasure = d3.min(diagram.data, function (d) { return +d[currentSerie.measureField]; }),
            maxMeasure = d3.max(diagram.data, function (d) { return +d[currentSerie.measureField]; }),
            xBandWidth = diagram.xFieldDataType === 'string' ? (axis.xScale.bandwidth() - bulletOffset) : ((diagram.plot.width / bulletOffset) - bulletOffset),
            yBandWidth = axis.yScale.bandwidth(),
            minDiameter = 1,
            maxDiameter = Math.pow(Math.min(xBandWidth, yBandWidth), 2),
            measureRange = maxMeasure - minMeasure,
            diameterRange = maxDiameter - minDiameter;

            //map scale colors
            axis.yScale.domain().map(function (d, i) {
                colors[d] = i >= e.colors.length ? e.randColor() : e.colors[i];
            });
        };

        //animates bullets
        var animateBullets = function () {
            //create bullet function
            bulletF = d3.symbol().type(function (d) {
                return currentSerie.bullet === 'none' ? d3.symbolCircle : currentSerie.bullet.toSymbol();
            }).size(function (d) {
                return getBulletSize(d, false);
            });

            //select current serie bullets
            diagramG.selectAll('.eve-network-bullet')
                .transition(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr('d', bulletF)
                .attr('transform', function (d) { return getBulletTransform(d, false); });
        };

        //create bullet function
        bulletF = d3.symbol().type(function (d) {
            return currentSerie.bullet === 'none' ? d3.symbolCircle : currentSerie.bullet.toSymbol();
        }).size(function (d) {
            return getBulletSize(d, true);
        });

        //calculate environment variables
        calculateScales();

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
                return 1;
            })
            .attr('transform', function (d) { return getBulletTransform(d, true); })
            .on('click', function (d) {
                if (diagram.sliceClick)
                    diagram.sliceClick(d);
            })
            .on('mousemove', function (d, i) {
                //set slice hover
                d3.select(this).attr('fill-opacity', currentSerie.sliceHoverAlpha);

                //show tooltip
                diagram.showTooltip(diagram.getContent(d, currentSerie, diagram.tooltip.format));
            })
            .on('mouseout', function (d, i) {
                //set slice hover
                d3.select(this).attr('fill-opacity', currentSerie.alpha);

                //hide tooltip
                diagram.hideTooltip();
            });
        
        //animate bulets
        animateBullets();

        //attach update function
        diagram.update = function (data) {
            //update diagram data
            diagram.data = data;

            //update xy domain
            axis.updateAxis();
            diagram.updateLegend();

            //re-calculate scales
            calculateScales();

            //update bullet data
            diagramG.selectAll('.eve-network-bullet').data(diagram.data).exit().remove();

            //animate bullets
            animateBullets();
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

        //return network matrix diagram
        return diagram;
    }

    //attach network matrix method into the eve
    e.networkMatrix = function (options) {
        options.type = 'xy';
        return new networkMatrix(options);
    };
})(eve);