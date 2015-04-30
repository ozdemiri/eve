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
        this.animationDuration = 1000;
        this.backColor = '#ffffff';
        this.balloon = new balloon();
        this.borderColor = '#eeeeee';
        this.borderRadius = 0;
        this.borderSize = 1;
        this.borderStyle = 'solid';
        this.container = null;
        this.data = null;
        this.dateFormat = 'mm/dd/yyyy';
        this.decimalSeperator = '.';
        this.formatNumbers = false;
        this.height = 'auto';
        this.id = eve.createGUID();
        this.legend = new legend();
        this.margin = { left: 10, top: 10, right: 10, bottom: 10 };
        this.precision = 2;
        this.series = [];
        this.thousandSeperator = ',';
        this.trends = [];
        this.type = 'pie';
        this.valuePrefix = '';
        this.valueSuffix = '';
        this.useAbbreviations = false;
        this.width = 'auto';
        this.xAxis = new xAxis();
        this.xField = '';
        this.yAxis = new yAxis();
        
        //set chart events
        this.legendClick = function (data) { };
        this.serieClick = function (data) { };

        //set base
        var base = this;

        //check whether the type is passed
        if (options['type'] === undefined || options['type'] === null) { throw new Error('Chart type can not be found!'); return null; }

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
                                            base[key].push(new pieSerie(serieObject));
                                            break;
                                        case 'gauge':
                                            base[key].push(new gaugeSerie(serieObject));
                                            break;
                                        default:
                                            base[key].push(new xySerie(serieObject));
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
        this.backColor = 'transparent';
        this.borderColor = 'transparent';
        this.borderRadius = 0;
        this.borderSize = 0;
        this.borderStyle = 'solid';
        this.enabled = true;
        this.fontColor = '#333333';
        this.fontFamily = 'Tahoma';
        this.fontSize = 12;
        this.fontStyle = 'normal';
        this.format = '{{title}}';
        this.iconHeight = 14;
        this.iconType = 'square'; //circle, square, up, down, left, right, diamond, rhomb, star, flag, URL
        this.iconWidth = 14;
        this.maxHeight = 30;
        this.maxTextWidth = 100;
        this.maxWidth = 120;
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
        this.title = '';
        this.fontColor = '#333333';
        this.fontSize = 11;
        this.fontStyle = 'normal';
        this.fontFamily = 'Tahoma';
        this.color = '';
        this.thickness = 0;
        this.balloonFormat = '{{title}}<br/>{{start}} - {{end}}';

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
        this.descriptionField = '';
        this.hoverOpacity = 0.9;
        this.labelPosition = 'inside';
        this.labelFontColor = '#ffffff';
        this.labelFontFamily = 'Tahoma';
        this.labelFontSize = 11;
        this.labelFontStyle = 'normal';
        this.labelFormat = '{{percent}}';
        this.labelsEnabled = true;
        this.opacity = 1;
        this.opacityField = '';
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
        this.thickness = 1;
        this.labelFontColor = '#999999';
        this.labelFontFamily = 'Tahoma';
        this.labelFontSize = 10;
        this.labelFontStyle = 'normal';
        this.labelAngle = 0;
        this.title = '';
        this.titleFontColor = '#666666';
        this.titleFontFamily = 'Tahoma';
        this.titleFontSize = 11;
        this.titleFontStyle = 'bold';
        this.gridLineColor = '#cccccc';
        this.gridLineThickness = 1;
        this.gridLineAlpha = 0.2;
    };

    //declare xAxis object
    function xAxis(options) {
        /// <summary>
        /// Creates a new instance of xAxis object with the given options.
        /// </summary>
        /// <param name="options"></param>

        //set members
        this.position = 'bottom';
        this.titleAlignment = 'center';
        this.parseAsDate = false;

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
        this.position = 'right';
        this.titleAlignment = 'middle';
        this.integers = false;
        this.logarithmic = false;
        this.stackType = 'none';

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
        this.alpha = 1;
        this.alphaField = '';
        this.balloonColor = '';
        this.balloon = new balloon();
        this.bullet = 'none'; //circle, square, triangle-up, triangle-down, rhombus
        this.bulletAlpha = 1;
        this.bulletColor = '';
        this.bulletSize = 5;
        this.bulletSizeField = '';
        this.color = '';
        this.decimalSeperator = '.';
        this.descriptionField = '';
        this.formatNumbers = false;
        this.lineSize = 1.5;
        this.lineAlpha = 0.9;
        this.lineType = 'linear'; //linear, spLine, stepLine
        this.precision = 0;
        this.yField = '';
        this.title = '';
        this.type = 'line'; //line, column, bar, scatter
        this.thousandSeperator = ',';
        this.valuePrefix = '';
        this.valueSuffix = ''
        this.valueField = '';

        //iterate all members in options to set this members
        for (var key in options) {
            //check whether the given key is contained by this object
            if (this[key] !== undefined || this[key] !== null) {
                //switch key to create object based instantiation
                switch (key) {
                    case 'balloon':
                        this[key] = new balloon(options[key]);
                        break;
                    default:
                        this[key] = options[key];
                        break;
                }
            }
        };
    }

    //set eve charts
    eveCharts.charts = {
        configurator: chart
    };
})(eve);