/*!
 * eve.donut.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Base class for donut chart.
 */
(function (e) {
    //define donut chart class
    function donutChart(options) {
        //declare needed variables
        var that = this,
            chart = eve.base.init(options),
            currentSerie = chart.series[0],
            xField = chart.xField,
            tooltipContent = '',
            donutWidth = (chart.plot.width - chart.plot.left - chart.plot.right),
            donutHeight = (chart.plot.height - chart.plot.bottom - chart.plot.top),
            transX = (chart.width - chart.plot.left - chart.plot.right) / 2,
            transY = donutHeight / 2,
            outerRadius = Math.min(donutWidth, donutHeight) / 2,
            innerRadius = outerRadius / 2,
            arc = d3.arc().outerRadius(outerRadius).innerRadius(innerRadius),
            donutSeries = null,
            zeroDataSet = e.clone(chart.data),
            donutLabels = null;

        //declare donut data function
        var donutData = d3.pie().sort(null).value(function (d) {
            //check whether the current serie has value field
            if (currentSerie.yField !== '')
                return +d[currentSerie.yField];
            else if (currentSerie.sizeField !== '')
                return +d[currentSerie.sizeField];
            else
                return +d[currentSerie.valueField];
        });

        //sort data
        chart.data.sort(function (a, b) {
            return ((a[chart.xField] < b[chart.xField]) ? -1 : ((a[chart.xField] > b[chart.xField]) ? 1 : 0));
        });

        //iterate chart data
        chart.data.forEach(function (d, i) {
            //set slice color
            d._sliceColor = i > e.colors.length ? e.randColor() : e.colors[i];
            zeroDataSet[i]._sliceColor = i > e.colors.length ? e.randColor() : e.colors[i];

            //check whether the current serie has color field
            if (currentSerie.colorField !== '') {
                d._sliceColor = d[currentSerie.colorField];
                zeroDataSet[i]._sliceColor = d[currentSerie.colorField];
            }

            //iterate all keys in current data
            for (var key in d) {
                //set zeroed dataset
                if (key === currentSerie.yField)
                    zeroDataSet[i][key] = 0;
                else if (key === currentSerie.sizeField)
                    zeroDataSet[i][key] = 0;
                else if (key === currentSerie.valueField)
                    zeroDataSet[i][key] = 0;
            }
        });

        //create chart g
        var chartG = chart.svg.append('g')
            .attr('transform', 'translate(' + transX + ',' + transY + ')');

        //animates donut paths
        function animateDonut() {
            donutSeries
                .data(donutData(chart.data))
                .transition(chart.animation.duration)
                .ease(chart.animation.easing.toEasing())
                .delay(function (d, i) { return i * chart.animation.delay; })
                .attrTween('d', function (d) {
                    var interpolate = d3.interpolate(this._current, d);
                    this._current = interpolate(0);
                    return function (t) {
                        return arc(interpolate(t));
                    };
                });
        }

        //create donut slices
        donutSeries = chartG.selectAll('path')
            .data(donutData(zeroDataSet))
            .enter()
            .append('path')
            .attr('d', arc)
            .attr('fill-opacity', function (d) {
                //chehck whether the current serie has alpha field
                if (currentSerie.alphaField !== '')
                    return +d.data[currentSerie.alphaField];
                else
                    return currentSerie.alpha;
            })
            .attr('fill', function (d) { return d.data._sliceColor; })
            .attr('stroke', currentSerie.sliceStrokeColor === '' ? '#ffffff' : currentSerie.sliceStrokeColor)
            .attr('stroke-opacity', currentSerie.sliceStrokeAlpha)
            .attr('stroke-width', currentSerie.sliceStrokeThickness)
            .on('click', function (d) {
                if (chart.sliceClick)
                    chart.sliceClick(d.data);
            })
            .on('mousemove', function (d) {
                //set slice hover
                d3.select(this).attr('fill-opacity', currentSerie.sliceHoverAlpha);

                //show tooltip
                chart.showTooltip(chart.getContent(d, currentSerie, chart.tooltip.format));
            })
            .on('mouseout', function (d) {
                //set slice hover
                d3.select(this).attr('fill-opacity', currentSerie.alpha);

                //hide tooltip
                chart.hideTooltip();
            })
            .each(function (d) { this._current = d; });

        //animate donut series
        animateDonut();

        //attach update method to the chart
        chart.update = function (data) {
            //update chart data
            chart.data = data;

            //sort data
            chart.data.sort(function (a, b) {
                return ((a[chart.xField] < b[chart.xField]) ? -1 : ((a[chart.xField] > b[chart.xField]) ? 1 : 0));
            });

            //update legend
            chart.updateLegend();

            //animate donut series
            animateDonut();
        };

        //draws the chart into a canvas
        chart.toCanvas = function () {
            //get the chart container
            var orgDiv = document.getElementById(chart.container);
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
        chart.toImage = function () {
            //get the chart container
            var orgDiv = document.getElementById(chart.container);
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

        //return column chart
        return chart;
    }

    //attach donut chart method into the eve
    e.donutChart = function (options) {
        options.type = 'sliced';
        return new donutChart(options);
    };
})(eve);