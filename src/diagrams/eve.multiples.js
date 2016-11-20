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
        //declare needed variables
        var diagram = eve.base.init(options),
            currentSerie = diagram.series[0],
            areaCount = 0,
            rectCount = 0,
            width = diagram.plot.width,
            height = diagram.plot.height,
            maxPrimeFactor = 0,
            singleRectWidth = 0,
            singleRectHeight = 0,
            minMeasure = 0,
            maxMeasure = 0,
            minX = 0,
            maxX = 0,
            currentMeasureValue = 0,
            tempForeign = null,
            measureField = currentSerie.yField || currentSerie.measureField,
            sectionX = 0,
            sectionY = 0,
            sectionRowIndex = 0,
            sectionID = '',
            multipleType = getMultiplesType(),
            xField = currentSerie.xField || currentSerie.labelField;
            
        //makes necessary calculations to create the diagram
        function calculateEnvironment() {
            //calculate data area count
            diagram.data.forEach(function (d) {
                if (d.values.length && d.values.length > 0)
                    areaCount++;
            });

            //calculate single diagram area
            rectCount = (e.isPrime(areaCount) ? areaCount + 1 : areaCount);
            maxPrimeFactor = d3.max(e.getPrimeFactors(rectCount));

            //check max prime factor
            if (maxPrimeFactor === 2) maxPrimeFactor = rectCount / 2;

            //check whehther the data length is 2
            if (areaCount === 2) {
                //check whether the width > height
                if (width < height) {
                    singleRectHeight = Math.floor(height / 2);
                    singleRectWidth = Math.floor(width - 5);
                } else {
                    singleRectHeight = Math.floor(height);
                    singleRectWidth = Math.floor(width / 2);
                }
            } else {
                //chec whether the width > height
                if (width < height) {
                    singleRectHeight = Math.floor(height / maxPrimeFactor - 1);
                    singleRectWidth = Math.floor((width - 5) / (rectCount / maxPrimeFactor) - 1);
                } else {
                    singleRectHeight = Math.floor(height / (rectCount / maxPrimeFactor) - 1);
                    singleRectWidth = Math.floor((width) / maxPrimeFactor);
                }
            }

            //calculate min and max values
            minMeasure = d3.min(diagram.data, function (d) { return d3.min(d.values, function (v) { return parseFloat(v[measureField]); }); });
            maxMeasure = d3.max(diagram.data, function (d) { return d3.max(d.values, function (v) { return parseFloat(v[measureField]); }); });
            minX = d3.min(diagram.data, function (d) { return d3.min(d.values, function (v) { return parseFloat(v[xField]); }); });
            maxX = d3.max(diagram.data, function (d) { return d3.max(d.values, function (v) { return parseFloat(v[xField]); }); });

            //check whether the group field is not empty
            if (currentSerie.groupField !== '') {
                //minify max measure
                maxMeasure = Number.MIN_VALUE;

                //iterate all data to calculate the max measure
                diagram.data.forEach(function (currentSet) {
                    if (currentSet.values && currentSet.values.length > 0) {
                        currentSet.values.forEach(function (currentData) {
                            for (var key in currentData) {
                                if (key !== xField) {
                                    currentMeasureValue = parseFloat(currentData[key]);
                                    if (!isNaN(currentMeasureValue) && currentMeasureValue > maxMeasure)
                                        maxMeasure = currentMeasureValue;
                                }
                            }
                        });
                    }
                });

                //update min measure
                minMeasure = maxMeasure;

                //iterate all data to calculate the max measure
                diagram.data.forEach(function (currentSet) {
                    if (currentSet.values && currentSet.values.length > 0) {
                        currentSet.values.forEach(function (currentData) {
                            for (var key in currentData) {
                                if (key !== xField) {
                                    currentMeasureValue = parseFloat(currentData[key]);
                                    if (!isNaN(currentMeasureValue) && currentMeasureValue < minMeasure)
                                        minMeasure = currentMeasureValue;
                                }
                            }
                        });
                    }
                });
            }
        }

        //gets multiple type
        function getMultiplesType() {
            switch(currentSerie.type) {
                case 'area':
                case 'bar':
                case 'bubble':
                case 'column':
                case 'donut':
                case 'funnel':
                case 'line':
                case 'pie':
                case 'pyramid':
                case 'scatter':
                    return 'chart';
                case 'map':
                    return 'map';
                case 'gauge':
                    return 'gauge';
                default:
                    return 'diagram';
            }
        }

        //creates diagram for the given section
        function createDiagram(id, dataSet, index) {

        }

        //creates map for the given section
        function createMap(id, dataSet, index) {
            
        }

        //creates gauge for the given section
        function createGauge(id, dataSet, index) {
            
        }

        //creates chart for the given section
        function createChart(id, dataSet, index) {
            //declare needed variables
            var chartCreator = currentSerie.type + 'Chart',
                chartTitle = dataSet[currentSerie.multipleField];

            //declare chart options
            var chartOptions = {
                container: id,
                data: dataSet.values,
                backColor: diagram.backColor,
                title: {
                    content: chartTitle,
                    position: diagram.title.position
                },
                tooltip: diagram.tooltip,
                legend: { enabled: false },
                animation: diagram.animation,
                zoomable: diagram.zoomable,
                xField: xField,
                series: [currentSerie],
                width: singleRectWidth,
                height: singleRectHeight
            };

            //create chart
            eve[chartCreator](chartOptions);
        }

        //creates a div for each multiple
        function createSections() {
            //clear svg content
            diagram.svg.selectAll('*').remove();
            
            //iterate all data
            diagram.data.forEach(function (currentSet, index) {
                if (currentSet.values && currentSet.values.length > 0) {
                    //set section id
                    sectionID = diagram.container + '_' + index;

                    //calculate section x position
                    sectionX = (index % maxPrimeFactor) * singleRectWidth;

                    //calculate section row index
                    if(index >= maxPrimeFactor && index % maxPrimeFactor === 0)
                        sectionRowIndex++;

                    //calculate section y position
                    sectionY = sectionRowIndex * singleRectHeight;
                    
                    //create foreign object for current set
                    tempForeign = diagram.svg
                        .append('foreignObject')
                        .attr('width', singleRectWidth)
                        .attr('height', singleRectHeight)
                        .attr('x', sectionX)
                        .attr('y', sectionY);

                    //insert div into the foreign object
                    tempForeign.append('xhtml:div')
                        .attr('id', sectionID)
                        .style('width', singleRectWidth)
                        .style('height', singleRectHeight);

                    //switch current section type
                    switch(multipleType) {
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
                }
            });
        }

        //calculate area, min and max values
        calculateEnvironment();
        createSections();

        //attach update method to diagram
        diagram.update = function(data) {
            //normalize iterative values
            areaCount = 0;
            sectionRowIndex = 0;

            //update diagram data
            diagram.data = data;

            //calculate area, min and max values
            calculateEnvironment();
            createSections();
        };

        //draws the diagram into a canvas
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

        //returns the diagram image 
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

        //return multiples diagram
        return diagram;
    }

    //attach area chart method into the eve
    e.multiples = function (options) {
        return new multiplesDiagram(options);
    };
})(eve);