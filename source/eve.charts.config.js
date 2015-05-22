/*!
 * eve.charts.config.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Configuration objects for the eveCharts.
 */
(function (eveCharts) {
    //declare base chart object
    function chart(options) {
        /// <summary>
        /// Creates a new chart object with the given options.
        /// </summary>
        /// <param name="options"></param>

        //set members
        this.animationDuration = 500;
        this.backColor = '#ffffff';
        this.balloon = new balloon();
        this.borderColor = '#eeeeee';
        this.borderRadius = 0;
        this.borderSize = 0;
        this.borderStyle = 'solid';
        this.container = null;
        this.data = null;
        this.dateFormat = '%x';
        this.decimalSeperator = '.';
        this.formatNumbers = false;
        this.id = eve.createGUID();
        this.legend = new legend();
        this.margin = { left: 10, top: 10, right: 10, bottom: 10 };
        this.precision = 2;
        this.series = [];
        this.thousandSeperator = ',';
        this.trends = [];
        this.prefix = '';
        this.suffix = '';
        this.useAbbreviations = false;
        this.xAxis = new xAxis();
        this.xField = '';
        this.yAxis = new yAxis();
        
        //set chart events
        this.legendClick = function (data) { };
        this.serieClick = function (data) { };

        //set base
        var base = this,
            dateFormatter = d3.time.format(this.dateFormat),
            chartType = 'sliced';

        //iterate all members in options to set this members
        for (var key in options) {
            //check whether the given key is contained by this object
            if (this[key] !== undefined || this[key] !== null) {
                //switch key to create object based instantiation
                switch (key) {
                    case 'balloon':
                        this[key] = new balloon(options[key]);
                        break;
                    case 'legend':
                        this[key] = new legend(options[key]);
                        break;
                    case 'xAxis':
                        this[key] = new xAxis(options[key]);
                        break;
                    case 'yAxis':
                        this[key] = new yAxis(options[key]);
                        break;
                    case 'trends':
                        {
                            //iterate all items in trends
                            options[key].each(function (trendOptions) {
                                base[key].push(new trend(trendOptions));
                            })
                        }
                        break;
                    case 'series':
                        {
                            //iterate all items in series
                            options[key].each(function (serieObject) {
                                //check whether the current serie object has a
                                if (serieObject['type'] === undefined || serieObject['type'] === null) {
                                    throw new Error('Serie type can not be found!');
                                    return null;
                                } else {
                                    //switch serie type
                                    switch (serieObject.type) {
                                        case 'pie':
                                        case 'donut':
                                            {
                                                base[key].push(new pieSerie(serieObject));
                                                chartType = 'sliced';
                                            }
                                            break;
                                        case 'funnel':
                                        case 'pyramid':
                                            {
                                                base[key].push(new funnelSerie(serieObject));
                                                chartType = 'sliced';
                                            }
                                            break;
                                        case 'gauge':
                                            {
                                                base[key].push(new gaugeSerie(serieObject));
                                                chartType = 'sliced';
                                            }
                                            break;
                                        case 'bullet':
                                            {
                                                base[key].push(new bulletSerie(serieObject));
                                                chartType = 'sliced';
                                            }
                                            break;
                                        case 'parallel':
                                            {
                                                base[key].push(new parallelSerie(serieObject));
                                                chartType = 'linear';
                                            }
                                            break;
                                        default:
                                            {
                                                base[key].push(new xySerie(serieObject));
                                                chartType = 'linear';
                                            }
                                            break;
                                    }
                                }
                            });
                        }
                        break;
                    default:
                        this[key] = options[key];
                        break;
                }
            }
        };

        //create an internal function to create chart plot
        function chartPlot() {
            //set members of the plot
            this.container = null;
            this.width = 0;
            this.height = 0;
            this.canvas = null;
            this.balloon = null;

            //check base container's type
            if (eve.getType(base.container) === 'string')
                this.container = eve('#' + base.container);
            else if (eve.getType(base.container) === 'htmlElement')
                this.container = eve(base.container);
            else
                this.container = base.container;

            //clear container content
            this.container.html('');

            //declare internal variables
            var offset = this.container.offset(),
                dateFormatter = d3.time.format(base.dateFormat);

            //set dimension members
            this.width = offset.width;
            this.height = offset.height;

            //set base background color
            this.container.style('backgroundColor', base.backColor);

            //check whether the base has borders
            if (base.borderSize > 0) {
                //set base border style
                this.container.style('borderStyle', base.borderStyle);
                this.container.style('borderWidth', base.borderSize + 'px');
                this.container.style('borderColor', base.borderColor);
                this.container.style('borderRadius', base.borderRadius + 'px');
            }

            //check whether the balloon is enabled
            if (base.balloon.enabled) {
                //append balloon div into the document
                eve(document.body).append('<div id="' + base.id + '_balloon" style="position: absolute; display: none; z-index: 1000;"></div>');

                //set balloon as eve object
                this.balloon = eve('#' + base.id + '_balloon');

                //set balloon style
                this.balloon.style('backgroundColor', base.balloon.backColor);
                this.balloon.style('borderStyle', base.balloon.borderStyle);
                this.balloon.style('borderColor', base.balloon.borderColor);
                this.balloon.style('borderRadius', base.balloon.borderRadius + 'px');
                this.balloon.style('borderWidth', base.balloon.borderSize + 'px');
                this.balloon.style('color', base.balloon.fontColor);
                this.balloon.style('fontFamily', base.balloon.fontFamily);
                this.balloon.style('fontSize', base.balloon.fontSize + 'px');
                this.balloon.style('paddingLeft', base.balloon.padding + 'px');
                this.balloon.style('paddingTop', base.balloon.padding + 'px');
                this.balloon.style('paddingRight', base.balloon.padding + 'px');
                this.balloon.style('paddingBottom', base.balloon.padding + 'px');
                if (base.balloon.fontStyle == 'bold') this.balloon.style('fontWeight', 'bold'); else this.balloon.style('fontStyle', base.balloon.fontStyle);
            }

            //create base canvas
            this.canvas = d3.select(this.container.reference)
                .append('svg')
                .attr('id', base.id + '_svg')
                .attr('viewBox', '0 0 ' + this.width + ' ' + this.height)
                .attr('width', this.width)
                .attr('height', this.height)
                .append('g');

            //set aspect ratio
            this.aspectRatio = this.width / this.height;
        };

        //create an internal function to create chart axis
        function chartAxis(isReversed) {
            //check whether the isreversed parameter is null
            if (isReversed == null) isReversed = false;

            //set public axis members
            this.x = null;
            this.y = null;
            this.xAxis = null;
            this.yAxis = null;
            this.series = null;
            this.serieNames = [];

            //declare needed axis variables
            var that = this,
                xAxis, xAxisTitle, xAxisLabels, yAxis, yAxisTitle, yAxisLabels,
                legendIcons, legendTexts, legendWidth, legendHeight,
                axisLeft = base.margin.left,
                axisWidth = base.plot.width - base.margin.left - base.margin.right - base.yAxis.labelFontSize * 2,
                axisTop = base.margin.top,
                axisHeight = base.plot.height - base.margin.top - base.margin.bottom - base.xAxis.labelFontSize * 2,
                maxValues = [], minValues = [], maxXErrors = [],
                yDomains = [];

            //translate canvas
            base.plot.canvas.attr('transform', 'translate(' + base.margin.left + ',' + base.margin.top + ')');

            //iterate all series
            base.series.each(function (serie, serieIndex) { that.serieNames.push(serie.yField); });

            //iterate all data
            that.series = that.serieNames.map(function (name, index) {
                return {
                    name: name,
                    serieType: base.series[index].type,
                    values: base.data.map(function (d) {
                        //get x field value
                        var xValue = d[base.xField],
                            serie = base.series[index],
                            dataObject = {};

                        //switch base xAxis data type
                        switch (base.xAxis.dataType) {
                            case 'date':
                                xValue = (eve.getType(d[base.xField]) === 'dateTime' ? d[base.xField] : new Date(d[base.xField]));
                                break;
                            case 'string':
                                xValue = eve.getType(d[base.xField]) === 'dateTime' ? base.plot.formatDate(d[base.xField]) : d[base.xField].toString();
                                break;
                            default:
                                xValue = d[base.xField];
                                break;
                        }

                        //set data object members
                        dataObject['name'] = name;
                        dataObject['index'] = index;
                        dataObject['serieType'] = serie.type;
                        dataObject['xField'] = xValue;

                        //check whether the serie has y Field
                        if (serie.yField !== '') dataObject['yField'] = +parseFloat(d[name]);

                        //check whether the serie has size field
                        if (serie.sizeField !== '') dataObject['sizeField'] = +parseFloat(d[serie.sizeField]);

                        //check whether the serie has open field
                        if (serie.openField !== '') dataObject['openField'] = +parseFloat(d[serie.openField]);

                        //check whether the serie has high field
                        if (serie.highField !== '') dataObject['highField'] = +parseFloat(d[serie.highField]);

                        //check whether the serie has low field
                        if (serie.lowField !== '') dataObject['lowField'] = +parseFloat(d[serie.lowField]);

                        //check whether the serie has close field
                        if (serie.closeField !== '') dataObject['closeField'] = +parseFloat(d[serie.closeField]);

                        //check whether the serie x error field
                        if (serie.xErrorField !== '') dataObject['xErrorField'] = +parseFloat(d[serie.xErrorField]);

                        //check whether the serie y error field
                        if (serie.yErrorField !== '') dataObject['yErrorField'] = +parseFloat(d[serie.yErrorField]);

                        //return final data object
                        return dataObject;
                    })
                };
            });

            //iterate all series
            that.series.each(function (serie, index) {
                //push current serie max to max values
                maxValues.push(d3.max(serie.values, function (d) {
                    //switch serie type to calculate max value
                    switch (d.serieType) {
                        case 'ohlc':
                        case 'candlestick':
                            return parseFloat(d.highField);
                        default:
                            return parseFloat(d.yField);
                    }
                }));

                //push current serie min to min values
                minValues.push(d3.min(serie.values, function (d) {
                    //switch serie type to calculate max value
                    switch (d.serieType) {
                        case 'ohlc':
                        case 'candlestick':
                            return parseFloat(d.lowField);
                        default:
                            return parseFloat(d.yField);
                    }
                }));

                //push max x errors into array
                maxXErrors.push(d3.max(serie.values, function (d) { return parseFloat(d.xErrorField); }));

                //create serie min
                var serieMin = d3.min(that.series, function (c) {
                    return d3.min(c.values, function (v) {
                        //switch serie type to calculate max value
                        switch (v.serieType) {
                            case 'ohlc':
                            case 'candlestick':
                                return parseFloat(v.lowField);
                            default:
                                return parseFloat(v.yField);
                        }
                    });
                });

                //create serie max
                var serieMax = d3.max(that.series, function (c) {
                    return d3.max(c.values, function (v) {
                        //switch serie type to calculate max value
                        switch (v.serieType) {
                            case 'ohlc':
                            case 'candlestick':
                                return parseFloat(v.highField);
                            default:
                                return parseFloat(v.yField);
                        }
                    });
                });

                //increase serie max by 10 percent
                serieMax *= 1.1;

                //get max x,y error values
                var yErrorMax = d3.max(serie.values, function (d) { return parseFloat(d.yErrorField); });

                //update serie max
                serieMax += yErrorMax === undefined ? 0 : yErrorMax;

                //get serie min and max values for size
                var sizeMin = d3.min(serie.values, function (d) { return parseFloat(d.sizeField); });
                var sizeMax = d3.max(serie.values, function (d) { return parseFloat(d.sizeField); });

                //set serie min and max values for size
                serie.minSize = sizeMin === undefined ? base.series[index].minBulletSize : sizeMin;
                serie.maxSize = sizeMax === undefined ? base.series[index].maxBulletSize : sizeMax;

                //set serie min
                serieMin = base.yAxis.startFromZero ? 0 : serieMin;
                serieMin -= yErrorMax === undefined ? 0 : yErrorMax;

                //set y domains
                yDomains.push(serieMin);
                yDomains.push(serieMax);
            });

            //get max text value
            var maxValue = maxValues.max(),
                minValue = minValues.min(),
                maxXError = maxXErrors.max(),
                maxValueLength = (maxValue.toString().length * base.yAxis.labelFontSize / 2);

            //decrease axis width
            axisWidth -= maxValueLength;

            //increase axis left
            axisLeft += maxValueLength;

            //create an internal function to hide balloon
            function hideBalloon() {
                /// <summary>
                /// Hides balloon.
                /// </summary>
                base.plot.balloon.style('display', 'none');
            };

            //create an internal function to show balloon
            function showBalloon(content) {
                /// <summary>
                /// Shows balloon with given content.
                /// </summary>
                /// <param name="content"></param>
                /// <param name="data"></param>

                //check whether the arguments
                if (content == null) hideBalloon();

                //set balloon content
                base.plot.balloon.html(content);

                //set balloon postion and show
                base.plot.balloon.style('left', (parseInt(d3.event.pageX) + 5) + 'px');
                base.plot.balloon.style('top', (parseInt(d3.event.pageY) + 5) + 'px');
                base.plot.balloon.style('display', 'block');
            };

            //create an internal function format trend balloon value
            function formatTrendValue(value, data) {
                //handle errors
                if (arguments.length === 0) return '';
                if (value == null || data == null) return '';

                //declare format variables
                var formatted = value,
                    startX = data['startX'] === null ? 0 : data.startX,
                    endX = data['endX'] === null ? 0 : data.endX,
                    startY = data['startY'] === null ? 0 : data.startY,
                    endY = data['endY'] === null ? 0 : data.endY;

                //convert titles
                if (data['title'] != null) formatted = formatted.replaceAll('{{title}}', data.title);

                //convert startX
                if (data['startX'] != null) formatted = formatted.replaceAll('{{startX}}', startX);

                //convert endX
                if (data['endX'] != null) formatted = formatted.replaceAll('{{endX}}', endX);

                //convert startX
                if (data['startY'] != null) formatted = formatted.replaceAll('{{startY}}', startY);

                //convert startX
                if (data['endY'] != null) formatted = formatted.replaceAll('{{endY}}', endY);

                //return formatted value
                return formatted;
            };

            //create an internal function to draw legend
            function drawLegend() {
                //create legends
                if (base.legend.enabled) {
                    //create legend icon symbol
                    var symbolSize = Math.pow(base.legend.fontSize, 2);

                    //set legend width
                    legendWidth = base.legend.fontSize + 5;

                    //set legend height
                    legendHeight = base.series.length * base.legend.fontSize;

                    //create legend icon
                    legendTexts = base.plot.canvas.selectAll('.eve-legend-text').data(base.series).enter().append('g');

                    //create legend icon
                    legendIcons = base.plot.canvas.selectAll('.eve-legend-icon').data(base.series).enter().append('g');

                    //set legend texts
                    legendTexts.append('text')
                        .attr('class', 'eve-legend-text')
                        .style('cursor', 'pointer')
                        .style('fill', base.legend.fontColor)
                        .style('font-weight', base.legend.fontStyle == 'bold' ? 'bold' : 'normal')
                        .style('font-style', base.legend.fontStyle == 'bold' ? 'normal' : base.legend.fontStyle)
                        .style("font-family", base.legend.fontFamily)
                        .style("font-size", base.legend.fontSize + 'px')
                        .style("text-anchor", 'left')
                        .text(function (d, i) {
                            //get legend title
                            var legendTitle = base.series[i].title;

                            //check whether the legend title is not empty
                            if (legendTitle !== '')
                                return legendTitle;
                            else
                                return base.series[i].yField === '' ? ('Serie' + (i + 1)) : base.series[i].yField;
                        })
                        .on('click', function (d, i) {
                            //set data selected event
                            if (d.selected) { d.selected = false; } else { d.selected = true; }

                            //switch base serie type
                            switch (d.type) {
                                case 'line':
                                    {
                                        //get serie path
                                        var selectedSerie = base.plot.canvas.selectAll('.eve-line-serie-' + i),
                                            selectedPoints = base.plot.canvas.selectAll('.eve-line-point-' + i);

                                        //check whether the line is selected
                                        if (d.selected) {
                                            //decrease opacity of all series
                                            base.plot.canvas.selectAll('.eve-series path').style('stroke-opacity', .1);

                                            //set selected serie stroke size
                                            selectedSerie.style('stroke-width', d.lineSize + 2);

                                            //set selected serie opacity
                                            selectedSerie.style('stroke-opacity', 1);
                                            selectedPoints.style('stroke-opacity', 1);
                                        } else {
                                            //decrease opacity of all series
                                            base.plot.canvas.selectAll('.eve-series path').style('stroke-opacity', 1);

                                            //set selected serie stroke size
                                            selectedSerie.style('stroke-opacity', d.lineAlpha);
                                            selectedSerie.style('stroke-width', d.lineSize);
                                        }
                                    }
                                    break;
                                case 'area':
                                    {
                                        //get all series
                                        var allSeries = base.plot.canvas.selectAll('.eve-series path.eve-area-serie'),
                                            selectedSerie = base.plot.canvas.selectAll('.eve-area-serie-' + i),
                                            selectedPoints = base.plot.canvas.selectAll('.eve-area-point-' + i);

                                        //check whether the line is selected
                                        if (d.selected) {
                                            //set selected serie stroke size
                                            selectedSerie.style('stroke-width', d.lineSize + 2);
                                            allSeries.style('stroke-opacity', .1);
                                            allSeries.style('fill-opacity', .1);

                                            //set selected serie opacity
                                            selectedSerie.style('stroke-width', d.lineSize);
                                            selectedSerie.style('fill-opacity', d.alpha);
                                        } else {
                                            //set selected serie stroke size
                                            allSeries.style('stroke-opacity', d.lineSize);
                                            allSeries.style('fill-opacity', d.alpha);
                                        }
                                    }
                                    break;
                                case 'scatter':
                                    {
                                        //get all series
                                        var allSeries = base.plot.canvas.selectAll('.eve-series path.eve-scatter-point'),
                                            selectedPoints = base.plot.canvas.selectAll('.eve-scatter-point-' + i);

                                        //check whether the line is selected
                                        if (d.selected) {
                                            //set selected serie stroke size
                                            allSeries.style('stroke-opacity', .1);
                                            allSeries.style('fill-opacity', .1);

                                            //set selected serie opacity
                                            selectedPoints.style('stroke-opacity', d.bulletStrokeAlpha);
                                            selectedPoints.style('fill-opacity', d.bulletAlpha);
                                        } else {
                                            //set selected serie stroke size
                                            allSeries.style('stroke-opacity', d.bulletStrokeAlpha);
                                            allSeries.style('fill-opacity', d.bulletAlpha);
                                        }
                                    }
                                    break;
                                case 'bar':
                                    {
                                        //get all series
                                        var allSeries = base.plot.canvas.selectAll('.eve-series rect'),
                                            selectedSerie = base.plot.canvas.selectAll('.eve-bar-serie-' + i);

                                        //check whether the line is selected
                                        if (d.selected) {
                                            //set selected serie stroke size
                                            allSeries.style('stroke-opacity', .1);
                                            allSeries.style('fill-opacity', .1);

                                            //set selected serie opacity
                                            selectedSerie.style('stroke-opacity', d.lineAlpha);
                                            selectedSerie.style('fill-opacity', d.alpha);
                                        } else {
                                            //set selected serie stroke size
                                            allSeries.style('stroke-opacity', d.lineAlpha);
                                            allSeries.style('fill-opacity', d.alpha);
                                        }
                                    }
                                    break;
                            }
                        });

                    //iterate all legend texts to get legend width
                    legendTexts[0].each(function (legendText) {
                        //get legend text bbox
                        var bboxWidth = legendText.getBBox().width + base.legend.fontSize + 5;

                        //check whether the bbox.width is greater than legendwidth
                        if (bboxWidth > legendWidth) legendWidth = bboxWidth;
                    });

                    //create legend icons
                    legendIcons.append('path')
                        .attr('d', d3.svg.symbol().type(base.legend.iconType).size(symbolSize))
                        .attr('class', 'eve-legend-icon')
                        .style('cursor', 'pointer')
                        .style('fill', function (d, i) {
                            //check whether the serie has colorField
                            if (d.color !== '')
                                return d.color;
                            else
                                return i <= eve.charts.colors.length ? eve.charts.colors[i] : eve.randomColor();
                        })
                        .on('click', function (d, i) {
                            //set data selected event
                            if (d.selected) { d.selected = false; } else { d.selected = true; }

                            //switch base serie type
                            switch (d.type) {
                                case 'line':
                                    {
                                        //get serie path
                                        var selectedSerie = base.plot.canvas.selectAll('.eve-line-serie-' + i),
                                            selectedPoints = base.plot.canvas.selectAll('.eve-line-point-' + i);

                                        //check whether the line is selected
                                        if (d.selected) {
                                            //decrease opacity of all series
                                            base.plot.canvas.selectAll('.eve-series path').style('stroke-opacity', .1);

                                            //set selected serie stroke size
                                            selectedSerie.style('stroke-width', d.lineSize + 2);

                                            //set selected serie opacity
                                            selectedSerie.style('stroke-opacity', 1);
                                            selectedPoints.style('stroke-opacity', 1);
                                        } else {
                                            //decrease opacity of all series
                                            base.plot.canvas.selectAll('.eve-series path').style('stroke-opacity', 1);

                                            //set selected serie stroke size
                                            selectedSerie.style('stroke-opacity', d.lineAlpha);
                                            selectedSerie.style('stroke-width', d.lineSize);
                                        }
                                    }
                                    break;
                                case 'area':
                                    {
                                        //get all series
                                        var allSeries = base.plot.canvas.selectAll('.eve-series path.eve-area-serie'),
                                            selectedSerie = base.plot.canvas.selectAll('.eve-area-serie-' + i),
                                            selectedPoints = base.plot.canvas.selectAll('.eve-area-point-' + i);

                                        //check whether the line is selected
                                        if (d.selected) {
                                            //set selected serie stroke size
                                            selectedSerie.style('stroke-width', d.lineSize + 2);
                                            allSeries.style('stroke-opacity', .1);
                                            allSeries.style('fill-opacity', .1);

                                            //set selected serie opacity
                                            selectedSerie.style('stroke-width', d.lineSize);
                                            selectedSerie.style('fill-opacity', d.alpha);
                                        } else {
                                            //set selected serie stroke size
                                            allSeries.style('stroke-opacity', d.lineSize);
                                            allSeries.style('fill-opacity', d.alpha);
                                        }
                                    }
                                    break;
                                case 'scatter':
                                    {
                                        //get all series
                                        var allSeries = base.plot.canvas.selectAll('.eve-series path.eve-scatter-point'),
                                            selectedPoints = base.plot.canvas.selectAll('.eve-scatter-point-' + i);

                                        //check whether the line is selected
                                        if (d.selected) {
                                            //set selected serie stroke size
                                            allSeries.style('stroke-opacity', .1);
                                            allSeries.style('fill-opacity', .1);

                                            //set selected serie opacity
                                            selectedPoints.style('stroke-opacity', d.bulletStrokeAlpha);
                                            selectedPoints.style('fill-opacity', d.bulletAlpha);
                                        } else {
                                            //set selected serie stroke size
                                            allSeries.style('stroke-opacity', d.bulletStrokeAlpha);
                                            allSeries.style('fill-opacity', d.bulletAlpha);
                                        }
                                    }
                                    break;
                                case 'bar':
                                    {
                                        //get all series
                                        var allSeries = base.plot.canvas.selectAll('.eve-series rect'),
                                            selectedSerie = base.plot.canvas.selectAll('.eve-bar-serie-' + i);

                                        //check whether the line is selected
                                        if (d.selected) {
                                            //set selected serie stroke size
                                            allSeries.style('stroke-opacity', .1);
                                            allSeries.style('fill-opacity', .1);

                                            //set selected serie opacity
                                            selectedSerie.style('stroke-opacity', d.lineAlpha);
                                            selectedSerie.style('fill-opacity', d.alpha);
                                        } else {
                                            //set selected serie stroke size
                                            allSeries.style('stroke-opacity', d.lineAlpha);
                                            allSeries.style('fill-opacity', d.alpha);
                                        }
                                    }
                                    break;
                            }
                        });

                    //check legend position to set legend
                    if (base.legend.position === 'right') {
                        //set legend icons position
                        legendIcons
                            .attr('transform', function (d, i) {
                                //calculate path pos
                                var x = base.plot.width - legendWidth - base.legend.fontSize - base.margin.right,
                                    y = base.plot.height / 2 - legendHeight + (base.legend.fontSize * i) * 2;

                                //return translation
                                return 'translate(' + x + ',' + y + ')';
                            });

                        //set legend texts position
                        legendTexts
                            .attr('transform', function (d, i) {
                                //calculate path pos
                                var x = base.plot.width - legendWidth - base.margin.right,
                                    y = base.plot.height / 2 - legendHeight + (base.legend.fontSize / 3) + (base.legend.fontSize * i) * 2;

                                //return translation
                                return 'translate(' + x + ',' + y + ')';
                            });

                        //decrease axis width
                        axisWidth -= legendWidth + base.legend.fontSize;
                    } else {
                        //set legend icons position
                        legendIcons
                            .attr('transform', function (d, i) {
                                //calculate path pos
                                var x = base.margin.left + base.yAxis.titleFontSize + 5,
                                    y = base.plot.height / 2 - legendHeight + (base.legend.fontSize * i) * 2;

                                //return translation
                                return 'translate(' + x + ',' + y + ')';
                            });

                        //set legend texts position
                        legendTexts
                            .attr('transform', function (d, i) {
                                //calculate path pos
                                var x = base.margin.left + base.yAxis.titleFontSize + base.legend.fontSize + 5,
                                    y = base.plot.height / 2 - legendHeight + (base.legend.fontSize / 3) + (base.legend.fontSize * i) * 2;

                                //return translation
                                return 'translate(' + x + ',' + y + ')';
                            });

                        //increase axis left
                        axisLeft += legendWidth + base.legend.fontSize + 5;

                        //decrease axis width
                        axisWidth -= legendWidth + base.legend.fontSize;
                    }
                }
            };

            //create an internal function draw axis titles
            function drawTitles() {
                //check whether the base x axis has a title
                if (base.xAxis.title !== '') {
                    //create base x axis title
                    xAxisTitle = base.plot.canvas.append('g').append('text')
                        .text(base.xAxis.title)
                        .style('fill', base.xAxis.titleFontColor)
                        .style('font-family', base.xAxis.titleFontFamily)
                        .style('font-size', base.xAxis.titleFontSize + 'px')
                        .style('font-style', base.xAxis.titleFontStyle === 'bold' ? 'normal' : base.xAxis.titleFontStyle)
                        .style('font-weight', base.xAxis.titleFontStyle === 'bold' ? 'bold' : 'normal')
                        .style('text-anchor', 'middle')
                        .attr('x', function (d) {
                            //get bbox
                            var bbox = this.getBBox();

                            //return x pos
                            return base.plot.width / 2 - bbox.width / 2 - legendWidth / 2;
                        })
                        .attr('y', function (d) {
                            //get bbox
                            var bbox = this.getBBox();

                            //return y pos
                            return base.plot.height - base.margin.bottom - bbox.height;
                        });

                    //get xAxisTitle bbox
                    var xAxisTitleBBox = xAxisTitle.node().getBBox();

                    //decrase axis height
                    axisHeight -= xAxisTitleBBox.height;
                };

                //check whether the base y axis has title
                if (base.yAxis.title !== '') {
                    //create base y axis title
                    yAxisTitle = base.plot.canvas.append('g').append('text')
                        .text(base.yAxis.title)
                        .style('fill', base.yAxis.titleFontColor)
                        .style('font-family', base.yAxis.titleFontFamily)
                        .style('font-size', base.yAxis.titleFontSize + 'px')
                        .style('font-style', base.yAxis.titleFontStyle === 'bold' ? 'normal' : base.yAxis.titleFontStyle)
                        .style('font-weight', base.yAxis.titleFontStyle === 'bold' ? 'bold' : 'normal')
                        .style('text-anchor', 'middle')
                        .attr('transform', function (d) {
                            //get bbox
                            var bbox = this.getBBox();

                            //return x pos
                            return 'translate(' + base.margin.left + ',' + (base.plot.height / 2 - bbox.height / 2) + ')rotate(-90)';
                        });

                    //get yAxisTitle bbox
                    var yAxisTitleBBox = yAxisTitle.node().getBBox();

                    //increase axis left
                    axisLeft += yAxisTitleBBox.height;

                    //decare axis width
                    axisWidth -= yAxisTitleBBox.height;
                };
            };

            //create an internal function to create x axis
            function createXAxis() {
                return d3.svg.axis().scale(that.x).orient('bottom').ticks(base.xAxis.tickCount);
            };

            //create an internal function to create y axis
            function createYAxis() {
                return d3.svg.axis().scale(that.y).orient('left').ticks(base.yAxis.tickCount);
            };

            //create an internal function to draw axis
            function drawAxis() {
                //switch data type for xAxis to set x range
                switch (base.xAxis.dataType) {
                    case 'number':
                        that.x = d3.scale.linear().range([0, axisWidth]);
                        break;
                    case 'date':
                        that.x = d3.time.scale().range([0, axisWidth]);
                        break;
                    case 'string':
                        that.x = d3.scale.ordinal().rangeRoundBands([0, axisWidth], .1);
                        break;
                    default:
                        that.x = d3.scale.linear().range([0, axisWidth]);
                        break;
                }

                //check whether the base is reversed
                if (isReversed) {
                    //set that x
                    that.x = d3.scale.linear().range([0, axisWidth]);

                    //switch data type for xAxis to set x range
                    switch (base.xAxis.dataType) {
                        case 'number':
                            that.y = d3.scale.linear().range([axisHeight, 0]);
                            break;
                        case 'date':
                            that.y = d3.time.scale().range([axisHeight, 0]);
                            break;
                        case 'string':
                            that.y = d3.scale.ordinal().rangeRoundBands([axisHeight, 0], .1);
                            break;
                        default:
                            that.y = d3.scale.linear().range([axisHeight, 0]);
                            break;
                    }
                } else {
                    //set y scale
                    that.y = d3.scale.linear().range([axisHeight, 0]);
                }

                //create x axis
                that.xAxis = createXAxis();

                //create y axis
                that.yAxis = createYAxis();

                //switch base xAxis data type to set x domain
                switch (base.xAxis.dataType) {
                    case 'date':
                        {
                            //get min and max date
                            var xMinDate = d3.min(base.data, function (d) { return (eve.getType(d[base.xField]) === 'dateTime' ? d[base.xField] : new Date(d[base.xField])); }),
                                xMaxDate = d3.max(base.data, function (d) { return (eve.getType(d[base.xField]) === 'dateTime' ? d[base.xField] : new Date(d[base.xField])); }),
                                dayExtension = Math.ceil(xMaxDate.diff(xMinDate) * .1) * 24;

                            //check whether the axis starts from zero
                            if (base.xAxis.startFromZero) {
                                xMinDate = new Date(xMinDate.addHours(dayExtension * -1));
                                xMaxDate = new Date(xMaxDate.addHours(dayExtension));
                            }

                            //create x axis domain
                            if (isReversed)
                                that.y.domain([xMinDate, xMaxDate]);
                            else
                                that.x.domain([xMinDate, xMaxDate]);
                        }
                        break;
                    case 'string':
                        {
                            //create x axis domain
                            if (isReversed) {
                                that.y.domain(base.data.map(function (d) {
                                    return d[base.xField].toString();
                                }));
                            } else {
                                that.x.domain(base.data.map(function (d) {
                                    return d[base.xField].toString();
                                }));
                            }
                        }
                        break;
                    default:
                        {
                            //check whether the axis is starts from zero
                            if (base.xAxis.startFromZero) {
                                //get max x value
                                var xMaxValue = d3.max(base.data, function (d) { return d[base.xField]; });
                                var xMinValue = 0;

                                //update x min and max values by error
                                xMaxValue += isNaN(maxXError) ? 0 : maxXError;
                                xMinValue -= isNaN(maxXError) ? 0 : maxXError;

                                //create x axis domain
                                if (isReversed)
                                    that.y.domain([xMinValue, (xMaxValue + 1)]);
                                else
                                    that.x.domain([xMinValue, (xMaxValue + 1)]);
                            } else {
                                //get min and max x value
                                var xMinValue = d3.min(base.data, function (d) { return d[base.xField]; }),
                                    xMaxValue = d3.max(base.data, function (d) { return d[base.xField]; });

                                //update x min and max values by error
                                xMaxValue += isNaN(maxXError) ? 0 : maxXError;
                                xMinValue -= isNaN(maxXError) ? 0 : maxXError;

                                //create x axis domain
                                if (isReversed)
                                    that.y.domain([xMinValue, xMaxValue]);
                                else
                                    that.x.domain([xMinValue, xMaxValue]);
                            }
                        }
                }

                //create y axis domain
                if (isReversed)
                    that.x.domain(yDomains);
                else
                    that.y.domain(yDomains);

                //create x axis grid lines
                base.plot.canvas.append('g')
                    .attr('class', 'eve-x-grid')
                    .attr('transform', function () { return 'translate(' + axisLeft + ', ' + axisHeight + ')'; })
                    .style('stroke-opacity', base.xAxis.gridLineAlpha)
                    .style('stroke-width', base.xAxis.gridLineThickness)
                    .style('stroke', base.xAxis.gridLineColor)
                    .call(createXAxis().tickSize(-axisHeight, 0, 0).tickFormat(''));

                //create y axis grid lines
                base.plot.canvas.append('g')
                    .attr('class', 'eve-y-grid')
                    .attr('transform', function () { return 'translate(' + axisLeft + ')'; })
                    .style('stroke-opacity', base.yAxis.gridLineAlpha)
                    .style('stroke-width', base.yAxis.gridLineThickness)
                    .style('stroke', base.yAxis.gridLineColor)
                    .call(createYAxis().tickSize(-axisWidth, 0, 0).tickFormat(''));

                //create y axis
                yAxis = base.plot.canvas.append('g')
                    .style('fill', 'none')
                    .style('stroke', base.yAxis.color)
                    .style('stroke-width', base.yAxis.thickness + 'px')
                    .style('shape-rendering', 'crispEdges')
                    .attr('transform', 'translate(' + axisLeft + ')')
                    .attr('class', 'eve-y-axis')
                    .call(that.yAxis);

                //select all lines in yaxis
                yAxis.selectAll('line')
                    .style('fill', 'none')
                    .style('stroke-width', base.yAxis.thickness + 'px')
                    .style('shape-rendering', 'crispEdges')
                    .style('stroke-opacity', base.yAxis.alpha)
                    .style('stroke', base.yAxis.color);

                //select all texts in yaxis
                yAxis.selectAll('text')
                    .style('fill', base.yAxis.labelFontColor)
                    .style('font-size', base.yAxis.labelFontSize + 'px')
                    .style('font-family', base.yAxis.labelFontFamily)
                    .style('font-style', base.yAxis.labelFontStlye === 'bold' ? 'normal' : base.yAxis.labelFontStlye)
                    .style('font-weight', base.yAxis.labelFontStlye === 'bold' ? 'bold' : 'normal')
                    .style('stroke-width', '0px');

                //create x axis
                xAxis = base.plot.canvas.append('g')
                    .style('fill', 'none')
                    .style('stroke', base.xAxis.color)
                    .style('stroke-width', base.xAxis.thickness + 'px')
                    .style('shape-rendering', 'crispEdges')
                    .attr('transform', 'translate(' + axisLeft + ',' + axisHeight + ')')
                    .attr('class', 'eve-x-axis')
                    .call(that.xAxis);

                //select all lines in xaxis
                xAxis.selectAll('line')
                    .style('fill', 'none')
                    .style('stroke-width', base.xAxis.thickness + 'px')
                    .style('shape-rendering', 'crispEdges')
                    .style('stroke-opacity', base.xAxis.alpha)
                    .style('stroke', base.xAxis.color);

                //select all texts in xaxis
                xAxis.selectAll('text')
                    .style('fill', base.xAxis.labelFontColor)
                    .style('font-size', base.xAxis.labelFontSize + 'px')
                    .style('font-family', base.xAxis.labelFontFamily)
                    .style('font-style', base.xAxis.labelFontStlye === 'bold' ? 'normal' : base.xAxis.labelFontStlye)
                    .style('font-weight', base.xAxis.labelFontStlye === 'bold' ? 'bold' : 'normal')
                    .style('stroke-width', '0px');
            }

            //create an internal function add trend
            function addTrend(trend) {
                //get x axis domain range
                var xAxisRange = that.x.domain(),
                    bullet = d3.svg.symbol().type('circle').size(64);

                //check trend startY
                if (trend.startY < minValue) trend.startY = minValue;

                //check trend endY
                if (trend.endY > maxValue) trend.endY = maxValue;

                //check trend startX
                if (trend.startX < xAxisRange[0]) trend.startX = xAxisRange[0];

                //check trend endX
                if (trend.endX > xAxisRange[1]) trend.endX = xAxisRange[1];

                //create trend
                base.plot.canvas.append('line')
                    .attr('x1', that.x(trend.startX) + axisLeft)
                    .attr('x2', that.x(trend.endX) + axisLeft)
                    .attr('y1', that.y(trend.startY))
                    .attr('y2', that.y(trend.endY))
                    .style('stroke', trend.color)
                    .style('stroke-dasharray', function (d, i) {
                        //check whether the serie line drawing style
                        if (trend.lineDrawingStyle === 'dotted')
                            return '2, 2';
                        else if (trend.lineDrawingStyle === 'dashed')
                            return '5, 2';
                        else
                            return '0';
                    });

                //append first node
                base.plot.canvas.append('path')
                    .attr('d', bullet)
                    .attr('transform', 'translate(' + (that.x(trend.startX) + axisLeft) + ',' + that.y(trend.startY) + ')')
                    .style('cursor', 'pointer')
                    .style('stroke', trend.color)
                    .style('fill', trend.color)
                    .on('mousemove', function (d, i) {
                        //get serie color
                        var serieColor = trend.color,
                            balloonContent = formatTrendValue(trend.startBalloonFormat, trend);

                        //set balloon border color
                        base.plot.balloon.style('borderColor', serieColor);

                        //Show balloon
                        showBalloon(balloonContent);

                        //increase bullet stroke size
                        d3.select(this).style('stroke-width', 2);
                    })
                    .on('mouseout', function (d, i) {
                        //Hide balloon
                        hideBalloon();

                        //decrease bullet stroke size
                        d3.select(this).style('stroke-width', 1);
                    });

                //append second node
                base.plot.canvas.append('path')
                    .attr('d', bullet)
                    .attr('transform', 'translate(' + (that.x(trend.endX) + axisLeft) + ',' + that.y(trend.endY) + ')')
                    .style('cursor', 'pointer')
                    .style('stroke', trend.color)
                    .style('fill', trend.color)
                    .on('mousemove', function (d, i) {
                        //get serie color
                        var serieColor = trend.color,
                            balloonContent = formatTrendValue(trend.endBalloonFormat, trend);

                        //set balloon border color
                        base.plot.balloon.style('borderColor', serieColor);

                        //Show balloon
                        showBalloon(balloonContent);

                        //increase bullet stroke size
                        d3.select(this).style('stroke-width', 2);
                    })
                    .on('mouseout', function (d, i) {
                        //Hide balloon
                        hideBalloon();

                        //decrease bullet stroke size
                        d3.select(this).style('stroke-width', 1);
                    });
            };

            //draw legend
            drawLegend();

            //draw titles
            drawTitles();

            //draw axes
            drawAxis();

            //iterate all trends
            base.trends.each(function (trend) {
                addTrend(trend);
            });

            //set axis dimension members
            this.offset = { left: axisLeft, top: axisTop, width: axisWidth, height: axisHeight };

            //update axis
            this.update = function (data) {
                /// <summary>
                /// Updates axis.
                /// </summary>
                /// <param name="data"></param>

                //check whether the data is null
                if (data == null) data = base.data;

                //clear yDomains
                yDomains.length = [];
                minValues.length = [];
                maxValues.length = [];
                maxXErrors.length = [];

                //set base data
                base.data = data;

                //iterate all data to update axis
                this.series = this.serieNames.map(function (name, index) {
                    return {
                        name: name,
                        serieType: base.series[index].type,
                        values: base.data.map(function (d) {
                            //get x field value
                            var xValue = d[base.xField],
                                serie = base.series[index],
                                dataObject = {};

                            //switch base xAxis data type
                            switch (base.xAxis.dataType) {
                                case 'date':
                                    xValue = (eve.getType(d[base.xField]) === 'dateTime' ? d[base.xField] : new Date(d[base.xField]));
                                    break;
                                case 'string':
                                    xValue = d[base.xField];
                                    break;
                                default:
                                    xValue = d[base.xField];
                                    break;
                            }

                            //set data object members
                            dataObject['name'] = name;
                            dataObject['index'] = index;
                            dataObject['serieType'] = serie.type;
                            dataObject['xField'] = xValue;

                            //check whether the serie has y Field
                            if (serie.yField !== '') dataObject['yField'] = +parseFloat(d[name]);

                            //check whether the serie has size field
                            if (serie.sizeField !== '') dataObject['sizeField'] = +parseFloat(d[serie.sizeField]);

                            //check whether the serie has open field
                            if (serie.openField !== '') dataObject['openField'] = +parseFloat(d[serie.openField]);

                            //check whether the serie has high field
                            if (serie.highField !== '') dataObject['highField'] = +parseFloat(d[serie.highField]);

                            //check whether the serie has low field
                            if (serie.lowField !== '') dataObject['lowField'] = +parseFloat(d[serie.lowField]);

                            //check whether the serie has close field
                            if (serie.closeField !== '') dataObject['closeField'] = +parseFloat(d[serie.closeField]);

                            //check whether the serie x error field
                            if (serie.xErrorField !== '') dataObject['xErrorField'] = +parseFloat(d[serie.xErrorField]);

                            //check whether the serie y error field
                            if (serie.yErrorField !== '') dataObject['yErrorField'] = +parseFloat(d[serie.yErrorField]);

                            //return final data object
                            return dataObject;
                        })
                    };
                });

                //iterate all series to set min and max values and define domains
                this.series.each(function (serie, index) {
                    //push current serie max to max values
                    maxValues.push(d3.max(serie.values, function (d) {
                        //switch serie type to calculate max value
                        switch (d.serieType) {
                            case 'ohlc':
                            case 'candlestick':
                                return parseFloat(d.highField);
                            default:
                                return parseFloat(d.yField);
                        }
                    }));

                    //push current serie min to min values
                    minValues.push(d3.min(serie.values, function (d) {
                        //switch serie type to calculate max value
                        switch (d.serieType) {
                            case 'ohlc':
                            case 'candlestick':
                                return parseFloat(d.lowField);
                            default:
                                return parseFloat(d.yField);
                        }
                    }));

                    //push max x errors into array
                    maxXErrors.push(d3.max(serie.values, function (d) { return parseFloat(d.xErrorField); }));

                    //create serie min
                    var serieMin = d3.min(that.series, function (c) {
                        return d3.min(c.values, function (v) {
                            //switch serie type to calculate max value
                            switch (v.serieType) {
                                case 'ohlc':
                                case 'candlestick':
                                    return parseFloat(v.lowField);
                                default:
                                    return parseFloat(v.yField);
                            }
                        });
                    });

                    //create serie max
                    var serieMax = d3.max(that.series, function (c) {
                        return d3.max(c.values, function (v) {
                            //switch serie type to calculate max value
                            switch (v.serieType) {
                                case 'ohlc':
                                case 'candlestick':
                                    return parseFloat(v.highField);
                                default:
                                    return parseFloat(v.yField);
                            }
                        });
                    });

                    //increase serie max by 10 percent
                    serieMax *= 1.1;

                    //get max x,y error values
                    var yErrorMax = d3.max(serie.values, function (d) { return parseFloat(d.yErrorField); });

                    //update serie max
                    serieMax += yErrorMax === undefined ? 0 : yErrorMax;

                    //get serie min and max values for size
                    var sizeMin = d3.min(serie.values, function (d) { return parseFloat(d.sizeField); });
                    var sizeMax = d3.max(serie.values, function (d) { return parseFloat(d.sizeField); });

                    //set serie min and max values for size
                    serie.minSize = sizeMin === undefined ? base.series[index].minBulletSize : sizeMin;
                    serie.maxSize = sizeMax === undefined ? base.series[index].maxBulletSize : sizeMax;

                    //set serie min
                    serieMin = base.yAxis.startFromZero ? 0 : serieMin;
                    serieMin -= yErrorMax === undefined ? 0 : yErrorMax;

                    //set y domains
                    yDomains.push(serieMin);
                    yDomains.push(serieMax);
                });

                //update max values
                maxValue = maxValues.max(),
                minValue = minValues.min(),
                maxXError = maxXErrors.max(),
                maxValueLength = (maxValue.toString().length * base.yAxis.labelFontSize / 2);

                //switch base xAxis data type to set x domain
                switch (base.xAxis.dataType) {
                    case 'date':
                        {
                            //get min and max date
                            var xMinDate = d3.min(base.data, function (d) { return (eve.getType(d[base.xField]) === 'dateTime' ? d[base.xField] : new Date(d[base.xField])); }),
                                xMaxDate = d3.max(base.data, function (d) { return (eve.getType(d[base.xField]) === 'dateTime' ? d[base.xField] : new Date(d[base.xField])); }),
                                dayExtension = Math.ceil(xMaxDate.diff(xMinDate) * .1) * 24;

                            //check whether the axis starts from zero
                            if (base.xAxis.startFromZero) {
                                xMinDate = new Date(xMinDate.addHours(dayExtension * -1));
                                xMaxDate = new Date(xMaxDate.addHours(dayExtension));
                            }

                            //create x axis domain
                            if (isReversed)
                                that.y.domain([xMinDate, xMaxDate]);
                            else
                                that.x.domain([xMinDate, xMaxDate]);
                        }
                        break;
                    case 'string':
                        {
                            //create x axis domain
                            if (isReversed) {
                                that.y.domain(base.data.map(function (d) {
                                    return d[base.xField];
                                }));
                            } else {
                                that.x.domain(base.data.map(function (d) {
                                    return d[base.xField];
                                }));
                            }
                        }
                        break;
                    default:
                        {
                            //check whether the axis is starts from zero
                            if (base.xAxis.startFromZero) {
                                //get max x value
                                var xMaxValue = d3.max(base.data, function (d) { return d[base.xField]; });
                                var xMinValue = 0;

                                //update x min and max values by error
                                xMaxValue += isNaN(maxXError) ? 0 : maxXError;
                                xMinValue -= isNaN(maxXError) ? 0 : maxXError;

                                //create x axis domain
                                if (isReversed)
                                    that.y.domain([xMinValue, (xMaxValue + 1)]);
                                else
                                    that.x.domain([xMinValue, (xMaxValue + 1)]);
                            } else {
                                //get min and max x value
                                var xMinValue = d3.min(base.data, function (d) { return d[base.xField]; }),
                                    xMaxValue = d3.max(base.data, function (d) { return d[base.xField]; });

                                //update x min and max values by error
                                xMaxValue += isNaN(maxXError) ? 0 : maxXError;
                                xMinValue -= isNaN(maxXError) ? 0 : maxXError;

                                //create x axis domain
                                if (isReversed)
                                    that.y.domain([xMinValue, xMaxValue]);
                                else
                                    that.x.domain([xMinValue, xMaxValue]);
                            }
                        }
                }

                //create y axis domain
                that.y.domain(yDomains);

                //update x axis
                base.plot.canvas.select('.eve-x-axis')
                    .transition()
                    .duration(base.animationDuration)
                    .call(that.xAxis);

                //update y axis
                base.plot.canvas.select('.eve-y-axis')
                    .transition()
                    .duration(base.animationDuration)
                    .call(that.yAxis);

                //select all texts in xaxis
                xAxis.selectAll('text')
                    .style('fill', base.xAxis.labelFontColor)
                    .style('font-size', base.xAxis.labelFontSize + 'px')
                    .style('font-family', base.xAxis.labelFontFamily)
                    .style('font-style', base.xAxis.labelFontStlye === 'bold' ? 'normal' : base.xAxis.labelFontStlye)
                    .style('font-weight', base.xAxis.labelFontStlye === 'bold' ? 'bold' : 'normal')
                    .style('stroke-width', '0px');

                //select all texts in yaxis
                yAxis.selectAll('text')
                    .style('fill', base.yAxis.labelFontColor)
                    .style('font-size', base.yAxis.labelFontSize + 'px')
                    .style('font-family', base.yAxis.labelFontFamily)
                    .style('font-style', base.yAxis.labelFontStlye === 'bold' ? 'normal' : base.yAxis.labelFontStlye)
                    .style('font-weight', base.yAxis.labelFontStlye === 'bold' ? 'bold' : 'normal')
                    .style('stroke-width', '0px');

                //return updated axis
                return this;
            };

            //add trend
            this.addTrend = function (trend) {
                /// <summary>
                /// Adds a new trend on base.
                /// </summary>
                /// <param name="trend"></param>
                if (trend === null) return false;
                if (trend['startX'] === null) return false;
                if (trend['endX'] === null) return false;
                if (trend['starY'] === null) return false;
                if (trend['endY'] === null) return false;

                //add trend
                addTrend(trend);
            };
        };

        //create plot
        this.plot = new chartPlot();

        //create axis
        this.createAxis = function (isReversed) {
            //return new axis object
            return new chartAxis(isReversed);
        };

        //expose format number method
        this.formatNumber = function (value) {
            //declare variables
            var result = '';

            //check whether the base has autoFormatting
            if (base.formatNumbers) {
                //check value prefix
                if (base.prefix.trim() != '') result = base.prefix + ' ';

                //format number by base config
                result += parseFloat(value).group(base.decimalSeperator, base.thousandSeperator, base.precision);

                //check value suffix
                if (base.suffix.trim() != '') result += ' ' + base.suffix;
            } else {
                result = value;
            }

            //return result
            return result;
        };

        //expose format date method
        this.formatDate = function (value) {
            return dateFormatter(value);
        };

        //expose export method
        this.export = function (type, fileName) {
            /// <summary>
            /// Exports chart to given type.
            /// </summary>
            /// <param name="type">Type of export file: jpg, gif, png, pdf.</param>

            //check type and filename
            if (type == null) type = 'png';
            if (fileName == null) fileName = this.id;

            //create svg html
            var svg = document.getElementById(this.id + '_svg'),
                html = d3.select(svg)
                    .attr('version', 1.1)
                    .attr("xmlns", "http://www.w3.org/2000/svg")
                    .node().parentNode.innerHTML;

            //get datauri from svg
            var chartDataURI = 'data:image/svg+xml;base64,' + btoa(html),
                canvas = document.createElement('canvas'),
                context = canvas.getContext('2d');

            //set canvas dimension
            canvas.width = this.plot.width;
            canvas.height = this.plot.height;

            //create an image
            var image = new Image; image.src = chartDataURI;

            //set image onload
            image.onload = function () {
                //draw image on context
                context.drawImage(image, 0, 0);

                //check export type
                if (type != 'pdf') {
                    //get canvas data
                    var canvasData = canvas.toDataURL('image/' + type);
                    var canvasBlob = eve.toBlob(canvasData);

                    //Save pdf
                    saveAs(canvasBlob, fileName + '.' + type);
                } else {
                    //Get canvas as jpeg image
                    var canvasData = canvas.toDataURL('image/jpeg'),
                        width = (canvas.width * 25.4) / 90,
                        height = (canvas.height * 25.4) / 90;

                    //Create pdf object
                    var pdf = new jsPDF();

                    //Add image into pdf object
                    pdf.addImage(canvasData, 'JPEG', 0, 0, width, height);

                    //Create pdf blob
                    var pdfDataString = pdf.output('dataurlstring');
                    var pdfBlob = eve.toBlob(pdfDataString, 'pdf');

                    //Save pdf
                    saveAs(pdfBlob, fileName + '.pdf');
                }
            };
        };

        //expose resize method
        this.resize = function () {
            /// <summary>
            /// Resizes chart.
            /// </summary>

            //calculate new chart area
            var newWidth = this.plot.container.offset().width;

            //resize canvas
            this.plot.canvas.attr('width', newWidth).attr('height', newWidth / this.plot.aspectRatio);
        };

        //expose hide balloon method
        this.hideBalloon = function () {
            /// <summary>
            /// Hides balloon.
            /// </summary>
            this.plot.balloon.style('display', 'none');
        };

        //expose show balloon method
        this.showBalloon = function (content) {
            /// <summary>
            /// Shows balloon with given content.
            /// </summary>
            /// <param name="content"></param>
            /// <param name="data"></param>

            //check whether the arguments
            if (content == null) hideBalloon();

            //check whther the balloon enabled
            if (!this.balloon.enabled) hideBalloon();

            //set balloon content
            this.plot.balloon.html(content);

            //set balloon postion and show
            this.plot.balloon.style('left', (parseInt(d3.event.pageX) + 5) + 'px');
            this.plot.balloon.style('top', (parseInt(d3.event.pageY) + 5) + 'px');
            this.plot.balloon.style('display', 'block');
        };

        //expose set bubble content method
        this.setBalloonContent = function (cfg) {
            //handle errors
            if (arguments.length === 0) return '';

            //declare inner variables
            var formatted = cfg.format;

            //switch chart type to set balloon content
            switch (cfg.type) {
                case 'pie':
                case 'donut':
                case 'funnel':
                case 'pyramid':
                    {
                        //declare format variables
                        var data = this.data[cfg.dataIndex],
                            serie = cfg.serie,
                            totalValue = d3.sum(this.data, function (d) { return d[serie.valueField]; }),
                            currentValue = data[serie.valueField] === null ? 0 : data[serie.valueField],
                            percentValue = currentValue / totalValue * 100;

                        //convert titles
                        if (serie['titleField'] != null) formatted = formatted.replaceAll('{{title}}', data[serie.titleField] == null ? '' : data[serie.titleField]);

                        //convert values
                        if (serie['valueField'] != null) formatted = formatted.replaceAll('{{value}}', (this.formatNumbers ? currentValue.group(this.decimalSeperator, this.thousandSeperator, this.precision) : currentValue));

                        //convert values
                        if (serie['alphaField'] != null) formatted = formatted.replaceAll('{{alpha}}', (this.formatNumbers ? data[serie.alphaField].group(this.decimalSeperator, this.thousandSeperator, this.precision) : data[serie.alphaField]));

                        //convert opacity
                        if (serie['colorField'] != null) formatted = formatted.replaceAll('{{color}}', data[serie.colorField] == null ? '' : data[serie.colorField]);

                        //convert totals
                        if (totalValue != null) formatted = formatted.replaceAll('{{total}}', (this.formatNumbers ? totalValue.group(this.decimalSeperator, this.thousandSeperator, this.precision) : totalValue));

                        //convert percents
                        if (percentValue != null) formatted = formatted.replaceAll('{{percent}}', '%' + percentValue.group(this.decimalSeperator, this.thousandSeperator, this.precision));
                    }
                    break;
                case 'gauge':
                    {
                        //declare format variables
                        var data = cfg.data,
                            serie = cfg.serie;

                        //convert value
                        formatted = formatted.replaceAll('{{value}}', this.formatNumber(data.value));

                        //convert percent
                        formatted = formatted.replaceAll('{{percent}}', '%' + data.percent);

                        //convert max
                        formatted = formatted.replaceAll('{{max}}', this.formatNumber(data.max));

                        //convert min
                        formatted = formatted.replaceAll('{{min}}', this.formatNumber(data.min));

                        //check whether the data trend is not null
                        if (data.trend != null) {
                            //convert trend title
                            formatted = formatted.replaceAll('{{trendTitle}}', data.trend.title);

                            //convert trend start
                            formatted = formatted.replaceAll('{{trendStart}}', this.formatNumber(data.trend.start));

                            //convert trend end
                            formatted = formatted.replaceAll('{{trendEnd}}', this.formatNumber(data.trend.end));
                        }
                    }
                    break;
                case 'bullet':
                    {
                        //declare format variables
                        var ranges = [],
                            data = cfg.data,
                            serie = cfg.serie,
                            markerValue = data[serie.markerField] === null ? '' : data[serie.markerField],
                            exactValue = data[serie.valueField] === null ? '' : data[serie.valueField],
                            title = data[serie.titleField] === null ? '' : data[serie.titleField];

                        //iterate all range fields
                        serie.rangeFields.each(function (rangeField, rangeIndex) {
                            //set rangeField
                            var rangeValue = data[rangeField] === null ? '' : data[rangeField],
                                rangeFormatted = this.formatNumbers ? rangeValue.group(this.decimalSeperator, this.thousandSeperator, this.precision) : rangeValue;

                            //push the current range into ranges
                            ranges.push(rangeFormatted);

                            //convert values
                            if (formatted.indexOf('range' + rangeIndex) !== -1)
                                formatted = formatted.replaceAll('{{range' + rangeIndex + '}}', rangeFormatted);
                        });

                        //set all ranges
                        if (formatted.indexOf('{{ranges}}') !== -1 && ranges.length > 0)
                            formatted = formatted.replaceAll('{{ranges}}', ranges.join(' - '));

                        //convert titles
                        if (data[serie.titleField] != null) formatted = formatted.replaceAll('{{title}}', title);

                        //convert values
                        if (data[serie.markerField] != null) formatted = formatted.replaceAll('{{marker}}', (this.formatNumbers ? markerValue.group(this.decimalSeperator, this.thousandSeperator, this.precision) : markerValue));

                        //convert values
                        if (data[serie.valueField] != null) formatted = formatted.replaceAll('{{value}}', (this.formatNumbers ? exactValue.group(this.decimalSeperator, this.thousandSeperator, this.precision) : exactValue));

                        //convert values
                        if (data['sizeField'] != null) formatted = formatted.replaceAll('{{size}}', (this.formatNumbers ? sizeValue.group(this.decimalSeperator, this.thousandSeperator, this.precision) : sizeValue));
                    }
                    break;
                case 'parallel':
                    {
                        //declare format variables
                        var measuresText = '',
                            data = cfg.data,
                            serie = cfg.serie,
                            dimension = data[serie.dimensionField] == null ? '' : data[serie.dimensionField];

                        //iteratea all measures
                        serie.measureFields.each(function (m, i) {
                            //set measure object
                            var measure = { key: m, val: data[m] },
                                text = measure.key + ': ' + measure.val;

                            //set measures text
                            measuresText += text + '<br/>';

                            //set current measure text
                            formatted = formatted.replaceAll('{{' + m + '}}', measure.val);

                            //set indexed name format
                            formatted = formatted.replaceAll('{{measureName' + i + '}}', measure.key);

                            //set indexed value format
                            formatted = formatted.replaceAll('{{measureValue' + i + '}}', measure.val);
                        });

                        //set dimension
                        formatted = formatted.replaceAll('{{dimension}}', dimension);

                        //set measures
                        formatted = formatted.replaceAll('{{measures}}', measuresText);
                    }
                    break;
                default:
                    {
                        //declare format variables
                        var data = cfg.data,
                            serie = cfg.serie,
                            xValue = data['xField'] == null ? '' : data['xField'],
                            yValue = data['yField'] == null ? '' : data['yField'],
                            sizeValue = data['sizeField'] == null ? '' : data['sizeField'],
                            xError = data['xErrorField'] == null ? '' : data['xErrorField'],
                            yError = data['yErrorField'] == null ? '' : data['yErrorField'],
                            openValue = data['openField'] == null ? '' : data['openField'],
                            highValue = data['highField'] == null ? '' : data['highField'],
                            lowValue = data['lowField'] == null ? '' : data['lowField'],
                            closeValue = data['closeField'] == null ? '' : data['closeField'],
                            serieName = data['name'] == null ? '' : data['name'];

                        //check whether the x axis is date
                        if (this.xAxis.dataType === 'date') xValue = this.formatDate(xValue);

                        //convert titles
                        if (data['xField'] != null) formatted = formatted.replaceAll('{{title}}', xValue);

                        //convert titles
                        if (data['xField'] != null) formatted = formatted.replaceAll('{{x}}', xValue);

                        //convert titles
                        if (data['name'] != null) formatted = formatted.replaceAll('{{serie}}', serieName);

                        //convert values
                        if (data['yField'] != null) formatted = formatted.replaceAll('{{value}}', (this.formatNumbers ? yValue.group(this.decimalSeperator, this.thousandSeperator, this.precision) : yValue));

                        //convert values
                        if (data['yField'] != null) formatted = formatted.replaceAll('{{y}}', (this.formatNumbers ? yValue.group(this.decimalSeperator, this.thousandSeperator, this.precision) : yValue));

                        //convert x error
                        if (data['xErrorField'] != null) formatted = formatted.replaceAll('{{xError}}', xError);

                        //convert y error
                        if (data['yErrorField'] != null) formatted = formatted.replaceAll('{{yError}}', yError);

                        //convert open values
                        if (data['openField'] != null) formatted = formatted.replaceAll('{{open}}', (this.formatNumbers ? openValue.group(this.decimalSeperator, this.thousandSeperator, this.precision) : openValue));

                        //convert high values
                        if (data['highField'] != null) formatted = formatted.replaceAll('{{high}}', (this.formatNumbers ? highValue.group(this.decimalSeperator, this.thousandSeperator, this.precision) : highValue));

                        //convert low values
                        if (data['lowField'] != null) formatted = formatted.replaceAll('{{low}}', (this.formatNumbers ? lowValue.group(this.decimalSeperator, this.thousandSeperator, this.precision) : lowValue));

                        //convert close values
                        if (data['closeField'] != null) formatted = formatted.replaceAll('{{close}}', (this.formatNumbers ? closeValue.group(this.decimalSeperator, this.thousandSeperator, this.precision) : closeValue));

                        //convert values
                        if (data['sizeField'] != null) formatted = formatted.replaceAll('{{size}}', (this.formatNumbers ? sizeValue.group(this.decimalSeperator, this.thousandSeperator, this.precision) : sizeValue));
                    }
                    break;
            }

            //return formatted content
            return formatted;
        };
    };

    //declare chart balloon object
    function balloon(options) {
        /// <summary>
        /// Creates a new instance of chartBaloon object with the given options.
        /// </summary>
        /// <param name="options"></param>

        //set members
        this.backColor = '#ffffff';
        this.borderColor = '#0066cc';
        this.borderRadius = 3;
        this.borderSize = 2;
        this.borderStyle = 'solid';
        this.enabled = true;
        this.fontColor = '#333333';
        this.fontFamily = 'Tahoma';
        this.fontSize = 12;
        this.fontStyle = 'normal';
        this.format = '{{title}}: {{value}}';
        this.opacity = 0.9;
        this.padding = 5;

        //iterate all members in options to set this members
        for (var key in options) {
            //check whether the given key is contained by this object
            if (this[key] !== undefined || this[key] !== null)
                this[key] = options[key];
        };
    };

    //declare legend object
    function legend(options) {
        /// <summary>
        /// Creates a new instance of legend object.
        /// </summary>
        /// <param name="options"></param>

        //set members
        this.enabled = true;
        this.fontColor = '#333333';
        this.fontFamily = 'Tahoma';
        this.fontSize = 12;
        this.fontStyle = 'normal';
        this.format = '{{title}}';
        this.iconType = 'square'; //circle, square, cross, diamond, triangle-down, triangle-up
        this.position = 'right'; //left, right

        //iterate all members in options to set this members
        for (var key in options) {
            //check whether the given key is contained by this object
            if (this[key] !== undefined || this[key] !== null)
                this[key] = options[key];
        };
    };

    //declare trend object
    function trend(options) {
        /// <summary>
        /// Creates a new instance of trend object with the given options.
        /// </summary>
        /// <param name="options"></param>

        //set members
        this.start = null;
        this.end = null;
        this.startX = null;
        this.endX = null;
        this.startY = null;
        this.endY = null;
        this.lineDrawingStyle = 'solid'; //solid, dashed, dotted
        this.title = '';
        this.fontColor = '#333333';
        this.fontSize = 11;
        this.fontStyle = 'normal';
        this.fontFamily = 'Tahoma';
        this.color = '';
        this.thickness = 0;
        this.balloonFormat = '{{title}}<br/>{{start}} - {{end}}';
        this.startBalloonFormat = '{{title}}<br/>{{startX}} - {{startY}}';
        this.endBalloonFormat = '{{title}}<br/>{{startY}} - {{endY}}';

        //iterate all members in options to set this members
        for (var key in options) {
            //check whether the given key is contained by this object
            if (this[key] !== undefined || this[key] !== null)
                this[key] = options[key];
        };
    };

    //declare slice object
    function slice(options) {
        /// <summary>
        /// Creates a new instance of slice object with the given options.
        /// This object is base model for the pie, donut, funnel and pyramid charts.
        /// </summary>
        /// <param name="options"></param>

        //set members
        this.colorField = '';
        this.alphaField = '';
        this.hoverOpacity = 0.9;
        this.labelPosition = 'inside';
        this.labelFontColor = '#ffffff';
        this.labelFontFamily = 'Tahoma';
        this.labelFontSize = 11;
        this.labelFontStyle = 'normal';
        this.labelFormat = '{{percent}}';
        this.labelsEnabled = true;
        this.sliceBorderColor = '#ffffff';
        this.sliceBorderOpacity = 0.1;
        this.titleField = '';
        this.valueField = '';
    }

    //declare pie object
    function pieSerie(options) {
        /// <summary>
        /// Creates a new instance of pie chart object with the given options.
        /// </summary>
        /// <param name="options"></param>

        //set members
        this.innerRadius = 0;
        this.type = 'pie'; //pie, donut

        //extend this with the slice
        eve.extend(this, new slice(options));

        //iterate all members in options to set this members
        for (var key in options) {
            //check whether the given key is contained by this object
            if (this[key] !== undefined || this[key] !== null)
                this[key] = options[key];
        };
    };

    //declare funnel object
    function funnelSerie(options) {
        /// <summary>
        /// Creates a new instance of funnel chart object with the given options.
        /// </summary>
        /// <param name="options"></param>
        this.neckHeight = 0;
        this.type = 'funnel';

        //extend this with the slice
        eve.extend(this, new slice(options));

        //iterate all members in options to set this members
        for (var key in options) {
            //check whether the given key is contained by this object
            if (this[key] !== undefined || this[key] !== null)
                this[key] = options[key];
        };
    };

    //declare gauge object
    function gaugeSerie(options) {
        /// <summary>
        /// Creates a new instance of gauge object with the given options.
        /// </summary>
        /// <param name="options"></param>

        //set members
        this.behavior = 'standard';
        this.min = 0;
        this.max = 100;
        this.value = 0;
        this.color = '#006600';
        this.handleColor = '#006600';
        this.handleFontColor = '#666666';
        this.handleFontFamily = 'Tahoma';
        this.handleFontStyle = 'normal';
        this.handleCircleColor = '#f2f2f2';
        this.handleCircleBorderColor = '#cdcdcd';
        this.handleCircleSize = 15;
        this.label = '';
        this.labelFontColor = '#999999';
        this.labelFontFamily = 'Tahoma';
        this.labelFontStyle = 'normal';
        this.minText = 'Min';
        this.maxText = 'Max';
        this.majorTicks = 5,
        this.minorTicks = 5,
        this.trendHeight = 10,
        this.innerRadius = 0,
        this.gaugeBackColor = '#f2f2f2';
        this.gaugeBorderColor = '#cdcdcd';
        this.gaugeBorderSize = 1,
        this.innerBackColor = '#ffffff';
        this.innerBorderColor = '#e0e0e0';
        this.innerBorderSize = 1,
        this.minorTickColor = '#aaaaaa';
        this.minorTickSize = 1,
        this.majorTickColor = '#999999';
        this.majorTickSize = 2;
        this.type = 'gauge';

        //iterate all members in options to set this members
        for (var key in options) {
            //check whether the given key is contained by this object
            if (this[key] !== undefined || this[key] !== null)
                this[key] = options[key];
        };
    };

    //declare axis base object
    function axisBase(options) {
        /// <summary>
        /// Creates a new instance of axis base object.
        /// This object is base model for the xAxis an yAxis objects.
        /// </summary>
        /// <param name="options"></param>

        //set members
        this.alpha = 1;
        this.color = '#cccccc';
        this.gridLineColor = '#cccccc';
        this.gridLineThickness = .5;
        this.gridLineAlpha = 0.5;
        this.labelFontColor = '#999999';
        this.labelFontFamily = 'Tahoma';
        this.labelFontSize = 10;
        this.labelFontStyle = 'normal';
        this.startFromZero = true;
        this.tickCount = 10;
        this.title = '';
        this.titleFontColor = '#666666';
        this.titleFontFamily = 'Tahoma';
        this.titleFontSize = 11;
        this.titleFontStyle = 'bold';
        this.thickness = 1;
    };

    //declare xAxis object
    function xAxis(options) {
        /// <summary>
        /// Creates a new instance of xAxis object with the given options.
        /// </summary>
        /// <param name="options"></param>

        //set members
        this.dataType = 'number'; //number, date, string
        
        //extend this with axisbase
        eve.extend(this, new axisBase(options));

        //iterate all members in options to set this members
        for (var key in options) {
            //check whether the given key is contained by this object
            if (this[key] !== undefined || this[key] !== null)
                this[key] = options[key];
        };
    };

    //declare yAxis object
    function yAxis(options) {
        /// <summary>
        /// Creates a new instance of yAxis object with the given options.
        /// </summary>
        /// <param name="options"></param>

        //set members
        this.isStacked = true;

        //extend this with axisbase
        eve.extend(this, new axisBase(options));

        //iterate all members in options to set this members
        for (var key in options) {
            //check whether the given key is contained by this object
            if (this[key] !== undefined || this[key] !== null)
                this[key] = options[key];
        };
    };

    //declare coordinate object
    function xySerie(options) {
        /// <summary>
        /// Creates a new instance of coordinate object with the given options.
        /// </summary>
        /// <param name="options"></param>

        //set members
        this.alpha = .8;
        this.bullet = 'none'; //circle, square, cross, diamond, triangle-down, triangle-up
        this.bulletAlpha = .5;
        this.bulletColor = ''; //uses serie color if not set
        this.bulletSize = 8; //priority set to bulletSizeField
        this.bulletStrokeSize = 1;
        this.bulletStrokeAlpha = 1;
        this.color = '';
        this.lineColor = '#000000';
        this.lineDrawingStyle = 'solid'; //solid, dashed, dotted
        this.lineSize = 1.5;
        this.lineAlpha = 1;
        this.lineType = 'linear'; //linear, spLine, stepLine
        this.minBulletSize = 5;
        this.maxBulletSize = 50;
        this.sizeField = '';
        this.title = '';
        this.type = 'line'; //line, area, bar, scatter, ohlc, candlestick
        this.yField = '';
        this.closeField = '';
        this.highField = '';
        this.lowField = '';
        this.openField = '';
        this.upDayColor = '#83AA30';
        this.downDayColor = '#1499D3';
        this.totalText = 'Total';
        this.negativeColor = '#FF6464';
        this.positiveColor = '#83AA30';
        this.totalColor = '#1499D3';
        this.valueFontColor = '#ffffff';
        this.valueFontFamily = 'Tahoma';
        this.valueFontSize = 13;
        this.valueFontStyle = 'bold';
        this.errorDrawingStyle = 'dashed';
        this.xErrorField = '';
        this.yErrorField = '';

        //iterate all members in options to set this members
        for (var key in options) {
            //check whether the given key is contained by this object
            if (this[key] !== undefined || this[key] !== null) {
                //switch key to create object based instantiation
                switch (key) {
                    default:
                        this[key] = options[key];
                        break;
                }
            }
        };
    }

    //declare bullet serie object
    function bulletSerie(options) {
        /// <summary>
        /// Creates a new instance of bullet serie object with the given options.
        /// </summary>
        /// <param name="options"></param>
        this.color = eveCharts.charts.colors[0];
        this.colorField = '';
        this.labelFontColor = '#333333';
        this.labelFontFamily = 'Tahoma';
        this.labelFontSize = 11;
        this.labelFontStyle = 'normal';
        this.markerColor = '#000000';
        this.markerField = '';
        this.markerFormat = '{{title}}: {{marker}}';
        this.markerWidth = 2;
        this.rangeColor = '#cdcdcd';
        this.rangeFields = [];
        this.titleField = '';
        this.titleFontColor = '#666666';
        this.titleFontFamily = 'Tahoma';
        this.titleFontSize = 14;
        this.titleFontStyle = 'bold';
        this.valueField = '';
        this.valueFormat = '{{title}}: {{value}}';
        
        //iterate all members in options to set this members
        for (var key in options) {
            //check whether the given key is contained by this object
            if (this[key] !== undefined || this[key] !== null) {
                //switch key to create object based instantiation
                switch (key) {
                    default:
                        this[key] = options[key];
                        break;
                }
            }
        };
    };

    //declare parallel serie object
    function parallelSerie(options) {
        /// <summary>
        /// Creates a new instance of parallel lines serie object with the given options.
        /// </summary>
        /// <param name="options"></param>
        this.brushAlpha = 0.3;
        this.brushBorderColor = '#ffffff';
        this.brushColor = '#0066CC';
        this.colorField = '';
        this.dimensionField = '';
        this.lineAlpha = 0.8;
        this.lineDrawingStyle = 'solid'; //solid, dashed, dotted
        this.lineSize = 2.5;
        this.measureFields = [];

        //iterate all members in options to set this members
        for (var key in options) {
            //check whether the given key is contained by this object
            if (this[key] !== undefined || this[key] !== null) {
                //switch key to create object based instantiation
                switch (key) {
                    default:
                        this[key] = options[key];
                        break;
                }
            }
        };
    };

    //set eve charts
    eveCharts.charts = {
        configurator: chart
    };
})(eve);