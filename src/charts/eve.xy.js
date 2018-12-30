/*!
 * eve.xy.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Base class for xy charts.
 */
(function (e) {
    //define xy chart class
    function xyChart(options) {
        //set internal members for xy specific charts
        options.__baseChartType = "xy";

        //declare needed variables
        let that = this;
        let chart = e.initVis(options);
        let axis = null;
        let data = [];
        let layouts = null;         
        let shapes = null;
        let shapeFunc = null;
        let labels = null;
        let currentSerie = chart.series[0];
        let dataLimit = 1000;
        let defOpacity = 0.85;
        let dataColumns = [];
        let groupAxis = null;
        let minFontSize = 8;
        let shapeWidth = 0;
        let singleColumnWidth = 0;
        let singleColumnHeight = 0;
        let chartG = null;
        let currentChartType = chart.type;
        let currentFontSize = currentSerie.labelFontSize === "auto" ? 11 : currentSerie.labelFontSize;
        let diffMinBase = 0;
        let isReversed = (options.type === 'barChart' || options.type === 'abacus');
        let tmpFontSize = null;
        
        //switch chart type to set axis
        switch (chart.type) {
            case "radarChart":
                {
                    //set radar axis
                    axis = e.initRadarAxis(chart);
                }
                break;
            case "combinationChart":
                {
                    //set combination axis
                    axis = e.initCombinationAxis(chart);
                }
                break;
            default:
                {
                    //set classical axis
                    axis = e.initClassicalAxis(chart)
                }
                break;
        }

        //gets column names
        let getChartSerieNames = function () {
            let serieNames = [];
            if (chart.series.length) {
                chart.series.forEach(function (s) {
                    if (serieNames.indexOf(s.yField) === -1)
                        serieNames.push(s.yField);
                });
            } else {
                serieNames = chart.serieNames;
            }
            return serieNames;
        };

        //extract the columns
        let columns = getChartSerieNames();

        //gets serie by name
        let getSerieByName = function (serieName) {
            //iterate all series
            for (let i = 0; i < chart.series.length; i++) {
                if (chart.series[i].yField === serieName)
                    return e.clone(chart.series[i]);
            }
            return null;
        };

        //gets serie by name
        let getSerieIndexByName = function (serieName) {
            //iterate all series
            let serieIndex = 0;
            for (let i = 0; i < chart.series.length; i++) {
                if (chart.series[i].yField === serieName)
                    serieIndex = i;
            }
            return serieIndex;
        };

        //checks whether the chart has an order
        let isSlicedXY = function () {
            let isIt = false;
            if (chart.type === "barChart" || chart.type === "columnChart") {
                isIt = true;
            }
            return isIt;
        }
        
        //sets chart data
        let setChartData = function () {
            //filter the data for min x axis
            if (chart.xAxis.min !== null) {
                chart.data = chart.data.filter(function (d) {
                    return d[chart.xField] >= chart.xAxis.min;
                });
            }

            //filter the data for max x axis
            if (chart.xAxis.max !== null) {
                chart.data = chart.data.filter(function (d) {
                    return d[chart.xField] <= chart.xAxis.max;
                });
            }

            //checks whether the chart is full stacked
            let checkFullStacked = function () {
                //check whether the stack type is full
                if (chart.yAxis.stackType === 'full') {
                    //iterate all data to update columns
                    for (let i = 0; i < chart.data.length; i++) {
                        let rowTotal = 0;
                        let currentVal = 0;
                        let currentPercent = 0;

                        //iterate columns to set row totals
                        columns.forEach(function (col) {
                            //get current value
                            currentVal = chart.data[i][col] ? +chart.data[i][col] : 0;

                            //increase row total
                            rowTotal += isNaN(currentVal) ? 0 : currentVal;
                        });

                        //iterate columns to set row totals
                        columns.forEach(function (col) {
                            //calculate values
                            currentVal = chart.data[i][col] ? +chart.data[i][col] : 0;
                            currentPercentValue = currentVal * 100 / rowTotal;

                            //update row data
                            chart.data[i][col] = currentPercentValue;
                        });
                    }
                }
            }

            //check chart type
            switch (chart.type) {
                case "abacus":
                    {
                        //create new diagram data
                        data = [];

                        //get data series
                        let dataSeries = chart.extractSerieNamesFromData();

                        //iterate all diagram series
                        dataSeries.forEach(function (ds, serieIndex) {
                            //set serie name
                            let serieName = ds.serieName;

                            //declare serie data
                            let serieData = [];

                            //iterate diagram data to set values
                            chart.data.forEach(function (d, i) {
                                //iterate keys
                                for (var key in d) {
                                    //update diagram data
                                    d._serieIndex = serieIndex;

                                    //check whether the key is serie
                                    if (key === serieName)
                                        serieData.push(e.clone(d));
                                }
                            });

                            //set serie data index
                            serieData.index = serieIndex;
                            serieData.name = serieName;

                            //push the current serie data into the current dataset
                            data.push(serieData);
                        });
                    }
                    break;
                case "streamGraph":
                    {
                        //create the stack function
                        let stack = d3.stack().order(d3.stackOrderNone).offset(d3.stackOffsetWiggle);

                        //set chart data
                        data = stack.keys(columns)(chart.data);

                        //set series for the stacked data
                        for (let i = 0; i < data.length; i++) {
                            for (let k = 0; k < data[i].length; k++) {
                                data[i][k].serie = getSerieByName(data[i].key);
                                data[i][k].serieIndex = getSerieIndexByName(data[i].key);
                            }
                        }
                    }
                    break;
                default:
                    {
                        //check whether the y axis is stacked
                        if (chart.yAxis.stacked) {
                            //if chart is full stacked
                            checkFullStacked();
                            
                            //create the stack function
                            let stack = d3.stack();

                            //when streamgraph is selected need to update offsets
                            switch (chart.type) {
                                case "streamGraph":
                                    {
                                        //update stack order and offset
                                        stack.offset(d3.stackOffsetWiggle).order(d3.stackOrderInsideOut);
                                    }
                                    break;
                                case "barChart":
                                case "columnChart":
                                case "areaChart":
                                    {
                                        //update stack offset as divering
                                        stack.offset(d3.stackOffsetDiverging);
                                    }
                                    break;
                            }

                            //chart should not be a bar or column
                            if (!isSlicedXY()) {
                                //re-order the chart data
                                chart.data.sort(function (a, b) {
                                    if (chart.xDataTypeOriginal === "date") {
                                        return new Date(a[chart.xField]) - new Date(b[chart.xField]);
                                    } else if (chart.xDataTypeOriginal === "string") {
                                        if (a[chart.xField] < b[chart.xField]) { return -1; } if (a[chart.xField] > b[chart.xField]) { return 1; } return 0;
                                    } else {
                                        return a[chart.xField] - b[chart.xField];
                                    }
                                });
                            }

                            //set chart data
                            data = stack.keys(columns)(chart.data);

                            //set series for the stacked data
                            for (let i = 0; i < data.length; i++) {
                                for (let k = 0; k < data[i].length; k++) {
                                    data[i][k].serie = getSerieByName(data[i].key);
                                    data[i][k].serieIndex = getSerieIndexByName(data[i].key);
                                }
                            }
                        } else {
                            //set chart data
                            data = columns.map(function (currentColumn, i) {
                                //get current serie
                                let serie = getSerieByName(currentColumn);

                                //if serie is not null
                                if (serie) {
                                    //set chart dataset
                                    let chartDataSet = chart.data.map(function (d) {
                                        let dataObj = {
                                            x: d[chart.xField],
                                            y: d[currentColumn],
                                            size: d[serie.sizeField],
                                            serieIndex: getSerieIndexByName(currentColumn)
                                        };

                                        if (typeof dataObj.y === "string") {
                                            //parse the val
                                            let parsedY = parseFloat(dataObj.y);
                                            if (isNaN(parsedY))
                                                dataObj.y = null;
                                            else
                                                dataObj.y = parsedY;
                                        }

                                        //check if chart is psw
                                        if (chart.isPSW) {
                                            dataObj[chart.xField] = dataObj.x;
                                            dataObj[currentColumn] = dataObj.y;

                                            if (serie.sizeField)
                                                dataObj[serie.sizeField] = dataObj.size;
                                        }

                                        //check negative
                                        if (chart.domains.isNegative && chart.yAxis.startsFromZero) {
                                            if (dataObj.y < 0)
                                                dataObj.y = 0;
                                        }

                                        return dataObj;
                                    });

                                    //sort data
                                    if (!isSlicedXY()) {
                                        chartDataSet.sort(function (a, b) {
                                            if (chart.xDataTypeOriginal === "date") {
                                                return new Date(a.x) - new Date(b.x);
                                            } else if (chart.xDataTypeOriginal === "string") {
                                                if (a.x < b.x) { return -1; } if (a.x > b.x) { return 1; } return 0;
                                            } else {
                                                return a.x - b.x;
                                            }
                                        });
                                    }

                                    //send the actual data object
                                    return {
                                        columnName: currentColumn,
                                        serie: serie,
                                        values: chartDataSet
                                    };
                                }
                            })
                        }
                    }
                    break;
            }
        };

        //sets data columns
        let setDataColumns = function(datarow) {
            //get all keys in current data
            dataColumns = [];
            d3.keys(datarow).map(function (a) {
                //check whether the key is not source field
                if (a !== chart.xField && a !== '_serieIndex' && a !== '_serieColor' && a !== 'total' && a !== '_total') {
                    //get current value
                    let currVal = datarow[a];

                    //check whether the value is not null
                    if (currVal) {
                        dataColumns.push({
                            name: a,
                            value: currVal,
                            serieColor: chart.getColorFromLegend(a)
                        });
                    }
                }
            });

            //check whether the data columns is not empty
            if (dataColumns && dataColumns.length > 0) {
                //sort data columns
                dataColumns.sort(function (a, b) { return a.value - b.value; });
            }
        }

        //gets line stroke for the path
        let getColor = function (d) {
            //get color
            let color = e.randColor();
            
            //check columns to set fill color
            if (d.serie != null) {
                color = d.serie.color;
            }
            else if (d[0] && d[0].serie) {
                color = d[0].serie.color;
            }
            else if (d.serieName != null) {
                color = chart.series[chart.getSerieIndexByName(d.serieName)].color;
            }
            else if (d.serieIndex != null) {
                color = chart.series[d.serieIndex].color;
            }
            else {
                color = chart.series[d.index].color;
            }

            return color;
        };

        //gets class for the shape
        let getClass = function (d, i) {
            //set serie index
            let serieIndex = d.serieIndex != null ? d.serieIndex : i;
            let yFieldName = "";

            //check whether the serie and col name has set to update serie index
            if (d.serie && d.columnName) {
                serieIndex = chart.getSerieIndexByName(d.columnName);
            }

            //set class name
            let className = "eve-vis-series";

            //check whether the current data has serie index member
            if (serieIndex != null) {
                className += " eve-vis-series-" + serieIndex;
            }

            //set named serie class
            if (d.serie && d.serie.yField) {
                yFieldName = d.serie.yField.toString();

                if (chart.columnNames[yFieldName]) {
                    yFieldName = chart.columnNames[yFieldName].toString();
                }

                className += " serie-" + yFieldName.toClassSelector();
            } else if (d.key) {
                yFieldName = d.key.toString();
                if (chart.columnNames[yFieldName]) {
                    yFieldName = chart.columnNames[yFieldName].toString();
                }

                className += " serie-" + yFieldName.toClassSelector();
            }

            return className;
        };

        //extracts class name
        let getClassName = function (d, serie) {
            //set class name
            let className = "eve-vis-series";
            let yFieldName = "";

            //check whether the current data has serie index member
            if (d.serieIndex != null) {
                className += " eve-vis-series-" + d.serieIndex;
            }

            //set named serie class
            if (d.serie && d.serie.yField) {
                yFieldName = d.serie.yField.toString();
                if (chart.columnNames[yFieldName]) {
                    yFieldName = chart.columnNames[yFieldName].toString();
                }
                className += " serie-" + yFieldName.toClassSelector();
            } else if (serie && serie.yField) {
                yFieldName = serie.yField.toString();
                if (chart.columnNames[yFieldName]) {
                    yFieldName = chart.columnNames[yFieldName].toString();
                }
                className += " serie-" + yFieldName.toClassSelector();
            } else if (d.serieName) {
                yFieldName = d.serieName.toString();
                if (chart.columnNames[yFieldName]) {
                    yFieldName = chart.columnNames[yFieldName].toString();
                }
                className += " serie-" + yFieldName.toClassSelector();
            }

            return className;
        };

        //handles mouse move event
        let handleMouseMove = function (d, i) {
            //check data
            if (d) {
                //check data status
                let hasData = false;

                //set has data flag
                if (d.y != null) hasData = true;
                if (d.data && d.serie && d.data[d.serie.yField] != null) hasData = true;
                let cmbSerie = null;

                //should have data on y
                if (hasData) {
                    //handle chart type based events
                    switch (chart.type) {
                        case 'areaChart':
                        case 'lineChart':
                            {
                                //set slice hover
                                d3.select(this).attr('fill-opacity', 1);
                            }
                            break;
                        case "combinationChart":
                            {
                                //check seriekey to find serie
                                if (d.serieKey) {
                                    cmbSerie = chart.series.filter(function (cs) { return cs.yField.toValueKey() === d.serieKey; });
                                    if (cmbSerie.length > 0) {
                                        if (cmbSerie[0].type === "line" || cmbSerie[0].type === "area") {
                                            //set slice hover
                                            d3.select(this).attr('fill-opacity', 1);
                                        }
                                    }
                                }
                            }
                            break;
                    }

                    //set serie
                    let dataSerie = null;

                    if (cmbSerie && cmbSerie.length) {
                        dataSerie = cmbSerie[0];
                    } else {
                        //set dataserie from directly data
                        if (d.serie != null)
                            dataSerie = d.serie;

                        //check whether the data has serieIndex
                        if (d.serieIndex != null)
                            dataSerie = chart.series[d.serieIndex];
                    }

                    //check whether the dataserie is still null
                    if (!dataSerie)
                        dataSerie = currentSerie;

                    //show tooltip
                    chart.showTooltip(chart.getContent(d, dataSerie, chart.tooltip.format));
                }
            }
        };

        //handles mouse out event
        let handleMouseOut = function (d, i) {
            //check data
            if (d) {
                //check data status
                let hasData = false;

                //set has data flag
                if (d.y != null) hasData = true;
                if (d.data && d.serie && d.data[d.serie.yField] != null) hasData = true;

                //should have data on y
                if (hasData) {
                    //handle chart type based events
                    switch (chart.type) {
                        case 'areaChart':
                        case 'lineChart':
                            {
                                //set slice hover
                                if (!currentSerie.showBullets) {
                                    d3.select(this).attr('fill-opacity', 0);
                                }
                            }
                            break;
                        case "combinationChart":
                            {
                                //check seriekey to find serie
                                if (d.serieKey) {
                                    let cmbSerie = chart.series.filter(function (cs) { return cs.yField.toValueKey() === d.serieKey; });
                                    if (cmbSerie.length > 0) {
                                        if (cmbSerie[0].type === "line" || cmbSerie[0].type === "area") {
                                            //set slice hover
                                            d3.select(this).attr('fill-opacity', 0);
                                        }
                                    }
                                }
                            }
                            break;
                    }

                    //hide tooltips
                    chart.hideTooltip();
                }
            }
        };

        //handles click event
        let handleClick = function (d, i) {
            //set serie index
            let serieIndex = d.serieIndex != null ? d.serieIndex : i;
            let serieName = d.columnName || d.serieKey;

            //check col names
            if (chart.columnNames[serieName])
                serieName = chart.columnNames[serieName];

            //set class selector
            let classSelector = serieName ? serieName.toString().toClassSelector() : "";

            //check whether the serie and col name has set to update serie index
            if (d.serie && d.columnName) {
                serieIndex = chart.getSerieIndexByName(d.columnName);
            } else if (d.serieKey) {
                serieIndex = chart.getSerieIndexByName(d.serieKey);
            }

                //set whether the sliced clicked
            if (!d.clicked) {
                //set clicked state
                d.clicked = true;

                //update line opacity
                chart.svg.selectAll('.eve-vis-series').style('opacity', 0.1);
                chart.svg.selectAll('.serie-' + classSelector).style('opacity', 1);
            } else {
                //clear clicked state
                d.clicked = null;

                //update line opacity
                chart.svg.selectAll('.eve-vis-series').style('opacity', defOpacity);
            }
        };

        //gets bullet size
        let getBulletSize = function (d) {
            //cehck whether the size has set
            if (currentSerie.sizeField !== '') {
                //set ranges
                let dataSizeRange = chart.domains.maxSize - chart.domains.minSize;
                let bulletSizeRange = currentSerie.maxBulletSize - currentSerie.minBulletSize;
                let bulletSize = currentSerie.bulletSize;

                //check if data size is not zero
                if (dataSizeRange)
                    bulletSize = (d.size / dataSizeRange * bulletSizeRange) - (chart.domains.minSize / dataSizeRange * bulletSizeRange) + currentSerie.minBulletSize;

                return bulletSize;
            } else {
                //return default bulet size
                return currentSerie.bulletSize;
            }
        };

        //gets label transform
        let getLabelTransform = function (d, isInit, dataIndex) {
            //declare position variables
            let xPos = 0;
            let yPos = 0;

            //declare y and x values
            let xVal = d.data ? d.data[chart.xField] : d.x;
            let yVal = d.data ? d[1] : d.y;
            let bulletSize = getBulletSize(d);
            let unavailableChartTypes = ["radarChart", "barChart"]
            let bandwidth = 0;

            try {
                if (axis.xScale.bandwidth)
                    bandwidth = axis.xScale.bandwidth();
                else if (axis.yScale.bandwidth)
                    bandwidth = axis.yScale.bandwidth();
            } catch (eX) { }
            
            //chart type should not be radar
            if (unavailableChartTypes.indexOf(chart.type) === -1) {
                //switch x data type to set x pos
                switch (chart.xDataType) {
                    case 'string':
                        {
                            if (chart.type === "columnChart") {
                                xPos = axis.xScale(xVal) + axis.xScale.bandwidth() / 2;
                            } else {
                                xPos = axis.xScale(xVal) + bandwidth;
                            }
                        }
                        break;
                    case 'date':
                        xPos = axis.xScale(new Date(xVal));
                        break;
                    default:
                        xPos = axis.xScale(xVal);
                        break;
                }

                //set y position
                if (d.serieKey)
                    yPos = isInit ? (chart.domains.minY < 0 ? axis.serieScales[d.serieKey](0) : chart.plot.height) : axis.serieScales[d.serieKey](yVal);
                else
                    yPos = isInit ? (chart.domains.minY < 0 ? axis.yScale(0) : chart.plot.height) : axis.yScale(yVal);
            }

            //check the inital animation
            if (isInit) {
                //set y position
                if (d.serieKey) {
                    yPos = (axis.serieDomains[d.serieKey].min < 0 ? axis.serieScales[d.serieKey](0) : chart.plot.height);
                } else {
                    yPos = (chart.domains.minY < 0 ? axis.yScale(0) : chart.plot.height);
                }

                //check chart type to caclulate positions
                switch (currentChartType) {
                    case "combinationChart":
                    case "columnChart":
                        {
                            //need to check if there is a group axis
                            if (groupAxis) {
                                //set x and y position by column position
                                xPos = groupAxis(d.serieName) + groupAxis.bandwidth() / 2;
                            } else {
                                //switch x data type to set x pos
                                switch (chart.xDataType) {
                                    case 'string':
                                        xPos = axis.xScale(xVal) + bandwidth;
                                        break;
                                    case 'date':
                                        xPos = axis.xScale(new Date(xVal));
                                        break;
                                    default:
                                        xPos = axis.xScale(xVal);
                                        break;
                                }
                            }
                        }
                        break;
                    case "barChart":
                        {
                            //check whether the group axis is not null
                            if (groupAxis) {
                                //set x and y position for init
                                xPos = chart.domains.minY < 0 ? axis.xScale(0) : 0;
                                yPos = groupAxis(d.serieName) + groupAxis.bandwidth() / 2 + 4;
                            } else {
                                //get x val
                                let xVal = d.data[chart.xField];

                                //switch x data type to set x pos
                                switch (chart.xDataType) {
                                    case 'string':
                                        yPos = axis.yScale(xVal) + d.bbox.height / 2;
                                        break;
                                    case 'date':
                                        yPos = axis.yScale(new Date(xVal)) + d.bbox.height / 2;
                                        break;
                                    default:
                                        yPos = axis.yScale(xVal) + d.bbox.height / 2;
                                        break;
                                }

                                //set x position
                                if (chart.domains.minY < 0) {
                                    xPos = axis.xScale(0);
                                } else {
                                    //set x position
                                    xPos = axis.xScale(chart.domains.minY);
                                }
                            }
                        }
                        break;
                    case "abacus":
                        {
                            //get x val
                            let xVal = d[chart.xField];

                            //switch x data type to set x pos
                            switch (chart.xDataType) {
                                case 'string':
                                    yPos = axis.yScale(xVal) + bandwidth - (currentSerie.bulletSize * 2);
                                    break;
                                case 'date':
                                    yPos = axis.yScale(new Date(xVal)) - (currentSerie.bulletSize * 2);
                                    break;
                                default:
                                    yPos = axis.yScale(xVal) - (currentSerie.bulletSize * 2);
                                    break;
                            }

                            //set x position
                            xPos = axis.xScale(chart.domains.minY);
                        }
                        break;
                    case "radarChart":
                        {
                            //set x and y pos initial
                            xPos = axis.yScale(0) * Math.cos(axis.sliceAngle * dataIndex - Math.PI / 2);
                            yPos = axis.yScale(0) * Math.sin(axis.sliceAngle * dataIndex - Math.PI / 2);
                        }
                        break;
                }
            } else {
                //set yscaler
                let yScaler = d.serieKey ? axis.serieScales[d.serieKey] : axis.yScale;

                //set y position
                yPos = yScaler(yVal);
                
                if (currentChartType !== "barChart") {
                    if (chart.yAxis.min !== null && yVal < chart.yAxis.min)
                        yPos = yScaler(chart.yAxis.min);

                    if (chart.yAxis.max !== null && yVal > chart.yAxis.max)
                        yPos = yScaler(chart.yAxis.max);
                }

                //check chart type to caclulate positions
                switch (currentChartType) {
                    case "combinationChart":
                    case "columnChart":
                        {
                            //check whether the group axis is not null
                            if (groupAxis) {
                                //set x and y position by column position
                                xPos = groupAxis(d.serieName) + groupAxis.bandwidth() / 2;
                                
                                //check if serie key is available
                                if (d.serieKey) {
                                    //check whether the domains is minus
                                    if (axis.serieDomains[d.serieKey].min < 0) {
                                        //re-calculate
                                        if (yVal > 0)
                                            yPos += d.fontSize ? (d.fontSize + 5) : 5;
                                        else
                                            yPos = axis.serieScales[d.serieKey](yVal) - 5;
                                    } else {
                                        //if it is not negative just add fontsize
                                        yPos += d.fontSize ? (d.fontSize + 5) : 5;
                                    }
                                } else {
                                    //check whether the domains is minus
                                    if (chart.domains.minY < 0) {
                                        //re-calculate
                                        if (yVal > 0)
                                            yPos += d.fontSize ? (d.fontSize + 5) : 5;
                                        else
                                            yPos = axis.yScale(yVal) - 5;
                                    } else {
                                        //if it is not negative just add fontsize
                                        yPos += d.fontSize ? (d.fontSize + 5) : 5;
                                    }
                                }
                            } else {
                                //calculate y position
                                yPos = d.serieKey ? (axis.serieScales[d.serieKey](d[1]) + d.fontSize + 5) : (axis.yScale(d[1]) + d.fontSize);
                            }
                        }
                        break;
                    case "barChart":
                        {
                            //check whether the group axis is not null
                            if (groupAxis) {
                                //set y position
                                yPos = groupAxis(d.serieName) + groupAxis.bandwidth() / 2 + 4;

                                //if domain is less than zero need a different calculation
                                if (chart.domains.minY < 0) {
                                    if (d.y < 0) {
                                        //calculate the width
                                        xPos = axis.xScale(0) - d.columnWidth + d.bbox.width / 2 + 5;
                                    } else {
                                        xPos = axis.xScale(d.y) - d.bbox.width / 2 - 5;
                                    }
                                } else {
                                    xPos = axis.xScale(d.y) - d.bbox.width / 2 - 5;
                                }
                            } else {
                                //get x val
                                let xVal = d.data[chart.xField];

                                //switch x data type to set x pos
                                switch (chart.xDataType) {
                                    case 'string':
                                        yPos = axis.yScale(xVal);// + d.bbox.height / 2;
                                        break;
                                    case 'date':
                                        yPos = axis.yScale(new Date(xVal));// + d.bbox.height / 2;
                                        break;
                                    default:
                                        yPos = axis.yScale(xVal);// + d.bbox.height / 2;
                                        break;
                                }

                                //set ypos
                                yPos += (singleColumnHeight + d.bbox.height) / 2;

                                //check negative domain
                                if (chart.domains.minY < 0) {
                                    if (d.data[d.serie.yField] > 0)
                                        xPos = axis.xScale(d[1]) - 5;
                                    else
                                        xPos = axis.xScale(0) - Math.abs(axis.xScale(d[0]) - axis.xScale(d[1])) + (d.bbox.width * 2) + 5;
                                } else {
                                    //set x position
                                    xPos = axis.xScale(d[1]) - 5;
                                }
                            }
                        }
                        break;
                    case "abacus":
                        {
                            //get x val
                            let xVal = d[chart.xField];
                            
                            //switch x data type to set x pos
                            switch (chart.xDataType) {
                                case 'string':
                                    yPos = axis.yScale(xVal) + (bandwidth / 2) - (currentSerie.bulletSize * 2);
                                    break;
                                case 'date':
                                    yPos = axis.yScale(new Date(xVal)) - (currentSerie.bulletSize * 2);
                                    break;
                                default:
                                    yPos = axis.yScale(xVal) - (currentSerie.bulletSize * 2);
                                    break;
                            }

                            xPos = axis.xScale(d[chart.series[d._serieIndex].yField]);
                        }
                        break;
                    case "radarChart":
                        {
                            //set x and y pos initial
                            xPos = axis.yScale(d.y) * Math.cos(axis.sliceAngle * dataIndex - Math.PI / 2);
                            yPos = axis.yScale(d.y) * Math.sin(axis.sliceAngle * dataIndex - Math.PI / 2);

                            //consider bullets
                            if (yPos < 0)
                                yPos -= currentSerie.bulletSize / 2 + currentFontSize / 2;
                            else
                                yPos += currentSerie.bulletSize + currentFontSize / 2;
                        }
                        break;
                    default:
                        {
                            //move up the ypos by bullet
                            yPos -= (bulletSize + (currentSerie.sizeField ? 5 : 0));
                        }
                        break;
                }
            }

            //remove nan values
            if (isNaN(xPos)) xPos = 0;
            if (isNaN(yPos)) yPos = 0;

            //return translation
            return 'translate(' + xPos + ',' + yPos + ')';
        };

        //gets bullet transform
        let getBulletTransform = function (d, isInit) {
            //declare x and y positions
            let xPos = 0,
                yPos = 0,
                currentSerie = null;

            if (chart.type === "abacus") {
                //get data series
                let dataSeries = chart.extractSerieNamesFromData();

                currentSerie = dataSeries[d._serieIndex].serie;

            } else {
                currentSerie = chart.series[d._serieIndex]
            }

            //set x position
            if (chart.xDataType === 'string')
                yPos = axis.yScale(d[chart.xField]) + axis.yScale.bandwidth() / 2;
            else
                yPos = axis.yScale(d[chart.xField]);

            //set y position
            xPos = isInit ? 0 : axis.xScale(d[currentSerie.yField]);

            //normalize nans
            if (isNaN(xPos)) xPos = 0;
            if (isNaN(yPos)) yPos = 0;

            //return translation
            return 'translate(' + xPos + ',' + yPos + ')';
        };

        //calculates font size
        let calculateColumnFontSize = function (textObject, d) {
            switch (chart.type) {
                case "combinationChart":
                case "columnChart":
                    {
                        //set radius as width
                        let rad = groupAxis ? groupAxis.bandwidth() / 2 : singleColumnWidth / 2;
                        let bbox = textObject.getBBox();

                        //set bounding box
                        d.bbox = bbox;

                        //check whether the label font size is auto
                        if (currentSerie.labelFontSize === 'auto')
                            d.fontSize = Math.min(2 * rad, (2 * rad - minFontSize) / Math.max(textObject.getComputedTextLength(), bbox.height) * minFontSize);
                        else
                            d.fontSize = currentSerie.labelFontSize;

                        //if current font size is less than the min font size then lets equal it to min
                        if (d.fontSize < minFontSize)
                            d.fontSize = minFontSize;

                        //return the calculated font size
                        return d.fontSize + 'px';
                    }
                    break;
                case "barChart":
                    {
                        //declare inner varibles
                        let rad = (groupAxis ? groupAxis.bandwidth() : singleColumnHeight);
                        let bbox = textObject.getBBox();

                        //set bounding box
                        d.bbox = bbox;

                        //set column width
                        if (chart.yAxis.stacked) {
                            //consider negative domain
                            if (chart.domains.minY < 0) {
                                d.columnWidth = Math.abs(axis.xScale(d[0]) - axis.xScale(d[1]));
                            } else {
                                d.columnWidth = Math.abs(axis.xScale(d[0] - d[1])) - axis.xScale(0);
                            }
                        } else {
                            //consider negative domain
                            if (chart.domains.minY < 0) {
                                d.columnWidth = Math.abs(axis.xScale(d.y) - axis.xScale(0));
                            } else {
                                d.columnWidth = axis.xScale(d.y);
                            }
                        }

                        //check whether the label font size is auto
                        if (currentSerie.labelFontSize === 'auto')
                            d.fontSize = Math.min(2 * rad, (2 * rad - minFontSize) / Math.max(textObject.getComputedTextLength(), bbox.height) * minFontSize);
                        else
                            d.fontSize = currentSerie.labelFontSize;
                        
                        //if current font size is less than the min font size then lets equal it to min
                        if (d.fontSize < minFontSize)
                            d.fontSize = minFontSize;

                        //set tmp fontsize
                        if (tmpFontSize != null) {
                            d.fontSize = tmpFontSize;
                        } else {
                            tmpFontSize = d.fontSize;
                        }

                        //return the calculated font size
                        return d.fontSize + 'px';
                    }
                    break;
            }
        };

        //gets height of the bar chart
        let getBarHeight = function (d) {
            let currentBarHeight = 0;

            if (chart.yAxis.startsFromZero && d.data[d.serie.yField] < 0)
                currentBarHeight = 0;

            if (d.data[d.serie.yField]) {
                if (d.data[d.serie.yField] === 0)
                    currentBarHeight = 0;

                if (chart.domains.minY < 0)
                    currentBarHeight = Math.abs(axis.yScale(d[0]) - axis.yScale(d[1]));
                else
                    currentBarHeight = Math.abs(axis.yScale(d[0] === 0 ? chart.domains.minY : d[0]) - axis.yScale(d[1]));
            } else {
                currentBarHeight = 0;
            }

            d.columnHeight = currentBarHeight;

            return currentBarHeight;
        };

        //checks whether the label fits in the area
        let isLabelFitting = function (d) {
            //declar einternal vars
            let fits = true;

            //calculate fitting state by chart type
            switch (chart.type) {
                case "combinationChart":
                case "columnChart":
                    {
                        //in a col chart fit state calculated by column height and font size (font sizes are always a height value)
                        fits = d.columnHeight > d.fontSize + 5;
                    }
                    break;
                case "barChart":
                    {
                        //when the chart is bar then col width should be larger than the text width
                        if (chart.yAxis.stacked) {
                            fits = d.columnWidth > (d.bbox.width + d.fontSize);
                        } else {
                            fits = d.columnWidth > (d.bbox.width + d.fontSize);

                            if (groupAxis.bandwidth() < d.fontSize)
                                fits = false;
                        }
                    }
                    break;
            }

            return fits;
        };

        //draws line chart
        let renderLineChart = function () {
            //create the shape function
            shapeFunc = d3.line()
                .x(function (d) {
                    //switch x data type to set x pos
                    switch (chart.xDataType) {
                        case 'string':
                            {
                                return axis.xScale(d.x) + axis.xScale.bandwidth() / 2;
                            }
                            break;
                        case 'date':
                            {
                                return axis.xScale(new Date(d.x));
                            }
                            break;
                        default:
                            {
                                return axis.xScale(d.x);
                            }
                            break;
                    }
                })
                .y(chart.plot.height);

            //set line curve
            if (currentSerie.behavior === 'spLine')
                shapeFunc.curve(d3.curveCardinal);
            else if (currentSerie.behavior === 'stepLine')
                shapeFunc.curve(d3.curveStep);

            //check whether the skip empty flag has set
            if (chart.yAxis.skipEmpty) {
                //skip empty points
                shapeFunc.defined(function (d) {
                    return d.y != null;
                });
            }

            //set combination serie
            let combSerie = null;
            if (data && data.length)
                combSerie = data[0].serie || null;

            //create g for each chart data
            layouts = chartG.selectAll('.eve-layout-line')
                .data(data)
                .enter().append('g')
                .attr('class', 'eve-layout-line');

            //create the shapes
            shapes = layouts.append('path')
                .attr('d', function (d) { return shapeFunc(d.values); })
                .attr('class', getClass)
                .attr('fill', 'none')
                .attr('stroke-opacity', 1)
                .attr('stroke', getColor)
                .attr('stroke-width', 2)
                .on('click', handleClick);

            //handle animation
            shapes
                .attr('opacity', chart.animation.effect === 'add' ? 0 : 1)
                .transition().duration(chart.data.length > dataLimit ? 0 : chart.animation.duration)
                .ease(chart.animation.easing.toEasing())
                .delay(function (d, i) { return i * (chart.data.length > dataLimit ? 0 : chart.animation.delay); })
                .attr('opacity', 1)
                .attr('d', function (d) {
                    //get the current values
                    let dValue = d.values[0];
                    if (dValue.serieKey) {
                        //update y by scale
                        shapeFunc
                            .y(function (d) {
                                if (dValue.serieKey)
                                    return axis.serieScales[dValue.serieKey](d.y ? d.y : axis.serieDomains[dValue.serieKey].min);

                                if (chart.yAxis.min !== null && d.y < chart.yAxis.min)
                                    return axis.yScale(chart.yAxis.min);

                                if (chart.yAxis.max !== null && d.y > chart.yAxis.max)
                                    return axis.yScale(chart.yAxis.max);

                                return axis.yScale(d.y ? d.y : chart.domains.minY);
                            });
                    } else {
                        //set line curve
                        if (d.serie.behavior === 'spLine')
                            shapeFunc.curve(d3.curveCardinal);
                        else if (d.serie.behavior === 'stepLine')
                            shapeFunc.curve(d3.curveStep);

                        //update y by scale
                        shapeFunc
                            .y(function (d) {
                                if (d.serieKey)
                                    return axis.serieScales[d.serieKey](d.y ? d.y : axis.serieDomains[d.serieKey].min);

                                if (chart.yAxis.min !== null && d.y < chart.yAxis.min)
                                    return axis.yScale(chart.yAxis.min);

                                if (chart.yAxis.max !== null && d.y > chart.yAxis.max)
                                    return axis.yScale(chart.yAxis.max);

                                return axis.yScale(d.y != null ? d.y : chart.domains.minY);
                            });
                    }
                    

                    //animate the shapes
                    return shapeFunc(d.values);
                });

            //iterate all data to create the bullets
            data.forEach(function (currentData, currentDataIndex) {
                //append the point circles for the data values
                chartG.selectAll('.eve-line-bullet-' + currentDataIndex)
                    .data(currentData.values)
                    .enter().append('circle')
                    .attr('class', 'eve-line-bullet-' + currentDataIndex)
                    .attr('r', 5)
                    .attr('cx', function (d) {
                        //switch x data type to set x pos
                        switch (chart.xDataType) {
                            case 'string':
                                return axis.xScale(d.x) + axis.xScale.bandwidth() / 2;
                                break;
                            case 'date':
                                return axis.xScale(new Date(d.x));
                                break;
                            default:
                                return axis.xScale(d.x);
                                break;
                        }
                    })
                    .attr('cy', chart.plot.height)
                    .attr('fill-opacity', function (d) { return d.y != null ? (currentSerie.showBullets ? 1 : 0) : 0; })
                    .attr('fill', getColor(currentData))
                    .on('mousemove', handleMouseMove)
                    .on('mouseout', handleMouseOut)
                    .on('click', handleClick)
                    .attr('opacity', chart.animation.effect === 'add' ? 0 : 1)
                    .transition().duration(chart.data.length > dataLimit ? 0 : chart.animation.duration)
                    .ease(chart.animation.easing.toEasing())
                    .delay(function (d, i) { return i * (chart.data.length > dataLimit ? 0 : chart.animation.delay); })
                    .attr('opacity', 1)
                    .attr('cy', function (d) {
                        let scaler = d.serieKey ? axis.serieScales[d.serieKey] : axis.yScale;
                        let cy = scaler(d.y);

                        if (d.y == null)
                            return 0;

                        if (d.serieKey)
                            return axis.serieScales[d.serieKey](d.y ? d.y : axis.serieDomains[d.serieKey].min);

                        if (chart.yAxis.min !== null && d.y < chart.yAxis.min)
                            return scaler(chart.yAxis.min);

                        if (chart.yAxis.max !== null && d.y > chart.yAxis.max)
                            return scaler(chart.yAxis.max);

                        return isNaN(cy) ? 0 : cy;
                    });

                //append the labels for the data values
                chartG.selectAll('.eve-line-label-' + currentDataIndex)
                    .data(currentData.values)
                    .enter().append('text')
                    .attr('class', 'eve-line-label eve-line-label-' + currentDataIndex)
                    .style('text-anchor', 'middle')
                    .style('pointer-events', 'none')
                    .style('fill-opacity', 1)
                    .style('fill', currentSerie.labelFontColor === 'auto' ? '#333333' : currentSerie.labelFontColor)
                    .style('font-size', (currentSerie.labelFontSize === 'auto' ? 11 : currentSerie.labelFontSize) + 'px')
                    .style('font-family', currentSerie.labelFontFamily)
                    .style('font-style', currentSerie.labelFontStyle === 'bold' ? 'normal' : currentSerie.labelFontStyle)
                    .style('font-weight', currentSerie.labelFontStyle === 'bold' ? 'bold' : 'normal')
                    .text(function (d) {
                        let dSerie = combSerie ? combSerie : chart.series[d.serieIndex];
                        return d.y != null ? chart.getContent(d, dSerie, currentSerie.labelFormat) : "";
                    })
                    .attr('transform', function (d) { return getLabelTransform(d, true); })
                    .attr('opacity', chart.animation.effect === 'add' ? 0 : 1)
                    .transition().duration(chart.data.length > dataLimit ? 0 : chart.animation.duration)
                    .ease(chart.animation.easing.toEasing())
                    .delay(function (d, i) { return i * (chart.data.length > dataLimit ? 0 : chart.animation.delay); })
                    .attr('opacity', 1)
                    .attr('transform', function (d) { return getLabelTransform(d, false); });
            });
        };

        //draws scatter chart
        let renderScatterChart = function () {
            //iterate all data to create the bullets
            data.forEach(function (currentData, currentDataIndex) {
                //get serie index
                let scatterSerieIndex = currentDataIndex;

                //set scatter serie index
                if (currentData.serie && currentData.columnName) {
                    scatterSerieIndex = chart.getSerieIndexByName(currentData.columnName);
                }

                //set combination serie
                let combSerie = null;
                if (data && data.length)
                    combSerie = data[0].serie || null;

                //append the point circles for the data values
                chartG.selectAll('.eve-vis-series-' + scatterSerieIndex)
                    .data(currentData.values)
                    .enter().append('circle')
                    .attr('class', function (d) {
                        return getClassName(d, currentData.serie);
                    })
                    .attr('r', 5)
                    .attr('cx', function (d) {
                        //switch x data type to set x pos
                        switch (chart.xDataType) {
                            case 'string':
                                return axis.xScale(d.x) + axis.xScale.bandwidth() / 2;
                                break;
                            case 'date':
                                return axis.xScale(new Date(d.x));
                                break;
                            default:
                                return axis.xScale(d.x);
                                break;
                        }
                    })
                    .attr('cy', chart.plot.height)
                    .attr('fill-opacity', function (d) { return d.y != null ? 1 : 0; })
                    .attr('fill', getColor(currentData))
                    .on('mousemove', handleMouseMove)
                    .on('mouseout', handleMouseOut)
                    .on('click', handleClick)
                    .attr('opacity', chart.animation.effect === 'add' ? 0 : 1)
                    .transition().duration(chart.data.length > dataLimit ? 0 : chart.animation.duration)
                    .ease(chart.animation.easing.toEasing())
                    .delay(function (d, i) { return i * (chart.data.length > dataLimit ? 0 : chart.animation.delay); })
                    .attr('opacity', 1)
                    .attr('cy', function (d) {
                        if (d.y == null)
                            return 0;

                        let cy = d.serieKey ? axis.serieScales[d.serieKey](d.y) : axis.yScale(d.y);
                        return isNaN(cy) ? 0 : cy;
                    });

                //append the labels for the data values
                chartG.selectAll('.eve-vis-label-' +scatterSerieIndex)
                    .data(currentData.values)
                    .enter().append('text')
                    .attr('class', 'eve-vis-label eve-vis-label-' + scatterSerieIndex)
                    .style('text-anchor', 'middle')
                    .style('pointer-events', 'none')
                    .style('fill-opacity', 1)
                    .style('fill', currentSerie.labelFontColor === 'auto' ? '#333333' : currentSerie.labelFontColor)
                    .style('font-size', (currentSerie.labelFontSize === 'auto' ? 11 : currentSerie.labelFontSize) + 'px')
                    .style('font-family', currentSerie.labelFontFamily)
                    .style('font-style', currentSerie.labelFontStyle === 'bold' ? 'normal' : currentSerie.labelFontStyle)
                    .style('font-weight', currentSerie.labelFontStyle === 'bold' ? 'bold' : 'normal')
                    .text(function (d) {
                        let dSerie = combSerie ? combSerie : chart.series[d.serieIndex];
                        return d.y != null ? chart.getContent(d, dSerie, currentSerie.labelFormat) : "";
                    })
                    .attr('transform', function (d) { return getLabelTransform(d, true); })
                    .attr('opacity', chart.animation.effect === 'add' ? 0 : 1)
                    .transition().duration(chart.data.length > dataLimit ? 0 : chart.animation.duration)
                    .ease(chart.animation.easing.toEasing())
                    .delay(function (d, i) { return i * (chart.data.length > dataLimit ? 0 : chart.animation.delay); })
                    .attr('opacity', 1)
                    .attr('transform', function (d) { return getLabelTransform(d, false); });
            });
        };

        //draws bubble chart
        let renderBubbleChart = function () {
            //iterate all data to create the bullets
            data.forEach(function (currentData, currentDataIndex) {
                //append the point circles for the data values
                chartG.selectAll('.eve-vis-series-' + currentDataIndex)
                    .data(currentData.values)
                    .enter().append('circle')
                    .attr('class', function (d) {
                        return getClassName(d, currentData.serie);
                    })
                    .attr('r', getBulletSize)
                    .attr('cx', function (d) {
                        //switch x data type to set x pos
                        switch (chart.xDataType) {
                            case 'string':
                                return axis.xScale(d.x) + axis.xScale.bandwidth() / 2;
                                break;
                            case 'date':
                                return axis.xScale(new Date(d.x));
                                break;
                            default:
                                return axis.xScale(d.x);
                                break;
                        }
                    })
                    .attr('cy', chart.plot.height)
                    .attr('fill-opacity', function (d) { return d.y != null ? defOpacity : 0; })
                    .attr('fill', getColor(currentData))
                    .on('mousemove', handleMouseMove)
                    .on('mouseout', handleMouseOut)
                    .on('click', handleClick)
                    .attr('opacity', chart.animation.effect === 'add' ? 0 : 1)
                    .transition().duration(chart.data.length > dataLimit ? 0 : chart.animation.duration)
                    .ease(chart.animation.easing.toEasing())
                    .delay(function (d, i) { return i * (chart.data.length > dataLimit ? 0 : chart.animation.delay); })
                    .attr('opacity', 1)
                    .attr('cy', function (d) {
                        if (d.y == null)
                            return 0;

                        let cy = axis.yScale(d.y);
                        return isNaN(cy) ? 0 : cy;
                    });

                //append the labels for the data values
                chartG.selectAll('.eve-bubble-label-' + currentDataIndex)
                    .data(currentData.values)
                    .enter().append('text')
                    .attr('class', 'eve-bubble-label eve-bubble-label-' + currentDataIndex)
                    .style('text-anchor', 'middle')
                    .style('pointer-events', 'none')
                    .style('fill-opacity', 1)
                    .style('fill', currentSerie.labelFontColor === 'auto' ? '#333333' : currentSerie.labelFontColor)
                    .style('font-size', (currentSerie.labelFontSize === 'auto' ? 11 : currentSerie.labelFontSize) + 'px')
                    .style('font-family', currentSerie.labelFontFamily)
                    .style('font-style', currentSerie.labelFontStyle === 'bold' ? 'normal' : currentSerie.labelFontStyle)
                    .style('font-weight', currentSerie.labelFontStyle === 'bold' ? 'bold' : 'normal')
                    .text(function (d) {
                        return d.y != null ? chart.getContent(d, chart.series[d.serieIndex], currentSerie.labelFormat) : "";
                    })
                    .attr('transform', function (d) { return getLabelTransform(d, true); })
                    .attr('opacity', chart.animation.effect === 'add' ? 0 : 1)
                    .transition().duration(chart.data.length > dataLimit ? 0 : chart.animation.duration)
                    .ease(chart.animation.easing.toEasing())
                    .delay(function (d, i) { return i * (chart.data.length > dataLimit ? 0 : chart.animation.delay); })
                    .attr('opacity', 1)
                    .attr('transform', function (d) { return getLabelTransform(d, false); });
            });
        };

        //draws area chart
        let renderAreaChart = function (dataset) {
            //check whether the area is stacked
            let isStacked = chart.yAxis.stacked;
            
            //create the shape function
            shapeFunc = d3.area()
                .x(function (d) {
                    //get x value
                    let xVal = isStacked ? d.data[chart.xField] : d.x;

                    //switch x data type to set x pos
                    switch (chart.xDataType) {
                        case 'string':
                            {
                                return axis.xScale(xVal) + axis.xScale.bandwidth() / 2;
                            }
                            break;
                        case 'date':
                            {
                                return axis.xScale(new Date(xVal));
                            }
                            break;
                        default:
                            {
                                return axis.xScale(xVal);
                            }
                            break;
                    }
                })
                .y0(function () {
                    if (chart.xAxis.position === "top")
                        return axis.yScale(chart.domains.maxY);
                    else
                        return chart.plot.height;
                })
                .y1(function () {
                    if (chart.xAxis.position === "top")
                        return axis.yScale(chart.domains.maxY);
                    else
                        return chart.plot.height;
                });

            //set line curve
            if (currentSerie.behavior === 'spLine')
                shapeFunc.curve(d3.curveCardinal);
            else if (currentSerie.behavior === 'stepLine')
                shapeFunc.curve(d3.curveStep);

            //renders non-stacked
            let renderNonStacked = function () {
                //check whether the skip empty flag has set
                /*if (chart.yAxis.skipEmpty) {
                    //skip empty points
                    shapeFunc.defined(function (d) {
                        return d.y != null;
                    });
                }*/

                //if chart position right
                if (chart.yAxis.position === "right") {
                    shapeFunc.y0(0);
                }

                //set combination serie
                let combSerie = null;
                if (data && data.length)
                    combSerie = data[0].serie || null;

                //create g for each chart data
                layouts = chartG.selectAll('.eve-layout-area')
                    .data(data)
                    .enter().append('g')
                    .attr('class', 'eve-layout-area');

                //create the shapes
                shapes = layouts.append('path')
                    .attr('d', function (d) { return shapeFunc(d.values); })
                    .attr('class', getClass)
                    .attr('fill', getColor)
                    .attr('fill-opacity', 1)
                    .on('click', handleClick);

                //handle animation
                shapes
                    .attr('opacity', chart.animation.effect === 'add' ? 0 : 1)
                    .transition().duration(chart.data.length > dataLimit ? 0 : chart.animation.duration)
                    .ease(chart.animation.easing.toEasing())
                    .delay(function (d, i) { return i * (chart.data.length > dataLimit ? 0 : chart.animation.delay); })
                    .attr('opacity', defOpacity)
                    .attr('d', function (d) {
                        if (chart.domains.minY < 0)
                            shapeFunc.y0(axis.yScale(0));

                        //update y by scale
                        shapeFunc.y1(function (d) {
                            //to check if its a combination
                            let yVal = 0;
                            if (axis.yScale) {
                                //set y value
                                yVal = d.y != null ? d.y : chart.domains.minY;
                                if (yVal < chart.domains.minY)
                                    yVal = chart.domains.minY;

                                return axis.yScale(d.y);
                            } else {
                                //set y value
                                yVal = d.y != null ? d.y : axis.serieDomains[d.serieKey].min;
                                if (yVal < axis.serieDomains[d.serieKey].min)
                                    yVal = axis.serieDomains[d.serieKey].min;

                                return axis.serieScales[d.serieKey](yVal);
                            }
                        });

                        //return shape fnction
                        return shapeFunc(d.values);
                    });

                //iterate all data to create the bullets
                data.forEach(function (currentData, currentDataIndex) {
                    //append the point circles for the data values
                    chartG.selectAll('.eve-area-bullet-' + currentDataIndex)
                        .data(currentData.values)
                        .enter().append('circle')
                        .attr('class', 'eve-area-bullet-' + currentDataIndex)
                        .attr('r', 5)
                        .attr('cx', function (d) {
                            //switch x data type to set x pos
                            switch (chart.xDataType) {
                                case 'string':
                                    return axis.xScale(d.x) + axis.xScale.bandwidth() / 2;
                                    break;
                                case 'date':
                                    return axis.xScale(new Date(d.x));
                                    break;
                                default:
                                    return axis.xScale(d.x);
                                    break;
                            }
                        })
                        .attr('cy', chart.plot.height)
                        .attr('fill-opacity', function (d) { return d.y != null ? (currentSerie.showBullets ? 1 : 0) : 0; })
                        .attr('fill', getColor(currentData))
                        .on('mousemove', handleMouseMove)
                        .on('mouseout', handleMouseOut)
                        .on('click', handleClick)
                        .attr('opacity', chart.animation.effect === 'add' ? 0 : 1)
                        .transition().duration(chart.data.length > dataLimit ? 0 : chart.animation.duration)
                        .ease(chart.animation.easing.toEasing())
                        .delay(function (d, i) { return i * (chart.data.length > dataLimit ? 0 : chart.animation.delay); })
                        .attr('opacity', 1)
                        .attr('cy', function (d) {
                            //to check if its a combination
                            let cy = 0;
                            if (axis.yScale)
                                cy = axis.yScale(d.y);
                            else
                                cy = axis.serieScales[d.serieKey](d.y);

                            if (d.y == null)
                                return -100;

                            return isNaN(cy) ? 0 : cy;
                        });

                    //append the labels for the data values
                    chartG.selectAll('.eve-area-label-' + currentDataIndex)
                        .data(currentData.values)
                        .enter().append('text')
                        .attr('class', 'eve-area-label eve-area-label-' + currentDataIndex)
                        .style('text-anchor', 'middle')
                        .style('pointer-events', 'none')
                        .style('fill-opacity', 1)
                        .style('fill', currentSerie.labelFontColor === 'auto' ? '#333333' : currentSerie.labelFontColor)
                        .style('font-size', (currentSerie.labelFontSize === 'auto' ? 11 : currentSerie.labelFontSize) + 'px')
                        .style('font-family', currentSerie.labelFontFamily)
                        .style('font-style', currentSerie.labelFontStyle === 'bold' ? 'normal' : currentSerie.labelFontStyle)
                        .style('font-weight', currentSerie.labelFontStyle === 'bold' ? 'bold' : 'normal')
                        .text(function (d) {
                            let dSerie = combSerie ? combSerie : chart.series[d.serieIndex];
                            return d.y != null ? chart.getContent(d, dSerie, currentSerie.labelFormat) : "";
                        })
                        .attr('transform', function (d) { return getLabelTransform(d, true); })
                        .attr('opacity', chart.animation.effect === 'add' ? 0 : 1)
                        .transition().duration(chart.data.length > dataLimit ? 0 : chart.animation.duration)
                        .ease(chart.animation.easing.toEasing())
                        .delay(function (d, i) { return i * (chart.data.length > dataLimit ? 0 : chart.animation.delay); })
                        .attr('opacity', 1)
                        .attr('transform', function (d) { return getLabelTransform(d, false); });
                });
            };

            //renders stacked
            let renderStacked = function () {
                //check whether the skip empty flag has set
                /*if (chart.yAxis.skipEmpty) {
                    //skip empty points
                    shapeFunc.defined(function (d, i) {
                        return d.data[d.serie.yField] != null;
                    });
                }*/
                
                //create g for each chart data
                layouts = chartG.selectAll('.eve-layout-area')
                    .data(data)
                    .enter().append('g')
                    .attr('class', 'eve-layout-area');

                //create the shapes
                shapes = layouts.append('path')
                    .attr('d', shapeFunc)
                    .attr('class', getClass)
                    .attr('fill', getColor)
                    .attr('fill-opacity', 1)
                    .on('click', handleClick);

                //handle animation
                shapes
                    .attr('opacity', chart.animation.effect === 'add' ? 0 : 1)
                    .transition().duration(chart.data.length > dataLimit ? 0 : chart.animation.duration)
                    .ease(chart.animation.easing.toEasing())
                    .delay(function (d, i) { return i * (chart.data.length > dataLimit ? 0 : chart.animation.delay); })
                    .attr('opacity', defOpacity)
                    .attr('d', function (d) {
                        //update y by scale
                        shapeFunc.y0(function (d) {
                            if (isNaN(d[1]))
                                return axis.yScale(chart.domains.minY);

                            if (chart.xAxis.position === "top") {
                                return Math.abs(axis.yScale(chart.domains.minY) - axis.yScale(d[0]));
                            } else {
                                return axis.yScale(d[0] < chart.domains.minY ? chart.domains.minY : d[0]);
                            }
                        });
                        shapeFunc.y1(function (d) {
                            if (isNaN(d[1]))
                                return axis.yScale(chart.domains.minY);

                            if (chart.yAxis.min !== null && d[1] < chart.yAxis.min)
                                return axis.yScale(chart.yAxis.min);

                            if (chart.yAxis.max !== null && d[1] > chart.yAxis.max)
                                return axis.yScale(chart.yAxis.max);

                            return axis.yScale(d[1]);
                        });

                        //animate the shapes
                        return shapeFunc(d);
                    });

                //iterate all data to create the bullets
                data.forEach(function (currentData, currentDataIndex) {
                    //append the point circles for the data values
                    chartG.selectAll('.eve-area-bullet-' + currentDataIndex)
                        .data(currentData)
                        .enter().append('circle')
                        .attr('class', 'eve-area-bullet-' + currentDataIndex)
                        .attr('r', 5)
                        .attr('cx', function (d) {
                            //get x val
                            let xVal = d.data[chart.xField];
                            
                            //switch x data type to set x pos
                            switch (chart.xDataType) {
                                case 'string':
                                    return axis.xScale(xVal) + axis.xScale.bandwidth() / 2;
                                    break;
                                case 'date':
                                    return axis.xScale(new Date(xVal));
                                    break;
                                default:
                                    return axis.xScale(xVal);
                                    break;
                            }
                        })
                        .attr('cy', chart.plot.height)
                        .attr('fill-opacity', function (d) {return d.data[d.serie.yField] != null ? (currentSerie.showBullets ? 1 : 0) : 0; })
                        .attr('fill', getColor(currentData))
                        .on('mousemove', handleMouseMove)
                        .on('mouseout', handleMouseOut)
                        .on('click', handleClick)
                        .attr('opacity', chart.animation.effect === 'add' ? 0 : 1)
                        .transition().duration(chart.data.length > dataLimit ? 0 : chart.animation.duration)
                        .ease(chart.animation.easing.toEasing())
                        .delay(function (d, i) { return i * (chart.data.length > dataLimit ? 0 : chart.animation.delay); })
                        .attr('opacity', 1)
                        .attr('cy', function (d) {
                            let cy = axis.yScale(d[1]);
                            let dVal = d.data[d.serie.yField];

                            if (chart.yAxis.min !== null && d[1] < chart.yAxis.min)
                                cy = axis.yScale(chart.yAxis.min);

                            if (chart.yAxis.max !== null && d[1] > chart.yAxis.max)
                                cy = axis.yScale(chart.yAxis.max);

                            if (dVal)
                                return isNaN(cy) ? 0 : cy;
                            else
                                return 0;
                        });

                    //append the labels for the data values
                    chartG.selectAll('.eve-area-label-' + currentDataIndex)
                        .data(currentData)
                        .enter().append('text')
                        .attr('class', 'eve-area-label eve-area-label-' + currentDataIndex)
                        .style('text-anchor', 'middle')
                        .style('pointer-events', 'none')
                        .style('fill-opacity', 1)
                        .style('fill', currentSerie.labelFontColor === 'auto' ? '#333333' : currentSerie.labelFontColor)
                        .style('font-size', (currentSerie.labelFontSize === 'auto' ? 11 : currentSerie.labelFontSize) + 'px')
                        .style('font-family', currentSerie.labelFontFamily)
                        .style('font-style', currentSerie.labelFontStyle === 'bold' ? 'normal' : currentSerie.labelFontStyle)
                        .style('font-weight', currentSerie.labelFontStyle === 'bold' ? 'bold' : 'normal')
                        .text(function (d) {
                            let yVal = d.data[d.serie.yField];
                            return yVal != null ? chart.getContent(d, d.serie, currentSerie.labelFormat) : "";
                        })
                        .attr('transform', function (d) { return getLabelTransform(d, true); })
                        .attr('opacity', chart.animation.effect === 'add' ? 0 : 1)
                        .transition().duration(chart.data.length > dataLimit ? 0 : chart.animation.duration)
                        .ease(chart.animation.easing.toEasing())
                        .delay(function (d, i) { return i * (chart.data.length > dataLimit ? 0 : chart.animation.delay); })
                        .attr('opacity', 1)
                        .attr('transform', function (d) { return getLabelTransform(d, false); });
                });
            };

            //render the area
            isStacked ? renderStacked() : renderNonStacked();
        };

        //draws column chart
        let renderColumnChart = function () {
            //check whether the area is stacked
            let isStacked = chart.yAxis.stacked;
            let combSerie = null;
            let scale = d3.scaleBand().range([0, chart.plot.width]).padding(0.1).round(true).domain(chart.domains.xValues);

            //gets single column width
            singleColumnWidth = scale.bandwidth() / 2;

            //update dataset
            let updateDataSetByInnerType = function () {
                //if base type is combination need to update columns
                if (chart.type === "combinationChart") {
                    columns = [];
                    data = [];
                    chart.series.forEach(function (s) {
                        if (s.type === "column")
                            columns.push(s.yField);
                    });

                    //iterate all dataset
                    chart.data.forEach(function (d) {
                        let cd = {};
                        cd[chart.xField] = d[chart.xField];

                        columns.forEach(function (clm) {
                            cd[clm] = d[clm];
                        });

                        data.push(cd);
                    });
                } else {
                    //set dataset
                    data = chart.data;

                    //filter data
                    if (chart.xAxis.min != null && chart.xDataType !== "string") {
                        data = chart.data.filter(function (d) {
                            if (d[chart.xField] >= chart.xAxis.min)
                                return d;
                        });
                    }
                }
            };

            //gets grouped data
            let getGroupData = function (d) {
                var groupData = columns.map(function (colName, colIndex) {
                    //create the set
                    let dataset = {
                        serieName: colName,
                        serieIndex: colIndex,
                        x: d[chart.xField],
                        y: +d[colName],
                        serieKey: chart.type === "combinationChart" ? colName.toValueKey() : null
                    };

                    //is psw
                    if (chart.isPSW) {
                        dataset[chart.xField] = dataset.x;
                        dataset[colName] = dataset.y;
                    }

                    return dataset;
                });

                return groupData;
            };

            //renders non-stacked
            let renderNonStacked = function () {
                //set data
                updateDataSetByInnerType();
                
                //create group axis
                groupAxis = d3.scaleBand().domain(columns).range([0, singleColumnWidth]).round(false).padding(0.05);

                //set combination serie
                if (data && data.length)
                    combSerie = data[0].serie || null;

                //gets x position 
                let getXPos = function (d, i) {
                    //declare needed variables
                    let xPos = 0;

                    //switch x data type
                    switch (chart.xDataType) {
                        case "string":
                            {
                                //get position via string scale
                                xPos = axis.xScale(d.x) + (singleColumnWidth / 2) + (i * groupAxis.bandwidth()) + 1;
                            }
                            break;
                        case "date":
                            {
                                //get position via date scale
                                xPos = axis.xScale(new Date(d.x)) + (singleColumnWidth / 2) + (i * groupAxis.bandwidth()) + 1;
                            }
                            break;
                        default:
                            {
                                //declare the abs x
                                let absX = d.x;

                                //check whehter the chart has bounds
                                if (chart.xAxis.min != null && d.x < chart.xAxis.min) {
                                    absX = chart.xAxis.min;
                                }

                                //check whehter the chart has bounds
                                if (chart.xAxis.max != null && d.x > chart.xAxis.max) {
                                    absX = chart.xAxis.max;
                                }

                                //get position via numeric scale
                                xPos = axis.xScale(absX) - (singleColumnWidth / 2) + (i * groupAxis.bandwidth()) + 1;
                            }
                            break;
                    }

                    //return the calculated x position
                    return xPos;
                };

                //gets y position
                let getYPos = function (d, i, isInit) {
                    //declare needed variables
                    let yPos = 0;
                    let yVal = 0;
                    let scaler = null;
                    let minY = 0;
                    let absY = d.y;
                    
                    //if there is a serie key then its a combination chart
                    if (d.serieKey) {
                        //set scaler as combination axis
                        scaler = axis.serieScales[d.serieKey];
                        currentDomain = axis.serieDomains[d.serieKey];
                        minY = currentDomain.min;
                    } else {
                        //set scaler as linear axis
                        scaler = axis.yScale;
                        currentDomain = chart.domains;
                        minY = currentDomain.minY;
                    }

                    //check whehter the chart has bounds
                    if (chart.yAxis.min != null && d.y < chart.yAxis.min) {
                        absY = chart.yAxis.min;
                    }

                    //check whehter the chart has bounds
                    if (chart.yAxis.max != null && d.y > chart.yAxis.max) {
                        absY = chart.yAxis.max;
                    }

                    //does the request comes before the transition
                    if (isInit) {
                        //get y position
                        yPos = minY < 0 ? scaler(0) : scaler(minY);
                    } else {
                        //check whether the min y value is less than zero
                        if (minY < 0) {
                            yPos = absY < 0 ? scaler(0) : scaler(absY);
                        } else {
                            yPos = scaler(absY);
                        }
                    }

                    //return the calculated x position
                    return yPos;
                };

                //gets column height
                let getHeight = function (d, i) {
                    //declare needed variables
                    let colHeight = 0;
                    let scaler = null;
                    let minY = 0;
                    let absY = d.y;

                    //if there is a serie key then its a combination chart
                    if (d.serieKey) {
                        //set scaler as combination axis
                        scaler = axis.serieScales[d.serieKey];
                        currentDomain = axis.serieDomains[d.serieKey];
                        minY = currentDomain.min;
                    } else {
                        //set scaler as linear axis
                        scaler = axis.yScale;
                        currentDomain = chart.domains;
                        minY = currentDomain.minY;
                    }

                    //check whehter the chart has bounds
                    if (chart.yAxis.min != null && d.y < chart.yAxis.min) {
                        absY = chart.yAxis.min;
                    }

                    //check whehter the chart has bounds
                    if (chart.yAxis.max != null && d.y > chart.yAxis.max) {
                        absY = chart.yAxis.max;
                    }

                    //set col height
                    if (absY)
                        colHeight = Math.abs((minY < 0 ? scaler(0) : chart.plot.height) - Math.abs(scaler(absY)));
                    else
                        colHeight = 0;

                    //return the calculated height
                    return colHeight;
                };

                //set shapes
                shapes = chartG.append("g").selectAll("g")
                    .data(data)
                    .enter().append("g")
                    .selectAll("rect")
                    .data(getGroupData)
                    .enter().append("rect")
                    .attr("fill", getColor)
                    .attr('class', getClassName)
                    .on('click', handleClick)
                    .on('mousemove', handleMouseMove)
                    .on('mouseout', handleMouseOut)
                    .attr("x", getXPos)
                    .attr('y', function (d, i) {
                        return getYPos(d, i, true);
                    })
                    .attr("width", groupAxis.bandwidth())
                    .attr("height", 0)
                    .attr('opacity', chart.animation.effect === 'add' ? 0 : 1)
                    .transition().duration(chart.data.length > dataLimit ? 0 : chart.animation.duration)
                    .ease(chart.animation.easing.toEasing())
                    .delay(function (d, i) { return i * (chart.data.length > dataLimit ? 0 : chart.animation.delay); })
                    .attr('opacity', 1)
                    .attr("y", function (d, i) {
                        return getYPos(d, i);
                    })
                    .attr("height", getHeight);

                //create the labels
                labels = chartG.append("g").selectAll("g")
                    .data(data)
                    .enter().append("g")
                    .selectAll("text")
                    .data(getGroupData)
                    .enter().append("text")
                    .style('text-anchor', 'middle')
                    .style('pointer-events', 'none')
                    .style('fill', currentSerie.labelFontColor === 'auto' ? chart.getAutoColor(currentSerie.color) : currentSerie.labelFontColor)
                    .style('font-family', currentSerie.labelFontFamily)
                    .style('font-style', currentSerie.labelFontStyle === 'bold' ? 'normal' : currentSerie.labelFontStyle)
                    .style('font-weight', currentSerie.labelFontStyle === 'bold' ? 'bold' : 'normal')
                    .text(function (d, i) {
                        //get serie
                        let dSerie = combSerie ? combSerie : chart.series[d.serieIndex];

                        //get tooltip content
                        return chart.getContent(d, dSerie, currentSerie.labelFormat);
                    })
                    .style('font-size', function (d, i) {
                        //set the font size
                        return calculateColumnFontSize(this, d);
                    })
                    .attr('transform', function (d, i) {
                        //declare needed variables
                        let xPos = getXPos(d, i, true);
                        let yPos = getYPos(d, i, true);

                        //increase x pos by width
                        xPos += (this.getBBox().width / 2);
                        return "translate(" + xPos + "," + yPos + ")";
                    })
                    .attr('opacity', function (d) { return chart.animation.effect === 'add' ? 0 : 1; })
                    .transition().duration(data.length > dataLimit ? 0 : chart.animation.duration)
                    .ease(chart.animation.easing.toEasing())
                    .delay(function (d, i) { return i * (data.length > dataLimit ? 0 : chart.animation.delay); })
                    .attr('opacity', 1)
                    .attr('transform', function (d, i) {
                        //declare needed variables
                        let xPos = getXPos(d, i, true);
                        let yPos = getYPos(d, i, false);

                        //decrease y pos by height
                        yPos -= d.fontSize;
                        xPos += (this.getBBox().width / 2);
                        return "translate(" + xPos + "," + yPos + ")";
                    });
            };

            //renders stacked
            let renderStacked = function () {
                //gets x position
                let getXPos = function (d, i) {
                    //get x val
                    let xVal = d.data[chart.xField];

                    //switch x data type to set x pos
                    switch (chart.xDataType) {
                        case 'string':
                            return axis.xScale(xVal) + singleColumnWidth / 2;
                            break;
                        case 'date':
                            return axis.xScale(new Date(xVal)) - singleColumnWidth / 2;
                            break;
                        default:
                            return axis.xScale(xVal) - singleColumnWidth / 2;
                            break;
                    }
                };

                //gets width
                let getWidth = function (d, i) {
                    //get x value
                    let xVal = d.data[chart.xField];
                    if (chart.xAxis.min != null && chart.xDataType !== "string") {
                        if (xVal < chart.domains.minX)
                            return 0;
                    }
                    return singleColumnWidth;
                };

                //gets y position
                let getYPos = function (d, i, isInit) {
                    //declare the y values
                    let yPos = 0;
                    let absY = 0;
                    let initPos = chart.domains.minY < 0 ? axis.yScale(0) : axis.yScale(chart.domains.minY);
                    let currentBarHeight = getHeight(d, i);

                    //set y position
                    if (chart.xAxis.position === "top") {
                        //set scales
                        yPos = isInit ? axis.yScale(chart.domains.maxY) : axis.yScale(d[0]);

                        //check domains
                        if (chart.domains.minY < 0) {
                            //set y position
                            if (chart.series.length === 1) {
                                if (d[1] < 0)
                                    yPos = axis.yScale(0);
                                else
                                    yPos = axis.yScale(d[1]);
                            } else {
                                yPos = axis.yScale(d[1]);
                            }

                            //if its init then its 0
                            if (isInit)
                                yPos = axis.yScale(0);
                        } else {
                            //set y position
                            yPos = isInit ? axis.yScale(chart.domains.maxY) : (axis.yScale(chart.domains.minY) - axis.yScale(d[0]));
                        }
                    } else {
                        if (chart.domains.minY < 0) {
                            //set y position
                            if (chart.series.length === 1) {
                                if (d[1] < 0)
                                    yPos = axis.yScale(0);
                                else
                                    yPos = axis.yScale(d[1]);
                            } else {
                                yPos = axis.yScale(d[1]);
                            }

                            //if its init then its 0
                            if (isInit)
                                yPos = axis.yScale(0);
                        } else {
                            //set y position
                            yPos = isInit ? initPos : axis.yScale(d[1]);

                            //check if its negative
                            if (!isInit && d[1] < 0)
                                yPos = axis.yScale(d[1]);
                        }
                    }

                    //return calculated y position
                    return yPos == null ? 0 : yPos;
                };

                //gets height
                let getHeight = function (d, i) {
                    //declare needed variables
                    let currentBarHeight = 0;
                    let yVal = d.data[d.serie.yField];
                    
                    //check whehter the bound is not 0
                    if (chart.yAxis.min != null) {
                        if (chart.yAxis.min === 0 && yVal < 0)
                            currentBarHeight = 0;
                    }

                    if (d.data[d.serie.yField]) {
                        //if the data value is zero then set bar as 0
                        if (yVal === 0)
                            currentBarHeight = 0;

                        //if data domain is negative
                        if (chart.domains.minY < 0) {
                            currentBarHeight = Math.abs(axis.yScale(d[0]) - axis.yScale(d[1]));
                        } else {
                            currentBarHeight = Math.abs(axis.yScale(d[0] === 0 ? chart.domains.minY : d[0]) - axis.yScale(d[1]));
                        }
                    } else {
                        currentBarHeight = 0;
                    }

                    //set column height
                    d.columnHeight = currentBarHeight;

                    //return the calcualted bar height
                    return currentBarHeight;
                };

                //create g for each chart data
                layouts = chartG.selectAll('.eve-layout-column')
                    .data(data)
                    .enter().append('g')
                    .attr('class', 'eve-layout-column')
                    .attr('fill', getColor)
                    .attr('fill-opacity', defOpacity);

                //create the shapes
                shapes = layouts.selectAll('rect')
                    .data(function (d) { return d; })
                    .enter().append('rect')
                    .attr('class', getClassName)
                    .on('click', handleClick)
                    .on('mousemove', handleMouseMove)
                    .on('mouseout', handleMouseOut)
                    .attr('x', getXPos)
                    .attr('width', getWidth)
                    .attr('y', function (d, i) {
                        return getYPos(d, i, true);
                    })
                    .attr('height', 0)
                    .attr('opacity', chart.animation.effect === 'add' ? 0 : 1)
                    .transition().duration(chart.data.length > dataLimit ? 0 : chart.animation.duration)
                    .ease(chart.animation.easing.toEasing())
                    .delay(function (d, i) { return i * (chart.data.length > dataLimit ? 0 : chart.animation.delay); })
                    .attr('opacity', 1)
                    .attr('y', function (d, i) {
                        return getYPos(d, i, false);
                    })
                    .attr('height', getHeight);

                //create the labels
                if (currentSerie.labelFormat) {
                    labels = layouts.selectAll("text")
                        .data(function (d) { return d; })
                        .enter().append('text')
                        .style('text-anchor', 'middle')
                        .style('pointer-events', 'none')
                        .style('fill', currentSerie.labelFontColor === 'auto' ? chart.getAutoColor(currentSerie.color) : currentSerie.labelFontColor)
                        .style('font-family', currentSerie.labelFontFamily)
                        .style('font-style', currentSerie.labelFontStyle === 'bold' ? 'normal' : currentSerie.labelFontStyle)
                        .style('font-weight', currentSerie.labelFontStyle === 'bold' ? 'bold' : 'normal')
                        .text(function (d, i) {
                            return chart.getContent(d, d.serie, currentSerie.labelFormat);
                        })
                        .style('font-size', function (d, i) { return calculateColumnFontSize(this, d); })
                        .attr('transform', function (d) { return getLabelTransform(d, true); })
                        .attr('opacity', function (d) { return chart.animation.effect === 'add' ? 0 : 1; })
                        .transition().duration(chart.data.length > dataLimit ? 0 : chart.animation.duration)
                        .ease(chart.animation.easing.toEasing())
                        .delay(function (d, i) { return i * (chart.data.length > dataLimit ? 0 : chart.animation.delay); })
                        .attr('opacity', 1)
                        .attr('transform', function (d) { return getLabelTransform(d, false); });
                }
            };

            //render the area
            isStacked ? renderStacked() : renderNonStacked();
        };

        //draws bar chart
        let renderBarChart = function () {
            //check whether the area is stacked
            let txtMargin = 5;
            let isStacked = chart.yAxis.stacked;
            let scale = d3.scaleBand().range([0, chart.plot.height]).padding(0.1).round(true).domain(chart.domains.xValues);

            //gets single column width
            singleColumnHeight = scale.bandwidth() / 2;

            //update dataset
            let updateDataSetByInnerType = function () {
                //filter data
                if (chart.xAxis.min != null && chart.xDataType !== "string") {
                    data = chart.data.filter(function (d) {
                        if (d[chart.xField] >= chart.xAxis.min)
                            return d;
                    });
                } else {
                    data = chart.data;
                }
            };

            //gets grouped data
            let getGroupData = function (d) {
                return columns.map(function (colName, colIndex) {
                    //create the set
                    let dataset = {
                        serieName: colName,
                        serieIndex: colIndex,
                        x: d[chart.xField],
                        y: +d[colName],
                    };

                    return dataset;
                });
            };

            //renders non stacked
            let renderNonStacked = function () {
                //set data
                updateDataSetByInnerType();
                
                //create group axis
                groupAxis = d3.scaleBand().domain(columns).range([0, singleColumnHeight]).round(false).padding(0.05);

                //gets x position
                let getXPos = function (d, i, isInit) {
                    //declare needed variables
                    let xPos = 0;
                    let absY = d.y;
                    let barWidth = getWidth(d, i);

                    //check whehter the chart has bounds
                    if (chart.yAxis.min != null && d.y < chart.yAxis.min) {
                        absY = chart.yAxis.min;
                    }

                    //check whehter the chart has bounds
                    if (chart.yAxis.max != null && d.y > chart.yAxis.max) {
                        absY = chart.yAxis.max;
                    }

                    //does the request comes before the transition
                    if (isInit) {
                        //get y position
                        xPos = axis.xScale(0);
                    } else {
                        if (chart.xAxis.position === "right") {
                            if (d.y < 0) {
                                xPos = axis.xScale(absY);
                            } else {
                                xPos = axis.xScale(0);
                            }
                        } else {
                            if (d.y < 0) {
                                xPos = axis.xScale(absY);
                            } else {
                                xPos = axis.xScale(0);
                            }
                        }
                    }

                    return xPos;
                    //check whether the min y value is less than zero
                    /*if (chart.domains.minY < 0) {
                        if (d.y < 0) {
                            //calculate the width
                            xPos = axis.xScale(d.y);
                        } else {
                            xPos = chart.domains.minY < 0 ? axis.xScale(0) : 0;
                        }
                    } else {
                        xPos = 0;
                    }

                    if (chart.xAxis.position === "right") {
                        return isInit ? chart.plot.width : chart.plot.width - barWidth;
                    } else {
                        return xPos;
                    }*/
                };

                //gets y position
                let getYPos = function (d, i) {
                    //declare needed variables
                    let yPos = 0;

                    //switch x data type
                    switch (chart.xDataType) {
                        case "string":
                            {
                                //get position via string scale
                                yPos = groupAxis(d.serieName) + singleColumnHeight / 2;
                                    //axis.yScale(d.x) + (i * groupAxis.bandwidth()) + (groupAxis.bandwidth()) + 5;
                                    //(axis.yScale(d.x) - (groupAxis.bandwidth() / 2)) + (i * groupAxis.bandwidth()) + singleColumnHeight + (singleColumnHeight / 2);
                            }
                            break;
                        case "date":
                            {
                                //get position via date scale
                                yPos = (axis.yScale(new Date(d.x)) - (groupAxis.bandwidth() / 2)) + (i * groupAxis.bandwidth()) - (singleColumnHeight / 2);
                            }
                            break;
                        default:
                            {
                                //declare the abs x
                                let absY = d.x;
                                
                                //check whehter the chart has bounds
                                if (chart.xAxis.min != null && d.x < chart.xAxis.min) {
                                    absY = chart.xAxis.min;
                                }

                                //check whehter the chart has bounds
                                if (chart.xAxis.max != null && d.x > chart.xAxis.max) {
                                    absY = chart.xAxis.max;
                                }

                                //get position via numeric scale
                                yPos = (axis.yScale(absY) - (groupAxis.bandwidth() / 2)) + (i * groupAxis.bandwidth()) - (singleColumnHeight / 2);
                            }
                            break;
                    }

                    //return the calculated y pos
                    return yPos;
                };

                //gets width
                let getWidth = function (d, i) {
                    //declare needed variables
                    let barWidth = 0;
                    let minY = chart.domains.minY;
                    let absY = d.y;

                    //check whehter the chart has bounds
                    if (chart.yAxis.min != null && d.y < chart.yAxis.min) {
                        absY = chart.yAxis.min;
                    }

                    //check whehter the chart has bounds
                    if (chart.yAxis.max != null && d.y > chart.yAxis.max) {
                        absY = chart.yAxis.max;
                    }

                    if (d.y) {
                        if (d.serieKey) {
                            barWidth = Math.abs((axis.serieDomains[d.serieKey].min < 0 ? axis.serieScales[d.serieKey](0) : chart.plot.width) - Math.abs(axis.serieScales[d.serieKey](absY)));
                        } else {
                            if (d.y < 0) {
                                barWidth = Math.abs(axis.xScale(d.y) - axis.xScale(0));
                            } else {
                                barWidth = Math.abs(axis.xScale(absY));
                            }
                        }
                    }

                    //return the calculated height
                    return barWidth;
                };

                //set shapes
                shapes = chartG.append("g").selectAll("g")
                    .data(data)
                    .enter().append("g")
                    .attr("transform", function (d) {
                        if (chart.xDataType === "string")
                            return "translate(0, " + scale(d[chart.xField]) + ")";
                    })
                    .selectAll("rect")
                    .data(getGroupData)
                    .enter().append("rect")
                    .attr("fill", getColor)
                    .attr('class', getClassName)
                    .on('click', handleClick)
                    .on('mousemove', handleMouseMove)
                    .on('mouseout', handleMouseOut)
                    .attr("x", function (d, i) { return getXPos(d, i, true); })
                    .attr('y', getYPos)
                    .attr("width", 0)
                    .attr("height", groupAxis.bandwidth())
                    .attr('opacity', chart.animation.effect === 'add' ? 0 : 1)
                    .transition().duration(chart.data.length > dataLimit ? 0 : chart.animation.duration)
                    .ease(chart.animation.easing.toEasing())
                    .delay(function (d, i) { return i * (chart.data.length > dataLimit ? 0 : chart.animation.delay); })
                    .attr('opacity', 1)
                    .attr("x", function (d, i) { return getXPos(d, i); })
                    .attr("width", getWidth);

                //create the labels
                if (currentSerie.labelFormat) {
                    labels = chartG.append("g").selectAll("g")
                        .data(data)
                        .enter().append("g")
                        .attr("transform", function (d) {
                            if (chart.xDataType === "string") {
                                return "translate(0, " + scale(d[chart.xField]) + ")";
                            }
                        })
                        .selectAll("text")
                        .data(getGroupData)
                        .enter().append("text")
                        .style('text-anchor', 'middle')
                        .style('pointer-events', 'none')
                        .style('fill', currentSerie.labelFontColor === 'auto' ? chart.getAutoColor(currentSerie.color) : currentSerie.labelFontColor)
                        .style('font-family', currentSerie.labelFontFamily)
                        .style('font-style', currentSerie.labelFontStyle === 'bold' ? 'normal' : currentSerie.labelFontStyle)
                        .style('font-weight', currentSerie.labelFontStyle === 'bold' ? 'bold' : 'normal')
                        .text(function (d, i) { return chart.getContent(d, chart.series[d.serieIndex], currentSerie.labelFormat); })
                        .style('font-size', function (d, i) { return calculateColumnFontSize(this, d); })
                        .attr('transform', function (d, i) {
                            //declare needed variables
                            let xPos = getXPos(d, i, true);
                            let yPos = getYPos(d, i);
                            let bbox = this.getBBox();

                            if (chart.xDataType === "string")
                                yPos = (yPos + groupAxis.bandwidth() / 2) + (d.fontSize / 2);
                            else
                                yPos = yPos + d.fontSize;

                            //increase x pos by width
                            xPos -= bbox.width;
                            //yPos += d.fontSize + groupAxis.bandwidth() / 2;
                            return "translate(" + xPos + "," + yPos + ")";
                        })
                        .attr('opacity', function (d) {
                            return chart.animation.effect === 'add' ? 0 : (isLabelFitting(d) ? 1 : 0);
                        })
                        .transition().duration(chart.data.length > dataLimit ? 0 : chart.animation.duration)
                        .ease(chart.animation.easing.toEasing())
                        .delay(function (d, i) { return i * (chart.data.length > dataLimit ? 0 : chart.animation.delay); })
                        .attr('opacity', function (d) {
                            return isLabelFitting(d) ? 1 : 0;
                        })
                        .attr('transform', function (d, i) {
                            //declare needed variables
                            let xPos = getWidth(d, i);
                            let yPos = getYPos(d, i);
                            let bbox = this.getBBox();

                            if (chart.xDataType === "string")
                                yPos = (yPos + groupAxis.bandwidth() / 2) + (d.fontSize / 2);
                            else
                                yPos = yPos + d.fontSize;

                            //decrease y pos by height
                            xPos -= (bbox.width);
                            //yPos += d.fontSize + groupAxis.bandwidth() / 2;
                            return "translate(" + xPos + "," + yPos + ")";
                        });
                }
            };

            //renders stacked
            let renderStacked = function () {
                //gets y pos
                let getYPos = function (d, i) {
                    //get x val
                    let xVal = d.data[chart.xField];

                    //switch x data type to set x pos
                    switch (chart.xDataType) {
                        case 'string':
                            return axis.yScale(xVal) + singleColumnHeight / 2;
                            break;
                        case 'date':
                            return axis.yScale(new Date(xVal)) - singleColumnHeight / 2;
                            break;
                        default:
                            return axis.yScale(xVal) - singleColumnHeight / 2;
                            break;
                    }
                };

                //gets x pos
                let getXPos = function (d, i, isInit) {
                    //declare needed variables
                    let xPos = 0;
                    let initPos = chart.domains.minY < 0 ? axis.xScale(0) : axis.xScale(chart.domains.minY);
                    let currentBarWidth = getWidth(d, i);

                    //check ifaxis right aligned
                    if (chart.xAxis.position === "right") {
                        //if is less than zero
                        if (chart.series.length === 1) {
                            if (d[1] < 0) {
                                xPos = axis.xScale(0) - currentBarWidth;
                            } else {
                                if (chart.domains.minY < 0)
                                    xPos = isInit ? axis.xScale(0) : axis.xScale(d[0]);
                                else
                                    xPos = isInit ? axis.xScale(chart.domains.maxY) : (axis.xScale(chart.domains.maxY) - axis.xScale(d[1]));
                            }
                        } else {
                            if (d[0] < 0) {
                                xPos = axis.xScale(d[1]) - currentBarWidth;
                            } else {
                                if (chart.domains.minY < 0)
                                    xPos = isInit ? axis.xScale(0) : axis.xScale(d[0]);
                                else
                                    xPos = isInit ? axis.xScale(chart.domains.maxY) : (axis.xScale(chart.domains.maxY) - axis.xScale(d[1]));
                            }
                        }
                    } else {
                        //set y position
                        xPos = isInit ? initPos : axis.xScale(d[0]);

                        //if its less than zero
                        if (d[1] < 0 && !isInit)
                            xPos = axis.xScale(0) - getWidth(d, i);

                        //if not is init and chart y axis has a min value
                        if (!isInit && chart.yAxis.min != null)
                            xPos = xPos < 0 ? axis.xScale(chart.yAxis.min) : axis.xScale(d[0]);
                    }
                    
                    //return calculated y position
                    return xPos == null ? 0 : xPos;
                };

                //gets height
                let getHeight = function (d) {
                    //get x value
                    let xVal = d.data[chart.xField];

                    if (chart.xAxis.min != null && chart.xDataType !== "string") {
                        if (xVal < chart.domains.minX)
                            return 0;
                    }

                    return singleColumnHeight;
                };

                //gets width
                let getWidth = function (d, i) {
                    //declare needed variables
                    let currentBarWidth = 0;
                    let xVal = d.data[d.serie.yField];
                    
                    //check whehter the bound is not 0
                    if (chart.yAxis.min != null) {
                        if (chart.yAxis.min === 0 && xVal < 0)
                            currentBarWidth = 0;
                    }

                    if (d.data[d.serie.yField]) {
                        //if the data value is zero then set bar as 0
                        if (xVal === 0)
                            currentBarWidth = 0;

                        //if data domain is negative
                        if (chart.domains.minY < 0) {
                            currentBarWidth = Math.abs(axis.xScale(d[0]) - axis.xScale(d[1]));
                        } else {
                            currentBarWidth = Math.abs(axis.xScale(d[0] === 0 ? chart.domains.minY : d[0]) - axis.xScale(d[1]));
                        }
                    } else {
                        currentBarWidth = 0;
                    }

                    //set width
                    if (chart.series.length === 1) {
                        //check min range
                        if (chart.yAxis.min != null && d[1] < chart.yAxis.min)
                            currentBarWidth = 0;

                        //check max range
                        if (chart.yAxis.max != null && d[1] > chart.yAxis.max)
                            currentBarWidth = Math.abs(axis.xScale(d[0] === 0 ? chart.domains.minY : d[0]) - axis.xScale(chart.yAxis.max));
                    }

                    //set column height
                    d.columnWidth = currentBarWidth;

                    //return the calcualted bar height
                    return currentBarWidth;
                };

                //create g for each chart data
                layouts = chartG.selectAll('.eve-layout-bar')
                    .data(data)
                    .enter().append('g')
                    .attr('class', 'eve-layout-bar')
                    .attr('fill', getColor)
                    .attr('fill-opacity', defOpacity);

                //create the shapes
                shapes = layouts.selectAll('rect')
                    .data(function (d) { return d; })
                    .enter().append('rect')
                    .attr('class', getClassName)
                    .on('click', handleClick)
                    .on('mousemove', handleMouseMove)
                    .on('mouseout', handleMouseOut)
                    .attr('x', function (d, i) { return getXPos(d, i, true); })
                    .attr('width', 0)
                    .attr('y', getYPos)
                    .attr('height', getHeight)
                    .attr('opacity', chart.animation.effect === 'add' ? 0 : 1)
                    .transition().duration(chart.data.length > dataLimit ? 0 : chart.animation.duration)
                    .ease(chart.animation.easing.toEasing())
                    .delay(function (d, i) { return i * (chart.data.length > dataLimit ? 0 : chart.animation.delay); })
                    .attr('opacity', 1)
                    .attr('x', function (d, i) { return getXPos(d, i, false); })
                    .attr('width', getWidth);

                //create the labels
                if (currentSerie.labelFormat) {
                    labels = layouts.selectAll("text")
                        .data(function (d) { return d; })
                        .enter().append('text')
                        .style('text-anchor', 'end')
                        .style('pointer-events', 'none')
                        .style('fill', currentSerie.labelFontColor === 'auto' ? chart.getAutoColor(currentSerie.color) : currentSerie.labelFontColor)
                        .style('font-family', currentSerie.labelFontFamily)
                        .style('font-style', currentSerie.labelFontStyle === 'bold' ? 'normal' : currentSerie.labelFontStyle)
                        .style('font-weight', currentSerie.labelFontStyle === 'bold' ? 'bold' : 'normal')
                        .text(function (d, i) {
                            return chart.getContent(d, d.serie, currentSerie.labelFormat);
                        })
                        .style('font-size', function (d, i) { return calculateColumnFontSize(this, d, singleColumnHeight); })
                        .attr('transform', function (d, i) {
                            //get positions
                            let xPos = getXPos(d, i, true);
                            let yPos = getYPos(d, i);
                            let fSize = (d.fontSize - 5) / 2;

                            yPos += (singleColumnHeight / 2) + (fSize);
                            return "translate(" + xPos + "," + yPos + ")";
                        })
                        .attr('opacity', function (d) { return chart.animation.effect === 'add' ? 0 : (isLabelFitting(d) ? 1 : 0); })
                        .transition().duration(chart.data.length > dataLimit ? 0 : chart.animation.duration)
                        .ease(chart.animation.easing.toEasing())
                        .delay(function (d, i) { return i * (chart.data.length > dataLimit ? 0 : chart.animation.delay); })
                        .attr('opacity', function (d) { return isLabelFitting(d) ? 1 : 0; })
                        .attr('transform', function (d, i) {
                            //get positions
                            let xPos = getXPos(d, i, false);
                            let yPos = getYPos(d, i);
                            let bWidth = getWidth(d, i) - txtMargin;
                            let fSize = (d.fontSize - txtMargin) / 2;

                            yPos += (singleColumnHeight / 2) + (fSize);
                            xPos += bWidth;
                            return "translate(" + xPos + "," + yPos + ")";
                        });
                }
            };

            //render the area
            isStacked ? renderStacked() : renderNonStacked();
        };

        //draws radar chart
        let renderRadarChart = function () {
            //create the shape function
            shapeFunc = d3.radialLine()
                .curve(d3.curveLinearClosed)
                .radius(function (d) { return axis.yScale(0); })
		        .angle(function (d, i) { return i * axis.sliceAngle; });

            //set line curve
            if (currentSerie.behavior === 'spLine')
                shapeFunc.curve(d3.curveCardinalClosed);

            //create chart g
            chartG = chart.svg.append('g')
                .attr('class', 'eve-vis-g')
                .attr('transform', 'translate(' + chart.width / 2 + ',' + chart.height / 2 + ')');

            //create g for each chart data
            layouts = chartG.selectAll('.eve-layout-radar')
                .data(data)
                .enter().append('g')
                .attr('class', 'eve-layout-radar');

            //create the shapes
            shapes = layouts.append('path')
                .attr('d', function (d) { return shapeFunc(d.values); })
                .attr('class', getClass)
                .attr('fill', getColor)
                .attr("fill-opacity", currentSerie.alpha)
                .attr('stroke-opacity', 1)
                .attr('stroke', getColor)
                .attr('stroke-width', 1)
                .on('click', handleClick);
            
            //handle animation
            shapes
                .attr('opacity', chart.animation.effect === 'add' ? 0 : 1)
                .transition().duration(chart.data.length > dataLimit ? 0 : chart.animation.duration)
                .ease(chart.animation.easing.toEasing())
                .delay(function (d, i) { return i * (chart.data.length > dataLimit ? 0 : chart.animation.delay); })
                .attr('opacity', 1)
                .attr('d', function (d) {
                    //update y by scale
                    shapeFunc.radius(function (d) {
                        if (d.y != null)
                            return axis.yScale(d.y);
                        else
                            return 0;
                    });

                    let newVals = d.values.filter(function (v) { return v.y != null; });
                    if (newVals.length > 0)
                        newVals = d.values;

                    //animate the shapes
                    return shapeFunc(newVals);
                });

            //create the bullets
            layouts.selectAll("circle")
                .data(function (d) {
                    d.values.forEach(function (dv) { dv.serie = d.serie; });
                    let newVals = d.values.filter(function (v) {
                        return v.y != null;
                    });
                    if (newVals.length > 0)
                        return d.values;
                    return newVals;
                })
                .enter().append("circle")
                .attr("class", function (d) {
                    return getClass(d);
                })
                .attr("r", currentSerie.bulletSize / 2)
		        .attr("cx", function (d, i) { return axis.yScale(0) * Math.cos(axis.sliceAngle * i - Math.PI / 2); })
		        .attr("cy", function (d, i) { return axis.yScale(0) * Math.sin(axis.sliceAngle * i - Math.PI / 2); })
		        .style("fill", getColor)
                .style("pointer-events", "all")
                .on('mousemove', handleMouseMove)
                .on('mouseout', handleMouseOut)
                .on('click', handleClick)
                .attr('opacity', chart.animation.effect === 'add' ? 0 : 1)
                .transition().duration(chart.data.length > dataLimit ? 0 : chart.animation.duration)
                .ease(chart.animation.easing.toEasing())
                .delay(function (d, i) { return i * (chart.data.length > dataLimit ? 0 : chart.animation.delay); })
                .attr('opacity', 1)
                .attr("cx", function (d, i) {
                    return axis.yScale(d.y) * Math.cos(axis.sliceAngle * i - Math.PI / 2);
                })
		        .attr("cy", function (d, i) {
		            return axis.yScale(d.y) * Math.sin(axis.sliceAngle * i - Math.PI / 2);
		        });

            //create the labels
            if (currentSerie.labelFormat) {
                layouts.selectAll("text")
                    .data(function (d) { return d.values; })
                    .enter().append("text")
                    .attr("transform", function (d, i) { return getLabelTransform(d, true, i); })
		            .style("fill", getColor)
                    .style('text-anchor', 'middle')
                    .style('pointer-events', 'none')
                    .style('fill-opacity', 1)
                    .style('fill', currentSerie.labelFontColor === 'auto' ? '#333333' : currentSerie.labelFontColor)
                    .style('font-size', (currentSerie.labelFontSize === 'auto' ? 11 : currentSerie.labelFontSize) + 'px')
                    .style('font-family', currentSerie.labelFontFamily)
                    .style('font-style', currentSerie.labelFontStyle === 'bold' ? 'normal' : currentSerie.labelFontStyle)
                    .style('font-weight', currentSerie.labelFontStyle === 'bold' ? 'bold' : 'normal')
                    .text(function (d) {
                        return chart.getContent(d, currentSerie, currentSerie.labelFormat);
                    })
                    .attr('opacity', chart.animation.effect === 'add' ? 0 : 1)
                    .transition().duration(chart.data.length > dataLimit ? 0 : chart.animation.duration)
                    .ease(chart.animation.easing.toEasing())
                    .delay(function (d, i) { return i * (chart.data.length > dataLimit ? 0 : chart.animation.delay); })
                    .attr('opacity', 1)
                    .attr("transform", function (d, i) { return getLabelTransform(d, false, i); });
            }
        };

        //draws combination chart
        let renderCombinationChart = function () {
            //nest the dataset to set charts
            let nestedSeries = d3.nest().key(function (d) { return d.type; }).entries(chart.serieTypes);

            //updates data for the given set
            let updateCombinationDataset = function (availableSeries) {
                //set chart data
                data = availableSeries.map(function (as, i) {
                    //set chart dataset
                    let chartDataSet = chart.data.map(function (d) {
                        return {
                            x: d[chart.xField],
                            y: d[as.name],
                            serieKey: as.name.toValueKey()
                        };
                    });

                    //sort data
                    chartDataSet.sort(function (a, b) {
                        if (chart.xDataType === "date") {
                            return new Date(a.x) - new Date(b.x);
                        } else if (chart.xDataType === "string") {
                            if (a.value < b.value) { return -1; } if (a.value > b.value) { return 1; } return 0;
                        } else {
                            return a.x - b.x;
                        }
                    });

                    //send the actual data object
                    return {
                        columnName: as.name,
                        serie: as.serie,
                        values: chartDataSet
                    };
                });
            };

            //create charts
            nestedSeries.forEach(function (currentSerieSet, nsi) {
                //update dataset for the serie values
                updateCombinationDataset(currentSerieSet.values);

                //update current chart type
                currentChartType = currentSerieSet.key + "Chart";

                //switch serie type to draw
                switch (currentSerieSet.key) {
                    case 'area':
                        renderAreaChart();
                        break;
                    case 'column':
                        renderColumnChart();
                        break;
                    case 'line':
                        renderLineChart();
                        break;
                    case 'scatter':
                        renderScatterChart();
                        break;
                }
            });
        };

        //draws abacus chart
        let renderAbacusChart = function () {
            //declare abacus specific variables
            let bulletSize = currentSerie.bulletSize < 16 ? 16 : currentSerie.bulletSize,
                guideYPos = 0,
                currentMeasure = 0,
                nextMeasure = 0,
                currentWidth = 0,
                currentX1 = 0,
                currentX2 = 0,
                minXPos = axis.xScale(chart.domains.minY),
                maxXPos = axis.xScale(chart.domains.maxY),
                guideLineSize = bulletSize / 3;

            let bulletF = d3.symbol().type(function (d) {
                return chart.series[0].bullet === 'none' ? d3.symbolCircle : chart.series[0].bullet.toSymbol();
            }).size(function (d) {
                return Math.pow(bulletSize, 2);
            });

            //extract serie names from data
            let dataSeries = chart.extractSerieNamesFromData();

            //transform abacus bullets
            dataSeries.forEach(function (currentSet, serieIndex) {
                currentSerie = currentSet.serie;

                //iterate all data to create guide lines
                chart.data.forEach(function (datarow, dataIndex) {
                    //declare needed variables
                    setDataColumns(datarow);

                    //get y position of the current guide lines
                    guideYPos = axis.yScale(datarow[chart.xField]) + (chart.xDataType === "string" ? (axis.yScale.bandwidth() / 2) : 0);

                    //create guide lines for the current set
                    chartG.selectAll('.eve-abacus-line-' + serieIndex + '-' + dataIndex)
                        .data(dataColumns)
                        .enter().append('line')
                        .attr('class', 'eve-abacus-lines eve-abacus-line-' + serieIndex + '-' + dataIndex)
                        .style('stroke', function (d, i) {
                            //get measures
                            currentMeasure = d;
                            nextMeasure = dataColumns[i + 1];
                            let currentSerieColor = "none";

                            //check whether the next measure is not empty
                            if (nextMeasure) {
                                //get proper measure index
                                if (parseFloat(currentMeasure.value) < parseFloat(nextMeasure.value))
                                    currentSerieColor = chart.getColorFromLegend(nextMeasure.name);
                                else
                                    currentSerieColor = chart.getColorFromLegend(currentMeasure.name);

                                d.color = currentSerieColor;

                                //check measure index is > -1
                                return currentSerieColor;
                            } else {
                                //there is no next meausure so no fill
                                return 'none';
                            }
                        })
                        .style('stroke-width', guideLineSize)
                        .attr('y1', guideYPos)
                        .attr('y2', guideYPos)
                        .attr('x1', function (d, i) {
                            //get current measure value
                            currentMeasure = d;
                            nextMeasure = dataColumns[i + 1];

                            //check whether the next measure is not empty
                            if (nextMeasure) {
                                //get x1 value from axis
                                currentX1 = axis.xScale(parseFloat(currentMeasure.value));

                                //check whether the current x1 > maxxpos
                                if (currentX1 > maxXPos)
                                    return maxXPos;

                                //check whether the current x value is less than plot left
                                return currentX1 < minXPos ? minXPos : currentX1 + bulletSize / 2;
                            } else {
                                //there is no next meausure so remove
                                return 0;
                            }
                        })
                        .style('stroke-dasharray', function (d, i) {
                            //get current measure value
                            currentMeasure = d;
                            nextMeasure = dataColumns[i + 1];

                            //check whether the next measure is not empty
                            if (nextMeasure) {
                                //get x1 and x2 value from axis
                                currentX1 = axis.xScale(parseFloat(currentMeasure.value));
                                currentX2 = axis.xScale(parseFloat(nextMeasure.value));

                                //check whether the current x value is less than plot left
                                if (currentX1 < minXPos || currentX2 > maxXPos)
                                    return '5, 2';
                                else
                                    return '0';
                            } else {
                                //there is no next meausure so remove
                                return '0';
                            }
                        })
                        .transition().duration(chart.animation.duration)
                        .ease(chart.animation.easing.toEasing())
                        .delay(function (d, i) { return i * chart.animation.delay; })
                        .style('stroke-opacity', function (d, i) {
                            //get current measure value
                            currentMeasure = d;
                            nextMeasure = dataColumns[i + 1];

                            //check whether the next measure is not empty
                            if (nextMeasure) {
                                //get x1 and x2 value from axis
                                currentX1 = axis.xScale(parseFloat(currentMeasure.value));
                                currentX2 = axis.xScale(parseFloat(nextMeasure.value));

                                //get proper measure index
                                currentWidth = currentX2 - currentX1;

                                //check whether the both x values less than min x pos
                                if (currentX1 < minXPos && currentX2 < minXPos)
                                    return 0;

                                //remove stroke if not available
                                return currentWidth > bulletSize ? 1 : 0;
                            } else {
                                //there is no next meausure so remove
                                return 0;
                            }
                        })
                        .attr('x2', function (d, i) {
                            //get current measure value
                            currentMeasure = d;
                            nextMeasure = dataColumns[i + 1];

                            //check whether the next measure is not empty
                            if (nextMeasure) {
                                //get x2 value from axis
                                currentX2 = axis.xScale(parseFloat(nextMeasure.value));

                                //get proper measure index
                                return currentX2 > maxXPos ? maxXPos : currentX2 - bulletSize / 2;
                            } else {
                                //there is no next meausure so remove
                                return 0;
                            }
                        });
                });

                //create the bullets
                chartG.selectAll('.eve-abacus-bullet-' + serieIndex)
                    .data(data[serieIndex])
                    .enter().append('path')
                    .attr('class', 'eve-abacus-bullets eve-abacus-bullet-' + serieIndex)
                    .attr('d', bulletF)
                    .attr('stroke-width', currentSerie.bulletStrokeSize)
                    .attr('stroke-opacity', chart.animation.effect === 'add' ? 0 : 1)
                    .attr('fill-opacity', chart.animation.effect === 'add' ? 0 : 1)
                    .attr('fill', function (d, i) {
                        //check columns to set fill color
                        return currentSerie.color;
                    })
                    .attr('transform', function (d) { return getBulletTransform(d, true); })
                    .on('click', function (d) {
                        if (chart.sliceClick) chart.sliceClick(d.data);
                    })
                    .on('mousemove', function (d, i) {
                        //get x1 and x2 value from axis
                        currentX1 = axis.xScale(d[currentSerie.yField])

                        //check whetehr the current x position less than min
                        if (currentX1 < minXPos)
                            return;
                        else if (currentX1 > maxXPos)
                            return;

                        //set default serie
                        let bulletSerie = dataSeries[d._serieIndex].serie;

                        //set slice hover
                        d3.select(this).attr('fill-opacity', currentSerie.sliceHoverAlpha);

                        //show tooltip
                        chart.showTooltip(chart.getContent(d, bulletSerie, chart.tooltip.format));
                    })
                    .on('mouseout', function (d, i) {
                        chart.hideTooltip();
                    })
                    .transition().duration(chart.animation.duration)
                    .ease(chart.animation.easing.toEasing())
                    .delay(function (d, i) { return i * chart.animation.delay; })
                    .attr('stroke-opacity', currentSerie.bulletStrokeAlpha)
                    .attr('fill-opacity', function (d, i) {
                        //get x1 and x2 value from axis
                        currentX1 = axis.xScale(d[currentSerie.yField])

                        //check whetehr the current x position less than min
                        if (currentX1 < minXPos)
                            return 0;
                        else if (currentX1 > maxXPos)
                            return 0;
                        else
                            return d[currentSerie.yField] != null ? 1 : 0;
                    })
                    .attr('transform', function (d) {
                        return getBulletTransform(d, false);
                    });

                //set label font size
                if (currentSerie.labelFontSize === 'auto')
                    currentSerie.labelFontSize = 11;

                //set label font size
                if (currentSerie.labelFontColor === 'auto')
                    currentSerie.labelFontColor = '#333333';

                //set labels
                if (currentSerie.labelFormat !== '') {
                    chartG.selectAll('.eve-abacus-label-' + serieIndex)
                        .data(data[serieIndex])
                        .enter().append('text')
                        .attr('class', 'eve-abacus-labels eve-abacus-label-' + serieIndex)
                        .style('text-anchor', 'middle')
                        .style('pointer-events', 'none')
                        .style('fill', currentSerie.labelFontColor)
                        .style('fill-opacity', function (d) {
                            //get x1 and x2 value from axis
                            currentX1 = axis.xScale(d[currentSerie.yField])

                            //check whetehr the current x position less than min
                            if (currentX1 < minXPos)
                                return 0;
                            else if (currentX1 > maxXPos)
                                return 0;
                            else
                                return d[currentSerie.yField] != null ? 1 : 0;
                        })
                        .style('font-size', (currentSerie.labelFontSize === 'auto' ? 11 : currentSerie.labelFontSize) + 'px')
                        .style('font-family', currentSerie.labelFontFamily)
                        .style('font-style', currentSerie.labelFontStyle === 'bold' ? 'normal' : currentSerie.labelFontStyle)
                        .style('font-weight', currentSerie.labelFontStyle === 'bold' ? 'bold' : 'normal')
                        .text(function (d) {
                            //get x1 and x2 value from axis
                            currentX1 = axis.xScale(d[currentSerie.yField])

                            //check whetehr the current x position less than min
                            if (currentX1 < minXPos)
                                return '';
                            else if (currentX1 > maxXPos)
                                return '';

                            //return formatted label
                            return chart.getContent(d, currentSerie, currentSerie.labelFormat);
                        })
                        .attr('transform', function (d) { return getLabelTransform(d, true); })
                        .transition().duration(chart.animation.duration)
                        .ease(chart.animation.easing.toEasing())
                        .delay(function (d, i) { return i * chart.animation.delay; })
                        .attr('transform', function (d) { return getLabelTransform(d, false); });
                }
            });
        };

        //renders stream graph
        let renderStreamgraph = function () {
            //declare color settings
            let colors = [];

            //creates colors
            function createColors() {
                //clear colors
                let colorRatio = 100 / chart.series.length;
                colors.length = 0;

                //iterate all series to create colors
                chart.series.forEach(function (s, i) {
                    //switch legend type
                    switch (chart.legend.type) {
                        case 'gradient':
                            colors.push(e.gradient(chart.legend.gradientColors, 100 - (i * colorRatio)));
                            break;
                        default:
                            colors.push(s.color);
                            break;
                    }
                });
            }

            //create the colors
            createColors();

            //set xscale
            let xScale = null;
            if(chart.xDataType === "date")
                xScale = d3.scaleTime().domain(d3.extent(chart.data, function (d) { return d[chart.xField]; })).range([0, chart.plot.width]);
            else
                xScale = d3.scaleLinear().domain(d3.extent(chart.data, function (d) { return d[chart.xField]; })).range([0, chart.plot.width]);

            //set y scale
            let yScale = d3.scaleLinear()
                .domain([0, d3.max(data, function (layer) { return d3.max(layer, function (d) { return d[0] + d[1]; }); })])
                .range([chart.plot.height / 2, 0]);

            //set area function to use as stream
            shapeFunc = d3.area()
                .x(function (d) { return xScale(d.data[chart.xField]); })
                .y0(function (d) { return yScale(d[0]); })
                .y1(function (d) { return yScale(d[0]); })
                .curve(d3.curveBasis);

            //create area for the streams
            chartG.selectAll('.eve-streamgraph-layer')
                .data(data)
                .enter().append('path')
                .attr('class', 'eve-streamgraph-layer')
                .attr('d', shapeFunc)
                .attr('fill', function (d, i) { return colors[i]; })
                .attr('stroke', function (d, i) { return colors[i]; })
                .attr('fill-opacity', function (d, i) {
                    if (chart.series[d.index] != null)
                        return chart.series[d.index].alpha;
                })
                .attr('stroke-opacity', function (d, i) {
                    if (chart.series[d.index])
                        return chart.series[d.index].sliceStrokeAlpha;
                })
                .attr('stroke-width', function (d, i) {
                    if (chart.series[d.index])
                        return chart.series[d.index].sliceStrokeThickness;
                })
                .attr('opacity', chart.animation.effect === 'add' ? 0 : 1)
                .transition().duration(chart.animation.duration)
                .ease(chart.animation.easing.toEasing())
                .delay(function (d, i) { return i * chart.animation.delay; })
                .attr('opacity', 1)
                .attr("d", function (d) {
                    shapeFunc.y1(function (d) {
                        return yScale(d[1]);
                    });

                    return shapeFunc(d);
                });

            //append hover events
            chartG.selectAll('.eve-streamgraph-layer')
                .on('mouseover', function (d, i) {
                    //set slice hover
                    d3.select(this).attr('fill-opacity', chart.series[i].sliceHoverAlpha);
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
                        if (a.data[chart.xField] === invertedX) {
                            //show tooltip
                            chart.showTooltip(chart.getContent(a.data, a.serie, chart.tooltip.format));
                        }
                    });
                })
                .on('mouseout', function (d, i) {
                    //set slice hover
                    d3.select(this).attr('fill-opacity', chart.series[i].alpha);

                    //hide tooltip
                    chart.hideTooltip();
                });
        };

        //renders chart
        let renderChart = function () {
            //switch chart type to render
            switch (chart.type) {
                case 'abacus':
                    renderAbacusChart();
                    break;
                case 'areaChart':
                    renderAreaChart();
                    break;
                case 'barChart':
                    renderBarChart();
                    break;
                case 'columnChart':
                    renderColumnChart();
                    break;
                case 'combinationChart':
                    renderCombinationChart();
                    break;
                case 'bubbleChart':
                    renderBubbleChart();
                    break;
                case 'lineChart':
                    renderLineChart();
                    break;
                case 'radarChart':
                    renderRadarChart();
                    break;
                case 'scatterChart':
                    renderScatterChart();
                    break;
                case 'streamGraph':
                    renderStreamgraph();
                    break;
            }
        }

        //if chart type is not radar then create the chart g
        if (chart.type !== "radarChart") {
            //create chart g
            chartG = chart.svg.append('g')
                .attr('class', 'eve-vis-g')
                .attr('transform', 'translate(' + chart.plot.left + ',' + chart.plot.top + ')');
        }

        //run the necessary scripts to set chart environment
        setChartData();
        renderChart();

        //updates chart
        chart.update = function (data) {
            //update chart data
            chart.data = data;
            setChartData();

            //recalculate domain and set datasets
            chart.calculateDomain();
            chart.updateLegend();

            //update axis
            axis.update();

            //remove g
            if (chart.animation.effect) {
                //check whether the effect is fade
                if (chart.animation.effect === 'fade') {
                    //remove with transition
                    chartG.transition().duration(1000).style('opacity', 0).remove();
                } else if (chart.animation.effect === 'dim') {
                    //remove with transition
                    chartG.style('opacity', 0.15);
                } else if (chart.animation.effect === 'add') {
                    //remove with transition
                    chartG.style('opacity', 1);
                } else {
                    //remove immediately
                    chartG.remove();
                }
            } else {
                //remove immediately
                chartG.remove();
            }

            //if chart type is not radar then create the chart g
            if (chart.type !== "radarChart") {
                //create chart g
                chartG = chart.svg.append('g')
                    .attr('class', 'eve-vis-g')
                    .attr('transform', 'translate(' + chart.plot.left + ',' + chart.plot.top + ')');
            }
            
            //re-render chart
            renderChart();
        };

        //attach clear content method to chart
        chart.clear = function () {
            //remove g from the content
            chart.svg.selectAll('.eve-vis-g').remove();
        };

        //return column chart
        return chart;
    }

    //attach bar chart
    eve.abacus = function (options) {
        //remove stacked
        if (options.yAxis)
            options.yAxis.stacked = false;

        //update options
        options.type = 'abacus';
        options.masterType = "xy";

        //stack the options to the visualizations stack
        e.visualizations.push(options);

        //create the charts
        return new xyChart(options);
    };

    //attach area chart
    eve.areaChart = function (options) {
        //update optins
        options.type = 'areaChart';
        options.masterType = "xy";
        options.__stackable = true;

        //stack the options to the visualizations stack
        e.visualizations.push(options);

        //create the chart
        return new xyChart(options);
    };

    //attach bar chart
    eve.barChart = function (options) {
        //update options
        options.type = 'barChart';
        options.masterType = "xy";
        options.__stackable = true;

        //if there is one serie and it s not stacked we can stack them
        if (options.series.length === 1 && !options.yAxis.stacked)
            options.yAxis.stacked = true;

        //options.yAxis.stacked = false;

        //stack the options to the visualizations stack
        e.visualizations.push(options);

        //create the charts
        return new xyChart(options);
    };

    //attach bubble chart
    eve.bubbleChart = function (options) {
        //remove stacked
        if (options.yAxis)
            options.yAxis.stacked = false;

        //update options
        options.type = 'bubbleChart';
        options.masterType = "xy";

        //stack the options to the visualizations stack
        e.visualizations.push(options);

        //create the chart
        return new xyChart(options);
    };

    //attach column chart
    eve.columnChart = function (options) {
        //update options
        options.type = 'columnChart';
        options.masterType = "xy";
        options.__stackable = true;

        //if there is one serie and it s not stacked we can stack them
        if (options.series.length === 1 && !options.yAxis.stacked)
            options.yAxis.stacked = true;

        //stack the options to the visualizations stack
        e.visualizations.push(options);

        //creat the chart
        return new xyChart(options);
    };

    //attach combination chart
    eve.combinationChart = function (options) {
        //remove stacked
        if (options.yAxis)
            options.yAxis.stacked = false;

        //update options
        options.type = 'combinationChart';
        options.masterType = "xy";

        //stack the options to the visualizations stack
        e.visualizations.push(options);

        //create the chart
        return new xyChart(options);
    };

    //attach line chart
    eve.lineChart = function (options) {
        //remove stacked
        if (options.yAxis)
            options.yAxis.stacked = false;

        //update options
        options.type = 'lineChart';
        options.masterType = "xy";

        //stack the options to the visualizations stack
        e.visualizations.push(options);

        //create the chart
        return new xyChart(options);
    };

    //attach radar chart
    eve.radarChart = function (options) {
        //remove stacked
        if (options.yAxis)
            options.yAxis.stacked = false;

        //update options
        options.type = 'radarChart';
        options.masterType = "xy";

        //stack the options to the visualizations stack
        e.visualizations.push(options);

        //create the chart
        return new xyChart(options);
    };

    //attach scatter chart
    eve.scatterChart = function (options) {
        //remove stacked
        if (options.yAxis)
            options.yAxis.stacked = false;

        //update options
        options.type = 'scatterChart';
        options.masterType = "xy";

        //stack the options to the visualizations stack
        e.visualizations.push(options);

        //create the chart
        return new xyChart(options);
    };

    //attach line chart
    eve.streamGraph = function (options) {
        //remove stacked
        if (options.yAxis) {
            options.yAxis.position = "right";
            options.yAxis.stacked = true;
        }

        if (options.legend)
            options.legend.enabled = false;

        //update options
        options.type = 'streamGraph';
        options.masterType = "xy";

        //stack the options to the visualizations stack
        e.visualizations.push(options);

        //create the chart
        return new xyChart(options);
    };

    //attach line chart
    eve.streamgraph = function (options) {
        //remove stacked
        if (options.yAxis) {
            options.yAxis.position = "right";
            options.yAxis.stacked = true;
        }

        if (options.legend)
            options.legend.enabled = false;

        //update options
        options.type = 'streamGraph';
        options.masterType = "xy";

        //stack the options to the visualizations stack
        e.visualizations.push(options);

        //create the chart
        return new xyChart(options);
    };
})(eve);