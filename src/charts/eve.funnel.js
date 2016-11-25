/*!
 * eve.funnel.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Base class for funnel chart.
 */
(function (e) {
    //define funnel chart class
    function funnelChart(options) {
        //declare needed variables
        var that = this,
            chart = eve.base.init(options),
            currentSerie = chart.series[0],
            xField = chart.xField,
            valueField = currentSerie.valueField || currentSerie.yField || currentSerie.sizeField,
            tooltipContent = '',
            zeroDataSet = e.clone(chart.data),
            funnelHeight = chart.height - chart.plot.top - chart.plot.bottom - currentSerie.neckHeight,
            funnelWidth = chart.width - chart.plot.left - chart.plot.right,
            gradePercent = 1 / 10,
            grade = 2 * funnelHeight / (funnelWidth - gradePercent * funnelWidth),
            totalArea = (funnelWidth + gradePercent * funnelWidth) * funnelHeight / 2,
            totalData = d3.sum(chart.data, function (d) { return d[valueField]; }),
            funnelSeries = null,
            funnelLabels = null,
            paths = null,
            funnel = d3.line().x(function (d) { return d[0]; }).y(function (d) { return d[1]; });

        //animates funnel chart
        function animateFunnel() {
            //update paths
            paths = getPaths(chart.data);

            //animate funnel series
            funnelSeries
                .data(chart.data)
                .transition(chart.animation.duration)
                .ease(chart.animation.easing.toEasing())
                .delay(function (d, i) { return i * chart.animation.delay; })
                .attr('d', function (d, i) { return funnel(paths[i]); });
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

                //check whether the neck height > 0
                if(currentSerie.neckHeight > 0) {
                    //create neck path
                    if(i === data.length - 1) {
                        pathPoints.push([nr, nh + currentSerie.neckHeight]);
                        pathPoints.push([nl, nh + currentSerie.neckHeight]);
                        pathPoints.push([nl, nh]);
                    }
                }

                paths.push(pathPoints);
                createPathPoints(nl, nr, nh, i + 1);
            }

            createPathPoints(0, funnelWidth, 0, 0);
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
            } else if (currentSerie.dataColors) {
                d._sliceColor = currentSerie.dataColors[d[chart.xField].toString()];
                zeroDataSet[i]._sliceColor = currentSerie.dataColors[d[chart.xField].toString()];
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

        //create funnel slices
        funnelSeries = chartG.selectAll('path.eve-funnel-slice')
            .data(zeroDataSet)
            .enter().insert('path')
            .attr('class', function (d, i) { return 'eve-funnel-slice eve-funnel-slice-' + i; })
            .attr('d', function (d, i) { return funnel(paths[i]); })
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

        //animate funnel
        animateFunnel();

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

            //animate funnel series
            animateFunnel();
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

    //attach funnel chart method into the eve
    e.funnelChart = function (options) {
        options.type = 'sliced';
        return new funnelChart(options);
    };

})(eve);