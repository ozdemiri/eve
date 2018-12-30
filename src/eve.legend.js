/*!
 * eve.legend.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Base class for chart legend.
 */
(function (e) {
    /**
     * Legend Types:
     * default, ranged, gradient, scaled
     *
     * Icon Types:
     * square, circle, cross, diamond, star, triangle, wye
     */

    //define legend class
    function chartLegend(chart) {
        //declare needed variables
        let legendContainer = null,
            legendSvg = null,
            legendG = null,
            width = 0,
            height = 0,
            plot = {
                width: 0,
                height: 0,
                left: chart.margin.left,
                top: chart.margin.top,
                right: chart.margin.right,
                bottom: chart.margin.bottom
            },
            sizes = {
                maxWidth: chart.plot.width / 4,
                maxHeight: chart.plot.height / 4,
                minWidth: chart.plot.width / 15,
                minHeight: chart.plot.height / 15,
                containerWidth: 0,
                containerHeight: 0,
                svgWidth: 0,
                svgHeight: 0
            },
            rangedLegend = {
                width: 0,
                height: 0,
                blockWidth: 0,
                blockHeight: 0,
                dimension: 20,
                svg: null
            },
            defaultLegend = {
                width: 0,
                height: 0,
                singleHeight: 0,
                legendValues: [],
                icons: null,
                texts: null,
                svg: null
            },
            gradientLegend = {
                width: 0,
                height: 0,
                percentage: 0,
                dimension: 20,
                blockWidth: 0,
                blockHeight: 0,
                minMax: [],
                minLabel: null,
                maxLabel: null,
                gradient: null,
                svg: null
            },
            scaledLegend = {
                width: 0,
                height: 0,
                band: 0,
                legendValues: [],
                rScale: null,
                icons: null,
                lines: null,
                texts: null,
                svg: null
            },
            tempTextValue = '',
            tempTextValueLength = 0,
            tempTextSVG = null,
            tempTextSVGOffset = null,
            legendIconOffset = 5,
            currentItem = null,
            filteredList = null,
            groupValues = [],
            newChartSeries = [],
            xPos = 0,
            yPos = 0,
            tempOffset = null,
            tempDimensions = null,
            twoLegends = false,
            that = this;

        //declare range and measure variables to calculate legend
        let minMeasure = 0;
        let maxMeasure = 0;
        let minX = 0;
        let maxX = 0;
        let updateMultipleDataForLegend = function () {
            //iterate data set to create actual data
            let actualData = [];
            let currentSerie = chart.series[0];
            chart.data.forEach(function (d) {
                if (e.getType(d.values) === 'array') {
                    if (d.values.length && d.values.length > 0)
                        actualData.push(e.clone(d));
                } else {
                    if (d.values && d.values.baseData && d.values.baseData.length && d.values.baseData.length > 0)
                        actualData.push(e.clone(d));
                }
            });

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
                        //iterate all actual data to calculate min max values
                        actualData.forEach(function (currentSet) {
                            //get current data aray
                            currentDataArray = currentSet.values.dataArray || currentSet.values;

                            //get current min and max
                            let currentMinMax = chart.getMinMaxValueForTree(currentSerie, currentDataArray);

                            //push min and max value sets
                            minValueSets.push(currentMinMax.min);
                            maxValueSets.push(currentMinMax.max);
                        });

                        //set min and max measure
                        minMeasure = d3.min(minValueSets);
                        maxMeasure = d3.max(maxValueSets);
                    }
                    break;
                default:
                    {
                        //calculate min and max values
                        minMeasure = chart.domains.minY;
                        maxMeasure = chart.domains.maxY;
                        minX = chart.domains.minX;
                        maxX = chart.domains.maxX;
                    }
                    break;
            }
        };

        //creates legend container
        function createLegendContainer() {
            //switch legend position to set translation
            switch (chart.legend.position) {
                case 'left':
                    {
                        //create legend container
                        legendContainer = d3.select('#' + chart.container)
                            .insert('div', '#' + chart.innerContainer)
                            .attr('id', chart.container + '_legend')
                            .style('float', 'left');

                        //update inner container style
                        d3.select('#' + chart.innerContainer)
                            .style('float', 'right');

                        //set max legend size
                        sizes.maxHeight = chart.plot.height;
                    }
                    break;
                case 'right':
                    {
                        //create legend container
                        legendContainer = d3.select('#' + chart.container)
                            .insert('div', '#' + chart.innerContainer)
                            .attr('id', chart.container + '_legend')
                            .style('float', 'right');

                        //update inner container style
                        d3.select('#' + chart.innerContainer)
                            .style('float', 'left');

                        //set max legend size
                        sizes.maxHeight = chart.plot.height;
                    }
                    break;
                case 'bottom':
                    {
                        //create legend container
                        legendContainer = d3.select('#' + chart.container)
                            .append('div')
                            .attr('id', chart.container + '_legend');
                        //set max legend size
                        sizes.maxWidth = chart.plot.width;
                    }
                    break;
                case 'top':
                    {
                        //create legend container
                        legendContainer = d3.select('#' + chart.container)
                            .insert('div', '#' + chart.innerContainer)
                            .attr('id', chart.container + '_legend');

                        //set max legend size
                        sizes.maxWidth = chart.plot.width;
                    }
                    break;
            }

            //create legend svg
            legendSvg = legendContainer
                .append('svg')
                .attr('class', 'legend_svg')
                .attr('id', chart.container + '_legend_svg')
                .attr('fill', chart.backColor)
                .attr('stroke', 'none');

            //set legend g
            legendG = legendSvg
                .append('g')
                .attr('transform', 'translate(' + plot.left + ',' + plot.top + ')');
        }

        //sets the legend size
        function setSizes() {
            //set dimension
            width += plot.left + plot.right;
            height += plot.top + plot.bottom;
            legendContainer.style('overflow', 'hidden');

            //switch legend position to adjust chart plot
            switch (chart.legend.position) {
                case 'left':
                case 'right':
                    {
                        //set container and svg heights
                        if (height > sizes.maxHeight) {
                            sizes.containerHeight = sizes.maxHeight;
                            sizes.svgHeight = height;
                            legendContainer.style('overflow-y', 'auto');
                            sizes.containerWidth += 10;
                        } else {
                            sizes.containerHeight = sizes.maxHeight;
                            sizes.svgHeight = sizes.maxHeight;
                        }

                        //set container and svg widths
                        if (width < sizes.minWidth) {
                            sizes.containerWidth = sizes.minWidth;
                            sizes.svgWidth = sizes.minWidth;
                        } else if (width > sizes.maxWidth) {
                            sizes.containerWidth = sizes.maxWidth;
                            sizes.svgWidth = width;
                            legendContainer.style('overflow-x', 'auto');
                            sizes.containerHeight += 10;
                        } else {
                            sizes.containerWidth = width;
                            sizes.svgWidth = width;
                        }

                        //decrease width
                        chart.plot.width -= sizes.containerWidth;
                        //chart.legendSize.width = sizes.containerWidth;
                    }
                    break;
                case 'bottom':
                case 'top':
                    {
                        //set container and svg heights
                        if (height < sizes.minHeight) {
                            sizes.containerHeight = sizes.minHeight;
                            sizes.svgHeight = sizes.minHeight;
                        } else if (height > sizes.maxHeight + 3) {
                            sizes.containerHeight = sizes.maxHeight;
                            sizes.svgHeight = height;
                            legendContainer.style('overflow-y', 'auto');
                            sizes.containerWidth += 15;
                        } else {
                            sizes.containerHeight = height;
                            sizes.svgHeight = height;
                        }

                        //set container and svg widths
                        if (width > sizes.maxWidth + 3) {
                            sizes.containerWidth = sizes.maxWidth;
                            sizes.svgWidth = width;
                            legendContainer.style('overflow-x', 'auto');
                            sizes.containerHeight += 15;
                        } else {
                            sizes.containerWidth = sizes.maxWidth;
                            sizes.svgWidth = sizes.maxWidth;
                        }

                        //decrease height
                        chart.plot.height -= sizes.containerHeight;
                        //chart.legendSize.height = sizes.containerHeight;
                    }
                    break;
            }

            //update chart svg if exists
            if (chart.svg) {
                //update canvas
                chart.svg
                    .attr('viewBox', '0 0 ' + chart.plot.width + ' ' + (chart.plot.height - chart.plot.top))
                    .attr('width', chart.plot.width)
                    .attr('height', (chart.plot.height - chart.plot.top));

                //handle css dimensions
                if (e.mobile)
                    $('#' + chart.container + '_svg').css("width", chart.plot.width).css("height", (chart.plot.height - chart.plot.top));
            }

            //set container and svg sizes
            legendContainer
                .style('width', sizes.containerWidth + 'px')
                .style('height', sizes.containerHeight + 'px');

            //set svg size
            legendSvg
                .attr('width', sizes.svgWidth)
                .attr('height', sizes.svgHeight);

            //set svg positions
            setPositions();
        }

        //adjusts legend position
        function updateSizes() {
            width += plot.left + plot.right;
            height += plot.top + plot.bottom;
            legendContainer.style('overflow', 'hidden');

            //set container and svg heights
            if (height > sizes.containerHeight) {
                sizes.svgHeight = height;
                legendContainer.style('overflow-y', 'auto');
            } else {
                sizes.svgHeight = sizes.containerHeight;
            }
            //set container and svg widths
            if (width > sizes.containerWidth) {
                sizes.svgWidth = width;
                legendContainer.style('overflow-x', 'auto');
            } else {
                sizes.svgWidth = sizes.containerWidth;
            }

            //set svg size
            legendSvg
                .attr('width', sizes.svgWidth)
                .attr('height', sizes.svgHeight);

            //set svg positions
            setPositions();
        }

        //sets legend position
        function setPositions() {
            //if its a default legend
            if (defaultLegend.svg) {
                //switch legend position
                switch (chart.legend.position) {
                    case 'left':
                    case 'right':
                        {
                            xPos = (sizes.svgWidth - (defaultLegend.width + plot.left + plot.right)) / 2;
                            yPos = Math.max((sizes.svgHeight - height) / 2, 0);
                        }
                        break;
                    case 'bottom':
                    case 'top':
                        {
                            xPos = Math.max((sizes.svgWidth - width) / 2, 0);
                            yPos = (sizes.svgHeight - (defaultLegend.height + plot.top + plot.bottom)) / 2;
                        }
                        break;
                }

                //set position
                defaultLegend.svg
                    .transition().duration(chart.animation.duration)
                    .ease(chart.animation.easing.toEasing())
                    .attr('transform', 'translate(' + xPos + ',' + yPos + ')');
            }

            //gradient legend positions
            if (gradientLegend.svg) {
                //switch legend position
                switch (chart.legend.position) {
                    case 'left':
                    case 'right':
                        {
                            xPos = (sizes.svgWidth - (gradientLegend.width + plot.left + plot.right)) / 2;
                            yPos = 0;
                        }
                        break;
                    case 'bottom':
                    case 'top':
                        {
                            xPos = 0;
                            yPos = (sizes.svgHeight - (gradientLegend.height + plot.top + plot.bottom)) / 2;
                        }
                        break;
                }

                //set position
                gradientLegend.svg
                    .attr('transform', 'translate(' + xPos + ',' + yPos + ')');
            }

            //ranged legend positions
            if (rangedLegend.svg) {
                //switch legend position
                switch (chart.legend.position) {
                    case 'left':
                    case 'right':
                        {
                            xPos = (sizes.svgWidth - (rangedLegend.width + plot.left + plot.right)) / 2;
                            yPos = 0;
                        }
                        break;
                    case 'bottom':
                    case 'top':
                        {
                            xPos = 0;
                            yPos = (sizes.svgHeight - (rangedLegend.height + plot.top + plot.bottom)) / 2;
                        }
                        break;
                }
                rangedLegend.svg
                    .attr('transform', 'translate(' + xPos + ',' + yPos + ')');
            }

            //scaled legend positions
            if (scaledLegend.svg) {
                //switch legend position
                switch (chart.legend.position) {
                    case 'left':
                    case 'right':
                        {
                            xPos = (sizes.svgWidth - scaledLegend.width - plot.left - plot.right) / 2;
                            yPos = (height - scaledLegend.height - plot.top) + Math.max((sizes.svgHeight - height) / 2, 0) + scaledLegend.height / 2;
                        }
                        break;
                    case 'bottom':
                    case 'top':
                        {
                            xPos = (width - scaledLegend.width - plot.left) + Math.max((sizes.svgWidth - width) / 2, 0);
                            yPos = (sizes.svgHeight - scaledLegend.height - plot.top - plot.bottom) / 2 + scaledLegend.height / 2;
                        }
                        break;
                }
                scaledLegend.svg
                    .attr('transform', 'translate(' + xPos + ',' + yPos + ')');
            }
        }

        //updates ranged type legend
        function createDefaultLegend(options) {
            currentItem = null;

            //switch chart type to process legend values
            switch (chart.masterType) {
                case 'sliced':
                    {
                        //if chart type is multiples then we need to extract the values from sets
                        if (chart.type === "multiples") {
                            let legendNames = [];
                            chart.data.forEach(function (cd) {
                                if (cd.values && cd.values.length) {
                                    cd.values.forEach(function (d) {
                                        let xValue = d[chart.series[0].xField];

                                        if (legendNames.indexOf(xValue) === -1) {
                                            //check whether group value is assigned
                                            currentItem = e.filterSensitive(chart.legend.legendColors, 'value', d[chart.series[0].xField]);
                                            if (currentItem.length > 0) {
                                                //add current value into the legend values
                                                defaultLegend.legendValues.push({
                                                    value: currentItem[0].value ? currentItem[0].value : '',
                                                    length: currentItem[0].value ? currentItem[0].value.toString().length : 0,
                                                    color: currentItem[0].color
                                                });
                                            } else {
                                                //add current value into the legend values
                                                defaultLegend.legendValues.push({
                                                    value: d[chart.xField] ? d[chart.xField].toString() : '',
                                                    length: d[chart.xField] ? d[chart.xField].toString().length : 0,
                                                    color: i > e.colors.length ? e.randColor() : e.colors[i]
                                                });
                                            }
                                            legendNames.push(xValue);
                                        }
                                    });
                                }
                            });

                            //sort legend values
                            defaultLegend.legendValues.sort(function (a, b) {
                                //extract the type of the value
                                let valueType = typeof a.value;
                                if (valueType === "string") {
                                    if (a.value < b.value) { return -1; } if (a.value > b.value) { return 1; } return 0;
                                } else if(valueType === "number") {
                                    return a.value - b.value;
                                } else {
                                    return new Date(a.value) - new Date(b.value);
                                }
                            });
                        } else {
                            //iterate all chart data to set legend values
                            chart.data.forEach(function (d, i) {
                                //check whether group value is assigned
                                currentItem = e.filterSensitive(chart.legend.legendColors, 'value', d[chart.xField]);
                                if (d[chart.series[0].valueField] != null) {
                                    if (currentItem.length > 0) {
                                        //add current value into the legend values
                                        defaultLegend.legendValues.push({
                                            value: currentItem[0].value ? currentItem[0].value : '',
                                            length: currentItem[0].value ? currentItem[0].value.toString().length : 0,
                                            color: currentItem[0].color
                                        });
                                    } else {
                                        //add current value into the legend values
                                        defaultLegend.legendValues.push({
                                            value: d[chart.xField] ? d[chart.xField].toString() : '',
                                            length: d[chart.xField] ? d[chart.xField].toString().length : 0,
                                            color: i > e.colors.length ? e.randColor() : e.colors[i]
                                        });
                                    }
                                }
                            });

                            //sort legend values
                            defaultLegend.legendValues.sort(function (a, b) {
                                //extract the type of the value
                                let valueType = typeof a.value;
                                if (valueType === "string") {
                                    if (a.value < b.value) { return -1; } if (a.value > b.value) { return 1; } return 0;
                                } else if (valueType === "number") {
                                    return a.value - b.value;
                                } else {
                                    return new Date(a.value) - new Date(b.value);
                                }
                            });
                        }

                        defaultLegend.legendValues.forEach(function (d, i) {
                            //check whether group value is assigned
                            currentItem = e.filterSensitive(chart.legend.legendColors, 'value', d.value);
                            if (currentItem.length === 0) {
                                //add current value into the legend values
                                chart.legend.legendColors.push(d);
                            }
                        });
                    }
                    break;
                case 'grouped':
                    {
                        //declare group values
                        groupValues = e.getUniqueValues(chart.data, chart.series[0].groupField);

                        //iterate all chart data to set legend values
                        groupValues.forEach(function (d, i) {
                            //check whether group value is assigned
                            currentItem = e.filterSensitive(chart.legend.legendColors, 'value', d);
                            if (currentItem.length > 0) {
                                //add current value into the legend values
                                defaultLegend.legendValues.push({
                                    value: currentItem[0].value ? currentItem[0].value : '',
                                    length: currentItem[0].value ? currentItem[0].value.toString().length : 0,
                                    color: currentItem[0].color
                                });
                            }
                            else {
                                //add current value into the legend values
                                defaultLegend.legendValues.push({
                                    value: d ? d.toString() : '',
                                    length: d ? d.toString().length : 0,
                                    color: i > e.colors.length ? e.randColor() : e.colors[i]
                                });
                            }
                        });

                        //check whether the chart has legend values
                        if (chart.legend.legendColors && chart.legend.legendColors.length)
                            defaultLegend.legendValues = chart.legend.legendColors;

                        //sort legendValues
                        defaultLegend.legendValues.sort(function (a, b) { if (a.value < b.value) { return -1; } if (a.value > b.value) { return 1; } return 0; });
                        defaultLegend.legendValues.forEach(function (d, i) {
                            //check whether group value is assigned
                            currentItem = e.filterSensitive(chart.legend.legendColors, 'value', d.value);
                            if (currentItem.length === 0) {
                                //add current value into the legend values
                                chart.legend.legendColors.push(d);
                            }
                        });
                    }
                    break;
                case 'sourced':
                    {
                        //declare group values
                        groupValues = e.getUniqueValues(chart.data, chart.series[0].sourceField);

                        //iterate all chart data to set legend values
                        groupValues.forEach(function (d, i) {
                            //add current value into the legend values
                            defaultLegend.legendValues.push({
                                value: d ? d.toString() : '',
                                length: d ? d.toString().length : 0,
                                color: i > e.colors.length ? e.randColor() : e.colors[i]
                            });
                        });

                        //sort defaultLegend.legendValues
                        defaultLegend.legendValues.sort(function (a, b) { if (a.value < b.value) { return -1; } if (a.value > b.value) { return 1; } return 0; });
                    }
                    break;
                case 'map':
                    {
                        //check whether the legend has animation
                        if (chart.legend.animLegend) {
                            groupValues = chart.legend.animLegend;
                        } else {
                            switch (chart.type) {
                                case 'standardMap':
                                case 'tileMap':
                                    {
                                        //declare group values
                                        groupValues = e.getUniqueValues(chart.data, chart.series[0].valueField);
                                    }
                                    break;
                                case 'ddCartogram':
                                    {
                                        if (chart.series[0].colorField === '') return;

                                        //declare group values
                                        groupValues = e.getUniqueValues(chart.data, chart.series[0].colorField);
                                    }
                                    break;
                                default:
                                    {
                                        if (chart.series[0].groupField === '') return;

                                        //declare group values
                                        groupValues = e.getUniqueValues(chart.data, chart.series[0].groupField);
                                    }
                            }
                        }

                        //iterate all chart data to set legend values
                        groupValues.forEach(function (d, i) {

                            //check whether group value is assigned
                            currentItem = e.filterSensitive(chart.legend.legendColors, 'value', d);
                            if (currentItem.length > 0) {
                                //add current value into the legend values
                                defaultLegend.legendValues.push({
                                    value: currentItem[0].value ? currentItem[0].value : '',
                                    length: currentItem[0].value ? currentItem[0].value.toString().length : 0,
                                    color: currentItem[0].color
                                });
                            }
                            else {
                                //add current value into the legend values
                                defaultLegend.legendValues.push({
                                    value: d ? d.toString() : '',
                                    length: d ? d.toString().length : 0,
                                    color: i > e.colors.length ? e.randColor() : e.colors[i]
                                });
                            }
                        });

                        //sort legendValues
                        defaultLegend.legendValues.sort(function (a, b) {
                            if (a.value < b.value) { return -1; }
                            if (a.value > b.value) { return 1; }
                            return 0;
                        });
                        defaultLegend.legendValues.forEach(function (d, i) {
                            //check whether group value is assigned
                            currentItem = e.filterSensitive(chart.legend.legendColors, 'value', d.value);
                            if (currentItem.length === 0) {
                                //add current value into the legend values
                                chart.legend.legendColors.push(d);
                            }
                        });
                    }
                    break;
                case 'manual':
                    {
                        //iterate all group values
                        if (chart.manualLegendValues) {
                            chart.manualLegendValues.forEach(function (d, i) {
                                //add current value into the legend values
                                if (d) {
                                    //check whether group value is assigned
                                    filteredList = e.filterSensitive(chart.legend.legendColors, 'value', d);
                                    if (filteredList.length > 0) {
                                        //add current value into the legend values
                                        defaultLegend.legendValues.push({
                                            value: filteredList[0].value ? filteredList[0].value : '',
                                            length: filteredList[0].value ? filteredList[0].value.toString().length : 0,
                                            color: filteredList[0].color
                                        });
                                    }
                                    else {
                                        //add current value into the legend values
                                        defaultLegend.legendValues.push({
                                            value: d.toString(),
                                            length: d.toString().length,
                                            color: i > e.colors.length ? e.randColor() : e.colors[i]
                                        });
                                    }
                                }
                            });
                        }

                        //sort legendValues
                        defaultLegend.legendValues.sort(function (a, b) { if (a.value < b.value) { return -1; } if (a.value > b.value) { return 1; } return 0; });
                    }
                    break;
                default:
                    {
                        //if chart type is mirrored bars we need to make a different approach
                        if (chart.type === 'mirroredBars') {
                            //declare an index to limit colors
                            let legendColorIndex = 0;

                            //iterate legend colors
                            chart.legend.legendColors.forEach(function (d, i) {
                                //limit to two selections
                                if (legendColorIndex < 2) {
                                    let legendValue = d.text || d.value;

                                    defaultLegend.legendValues.push({
                                        value: legendValue ? legendValue.toString() : '',
                                        length: legendValue ? legendValue.toString().length : 0,
                                        color: d.color
                                    });
                                }

                                //increase indexer
                                legendColorIndex++;
                            });

                            //sort legend values
                            defaultLegend.legendValues.sort(function (a, b) {
                                //extract the type of the value
                                let valueType = typeof a.value;
                                if (valueType === "string") {
                                    if (a.value < b.value) { return -1; } if (a.value > b.value) { return 1; } return 0;
                                } else if (valueType === "number") {
                                    return a.value - b.value;
                                } else {
                                    return new Date(a.value) - new Date(b.value);
                                }
                            });
                        }  else if (chart.type === 'bubbleForce') {
                            if (chart.series[0].groupField === '') return;
                            //declare group values
                            groupValues = e.getUniqueValues(chart.data, chart.series[0].groupField);

                            //iterate all chart data to set legend values
                            groupValues.forEach(function (d, i) {

                                //check whether group value is assigned
                                currentItem = e.filterSensitive(chart.legend.legendColors, 'value', d);
                                if (currentItem.length > 0) {
                                    //add current value into the legend values
                                    defaultLegend.legendValues.push({
                                        value: currentItem[0].value ? currentItem[0].value : '',
                                        length: currentItem[0].value ? currentItem[0].value.toString().length : 0,
                                        color: currentItem[0].color
                                    });
                                }
                                else {
                                    //add current value into the legend values
                                    defaultLegend.legendValues.push({
                                        value: d ? d.toString() : '',
                                        length: d ? d.toString().length : 0,
                                        color: i > e.colors.length ? e.randColor() : e.colors[i]
                                    });
                                }
                            });

                            //sort legendValues
                            defaultLegend.legendValues.sort(function (a, b) {
                                if (a.value < b.value) { return -1; }
                                if (a.value > b.value) { return 1; }
                                return 0;
                            });
                            defaultLegend.legendValues.forEach(function (d, i) {
                                //check whether group value is assigned
                                currentItem = e.filterSensitive(chart.legend.legendColors, 'value', d.value);
                                if (currentItem.length === 0) {
                                    //add current value into the legend values
                                    chart.legend.legendColors.push(d);
                                }
                            });

                        } else if (chart.manualLegendValues) {
                                chart.manualLegendValues.forEach(function (d, i) {
                                    //add current value into the legend values
                                    if (d) {
                                        //check whether group value is assigned
                                        filteredList = e.filterSensitive(chart.legend.legendColors, 'value', d);
                                        if (filteredList.length > 0) {
                                            //add current value into the legend values
                                            defaultLegend.legendValues.push({
                                                value: filteredList[0].value ? filteredList[0].value : '',
                                                length: filteredList[0].value ? filteredList[0].value.toString().length : 0,
                                                color: filteredList[0].color
                                            });
                                        }
                                        else {
                                            //add current value into the legend values
                                            defaultLegend.legendValues.push({
                                                value: d.toString(),
                                                length: d.toString().length,
                                                color: i > e.colors.length ? e.randColor() : e.colors[i]
                                            });
                                        }
                                    }
                                });
                                defaultLegend.legendValues.forEach(function (d, i) {
                                    //check whether group value is assigned
                                    currentItem = e.filterSensitive(chart.legend.legendColors, 'value', d.value);
                                    if (currentItem.length === 0) {
                                        //add current value into the legend values
                                        chart.legend.legendColors.push(d);
                                    }
                                });
                        } else {
                            //check whether the legend colors has set
                            if (chart.legend.legendColors && chart.legend.legendColors.length) {
                                //set default legend values
                                defaultLegend.legendValues = chart.legend.legendColors;
                            }

                            //sort legend values
                            defaultLegend.legendValues.sort(function (a, b) {
                                //extract the type of the value
                                let valueType = typeof a.value;
                                if (valueType === "string") {
                                    if (a.value < b.value) { return -1; } if (a.value > b.value) { return 1; } return 0;
                                } else if (valueType === "number") {
                                    return a.value - b.value;
                                } else {
                                    return new Date(a.value) - new Date(b.value);
                                }
                            });
                        }

                        //don't create legend if there are less than 2 items in it
                        if (defaultLegend.legendValues.length < 2) {
                            if (chart.series.length < 2)
                                return;
                        }
                    }
                    break;
            }

            //don't create legend if there aren't any items
            if (defaultLegend.legendValues.length === 0) return;

            //set legend values
            chart.legendValues = defaultLegend.legendValues;

            //sort legend values
            defaultLegend.legendValues.sort(function (a, b) {
                //get type and nan state for the value
                let vType = e.getType(a.value);
                let nanState = isNaN(a.value);
                if (nanState) {
                    if (vType === "string") {
                        if (a.value < b.value) { return -1; }
                        if (a.value > b.value) { return 1; }
                        return 0;
                    } else if (vType === "date") {
                        return new Date(a.value) - new Date(b.value);
                    } else {
                        return a.value - b.value;
                    }
                } else {
                    return parseFloat(a.value) - parseFloat(b.value);
                }
            });

            //iterate all legend values
            defaultLegend.legendValues.forEach(function (currentLegend) {

                //get width of the text
                currentLegend.width = getTempOffset(currentLegend.value).width + chart.legend.fontSize + legendIconOffset * 2;
                
                //retrieve max length text
                if (currentLegend.width > tempTextValueLength) {
                    tempTextValue = currentLegend.value;
                    tempTextValueLength = currentLegend.length;
                }
            });

            //get width of the text
            tempTextSVGOffset = getTempOffset(tempTextValue);

            //set single height and width
            defaultLegend.singleHeight = tempTextSVGOffset.height + legendIconOffset;

            //append ranged Legend g
            defaultLegend.svg = legendG
                .append('g');

            //append legend icons
            defaultLegend.icons = defaultLegend.svg.selectAll('.eve-legend-icon')
                .data(defaultLegend.legendValues)
                .enter().append('rect')
                .attr('class', 'eve-legend-icon')
                .attr('width', chart.legend.fontSize)
                .attr('height', chart.legend.fontSize)
                .style('cursor', options.onClickEnabled ? 'pointer' : 'auto')
                .style('fill', function (d, i) { return d.color; })
                .on('click', function (d, i) {
                    //set whether the sliced clicked
                    if (!d.clicked) {
                        d.clicked = true;
                        chart.interactSerie((d.serieIndex ? d.serieIndex : i), true, 1, d);
                    } else {
                        d.clicked = null;
                        chart.interactSerie((d.serieIndex ? d.serieIndex : i), null, 1, d);
                    }

                    //check whether the chart legend click has value
                    if (chart.legendClick && options.onClickEnabled)
                        chart.legendClick(d, (d.serieIndex ? d.serieIndex : i));

                    //check whether the chart legend click has value
                    if (chart.onLegendClick)
                        chart.onLegendClick('legend');
                });

            //append legend texts
            defaultLegend.texts = defaultLegend.svg.selectAll('.eve-legend-text')
                .data(defaultLegend.legendValues)
                .enter().append('text')
                .attr('class', 'eve-legend-text')
                .style('font-size', chart.legend.fontSize + 'px')
                .style('fill', chart.legend.fontColor)
                .style('font-family', chart.legend.fontFamily + ', Arial, Helvetica, Ubuntu')
                .style('font-style', chart.legend.fontStyle == 'bold' ? 'normal' : chart.legend.fontStyle)
                .style('font-weight', chart.legend.fontStyle == 'bold' ? 'bold' : 'normal')
                .style('cursor', options.onClickEnabled ? 'pointer' : 'auto')
                .text(function (d, i) { return d.value; })
                .on('click', function (d, i) {
                    //set whether the sliced clicked
                    if (!d.clicked) {
                        d.clicked = true;
                        chart.interactSerie((d.serieIndex ? d.serieIndex : i), true, 1, d);
                    } else {
                        d.clicked = null;
                        chart.interactSerie((d.serieIndex ? d.serieIndex : i), null, 1, d);
                    }

                    //check whether the chart legend click has value
                    if (chart.legendClick && options.onClickEnabled)
                        chart.legendClick(d, (d.serieIndex ? d.serieIndex : i));

                    //check whether the chart legend click has value
                    if (chart.onLegendClick)
                        chart.onLegendClick('legend');
                });

            //transform legend icons
            defaultLegend.icons
                .attr('transform', function (d, i) {
                    //set x and y position
                    switch (chart.legend.position) {
                        case 'left':
                        case 'right':
                            {
                                xPos = 0;
                                yPos = (i * defaultLegend.singleHeight);
                            }
                            break;
                        default:
                            {
                                yPos = 0;
                                xPos = d3.sum(defaultLegend.legendValues, function (l, j) { return j < i ? l.width : 0; });
                            }
                            break;
                    }

                    //return translation for the current icon
                    return 'translate(' + xPos + ', ' + yPos + ')';
                });

            //transform legend texts
            defaultLegend.texts
                .attr('transform', function (d, i) {
                    //set x and y position
                    switch (chart.legend.position) {
                        case 'left':
                        case 'right':
                            {
                                xPos = chart.legend.fontSize + legendIconOffset;
                                yPos = (i * defaultLegend.singleHeight) + defaultLegend.singleHeight / 2;
                            }
                            break;
                        default:
                            {
                                yPos = defaultLegend.singleHeight / 2;
                                xPos = d3.sum(defaultLegend.legendValues, function (l, j) { return j < i ? l.width : 0; }) + chart.legend.fontSize + legendIconOffset;
                            }
                            break;
                    }

                    //return translation for the current icon
                    return 'translate(' + xPos + ', ' + yPos + ')';
                });

            //get bbox of the svg
            tempDimensions = defaultLegend.svg.node().getBoundingClientRect();

            //set legend size
            defaultLegend.height = tempDimensions.height;
            defaultLegend.width = tempDimensions.width + 15;

            //calculate legend width and height
            switch (chart.legend.position) {
                case 'left':
                case 'right':
                    {
                        //set overall legend sizes
                        width = width < defaultLegend.width ? defaultLegend.width : width;
                        height += defaultLegend.height;
                    }
                    break;
                default:
                    {
                        //set overall legend sizes
                        width += defaultLegend.width;
                        height = height < defaultLegend.height ? defaultLegend.height : height;
                    }
                    break;
            }
        }

        //updates ranged type legend
        function updateDefaultLegend(options) {
            //set new chart series
            newChartSeries = [];
            currentItem = null;

            //switch chart type
            switch (chart.masterType) {
                case 'sliced':
                    {
                        //iterate all chart data to set legend values
                        chart.data.forEach(function (d, i) {
                            //check whether group value is assigned
                            currentItem = e.filterSensitive(chart.legend.legendColors, 'value', d[chart.xField]);

                            if (d[chart.series[0].valueField] != null) {
                                if (currentItem.length > 0) {
                                    //add current value into the legend values
                                    newChartSeries.push({
                                        value: currentItem[0].value ? currentItem[0].value : '',
                                        length: currentItem[0].value ? currentItem[0].value.toString().length : 0,
                                        color: currentItem[0].color
                                    });
                                } else {
                                    //add current value into the legend values
                                    newChartSeries.push({
                                        value: d[chart.xField] ? d[chart.xField].toString() : '',
                                        length: d[chart.xField] ? d[chart.xField].toString().length : 0,
                                        color: i > e.colors.length ? e.randColor() : e.colors[i]
                                    });
                                }
                            }
                        });
                    }
                    break;
                case 'grouped':
                    {
                        //declare group values
                        groupValues = e.getUniqueValues(chart.data, chart.series[0].groupField);

                        //iterate all chart data to set legend values
                        groupValues.forEach(function (d, i) {
                            //check whether group value is assigned
                            currentItem = e.filterSensitive(chart.legend.legendColors, 'value', d);
                            if (currentItem.length > 0) {
                                //add current value into the legend values
                                newChartSeries.push({
                                    value: currentItem[0].value ? currentItem[0].value : '',
                                    length: currentItem[0].value ? currentItem[0].value.toString().length : 0,
                                    color: currentItem[0].color
                                });
                            }
                            else {
                                //add current value into the legend values
                                newChartSeries.push({
                                    value: d ? d.toString() : '',
                                    length: d ? d.toString().length : 0,
                                    color: i > e.colors.length ? e.randColor() : e.colors[i]
                                });
                            }
                        });

                        //sort chartSeries
                        newChartSeries.sort(function (a, b) { if (a.value < b.value) { return -1; } if (a.value > b.value) { return 1; } return 0; });
                    }
                    break;
                case 'manual':
                    {
                        //iterate all group values
                        chart.manualLegendValues.forEach(function (d, i) {
                            //add current value into the legend values
                            if (d) {
                                //check whether group value is assigned
                                filteredList = e.filterSensitive(chart.legend.legendColors, 'value', d);
                                if (filteredList.length > 0) {
                                    //add current value into the legend values
                                    newChartSeries.push({
                                        value: filteredList[0].value ? filteredList[0].value : '',
                                        length: filteredList[0].value ? filteredList[0].value.length : 0,
                                        color: filteredList[0].color
                                    });
                                }
                                else {
                                    //add current value into the legend values
                                    newChartSeries.push({
                                        value: d.toString(),
                                        length: d.toString().length,
                                        color: i > e.colors.length ? e.randColor() : e.colors[i]
                                    });
                                }
                            }
                        });

                        //sort legendValues
                        newChartSeries.sort(function (a, b) { if (a.value < b.value) { return -1; } if (a.value > b.value) { return 1; } return 0; });
                    }
                    break;
                case 'map':
                    {
                        //check whether the legend has animation
                        if (chart.legend.animLegend) {
                            groupValues = chart.legend.animLegend;
                        } else {
                            switch (chart.type) {
                                case 'standardMap':
                                case 'tileMap':
                                case 'contCartogram':
                                    {
                                        //declare group values
                                        groupValues = e.getUniqueValues(chart.data, chart.series[0].valueField);
                                    }
                                    break;
                                case 'ddCartogram':
                                    {
                                        if (chart.series[0].colorField === '') return;
                                        //declare group values
                                        groupValues = e.getUniqueValues(chart.data, chart.series[0].colorField);
                                    }
                                    break;
                                default:
                                    {
                                        if (chart.series[0].groupField === '') return;
                                        //declare group values
                                        groupValues = e.getUniqueValues(chart.data, chart.series[0].groupField);
                                    }
                            }
                        }

                        //iterate all chart data to set legend values
                        groupValues.forEach(function (d, i) {
                            //check whether group value is assigned
                            currentItem = e.filterSensitive(chart.legend.legendColors, 'value', d);
                            if (currentItem.length > 0) {
                                //add current value into the legend values
                                newChartSeries.push({
                                    value: currentItem[0].value ? currentItem[0].value : '',
                                    length: currentItem[0].value ? currentItem[0].value.toString().length : 0,
                                    color: currentItem[0].color
                                });
                            }
                            else {
                                //add current value into the legend values
                                newChartSeries.push({
                                    value: d ? d.toString() : '',
                                    length: d ? d.toString().length : 0,
                                    color: i > e.colors.length ? e.randColor() : e.colors[i]
                                });
                            }
                        });

                        //sort chartSeries
                        newChartSeries.sort(function (a, b) { if (a.value < b.value) { return -1; } if (a.value > b.value) { return 1; } return 0; });
                    }
                    break;
                default:
                    {
                        if (chart.type === 'bubbleForce') {
                            if (chart.series[0].groupField === '') return;
                            //declare group values
                            groupValues = e.getUniqueValues(chart.data, chart.series[0].groupField);

                            //iterate all chart data to set legend values
                            groupValues.forEach(function (d, i) {

                                //check whether group value is assigned
                                currentItem = e.filterSensitive(chart.legend.legendColors, 'value', d);
                                if (currentItem.length > 0) {
                                    //add current value into the legend values
                                    newChartSeries.push({
                                        value: currentItem[0].value ? currentItem[0].value : '',
                                        length: currentItem[0].value ? currentItem[0].value.toString().length : 0,
                                        color: currentItem[0].color
                                    });
                                }
                                else {
                                    //add current value into the legend values
                                    newChartSeries.push({
                                        value: d ? d.toString() : '',
                                        length: d ? d.toString().length : 0,
                                        color: i > e.colors.length ? e.randColor() : e.colors[i]
                                    });
                                }
                            });

                            //sort legendValues
                            newChartSeries.sort(function (a, b) {
                                if (a.value < b.value) { return -1; }
                                if (a.value > b.value) { return 1; }
                                return 0;
                            });
                            newChartSeries.forEach(function (d, i) {
                                //check whether group value is assigned
                                currentItem = e.filterSensitive(chart.legend.legendColors, 'value', d.value);
                                if (currentItem.length === 0) {
                                    //add current value into the legend values
                                    chart.legend.legendColors.push(d);
                                }
                            });

                        } else {
                            //sort data
                            chart.data.sort(function (a, b) {
                                return ((a[chart.xField] < b[chart.xField]) ? -1 : ((a[chart.xField] > b[chart.xField]) ? 1 : 0));
                            });

                            //extract serie names from the updated data
                            let newSeries = chart.extractSerieNamesFromData();

                            //iterate all series
                            newSeries.forEach(function (newSerie) {
                                if (newSerie.serie) {
                                    //check wheter the title is not empty
                                    if (newSerie.serie.title && newSerie.serie.title !== '') {
                                        currentItem = newSerie.serie.title;
                                    } else {
                                        //set related field content as legend text
                                        if (newSerie.serie.yField && newSerie.serie.yField !== '')
                                            currentItem = newSerie.serie.yField;
                                        else if (newSerie.serie.valueField && newSerie.serie.valueField !== '')
                                            currentItem = newSerie.serie.valueField;
                                        else if (newSerie.serie.measureField && newSerie.serie.measureField !== '')
                                            currentItem = newSerie.serie.measureField;
                                    }

                                    //check whether group value is assigned
                                    filteredList = e.filterSensitive(chart.legend.legendColors, 'value', currentItem);
                                    if (filteredList.length > 0) {
                                        let legendValue = filteredList[0].text || filteredList[0].value;

                                        newChartSeries.push({
                                            value: legendValue ? legendValue.toString() : '',
                                            length: legendValue ? legendValue.toString().length : 0,
                                            color: newSerie.serie.color
                                        });
                                    }
                                    else {
                                        //add current value into the legend values
                                        newChartSeries.push({
                                            value: currentItem ? currentItem.toString() : '',
                                            length: currentItem ? currentItem.toString().length : 0,
                                            color: newSerie.serie.color
                                        });
                                    }
                                }
                            });
                        }
                    }
                    break;
            }

            //assign updated values
            chart.legendValues = newChartSeries;
            defaultLegend.legendValues = newChartSeries;

            //set start values for comparison
            tempTextValue = '';
            tempTextValueLength = 0;

            //sort legend values
            defaultLegend.legendValues.sort(function (a, b) {
                //get type and nan state for the value
                let vType = e.getType(a.value);
                let nanState = isNaN(a.value);
                if (nanState) {
                    if (vType === "string") {
                        if (a.value < b.value) { return -1; }
                        if (a.value > b.value) { return 1; }
                        return 0;
                    } else if (vType === "date") {
                        return new Date(a.value) - new Date(b.value);
                    } else {
                        return a.value - b.value;
                    }
                } else {
                    return parseFloat(a.value) - parseFloat(b.value);
                }
            });

            //iterate all legend values
            defaultLegend.legendValues.forEach(function (currentLegend) {

                //get width of the text
                currentLegend.width = getTempOffset(currentLegend.value).width + chart.legend.fontSize + legendIconOffset * 2;

                //retrieve max length text
                if (currentLegend.length > tempTextValueLength) {
                    tempTextValue = currentLegend.value;
                    tempTextValueLength = currentLegend.length;
                }
            });

            //update icon svgs
            let iconBase = defaultLegend.svg.selectAll('.eve-legend-icon')
                .data(defaultLegend.legendValues);

            //set class
            iconBase
                .attr('class', 'eve-legend-icon update');

            //set animation removal
            iconBase
                .exit().remove();

            //set icons
            defaultLegend.icons = iconBase
                .enter().append('rect')
                .attr('class', 'eve-legend-icon')
                .attr('width', chart.legend.fontSize)
                .attr('height', chart.legend.fontSize)
                .style('cursor', options.onClickEnabled ? 'pointer' : 'auto')
                .on('click', function (d, i) {
                    //set whether the sliced clicked
                    if (!d.clicked) {
                        d.clicked = true;
                        chart.interactSerie(i, true, 1, d);
                    } else {
                        d.clicked = null;
                        chart.interactSerie(i, null, 1, d);
                    }

                    //check whether the chart legend click has value
                    if (chart.legendClick && options.onClickEnabled)
                        chart.legendClick(d, i);

                    //check whether the chart legend click has value
                    if (chart.onLegendClick)
                        chart.onLegendClick('legend');
                })
                .merge(iconBase)
                .style('fill', function (d, i) { return d.color; });

            //update text svgs
            let textBase = defaultLegend.svg.selectAll('.eve-legend-text')
                .data(defaultLegend.legendValues);

            //set class
            textBase
                .attr('class', 'eve-legend-text update');

            //animation removal
            textBase
                .exit().remove();

            //set texts
            defaultLegend.texts = textBase
                .enter().append('text')
                .attr('class', 'eve-legend-text')
                .style('font-size', chart.legend.fontSize + 'px')
                .style('fill', chart.legend.fontColor)
                .style('font-family', chart.legend.fontFamily + ', Arial, Helvetica, Ubuntu')
                .style('font-style', chart.legend.fontStyle == 'bold' ? 'normal' : chart.legend.fontStyle)
                .style('font-weight', chart.legend.fontStyle == 'bold' ? 'bold' : 'normal')
                .style('cursor', options.onClickEnabled ? 'pointer' : 'auto')
                .on('click', function (d, i) {
                    //set whether the sliced clicked
                    if (!d.clicked) {
                        d.clicked = true;
                        chart.interactSerie(i, true, 1, d);
                    } else {
                        d.clicked = null;
                        chart.interactSerie(i, null, 1, d);
                    }

                    //check whether the chart legend click has value
                    if (chart.legendClick && options.onClickEnabled)
                        chart.legendClick(d, i);

                    //check whether the chart legend click has value
                    if (chart.onLegendClick)
                        chart.onLegendClick('legend');
                })
                .merge(textBase)
                .text(function (d, i) { return d.value; });

            //transform legend icons
            defaultLegend.icons
                .attr('transform', function (d, i) {
                    //set x and y position
                    switch (chart.legend.position) {
                        case 'left':
                        case 'right':
                            {
                                xPos = 0;
                                yPos = (i * defaultLegend.singleHeight);
                            }
                            break;
                        default:
                            {
                                yPos = 0;
                                xPos = d3.sum(defaultLegend.legendValues, function (l, j) { return j < i ? l.width : 0; });
                            }
                            break;
                    }

                    //return translation for the current icon
                    return 'translate(' + xPos + ', ' + yPos + ')';
                });

            //transform legend texts
            defaultLegend.texts
                .attr('transform', function (d, i) {
                    //set x and y position
                    switch (chart.legend.position) {
                        case 'left':
                        case 'right':
                            {
                                xPos = chart.legend.fontSize + legendIconOffset;
                                yPos = (i * defaultLegend.singleHeight) + defaultLegend.singleHeight / 2;
                            }
                            break;
                        default:
                            {
                                yPos = defaultLegend.singleHeight / 2;
                                xPos = d3.sum(defaultLegend.legendValues, function (l, j) { return j < i ? l.width : 0; }) + chart.legend.fontSize + legendIconOffset;
                            }
                            break;
                    }

                    //return translation for the current icon
                    return 'translate(' + xPos + ', ' + yPos + ')';
                });

            //get bbox of the svg
            tempDimensions = defaultLegend.svg.node().getBoundingClientRect();

            //calculate legend width and height
            switch (chart.legend.position) {
                case 'left':
                case 'right':
                    {
                        //set overall legend sizes
                        width = width < tempDimensions.width ? tempDimensions.width : width;
                        height += tempDimensions.height;
                    }
                    break;
                default:
                    {
                        //set overall legend sizes
                        width += tempDimensions.width;
                        height = height < tempDimensions.height ? tempDimensions.height : height;
                    }
                    break;
            }

            //set legend size
            defaultLegend.height = tempDimensions.height;
            defaultLegend.width = tempDimensions.width;
        }

        //creates ranged type legend
        function createRangedLegend(options) {
            //switch chart type to process legend values
            switch (chart.masterType) {
                case 'map':
                    {
                        switch (chart.type) {
                            case 'ddCartogram':
                                {
                                    if (chart.series[0].colorField === '') return;
                                }
                                break;
                            default:
                                {
                                }
                                break;
                        }
                    }
                    break;
                default:
                    {
                    }
                    break;
            }

            //create multiples
            if (chart.type === 'multiples') {
                switch (chart.series[0].type) {
                    case 'ddCartogram':
                        {
                            if (chart.series[0].colorField === '') return;
                        }
                        break;
                }
            }

            //set formatted content
            let formattedMax = '';

            //reset temp value
            tempTextValueLength = 0;

            //iterate all legend values
            chart.legend.rangeList.forEach(function (range, rangeIndex) {
                //retrieve max length text
                if (range.text.length > tempTextValueLength) {
                    tempTextValue = range.text;
                    tempTextValueLength = range.text.length;
                }
                formattedMax = e.formatNumber(range.maxValue, chart.legend.numberFormat).toString();
                if (formattedMax.length > tempTextValueLength) {
                    tempTextValue = formattedMax;
                    tempTextValueLength = formattedMax.length;
                }
            });

            //calculate automatic legend width
            switch (chart.legend.position) {
                case 'left':
                case 'right':
                    {
                        //get width of the text
                        tempTextSVGOffset = getTempOffset(tempTextValue);
                        //calculate legend dimension
                        rangedLegend.width = rangedLegend.dimension + legendIconOffset * 2 + tempTextSVGOffset.width;
                        rangedLegend.height = (sizes.maxHeight - plot.top - plot.bottom) - height - (options.legendSpace ? legendIconOffset : 0) - 5;
                        rangedLegend.blockHeight = (rangedLegend.height / chart.legend.rangeList.length);
                        rangedLegend.blockWidth = rangedLegend.dimension;
                    }
                    break;
                default:
                    {
                        //calculate legend widths
                        rangedLegend.width = (sizes.maxWidth - plot.right - plot.left) - width - (options.legendSpace ? legendIconOffset : 0) - 5;
                        rangedLegend.blockWidth = (rangedLegend.width / chart.legend.rangeList.length);

                        //get width of the text
                        tempTextSVGOffset = getWrappedTempOffset(tempTextValue, rangedLegend.blockWidth);

                        //calculate legend heights
                        rangedLegend.height = rangedLegend.dimension + tempTextSVGOffset.height + legendIconOffset * 2;
                        rangedLegend.blockHeight = rangedLegend.dimension;
                    }
                    break;
            }

            //append ranged Legend g
            rangedLegend.svg = legendG
                .append('g');

            //append range rects
            rangedLegend.svg.selectAll('.eve-legend-icon')
                .data(chart.legend.rangeList)
                .enter().append('rect')
                .attr('class', function (d, i) { return 'ranged-' + i; })
                .attr('width', rangedLegend.blockWidth)
                .attr('height', rangedLegend.blockHeight)
                .style('cursor', options.onClickEnabled ? 'pointer' : 'auto')
                .style('fill', function (d, i) {
                    if (d.color && d.color !== '') {
                        return d.color;
                    } else {
                        return e.colors[i];
                    }
                })
                .attr('transform', function (d, i) {
                    //calculate x and y pos
                    switch (chart.legend.position) {
                        case 'left':
                        case 'right':
                            {
                                xPos = 0;
                                yPos = i * rangedLegend.blockHeight;
                            }
                            break;
                        default:
                            {
                                xPos = i * rangedLegend.blockWidth;
                                yPos = 0;
                            }
                            break;
                    }

                    //return translation
                    return 'translate(' + xPos + ',' + yPos + ')';
                })
                .on('click', function (d, i) {
                    //check whether the chart legend click has value
                    if (chart.onLegendClick)
                        chart.onLegendClick('legend');
                })
                .on('mouseenter', function (d, i) {
                    //check whether the chart legend click has value
                    if (chart.onLegendHover && options.onClickEnabled) {
                        chart.onLegendHover(d, i, true);
                    }
                })
                .on('mouseleave', function (d, i) {
                    //check whether the chart legend click has value
                    if (chart.onLegendHover && options.onClickEnabled) {
                        chart.onLegendHover(d, i, false);
                    }
                });

            //append range texts
            let texts = rangedLegend.svg.selectAll('.eve-legend-text')
                .data(chart.legend.rangeList)
                .enter().append('text')
                .style('font-size', chart.legend.fontSize + 'px')
                .style('fill', chart.legend.fontColor)
                .style('font-family', chart.legend.fontFamily + ', Arial, Helvetica, Ubuntu')
                .style('font-style', chart.legend.fontStyle == 'bold' ? 'normal' : chart.legend.fontStyle)
                .style('font-weight', chart.legend.fontStyle == 'bold' ? 'bold' : 'normal')
                .style('cursor', options.onClickEnabled ? 'pointer' : 'auto')
                .style('text-anchor', function () {
                    //calculate x and y pos
                    switch (chart.legend.position) {
                        case 'left':
                        case 'right':
                            return 'start';
                        default:
                            return 'middle';
                    }
                })
                .text(function (d) { return d.text; })
                .attr('transform', function (d, i) {
                    //calculate x and y pos
                    switch (chart.legend.position) {
                        case 'left':
                        case 'right':
                            {
                                xPos = rangedLegend.blockWidth + legendIconOffset;
                                yPos = (i * rangedLegend.blockHeight) + rangedLegend.blockHeight / 2;
                            }
                            break;
                        default:
                            {
                                xPos = (i * rangedLegend.blockWidth) + rangedLegend.blockWidth / 2;
                                yPos = rangedLegend.blockHeight + tempTextSVGOffset.height;
                            }
                            break;
                    }

                    //return translation
                    return 'translate(' + xPos + ',' + yPos + ')';
                })
                .on('click', function (d, i) {
                    //check whether the chart legend click has value
                    if (chart.legendClick && options.onClickEnabled)
                        chart.legendClick(d, i);

                    //check whether the chart legend click has value
                    if (chart.onLegendClick)
                        chart.onLegendClick('legend');
                });

            //append range boundaries
            rangedLegend.svg.selectAll('.eve-legend-line')
                .data(chart.legend.rangeList)
                .enter().append('rect')
                .attr('width', function () {
                    switch (chart.legend.position) {
                        case 'left':
                        case 'right':
                            return rangedLegend.blockWidth + legendIconOffset;
                        default:
                            return 2;
                    }
                })
                .attr('height', function () {
                    switch (chart.legend.position) {
                        case 'left':
                        case 'right':
                            return 2;
                        default:
                            return rangedLegend.blockHeight + legendIconOffset;
                    }
                })
                .style('fill', 'rgb(0,0,0)')
                .attr('transform', function (d, i) {
                    //calculate x and y pos
                    switch (chart.legend.position) {
                        case 'left':
                        case 'right':
                            {
                                xPos = 0;
                                yPos = i * rangedLegend.blockHeight;
                            }
                            break;
                        default:
                            {
                                xPos = i * rangedLegend.blockWidth;
                                yPos = 0;
                            }
                            break;
                    }

                    //return translation
                    return 'translate(' + xPos + ',' + yPos + ')';
                });

            //append last range boundary
            rangedLegend.svg.append('rect')
                .attr('width', function () {
                    switch (chart.legend.position) {
                        case 'left':
                        case 'right':
                            return rangedLegend.blockWidth + legendIconOffset;
                        default:
                            return 2;
                    }
                })
                .attr('height', function () {
                    switch (chart.legend.position) {
                        case 'left':
                        case 'right':
                            return 2;
                        default:
                            return rangedLegend.blockHeight + legendIconOffset;
                    }
                })
                .style('fill', 'rgb(0,0,0)')
                .attr('transform', function () {
                    //calculate x and y pos
                    switch (chart.legend.position) {
                        case 'left':
                        case 'right':
                            {
                                xPos = 0;
                                yPos = rangedLegend.blockHeight * chart.legend.rangeList.length - 2;
                            }
                            break;
                        default:
                            {
                                xPos = rangedLegend.blockWidth * chart.legend.rangeList.length - 2;
                                yPos = 0;
                            }
                            break;
                    }

                    //return translation
                    return 'translate(' + xPos + ',' + yPos + ')';
                });

            //append range boundary texts
            rangedLegend.svg.selectAll('.eve-legend-icon')
                .data(chart.legend.rangeList)
                .enter().append('text')
                .attr('class', 'eve-legend-icon')
                .style('font-size', chart.legend.fontSize + 'px')
                .style('fill', chart.legend.fontColor)
                .style('font-family', chart.legend.fontFamily + ', Arial, Helvetica, Ubuntu')
                .style('font-style', chart.legend.fontStyle == 'bold' ? 'normal' : chart.legend.fontStyle)
                .style('font-weight', chart.legend.fontStyle == 'bold' ? 'bold' : 'normal')
                .style('text-anchor', function (d, i) {
                    //calculate x and y pos
                    switch (chart.legend.position) {
                        case 'left':
                        case 'right':
                            return 'start';
                        default:
                            return i === 0 ? 'start' : 'middle';
                    }
                })
                .text(function (d) { return e.formatNumber(d.minValue, chart.legend.numberFormat); })
                .attr('transform', function (d, i) {
                    //calculate x and y pos
                    switch (chart.legend.position) {
                        case 'left':
                        case 'right':
                            {
                                xPos = rangedLegend.blockWidth + legendIconOffset + 1;
                                if (i === 0)
                                    yPos = (i * rangedLegend.blockHeight) + chart.legend.fontSize;
                                else
                                    yPos = (i * rangedLegend.blockHeight) + (chart.legend.fontSize / 2);
                            }
                            break;
                        default:
                            {
                                xPos = i * rangedLegend.blockWidth;
                                yPos = rangedLegend.blockHeight + tempTextSVGOffset.height + 1;
                            }
                            break;
                    }

                    //return translation
                    return 'translate(' + xPos + ',' + yPos + ')';
                });

            //append last range boundary text
            rangedLegend.svg.append('text')
                .attr('class', 'eve-legend-icon')
                .style('font-size', chart.legend.fontSize + 'px')
                .style('fill', chart.legend.fontColor)
                .style('font-family', chart.legend.fontFamily + ', Arial, Helvetica, Ubuntu')
                .style('font-style', chart.legend.fontStyle == 'bold' ? 'normal' : chart.legend.fontStyle)
                .style('font-weight', chart.legend.fontStyle == 'bold' ? 'bold' : 'normal')
                .style('text-anchor', function () {
                    switch (chart.legend.position) {
                        case 'left':
                        case 'right':
                            return 'start';
                        default:
                            return 'end';
                    }
                })
                .text(e.formatNumber(chart.legend.rangeList[chart.legend.rangeList.length - 1].maxValue, chart.legend.numberFormat))
                .attr('transform', function () {
                    //calculate x and y pos
                    switch (chart.legend.position) {
                        case 'left':
                        case 'right':
                            {
                                xPos = rangedLegend.blockWidth + legendIconOffset + 1;
                                yPos = rangedLegend.blockHeight * chart.legend.rangeList.length + chart.legend.fontSize - tempTextSVGOffset.height;
                            }
                            break;
                        default:
                            {
                                xPos = rangedLegend.blockWidth * chart.legend.rangeList.length + chart.legend.fontSize - tempTextSVGOffset.height;
                                yPos = rangedLegend.blockHeight + tempTextSVGOffset.height + 1;
                            }
                            break;
                    }
                    //return translation
                    return 'translate(' + xPos + ',' + yPos + ')';
                });

            //calculate automatic legend width
            switch (chart.legend.position) {
                case 'top':
                case 'bottom':
                    {
                        let valueTexts = rangedLegend.svg.selectAll('.eve-legend-icon'),
                            valueWidths = [];

                        valueTexts.each(function (d) {
                            valueWidths.push(this.getBoundingClientRect().width);
                        });

                        texts.each(function (d, i) {
                            let widthtoSubtract = 5;

                            if (i === 0)
                                widthtoSubtract += Math.max(valueWidths[i], valueWidths[i + 1] / 2);
                            else if (i + 2 === valueWidths.length)
                                widthtoSubtract += Math.max(valueWidths[i] / 2, valueWidths[i + 1]);
                            else
                                widthtoSubtract += Math.max(valueWidths[i] / 2, valueWidths[i + 1] / 2);

                            widthtoSubtract *= 2;
                            chart.wrapText(d3.select(this), rangedLegend.blockWidth - widthtoSubtract);

                        });
                    }
                    break;
            }

            //get bbox of the svg
            tempDimensions = rangedLegend.svg.node().getBoundingClientRect();

            //calculate legend width and height
            switch (chart.legend.position) {
                case 'left':
                case 'right':
                    {
                        //set legend size
                        rangedLegend.height = tempDimensions.height + (options.legendSpace ? legendIconOffset : 0);
                        rangedLegend.width = tempDimensions.width;
                        //set overall legend sizes
                        width = width < rangedLegend.width ? rangedLegend.width : width;
                        height += rangedLegend.height;
                    }
                    break;
                default:
                    {
                        //set legend size
                        rangedLegend.height = tempDimensions.height;
                        rangedLegend.width = tempDimensions.width + (options.legendSpace ? legendIconOffset : 0);
                        //set overall legend sizes
                        width += rangedLegend.width;
                        height = height < rangedLegend.height ? rangedLegend.height : height;
                    }
                    break;
            }
        }

        //updates ranged type legend
        function updateRangedLegend() {
            //calculate legend width and height
            switch (chart.legend.position) {
                case 'left':
                case 'right':
                    {
                        //set overall legend sizes
                        width = width < rangedLegend.width ? rangedLegend.width : width;
                        height += rangedLegend.height;
                    }
                    break;
                default:
                    {
                        //set overall legend sizes
                        width += rangedLegend.width;
                        height = height < rangedLegend.height ? rangedLegend.height : height;
                    }
                    break;
            }
        }

        //creates gradient type legend
        function createGradientLegend(options) {
            //declare needed variables
            let textColors = [chart.legend.fontColor, chart.legend.fontColor];

            //switch chart type to process legend values
            switch (chart.masterType) {
                case 'map':
                    {
                        //switch chart type to process legend values
                        switch (chart.type) {
                            case 'ddCartogram':
                                {
                                    //if there is no color field need to exit
                                    if (chart.series[0].colorField === '') return;

                                    //set gradient min and max
                                    gradientLegend.minMax = [chart.domains.minColor, chart.domains.maxColor];
                                }
                                break;
                            case 'contCartogram':
                                {
                                    //set gradient min and max
                                    if (chart.series[0].colorField === '')
                                        gradientLegend.minMax = [chart.domains.minY, chart.domains.maxY];
                                    else
                                        gradientLegend.minMax = [chart.domains.minColor, chart.domains.maxColor];
                                }
                                break;
                            case 'densityMap':
                                {
                                    //set gradient min and max
                                    gradientLegend.minMax = ['', ''];
                                }
                                break;
                            default:
                                {
                                    //set gradient min and max
                                    gradientLegend.minMax = [chart.domains.minY, chart.domains.maxY];

                                    //set min value from user entry
                                    if (chart.yAxis.min)
                                        gradientLegend.minMax[0] = chart.yAxis.min;

                                    //set max value from user entry
                                    if (chart.yAxis.max)
                                        gradientLegend.minMax[1] = chart.yAxis.max;
                                }
                                break;
                        }
                    }
                    break;
                default:
                    {
                        //set min and max legend values
                        gradientLegend.minMax = [chart.domains.minY, chart.domains.maxY];

                        //set min value
                        if (chart.yAxis.min)
                            gradientLegend.minMax[0] = chart.yAxis.min;

                        //set max value
                        if (chart.yAxis.max)
                            gradientLegend.minMax[1] = chart.yAxis.max;
                    }
                    break;
            }

            //create multiples
            if (chart.type === 'multiples') {
                //check serie vis type
                switch (chart.series[0].type) {
                    case 'ddCartogram':
                        {
                            if (chart.series[0].colorField === '') return;
                            gradientLegend.minMax = [chart.domains.minColor, chart.domains.maxColor];
                        }
                        break;
                    case 'contCartogram':
                        {
                            //set gradient min and max
                            if (chart.series[0].colorField === '')
                                gradientLegend.minMax = [chart.domains.minY, chart.domains.maxY];
                            else
                                gradientLegend.minMax = [chart.domains.minColor, chart.domains.maxColor];
                        }
                        break;
                    case 'densityMap':
                        {
                            //set gradient min and max
                            gradientLegend.minMax = ['', ''];
                        }
                        break;
                    default:
                        {
                            //set gradient min and max
                            if (chart.yAxis.min != null && chart.yAxis.max != null)
                                gradientLegend.minMax = [chart.yAxis.min, chart.yAxis.max];
                        }
                        break;
                }
            }

            //handle min max
            if (chart.type === 'multiples') {
                //update legend values
                updateMultipleDataForLegend();

                //extract min max from multiple data content
                gradientLegend.minMax = [minMeasure, maxMeasure];
            }

            //set temp text value
            tempTextValue = e.formatNumber(gradientLegend.minMax[1], chart.legend.numberFormat);
            gradientLegend.percentage = Math.ceil(100 / (chart.legend.gradientColors.length - 1));

            //get width of the text
            tempTextSVGOffset = getTempOffset(tempTextValue);

            //append gradient Legend g
            gradientLegend.svg = legendG.append('g');

            //calculate automatic legend width
            //switch legend position to setup the min and max stops
            //determine text colors
            switch (chart.legend.position) {
                case 'left':
                case 'right':
                    {
                        //calculate legend dimension
                        gradientLegend.width = gradientLegend.dimension + legendIconOffset * 2 + tempTextSVGOffset.width;
                        gradientLegend.height = (sizes.maxHeight - plot.top - plot.bottom) - height - (options.legendSpace ? legendIconOffset : 0) - 5;
                        gradientLegend.blockHeight = gradientLegend.height;
                        gradientLegend.blockWidth = gradientLegend.dimension;
                        //create legend gradient
                        gradientLegend.gradient = legendSvg
                            .append('defs')
                            .append('linearGradient')
                            .attr('x1', '0%')
                            .attr('y1', '0%')
                            .attr('x2', '0%')
                            .attr('y2', '100%')
                            .attr('id', 'gradient' + chart.container);
                    }
                    break;
                default:
                    {
                        //calculate legend dimension
                        gradientLegend.width = (sizes.maxWidth - plot.right - plot.left) - width - (options.legendSpace ? legendIconOffset : 0) - 5;
                        gradientLegend.height = Math.max(gradientLegend.dimension, tempTextSVGOffset.height) + legendIconOffset * 2;
                        gradientLegend.blockHeight = Math.max(gradientLegend.dimension, tempTextSVGOffset.height);
                        gradientLegend.blockWidth = gradientLegend.width;
                        //create legend gradient
                        gradientLegend.gradient = legendSvg
                            .append('defs')
                            .append('linearGradient')
                            .attr('x1', '0%')
                            .attr('y1', '0%')
                            .attr('x2', '100%')
                            .attr('y2', '0%')
                            .attr('id', 'gradient' + chart.container);
                        if (chart.legend.smartLabels) {
                            //set autoColor if applicable
                            textColors[0] = chart.getAutoColor(chart.legend.gradientColors[0]);
                            textColors[1] = chart.getAutoColor(chart.legend.gradientColors[chart.legend.gradientColors.length - 1]);
                        }
                    }
                    break;
            }

            //add color stops to gradient
            gradientLegend.gradient.selectAll('stop')
                .data(chart.legend.gradientColors)
                .enter().append('stop')
                .attr('offset', function (d, i) {
                    if (i === chart.legend.gradientColors.length - 1)
                        return '100%';
                    else
                        return (i * gradientLegend.percentage) + '%';
                })
                .attr('stop-color', function (d) {
                    return d;
                });

            //append gradient rect
            gradientLegend.svg.append('rect')
                .attr('width', gradientLegend.blockWidth)
                .attr('height', gradientLegend.blockHeight)
                .on('click', function () {
                    //check whether the chart legend click has value
                    if (chart.onLegendClick)
                        chart.onLegendClick('legend');
                })
                .style('fill', 'url(#gradient' + chart.container + ')');

            //add minimum text
            gradientLegend.minLabel = gradientLegend.svg.append('text')
                .style('font-size', chart.legend.fontSize + 'px')
                .style('fill', textColors[0])
                .style('font-family', chart.legend.fontFamily + ', Arial, Helvetica, Ubuntu')
                .style('font-style', chart.legend.fontStyle == 'bold' ? 'normal' : chart.legend.fontStyle)
                .style('font-weight', chart.legend.fontStyle == 'bold' ? 'bold' : 'normal')
                .style('text-anchor', 'start')
                .on('click', function () {
                    //check whether the chart legend click has value
                    if (chart.onLegendClick)
                        chart.onLegendClick('legend');
                })
                .text(e.formatNumber(gradientLegend.minMax[0], chart.legend.numberFormat))
                .attr('transform', function (d, i) {
                    //calculate x and y pos
                    switch (chart.legend.position) {
                        case 'left':
                        case 'right':
                            {
                                xPos = gradientLegend.blockWidth + legendIconOffset;
                                yPos = tempTextSVGOffset.height;
                            }
                            break;
                        default:
                            {
                                xPos = 3;
                                yPos = gradientLegend.blockHeight - 3;
                            }
                            break;
                    }

                    //return translation
                    return 'translate(' + xPos + ',' + yPos + ')';
                });

            //add maximum text
            gradientLegend.maxLabel = gradientLegend.svg.append('text')
                .style('font-size', chart.legend.fontSize + 'px')
                .style('fill', textColors[1])
                .style('font-family', chart.legend.fontFamily + ', Arial, Helvetica, Ubuntu')
                .style('font-style', chart.legend.fontStyle == 'bold' ? 'normal' : chart.legend.fontStyle)
                .style('font-weight', chart.legend.fontStyle == 'bold' ? 'bold' : 'normal')
                .style('text-anchor', function () {
                    //calculate x and y pos
                    switch (chart.legend.position) {
                        case 'left':
                        case 'right':
                            return 'start';
                        default:
                            return 'end';
                    }
                })
                .on('click', function () {
                    //check whether the chart legend click has value
                    if (chart.onLegendClick)
                        chart.onLegendClick('legend');
                })
                .text(e.formatNumber(gradientLegend.minMax[1], chart.legend.numberFormat))
                .attr('transform', function (d, i) {
                    //calculate x and y pos
                    switch (chart.legend.position) {
                        case 'left':
                        case 'right':
                            {
                                xPos = gradientLegend.blockWidth + legendIconOffset;
                                yPos = gradientLegend.blockHeight + chart.legend.fontSize - tempTextSVGOffset.height;
                            }
                            break;
                        default:
                            {
                                xPos = gradientLegend.blockWidth - 3;
                                yPos = gradientLegend.blockHeight - 3;
                            }
                            break;
                    }

                    //return translation
                    return 'translate(' + xPos + ',' + yPos + ')';
                });

            //get bbox of the svg
            tempDimensions = gradientLegend.svg.node().getBoundingClientRect();

            //calculate legend width and height
            switch (chart.legend.position) {
                case 'left':
                case 'right':
                    {
                        //set legend size
                        gradientLegend.height = tempDimensions.height + (options.legendSpace ? legendIconOffset : 0);
                        gradientLegend.width = tempDimensions.width;

                        //set overall legend sizes
                        width = width < gradientLegend.width ? gradientLegend.width : width;
                        height += gradientLegend.height;
                    }
                    break;
                default:
                    {
                        //set legend size
                        gradientLegend.height = tempDimensions.height;
                        gradientLegend.width = tempDimensions.width + (options.legendSpace ? legendIconOffset : 0);

                        //set overall legend sizes
                        width += gradientLegend.width;
                        height = height < gradientLegend.height ? gradientLegend.height : height;
                    }
                    break;
            }
        }

        //updates gradient type legend
        function updateGradientLegend() {
            //switch chart type to process legend values
            switch (chart.masterType) {
                case 'map':
                    {
                        //switch chart type to process legend values
                        switch (chart.type) {
                            case 'ddCartogram':
                                {
                                    //if there is no color field need to exit
                                    if (chart.series[0].colorField === '') return;

                                    //set gradient min and max
                                    gradientLegend.minMax = [chart.domains.minColor, chart.domains.maxColor];
                                }
                                break;
                            case 'contCartogram':
                                {
                                    //set gradient min and max
                                    if (chart.series[0].colorField === '')
                                        gradientLegend.minMax = [chart.domains.minY, chart.domains.maxY];
                                    else
                                        gradientLegend.minMax = [chart.domains.minColor, chart.domains.maxColor];
                                }
                                break;
                            case 'densityMap':
                                {
                                    //set gradient min and max
                                    gradientLegend.minMax = ['', ''];
                                }
                                break;
                            default:
                                {
                                    //set gradient min and max
                                    gradientLegend.minMax = [chart.domains.minY, chart.domains.maxY];

                                    //set min value from user entry
                                    if (chart.yAxis.min)
                                        gradientLegend.minMax[0] = chart.yAxis.min;

                                    //set max value from user entry
                                    if (chart.yAxis.max)
                                        gradientLegend.minMax[1] = chart.yAxis.max;
                                }
                                break;
                        }
                    }
                    break;
                default:
                    {
                        //set min and max legend values
                        gradientLegend.minMax = [chart.domains.minY, chart.domains.maxY];

                        //set min value
                        if (chart.yAxis.min)
                            gradientLegend.minMax[0] = chart.yAxis.min;

                        //set max value
                        if (chart.yAxis.max)
                            gradientLegend.minMax[1] = chart.yAxis.max;
                    }
                    break;
            }

            //create multiples
            if (chart.type === 'multiples') {
                //check serie vis type
                switch (chart.series[0].type) {
                    case 'ddCartogram':
                        {
                            if (chart.series[0].colorField === '') return;
                            gradientLegend.minMax = [chart.domains.minColor, chart.domains.maxColor];
                        }
                        break;
                    case 'contCartogram':
                        {
                            //set gradient min and max
                            if (chart.series[0].colorField === '')
                                gradientLegend.minMax = [chart.domains.minY, chart.domains.maxY];
                            else
                                gradientLegend.minMax = [chart.domains.minColor, chart.domains.maxColor];
                        }
                        break;
                    case 'densityMap':
                        {
                            //set gradient min and max
                            gradientLegend.minMax = ['', ''];
                        }
                        break;
                    default:
                        {
                            //set gradient min and max
                            if (chart.yAxis.min != null && chart.yAxis.max != null)
                                gradientLegend.minMax = [chart.yAxis.min, chart.yAxis.max];
                        }
                        break;
                }
            }

            //set label texts
            gradientLegend.minLabel.text(e.formatNumber(gradientLegend.minMax[0], chart.legend.numberFormat));
            gradientLegend.maxLabel.text(e.formatNumber(gradientLegend.minMax[1], chart.legend.numberFormat));

            //calculate legend width and height
            switch (chart.legend.position) {
                case 'left':
                case 'right':
                    {
                        //set overall legend sizes
                        width = width < gradientLegend.width ? gradientLegend.width : width;
                        height += gradientLegend.height;
                    }
                    break;
                default:
                    {
                        //set overall legend sizes
                        width += gradientLegend.width;
                        height = height < gradientLegend.height ? gradientLegend.height : height;
                    }
                    break;
            }
        }

        //creates scaled type legend
        function createScaledLegend() {
            let lastRadius = 0;
            scaledLegend.rScale = d3.scalePow().exponent(0.5).domain([chart.domains.minY, chart.domains.maxY]).range([(chart.domains.minY === chart.domains.maxY ? chart.series[0].maxBulletSize : chart.series[0].minBulletSize), chart.series[0].maxBulletSize]);
            scaledLegend.band = (chart.domains.maxY - chart.domains.minY) / (chart.legend.circleCount - 1);

            //create scaled legend data
            lastRadius = scaledLegend.rScale(chart.domains.maxY);
            scaledLegend.legendValues.push({
                value: e.formatNumber(chart.domains.maxY, chart.legend.numberFormat),
                radius: lastRadius
            });

            for (i = 1; i < chart.legend.circleCount; i++) {
                if (lastRadius - scaledLegend.rScale(chart.domains.maxY - scaledLegend.band * i) > chart.legend.fontSize / 2) {
                    lastRadius = scaledLegend.rScale(chart.domains.maxY - scaledLegend.band * i);
                    scaledLegend.legendValues.push({
                        value: e.formatNumber(chart.domains.maxY - scaledLegend.band * i, chart.legend.numberFormat),
                        radius: scaledLegend.rScale(chart.domains.maxY - scaledLegend.band * i)
                    });
                } else {
                    scaledLegend.legendValues.push({
                        value: '',
                        radius: 0
                    });
                }
            }
            if (lastRadius === scaledLegend.rScale(chart.domains.maxY)) {
                scaledLegend.legendValues[0].value = '';
                scaledLegend.legendValues[0].radius = 0;
            }

            //set start values for comparison
            tempTextValue = '';
            tempTextValueLength = 0;

            //iterate all legend values
            scaledLegend.legendValues.forEach(function (currentLegend) {
                //retrieve max length text
                if (currentLegend.value.toString().length > tempTextValueLength) {
                    tempTextValue = currentLegend.value.toString();
                    tempTextValueLength = currentLegend.value.toString().length;
                }
            });

            //get width of the text
            tempTextSVGOffset = getTempOffset(tempTextValue);

            //get scaled legend size
            scaledLegend.width = tempTextSVGOffset.width + chart.series[0].maxBulletSize * 2 + legendIconOffset * 2;
            scaledLegend.height = chart.series[0].maxBulletSize * 2 + chart.legend.fontSize / 2;

            //calculate legend width and height
            switch (chart.legend.position) {
                case 'left':
                case 'right':
                    {
                        //set overall legend sizes
                        width = width < scaledLegend.width ? scaledLegend.width : width;
                        height += scaledLegend.height;
                    }
                    break;
                default:
                    {
                        //set overall legend sizes
                        width += scaledLegend.width;
                        height = height < scaledLegend.height ? scaledLegend.height : height;
                    }
                    break;
            }

            //append gradient Legend g
            scaledLegend.svg = legendG
                .append('g');

            //switch legend icons
            switch (chart.series[0].tileIcon) {
                case 'circle':
                    {
                        //append legend circles
                        scaledLegend.icons = scaledLegend.svg.selectAll('.eve-legend-scaled-circle')
                            .data(scaledLegend.legendValues)
                            .enter().append('circle')
                            .attr('class', 'eve-legend-scaled-circle')
                            .style("stroke", "black")
                            .style("stroke-width", 1)
                            .attr("r", function (d) { return d.radius; });
                    }
                    break;
                case 'square':
                    {
                        //append legend circles
                        scaledLegend.icons = scaledLegend.svg.selectAll('.eve-legend-scaled-circle')
                            .data(scaledLegend.legendValues)
                            .enter().append('rect')
                            .attr('class', 'eve-legend-scaled-circle')
                            .style("stroke", "black")
                            .style("stroke-width", 1)
                            .attr('width', function (d) { return d.radius * 2; })
                            .attr('height', function (d) { return d.radius * 2; });
                    }
                    break;
                default:
                    {
                        //append legend circles
                        scaledLegend.icons = scaledLegend.svg.selectAll('.eve-legend-scaled-circle')
                            .data(scaledLegend.legendValues)
                            .enter().append('circle')
                            .attr('class', 'eve-legend-scaled-circle')
                            .style("stroke", "black")
                            .style("stroke-width", 1)
                            .attr("r", function (d) { return d.radius; });
                    }
            }

            //append legend lines
            scaledLegend.lines = scaledLegend.svg.selectAll('.eve-legend-scaled-line')
                .data(scaledLegend.legendValues)
                .enter().append('line')
                .attr('class', 'eve-legend-scaled-line')
                .style("stroke", "black")
                .style("stroke-width", 1);

            //append legend text
            scaledLegend.texts = scaledLegend.svg.selectAll('.eve-legend-scaled-text')
                .data(scaledLegend.legendValues)
                .enter().append('text')
                .attr('class', 'eve-legend-scaled-text')
                .style('font-size', chart.legend.fontSize + 'px')
                .style('fill', chart.legend.fontColor)
                .style('font-family', chart.legend.fontFamily + ', Arial, Helvetica, Ubuntu')
                .style('font-style', chart.legend.fontStyle == 'bold' ? 'normal' : chart.legend.fontStyle)
                .style('font-weight', chart.legend.fontStyle == 'bold' ? 'bold' : 'normal')
                .style('cursor', 'pointer')
                .text(function (d) { return d.value; });

            //transform legend circles
            scaledLegend.icons
                .on('click', function () {
                    //check whether the chart legend click has value
                    if (chart.onLegendClick)
                        chart.onLegendClick('legend');
                })
                .attr('transform', function (d, i) {
                    //set x and y position
                    yPos = (chart.series[0].tileIcon === 'square' ? chart.series[0].maxBulletSize - d.radius * 2 : chart.series[0].maxBulletSize - d.radius);
                    xPos = (chart.series[0].tileIcon === 'square' ? ((chart.series[0].maxBulletSize - d.radius) * 2) : chart.series[0].maxBulletSize);

                    //return translation for the current icon
                    return 'translate(' + xPos + ', ' + yPos + ')';
                });

            //transform legend lines
            scaledLegend.lines
                .attr('x1', function (d) { return d.value === '' ? 0 : (chart.series[0].tileIcon === 'square' ? chart.series[0].maxBulletSize * 2 : chart.series[0].maxBulletSize); })
                .attr('y1', function (d) { return chart.series[0].maxBulletSize - d.radius * 2; })
                .attr('x2', function (d) { return d.value === '' ? 0 : chart.series[0].maxBulletSize * 2 + legendIconOffset; })
                .attr('y2', function (d) { return chart.series[0].maxBulletSize - d.radius * 2; });

            //transform legend text
            scaledLegend.texts
                .on('click', function () {
                    //check whether the chart legend click has value
                    if (chart.onLegendClick)
                        chart.onLegendClick('legend');
                })
                .attr('transform', function (d, i) {
                    //set x and y position
                    xPos = chart.series[0].maxBulletSize * 2 + legendIconOffset * 2;
                    yPos = chart.series[0].maxBulletSize - d.radius * 2 + chart.legend.fontSize / 2;

                    //return translation for the current icon
                    return 'translate(' + xPos + ', ' + yPos + ')';
                });
        }

        //updates scaled type legend
        function updateScaledLegend() {
            let lastRadius = 0;
            scaledLegend.rScale = d3.scalePow().exponent(0.5).domain([chart.domains.minY, chart.domains.maxY]).range([(chart.domains.minY === chart.domains.maxY ? chart.series[0].maxBulletSize : chart.series[0].minBulletSize), chart.series[0].maxBulletSize]);
            scaledLegend.band = (chart.domains.maxY - chart.domains.minY) / (chart.legend.circleCount - 1);

            //create scaled legend data
            lastRadius = scaledLegend.rScale(chart.domains.maxY);
            scaledLegend.legendValues[0].value = e.formatNumber(chart.domains.maxY, chart.legend.numberFormat);
            scaledLegend.legendValues[0].radius = lastRadius;

            for (i = 1; i < chart.legend.circleCount; i++) {
                if (lastRadius - scaledLegend.rScale(chart.domains.maxY - scaledLegend.band * i) > chart.legend.fontSize / 2) {
                    lastRadius = scaledLegend.rScale(chart.domains.maxY - scaledLegend.band * i);
                    scaledLegend.legendValues[i].value = e.formatNumber(chart.domains.maxY - scaledLegend.band * i, chart.legend.numberFormat);
                    scaledLegend.legendValues[i].radius = scaledLegend.rScale(chart.domains.maxY - scaledLegend.band * i);
                } else {
                    scaledLegend.legendValues[i].value = '';
                    scaledLegend.legendValues[i].radius = 0;
                }
            }
            if (lastRadius === scaledLegend.rScale(chart.domains.maxY)) {
                scaledLegend.legendValues[0].value = '';
                scaledLegend.legendValues[0].radius = 0;
            }
            //set start values for comparison
            tempTextValue = '';
            tempTextValueLength = 0;

            //iterate all legend values
            scaledLegend.legendValues.forEach(function (currentLegend) {
                //retrieve max length text
                if (currentLegend.value.toString().length > tempTextValueLength) {
                    tempTextValue = currentLegend.value.toString();
                    tempTextValueLength = currentLegend.value.toString().length;
                }
            });

            //get width of the text
            tempTextSVGOffset = getTempOffset(tempTextValue);

            //get scaled legend size
            scaledLegend.width = tempTextSVGOffset.width + chart.series[0].maxBulletSize * 2 + legendIconOffset * 2;
            scaledLegend.height = chart.series[0].maxBulletSize * 2 + chart.legend.fontSize / 2;

            //calculate legend width and height
            switch (chart.legend.position) {
                case 'left':
                case 'right':
                    {
                        //set overall legend sizes
                        width = width < scaledLegend.width ? scaledLegend.width : width;
                        height += scaledLegend.height;
                    }
                    break;
                default:
                    {
                        //set overall legend sizes
                        width += scaledLegend.width;
                        height = height < scaledLegend.height ? scaledLegend.height : height;
                    }
                    break;
            }

            //update legend icon data
            scaledLegend.icons
                .on('click', function () {
                    //check whether the chart legend click has value
                    if (chart.onLegendClick)
                        chart.onLegendClick('legend');
                })
                .data(scaledLegend.legendValues);

            //switch legend icons
            switch (chart.series[0].tileIcon) {
                case 'circle':
                    {
                        //transform legend circles
                        scaledLegend.icons
                            .transition().duration(chart.animation.duration)
                            .ease(chart.animation.easing.toEasing())
                            .attr("r", function (d) { return d.radius; })
                            .attr('transform', function (d, i) {
                                //set x and y position
                                yPos = chart.series[0].maxBulletSize - d.radius;
                                xPos = chart.series[0].maxBulletSize;

                                //return translation for the current icon
                                return 'translate(' + xPos + ', ' + yPos + ')';
                            });
                    }
                    break;
                case 'square':
                    {
                        //transform legend circles
                        scaledLegend.icons
                            .transition().duration(chart.animation.duration)
                            .ease(chart.animation.easing.toEasing())
                            .attr('width', function (d) { return d.radius * 2; })
                            .attr('height', function (d) { return d.radius * 2; })
                            .attr('transform', function (d, i) {
                                //set x and y position
                                yPos = chart.series[0].maxBulletSize - d.radius * 2;
                                xPos = (chart.series[0].maxBulletSize - d.radius) * 2;

                                //return translation for the current icon
                                return 'translate(' + xPos + ', ' + yPos + ')';
                            });
                    }
                    break;
                default:
                    {
                        //transform legend circles
                        scaledLegend.icons
                            .transition().duration(chart.animation.duration)
                            .ease(chart.animation.easing.toEasing())
                            .attr("r", function (d) { return d.radius; })
                            .attr('transform', function (d, i) {
                                //set x and y position
                                yPos = chart.series[0].maxBulletSize - d.radius;
                                xPos = chart.series[0].maxBulletSize;

                                //return translation for the current icon
                                return 'translate(' + xPos + ', ' + yPos + ')';
                            });
                    }
            }

            //update legend line data
            scaledLegend.lines
                .data(scaledLegend.legendValues);

            //transform legend lines
            scaledLegend.lines
                .transition().duration(chart.animation.duration)
                .ease(chart.animation.easing.toEasing())
                .attr('x1', function (d) { return d.value === '' ? 0 : (chart.series[0].tileIcon === 'square' ? chart.series[0].maxBulletSize * 2 : chart.series[0].maxBulletSize); })
                .attr('y1', function (d) { return chart.series[0].maxBulletSize - d.radius * 2; })
                .attr('x2', function (d) { return d.value === '' ? 0 : chart.series[0].maxBulletSize * 2 + legendIconOffset; })
                .attr('y2', function (d) { return chart.series[0].maxBulletSize - d.radius * 2; });

            //update legend text data
            scaledLegend.texts
                .on('click', function () {
                    //check whether the chart legend click has value
                    if (chart.onLegendClick)
                        chart.onLegendClick('legend');
                })
                .data(scaledLegend.legendValues);

            //transform legend text
            scaledLegend.texts
                .transition().duration(chart.animation.duration)
                .ease(chart.animation.easing.toEasing())
                .text(function (d) { return d.value; })
                .attr('transform', function (d, i) {
                    //set x and y position
                    xPos = chart.series[0].maxBulletSize * 2 + legendIconOffset * 2;
                    yPos = chart.series[0].maxBulletSize - d.radius * 2 + chart.legend.fontSize / 2;

                    //return translation for the current icon
                    return 'translate(' + xPos + ', ' + yPos + ')';
                });
        }

        //helper function for getting text svg size
        function getTempOffset(text) {
            //attach the text svg
            tempTextSVG = legendG
                .append('text')
                .style('font-size', chart.legend.fontSize + 'px')
                .style('fill', chart.legend.fontColor)
                .style('font-family', chart.legend.fontFamily + ', Arial, Helvetica, Ubuntu')
                .style('font-style', chart.legend.fontStyle == 'bold' ? 'normal' : chart.legend.fontStyle)
                .style('font-weight', chart.legend.fontStyle == 'bold' ? 'bold' : 'normal')
                .text(text);

            //get bbox of the text svg
            tempOffset = tempTextSVG.node().getBoundingClientRect();

            //remove temp text svg
            tempTextSVG.remove();

            //return offset
            return tempOffset;
        }

        //helper function for getting text svg size
        function getWrappedTempOffset(text, width) {
            //attach the text svg
            tempTextSVG = legendG
                .append('text')
                .style('font-size', chart.legend.fontSize + 'px')
                .style('fill', chart.legend.fontColor)
                .style('font-family', chart.legend.fontFamily + ', Arial, Helvetica, Ubuntu')
                .style('font-style', chart.legend.fontStyle == 'bold' ? 'normal' : chart.legend.fontStyle)
                .style('font-weight', chart.legend.fontStyle == 'bold' ? 'bold' : 'normal')
                .text(text);

            chart.wrapText(tempTextSVG, width);

            //get bbox of the text svg
            tempOffset = tempTextSVG.node().getBoundingClientRect();

            //remove temp text svg
            tempTextSVG.remove();

            //return offset
            return tempOffset;
        }

        //check whether the legend is enabled
        if (chart.legend.enabled) {
            //create the container
            createLegendContainer();

            //switch legend type to set it
            switch (chart.legend.type.trim()) {
                case 'default':
                    {
                        //create the legend
                        createDefaultLegend({ onClickEnabled: true });

                        //switch legend type to set it
                        switch (chart.legend.secondaryType) {
                            case 'default':
                                {
                                    //throw Error('Legend type and secondary type cannot be same!');
                                }
                                break;
                            case 'ranged':
                                {
                                    createRangedLegend({ onClickEnabled: true, legendSpace: true });
                                }
                                break;
                            case 'gradient':
                                {
                                    createGradientLegend({ legendSpace: true });
                                }
                                break;
                            case 'scaled':
                                {
                                    createScaledLegend();
                                }
                                break;
                        }
                    }
                    break;
                case 'ranged':
                    {
                        //switch legend type to set it
                        switch (chart.legend.secondaryType) {
                            case 'default':
                                {
                                    createDefaultLegend({ onClickEnabled: false });
                                    twoLegends = true;
                                }
                                break;
                            case 'ranged':
                                {
                                    //throw Error('Legend type and secondary type cannot be same!');
                                }
                                break;
                            case 'gradient':
                                {
                                    //throw Error('Ranged and Gradient types cannot be combined!');
                                }
                                break;
                            case 'scaled':
                                {
                                    createScaledLegend();
                                    twoLegends = true;
                                }
                                break;
                        }
                        createRangedLegend({ onClickEnabled: true, legendSpace: twoLegends });
                    }
                    break;
                case 'gradient':
                    {
                        //switch legend type to set it
                        switch (chart.legend.secondaryType) {
                            case 'default':
                                {
                                    createDefaultLegend({ onClickEnabled: false });
                                    twoLegends = true;
                                }
                                break;
                            case 'ranged':
                                {
                                    //throw Error('Ranged and Gradient types cannot be combined!');
                                }
                                break;
                            case 'gradient':
                                {
                                    //throw Error('Legend type and secondary type cannot be same!');
                                }
                                break;
                            case 'scaled':
                                {
                                    createScaledLegend();
                                    twoLegends = true;
                                }
                                break;
                        }
                        //create the gradient legend
                        createGradientLegend({ legendSpace: twoLegends });
                    }
                    break;
                case 'scaled':
                    {
                        createScaledLegend();
                        //switch legend type to set it
                        switch (chart.legend.secondaryType) {
                            case 'default':
                                {
                                    createDefaultLegend({ onClickEnabled: false });
                                }
                                break;
                            case 'ranged':
                                {
                                    createRangedLegend({ onClickEnabled: true, legendSpace: true });
                                }
                                break;
                            case 'gradient':
                                {
                                    createGradientLegend({ legendSpace: true });
                                }
                                break;
                            case 'scaled':
                                {
                                    //throw Error('Legend type and secondary type cannot be same!');
                                }
                                break;
                        }
                    }
            }

            //set legend sizes
            if (defaultLegend.svg || rangedLegend.svg || gradientLegend.svg || scaledLegend.svg) {
                setSizes();
            } else {
                legendContainer.remove();

                //update inner container style
                d3.select('#' + chart.innerContainer)
                    .style('float', null);
            }
        }

        //attach update method to legned
        that.update = function () {
            twoLegends = false;
            width = 0;
            height = 0;

            //check whether the legend is enabled
            if (chart.legend.enabled) {
                //switch legend type to set it
                switch (chart.legend.type) {
                    case 'default':
                        {
                            if (defaultLegend.svg)
                                updateDefaultLegend({ onClickEnabled: true });

                            //switch legend type to set it
                            switch (chart.legend.secondaryType) {
                                case 'ranged':
                                    {
                                        twoLegends = true;
                                        //to do --> update gradient size based on new default
                                        if (rangedLegend.svg)
                                            updateRangedLegend();
                                    }
                                    break;
                                case 'gradient':
                                    {
                                        twoLegends = true;
                                        //to do --> update gradient size based on new default
                                        if (gradientLegend.svg)
                                            updateGradientLegend();
                                    }
                                    break;
                                case 'scaled':
                                    {
                                        if (scaledLegend.svg)
                                            updateScaledLegend();
                                    }
                                    break;
                            }
                        }
                        break;
                    case 'ranged':
                        {
                            //switch legend type to set it
                            switch (chart.legend.secondaryType) {
                                case 'default':
                                    {
                                        createDefaultLegend({ onClickEnabled: false });
                                        twoLegends = true;
                                        //to do --> update ranged size based on new default
                                    }
                                    break;
                                case 'scaled':
                                    {
                                        if (scaledLegend.svg)
                                            updateScaledLegend();
                                    }
                                    break;
                            }
                            if (rangedLegend.svg)
                                updateRangedLegend();
                        }
                        break;
                    case 'gradient':
                        {
                            if (chart.type !== 'streamGraph') {
                                //switch legend type to set it
                                switch (chart.legend.secondaryType) {
                                    case 'default':
                                        {
                                            if (defaultLegend.svg)
                                                updateDefaultLegend({ onClickEnabled: false });
                                            twoLegends = true;
                                            //to do --> update gradient size based on new default
                                        }
                                        break;
                                    case 'scaled':
                                        {
                                            if (scaledLegend.svg)
                                                updateScaledLegend();
                                        }
                                        break;
                                }

                                if (gradientLegend.svg)
                                    updateGradientLegend();
                            }
                        }
                        break;
                    case 'scaled':
                        {
                            if (scaledLegend.svg)
                                updateScaledLegend();
                            //switch legend type to set it
                            switch (chart.legend.secondaryType) {
                                case 'default':
                                    {
                                        if (defaultLegend.svg)
                                            updateDefaultLegend({ onClickEnabled: false });
                                    }
                                    break;
                                case 'ranged':
                                    {
                                        if (rangedLegend.svg)
                                            updateRangedLegend();
                                    }
                                    break;
                                case 'gradient':
                                    {
                                        if (gradientLegend.svg)
                                            updateGradientLegend();
                                    }
                                    break;
                            }
                        }
                        break;
                }
                if (defaultLegend.svg || rangedLegend.svg || gradientLegend.svg || scaledLegend.svg) {
                    updateSizes();
                }
            }
        };
    }

    //attach create legend method into the eve charts
    e.createLegend = function (chart) {
        return new chartLegend(chart);
    };

})(eve);
