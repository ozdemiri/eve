/*!
 * eve.base.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Base class for eve charts.
 */
(function (e) {
    function visBase(options) {
        //check options
        if (options == null)
            throw new Error('Visualization options could not be found!');

        //check type of the options
        if (e.getType(options) !== 'object')
            throw new Error('Visualization options should be a JSON object!');

        //check container
        if (!options.container)
            throw new Error('Container could not be found!');

        //check whether the data is proper
        let dataType = e.getVisDataType(options.data);

        //check data
        if (!dataType)
            throw new Error('Visualization data does not have a valid type!');

        //base variables
        let members = options ? e.extend(options, e.configs.vis) : e.configs.vis;
        let that = this;
        let element = options.container;
        let offset = null;

        //set psw state
        that.isPSW = false;

        //set members of the base vis
        for (let key in members) {
            switch (key) {
                case 'animation':
                    that[key] = e.extend(members[key], e.configs.animation);
                    break;
                case 'legend':
                    {
                        that[key] = e.extend(members[key], e.configs.legend);
                        that[key].fontColor = e.parseColor(that[key].fontColor);
                        that[key].iconColor = e.parseColor(that[key].iconColor);
                        if (e.getType(that[key].gradientColors) === 'string') {
                            that[key].gradientColors = [];
                        } else {
                            if (that[key].gradientColors.length > 0) {
                                for (var i = 0; i < that[key].gradientColors.length; i++) {
                                    that[key].gradientColors[i] = e.parseColor(that[key].gradientColors[i]);
                                }
                            }
                        }
                        if (e.getType(that[key].legendColors) === 'string') {
                            that[key].legendColors = [];
                        } else {
                            if (that[key].legendColors.length > 0) {
                                for (var i = 0; i < that[key].legendColors.length; i++) {
                                    that[key].legendColors[i].color = e.parseColor(that[key].legendColors[i].color);
                                }
                            }
                        }
                        if (e.getType(that[key].rangeList) === 'string') {
                            that[key].rangeList = [];
                        } else {
                            if (that[key].rangeList.length > 0) {
                                for (var i = 0; i < that[key].rangeList.length; i++) {
                                    that[key].rangeList[i].color = e.parseColor(that[key].rangeList[i].color);
                                }
                            }
                        }
                    }
                    break;
                case 'multiples':
                    that[key] = e.extend(members[key], e.configs.multiples);
                    break;
                case 'title':
                    {
                        that[key] = e.extend(members[key], e.configs.title);
                        that[key].fontColor = e.parseColor(that[key].fontColor);
                    }
                    break;
                case 'tooltip':
                    {
                        that[key] = e.extend(members[key], e.configs.tooltip);
                        that[key].backColor = e.parseColor(that[key].backColor);
                        that[key].fontColor = e.parseColor(that[key].fontColor);
                    }
                    break;
                case 'xAxis':
                case 'yAxis':
                    {
                        that[key] = e.extend(members[key], e.configs.axis);
                        that[key].labelFontColor = e.parseColor(that[key].labelFontColor);
                        that[key].titleFontColor = e.parseColor(that[key].titleFontColor);
                    }
                    break;
                case 'series':
                    {
                        that[key] = [];
                        members[key].forEach(function (m) {
                            let temp = e.extend(m, e.configs.serie);
                            temp.backColor = e.parseColor(temp.backColor);
                            temp.borderColor = e.parseColor(temp.borderColor);
                            temp.color = e.parseColor(temp.color);
                            temp.handleColor = e.parseColor(temp.handleColor);
                            temp.labelFontColor = e.parseColor(temp.labelFontColor);
                            temp.markerColor = e.parseColor(temp.markerColor);
                            temp.negativeColor = e.parseColor(temp.negativeColor);
                            temp.rangeColor = e.parseColor(temp.rangeColor);
                            temp.segmentLineColor = e.parseColor(temp.segmentLineColor);
                            temp.titleColor = e.parseColor(temp.titleColor);
                            that[key].push(temp);
                        });
                    }
                    break;
                case 'colors':
                    {
                        that[key] = [];
                        members[key].forEach(function (m) {
                            that[key].push(e.parseColor(m));
                        });
                    }
                default:
                    {
                        //set class members
                        that[key] = members[key];
                        if (key === 'backColor')
                            that[key] = e.parseColor(that[key]);

                    }
            }

        }

        //check if element is string
        if (e.getType(element) === 'string')
            element = document.getElementById(element);

        //clear element content
        element.innerHTML = '';

        //set inner container
        that.innerContainer = that.container + '_inner';

        //get element offset
        offset = e.offset(element);

        //set ordering
        if (that.ordering) {
            if (that.xAxis) {
                that.xAxis.orderField = that.ordering.orderField;
                that.xAxis.orderDirection = that.ordering.orderDirection;
                that.xAxis.orderValues = that.ordering.orderValues;
            }
        }

        //set width
        if (that.width === 'auto')
            that.width = offset.width;

        //set height
        if (that.height === 'auto')
            that.height = offset.height;

        //check whether the options has border
        if (that.border && that.border.size) {
            //reduce the width and height
            that.width -= (+that.border.size) * 2;
            that.height -= (+that.border.size) * 2;
        }

        //set margins
        that.margin = {
            left: 5,
            right: 5,
            top: 5,
            bottom: 5
        }

        //set chart container location
        that.left = offset.left;
        that.top = offset.top;
        that.serieTypes = [];
        that.dataProperties = (dataType.indexOf("multiples") === -1) ? e.getDataProperties(that.data) : null;

        //declare public members that are need for the visualizations
        that.xDataType = 'numeric';
        if (that.type !== "streamGraph") {
            if (that.type === "barChart") {
                //set x axis crossings
                if (that.xAxis.axisCrossing) {
                    //set axis positions
                    that.xAxis.position = that.xAxis.axisCrossing === "min" ? "left" : "right";
                }

                //set y axis crossings
                if (that.yAxis.axisCrossing) {
                    //set axis positions
                    that.yAxis.position = that.yAxis.axisCrossing === "min" ? "top" : "bottom";
                }
            } else {
                //set x axis crossings
                if (that.xAxis.axisCrossing) {
                    //set axis positions
                    that.xAxis.position = that.xAxis.axisCrossing === "min" ? "bottom" : "top";
                }

                //set y axis crossings
                if (that.yAxis.axisCrossing) {
                    //set axis positions
                    that.yAxis.position = that.yAxis.axisCrossing === "min" ? "left" : "right";
                }
            }
        } else {
            that.yAxis.position = "right";
        }
        
        //set domain handler
        that.domains = {
            minX: 0,
            minY: 0,
            maxX: 0,
            maxY: 0,
            minSize: 0,
            maxSize: 0,
            minColor: 0,
            maxColor: 0,
            minLat: 0,
            maxLat: 0,
            minLong: 0,
            maxLong: 0,
            xValues: [],
            yValues: [],
            isNegative: false
        };

        //set visualization plot
        that.plot = {
            width: that.width,
            height: that.height,
            left: 5,
            top: 5,
            right: 5,
            bottom: 5,
            titleHeight: 0
        };

        //switch chart type to set stack
        switch (that.type) {
            case 'lineChart':
            case 'combinationChart':
            case 'bubbleChart':
            case 'scatterChart':
                that.yAxis.stacked = false;
                break;
        }

        //switch chart type to set stack
        switch (that.masterType) {
            case 'map':
                that.yAxis.stacked = false;
                break;
        }

        if (that.columnNames == null)
            that.columnNames = {};

        //declare needed variables
        let legend = null;
        let tooltip = null;
        let titleDiv = null;
        let titleObject = null;
        let series = [];
        let isStacked = (that.yAxis && that.yAxis.stacked) ? true : false;
        let totalValue = 0;

        //check whether the chart type is stackable
        if (!that.__stackable)
            isStacked = false;

        //declare body click handler
        let bodyClickHandler = function () {
            //raise body click event if there is one
            if (that.onBodyClick)
                that.onBodyClick('body');

            //prevent parent handler's events
            d3.event.stopPropagation();
        };

        //declare title click handler
        let titleClickHandler = function (d, i) {
            //raise title click event if there is one
            if (that.onTitleClick)
                that.onTitleClick('visTitle');

            //prevent parent element click events
            d3.event.stopPropagation();
        };

        //gets column names
        let getChartSerieNames = function () {
            let serieNames = [];
            if (that.series.length) {
                that.series.forEach(function (s) {
                    if (serieNames.indexOf(s.yField) === -1)
                        serieNames.push(s.yField);
                });
            } else {
                serieNames = that.serieNames;
            }
            return serieNames;
        };

        //extracts min value from stack
        let stackMin = function (serie) {
            return d3.min(serie, function (d) { return d[0]; });
        };

        //extracts max value from stack
        let stackMax = function (serie) {
            return d3.max(serie, function (d) { return d[1]; });
        };

        //extract the columns
        let columns = getChartSerieNames();

        //calculates domains for the given dataset
        that.calculateDomain = function (data) {
            //check whether the data argument has set
            if (data)
                that.data = data;

            //check whethe rthe chart type is area chart
            /*if (that.type === "areaChart") {
                //iterate all data
                that.data.forEach(function (d) {
                    //iterate all keys
                    for (let key in d) {
                        if (key !== that.xField) {
                            //get current val
                            let cVal = d[key];

                            //if its null then set it to 0
                            if (cVal == null)
                                d[key] = 0;

                            //cehck type 
                            if (typeof cVal === "string") {
                                //parse to float
                                let pFloatVal = parseFloat(cVal);
                                if (isNaN(pFloatVal))
                                    d[key] = 0;
                                else
                                    d[key] = pFloatVal;
                            }
                        }
                    }
                });
            }*/

            //extract serie names to use them in calculations
            extractSerieNames();

            //calculates domain for array typed data
            let calculateClassicalDomain = function () {
                //declare needed variables
                let diff = null;
                let minX = null;
                let maxX = null;

                //should have x field
                if (that.xField) {
                    //set type of the x field
                    that.xDataType = e.getType(that.data[0][that.xField], 1);
                    that.xDataTypeOriginal = e.getType(that.data[0][that.xField]);

                    //need to check if the chart type is bar or column to set x data type
                    if (that.type === "barChart" || that.type === "columnChart") {
                        //check order params
                        if (that.xAxis.orderFieldName && that.xAxis.orderDirection !== "custom") {
                            if (that.xAxis.orderFieldName !== that.xField) {
                                //set x data type as strings
                                that.xDataType = "string";

                                //set sorting function
                                let sortFunc = that.xAxis.orderDirection === "asc" ? d3.ascending : d3.descending;

                                //sort dataset
                                that.data.sort(function (a, b) {
                                    return sortFunc(a[that.xAxis.orderFieldName], b[that.xAxis.orderFieldName]);
                                });
                            }
                        }

                        //check order direction
                        if (that.xAxis.orderDirection === "custom") {
                            //set string
                            that.xDataType = "string";
                        }
                    }
                    
                    //switch x data type to set x domains
                    switch (that.xDataType) {
                        case 'number':
                            {
                                //set min and max values for x field
                                minX = (that.xAxis && that.xAxis.startsFromZero) ? 0 : d3.min(that.data, function (d) { return d[that.xField]; });
                                maxX = d3.max(that.data, function (d) { return d[that.xField]; });

                                //get difference and domains
                                diff = Math.ceil((maxX - minX) / 10);

                                //set domains
                                that.domains.minX = that.xAxis.locked ? that.xAxis.min : minX;
                                that.domains.maxX = that.xAxis.locked ? that.xAxis.max : maxX;

                                //check whether the chart type is bubble
                                switch (that.type) {
                                    case 'bubbleChart':
                                        {
                                            //set domains
                                            that.domains.minX = that.xAxis.locked ? that.xAxis.min : (minX - diff);
                                            that.domains.maxX = that.xAxis.locked ? that.xAxis.max : (maxX + diff);
                                        }
                                        break;
                                    case 'abacus':
                                    case 'barChart':
                                    case 'columnChart':
                                    case 'combinationChart':
                                        {
                                            //set domains
                                            that.domains.minX = that.xAxis.locked ? that.xAxis.min : (minX - diff);
                                            that.domains.maxX = that.xAxis.locked ? that.xAxis.max : (maxX + diff);

                                            //check axis
                                            if (minX === 0 && !that.xAxis.locked)
                                                that.domains.minX = 0;

                                            //extract unique values for x
                                            that.domains.xValues = e.getUniqueValues(that.data, that.xField);
                                        }
                                        break;
                                }

                                //set min and max values
                                if (that.xAxis.min != null) that.domains.minX = that.xAxis.min;
                                if (that.xAxis.max != null) that.domains.maxX = that.xAxis.max;
                            }
                            break;
                        case 'date':
                            {
                                //set min and max values for x field
                                minX = d3.min(that.data, function (d) { return new Date(d[that.xField]); });
                                maxX = d3.max(that.data, function (d) { return new Date(d[that.xField]); });

                                //set domains
                                that.domains.minX = minX;//that.xAxis.locked ? new Date(that.xAxis.min) : minX;
                                that.domains.maxX = maxX;//that.xAxis.locked ? new Date(that.xAxis.max) : maxX;

                                //check whehter the x axis is locked
                                if (that.xAxis.locked) {
                                    //set min x value
                                    if (e.getType(that.xAxis.min) === "date")
                                        that.domains.minX = that.xAxis.min;
                                    else
                                        that.domains.minX = new Date(that.xAxis.min);

                                    //set max x value
                                    if (e.getType(that.xAxis.max) === "date")
                                        that.domains.maxX = that.xAxis.max;
                                    else
                                        that.domains.maxX = new Date(that.xAxis.max);
                                }

                                //check whether the chart type is bubble
                                switch (that.type) {
                                    case 'abacus':
                                    case 'barChart':
                                    case 'columnChart':
                                        {
                                            //extract unique values for x
                                            that.domains.xValues = e.getUniqueValues(that.data, that.xField);
                                        }
                                        break;
                                }
                            }
                            break;
                        default:
                            {
                                //extract unique values for x
                                that.domains.xValues = (that.xAxis.xValues && that.xAxis.xValues.length) ? that.xAxis.xValues : e.getUniqueValues(that.data, that.xField);

                                if (that.xAxis.orderValues && that.xAxis.orderValues.length > 1) {
                                    //check chart type
                                    if (that.type === "barChart" || that.type === "columnChart") {
                                        //get type of the order values
                                        if (that.xAxis.orderValues && that.xAxis.orderValues.length) {
                                            if (typeof that.xAxis.orderValues === "string") {
                                                that.domains.xValues = that.xAxis.orderValues.split(",");
                                            } else {
                                                that.domains.xValues = that.xAxis.orderValues
                                            }
                                        }
                                    }
                                }
                            }
                            break;
                    }
                }

                //declare min and max values
                let minY = Number.MAX_VALUE;
                let maxY = Number.MIN_VALUE;
                let minSize = Number.MAX_VALUE;
                let maxSize = Number.MIN_VALUE;
                let minColor = Number.MAX_VALUE;
                let maxColor = Number.MIN_VALUE;
                let minLat = Number.MAX_VALUE;
                let maxLat = Number.MIN_VALUE;
                let minLong = Number.MAX_VALUE;
                let maxLong = Number.MIN_VALUE;
                let rowTotals = [];

                //iterate dataset to set min and max y values
                for (let i = 0; i < that.data.length; i++) {
                    //get current data
                    let currentData = that.data[i];
                    let rowTotal = 0;
                    let sizeField = that.series[0].sizeField;
                    let colorField = that.series[0].colorField;
                    let latField = that.series[0].latField;
                    let longField = that.series[0].longField;
                    let sizeValue = sizeField ? +currentData[sizeField] : 0;
                    let colorValue = +parseFloat(currentData[colorField]);
                    let latValue = +parseFloat(currentData[latField]);
                    let longValue = +parseFloat(currentData[longField]);

                    //iterate all keys
                    that.serieNames.forEach(function (key) {
                        //get current value
                        let currentValue = parseFloat(currentData[key]);

                        //check chart type
                        if (that.type === "areaChart") {
                            if (isNaN(currentValue))
                                currentValue = 0;
                        }

                        //increase row total
                        if (currentValue && currentValue > 0)
                            rowTotal += currentValue;

                        //should be numeric
                        if (!isNaN(currentValue)) {
                            //check if the current data key is greater than max
                            if (currentValue > maxY)
                                maxY = currentValue;

                            //check if the current data key is less than min
                            if (currentValue < minY)
                                minY = currentValue;
                        }
                    })

                    //check whether the key is size
                    if (sizeField) {
                        //should be numeric
                        if (!isNaN(sizeValue)) {
                            //check if the current data key is greater than max
                            if (sizeValue > maxSize)
                                maxSize = sizeValue;

                            //check if the current data key is less than min
                            if (sizeValue < minSize)
                                minSize = sizeValue;
                        }
                    }

                    //check whether the key is color
                    if (colorField) {
                        //should be numeric
                        if (!isNaN(colorValue)) {
                            //check if the current data key is greater than max
                            if (colorValue > maxColor)
                                maxColor = colorValue;

                            //check if the current data key is less than min
                            if (colorValue < minColor)
                                minColor = colorValue;
                        }
                    }

                    //check current transform
                    if (that.currTransform === null || that.series[0].updateReZoom) {
                        //check whether the key is lat
                        if (latField) {
                            //should be numeric
                            if (!isNaN(latValue)) {
                                //check if the current data key is greater than max
                                if (latValue > maxLat)
                                    maxLat = latValue;

                                //check if the current data key is less than min
                                if (latValue < minLat)
                                    minLat = latValue;
                            }
                        }

                        //check whether the key is lat
                        if (longField) {
                            //should be numeric
                            if (!isNaN(longValue)) {
                                //check if the current data key is greater than max
                                if (longValue > maxLong)
                                    maxLong = longValue;

                                //check if the current data key is less than min
                                if (longValue < minLong)
                                    minLong = longValue;
                            }
                        }
                    }

                    //push the current row total into the stack
                    rowTotals.push(rowTotal);
                }

                if (minY < 0)
                    that.domains.isNegative = true;
                else
                    that.domains.isNegative = false;

                //check whether the chart is stacked
                if (isStacked && that.series.length > 1) {
                    //stack the data
                    let stackedData = d3.stack().keys(columns).offset(d3.stackOffsetDiverging)(that.data);
                    
                    //set y domains
                    that.domains.minY = d3.min(stackedData, stackMin);
                    that.domains.maxY = d3.max(stackedData, stackMax);
                } else {
                    //set y domains
                    that.domains.minY = (isStacked && minY > 0) ? 0 : ((that.yAxis && that.yAxis.startsFromZero) ? 0 : minY);
                    that.domains.maxY = (isStacked ? d3.max(rowTotals) : maxY);
                }

                //check if the chart is sliced
                if (that.xField && that.series[0].valueField) {
                    totalValue = d3.sum(that.data, function (d) {
                        return +d[that.series[0].valueField];
                    })
                }
                
                //check if the base type is xy
                if (that.__baseChartType && that.__baseChartType === "xy" && that.type !== "radarChart")
                    that.domains.maxY *= 1.05;

                //check whether the chart type is bubble
                if (that.type === "bubbleChart")
                    that.domains.maxY *= 1.1;

                //set size domains
                that.domains.minSize = minSize;
                that.domains.maxSize = maxSize;

                //set color domains
                that.domains.minColor = minColor;
                that.domains.maxColor = maxColor;

                //set lat domains
                that.domains.minLat = minLat;
                that.domains.maxLat = maxLat;

                //set long domains
                that.domains.minLong = minLong;
                that.domains.maxLong = maxLong;

                //set y values
                if (that.frozenYAxis && that.frozenYAxis === "string") {
                    that.domains.yValues = e.getUniqueValues(that.data, that.series[0].yField);
                }

                //check whether the y axis is locked
                if (that.yAxis.locked) {
                    var minYAxisVal = parseFloat(that.yAxis.min);
                    var maxYAxisVal = parseFloat(that.yAxis.max);

                    //set min and max from the user entry
                    if (!isNaN(minYAxisVal) && !isNaN(maxYAxisVal)) {
                        that.domains.minY = minYAxisVal;
                        that.domains.maxY = maxYAxisVal;
                    }
                }

                //check whether manual values are sent
                if (that.yAxis.colorMin && that.yAxis.colorMax) {
                    //set min and max from the user entry
                    that.domains.minColor = that.yAxis.colorMin;
                    that.domains.maxColor = that.yAxis.colorMax;
                }

                //set min and max values 
                if (that.yAxis.stacked && that.yAxis.stackType === "full") {
                    that.domains.minY = 0;
                    that.domains.maxY = 100;
                }

                switch (that.type) {
                    case "wordCloud":
                        {
                            //set min and max measures by value
                            that.domains.minY = d3.min(that.data, function (d) { return +d.size; });
                            that.domains.maxY = d3.max(that.data, function (d) { return +d.size; });
                        }
                        break;
                }

                //if vis is from multiples
                if (that.fromMultiples) {
                    //set min x value
                    if (that.xAxis.min !== undefined && that.xAxis.min !== null && that.xAxis.min !== Number.MAX_VALUE)
                        that.domains.minX = that.xAxis.min;

                    //set max x value
                    if (that.xAxis.max !== undefined && that.xAxis.max !== null && that.xAxis.max !== Number.MIN_VALUE)
                        that.domains.maxX = that.xAxis.max;

                    //set min y value
                    if (that.yAxis.min !== undefined && that.yAxis.min !== null && that.yAxis.min !== Number.MAX_VALUE)
                        that.domains.minY = that.yAxis.min;

                    //set max y value
                    if (that.yAxis.max !== undefined && that.yAxis.max !== null && that.yAxis.max !== Number.MIN_VALUE)
                        that.domains.maxY = that.yAxis.max;

                    if (that.xAxis.values && that.xAxis.values.length)
                        that.domains.xValues = that.xAxis.values;

                    if (that.yAxis.values && that.yAxis.values.length)
                        that.domains.yValues = that.yAxis.values;
                }

                //set min and max values
                if (that.yAxis.min != null) that.domains.minY = parseFloat(that.yAxis.min);
                if (that.yAxis.max != null) that.domains.maxY = parseFloat(that.yAxis.max);
            };

            //calculates domain for tree typed data
            let calculateTreeDomain = function () {
                //extracts size values from the 
                let extractSizeValues = function () {
                    //declare needed variables
                    let values = [];

                    //run the recursive function to get values
                    recursiveFill(that.data);

                    //gets values recursively
                    function recursiveFill(object) {
                        if (object) {
                            //check whether the object has children
                            if (object.depth === 0) {
                                //get children values
                                object.children.forEach(function (c) {
                                    recursiveFill(c);
                                });
                            } else {
                                //get unique values
                                if (object.children && object.children.length) {
                                    //get unique values from the children
                                    let uniqueValues = e.getUniqueValues(object.children, 'size');

                                    //concatanate with values
                                    values = values.concat(uniqueValues);
                                }
                            }
                        }
                    }

                    //returns the values
                    if (values.length > 0)
                        return values;
                };

                //get all values in array
                let sizes = extractSizeValues();

                //set y domains
                that.domains.minY = d3.min(sizes);
                that.domains.maxY = d3.max(sizes);
            };

            //calculates domain for sankey typed data
            let calculateSankeyDomain = function () {
                //set y domains
                that.domains.minY = d3.min(that.data.links, function (d) { return +d.value; });
                that.domains.maxY = d3.max(that.data.links, function (d) { return +d.value; });
            };

            //calculates domain for multiples data
            let calculateMultiplesDomain = function () {
                //set min and max sets
                let minMeasureSets = [];
                let maxMeasureSets = [];
                let minSourceSets = [];
                let maxSourceSets = [];
                let minColorSets = [];
                let maxColorSets = [];
                let minYSets = [];
                let currentSerie = that.series[0];

                //switch data type to calculate domains
                switch (dataType) {
                    case "multiplesTree":
                        {
                            //iterate all dataset
                            that.data.forEach(function (currentSet) {
                                //create pack
                                let currentDataArray = currentSet.values.dataArray || currentSet.values;
                                let pack = d3.pack()
                                    .padding(2)
                                    .size([that.plot.width, that.plot.height]);

                                //create hierarchical data
                                let hierarchical = d3.hierarchy(currentDataArray)
                                    .sum(function (d) {
                                        return d["size"] ? +d["size"] : 0;
                                    })
                                    .sort(function (a, b) { return b.value - a.value; });

                                //create nodes from hierarchical data
                                let nodes = pack(hierarchical).descendants();

                                //get max depth
                                let maxDepth = d3.max(nodes, function (d) { return d.depth; });

                                //set min value
                                let minTreeValue = d3.min(nodes, function (d) {
                                    return d.size || d.value;
                                });

                                //set max value
                                let maxTreeValue = d3.max(nodes, function (d) {
                                    if (d.depth === maxDepth)
                                        return d.size || d.value;
                                });

                                //push to set
                                minMeasureSets.push(minTreeValue);
                                maxMeasureSets.push(maxTreeValue);
                            });
                        }
                        break;
                    case "multiplesArray":
                        {
                            //gets first data 
                            let getFirstData = function () {
                                //iterate all dataset
                                let firstData = null;
                                that.data.forEach(function (currentSet) {
                                    //create pack
                                    let cda = currentSet.values.dataArray || currentSet.values;
                                    if (cda.length > 0)
                                        firstData = cda[0];
                                });
                                return firstData;
                            };

                            //iterate all dataset
                            let firstData = getFirstData();
                            that.data.forEach(function (currentSet) {
                                //create pack
                                let currentDataArray = currentSet.values.dataArray || currentSet.values;
                                let measureField = currentSerie.measureField || currentSerie.valueField || currentSerie.yField;
                                let sourceField = currentSerie.xField || currentSerie.sourceField || currentSerie.dateField;
                                let colorField = currentSerie.colorField;

                                //if serie type is slope then source field should be range field
                                if (currentSerie.type === "slopeGraph")
                                    sourceField = currentSerie.rangeField;

                                //set first x value
                                let firstXValue = sourceField ? firstData[sourceField] : 0;
                                let firstYValue = measureField ? firstData[measureField] : 0;

                                //update x s
                                that.xDataType = typeof firstXValue;

                                //switch x data type to get min maxes for x domain
                                switch (that.xDataType) {
                                    case "number":
                                    case "numeric":
                                        {
                                            //push to current sets
                                            minSourceSets.push(d3.min(currentDataArray, function (d) { return +d[sourceField]; }));
                                            maxSourceSets.push(d3.max(currentDataArray, function (d) { return +d[sourceField]; }));
                                        }
                                        break;
                                    case "date":
                                        {
                                            //push to current sets
                                            minSourceSets.push(d3.min(currentDataArray, function (d) { return new Date(d[sourceField]); }));
                                            maxSourceSets.push(d3.max(currentDataArray, function (d) { return new Date(d[sourceField]); }));
                                        }
                                        break;
                                    default:
                                        {
                                            //get unique values from the set
                                            let allUniqueXValues = e.getUniqueValues(currentDataArray, sourceField);

                                            //iterate all unique x values to push them into the source stack
                                            allUniqueXValues.forEach(function (xVal) {
                                                if (minSourceSets.indexOf(xVal) === -1)
                                                    minSourceSets.push(xVal);
                                            });
                                        }
                                        break;
                                }

                                //check whether the serie type is matrix
                                if (currentSerie.type === "networkMatrix" && typeof firstYValue === "string" && that.yAxis.locked) {
                                    //get unique values from the set
                                    let allUniqueYValues = e.getUniqueValues(currentDataArray, measureField);

                                    //iterate all unique x values to push them into the source stack
                                    allUniqueYValues.forEach(function (yVal) {
                                        if (minYSets.indexOf(yVal) === -1)
                                            minYSets.push(yVal);
                                    });

                                    //set y values
                                    that.yAxis.yValues = minYSets;
                                }

                                //set measure sets
                                if (isStacked) {
                                    //iterate all data array to set y values
                                    currentDataArray.forEach(function (cda) {
                                        let rowTotal = 0;
                                        for (var key in cda) {
                                            if (key !== sourceField) {
                                                rowTotal += +cda[key];
                                            }
                                        }
                                        maxMeasureSets.push(rowTotal);
                                    });
                                } else {
                                    //push to current sets
                                    minMeasureSets.push(d3.min(currentDataArray, function (d) { return +d[measureField]; }));
                                    maxMeasureSets.push(d3.max(currentDataArray, function (d) { return +d[measureField]; }));
                                }

                                //check whether the key is color
                                if (colorField) {
                                    //push to current sets
                                    minColorSets.push(d3.min(currentDataArray, function (d) { return +d[colorField]; }));
                                    maxColorSets.push(d3.max(currentDataArray, function (d) { return +d[colorField]; }));
                                }

                                //check whether the 
                            });
                        }
                        break;
                }

                if (currentSerie.type === "slopeGraph") {
                    //set domain via locked axes
                    if (that.xAxis.locked && that.yAxis.locked) {
                        that.domains.minX = that.xAxis.min;
                        that.domains.maxX = that.xAxis.max;
                        that.domains.minY = that.yAxis.min;
                        that.domains.maxY = that.yAxis.max;
                    }
                } else {
                    //extract min and max for source
                    if (that.xDataType === "string") {
                        //set sources
                        that.domains.xValues = e.getUniqueValues(minSourceSets).sort(d3.ascending);
                    } else {
                        //extract min and max for measure
                        that.domains.minX = d3.min(minSourceSets);
                        that.domains.maxX = d3.max(maxSourceSets);
                    }

                    //extract min and max for measure
                    that.domains.minY = d3.min(minMeasureSets);
                    that.domains.maxY = d3.max(maxMeasureSets);

                    //extract min and max for measure
                    that.domains.minColor = d3.min(minColorSets);
                    that.domains.maxColor = d3.max(maxColorSets);

                    //set min y value
                    if (that.yAxis.min != null && that.yAxis.locked)
                        that.domains.minY = that.yAxis.min;

                    //set max y value
                    if (that.yAxis.max != null && that.yAxis.locked)
                        that.domains.maxY = that.yAxis.max;

                    //set min x axis value
                    if (that.xAxis.min != null && that.xAxis.locked) {
                        that.domains.minX = that.yAxis.min;
                    }

                    //set max x axis value
                    if (that.xAxis.max != null && that.xAxis.locked) {
                        that.domains.maxX = that.yAxis.max;
                    }
                }
            };

            //switch vis data type to calculate domains
            switch (dataType) {
                case 'classical':
                    calculateClassicalDomain();
                    break;
                case 'tree':
                    calculateTreeDomain();
                    break;
                case 'sankey':
                    calculateSankeyDomain();
                    break;
                default:
                    calculateMultiplesDomain();
                    break;
            }
        };

        //extracts serie names
        let extractSerieNames = function () {
            //set a serie names member
            that.serieNames = [];

            //check whether the vis has group
            if (that.hasGroup) {
                //extract column names from the data
                that.serieNames = d3.keys(that.data[0]).remove(that.xField).remove(that.series[0].sizeField).remove("_total").remove("_serieIndex");
            } else {
                //if it's not grouped then series hardly set
                that.series.forEach(function (s) {
                    //create the serie types
                    that.serieTypes.push({
                        type: s.type,
                        name: s.yField ? s.yField.toString() : "",
                        serie: s
                    });

                    //push relevant fields into series
                    if (s.yField)
                        that.serieNames.push(s.yField);
                    else if (s.valueField)
                        that.serieNames.push(s.valueField);
                    else if (s.measureField)
                        that.serieNames.push(s.measureField);
                });
            }
        };

        //set style of the container
        d3.select(element)
            .style('background-color', that.backColor)
            .style('border-color', that.border.color)
            .style('border-width', that.border.size + 'px')
            .style('border-style', that.border.style)
            .style('position', 'relative')
            .append('div')
            .on('click', bodyClickHandler)
            .attr('id', that.innerContainer)
            .style('background-color', that.backColor);

        //gets all containers
        let getContainers = function () {
            let lc = $("#" + that.container + "_legend");
            let tc = $("#" + that.container + "_title");
            let ic = $("#" + that.container + "_inner");
            let mc = $("#" + that.container);

            return {
                legend: lc,
                title: tc,
                inner: ic,
                master: mc
            };
        };

        //update container for specified visualizations
        switch (that.type) {
            case 'locationMap':
            case 'routeMap':
            case 'densityMap':
            case 'multiples':
                {
                }
                break;
            default:
                {
                    //create canvas
                    that.svg = d3.select('#' + that.innerContainer)
                        .append('svg')
                        .attr('id', that.container + '_svg')
                        .attr('class', 'vis_svg')
                        .attr('viewBox', '0 0 ' + that.width + ' ' + that.height)
                        .attr('preserveAspectRatio', 'xMidYMid meet')
                        .attr('width', that.width)
                        .attr('height', that.height)
                        .attr('fill', that.backColor)
                        .attr('stroke', 'none');

                    //handle css dimensions
                    if (e.mobile)
                        $('#' + that.container + '_svg').css("height", that.height);

                    //handle resize
                    if (that.isTemp) {
                        //get container dom element
                        let containerElement = document.getElementById(that.container);

                        //create the resizer
                        new ResizeSensor(containerElement, function () {
                            //get element node
                            let aspect = that.width / that.height;
                            let containers = getContainers();
                            let legendWidth = containers.legend.width();
                            let legendHeight = containers.legend.height();
                            let titleWidth = containers.title.width();
                            let titleHeight = containers.title.height();
                            let masterWidth = containers.master.width();
                            let masterHeight = containers.master.height();
                            let newWidth = (masterWidth - (legendWidth ? legendWidth : 0));
                            let newHeight = newWidth / aspect;

                            //resize the content
                            that.svg.attr("width", newWidth);
                            that.svg.attr("height", newHeight);
                        });

                        //create the resizer
                        new ResizeSensor(containerElement.parentElement, function () {
                            //get element node
                            let aspect = that.width / that.height;
                            let containers = getContainers();
                            let legendWidth = containers.legend.width();
                            let legendHeight = containers.legend.height();
                            let titleWidth = containers.title.width();
                            let titleHeight = containers.title.height();
                            let masterWidth = containers.master.width();
                            let masterHeight = containers.master.height();
                            let newWidth = (masterWidth - (legendWidth ? legendWidth : 0));
                            let newHeight = newWidth / aspect;

                            //resize the content
                            that.svg.attr("width", newWidth);
                            that.svg.attr("height", newHeight);
                        });
                    }
                }
                break;
        }

        //set serie colors
        that.series.forEach(function (currentSerie, serieIndex) {
            //check whether the current serie has color
            if (!currentSerie.color)
                currentSerie.color = serieIndex < e.colors.length ? e.colors[serieIndex] : e.randColor();

            //iterate all legend colors
            that.legend.legendColors.forEach(function (lc) {
                if (lc.text === currentSerie.yField || lc.value === currentSerie.yField)
                    currentSerie.color = lc.color;
            });
        });

        //set public events that are used by the visualizations
        that.updateTitle = function () {
            //check whether the title is empty
            let content = arguments.length > 0 ? arguments[0] : that.title.content;

            if (!that.title.position)
                that.title.position = "topCenter";

            //get alignment by position
            let getTitleAlignment = function () {
                //set alignment by position
                switch (that.title.position) {
                    case 'topLeft':
                    case 'bottomLeft':
                        return 'left';
                    case 'topRight':
                    case 'bottomRight':
                        return 'right';
                    case 'topCenter':
                    case 'bottomCenter':
                        return 'center';
                    default:
                        return 'center';
                }
            };

            //check whether the content is not empty
            if (content) {
                //title object should be null in first create
                if (titleObject === null) {
                    //if title object is null then we need to create a new one
                    if (that.title.position.indexOf('bottom') > -1) {
                        titleObject = d3.select(element)
                            .append('div')
                            .attr('id', that.container + '_title')
                            .attr('width', that.width + 'px');
                    } else {
                        titleObject = d3.select(element)
                            .insert('div', ':first-child')
                            .attr('id', that.container + '_title')
                            .attr('width', that.width + 'px');
                    }

                    //set title font size
                    let titleFontSize = typeof that.title.fontSize === "number" ? that.title.fontSize + "px" : that.title.fontSize;

                    //create chart title div
                    titleDiv = titleObject
                        .append('div')
                        .style('font-size', titleFontSize)
                        .style('background-color', that.backColor)
                        .style('color', that.title.fontColor)
                        .style('font-family', that.title.fontFamily + ', Arial, Helvetica, Ubuntu')
                        .style('font-style', that.title.fontStyle == 'bold' ? 'normal' : that.title.fontStyle)
                        .style('font-weight', that.title.fontStyle == 'bold' ? 'bold' : 'normal')
                        .style('padding-left', '5px')
                        .style('padding-right', '5px')
                        .style('padding-top', '5px')
                        .style('padding-bottom', '5px')
                        .style('text-align', getTitleAlignment())
                        .on('click', titleClickHandler)
                        .html(content);

                    //get title object's offset
                    titleOffset = titleDiv.node().getBoundingClientRect();

                    //reduce plot area height
                    that.plot.height -= titleOffset.height;

                    //set title height based on position
                    if (that.title.position.indexOf('bottom') > -1) {
                        that.plot.titleHeight = 0;
                    } else {
                        that.plot.titleHeight = titleOffset.height;
                    }

                    //if there is svg than update the canvas with new plot values
                    if (that.svg) {
                        //update canvas
                        that.svg
                            .attr('viewBox', '0 0 ' + that.plot.width + ' ' + that.plot.height)
                            .attr('height', that.plot.height);
                    }
                } else {
                    //update title
                    titleDiv.html(content);
                }
            }
        };

        //shows tooltip
        that.showTooltip = function () {
            tooltip.show(Array.prototype.slice.call(arguments));
        };

        //hides tooltip
        that.hideTooltip = function () {
            tooltip.hide();
        };

        //updates legend
        that.updateLegend = function () {
            //update legend with the new data
            legend.update(that);
        };

        //draws the chart into a canvas
        that.toCanvas = function (id) {
            //get the that container
            var orgDiv = document.getElementById(that.container),
                innerDiv = document.getElementById(that.innerContainer),
                legendSvg = document.getElementById(that.container + '_legend_svg'),
                innerSvg = innerDiv.querySelector('#' + that.container + '_svg'),
                _zoomDiv = document.getElementById(that.container + '_zoom_container'),
                ready = false,
                legendSvgTemp = null,
                tempCanvas = null;

            //create the canvas
            tempCanvas = document.createElement("canvas");

            //convert SVG into a XML string
            xml = (new XMLSerializer()).serializeToString(innerSvg);
            if (e.detectMS())
                xml = xml.replace(/xmlns=\"http:\/\/www\.w3\.org\/2000\/svg\"/, '');

            //draw the SVG onto a canvas
            canvg(tempCanvas, xml, { ignoreMouse: true, ignoreAnimation: true, renderCallback: function () { ready = true } });

            //replace innerSvg with canvas
            innerDiv.appendChild(tempCanvas);
            innerDiv.removeChild(innerSvg);

            //remove zoom
            if (_zoomDiv)
                innerDiv.removeChild(_zoomDiv);

            //serialize legend if exists
            if (legendSvg) {
                //create the canvas       
                legendSvgTemp = document.createElement("canvas");
                //convert SVG into a XML string
                xml = (new XMLSerializer()).serializeToString(legendSvg);
                if (e.detectMS())
                    xml = xml.replace(/xmlns=\"http:\/\/www\.w3\.org\/2000\/svg\"/, '');

                //draw the SVG onto a canvas
                canvg(legendSvgTemp, xml, { ignoreMouse: true, ignoreAnimation: true });

                //replace innerSvg with canvas
                legendSvg.parentNode.appendChild(legendSvgTemp);
                legendSvg.parentNode.removeChild(legendSvg);
            }

            /* create the promise for function response
            ** this is required for handling async canvas conversion
            */
            return new Promise(function (resolve) {
                var canvasInterval = setInterval(function () {
                    if (ready) {
                        //convert the final clone to canvas
                        html2canvas(orgDiv).then(function (canvas) {
                            if (legendSvg) {
                                //restore legend elements
                                legendSvgTemp.parentNode.appendChild(legendSvg);
                                legendSvgTemp.parentNode.removeChild(legendSvgTemp);
                            }
                            //restore orgDiv elements
                            innerDiv.appendChild(innerSvg);
                            innerDiv.removeChild(tempCanvas);
                            if (_zoomDiv)
                                innerDiv.appendChild(_zoomDiv);
                            //return promise with canvas
                            canvas.id = id + '-canvas';
                            resolve(canvas);
                        });
                        clearInterval(canvasInterval);
                    }
                }, 500);
            });
        };

        //returns the chart image
        that.toImage = function () {
            //get the that container
            var orgDiv = document.getElementById(that.container),
                innerDiv = document.getElementById(that.innerContainer),
                legendSvg = document.getElementById(that.container + '_legend_svg'),
                innerSvg = innerDiv.querySelector('#' + that.container + '_svg'),
                _zoomDiv = document.getElementById(that.container + '_zoom_container'),
                ready = false,
                legendSvgTemp = null,
                tempCanvas = null;

            //create the canvas
            tempCanvas = document.createElement("canvas");
            //convert SVG into a XML string
            xml = (new XMLSerializer()).serializeToString(innerSvg);
            if (e.detectMS())
                xml = xml.replace(/xmlns=\"http:\/\/www\.w3\.org\/2000\/svg\"/, '');

            //draw the SVG onto a canvas
            canvg(tempCanvas, xml, { ignoreMouse: true, ignoreAnimation: true, renderCallback: function () { ready = true } });

            //replace innerSvg with canvas
            innerDiv.appendChild(tempCanvas);
            innerDiv.removeChild(innerSvg);

            //remove zoom
            if (_zoomDiv)
                innerDiv.removeChild(_zoomDiv);

            //serialize legend if exists
            if (legendSvg) {
                //create the canvas       
                legendSvgTemp = document.createElement("canvas");
                //convert SVG into a XML string
                xml = (new XMLSerializer()).serializeToString(legendSvg);
                if (e.detectMS())
                    xml = xml.replace(/xmlns=\"http:\/\/www\.w3\.org\/2000\/svg\"/, '');

                //draw the SVG onto a canvas
                canvg(legendSvgTemp, xml, { ignoreMouse: true, ignoreAnimation: true });

                //replace innerSvg with canvas
                legendSvg.parentNode.appendChild(legendSvgTemp);
                legendSvg.parentNode.removeChild(legendSvg);
            }

            /* create the promise for function response
            ** this is required for handling async canvas conversion
            */
            return new Promise(function (resolve) {
                var canvasInterval = setInterval(function () {
                    if (ready) {
                        //convert the final clone to canvas
                        html2canvas(orgDiv).then(function (canvas) {
                            if (legendSvg) {
                                //restore legend elements
                                legendSvgTemp.parentNode.appendChild(legendSvg);
                                legendSvgTemp.parentNode.removeChild(legendSvgTemp);
                            }
                            //restore orgDiv elements
                            innerDiv.appendChild(innerSvg);
                            innerDiv.removeChild(tempCanvas);
                            if (_zoomDiv)
                                innerDiv.appendChild(_zoomDiv);
                            //return promise with canvas
                            resolve(canvas.toDataURL('image/png'));
                        });
                        clearInterval(canvasInterval);
                    }
                }, 500);
            });
        };

        //wraps given text
        that.wrapText = function (text, width) {
            text.each(function () {
                let text = d3.select(this),
                    words = text.text().split(/\s+/).reverse(),
                    word,
                    line = [],
                    lineIndex = 0,
                    lineHeight = 1.1,
                    y = text.attr("y"),
                    dy = text.attr("dy") ? parseFloat(text.attr("dy")) : 0,
                    tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");

                if (words.length > 1) {
                    while (word = words.pop()) {
                        line.push(word);
                        tspan.text(line.join(" "));
                        if (lineIndex > 0 && tspan.node().getComputedTextLength() > width) {
                            line.pop();
                            tspan.text(line.join(" "));
                            line = [word];
                            //lineHeight = lineIndex === 0 ? 0 : 1.1;
                            tspan = text.append("tspan")
                                .attr("x", 0)
                                .attr("y", y)
                                .attr("dy", lineHeight + dy + "em")
                                .text(word);
                        }
                        lineIndex++;
                    }
                } else {
                    //lineHeight = lineIndex === 0 ? 0 : 1.1;
                    tspan = text.append("tspan")
                        .attr("x", 0)
                        .attr("y", y)
                        .attr("dy", dy + "em")
                        .text(words[0]);
                }
            });
        };

        //gets auto color
        that.getAutoColor = function (color) {
            //set current color
            let actualColor = d3.color(color);

            if (actualColor) {
                //check if the actual color is white
                if (actualColor.r === 255 && actualColor.g === 255 && actualColor.b === 255)
                    actualColor = d3.rgb(0, 0, 0);
                else if (actualColor.r === 0 && actualColor.g === 0 && actualColor.b === 0)
                    actualColor = d3.rgb(255, 255, 255);
                else {
                    if ((1 - (0.299 * actualColor.r + 0.587 * actualColor.g + 0.114 * actualColor.b) / 255) < 0.5)
                        actualColor = d3.rgb(d3.hsl(d3.color(color)).darker()).darker(2); // bright colors
                    else
                        actualColor = d3.rgb(d3.hsl(d3.color(color)).brighter()).brighter(2); // dark colors
                }

                //return inverted color
                return actualColor.toString();
            } else {
                return e.randColor();
            }
        }

        //gets serie index by name
        that.getSerieIndexByName = function (name) {
            let index = -1;
            that.series.forEach(function (serie, serieIndex) {
                if (serie.yField.toString() && serie.yField.toString() === name)
                    index = serieIndex;
                else if (serie.measureField && serie.measureField === name)
                    index = serieIndex;
                else if (serie.valueField && serie.valueField === name)
                    index = serieIndex;
            });
            return index;
        };

        //get explode translation
        let explode = function (x, isClicked) {
            let explodeOffset = 15;
            switch (that.type) {
                case "pieChart":
                case "donutChart":
                    {
                        let offset = isClicked ? explodeOffset : 0;
                        let angle = (x.startAngle + x.endAngle) / 2;
                        let xOff = Math.sin(angle) * offset;
                        let yOff = -Math.cos(angle) * offset;
                        return "translate(" + xOff + "," + yOff + ")";
                    }
                    break;
            }
        };

        //interacts with the serie
        that.interactSerie = function () {
            //set default options
            let serieIndex = 0,
                isClicked = true,
                opacity = 1,
                dataObj = null,
                propertyName = 'opacity';

            //check arguments count
            if (arguments.length === 1) {
                serieIndex = arguments[0];
            } else if (arguments.length === 2) {
                serieIndex = arguments[0];
                isClicked = arguments[1];
            } else if (arguments.length === 3) {
                serieIndex = arguments[0];
                isClicked = arguments[1];
                opacity = arguments[2];
            } else if (arguments.length === 4) {
                serieIndex = arguments[0];
                isClicked = arguments[1];
                opacity = arguments[2];
                dataObj = arguments[3];
            }

            //set svg
            let svg = that.svg ? that.svg : that.tempSVG;
            if (svg) {
                //check chart type
                switch (that.type) {
                    case "donutChart":
                    case "pieChart":
                        {
                            //set data object
                            dataObj = that.__slicedSet[serieIndex];

                            //get arc center
                            let arcCenter = that.__tempArc.centroid(dataObj);
                            
                            //check if the slice has clicked
                            if (isClicked) {
                                svg.select(".eve-vis-series-" + serieIndex).transition().duration(100).attr('transform', explode(dataObj, true))
                            } else {
                                svg.select(".eve-vis-series-" + serieIndex).transition().duration(100).attr('transform', explode(dataObj, false))
                            }
                        }
                        break;
                    case "funnelChart":
                        {
                            //check if the slice has clicked
                            if (isClicked) {
                                svg.select(".eve-vis-series-" + serieIndex).transition().duration(100).attr('transform', 'translate(15,0)');
                            } else {
                                svg.select(".eve-vis-series-" + serieIndex).transition().duration(100).attr('transform', 'translate(0,0)');
                            }
                        }
                        break;
                    case "pyramidChart":
                        {
                            //declare x and y
                            let newX = that.__funnelWidth / 2,
                                newY = that.__funnelHeight / 2;

                            //check if the slice has clicked
                            if (isClicked) {
                                newX += 15;
                                svg.select(".eve-vis-series-" + serieIndex).transition().duration(100).attr('transform', 'rotate(180,' + newX + ',' + newY + ')');
                            } else {
                                svg.select(".eve-vis-series-" + serieIndex).transition().duration(100).attr('transform', 'rotate(180,' + newX + ',' + newY + ')');
                            }
                        }
                        break;
                    default:
                        {
                            //set class selector
                            let classSelector = dataObj.value.toString().toClassSelector();

                            //check whether the clicked
                            if (isClicked) {
                                //set vis series    
                                svg.selectAll('.eve-vis-series').style(propertyName, 0.1);
                                svg.selectAll('.serie-' + classSelector).style(propertyName, opacity);
                            } else {
                                //set vis series
                                svg.selectAll('.eve-vis-series').style(propertyName, opacity);
                            }
                        }
                        break;
                }
            }
        }

        //finds column name via friendly name
        let findColumnNameViaFriendlyName = function (friendlyName) {
            var foundedName = '';
            if (that.columnNames && that.columnNames != null) {
                for (var key in that.columnNames) {
                    if (that.columnNames[key] === friendlyName)
                        foundedName = key;
                }
            }
            return foundedName;
        };

        //gets formatted content
        that.getContent = function (currentData, currentSerie, format, sourceName, targetName) {
            if (!format) return '';
            let content = format,
                formatted = '',
                data = currentData.data || currentData;

            if (!currentSerie)
                currentSerie = that.series[0];

            if (currentData.data && typeof currentData.data === 'object')
                data = currentData.data;
            else
                data = currentData;

            let tags = content.match(/{(.*?)}/g) !== null ? content.match(/{(.*?)}/g).map(function (val) { return val; }) : [],
                fieldTags = content.match(/\[(.*?)\]/g) !== null ? content.match(/\[(.*?)\]/g).map(function (val) { return val; }) : [],
                serieName = currentSerie.title || currentSerie.yField.toString() || currentSerie.measureField || currentSerie.valueField || currentSerie.sizeField,
                alphaValue = data[currentSerie.alphaField],
                closeValue = data[currentSerie.closeField],
                columnValue = data[currentSerie.columnField] || data[currentSerie.targetField] || data[that.xField],
                colorValue = data[currentSerie.colorField],
                dateValue = data[currentSerie.dateField],
                endValue = data[currentSerie.endField] || data[currentSerie.endDateField],
                groupValue = data._groupValue || data[currentSerie.groupField] || data.group || data.clusterName,
                relationValue = data.groupValue,
                highValue = data[currentSerie.highField],
                labelValue = data[currentSerie.labelField],
                latValue = data[currentSerie.latField],
                longValue = data[currentSerie.longField],
                orderValue = data[currentSerie.orderField],
                lowValue = data[currentSerie.lowField],
                markerValue = data[currentSerie.markerField],
                measureValue = data.expressionedDataValue || currentData.expressionedDataValue || data._measureValue || data.measure || data[currentSerie.measureField] || data[currentSerie.yField.toString()] || data[currentSerie.valueField] || data.value || data.size || data.measureValue,
                openValue = data[currentSerie.openField],
                rangeValue = data[currentSerie.rangeField],
                rowValue = data[currentSerie.rowField] || data[currentSerie.sourceField] || data[currentSerie.yField.toString()],
                sizeValue = data.sizeValue || data[currentSerie.sizeField] || data[currentSerie.valueField] || data[currentSerie.measureField] || data.size,
                sourceValue = sourceName || data._sourceValue || data[that.xField] || data[currentSerie.sourceField] || data.sourceValue || data.source || data.name || data[currentSerie.groupField],
                targetValue = targetName || data[currentSerie.targetField] || data.targetValue,
                startValue = data[currentSerie.startField] || data[currentSerie.startDateField],
                standardValue = data.expressionedDataValue || currentData.expressionedDataValue || data.value || data[currentSerie.valueField] || data[currentSerie.measureField] || data[currentSerie.yField.toString()],
                countValue = data.value,
                xValue = data.xValue || data[that.xField] || data[currentSerie.rangeField] || data.x,
                yValue = data.yValue || data[currentSerie.yField.toString()] || data[currentSerie.measureField] || data.y;

            //set x value
            if (data.xValue != null)
                xValue = data.xValue;
            if (data[that.xField] != null)
                xValue = data[that.xField];
            if (data[currentSerie.rangeField] != null)
                xValue = data[currentSerie.rangeField];
            if (data.x != null)
                xValue = data.x;

            //set y value
            if (data.yValue != null)
                yValue = data.yValue;
            if (data[currentSerie.yField.toString()] != null)
                yValue = data[currentSerie.yField.toString()];
            if (data[currentSerie.measureField] != null)
                yValue = data[currentSerie.measureField];
            if (data.y != null)
                yValue = data.y;

            //check whether the chart type is bar
            if (that.type === "barChart") {
                //set x value
                if (data.xValue != null)
                    yValue = data.xValue;
                if (data[that.xField] != null)
                    yValue = data[that.xField];
                if (data[currentSerie.rangeField] != null)
                    yValue = data[currentSerie.rangeField];
                if (data.x != null)
                    yValue = data.x;

                //set y value
                if (data.yValue != null)
                    xValue = data.yValue;
                if (data[currentSerie.yField.toString()] != null)
                    xValue = data[currentSerie.yField.toString()];
                if (data[currentSerie.measureField] != null)
                    xValue = data[currentSerie.measureField];
                if (data.y != null)
                    xValue = data.y;
            }

            //check whether the data size is not null
            if (!data.size) {
                //check whether the data has children and name
                if (data.children && data.name && !data._measureValue) {
                    //set measure as sum of
                    measureValue = 0;
                    data.children.forEach(function (d) {
                        if (d.size)
                            measureValue = +d.size;
                    });
                }
            }

            //check whether the type is cooccurence
            if (that.type === "cooccurenceMatrix") {
                measureValue = data.measure;
            }

            //check if the vis is parallel lines
            if (that.type === 'parallelLines') {
                if (groupValue == null || groupValue === '')
                    serieName = '';
            }

            //check if there is a column name
            if (that.columnNames && that.columnNames != null) {
                //set serie name
                if (that.columnNames[serieName])
                    serieName = that.columnNames[serieName];

                //set group value
                if (that.columnNames[groupValue])
                    groupValue = that.columnNames[groupValue];

                //set relation value
                if (that.columnNames[relationValue])
                    relationValue = that.columnNames[relationValue];

                //set label value
                if (that.columnNames[labelValue])
                    labelValue = that.columnNames[labelValue];

                //set sourceValue
                if (that.columnNames[sourceValue])
                    sourceValue = that.columnNames[sourceValue];

                //set targetValue
                if (that.columnNames[targetValue])
                    targetValue = that.columnNames[targetValue];
            }

            //iterate tags
            tags.forEach(function (tag) {
                //split tag format
                let tagCleared = tag.replace('{', '').replace('}', ''),
                    tagFormatted = tagCleared.split(':'),
                    tagName = tagFormatted[0],
                    format = tagFormatted.length === 2 ? tagFormatted[1] : '',
                    formatted = '',
                    currentValue = '';

                //replace tag with the value
                switch (tagName) {
                    case 'value':
                        {
                            //set current value
                            currentValue = standardValue;
                        }
                        break;
                    case 'start':
                        {
                            //set current value
                            currentValue = startValue;
                        }
                        break;
                    case 'source':
                    case 'task':
                    case 'text':
                        {
                            //set current value
                            currentValue = sourceValue;
                        }
                        break;
                    case 'size':
                        {
                            //set current value
                            currentValue = sizeValue;
                        }
                        break;
                    case 'count':
                        {
                            currentValue = countValue;
                        }
                        break;
                    case 'row':
                        {
                            //set current value
                            currentValue = rowValue;
                        }
                        break;
                    case 'range':
                        {
                            //set current value
                            currentValue = rangeValue;
                        }
                        break;
                    case 'measure':
                        {
                            //set current value
                            currentValue = measureValue;
                        }
                        break;
                    case 'open':
                        {
                            //set current value
                            currentValue = openValue;
                        }
                        break;
                    case 'marker':
                        {
                            //set current value
                            currentValue = markerValue;
                        }
                        break;
                    case 'low':
                        {
                            //set current value
                            currentValue = lowValue;
                        }
                        break;
                    case 'order':
                        {
                            //set current value
                            currentValue = orderValue;
                        }
                        break;
                    case 'longitude':
                        {
                            //set current value
                            currentValue = longValue;
                        }
                        break;
                    case 'latitude':
                        {
                            //set current value
                            currentValue = latValue;
                        }
                        break;
                    case 'label':
                        {
                            //set current value
                            currentValue = labelValue;
                        }
                        break;
                    case 'high':
                        {
                            //set current value
                            currentValue = highValue;
                        }
                        break;
                    case 'serie':
                        {
                            //set current value
                            currentValue = serieName;
                        }
                        break;
                    case 'group':
                        {
                            //set current value
                            currentValue = groupValue || serieName;
                        }
                        break;
                    case 'relation':
                        {
                            //set relation value
                            currentValue = relationValue;
                        }
                        break;
                    case 'end':
                        {
                            //set current value
                            currentValue = endValue;
                        }
                        break;
                    case 'date':
                        {
                            //set current value
                            currentValue = new Date(dateValue);
                        }
                        break;
                    case 'color':
                        {
                            //set current value
                            currentValue = colorValue;
                        }
                        break;
                    case 'column':
                    case 'col':
                        {
                            //set current value
                            currentValue = columnValue;
                        }
                        break;
                    case 'alpha':
                        {
                            //set current value
                            currentValue = alphaValue;
                        }
                        break;
                    case 'target':
                        {
                            //set current value
                            currentValue = targetValue;
                        }
                        break;
                    case 'close':
                        {
                            //set current value
                            currentValue = closeValue;
                        }
                        break;
                    case 'x':
                    case 'title':
                        {
                            //set current value
                            currentValue = xValue;
                        }
                        break;
                    case 'y':
                        {
                            //replace content
                            currentValue = yValue;
                        }
                        break;
                    case 'percent':
                        {
                            currentValue = ((sizeValue * 100) / totalValue);
                        }
                        break;
                    case 'total':
                        {
                            //replace content
                            currentValue = totalValue;
                        }
                        break;
                    default:
                        {
                            //check if there is used fields
                            if (that.usedFields && findColumnNameViaFriendlyName) {
                                let colNameByFriendly = findColumnNameViaFriendlyName(tagName);
                                let currentFieldTagName = colNameByFriendly ? colNameByFriendly : tagName;
                                let isXValue = that.usedFields.xField === currentFieldTagName;
                                let isYValue = that.usedFields.yField === currentFieldTagName;
                                let isGroupValue = that.usedFields.groupField === currentFieldTagName;
                                let isSizeValue = that.usedFields.sizeField === currentFieldTagName;
                                let isMeasureValue = that.usedFields.measureField === currentFieldTagName;
                                let isLatValue = that.usedFields.latField === currentFieldTagName;
                                let isLngValue = that.usedFields.lngField === currentFieldTagName;
                                let isLabelValue = that.usedFields.labelField === currentFieldTagName;
                                let isTitleValue = that.usedFields.titleField === currentFieldTagName;
                                let isSourceValue = that.usedFields.sourceField === currentFieldTagName;
                                let isTargetValue = that.usedFields.targetField === currentFieldTagName;
                                let isMarkerValue = that.usedFields.markerField === currentFieldTagName;
                                let isDateValue = that.usedFields.dateField === currentFieldTagName;
                                let isStartValue = that.usedFields.startDateField === currentFieldTagName;
                                let isEndValue = that.usedFields.endDateField === currentFieldTagName;
                                let isTaskValue = that.usedFields.taskField === currentFieldTagName;
                                let isRelationValue = that.usedFields.relationField === currentFieldTagName;
                                let isRangeValue = that.usedFields.rangeField === currentFieldTagName;
                                let isValueField = that.usedFields.valueField === currentFieldTagName;
                                let isColorField = that.usedFields.colorField === currentFieldTagName;
                                let isOrderField = that.usedFields.orderField === currentFieldTagName;

                                if (data[currentFieldTagName] != null) {
                                    currentValue = data[currentFieldTagName];
                                } else {
                                    if (isXValue)
                                        currentValue = xValue;
                                    else if (isYValue)
                                        currentValue = yValue;
                                    else if (isGroupValue)
                                        currentValue = groupValue || serieName;
                                    else if (isSourceValue)
                                        currentValue = sourceValue;
                                    else if (isTargetValue)
                                        currentValue = targetValue;
                                    else if (isMeasureValue)
                                        currentValue = measureValue;
                                    else if (isMarkerValue)
                                        currentValue = markerValue;
                                    else if (isDateValue)
                                        currentValue = dateValue;
                                    else if (isStartValue)
                                        currentValue = startValue;
                                    else if (isEndValue)
                                        currentValue = endValue;
                                    else if (isTaskValue)
                                        currentValue = sourceValue;
                                    else if (isRelationValue)
                                        currentValue = relationValue;
                                    else if (isRangeValue)
                                        currentValue = rangeValue;
                                    else if (isLabelValue)
                                        currentValue = labelValue;
                                    else if (isValueField)
                                        currentValue = standardValue;
                                    else if (isLatValue)
                                        currentValue = latValue;
                                    else if (isLngValue)
                                        currentValue = longValue;
                                    else if (isColorField)
                                        currentValue = colorValue;
                                    else if (isOrderField)
                                        currentValue = orderValue;
                                }
                            } else {
                                //set column names state
                                let colNamesState = that.columnNames ? (Object.keys(that.columnNames).length > 0) : false

                                //fill column names
                                if (colNamesState) {
                                    let colNameByFriendly = findColumnNameViaFriendlyName(tagName);
                                    let currentFieldTagName = colNameByFriendly ? colNameByFriendly : tagName;

                                    //need to check if there is a data on tag name
                                    if (data[currentFieldTagName])
                                        currentValue = data[currentFieldTagName];
                                } else {
                                    //need to check if there is a data on tag name
                                    if (data[tagName]) {
                                        currentValue = data[tagName];
                                    }
                                }
                            }
                        }
                        break;
                }

                //check if tag name measures
                if (tagName === 'measures') {
                    //get splitted measure fields
                    let measureFields = currentSerie.measureField.split(','),
                        formattedValueStack = [];

                    //create value stack
                    measureFields.forEach(function (m) {
                        //get friendly name
                        let fName = m.trim();
                        if (that.columnNames && that.columnNames != null) {
                            //set label value
                            if (that.columnNames[m])
                                fName = that.columnNames[m];
                        }

                        //set stack
                        formattedValueStack.push(fName + ': ' + e.formatNumber(+data[m], format));
                    });

                    //replace content
                    content = content.replaceAll(tag, formattedValueStack.join(', '));
                } else {
                    //check tag name
                    if (currentValue) {

                        //check whether the current value is not null
                        if (currentValue.toString().indexOf('.000Z') > -1)
                            currentValue = new Date(currentValue);

                        //get type
                        let valType = e.getType(currentValue);
                        let valIsNan = isNaN(currentValue);

                        //if its string then it also might be a date value
                        if (valIsNan) {
                            var availableDateTags = ["date", "start", "starts", "end", "ends"];
                            if (availableDateTags.indexOf(tagName) > -1) {
                                let dateParser = new Date(currentValue);
                                let jsonVal = JSON.stringify(dateParser);
                                if (jsonVal != "null")
                                    valType = "date";
                            }
                        }
                        
                        //format given value
                        if (valType === 'number') {
                            formatted = e.formatNumber(currentValue, format);
                        } else if (valType === 'date') {
                            formatted = e.formatDate(new Date(currentValue), format);
                        } else {
                            formatted = isNaN(+currentValue) ? currentValue : e.formatNumber(+currentValue, format);
                        }

                        //replace content
                        content = content.replaceAll(tag, formatted);
                    } else {
                        content = content.replaceAll(tag, currentValue === 0 ? "0" : "");
                    }

                    //check if tagname is percent
                    if (tagName === 'percent')
                        content = content + '%';
                }
            });

            //iterate field tags
            fieldTags.forEach(function (tag) {
                //split tag format
                let tagCleared = tag.replaceAll("[", "").replaceAll("]", ""),
                    tagFormatted = tagCleared.split(':'),
                    tagName = findColumnNameViaFriendlyName(tagFormatted[0]),
                    format = tagFormatted.length === 2 ? tagFormatted[1] : '',
                    formatted = '',
                    currentValue = data[tagName];

                //check tag name
                if (currentValue) {
                    //check whether the current value is not null
                    if (currentValue.toString().indexOf('.000Z') > -1)
                        currentValue = new Date(currentValue);

                    //format given value
                    if (e.getType(currentValue) === 'number')
                        formatted = e.formatNumber(currentValue, format);
                    else if (e.getType(currentValue) === 'date')
                        formatted = e.formatDate(new Date(currentValue), format);
                    else
                        formatted = isNaN(+currentValue) ? currentValue : e.formatNumber(+currentValue, format);

                    //replace content
                    content = content.replaceAll(tag, formatted);
                } else {
                    content = content.replaceAll(tag, '');
                }
            });

            return content;
        };

        //extracts master type from the diagram
        let extractMasterType = function () {
            let serieType = that.series[0].type;
            let masterType = "";
            switch (serieType) {
                case "gantt":
                case "seatMap":
                case "timeline":
                case "pie":
                case "pyramid":
                case "donut":
                case "funnel":
                    masterType = "grouped";
                    break;
                case "circlePacking":
                case "dendrogram":
                case "treemap":
                case "force":
                    masterType = "tree";
                    break;
                case "networkMatrix":
                    masterType = "xy";
                    break;
                case "bullet":
                    masterType = "sliced";
                    break;
                case "calendarmap":
                case "wordCloud":
                    masterType = "standard";
                    break;
                case "slopeGraph":
                    masterType = "sourced";
                    break;
            }
            return masterType;
        };

        //extracts serie names from dataset
        that.extractSerieNamesFromData = function () {
            //declare needed variables
            let serieNames = [];
            let newSeries = [];

            //set current serie
            let currentSerie = that.series[0];

            //act by chart type
            if (that.type === "multiples") {
                //get serie type of the multiples
                let masterType = extractMasterType();
                let serieType = that.series[0].type;

                //set legend series from the master type
                switch (masterType) {
                    case "grouped":
                        {
                            //iterate all datarows
                            that.data.forEach(function (d) {
                                //need to be sure if there is values member
                                if (d.values) {
                                    //declare the new set
                                    let newSet = [];
                                    let newGroupValues = [];
                                    let groupFieldName = currentSerie.groupField;

                                    //might be an old vis so there is a chance data values have dataArray field
                                    if (d.values.dataArray && d.values.dataArray.length) {
                                        newSet = d.values.dataArray;
                                    } else if (d.values.length) {
                                        newSet = d.values;
                                    }

                                    //extract group field by type
                                    switch (serieType) {
                                        case "pie":
                                        case "donut":
                                        case "pyramid":
                                        case "funnel":
                                            groupFieldName = currentSerie.xField;
                                            break;
                                    }

                                    //extract uniques
                                    newGroupValues = e.getUniqueValues(newSet, groupFieldName);

                                    //iterate all new group values
                                    newGroupValues.forEach(function (key) {
                                        if (serieNames.indexOf(key) === -1) {
                                            //clone the serie
                                            let clonedSerie = e.clone(currentSerie);
                                            clonedSerie.title = key;

                                            let filteredList = e.filterSensitive(that.legend.legendColors, 'value', key);

                                            if (filteredList.length && filteredList.length > 0)
                                                clonedSerie.color = filteredList[0].color;

                                            serieNames.push(key);
                                            newSeries.push({
                                                serieName: key,
                                                serie: clonedSerie
                                            });
                                        }
                                    });
                                }
                            });
                        }
                        break;
                    default:
                        {
                            //iterate all datarows
                            that.data.forEach(function (d) {
                                //need to be sure if there is values member
                                if (d.values) {
                                    //declare the new set
                                    let newSet = [];
                                    let reservedKeys = [currentSerie.xField, "_serieIndex"];

                                    //push x field
                                    if (that.xField)
                                        reservedKeys.push(that.xField);

                                    //push x field
                                    if (currentSerie.groupField)
                                        reservedKeys.push(currentSerie.groupField);

                                    //might be an old vis so there is a chance data values have dataArray field
                                    if (d.values.dataArray && d.values.dataArray.length) {
                                        newSet = d.values.dataArray;
                                    } else if (d.values.length) {
                                        newSet = d.values;
                                    }

                                    //iterate all new set to get keywords
                                    newSet.forEach(function (ns) {
                                        Object.keys(ns).forEach(function (key) {
                                            if (reservedKeys.indexOf(key) === -1) {
                                                if (serieNames.indexOf(key) === -1) {
                                                    //get serie object
                                                    let serieObject = that.series[that.getSerieIndexByName(key)];
                                                    if (serieObject) {
                                                        serieNames.push(key);
                                                        newSeries.push({
                                                            serieName: key,
                                                            serie: serieObject
                                                        });
                                                    }
                                                }
                                            }
                                        });
                                    });
                                }
                            });
                        }
                        break;
                }

            } else {
                //get serie names from the dataset
                let dataSeries = that.series;
                
                //iterate all datasets
                for (let i = 0; i < that.data.length; i++) {
                    let currentData = that.data[i];
                    for (let key in currentData) {
                        if (key !== that.xField && key !== currentSerie.sizeField && key !== currentSerie.groupField && key !== currentSerie.xField && key !== "_serieIndex") {
                            if (serieNames.indexOf(key) === -1) {
                                serieNames.push(key);
                                newSeries.push({
                                    serieName: key,
                                    serie: that.series[that.getSerieIndexByName(key)]
                                });
                            }
                        }
                    }
                }

                //check series
                if (that.isPSW) {
                    //set series
                    newSeries = [];
                    dataSeries.forEach(function (s) {
                        newSeries.push({
                            serieName: s.yField,
                            serie: s
                        });
                    });
                } else {
                    //check initial series and current series
                    if (that.series.length < newSeries.length) {
                        //iterate all new series
                        newSeries.forEach(function (s, i) {
                            if (s.serie == null) {
                                s.serie = e.clone(currentSerie);
                                s.serie.yField = s.serieName;
                                s.serie.color = i < e.colors.length ? e.colors[i] : e.randColor();
                            }
                        });
                    }
                }
            }

            return newSeries;
        };

        //gets color from the legend
        that.getColorFromLegend = function (val) {
            let color = 'none';
            that.legend.legendColors.forEach(function (lv) {
                if (lv.text.toString() === val.toString() || lv.value.toString() === val.toString()) {
                    color = lv.color;
                }
            });
            return color;
        };

        //gets color from the legend
        that.getColorFromLegendByIndex = function (index) {
            if (that.legend.legendColors[index])
                return that.legend.legendColors[index].color;

            return e.randColor();
        };

        //calculate vis domain
        that.calculateDomain();

        //update title
        that.updateTitle();

        //set tooltip and legend
        tooltip = eve.createTooltip(that);
        legend = eve.createLegend(that);
    }

    //attach initialization method into the eve charts
    e.initVis = function (options) {
        return new visBase(options);
    };
})(eve);