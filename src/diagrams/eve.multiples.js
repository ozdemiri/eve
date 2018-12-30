/*!
 * eve.multiples.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Base class for multiples diagram.
 */
(function (e) {
    //define multiples diagram class
    function multiplesDiagram(options) {
        //check serie type
        if (options.series[0].type === 'map')
            options.series[0].type = 'standardMap';

        //create pre initializaiton environment
        let serieXValues = [],
            currentXValuesLength = 0,
            hasGroup = false,
            groupValues = [],
            currentSerie = options.series[0],
            baseGradientColors = ['#BADCF2', '#395C99'],
            measureField = currentSerie.yField || currentSerie.measureField || currentSerie.valueField,
            colorField = currentSerie.colorField,
            latField = currentSerie.latField,
            longField = currentSerie.longField,
            xField = currentSerie.xField,
            sectionContainer = null,
            initialLegendValue = null;

        //calculate data area count
        if (options.data) {
            //disable std map legend if not locked
            if (options.multiples) {
                if ((currentSerie.type === 'standardMap' && options.multiples.lockAxisX === false) || (currentSerie.type === 'bubbleForce' && options.multiples.lockAxisX === false)) {
                    initialLegendValue = options.legend.enabled;
                    options.legend.enabled = false;
                } else if (currentSerie.type === 'bubbleForce' && options.legend.enabled) {
                    if (currentSerie.groupField) {
                        let uniqueList = [];
                        options.data.forEach(function (d) {
                            let currentUniques;
                            if (e.getType(d.values) === 'array') {
                                if (d.values.length && d.values.length > 0)
                                    currentUniques = e.getUniqueValues(d.values, currentSerie.groupField);
                            } else {
                                if (d.values && d.values.groups)
                                    currentUniques = d.values.groups;
                            }
                            uniqueList = uniqueList.concat(currentUniques);
                        });
                        options.manualLegendValues = e.getUniqueValues(uniqueList).filter(function (d) { return d !== ' ' });
                    }
                }
            } else {
                if ((currentSerie.type === 'standardMap' && !options.yAxis.locked) || (currentSerie.type === 'bubbleForce' && !options.yAxis.locked)) {
                    initialLegendValue = options.legend.enabled;
                    options.legend.enabled = false;
                } else if (currentSerie.type === 'bubbleForce' && options.legend.enabled) {
                    if (currentSerie.groupField) {
                        let uniqueList = [];
                        options.data.forEach(function (d) {
                            let currentUniques;
                            if (e.getType(d.values) === 'array') {
                                if (d.values.length && d.values.length > 0)
                                    currentUniques = e.getUniqueValues(d.values, currentSerie.groupField);
                            } else {
                                if (d.values && d.values.groups)
                                    currentUniques = d.values.groups;
                            }
                            uniqueList = uniqueList.concat(currentUniques);
                        });
                        options.manualLegendValues = e.getUniqueValues(uniqueList).filter(function (d) { return d !== ' ' });
                    }
                }
            }
        }

        //declare needed variables
        let diagram = e.initVis(options),
            areaCount = 0,
            width = diagram.plot.width - diagram.plot.left - diagram.plot.right,
            height = diagram.plot.height - diagram.plot.top - diagram.plot.bottom,
            singleRectWidth = 0,
            singleRectHeight = 0,
            minMeasure = 0,
            maxMeasure = 0,
            minColor = 0,
            maxColor = 0,
            diffDegrees = null,
            vectormaps = [],
            minX = 0,
            maxX = 0,
            xValues = [],
            currentMeasureValue = 0,
            currentSet = [],
            currentMeasures = [],
            currentMeasuresSummarized = [],
            tempForeign = null,
            sectionX = 0,
            sectionY = 0,
            sectionRowIndex = 0,
            sectionID = '',
            actualData = [],
            currentDataArray = [],
            serieStability = {},
            multipleType = getMultiplesType(currentSerie);

        //restore legend value if altered
        if (initialLegendValue)
            diagram.legend.enabled = initialLegendValue;

        //clear simulations
        diagram.simulations = [];
		
		//gets vis rendering type
		let getRatio = function() {
			let ratio = 4/3;
			switch(currentSerie.type) {
				case "donutChart":
				case "donut":
				case "pieChart":
				case "pie":
				case "radarChart":
				case "radar":
				case "bubbleDiagram":
				case "bubbleForce":
				case "chord":
				case "circlepacking":
				case "circlePacking":
				case "force":
				case "networkForce":
				case "networkDiagram":
				case "sunburst":
					ratio = 1;
					break;
			}
			return ratio;
		};

        //makes necessary calculations to create the diagram
        function calculateEnvironment(keepAxis) {
            //update current serie
            currentSerie = diagram.series[0];

            //iterate data set to create actual data
            actualData = [];
            diagram.data.forEach(function (d) {
                if (e.getType(d.values) === 'array') {
                    if (d.values.length && d.values.length > 0)
                        actualData.push(e.clone(d));
                } else {
                    if (d.values)
                        actualData.push(e.clone(d));
                }
            });

            //calculate data area count
            actualData.forEach(function (d) {
                if (e.getType(d.values) === 'array') {
                    if (d.values.length && d.values.length > 0)
                        areaCount++;
                } else {
                    if (d.values)
                        areaCount++;
                }

                //iterate all values
                if (d.values && d.values.length) {
                    d.values.forEach(function (currentValueSet) {
                        //iterate all series
                        let totalValues = 0;
                        diagram.series.forEach(function (cs) {
                            if (currentValueSet[cs.yField])
                                totalValues += 1;
                        });

                        serieStability[d.group] = totalValues;
                    });
                }
            });

            //get best 
			let ratio = getRatio();
			let bestfit = null;
			if(ratio === 1) {
				bestfit = e.getBestDimension(width, height, areaCount);
			} else {
				bestfit = e.getBestDimension(width, height, areaCount, ratio);
			}
			
			//set width & hieght
			singleRectWidth = bestfit.width;
			singleRectHeight = bestfit.height;
			
            //switch multiple type to calculate min and max
            switch (multipleType) {
                case 'chart':
                    {
                        //calculate min and max values
                        minMeasure = d3.min(diagram.data, function (d) { return d3.min(d.values, function (v) { return parseFloat(v[measureField]); }); });
                        maxMeasure = d3.max(diagram.data, function (d) { return d3.max(d.values, function (v) { return parseFloat(v[measureField]); }); });
                        minX = d3.min(diagram.data, function (d) { return d3.min(d.values, function (v) { return parseFloat(v[xField]); }); });
                        maxX = d3.max(diagram.data, function (d) { return d3.max(d.values, function (v) { return parseFloat(v[xField]); }); });

                        //check chart type is bar or column
                        let hasBars = false;
                        diagram.series.forEach(function (d) {
                            if (d.type === 'bar' || d.type === 'column')
                                hasBars = true;
                        });

                        //iterate all data
                        for (let i = 0; i < actualData.length; i++) {
                            //get current set
                            currentSet = actualData[i];

                            //check values in current set
                            if (currentSet.values && currentSet.values.length > 0) {
                                //iterate all values in current set
                                for (let k = 0; k < currentSet.values.length; k++) {
                                    //get current data
                                    let currentData = currentSet.values[k];
                                    let summarized = 0;

                                    //check if current serie is grouped
                                    if (currentSerie.grouped) {
                                        //iterate all keys in current dataset
                                        let currentVal = 0;
                                        for (let key in currentData) {
                                            //push the current measure into the stack
                                            if (key !== xField) {
                                                currentVal = parseFloat(currentData[key]);
                                                currentMeasures.push(currentVal);
                                                summarized += currentVal;
                                            }
                                        }
                                    }

                                    //add to stacked
                                    currentMeasuresSummarized.push(summarized);

                                    //push the current x values into the stack
                                    if (xValues.indexOf(currentData[xField]) === -1 && hasBars)
                                        xValues.push(currentData[xField]);
                                }
                            }
                        }

                        //set min and max measure
                        minMeasure = d3.min(currentMeasures);
                        maxMeasure = diagram.yAxis.stacked ? (d3.max(currentMeasuresSummarized) * 1) : (d3.max(currentMeasures) * 1.2);

                        //sort x values
                        xValues.sort();
                    }
                    break;
                case 'diagram':
                    {
                        //declare a stack to store min and max values
                        let minValueSets = [],
                            maxValueSets = [];

                        //switch serie type
                        switch (currentSerie.type) {
                            case 'circlePacking':
                            case 'circlepacking':
                            case 'dendrogram':
                            case 'force':
                            case 'sunburst':
                            case 'treemap':
                                {
                                    //calculate min and max values
                                    minMeasure = diagram.domains.minY;
                                    maxMeasure = diagram.domains.maxY;
                                }
                                break;
                            default:
                                {
                                    //calculate min and max values
                                    minMeasure = diagram.domains.minY;
                                    maxMeasure = diagram.domains.maxY;
                                    minX = diagram.domains.minX;
                                    maxX = diagram.domains.maxX;
                                }
                                break;
                        }
                    }
                    break;
                case 'map':
                    {
                        switch (currentSerie.type) {
                            case 'standardMap':
                            case 'tileMap':
                                {
                                    //calculate min and max values
                                    minMeasure = d3.min(diagram.data, function (d) { return d3.min(d.values, function (v) { return parseFloat(v[measureField]); }); });
                                    maxMeasure = d3.max(diagram.data, function (d) { return d3.max(d.values, function (v) { return parseFloat(v[measureField]); }); });
                                }
                                break;
                            case 'ddCartogram':
                            case 'contCartogram':
                                {
                                    //calculate min and max values
                                    minMeasure = d3.min(diagram.data, function (d) { return d3.min(d.values, function (v) { return parseFloat(v[measureField]); }); });
                                    maxMeasure = d3.max(diagram.data, function (d) { return d3.max(d.values, function (v) { return parseFloat(v[measureField]); }); });
                                    //calculate min and max values
                                    minColor = d3.min(diagram.data, function (d) { return d3.min(d.values, function (v) { return parseFloat(v[colorField]); }); });
                                    maxColor = d3.max(diagram.data, function (d) { return d3.max(d.values, function (v) { return parseFloat(v[colorField]); }); });
                                }
                                break;
                            case 'routeMap':
                            case 'densityMap':
                                {
                                    if (diagram.yAxis.locked) {
                                        calculateDiff();
                                    }
                                }
                                break;
                            case 'locationMap':
                                {
                                    //calculate min and max values
                                    minMeasure = d3.min(diagram.data, function (d) { return d3.min(d.values, function (v) { return parseFloat(v[measureField]); }); });
                                    maxMeasure = d3.max(diagram.data, function (d) { return d3.max(d.values, function (v) { return parseFloat(v[measureField]); }); });
                                    if (diagram.yAxis.locked) {
                                        calculateDiff();
                                    }

                                }
                                break;
                        }
                    }
                    break;
            }

            //calcualtes difference
            function calculateDiff() {
                //set diffs
                diffDegrees = [0, 0];

                //declare a stack to store min and max values
                let latDiffs = [],
                    longDiffs = [];

                //iterate dataset
                actualData.forEach(function (d) {
                    let minLat = 0,
                        maxLat = 0,
                        minLong = 0,
                        maxLong = 0;

                    //calculate min and max values
                    minLat = d3.min(d.values, function (v) { return parseFloat(v[latField]); });
                    maxLat = d3.max(d.values, function (v) { return parseFloat(v[latField]); });

                    //calculate min and max values
                    minLong = d3.min(d.values, function (v) { return parseFloat(v[longField]); });
                    maxLong = d3.max(d.values, function (v) { return parseFloat(v[longField]); });

                    //calculate difference of latitude
                    if (minLat > 0 && maxLat > 0 || minLat < 0 && maxLat < 0) {
                        latDiffs.push(Math.abs(maxLat - minLat));
                    }
                    else {
                        latDiffs.push(Math.abs(maxLat) + Math.abs(minLat));
                    }

                    //calculate difference of longitude
                    if (minLong > 0 && maxLong > 0 || minLong < 0 && maxLong < 0) {
                        longDiffs.push(Math.abs(maxLong - minLong));
                    }
                    else {
                        longDiffs.push(Math.abs(maxLong) + Math.abs(minLong));
                    }
                });

                //set min and max measure
                diffDegrees[0] = d3.max(latDiffs);
                diffDegrees[1] = d3.max(longDiffs);
            }
        }

        //creates map for the given section
        function createMap(id, dataSet, index) {
            //declare needed variables
            let mapCreator = currentSerie.type,
                currentTooltip = e.clone(diagram.tooltip),
                mapTitle = dataSet[currentSerie.multipleField] || dataSet.group,
                currentMapSerie = e.clone(currentSerie),
                tempLegend = e.clone(diagram.legend),
                yAxis = {
                    min: diagram.yAxis.min ? diagram.yAxis.min : minMeasure,
                    max: diagram.yAxis.max ? diagram.yAxis.max : maxMeasure,
                    colorMin: diagram.yAxis.colorMin ? diagram.yAxis.colorMin : minColor,
                    colorMax: diagram.yAxis.colorMax ? diagram.yAxis.colorMax : maxColor,
                    diffDegrees: diffDegrees
                },
                visObject;

            //declare map options
            currentMapSerie.labelsEnabled = true;
            currentMapSerie.labelFormat = currentMapSerie.labelFormat.replaceAll('{multiple}', dataSet.group);
            currentTooltip.format = currentTooltip.format.replaceAll('{multiple}', dataSet.group);

            if (initialLegendValue) {
                yAxis.min = diagram.yAxis.min ? diagram.yAxis.min : null;
                yAxis.max = diagram.yAxis.max ? diagram.yAxis.max : null;
            } else {
                tempLegend.enabled = false;
            }

            let mapOptions = {
                container: id,
                data: dataSet.values,
                backColor: diagram.backColor,
                title: { content: mapTitle, position: diagram.title.position },
                tooltip: currentTooltip,
                legend: tempLegend,
                animation: diagram.animation,
                zoomable: diagram.zoomable,
                series: [currentMapSerie],
                width: singleRectWidth,
                height: singleRectHeight,
                columnNames: diagram.columnNames,
                hideZoom: true,
                fromMultiples: true,
                yAxis: yAxis
            };

            //create map
            if (mapCreator === 'routeMap' || mapCreator === 'locationMap' || mapCreator === 'densityMap')
                vectormaps.push(eve[mapCreator](mapOptions));
            else
                visObject = eve[mapCreator](mapOptions);

            if (visObject && visObject.simulations) {
                visObject.simulations.forEach(function (s) {
                    diagram.simulations.push(s);
                });
            }
        }

        //creates gauge for the given section
        function createGauge(id, dataSet, index) {

        }

        //creates diagram for the given section
        function createDiagram(id, dataSet, index) {
            //declare needed variables
            let chartTitle = dataSet[currentSerie.multipleField] || dataSet.group,
                chartSeries = [],
                dataColors = {},
                currentTooltip = e.clone(diagram.tooltip),
                currentChartSerie = null,
                tempLegend = e.clone(diagram.legend),
                visObject;

            if (initialLegendValue) {
                tempLegend.enabled = initialLegendValue;
            } else {
                tempLegend.enabled = false;
            }

            //create data colors
            if (diagram.manualLegendValues) {
                diagram.manualLegendValues.forEach(function (m, i) {
                    if (m) {
                        if (tempLegend.legendColors.length > 0)
                            dataColors[m.toString()] = e.matchGroup(m.toString(), tempLegend.legendColors, 'color');
                        else
                            dataColors[m.toString()] = i >= e.colors.length ? e.randColor() : e.colors[i];
                    }
                });
            } else {
                dataColors = null;
            }

            //declare chart options
            currentTooltip.format = currentTooltip.format.replaceAll('{multiple}', dataSet.group);

            //set diagram specific options
            switch (currentSerie.type) {
                case 'abacus':
                case 'streamGraph':
                case 'streamgraph':
                    {
                        //iterate diagram series
                        diagram.series.forEach(function (serie, index) {
                            //set current chart serie
                            currentChartSerie = e.clone(serie);
                            currentChartSerie.labelFormat = currentChartSerie.labelFormat.replaceAll('{multiple}', dataSet.group);

                            //declare y field name
                            let yFieldName = currentChartSerie.yField,
                                currentSerieColor = '';

                            //create serie names
                            if (currentChartSerie.yField && currentChartSerie.yField !== '')
                                yFieldName = currentChartSerie.yField;
                            else if (currentChartSerie.valueField && currentChartSerie.valueField !== '')
                                yFieldName = currentChartSerie.valueField;
                            else if (currentChartSerie.measureField && currentChartSerie.measureField !== '')
                                yFieldName = currentChartSerie.measureField;

                            //check in legend colors
                            let currentItem = e.filterSensitive(diagram.legend.legendColors, 'value', yFieldName);

                            //check current items length
                            if (currentItem.length > 0) {
                                //set current serie color
                                currentSerieColor = currentItem[0].color;
                            } else {
                                //set current serie color
                                currentSerieColor = index >= e.colors.length ? e.randColor() : e.colors[index];
                            }

                            //set serie color
                            if (currentChartSerie.color === '')
                                currentChartSerie.color = currentSerieColor;

                            //set slice stroke color
                            if (currentSerieColor.sliceStrokeColor === '')
                                currentSerieColor.sliceStrokeColor = currentSerieColor;

                            //set current serie as chart serie
                            chartSeries.push(currentChartSerie);
                        });
                    }
                    break;
                case 'circlePacking':
                case 'circlepacking':
                case 'dendrogram':
                case 'force':
                case 'sunburst':
                case 'treemap':
                    {
                        //clear x field
                        xField = '';

                        //clone current serie
                        currentChartSerie = e.clone(currentSerie);
                        currentChartSerie.color = index >= e.colors.length ? e.randColor() : e.colors[index];
                        currentChartSerie.labelFormat = currentChartSerie.labelFormat.replaceAll('{multiple}', dataSet.group);
                        currentChartSerie.dataColors = dataColors;

                        //set current serie as chart serie
                        chartSeries.push(currentChartSerie);
                    }
                    break;
                default:
                    {
                        //clone current serie
                        currentChartSerie = e.clone(currentSerie);
                        currentChartSerie.color = index >= e.colors.length ? e.randColor() : e.colors[index];
                        currentChartSerie.labelFormat = currentChartSerie.labelFormat.replaceAll('{multiple}', dataSet.group);
                        currentChartSerie.dataColors = dataColors;

                        //set current serie as chart serie
                        chartSeries.push(currentChartSerie);
                    }
                    break;
            }

            //set x axis options
            let xAxisOptions = diagram.xAxis,
                yAxisOptions = diagram.yAxis;

            //update x axis for edges
            xAxisOptions.min = diagram.xAxis.locked ? minX : (diagram.xAxis.min ? diagram.xAxis.min : null);
            xAxisOptions.max = diagram.xAxis.locked ? maxX : (diagram.xAxis.max ? diagram.xAxis.max : null);

            if (currentSerie.type !== 'mirroredBars') {
                xAxisOptions.xValues = (diagram.yAxis.locked && diagram.domains.xValues) ? diagram.domains.xValues : null;

                //update y axis for edges
                yAxisOptions.min = diagram.yAxis.locked ? minMeasure : (diagram.yAxis.min ? diagram.yAxis.min : null);
                yAxisOptions.max = diagram.yAxis.locked ? maxMeasure : (diagram.yAxis.max ? diagram.yAxis.max : null);
            } else {
                //update y axis for edges
                yAxisOptions.min = diagram.yAxis.locked ? (diagram.yAxis.min ? diagram.yAxis.min : minMeasure) : minMeasure;
                yAxisOptions.max = diagram.yAxis.locked ? (diagram.yAxis.max ? diagram.yAxis.max : maxMeasure) : maxMeasure;
            }

            //update domains
            if (yAxisOptions.min && yAxisOptions.max) {
                diagram.domains.minY = yAxisOptions.min;
                diagram.domains.maxY = yAxisOptions.max;
            }

            //chart dataset
            let chartDataset = dataSet.values.dataArray || dataSet.values;

            //create chart options
            let chartOptions = {
                container: id,
                data: dataSet.values.dataArray || dataSet.values,
                backColor: diagram.backColor,
                title: { content: chartTitle, position: diagram.title.position },
                tooltip: currentTooltip,
                legend: tempLegend,
                animation: diagram.animation,
                zoomable: diagram.zoomable,
                xField: xField,
                series: chartSeries,
                width: singleRectWidth,
                height: singleRectHeight,
                fromMultiples: true,
                maxMeasureValue: (diagram.domains.minY && diagram.domains.maxY) ? diagram.domains.maxY : null,
                columnNames: diagram.columnNames,
                xAxis: xAxisOptions,
                yAxis: yAxisOptions
            };

            //create chart
            visObject = eve[currentSerie.type](chartOptions);

            if (visObject.simulations) {
                visObject.simulations.forEach(function (s) {
                    diagram.simulations.push(s);
                });
            }
        }

        //creates chart for the given section
        function createChart(id, dataSet, index) {
            //declare needed variables
            let chartCreator = currentSerie.type + 'Chart',
                chartTitle = dataSet[currentSerie.multipleField] || dataSet.group,
                chartSeries = [],
                dataColors = {},
                currentTooltip = e.clone(diagram.tooltip),
                currentChartSerie = null,
                tempLegend = e.clone(diagram.legend);

            //check series
            diagram.series.forEach(function (s) {
                if (s.type !== currentSerie.type)
                    chartCreator = 'combinationChart';
            });

            //disable temp legend
            tempLegend.enabled = false;

            //create data colors
            if (diagram.manualLegendValues) {
                diagram.manualLegendValues.forEach(function (m, i) {
                    if (tempLegend.legendColors.length > 0)
                        dataColors[m.toString()] = e.matchGroup(m.toString(), tempLegend.legendColors, 'color');
                    else
                        dataColors[m.toString()] = i >= e.colors.length ? e.randColor() : e.colors[i];
                });
            }

            if (tempLegend.legendColors) {
                tempLegend.legendColors.forEach(function (d) {
                    dataColors[d.value.toString()] = d.color;
                });
            }

            //iterate all x values
            diagram.series.forEach(function (s, i) {
                //set current chart serie
                currentChartSerie = e.clone(s);
                currentChartSerie.xField = s.xField;
                currentChartSerie.yField = s.yField;
                currentChartSerie.dataColors = dataColors;
                currentChartSerie.color = i >= e.colors.length ? e.randColor() : e.colors[i];
                currentChartSerie.labelFormat = currentChartSerie.labelFormat.replaceAll('{multiple}', dataSet.group);

                //set current serie as chart serie
                chartSeries.push(currentChartSerie);
            });

            //declare chart options
            currentTooltip.format = currentTooltip.format.replaceAll('{multiple}', dataSet.group);

            //set x axis options
            let xAxisOptions = diagram.xAxis,
                yAxisOptions = diagram.yAxis;

            //update x axis for edges
            xAxisOptions.locked = diagram.xAxis.locked;
            xAxisOptions.min = diagram.xAxis.locked ? (diagram.xAxis.min != null ? diagram.xAxis.min : minX) : null;
            xAxisOptions.max = diagram.xAxis.locked ? (diagram.xAxis.max != null ? diagram.xAxis.max : maxX) : null;

            //update y axis for edges
            yAxisOptions.locked = diagram.yAxis.locked;
            yAxisOptions.min = diagram.yAxis.locked ? (diagram.yAxis.min != null ? diagram.yAxis.min : minMeasure) : null;
            yAxisOptions.max = diagram.yAxis.locked ? (diagram.yAxis.max != null ? diagram.yAxis.max : maxMeasure) : null;
            yAxisOptions.minRight = diagram.yAxis.locked ? (diagram.yAxis.minRight != null ? diagram.yAxis.minRight : minMeasure) : null;
            yAxisOptions.maxRight = diagram.yAxis.locked ? (diagram.yAxis.maxRight != null ? diagram.yAxis.maxRight : maxMeasure) : null;

            if (diagram.yAxis.stacked && diagram.yAxis.locked) {
                //iterate all data rows
                let rowTotals = [];
                for (let setIndex = 0; setIndex < diagram.data.length; setIndex++) {
                    //iterate all data values
                    for (let rowIndex = 0; rowIndex < diagram.data[setIndex].values.length; rowIndex++) {
                        //get current row
                        let currentRow = diagram.data[setIndex].values[rowIndex];
                        let rowTotal = 0;
                        diagram.series.forEach(function (sr) {
                            rowTotal += currentRow[sr.yField];
                        });
                        rowTotals.push(rowTotal);
                    }
                }

                //let maxRowTotals = d3.max(rowTotals);
                yAxisOptions.max = diagram.domains.maxY;//maxRowTotals;
            }

            //set y axis options stacked
            let serieKeys = Object.keys(serieStability);
            let allIsOne = true;
            serieKeys.forEach(function (sk) {
                if (serieStability[sk] > 1)
                    allIsOne = false;
            });

            if (allIsOne)
                yAxisOptions.stacked = false;

            //create chart options
            let chartOptions = {
                container: id,
                data: dataSet.values,
                backColor: diagram.backColor,
                title: { content: chartTitle, position: diagram.title.position },
                tooltip: currentTooltip,
                legend: tempLegend,
                animation: diagram.animation,
                zoomable: diagram.zoomable,
                xField: xField,
                series: chartSeries,
                width: singleRectWidth,
                height: singleRectHeight,
                fromMultiples: true,
                columnNames: diagram.columnNames,
                xAxis: xAxisOptions,
                yAxis: yAxisOptions
            };

            if (chartOptions.yAxis.values && chartOptions.yAxis.values.length === 1) {
                if (chartOptions.yAxis.values[0] == "")
                    chartOptions.yAxis.values = null;
            }

            //create chart
            eve[chartCreator](chartOptions);
        }

        //creates a div for each multiple
        function createSections(keepAxis) {
            //clear inner content
            sectionContainer = d3.select('#' + diagram.innerContainer)
                .style('width', width + 'px')
                .style('height', height + 'px')
                .style('position', 'relative')
                .html('');

            //set section row index
            sectionRowIndex = 0;

            //compare dimension
            if (singleRectWidth < 60 || singleRectHeight < 60) {
                sectionContainer.html('&nbsp;&nbsp;<i class="fa fa-warning"></i> Not enough space to create multiples. Please resize the container!');
                return;
            } else {
                sectionContainer.html('');
            }

            //check if current set is ok
            let checkCurrentSet = function (currentSet) {
                let setStable = false;
                if (e.getType(currentSet) === 'array') {
                    if (currentSet.values && currentSet.values.length > 0)
                        setStable = true;
                } else {
                    if (currentSet)
                        setStable = true;
                }
                return setStable;
            }

            //iterate all data
            let colsPerRow = Math.floor(width / singleRectWidth);
            actualData.forEach(function (currentSet, index) {
                if (checkCurrentSet(currentSet)) {
                    //set section id
                    sectionID = diagram.container + '_' + index;

                    //calculate section x position
                    sectionX = (index % colsPerRow) * singleRectWidth;

                    //calculate section row index
                    if (index >= colsPerRow && index % colsPerRow === 0) {
                        sectionRowIndex++;
                    }

                    //calculate section y position
                    sectionY = sectionRowIndex * singleRectHeight;

                    //insert div into the foreign object
					sectionContainer
                        .append('div')
                        .attr('id', sectionID)
                        .style('left', sectionX + 'px')
                        .style('top', sectionY + 'px')
                        .style('width', singleRectWidth + 'px')
                        .style('height', singleRectHeight + 'px');

                    //switch current section type
                    switch (multipleType) {
                        case 'chart':
                            createChart(sectionID, currentSet, index);
                            break;
                        case 'diagram':
                            createDiagram(sectionID, currentSet, index);
                            break;
                        case 'map':
                            createMap(sectionID, currentSet, index);
                            break;
                        case 'gauge':
                            createGauge(sectionID, currentSet, index);
                            break;
                    }

                    //set absolute
                    d3.select('#' + sectionID).style('position', 'absolute');
                }
            });

            //nullify sections
            diagram.tempSVG = sectionContainer;
            sectionContainer = null;
        }

        //calculate area, min and max values
        calculateEnvironment();
        createSections();

        //attach update method to diagram
        diagram.update = function (data, newTitle) {
            //remove container
            d3.select('#' + diagram.innerContainer).remove();

            //update options data
            options.data = eve.clone(data);

            //create diagram again
            options.title.content = newTitle;

            //re-create diagram
            diagram = e.multiples(options);
        };

        //attach clear content method to chart
        diagram.clear = function () {
            //remove container
            d3.select('#' + diagram.innerContainer).remove();
        };

        //draws the diagram into a canvas
        diagram.toCanvas = function (id) {
            if (!e.detectMS()) {
                /* create the promise for function response
                ** this is required for handling async canvas conversion
                */
                return new Promise(function (resolve) {
                    //export to png
                    domtoimage
                        .toPng(document.getElementById(diagram.container))
                        .then(function (dataUrl) {
                            let canvas = document.createElement('canvas'),
                                ctx = canvas.getContext('2d'),
                                img = new Image;
                            canvas.id = id + '-canvas';
                            img.onload = function () {
                                canvas.width = img.width;
                                canvas.height = img.height;
                                ctx.drawImage(img, 0, 0);
                                //return promise with canvas
                                resolve(canvas);
                            };
                            img.src = dataUrl;
                        });
                });
            } else {
                //get the that container
                let orgDiv = document.getElementById(diagram.container),
                    innerDiv = document.getElementById(diagram.innerContainer),
                    svgElements = orgDiv.querySelectorAll('.vis_svg'),
                    legendSvg = orgDiv.querySelectorAll('.legend_svg'),
                    canvasConverting = 0,
                    canvasConverted = 0,
                    canvas = null,
                    xml = '',
                    vectorDivs = [],
                    vectorCanvases = [],
                    canvases = [],
                    legendCanvases = [];

                if (vectormaps.length > 0) {
                    //replace map containers with canvas
                    vectormaps.forEach(function (m) {
                        //check if eve map exists
                        if (m) {
                            //increase control variable
                            canvasConverting++;
                            //get chart canvas
                            m.toCanvas(m.container).then(function (canvas) {
                                let contain = document.getElementById(canvas.id.split('-')[0]);
                                //insert canvas to html
                                contain.parentNode.insertBefore(canvas, contain);
                                //remove container from html
                                contain.parentNode.removeChild(contain);
                                //add the canvas and div to arrays
                                vectorDivs.push(contain);
                                vectorCanvases.push(canvas);
                                //increase control variable
                                canvasConverted++;

                            });
                        }
                    });
                }

                //replace all svgs with canvas
                for (let i = 0; i < svgElements.length; i++) {
                    //create the canvas
                    canvas = document.createElement("canvas");

                    //convert SVG into a XML string
                    xml = (new XMLSerializer()).serializeToString(svgElements[i]);
                    if (e.detectMS())
                        xml = xml.replace(/xmlns=\"http:\/\/www\.w3\.org\/2000\/svg\"/, '');

                    //increate indexer
                    canvasConverting++;

                    //draw the SVG onto a canvas
                    canvg(canvas, xml, { ignoreMouse: true, ignoreAnimation: true, renderCallback: function () { canvasConverted++; } });

                    //insert canvas to tempDiv
                    svgElements[i].parentNode.insertBefore(canvas, svgElements[i]);
                    svgElements[i].parentNode.removeChild(svgElements[i]);

                    //create stack
                    canvases.push(canvas);
                }

                for (let i = 0; i < legendSvg.length; i++) {
                    //create the canvas
                    canvas = document.createElement("canvas");
                    //convert SVG into a XML string
                    xml = (new XMLSerializer()).serializeToString(legendSvg[i]);
                    if (e.detectMS())
                        xml = xml.replace(/xmlns=\"http:\/\/www\.w3\.org\/2000\/svg\"/, '');

                    //increase indexr
                    canvasConverting++;

                    //draw the SVG onto a canvas
                    canvg(canvas, xml, { ignoreMouse: true, ignoreAnimation: true, renderCallback: function () { canvasConverted++; } });

                    //insert canvas to tempDiv
                    legendSvg[i].parentNode.insertBefore(canvas, legendSvg[i]);
                    legendSvg[i].parentNode.removeChild(legendSvg[i]);
                    legendCanvases.push(canvas);
                }

                //return a promise
                return new Promise(function (resolve) {
                    let canvasInterval = setInterval(function () {
                        if (canvasConverted === canvasConverting) {
                            //convert the final clone to canvas
                            html2canvas(orgDiv).then(function (canvas) {
                                vectorCanvases.forEach(function (c, i) {
                                    //replace div with canvas
                                    c.parentNode.insertBefore(vectorDivs[i], c);
                                    c.parentNode.removeChild(c);
                                });
                                //replace canvases with divs
                                canvases.forEach(function (c, i) {
                                    //replace div with canvas
                                    c.parentNode.insertBefore(svgElements[i], c);
                                    c.parentNode.removeChild(c);
                                });
                                legendCanvases.forEach(function (c, i) {
                                    //replace div with canvas
                                    c.parentNode.insertBefore(legendSvg[i], c);
                                    c.parentNode.removeChild(c);
                                });
                                //return promise with canvas
                                canvas.id = id + '-canvas';
                                resolve(canvas);
                            });
                            clearInterval(canvasInterval);
                        }
                    }, 500);
                });
            }
        };

        //returns the diagram image
        diagram.toImage = function () {
            if (!e.detectMS()) {
                /* create the promise for function response
                ** this is required for handling async canvas conversion
                */
                return new Promise(function (resolve) {
                    //export to png
                    domtoimage
                        .toPng(document.getElementById(diagram.container))
                        .then(function (dataUrl) {
                            resolve(dataUrl);
                        });
                });
            } else {
                //get the that container
                let orgDiv = document.getElementById(diagram.container),
                    innerDiv = document.getElementById(diagram.innerContainer),
                    svgElements = orgDiv.querySelectorAll('.vis_svg'),
                    legendSvg = orgDiv.querySelectorAll('.legend_svg'),
                    canvasConverting = 0,
                    canvasConverted = 0,
                    canvas = null,
                    xml = '',
                    vectorDivs = [],
                    vectorCanvases = [],
                    canvases = [],
                    legendCanvases = [];

                if (vectormaps.length > 0) {
                    //replace map containers with canvas
                    vectormaps.forEach(function (m) {
                        //check if eve map exists
                        if (m) {
                            //increase control variable
                            canvasConverting++;
                            //get chart canvas
                            m.toCanvas(m.container).then(function (canvas) {
                                let contain = document.getElementById(canvas.id.split('-')[0]);
                                //insert canvas to html
                                contain.parentNode.insertBefore(canvas, contain);
                                //remove container from html
                                contain.parentNode.removeChild(contain);
                                //add the canvas and div to arrays
                                vectorDivs.push(contain);
                                vectorCanvases.push(canvas);
                                //increase control variable
                                canvasConverted++;

                            });
                        }
                    });
                }

                //replace all svgs with canvas
                for (let i = 0; i < svgElements.length; i++) {
                    //create the canvas
                    canvas = document.createElement("canvas");
                    //convert SVG into a XML string
                    xml = (new XMLSerializer()).serializeToString(svgElements[i]);
                    if (e.detectMS())
                        xml = xml.replace(/xmlns=\"http:\/\/www\.w3\.org\/2000\/svg\"/, '');
                    canvasConverting++;
                    //draw the SVG onto a canvas
                    canvg(canvas, xml, { ignoreMouse: true, ignoreAnimation: true, renderCallback: function () { canvasConverted++; } });

                    //insert canvas to tempDiv
                    svgElements[i].parentNode.insertBefore(canvas, svgElements[i]);
                    svgElements[i].parentNode.removeChild(svgElements[i]);
                    canvases.push(canvas);
                }

                for (let i = 0; i < legendSvg.length; i++) {
                    //create the canvas
                    canvas = document.createElement("canvas");
                    //convert SVG into a XML string
                    xml = (new XMLSerializer()).serializeToString(legendSvg[i]);
                    if (e.detectMS())
                        xml = xml.replace(/xmlns=\"http:\/\/www\.w3\.org\/2000\/svg\"/, '');
                    canvasConverting++;
                    //draw the SVG onto a canvas
                    canvg(canvas, xml, { ignoreMouse: true, ignoreAnimation: true, renderCallback: function () { canvasConverted++; } });
                    //insert canvas to tempDiv
                    legendSvg[i].parentNode.insertBefore(canvas, legendSvg[i]);
                    legendSvg[i].parentNode.removeChild(legendSvg[i]);
                    legendCanvases.push(canvas);
                }

                /* create the promise for function response
                ** this is required for handling async canvas conversion
                */

                return new Promise(function (resolve) {
                    let canvasInterval = setInterval(function () {
                        if (canvasConverted === canvasConverting) {
                            //convert the final clone to canvas
                            html2canvas(orgDiv).then(function (canvas) {
                                //replace canvases with divs
                                vectorCanvases.forEach(function (c, i) {
                                    //replace div with canvas
                                    c.parentNode.insertBefore(vectorDivs[i], c);
                                    c.parentNode.removeChild(c);
                                });
                                canvases.forEach(function (c, i) {
                                    //replace div with canvas
                                    c.parentNode.insertBefore(svgElements[i], c);
                                    c.parentNode.removeChild(c);
                                });
                                legendCanvases.forEach(function (c, i) {
                                    //replace div with canvas
                                    c.parentNode.insertBefore(legendSvg[i], c);
                                    c.parentNode.removeChild(c);
                                });
                                //return promise with canvas
                                resolve(canvas.toDataURL('image/png'));
                            });
                            clearInterval(canvasInterval);
                        }
                    }, 500);
                });
            }
        };

        //return multiples diagram
        return diagram;
    }

    //gets multiple type
    function getMultiplesType(serie) {
        switch (serie.type) {
            case 'area':
            case 'areaChart':
            case 'areachart':
            case 'bar':
            case 'barChart':
            case 'barchart':
            case 'bubble':
            case 'bubbleChart':
            case 'bubblechart':
            case 'column':
            case 'columnChart':
            case 'columnchart':
            case 'donut':
            case 'donutChart':
            case 'donutchart':
            case 'funnel':
            case 'funnelChart':
            case 'funnelchart':
            case 'line':
            case 'lineChart':
            case 'linechart':
            case 'pie':
            case 'pieChart':
            case 'piechart':
            case 'pyramid':
            case 'pyramidChart':
            case 'pyramidchart':
            case 'radar':
            case 'radarChart':
            case 'radarchart':
            case 'scatter':
            case 'scatterChart':
            case 'scatterchart':
            case 'combinationChart':
            case 'combinationchart':
                return 'chart';
            case 'standardMap':
            case 'tileMap':
            case 'ddCartogram':
            case 'locationMap':
            case 'routeMap':
            case 'densityMap':
            case 'contCartogram':
            case 'standardmap':
            case 'tilemap':
            case 'ddcartogram':
            case 'locationmap':
            case 'routemap':
            case 'densitymap':
            case 'contcartogram':
                return 'map';
            case 'standardGauge':
            case 'dialGauge':
            case 'digitalGauge':
            case 'linearGauge':
            case 'standardgauge':
            case 'dialgauge':
            case 'digitalgauge':
            case 'lineargauge':
                return 'gauge';
            default:
                return 'diagram';
        }
    }

    //attach area chart method into the eve
    e.multiples = function (options) {
        options.type = 'multiples';

        //stack the options to the visualizations stack
        e.visualizations.push(options);

        return new multiplesDiagram(options);
    };
})(eve);
