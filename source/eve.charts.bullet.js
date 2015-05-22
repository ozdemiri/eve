/*!
 * eve.charts.bullet.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Bullet chart class.
 */
(function (eveCharts) {
    //bullet chart creator class
    function bulletChart(chart) {
        //create plot and axis
        var plot = chart.plot,
            serie = chart.series[0],
            maxTextLength = 0,
            sectorHeight = (plot.height - chart.margin.top - chart.margin.bottom) / chart.data.length,
            itemHeight = sectorHeight - sectorHeight * .1 - serie.labelFontSize - 5,
            itemWidth = 0,
            arrRanges = [],
            arrMeasures = [],
            arrMarkers = [],
            arrTickLines = [],
            arrTickLabels = [],
            arrDomains = [];

        //append g for each data points
        plot.canvas.attr('transform', 'translate(' + chart.margin.left + ',' + chart.margin.top + ')');

        //create an internal function to get ranges
        function getRanges(data) {
            //declare an array to get ranges
            var ranges = [];

            //iterate all range fields
            serie.rangeFields.each(function (rangeField) {
                if (data[rangeField] !== null)
                    ranges.push(parseFloat(data[rangeField]));
            });

            //return ranges
            return ranges.sort(d3.descending);
        };

        //create an internal function to init chart
        function init() {
            //append labels
            var labels = plot.canvas.selectAll('.bullet-label')
                .data(chart.data);

            //append text to labels
            labels.enter().append('text')
                .attr('class', 'bullet-label')
                .style('fill', serie.titleFontColor)
                .style('font-weight', serie.titleFontStyle == 'bold' ? 'bold' : 'normal')
                .style('font-style', serie.titleFontStyle == 'bold' ? 'normal' : serie.titleFontStyle)
                .style("font-family", serie.titleFontFamily)
                .style("font-size", serie.titleFontSize + 'px')
                .text(function (d) { return d[serie.titleField]; })
                .attr('transform', function (d, i) {
                    //get bbox
                    var bbox = this.getBBox();

                    //set max text length
                    if (bbox.width > maxTextLength) maxTextLength = bbox.width;

                    //calculate y position of the texts
                    var ypos = sectorHeight * i + sectorHeight / 2 - bbox.height / 2 + chart.margin.top;

                    //return translation
                    return 'translate(' + chart.margin.left + ', ' + ypos + ')';
                });

            //declare item width
            itemWidth = plot.width - maxTextLength - (chart.margin.left * 2) - chart.margin.right

            //iterate all datas
            chart.data.each(function (d, i) {
                //get ranges
                var ranges = getRanges(d),
                    marker = d[serie.markerField] === null ? 0 : parseFloat(d[serie.markerField]),
                    value = d[serie.valueField] === null ? 0 : parseFloat(d[serie.valueField]),
                    maxWidth = Math.max(ranges[0], marker, value),
                    xDomain = d3.scale.linear().domain([0, maxWidth]).range([0, itemWidth]);

                //push domains
                arrDomains.push(xDomain);

                //create range rects
                var rangeRects = plot.canvas.selectAll('.bullet-range-' + i).data(ranges);

                //append all ranges
                rangeRects = rangeRects.enter().append('rect')
                    .style('fill', serie.rangeColor)
                    .style('fill-opacity', function (r, j) { return (j + 1) / ranges.length; })
                    .attr('class', 'bullet-range-' + i)
                    .attr('width', function (r, j) { return r / maxWidth * itemWidth; })
                    .attr('height', itemHeight)
                    .attr('transform', function () {
                        //calculate x and y positions
                        var xpos = maxTextLength + chart.margin.left,
                            ypos = ((itemHeight + (sectorHeight * .1) + serie.labelFontSize + 5) * i);

                        //return translation
                        return 'translate(' + xpos + ',' + ypos + ')'
                    });

                //push range rects
                arrRanges.push(rangeRects);

                //append value measure
                var measureRect = plot.canvas.append('rect')
                    .style('fill', serie.color)
                    .style('cursor', 'pointer')
                    .attr('width', value / maxWidth * itemWidth)
                    .attr('height', itemHeight - (itemHeight * .3))
                    .attr('transform', function () {
                        //calculate x and y positions
                        var xpos = maxTextLength + chart.margin.left,
                            ypos = (((itemHeight + (sectorHeight * .1) + serie.labelFontSize + 5) * i) + (itemHeight * .3) / 2);

                        //return translation
                        return 'translate(' + xpos + ',' + ypos + ')'
                    })
                    .on('mousemove', function () {
                        //get serie color
                        var serieColor = '',
                            balloonContent = chart.setBalloonContent({
                                type: 'bullet',
                                data: d,
                                format: serie.valueFormat,
                                dataIndex: i,
                                serie: serie
                            });
                        //formatValue(serie.valueFormat, d);

                        //check whether the serie has color field
                        if (serie.colorField !== '') {
                            serieColor = d[serie.colorField];
                        } else {
                            if (serie.color === '')
                                serieColor = eve.randomColor();
                            else
                                serieColor = serie.color;
                        }

                        //set balloon border color
                        plot.balloon.style('borderColor', serieColor);

                        //Show balloon
                        chart.showBalloon(balloonContent);

                        //decarease opacity
                        d3.select(this).attr('fill-opacity', .9);
                    })
                    .on('mouseout', function () {
                        //hide balloon
                        chart.hideBalloon();

                        //increase opacity
                        d3.select(this).attr('fill-opacity', 1);
                    });

                //push measure
                arrMeasures.push(measureRect);

                //append marker measre
                var markerRect = plot.canvas.append('rect')
                    .style('fill', serie.markerColor)
                    .style('cursor', 'pointer')
                    .attr('width', serie.markerWidth)
                    .attr('height', itemHeight - (itemHeight * .3))
                    .attr('transform', function () {
                        //calculate x and y positions
                        var xpos = (maxTextLength + chart.margin.left + (marker / maxWidth * itemWidth)),
                            ypos = (((itemHeight + (sectorHeight * .1) + serie.labelFontSize + 5) * i) + (itemHeight * .3) / 2);

                        //return translation
                        return 'translate(' + xpos + ',' + ypos + ')'
                    })
                    .on('mousemove', function () {
                        //get serie color
                        var serieColor = serie.markerColor !== '' ? serie.markerColor : eve.randomColor(),
                            balloonContent = chart.setBalloonContent({
                                type: 'bullet',
                                data: d,
                                format: serie.markerFormat,
                                dataIndex: i,
                                serie: serie
                            });
                        //formatValue(serie.markerFormat, d);

                        //set balloon border color
                        plot.balloon.style('borderColor', serieColor);

                        //Show balloon
                        chart.showBalloon(balloonContent);

                        //decarease opacity
                        d3.select(this).attr('fill-opacity', .9);
                    })
                    .on('mouseout', function () {
                        //hide balloon
                        chart.hideBalloon();

                        //increase opacity
                        d3.select(this).attr('fill-opacity', 1);
                    });

                //push marker
                arrMarkers.push(markerRect);

                //create ticks lines and texts
                var tickLines = plot.canvas.selectAll('.bullet-tick-line-' + i).data(xDomain.ticks(10)),
                    tickLabels = plot.canvas.selectAll('.bullet-tick-text-' + i).data(xDomain.ticks(10));

                //create tick lines
                tickLines.enter().append('rect')
                    .style('fill', '#aaaaaa')
                    .attr('width', 1)
                    .attr('height', 5)
                    .attr('transform', function (t, j) {
                        //caclulate x and y positions
                        var xpos = (maxTextLength + chart.margin.left + (t / maxWidth * itemWidth)),
                            ypos = itemHeight + ((itemHeight + (sectorHeight * .1) + serie.labelFontSize + 5) * i);

                        //return translation
                        return 'translate(' + xpos + ',' + ypos + ')';
                    });

                //create tick texts
                tickLabels.enter().append('text')
                    .style('fill', serie.labelFontColor)
                    .style('font-size', serie.labelFontSize + 'px')
                    .style('font-family', serie.labelFontFamily)
                    .style('font-style', serie.labelFontStlye === 'bold' ? 'normal' : serie.labelFontStlye)
                    .style('font-weight', serie.labelFontStlye === 'bold' ? 'bold' : 'normal')
                    .style('text-anchor', function (t, j) {
                        if (j === 0)
                            return 'start';
                        else if (j === xDomain.ticks(10).length - 1)
                            return 'end';
                        else
                            return 'middle';
                    })
                    .text(function (t, j) {
                        return t;
                    })
                    .attr('transform', function (t, j) {
                        //caclulate x and y positions
                        var xpos = (maxTextLength + chart.margin.left + (t / maxWidth * itemWidth)),
                            ypos = itemHeight + ((itemHeight + (sectorHeight * .1) + serie.labelFontSize + 5) * i) + serie.labelFontSize + 5;

                        //return translation
                        return 'translate(' + xpos + ',' + ypos + ')';
                    });

                //push lines and labels
                arrTickLabels.push(tickLabels);
                arrTickLines.push(tickLines);
            });
        }

        //init chart
        init();

        //return chart
        return chart;
    };


    //set eve charts create bullet chart method
    eveCharts.bullet = function (options) {
        /// <summary>
        /// Creates a new bullet chart with the given options.
        /// </summary>
        /// <param name="options"></param>
        /// <returns type="object">Eve chart object.</returns>

        //check whether the chart configurator is not null
        if (this.configurator) {
            //handle series in options
            if (options['series'] !== null) {
                //iterate all series
                options.series.each(function (serie) {
                    serie.type = 'bullet';
                });
            }

            //create chart object
            var bullet = bulletChart(new this.configurator(options));

            //add chart instance
            if (bullet !== null)
                this.instances[bullet.id] = bullet;

            //return new chart object
            return bullet;
        } else {
            //return null
            return null;
        }
    };
})(eve.charts);