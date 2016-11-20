/*!
 * eve.pyramid.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Base class for pyramid chart.
 */
(function (e) {
    //define pyramid chart class
    function pyramidChart(options) {
        //declare needed variables
        var that = this,
            chart = eve.base.init(options),
            currentSerie = chart.series[0],
            xField = chart.xField,
            valueField = currentSerie.valueField || currentSerie.yField || currentSerie.sizeField,
            tooltipContent = '',
            zeroDataSet = e.clone(chart.data),
            pyramidHeight = chart.height - chart.plot.top - chart.plot.bottom,
            pyramidWidth = chart.width - chart.plot.left - chart.plot.right,
            gradePercent = 1 / 200,
            grade = 2 * pyramidHeight / (pyramidWidth - gradePercent * pyramidWidth),
            totalArea = (pyramidWidth + gradePercent * pyramidWidth) * pyramidHeight / 2,
            totalData = d3.sum(chart.data, function (d) { return d[valueField]; }),
            pyramidSeries = null,
            pyramidLabels = null,
            paths = null,
            pyramid = d3.line().x(function (d) { return d[0]; }).y(function (d) { return d[1]; });

        //animates pyramid chart
        function animatePyramid() {
            //update paths
            paths = getPaths(chart.data);

            //animate pyramid series
            pyramidSeries
                .data(chart.data)
                .transition(chart.animation.duration)
                .ease(chart.animation.easing.toEasing())
                .delay(function (d, i) { return i * chart.animation.delay; })
                .attr('d', function (d, i) { return pyramid(paths[i]); });
        }

        //gets paths
        function getPaths(data) {
            var paths = [], pathPoints = [];

            //inner function to create path points
            function createPathPoints(ll, lr, lh, i) {
                if (i >= data.length) return;
                v = data[i][valueField];
                a = v * totalArea / totalData;
                pw = lr - ll;
                nw = Math.sqrt((grade * pw * pw - 4 * a) / grade);
                nl = (pw - nw) / 2 + ll;
                nr = lr - (pw - nw) / 2;
                nh = (grade * (pw - nw) / 2 + lh);

                pathPoints = [[nr, nh]];
                pathPoints.push([lr, lh]);
                pathPoints.push([ll, lh]);
                pathPoints.push([nl, nh]);
                pathPoints.push([nr, nh]);

                paths.push(pathPoints);
                createPathPoints(nl, nr, nh, i + 1);
            }

            createPathPoints(0, pyramidWidth, 0, 0);
            return paths;
        }

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
                if (key === valueField)
                    zeroDataSet[i][key] = 0;
            }
        });

        //get trapezoid paths
        paths = getPaths(zeroDataSet);
        
        //create chart g
        var chartG = chart.svg.append('g')
            .attr('transform', 'translate(' + chart.plot.left + ',' + chart.plot.top + ')');

        //create pyramid slices
        pyramidSeries = chartG.selectAll('path.eve-pyramid-slice')
            .data(zeroDataSet)
            .enter().insert('path')
            .attr('class', function (d, i) { return 'eve-pyramid-slice eve-pyramid-slice-' + i; })
            .attr('d', function (d, i) { return pyramid(paths[i]); })
            .attr('fill-opacity', function (d) {
                //chehck whether the current serie has alpha field
                if (currentSerie.alphaField !== '')
                    return +d[currentSerie.alphaField];
                else
                    return currentSerie.alpha;
            })
            .attr('fill', function (d) { return d._sliceColor; })
            .attr('stroke', currentSerie.sliceStrokeColor === '' ? '#ffffff' : currentSerie.sliceStrokeColor)
            .attr('stroke-opacity', currentSerie.sliceStrokeAlpha)
            .attr('transform', 'translate(' + pyramidWidth + ',' + pyramidHeight + ')rotate(180)')
            .attr('stroke-width', currentSerie.sliceStrokeThickness)
            .on('click', function (d) {
                if (chart.sliceClick)
                    chart.sliceClick(d);
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
            });

        //animate pyramid
        animatePyramid();

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

            //update total data
            totalData = d3.sum(chart.data, function (d) { return d[valueField]; });

            //animate pyramid series
            animatePyramid();
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

    //attach pyramid chart method into the eve
    e.pyramidChart = function (options) {
        options.type = 'sliced';
        return new pyramidChart(options);
    };

})(eve);