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
(function(e) {
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
        var legendMaxWidth = chart.width / 4,
            legendMaxHeight = chart.height / 4,
            legendIconOffset = 5,
            legendSecondaryOffset = legendIconOffset * 2,
            singleLegendHeight = chart.legend.fontSize + legendIconOffset,
            singleLegendWidth = 0,
            legendWidth = 0,
            legendHeight = 0,
            legendScaledWidth = 0,
            legendScaledHeight = 0,
            legendSecondaryWidth = 0,
            legendSecondaryHeight = 0,
            rangedLegendDimension = 20,
            singleRangedLegendWidth = 0,
            singleRangedLegendHeight = 0,
            legendIconSVG = null,
            legendTextSVG = null,
            legendGradient = null,
            legendScaledSVG = null,
            legendScaledLineSVG = null,
            legendScaledTextSVG = null,
            xStartingPoint = 0,
            yStartingPoint = 0,
            xPos = 0,
            yPos = 0,
            tempTextSVG = null,
            tempTextSVGOffset = null,
            tempSecondaryTextSVGOffset = null,
            tempTextValue = '',
            tempTextValueLength = 0,
            gradientPercentage = 0,
            initialPlot = null,
            legendValues = [],
            legendScaledValues = [],
            currentValue = '',
            gradientMin = null,
            gradientMax = null,
            groupValues = [],
            tempOffset = null,
            updateDifference = 0,
            that = this;

        //set this legend svg
        that.legendSVG = null;

        //preserve initial plot
        initialPlot = e.clone(chart.plot);

        //creates default type legend
        function createDefaultLegend() {
            var currentItem = null;
            //switch chart type to set legend values
            switch (chart.type) {
                case 'sliced':
                    {
                        //sort data
                        chart.data.sort(function (a, b) {
                            return ((a[chart.xField] < b[chart.xField]) ? -1 : ((a[chart.xField] > b[chart.xField]) ? 1 : 0));
                        });

                        //iterate all chart data to set legend values
                        chart.data.forEach(function (d, i) {
                            //set current key value
                            currentValue = d[chart.xField];

                            //check whether group value is assigned
                            currentItem = e.filter(chart.legend.legendColors, 'value', currentValue);
                            if (currentItem.length > 0) {
                                //add current value into the legend values
                                legendValues.push({
                                    value: currentItem[0].value,
                                    length: currentItem[0].value.length,
                                    color: currentItem[0].color
                                });
                            }
                            else {
                                //add current value into the legend values
                                legendValues.push({
                                    value: currentValue ? currentValue.toString() : '',
                                    length: currentValue ? currentValue.toString().length : 0,
                                    color: i > e.colors.length ? e.randColor() : e.colors[i]
                                });
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
                            currentItem = e.filter(chart.legend.legendColors, 'value', d.toString());
                            if (currentItem.length > 0) {
                                //add current value into the legend values
                                legendValues.push({
                                    value: currentItem[0].value,
                                    length: currentItem[0].value.length,
                                    color: currentItem[0].color
                                });
                            }
                            else {
                                //add current value into the legend values
                                legendValues.push({
                                    value: d ? d.toString() : '',
                                    length: d ? d.toString().length : 0,
                                    color: i > e.colors.length ? e.randColor() : e.colors[i]
                                });
                            }
                        });

                        //sort legendValues
                        legendValues.sort(function (a, b) { if (a.value < b.value) { return -1; } if (a.value > b.value) { return 1; } return 0; });

                        //set legend values
                        chart.legendValues = legendValues;
                    }
                    break;
                case 'map':
                    {
                        if (chart.series[0].groupField === '') return;
                        //declare group values
                        groupValues = e.getUniqueValues(chart.data, chart.series[0].groupField);

                        //iterate all chart data to set legend values
                        groupValues.forEach(function (d, i) {
                            //check whether group value is assigned
                            currentItem = e.filter(chart.legend.legendColors, 'value', d.toString());
                            if (currentItem.length > 0) {
                                //add current value into the legend values
                                legendValues.push({
                                    value: currentItem[0].value,
                                    length: currentItem[0].value.length,
                                    color: currentItem[0].color
                                });
                            }
                            else {
                                //add current value into the legend values
                                legendValues.push({
                                    value: d ? d.toString() : '',
                                    length: d ? d.toString().length : 0,
                                    color: i > e.colors.length ? e.randColor() : e.colors[i]
                                });
                            }
                        });

                        //sort legendValues
                        legendValues.sort(function (a, b) { if (a.value < b.value) { return -1; } if (a.value > b.value) { return 1; } return 0; });

                        //set legend values
                        chart.legendValues = legendValues;
                    }
                    break;
                default:
                    {
                        //sort data
                        chart.data.sort(function (a, b) {
                            return ((a[chart.xField] < b[chart.xField]) ? -1 : ((a[chart.xField] > b[chart.xField]) ? 1 : 0));
                        });

                        //iterate all chart data to set legend values
                        chart.series.forEach(function (serie, serieIndex) {
                            //check wheter the title is not empty
                            if (serie.title && serie.title !== '') {
                                currentValue = serie.title;
                            } else {
                                //set related field content as legend text
                                if (serie.yField && serie.yField !== '')
                                    currentValue = serie.yField;
                                else if (serie.valueField && serie.valueField !== '')
                                    currentValue = serie.valueField;
                                else if (serie.measureField && serie.measureField !== '')
                                    currentValue = serie.measureField;
                            }

                            //add current value into the legend values
                            legendValues.push({
                                value: currentValue ? currentValue.toString() : '',
                                length: currentValue ? currentValue.toString().length : 0,
                                color: serie.color
                            });
                        });
                    }
                    break;
            }

            //iterate all legend values
            legendValues.forEach(function (currentLegend) {

                //get width of the text
                currentLegend.width = getTempOffset(currentLegend.value).width + chart.legend.fontSize + legendIconOffset * 2;

                //retrieve max length text
                if (currentLegend.length > tempTextValueLength) {
                    tempTextValue = currentLegend.value;
                    tempTextValueLength = currentLegend.length;
                }
            });

            //get width of the text
            tempTextSVGOffset = getTempOffset(tempTextValue);

            //set single height and width
            singleLegendHeight = tempTextSVGOffset.height + legendIconOffset;
            singleLegendWidth = tempTextSVGOffset.width + chart.legend.fontSize + legendIconOffset * 2;

            //calculate legend width and height
            switch (chart.legend.position) {
                case 'left':
                case 'right':
                    {
                        //set legend actual height
                        legendHeight = singleLegendHeight * legendValues.length;
                        legendWidth = singleLegendWidth;
                        legendWidth = legendWidth > legendMaxWidth ? legendMaxWidth : legendWidth;
                    }
                    break;
                default:
                    {
                        //set legend actual height
                        legendHeight = singleLegendHeight;
                        legendHeight = legendHeight > legendMaxHeight ? legendMaxHeight : legendHeight;
                        legendWidth = d3.sum(legendValues, function (d) { return d.width; });
                    }
                    break;
            }

            //append legend g
            that.legendSVG = chart.svg.append('g')
                .attr('transform', function (d) {
                    //switch legend position to set translation
                    switch (chart.legend.position) {
                        case 'left':
                            {
                                //calculate x position
                                xPos = chart.plot.left;

                                //calculate y position
                                yPos = chart.plot.top + (chart.plot.height - chart.plot.bottom - chart.plot.top) / 2 - legendHeight / 2;

                                //increase plot left
                                chart.plot.left += legendWidth + chart.margin.left;
                            }
                            break;
                        case 'right':
                            {
                                //calculate x position
                                xPos = chart.plot.width - legendWidth - chart.plot.right + chart.margin.right;

                                //calculate y position
                                yPos = chart.plot.top + (chart.plot.height - chart.plot.bottom - chart.plot.top) / 2 - legendHeight / 2;

                                //increase plot right
                                chart.plot.right += legendWidth + chart.margin.right;
                            }
                            break;
                        case 'bottom':
                            {
                                //calculate x position
                                xPos = chart.plot.left + (chart.plot.width - chart.plot.left - chart.plot.right) / 2 - legendWidth / 2;

                                //calculate y position
                                yPos = chart.height - chart.plot.bottom - legendHeight + chart.margin.bottom;

                                //increase plot bottom
                                chart.plot.bottom += legendHeight + chart.margin.bottom;
                            }
                            break;
                        case 'top':
                            {
                                //calculate x position
                                xPos = chart.plot.left + (chart.plot.width - chart.plot.left - chart.plot.right) / 2 - legendWidth / 2;

                                //calculate y position
                                yPos = chart.plot.top + chart.margin.top;

                                //increase plot top
                                chart.plot.top += legendHeight + chart.margin.top;
                            }
                            break;
                    }

                    //return calculated translation
                    return 'translate(' + xPos + ',' + yPos + ')';
                });

            createDefaultSVGs(true);
        }

        //updates default type legend
        function updateDefaultLegend() {
            //set new chart series
            var newChartSeries = [],
                currentItem = null;

            //switch chart type
            switch (chart.type) {
                case 'sliced':
                    {
                        //sort data
                        chart.data.sort(function (a, b) {
                            return ((a[chart.xField] < b[chart.xField]) ? -1 : ((a[chart.xField] > b[chart.xField]) ? 1 : 0));
                        });

                        //iterate all chart data to set legend values
                        chart.data.forEach(function (d, i) {
                            //set current key value
                            currentValue = d[chart.xField];

                            //check whether group value is assigned
                            currentItem = e.filter(chart.legend.legendColors, 'value', currentValue);
                            if (currentItem.length > 0) {
                                //add current value into the legend values
                                newChartSeries.push({
                                    value: currentItem[0].value,
                                    length: currentItem[0].value.length,
                                    color: currentItem[0].color
                                });
                            }
                            else {
                                //add current value into the legend values
                                newChartSeries.push({
                                    value: currentValue ? currentValue.toString() : '',
                                    length: currentValue ? currentValue.toString().length : 0,
                                    color: i > e.colors.length ? e.randColor() : e.colors[i]
                                });
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
                            currentItem = e.filter(chart.legend.legendColors, 'value', d.toString());
                            if (currentItem.length > 0) {
                                //add current value into the legend values
                                newChartSeries.push({
                                    value: currentItem[0].value,
                                    length: currentItem[0].value.length,
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
                case 'map':
                    {
                        if (chart.series[0].groupField === '') break;
                        //declare group values
                        groupValues = e.getUniqueValues(chart.data, chart.series[0].groupField);

                        //iterate all chart data to set legend values
                        groupValues.forEach(function (d, i) {
                            //check whether group value is assigned
                            currentItem = e.filter(chart.legend.legendColors, 'value', d.toString());
                            if (currentItem.length > 0) {
                                //add current value into the legend values
                                newChartSeries.push({
                                    value: currentItem[0].value,
                                    length: currentItem[0].value.length,
                                    color: currentItem[0].color
                                });
                            }
                            else {
                                //add current value into the legend values
                                newChartSeries.push({
                                    value: d ? d.toString() : '',
                                    length: d ? d.toString().length : 0,
                                    color: e.randColor()
                                });
                            }
                        });

                        //sort chartSeries
                        newChartSeries.sort(function (a, b) { if (a.value < b.value) { return -1; } if (a.value > b.value) { return 1; } return 0; });
                    }
                    break;
                default:
                    {
                        //sort data
                        chart.data.sort(function (a, b) {
                            return ((a[chart.xField] < b[chart.xField]) ? -1 : ((a[chart.xField] > b[chart.xField]) ? 1 : 0));
                        });

                        //iterate all chart data to set legend values
                        chart.series.forEach(function (serie, serieIndex) {
                            //get current serie name
                            var currentSerieName = chart.serieNames[serieIndex];

                            //check chart serie stability
                            if (chart.serieNameStability[currentSerieName] === chart.data.length) {
                                //check wheter the title is not empty
                                if (serie.title && serie.title !== '') {
                                    currentValue = serie.title;
                                } else {
                                    //set related field content as legend text
                                    if (serie.yField && serie.yField !== '')
                                        currentValue = serie.yField;
                                    else if (serie.valueField && serie.valueField !== '')
                                        currentValue = serie.valueField;
                                    else if (serie.measureField && serie.measureField !== '')
                                        currentValue = serie.measureField;
                                }

                                //add current value into the legend values
                                newChartSeries.push({
                                    value: currentValue ? currentValue.toString() : '',
                                    length: currentValue ? currentValue.toString().length : 0,
                                    color: serie.color
                                });
                            }
                        });
                    }
                    break;
            }

            //assign updated values
            legendValues = newChartSeries;

            //set start values for comparison
            tempTextValue = '';
            tempTextValueLength = 0;

            //iterate all legend values
            legendValues.forEach(function (currentLegend) {

                //get width of the text
                currentLegend.width = getTempOffset(currentLegend.value).width + chart.legend.fontSize + legendIconOffset * 2;

                //retrieve max length text
                if (currentLegend.length > tempTextValueLength) {
                    tempTextValue = currentLegend.value;
                    tempTextValueLength = currentLegend.length;
                }
            });

            //get width of the text
            updateDifference = singleLegendWidth - (getTempOffset(tempTextValue).width + chart.legend.fontSize + legendIconOffset * 2);

            //update legend width and height
            switch (chart.legend.position) {
                case 'left':
                case 'right':
                    {
                        //set legend actual height
                        legendHeight = singleLegendHeight * legendValues.length;
                    }
                    break;
                default:
                    {
                        //set legend actual width
                        legendWidth = d3.sum(legendValues, function (d) { return d.width; });
                    }
                    break;
            }

            //update legend svg position
            that.legendSVG
                .transition(chart.animation.duration)
                .ease(chart.animation.easing.toEasing())
                .attr('transform', function (d) {
                    //switch legend position to set translation
                    switch (chart.legend.position) {
                        case 'left':
                            {
                                //calculate x position
                                xPos = initialPlot.left;

                                //calculate y position
                                yPos = initialPlot.top + (initialPlot.height - initialPlot.bottom - initialPlot.top) / 2 - legendHeight / 2;
                            }
                            break;
                        case 'right':
                            {
                                //calculate x position
                                xPos = initialPlot.width - legendWidth - initialPlot.right + chart.margin.right;

                                //calculate y position
                                yPos = initialPlot.top + (initialPlot.height - initialPlot.bottom - initialPlot.top) / 2 - legendHeight / 2;
                            }
                            break;
                        case 'bottom':
                            {
                                //calculate x position
                                xPos = initialPlot.left + (initialPlot.width - initialPlot.left - initialPlot.right) / 2 - legendWidth / 2;

                                //calculate y position
                                yPos = chart.height - initialPlot.bottom - legendHeight + chart.margin.bottom;
                            }
                            break;
                        case 'top':
                            {
                                //calculate x position
                                xPos = initialPlot.left + (initialPlot.width - initialPlot.left - initialPlot.right) / 2 - legendWidth / 2;

                                //calculate y position
                                yPos = initialPlot.top + chart.margin.top;
                            }
                            break;
                    }

                    //return calculated translation
                    return 'translate(' + xPos + ',' + yPos + ')';
                });

            updateDefaultSVGs();
        }

        //create ranged type legend
        function createRangedLegend() {

            //iterate all legend values
            chart.legend.rangeList.forEach(function (range, rangeIndex) {
                //retrieve max length text
                if (range.text.length > tempTextValueLength) {
                    tempTextValue = range.text;
                    tempTextValueLength = range.text.length;
                }
                if (range.maxValue.toString().length > tempTextValueLength) {
                    tempTextValue = range.maxValue.toString();
                    tempTextValueLength = range.maxValue.toString().length;
                }
            });

            //get width of the text
            tempTextSVGOffset = getTempOffset(tempTextValue);

            //calculate automatic legend width
            switch (chart.legend.position) {
                case 'left':
                case 'right':
                    {
                        //calculate legend dimension
                        legendWidth = rangedLegendDimension + legendIconOffset + tempTextSVGOffset.width;
                        legendHeight = chart.plot.height - chart.plot.top - chart.plot.bottom;
                        singleRangedLegendHeight = (legendHeight / chart.legend.rangeList.length) - legendIconOffset;
                        singleRangedLegendWidth = rangedLegendDimension;
                    }
                    break;
                default:
                    {
                        //calculate legend dimension
                        legendHeight = rangedLegendDimension + tempTextSVGOffset.height;
                        legendWidth = chart.plot.width;
                        singleRangedLegendWidth = (chart.plot.width / chart.legend.rangeList.length) - legendIconOffset;
                        singleRangedLegendHeight = rangedLegendDimension;
                    }
                    break;
            }

            //append legend g
            that.legendSVG = chart.svg.append('g')
                .attr('transform', function (d) {
                    //switch legend position to set translation
                    switch (chart.legend.position) {
                        case 'left':
                            {
                                //calculate x position
                                xPos = chart.plot.left;

                                //calculate y position
                                yPos = chart.plot.top;

                                //increase plot left
                                chart.plot.left += legendWidth + chart.margin.left;
                            }
                            break;
                        case 'right':
                            {
                                //calculate x position
                                xPos = chart.plot.width - legendWidth - chart.plot.right;

                                //calculate y position
                                yPos = chart.plot.top;

                                //increase plot right
                                chart.plot.right += legendWidth + chart.margin.right;
                            }
                            break;
                        case 'bottom':
                            {
                                //calculate x position
                                xPos = chart.plot.left;

                                //calculate y position
                                yPos = chart.height - chart.plot.bottom - legendHeight;

                                //increase plot bottom
                                chart.plot.bottom += legendHeight + chart.margin.bottom;
                            }
                            break;
                        case 'top':
                            {
                                //calculate x position
                                xPos = chart.plot.left;

                                //calculate y position
                                yPos = chart.plot.top;

                                //increase plot top
                                chart.plot.top += legendHeight + chart.margin.top;
                            }
                            break;
                    }

                    //return calculated translation
                    return 'translate(' + xPos + ',' + yPos + ')';
                });

            createRangedSVGs(true);
        }

        //updates ranged type legend
        function updateRangedLegend() {

        }

        //create gradient type legend
        function createGradientLegend() {
            //set temp text value
            tempTextValue = chart.formatNumber(chart.domains.y[1]);
            gradientPercentage = Math.ceil(100 / chart.legend.gradientColors.length);

            //get width of the text
            tempTextSVGOffset = getTempOffset(tempTextValue);

            //calculate automatic legend width
            switch (chart.legend.position) {
                case 'left':
                case 'right':
                    {
                        //calculate legend dimension
                        legendWidth = rangedLegendDimension + legendIconOffset + tempTextSVGOffset.width;
                        legendHeight = chart.plot.height - chart.plot.top - chart.plot.bottom;
                        singleRangedLegendWidth = rangedLegendDimension;
                        singleRangedLegendHeight = legendHeight - legendIconOffset * 2;
                    }
                    break;
                default:
                    {
                        //calculate legend dimension
                        legendHeight = rangedLegendDimension + tempTextSVGOffset.height;
                        legendWidth = chart.plot.width;
                        singleRangedLegendWidth = legendWidth - legendIconOffset * 2;
                        singleRangedLegendHeight = rangedLegendDimension;
                    }
                    break;
            }

            //append legend g
            that.legendSVG = chart.svg.append('g')
                .attr('transform', function (d) {
                    //switch legend position to set translation
                    switch (chart.legend.position) {
                        case 'left':
                            {
                                //calculate x position
                                xPos = chart.plot.left;

                                //calculate y position
                                yPos = chart.plot.top;

                                //increase plot left
                                chart.plot.left += legendWidth + chart.margin.left;
                            }
                            break;
                        case 'right':
                            {
                                //calculate x position
                                xPos = chart.plot.width - legendWidth - chart.plot.right;

                                //calculate y position
                                yPos = chart.plot.top;

                                //increase plot right
                                chart.plot.right += legendWidth + chart.margin.right;
                            }
                            break;
                        case 'bottom':
                            {
                                //calculate x position
                                xPos = chart.plot.left;

                                //calculate y position
                                yPos = chart.height - chart.plot.bottom - legendHeight;

                                //increase plot bottom
                                chart.plot.bottom += legendHeight + chart.margin.bottom;
                            }
                            break;
                        case 'top':
                            {
                                //calculate x position
                                xPos = chart.plot.left;

                                //calculate y position
                                yPos = chart.plot.top;

                                //increase plot top
                                chart.plot.top += legendHeight + chart.margin.top;
                            }
                            break;
                    }

                    //return calculated translation
                    return 'translate(' + xPos + ',' + yPos + ')';
                });

            createGradientSVGs(chart.domains.y);
        }

        //updates gradient type legend
        function updateGradientLegend() {
            gradientMin.text(chart.formatNumber(chart.domains.y[0]));
            gradientMax.text(chart.formatNumber(chart.domains.y[1]));
        }

        //create scaled type legend
        function createScaledLegend() {

            //switch secondaryType to set legend values
            switch (chart.legend.secondaryType) {
                case 'default':
                    {
                        //switch chart type 
                        switch (chart.type) {
                            case 'map':
                                {
                                    if (chart.series[0].groupField === '') break;
                                    //declare group values
                                    groupValues = e.getUniqueValues(chart.data, chart.series[0].groupField);

                                    var currentItem = null;

                                    //iterate all chart data to set legend values
                                    groupValues.forEach(function (d, i) {
                                        //check whether group value is assigned
                                        currentItem = e.filter(chart.legend.legendColors, 'value', d.toString());
                                        if (currentItem.length > 0) {
                                            //add current value into the legend values
                                            legendValues.push({
                                                value: currentItem[0].value,
                                                length: currentItem[0].value.length,
                                                color: currentItem[0].color
                                            });
                                        }
                                        else {
                                            //add current value into the legend values
                                            legendValues.push({
                                                value: d ? d.toString() : '',
                                                length: d ? d.toString().length : 0,
                                                color: e.randColor()
                                            });
                                        }
                                    });

                                    //set legend values
                                    chart.legendValues = legendValues;

                                    //iterate all legend values
                                    legendValues.forEach(function (currentLegend) {
                                        //get width of the text
                                        currentLegend.width = getTempOffset(currentLegend.value).width + chart.legend.fontSize + legendIconOffset * 2;

                                        //retrieve max length text
                                        if (currentLegend.length > tempTextValueLength) {
                                            tempTextValue = currentLegend.value;
                                            tempTextValueLength = currentLegend.length;
                                        }
                                    });

                                    //sort legendValues
                                    legendValues.sort(function (a, b) { if (a.value < b.value) { return -1; } if (a.value > b.value) { return 1; } return 0; });

                                    //get width of the text
                                    tempSecondaryTextSVGOffset = getTempOffset(tempTextValue);

                                    //set single height and width
                                    singleLegendHeight = tempSecondaryTextSVGOffset.height + legendIconOffset;
                                    singleLegendWidth = tempSecondaryTextSVGOffset.width + chart.legend.fontSize + legendIconOffset * 2;
                                }
                                break;
                        }
                    }
                    break;
                case 'gradient':
                    {
                        //switch chart type 
                        switch (chart.type) {
                            case 'map':
                                {
                                    if (chart.series[0].colorField === '') break;

                                    //set temp text value
                                    tempTextValue = chart.formatNumber(chart.domains.color[1]);
                                    gradientPercentage = Math.ceil(100 / chart.legend.gradientColors.length);

                                    //get width of the text
                                    tempSecondaryTextSVGOffset = getTempOffset(tempTextValue);

                                    //calculate automatic legend width
                                    switch (chart.legend.position) {
                                        case 'left':
                                        case 'right':
                                            {
                                                //calculate legend dimension
                                                legendSecondaryWidth = rangedLegendDimension + legendIconOffset + tempSecondaryTextSVGOffset.width;
                                                legendSecondaryHeight = chart.plot.height - chart.plot.top - chart.plot.bottom;
                                                singleRangedLegendWidth = rangedLegendDimension;
                                                singleRangedLegendHeight = legendSecondaryHeight - legendIconOffset * 2;
                                            }
                                            break;
                                        default:
                                            {
                                                //calculate legend dimension
                                                legendSecondaryHeight = rangedLegendDimension + tempSecondaryTextSVGOffset.height;
                                                legendSecondaryWidth = chart.plot.width - chart.plot.left - chart.plot.right;
                                                singleRangedLegendWidth = legendSecondaryWidth - legendIconOffset * 2;
                                                singleRangedLegendHeight = rangedLegendDimension;
                                            }
                                            break;
                                    }
                                }
                                break;
                        }
                    }
                    break;
                case 'ranged':
                    {
                        //switch chart type 
                        switch (chart.type) {
                            case 'map':
                                {
                                    if (chart.series[0].colorField === '') break;

                                    //iterate all legend values
                                    chart.legend.rangeList.forEach(function (range, rangeIndex) {
                                        //retrieve max length text
                                        if (range.text.length > tempTextValueLength) {
                                            tempTextValue = range.text;
                                            tempTextValueLength = range.text.length;
                                        }
                                        if (range.maxValue.toString().length > tempTextValueLength) {
                                            tempTextValue = range.maxValue.toString();
                                            tempTextValueLength = range.maxValue.toString().length;
                                        }
                                    });

                                    //get width of the text
                                    tempSecondaryTextSVGOffset = getTempOffset(tempTextValue);

                                    //calculate automatic legend width
                                    switch (chart.legend.position) {
                                        case 'left':
                                        case 'right':
                                            {
                                                //calculate legend dimension
                                                legendSecondaryWidth = rangedLegendDimension + legendIconOffset + tempSecondaryTextSVGOffset.width;
                                                legendSecondaryHeight = chart.plot.height - chart.plot.top - chart.plot.bottom;
                                                singleRangedLegendWidth = rangedLegendDimension;
                                                singleRangedLegendHeight = (legendSecondaryHeight / chart.legend.rangeList.length) - legendIconOffset;
                                            }
                                            break;
                                        default:
                                            {
                                                //calculate legend dimension
                                                legendSecondaryHeight = rangedLegendDimension + tempSecondaryTextSVGOffset.height;
                                                legendSecondaryWidth = chart.plot.width - chart.plot.left - chart.plot.right;
                                                singleRangedLegendWidth = (legendSecondaryWidth / chart.legend.rangeList.length) - legendIconOffset;
                                                singleRangedLegendHeight = rangedLegendDimension;

                                            }
                                            break;
                                    }
                                }
                                break;
                        }
                    }
                    break;
            }

            //create scale for scaled legend and calculate circle band
            var rscale = d3.scalePow().exponent(0.5).domain([chart.domains.y[0], chart.domains.y[1]]).range([(chart.domains.y[0] === chart.domains.y[1] ? chart.series[0].maxBulletSize : chart.series[0].minBulletSize), chart.series[0].maxBulletSize]),
                band = (chart.domains.y[1] - chart.domains.y[0]) / (chart.legend.circleCount - 1);

            //create scaled legend data
            for (i = 0; i < chart.legend.circleCount; i++) {
                legendScaledValues.push({
                    value: (chart.domains.y[1] - band * i).toFixed(0),
                    radius: rscale((chart.domains.y[1] - band * i).toFixed(0))
                });
            }

            //set start values for comparison
            tempTextValue = '';
            tempTextValueLength = 0;

            //iterate all legend values
            legendScaledValues.forEach(function (currentLegend) {
                //retrieve max length text
                if (currentLegend.value.toString().length > tempTextValueLength) {
                    tempTextValue = currentLegend.value.toString();
                    tempTextValueLength = currentLegend.value.toString().length;
                }
            });

            //get width of the text
            tempTextSVGOffset = getTempOffset(tempTextValue);

            //get scaled legend size
            legendScaledWidth = tempTextSVGOffset.width + chart.series[0].maxBulletSize * 2 + legendIconOffset * 2;
            legendScaledHeight = chart.series[0].maxBulletSize * 2 + chart.legend.fontSize / 2;

            //set legend actual height and width
            legendHeight = legendScaledHeight;
            legendWidth = legendScaledWidth;

            //set size limit based on position
            if (chart.legend.position === 'top' || chart.legend.position === 'bottom') {
                legendHeight = legendHeight > legendMaxHeight ? legendMaxHeight : legendHeight;
            } else {
                legendWidth = legendWidth > legendMaxWidth ? legendMaxWidth : legendWidth;
            }

            //calculate secondary legend size and re-calculate actual size if secondary legend type selected
            switch (chart.legend.secondaryType) {
                case 'default':
                    {
                        //switch chart type 
                        switch (chart.type) {
                            case 'map':
                                {
                                    if (chart.series[0].groupField === '') break;
                                    //set legend actual height
                                    switch (chart.legend.position) {
                                        case 'left':
                                        case 'right':
                                            {
                                                //get secondary legend size
                                                legendSecondaryHeight = singleLegendHeight * legendValues.length;
                                                legendSecondaryWidth = singleLegendWidth;
                                                //set legend actual height
                                                legendHeight = legendSecondaryHeight + legendSecondaryOffset + legendScaledHeight;
                                                legendWidth = Math.max(singleLegendWidth, legendScaledWidth);
                                                legendWidth = legendWidth > legendMaxWidth ? legendMaxWidth : legendWidth;

                                                //set secondary start points
                                                xStartingPoint = (legendWidth - legendSecondaryWidth) / 2;
                                                yStartingPoint = 0;
                                            }
                                            break;
                                        default:
                                            {
                                                //get secondary legend size
                                                legendSecondaryHeight = singleLegendHeight;
                                                legendSecondaryWidth = d3.sum(legendValues, function (d) { return d.width; });
                                                //set legend actual height
                                                legendHeight = Math.max(singleLegendHeight, legendScaledHeight);
                                                legendHeight = legendHeight > legendMaxHeight ? legendMaxHeight : legendHeight;
                                                legendWidth = legendSecondaryWidth + legendSecondaryOffset + legendScaledWidth;

                                                //set secondary start points
                                                xStartingPoint = 0;
                                                yStartingPoint = (legendHeight - legendSecondaryHeight) / 2;
                                            }
                                            break;
                                    }
                                }
                                break;
                        }
                    }
                    break;
                case 'gradient':
                    {
                        //switch chart type 
                        switch (chart.type) {
                            case 'map':
                                {
                                    if (chart.series[0].colorField === '') break;
                                    //set legend actual height
                                    switch (chart.legend.position) {
                                        case 'left':
                                        case 'right':
                                            {
                                                //set legend actual height
                                                legendHeight = legendSecondaryHeight;

                                                //update secondary height
                                                legendSecondaryHeight -= legendSecondaryOffset + legendScaledHeight;
                                                singleRangedLegendHeight = legendSecondaryHeight - legendIconOffset * 2;

                                                //set legend actual width
                                                legendWidth = Math.max(legendSecondaryWidth, legendScaledWidth);
                                                legendWidth = legendWidth > legendMaxWidth ? legendMaxWidth : legendWidth;

                                                //set secondary start points
                                                xStartingPoint = (legendWidth - legendSecondaryWidth) / 2;
                                                yStartingPoint = 0;
                                            }
                                            break;
                                        default:
                                            {
                                                //set legend actual width
                                                legendWidth = legendSecondaryWidth;

                                                //update secondary width
                                                legendSecondaryWidth -= legendSecondaryOffset + legendScaledWidth;
                                                singleRangedLegendWidth = legendSecondaryWidth - legendIconOffset * 2;

                                                //set legend actual height
                                                legendHeight = Math.max(legendSecondaryHeight, legendScaledHeight);
                                                legendHeight = legendHeight > legendMaxHeight ? legendMaxHeight : legendHeight;

                                                //set secondary start points
                                                xStartingPoint = 0;
                                                yStartingPoint = (legendHeight - legendSecondaryHeight) / 2;
                                            }
                                            break;
                                    }
                                }
                                break;
                        }
                    }
                    break;
                case 'ranged':
                    {
                        //switch chart type 
                        switch (chart.type) {
                            case 'map':
                                {
                                    if (chart.series[0].colorField === '') break;
                                    //set legend actual height
                                    switch (chart.legend.position) {
                                        case 'left':
                                        case 'right':
                                            {
                                                //set legend actual height
                                                legendHeight = legendSecondaryHeight;

                                                //update secondary height
                                                legendSecondaryHeight -= legendSecondaryOffset + legendScaledHeight;
                                                singleRangedLegendHeight = (legendSecondaryHeight / chart.legend.rangeList.length) - legendIconOffset;
                                                //set legend actual width
                                                legendWidth = Math.max(legendSecondaryWidth, legendScaledWidth);
                                                legendWidth = legendWidth > legendMaxWidth ? legendMaxWidth : legendWidth;

                                                //set secondary start points
                                                xStartingPoint = (legendWidth - legendSecondaryWidth) / 2;
                                                yStartingPoint = 0;
                                            }
                                            break;
                                        default:
                                            {
                                                //set legend actual width
                                                legendWidth = legendSecondaryWidth;

                                                //update secondary width
                                                legendSecondaryWidth -= legendSecondaryOffset + legendScaledWidth;
                                                singleRangedLegendWidth = (legendSecondaryWidth / chart.legend.rangeList.length) - legendIconOffset;

                                                //set legend actual height
                                                legendHeight = Math.max(legendSecondaryHeight, legendScaledHeight);
                                                legendHeight = legendHeight > legendMaxHeight ? legendMaxHeight : legendHeight;

                                                //set secondary start points
                                                xStartingPoint = 0;
                                                yStartingPoint = (legendHeight - legendSecondaryHeight) / 2;
                                            }
                                            break;
                                    }
                                }
                                break;
                        }
                    }
                    break;
            }

            //append legend g
            that.legendSVG = chart.svg.append('g')
                .attr('transform', function (d) {
                    //switch legend position to set translation
                    switch (chart.legend.position) {
                        case 'left':
                            {
                                //calculate x position
                                xPos = chart.plot.left;

                                //calculate y position
                                yPos = chart.plot.top + (chart.plot.height - chart.plot.bottom - chart.plot.top) / 2 - legendHeight / 2;

                                //increase plot left
                                chart.plot.left += legendWidth + chart.margin.left;
                            }
                            break;
                        case 'right':
                            {
                                //calculate x position
                                xPos = chart.plot.width - legendWidth - chart.plot.right + chart.margin.right;

                                //calculate y position
                                yPos = chart.plot.top + (chart.plot.height - chart.plot.bottom - chart.plot.top) / 2 - legendHeight / 2;

                                //increase plot right
                                chart.plot.right += legendWidth + chart.margin.right;
                            }
                            break;
                        case 'bottom':
                            {
                                //calculate x position
                                xPos = chart.plot.left + (chart.plot.width - chart.plot.left - chart.plot.right) / 2 - legendWidth / 2;

                                //calculate y position
                                yPos = chart.height - chart.plot.bottom - legendHeight + chart.margin.bottom;

                                //increase plot bottom
                                chart.plot.bottom += legendHeight + chart.margin.bottom;
                            }
                            break;
                        case 'top':
                            {
                                //calculate x position
                                xPos = chart.plot.left + (chart.plot.width - chart.plot.left - chart.plot.right) / 2 - legendWidth / 2;

                                //calculate y position
                                yPos = chart.plot.top + chart.margin.top;

                                //increase plot top
                                chart.plot.top += legendHeight + chart.margin.top;
                            }
                            break;
                    }

                    //return calculated translation
                    return 'translate(' + xPos + ',' + yPos + ')';
                });

            //append secondary legend svgs
            switch (chart.legend.secondaryType) {
                case 'default':
                    {
                        //switch chart type 
                        switch (chart.type) {
                            case 'map':
                                {
                                    if (chart.series[0].groupField === '') break;
                                    createDefaultSVGs();
                                }
                                break;
                        }
                    }
                    break;
                case 'gradient':
                    {
                        //switch chart type 
                        switch (chart.type) {
                            case 'map':
                                {
                                    if (chart.series[0].colorField === '') break;
                                    createGradientSVGs(chart.domains.color);
                                }
                                break;
                        }
                    }
                    break;
                case 'ranged':
                    {
                        //switch chart type 
                        switch (chart.type) {
                            case 'map':
                                {
                                    if (chart.series[0].colorField === '') break;
                                    createRangedSVGs();
                                }
                                break;
                        }
                    }
                    break;
            }

            //set primary start points based on position
            switch (chart.legend.position) {
                case 'left':
                case 'right':
                    {
                        xStartingPoint = legendSecondaryWidth === 0 ? 0 : (legendWidth - legendScaledWidth) / 2;
                        yStartingPoint = (legendSecondaryHeight === 0 ? 0 : legendSecondaryHeight + legendSecondaryOffset) + chart.series[0].maxBulletSize;
                    }
                    break;
                default:
                    {

                        xStartingPoint = legendSecondaryWidth === 0 ? 0 : legendSecondaryWidth + legendSecondaryOffset;
                        yStartingPoint = (legendSecondaryHeight === 0 ? 0 : (legendHeight - legendScaledHeight) / 2) + chart.series[0].maxBulletSize;
                    }
                    break;
            }

            //switch legend icons
            switch (chart.series[0].tileIcon) {
                case 'circle':
                    {
                        //append legend circles
                        legendScaledSVG = that.legendSVG.selectAll('.eve-legend-scaled-circle')
                            .data(legendScaledValues)
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
                        legendScaledSVG = that.legendSVG.selectAll('.eve-legend-scaled-circle')
                            .data(legendScaledValues)
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
                        legendScaledSVG = that.legendSVG.selectAll('.eve-legend-scaled-circle')
                            .data(legendScaledValues)
                            .enter().append('circle')
                            .attr('class', 'eve-legend-scaled-circle')
                            .style("stroke", "black")
                            .style("stroke-width", 1)
                            .attr("r", function (d) { return d.radius; });
                    }
            }

            //append legend lines
            legendScaledLineSVG = that.legendSVG.selectAll('.eve-legend-scaled-line')
                .data(legendScaledValues)
                .enter().append('line')
                .attr('class', 'eve-legend-scaled-line')
                .style("stroke", "black")
                .style("stroke-width", 1);

            //append legend text
            legendScaledTextSVG = that.legendSVG.selectAll('.eve-legend-scaled-text')
                .data(legendScaledValues)
                .enter().append('text')
                .attr('class', 'eve-legend-scaled-text')
                .style('font-size', chart.legend.fontSize)
                .style('fill', chart.legend.fontColor)
                .style('font-family', chart.legend.fontFamily + ', Arial, Helvetica, Ubuntu')
                .style('font-style', chart.legend.fontStyle == 'bold' ? 'normal' : chart.legend.fontStyle)
                .style('font-weight', chart.legend.fontStyle == 'bold' ? 'bold' : 'normal')
                .style('cursor', 'pointer')
                .text(function (d) { return d.value; });

            //transform legend circles
            legendScaledSVG.attr('transform', function (d, i) {
                //set x and y position
                yPos = yStartingPoint + (chart.series[0].tileIcon === 'square' ? chart.series[0].maxBulletSize - d.radius * 2 : chart.series[0].maxBulletSize - d.radius);
                xPos = xStartingPoint + (chart.series[0].tileIcon === 'square' ? 0 : chart.series[0].maxBulletSize);

                //return translation for the current icon
                return 'translate(' + xPos + ', ' + yPos + ')';
            });

            //transform legend lines
            legendScaledLineSVG
                .attr('x1', xStartingPoint + (chart.series[0].tileIcon === 'square' ? 0 : chart.series[0].maxBulletSize))
                .attr('y1', function (d, i) { return yStartingPoint + chart.series[0].maxBulletSize - d.radius * 2; })
                .attr('x2', xStartingPoint + chart.series[0].maxBulletSize * 2 + legendIconOffset)
                .attr('y2', function (d, i) { return yStartingPoint + chart.series[0].maxBulletSize - d.radius * 2; });

            //transform legend text
            legendScaledTextSVG
                .attr('transform', function (d, i) {
                    //set x and y position
                    xPos = xStartingPoint + chart.series[0].maxBulletSize * 2 + legendIconOffset * 2;
                    yPos = yStartingPoint + chart.series[0].maxBulletSize - d.radius * 2 + chart.legend.fontSize / 2;

                    //return translation for the current icon
                    return 'translate(' + xPos + ', ' + yPos + ')';
                });
        }

        //updates scaled type legend
        function updateScaledLegend() {
            //set new chart series
            var newChartSeries = [];

            //switch secondaryType
            switch (chart.legend.secondaryType) {
                case 'default':
                    {
                        //switch chart type
                        switch (chart.type) {
                            case 'map':
                                {
                                    if (chart.series[0].groupField === '') break;
                                    //declare group values
                                    groupValues = e.getUniqueValues(chart.data, chart.series[0].groupField);

                                    var currentItem = null;

                                    //iterate all chart data to set legend values
                                    groupValues.forEach(function (d, i) {
                                        //check whether group value is assigned
                                        currentItem = e.filter(chart.legend.legendColors, 'value', d.toString());
                                        if (currentItem.length > 0) {
                                            //add current value into the legend values
                                            newChartSeries.push({
                                                value: currentItem[0].value,
                                                length: currentItem[0].value.length,
                                                color: currentItem[0].color
                                            });
                                        }
                                        else {
                                            //add current value into the legend values
                                            newChartSeries.push({
                                                value: d ? d.toString() : '',
                                                length: d ? d.toString().length : 0,
                                                color: e.randColor()
                                            });
                                        }
                                    });

                                    //set start values for comparison
                                    tempTextValue = '';
                                    tempTextValueLength = 0;

                                    //iterate all legend values
                                    newChartSeries.forEach(function (currentLegend) {
                                        //get width of the text
                                        currentLegend.width = getTempOffset(currentLegend.value).width + chart.legend.fontSize + legendIconOffset * 2;

                                        //retrieve max length text
                                        if (currentLegend.length > tempTextValueLength) {
                                            tempTextValue = currentLegend.value;
                                            tempTextValueLength = currentLegend.length;
                                        }
                                    });

                                    //sort chartSeries
                                    newChartSeries.sort(function (a, b) { if (a.value < b.value) { return -1; } if (a.value > b.value) { return 1; } return 0; });
                                }
                                break;
                        }
                        //get width of the text
                        updateDifference = singleLegendWidth - (getTempOffset(tempTextValue).width + chart.legend.fontSize + legendIconOffset * 2);

                        //assign updated values
                        legendValues = newChartSeries;
                    }
                    break;
            }

            //create scale for scaled legend and calculate circle band
            var rscale = d3.scalePow().exponent(0.5).domain([chart.domains.y[0], chart.domains.y[1]]).range([(chart.domains.y[0] === chart.domains.y[1] ? chart.series[0].maxBulletSize : chart.series[0].minBulletSize), chart.series[0].maxBulletSize]),
                band = (chart.domains.y[1] - chart.domains.y[0]) / (chart.legend.circleCount - 1);

            //create scaled legend data
            for (i = 0; i < chart.legend.circleCount; i++) {
                legendScaledValues[i].value = (chart.domains.y[1] - band * i).toFixed(0);
                legendScaledValues[i].radius = rscale((chart.domains.y[1] - band * i).toFixed(0));
            }


            //calculate secondary legend size and re-calculate actual size if secondary legend type selected
            switch (chart.legend.secondaryType) {
                case 'default':
                    {
                        //switch chart type 
                        switch (chart.type) {
                            case 'map':
                                {
                                    if (chart.series[0].groupField === '') break;
                                    //set legend actual height
                                    switch (chart.legend.position) {
                                        case 'left':
                                        case 'right':
                                            {
                                                //get secondary legend size
                                                legendSecondaryHeight = singleLegendHeight * newChartSeries.length;
                                                //set legend actual height
                                                legendHeight = legendSecondaryHeight + legendSecondaryOffset + legendScaledHeight;

                                                //set secondary start points
                                                xStartingPoint = (legendWidth - legendSecondaryWidth) / 2;
                                                yStartingPoint = 0;
                                            }
                                            break;
                                        default:
                                            {
                                                //get secondary legend size
                                                legendSecondaryWidth = d3.sum(newChartSeries, function (d) { return d.width; });
                                                //set legend actual height
                                                legendWidth = legendSecondaryWidth + legendSecondaryOffset + legendScaledWidth;

                                                //set secondary start points
                                                xStartingPoint = 0;
                                                yStartingPoint = (legendHeight - legendSecondaryHeight) / 2;
                                            }
                                            break;
                                    }
                                }
                                break;
                        }
                    }
                    break;
            }

            //update legend svg position
            that.legendSVG
                .transition(chart.animation.duration)
                .ease(chart.animation.easing.toEasing())
                .attr('transform', function () {
                    //switch legend position to set translation
                    switch (chart.legend.position) {
                        case 'left':
                            {
                                //calculate x position
                                xPos = initialPlot.left;

                                //calculate y position
                                yPos = initialPlot.top + (initialPlot.height - initialPlot.bottom - initialPlot.top) / 2 - legendHeight / 2;
                            }
                            break;
                        case 'right':
                            {
                                //calculate x position
                                xPos = initialPlot.width - legendWidth - initialPlot.right + chart.margin.right;

                                //calculate y position
                                yPos = initialPlot.top + (initialPlot.height - initialPlot.bottom - initialPlot.top) / 2 - legendHeight / 2;
                            }
                            break;
                        case 'bottom':
                            {
                                //calculate x position
                                xPos = initialPlot.left + (initialPlot.width - initialPlot.left - chart.plot.right) / 2 - legendWidth / 2;

                                //calculate y position
                                yPos = chart.height - initialPlot.bottom - legendHeight + chart.margin.bottom;
                            }
                            break;
                        case 'top':
                            {
                                //calculate x position
                                xPos = initialPlot.left + (initialPlot.width - initialPlot.left - initialPlot.right) / 2 - legendWidth / 2;

                                //calculate y position
                                yPos = initialPlot.top + chart.margin.top;
                            }
                            break;
                    }

                    //return calculated translation
                    return 'translate(' + xPos + ',' + yPos + ')';
                });

            //update secondary legend svgs
            switch (chart.legend.secondaryType) {
                case 'default':
                    {
                        if (chart.series[0].groupField === '') break;
                        updateDefaultSVGs();
                    }
                    break;
                case 'gradient':
                    {
                        //switch chart type 
                        switch (chart.type) {
                            case 'map':
                                {
                                    if (chart.series[0].colorField === '') break;

                                    gradientMin.text(chart.formatNumber(chart.domains.color[0]));
                                    gradientMax.text(chart.formatNumber(chart.domains.color[1]));
                                }
                                break;
                        }
                    }
                    break;
            }

            //set primary start points based on position
            switch (chart.legend.position) {
                case 'left':
                case 'right':
                    {
                        xStartingPoint = legendSecondaryWidth === 0 ? 0 : (legendWidth - legendScaledWidth) / 2;
                        yStartingPoint = (legendSecondaryHeight === 0 ? 0 : legendSecondaryHeight + legendSecondaryOffset) + chart.series[0].maxBulletSize;
                    }
                    break;
                default:
                    {

                        xStartingPoint = legendSecondaryWidth === 0 ? 0 : legendSecondaryWidth + legendSecondaryOffset;
                        yStartingPoint = (legendSecondaryHeight === 0 ? 0 : (legendHeight - legendScaledHeight) / 2) + chart.series[0].maxBulletSize;
                    }
                    break;
            }

            //update legend circle data
            legendScaledSVG
                .data(legendScaledValues);

            //switch legend icons
            switch (chart.series[0].tileIcon) {
                case 'circle':
                    {
                        //transform legend circles
                        legendScaledSVG
                            .transition(chart.animation.duration)
                            .ease(chart.animation.easing.toEasing())
                            .attr("r", function (d) { return d.radius; })
                            .attr('transform', function (d, i) {
                                //set x and y position
                                yPos = yStartingPoint + (chart.series[0].tileIcon === 'square' ? chart.series[0].maxBulletSize - d.radius * 2 : chart.series[0].maxBulletSize - d.radius);
                                xPos = xStartingPoint + (chart.series[0].tileIcon === 'square' ? 0 : chart.series[0].maxBulletSize);

                                //return translation for the current icon
                                return 'translate(' + xPos + ', ' + yPos + ')';
                            });
                    }
                    break;
                case 'square':
                    {
                        //transform legend circles
                        legendScaledSVG
                            .transition(chart.animation.duration)
                            .ease(chart.animation.easing.toEasing())
                            .attr('width', function (d) { return d.radius * 2; })
                            .attr('height', function (d) { return d.radius * 2; })
                            .attr('transform', function (d, i) {
                                //set x and y position
                                yPos = yStartingPoint + (chart.series[0].tileIcon === 'square' ? chart.series[0].maxBulletSize - d.radius * 2 : chart.series[0].maxBulletSize - d.radius);
                                xPos = xStartingPoint + (chart.series[0].tileIcon === 'square' ? 0 : chart.series[0].maxBulletSize);

                                //return translation for the current icon
                                return 'translate(' + xPos + ', ' + yPos + ')';
                            });
                    }
                    break;
                default:
                    {
                        //transform legend circles
                        legendScaledSVG
                            .transition(chart.animation.duration)
                            .ease(chart.animation.easing.toEasing())
                            .attr("r", function (d) { return d.radius; })
                            .attr('transform', function (d, i) {
                                //set x and y position
                                yPos = yStartingPoint + (chart.series[0].tileIcon === 'square' ? chart.series[0].maxBulletSize - d.radius * 2 : chart.series[0].maxBulletSize - d.radius);
                                xPos = xStartingPoint + (chart.series[0].tileIcon === 'square' ? 0 : chart.series[0].maxBulletSize);

                                //return translation for the current icon
                                return 'translate(' + xPos + ', ' + yPos + ')';
                            });
                    }
            }

            //update legend line data
            legendScaledLineSVG
                .data(legendScaledValues);

            //transform legend lines
            legendScaledLineSVG
                .transition(chart.animation.duration)
                .ease(chart.animation.easing.toEasing())
                .attr('x1', xStartingPoint + (chart.series[0].tileIcon === 'square' ? 0 : chart.series[0].maxBulletSize))
                .attr('y1', function (d, i) { return yStartingPoint + chart.series[0].maxBulletSize - d.radius * 2; })
                .attr('x2', xStartingPoint + chart.series[0].maxBulletSize * 2 + legendIconOffset)
                .attr('y2', function (d, i) { return yStartingPoint + chart.series[0].maxBulletSize - d.radius * 2; });

            //update legend text data
            legendScaledTextSVG
                .data(legendScaledValues);

            //transform legend text
            legendScaledTextSVG
                .transition(chart.animation.duration)
                .ease(chart.animation.easing.toEasing())
                .text(function (d) { return d.value; })
                .attr('transform', function (d, i) {
                    //set x and y position
                    xPos = xStartingPoint + chart.series[0].maxBulletSize * 2 + legendIconOffset * 2;
                    yPos = yStartingPoint + chart.series[0].maxBulletSize - d.radius * 2 + chart.legend.fontSize / 2;

                    //return translation for the current icon
                    return 'translate(' + xPos + ', ' + yPos + ')';
                });
        }

        //create default legend svgs
        function createDefaultSVGs(onClickEnabled) {
            //append legend icons
            legendIconSVG = that.legendSVG.selectAll('.eve-legend-icon')
                .data(legendValues)
                .enter().append('rect')
                .attr('class', 'eve-legend-icon')
                .attr('width', chart.legend.fontSize)
                .attr('height', chart.legend.fontSize)
                .style('cursor', onClickEnabled ? 'pointer' : 'auto')
                .style('fill', function (d, i) { return d.color; })
                .on('click', function (d, i) {
                    //check whether the chart legend click has value
                    if (chart.legendClick && onClickEnabled)
                        chart.legendClick(d, i);
                });

            //append legend texts
            legendTextSVG = that.legendSVG.selectAll('.eve-legend-text')
                .data(legendValues)
                .enter().append('text')
                .attr('class', 'eve-legend-text')
                .style('font-size', chart.legend.fontSize)
                .style('fill', chart.legend.fontColor)
                .style('font-family', chart.legend.fontFamily + ', Arial, Helvetica, Ubuntu')
                .style('font-style', chart.legend.fontStyle == 'bold' ? 'normal' : chart.legend.fontStyle)
                .style('font-weight', chart.legend.fontStyle == 'bold' ? 'bold' : 'normal')
                .style('cursor', onClickEnabled ? 'pointer' : 'auto')
                .text(function (d, i) { return d.value; })
                .on('click', function (d, i) {
                    //check whether the chart legend click has value
                    if (chart.legendClick && onClickEnabled)
                        chart.legendClick(d, i);
                });

            //transform legend icons
            legendIconSVG.attr('transform', function (d, i) {
                //set x and y position
                switch (chart.legend.position) {
                    case 'left':
                    case 'right':
                        {
                            xPos = xStartingPoint;
                            yPos = yStartingPoint + (i * singleLegendHeight);
                        }
                        break;
                    default:
                        {
                            yPos = yStartingPoint;
                            xPos = xStartingPoint + d3.sum(legendValues, function (l, j) { return j < i ? l.width : 0; });
                        }
                        break;
                }

                //return translation for the current icon
                return 'translate(' + xPos + ', ' + yPos + ')';
            });

            //transform legend texts
            legendTextSVG.attr('transform', function (d, i) {
                //set x and y position
                switch (chart.legend.position) {
                    case 'left':
                    case 'right':
                        {
                            xPos = xStartingPoint + chart.legend.fontSize + legendIconOffset;
                            yPos = yStartingPoint + (i * singleLegendHeight) + singleLegendHeight / 2;
                        }
                        break;
                    default:
                        {
                            yPos = yStartingPoint + singleLegendHeight / 2;
                            xPos = xStartingPoint + d3.sum(legendValues, function (l, j) { return j < i ? l.width : 0; }) + chart.legend.fontSize + legendIconOffset;
                        }
                        break;
                }

                //return translation for the current icon
                return 'translate(' + xPos + ', ' + yPos + ')';
            });
        }

        //updates default legend svgs
        function updateDefaultSVGs(onClickEnabled) {
            //update icon svgs
            var iconBase = that.legendSVG.selectAll('.eve-legend-icon')
                .data(legendValues);
            iconBase
                .attr('class', 'eve-legend-icon update');
            iconBase
                .exit().remove();
            legendIconSVG = iconBase
                .enter().append('rect')
                .attr('class', 'eve-legend-icon')
                .attr('width', chart.legend.fontSize)
                .attr('height', chart.legend.fontSize)
                .style('cursor', onClickEnabled ? 'pointer' : 'auto')
                .on('click', function (d, i) {
                    //check whether the chart legend click has value
                    if (chart.legendClick && onClickEnabled)
                        chart.legendClick(d, i);
                })
                .merge(iconBase)
                .style('fill', function (d, i) { return d.color; });

            //update text svgs
            var textBase = that.legendSVG.selectAll('.eve-legend-text')
                .data(legendValues);
            textBase
                .attr('class', 'eve-legend-text update');
            textBase
                .exit().remove();
            legendTextSVG = textBase
                .enter().append('text')
                .attr('class', 'eve-legend-text')
                .style('font-size', chart.legend.fontSize)
                .style('fill', chart.legend.fontColor)
                .style('font-family', chart.legend.fontFamily + ', Arial, Helvetica, Ubuntu')
                .style('font-style', chart.legend.fontStyle == 'bold' ? 'normal' : chart.legend.fontStyle)
                .style('font-weight', chart.legend.fontStyle == 'bold' ? 'bold' : 'normal')
                .style('cursor', onClickEnabled ? 'pointer' : 'auto')
                .on('click', function (d, i) {
                    //check whether the chart legend click has value
                    if (chart.legendClick && onClickEnabled)
                        chart.legendClick(d, i);
                })
                .merge(textBase)
                .text(function (d, i) { return d.value; });

            //transform legend icons
            legendIconSVG
                .transition(chart.animation.duration)
                .ease(chart.animation.easing.toEasing())
                .attr('transform', function (d, i) {
                    //set x and y position
                    switch (chart.legend.position) {
                        case 'left':
                        case 'right':
                            {
                                xPos = xStartingPoint + updateDifference / 2;
                                yPos = yStartingPoint + (i * singleLegendHeight);
                            }
                            break;
                        default:
                            {
                                yPos = yStartingPoint;
                                xPos = xStartingPoint + d3.sum(legendValues, function (l, j) { return j < i ? l.width : 0; });
                            }
                            break;
                    }

                    //return translation for the current icon
                    return 'translate(' + xPos + ', ' + yPos + ')';
                });

            //transform legend texts
            legendTextSVG
                .transition(chart.animation.duration)
                .ease(chart.animation.easing.toEasing())
                .attr('transform', function (d, i) {
                    //set x and y position
                    switch (chart.legend.position) {
                        case 'left':
                        case 'right':
                            {
                                xPos = xStartingPoint + updateDifference / 2 + chart.legend.fontSize + legendIconOffset;
                                yPos = yStartingPoint + (i * singleLegendHeight) + singleLegendHeight / 2;
                            }
                            break;
                        default:
                            {
                                yPos = yStartingPoint + singleLegendHeight / 2;
                                xPos = xStartingPoint + d3.sum(legendValues, function (l, j) { return j < i ? l.width: 0; }) + chart.legend.fontSize + legendIconOffset;
                            }
                            break;
                    }

                    //return translation for the current icon
                    return 'translate(' + xPos + ', ' + yPos + ')';
                });
        }

        //create ranged legend svgs
        function createRangedSVGs(onClickEnabled) {
            //append color rects
            legendIconSVG = that.legendSVG.selectAll('.eve-legend-icon')
                .data(chart.legend.rangeList)
                .enter().append('rect')
                .attr('width', singleRangedLegendWidth)
                .attr('height', singleRangedLegendHeight)
                .style('cursor', onClickEnabled ? 'pointer' : 'auto')
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
                                xPos = xStartingPoint;
                                yPos = yStartingPoint + i * singleRangedLegendHeight;
                        }
                            break;
                        default:
                            {
                                xPos = xStartingPoint + i * singleRangedLegendWidth;
                                yPos = yStartingPoint;
                        }
                            break;
                }

                    //return translation
                    return 'translate(' + xPos + ',' + yPos + ')';
            })
                .on('click', function (d, i) {
                    //check whether the chart legend click has value
                    if (chart.legendClick && onClickEnabled)
                        chart.legendClick(d, i);
        });

            //append range texts
            legendTextSVG = that.legendSVG.selectAll('.eve-legend-text')
                .data(chart.legend.rangeList)
                .enter().append('text')
                .style('font-size', chart.legend.fontSize)
                .style('fill', chart.legend.fontColor)
                .style('font-family', chart.legend.fontFamily + ', Arial, Helvetica, Ubuntu')
                .style('font-style', chart.legend.fontStyle == 'bold' ? 'normal' : chart.legend.fontStyle)
                .style('font-weight', chart.legend.fontStyle == 'bold' ? 'bold' : 'normal')
                .style('cursor', onClickEnabled ? 'pointer' : 'auto')
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
                                xPos = xStartingPoint + singleRangedLegendWidth +legendIconOffset;
                                yPos = yStartingPoint + (i * singleRangedLegendHeight) + singleRangedLegendHeight / 2;
                        }
                            break;
                        default:
                            {
                                xPos = xStartingPoint + (i * singleRangedLegendWidth) + singleRangedLegendWidth / 2;
                                yPos = yStartingPoint + singleRangedLegendHeight +tempTextSVGOffset.height;
                        }
                            break;
                }

                    //return translation
                    return 'translate(' + xPos + ',' + yPos + ')';
            })
                .on('click', function (d, i) {
                    //check whether the chart legend click has value
                    if (chart.legendClick && onClickEnabled)
                        chart.legendClick(d, i);
        });

            //append range boundaries
            that.legendSVG.selectAll('.eve-legend-line')
                .data(chart.legend.rangeList)
                .enter().append('rect')
                .attr('width', function () {
                    switch (chart.legend.position) {
                        case 'left':
                        case 'right':
                            return singleRangedLegendWidth +legendIconOffset;
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
                            return singleRangedLegendHeight +legendIconOffset;
                }
            })
                .style('fill', '#000')
                .attr('transform', function (d, i) {
                    //calculate x and y pos
                    switch (chart.legend.position) {
                        case 'left':
                        case 'right':
                            {
                                xPos = xStartingPoint;
                                yPos = yStartingPoint + i * singleRangedLegendHeight;
                        }
                            break;
                        default:
                            {
                                xPos = xStartingPoint + i * singleRangedLegendWidth;
                                yPos = yStartingPoint;
                        }
                            break;
                }

                    //return translation
                    return 'translate(' + xPos + ',' + yPos + ')';
        });

            //append last range boundary
            that.legendSVG.append('rect')
                .attr('width', function () {
                    switch (chart.legend.position) {
                        case 'left':
                        case 'right':
                            return singleRangedLegendWidth +legendIconOffset;
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
                            return singleRangedLegendHeight +legendIconOffset;
                }
            })
                .style('fill', '#000')
                .attr('transform', function () {
                    //calculate x and y pos
                    switch (chart.legend.position) {
                        case 'left':
                        case 'right':
                            {
                                xPos = xStartingPoint;
                                yPos = yStartingPoint + singleRangedLegendHeight * chart.legend.rangeList.length;
                        }
                            break;
                        default:
                            {
                                xPos = xStartingPoint + singleRangedLegendWidth * chart.legend.rangeList.length;
                                yPos = yStartingPoint;
                        }
                            break;
                }

                    //return translation
                    return 'translate(' + xPos + ',' + yPos + ')';
        });

            //append range boundary texts
            that.legendSVG.selectAll('.eve-legend-icon')
                .data(chart.legend.rangeList)
                .enter().append('text')
                .style('font-size', chart.legend.fontSize)
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
                .text(function (d) { return d.minValue; })
                .attr('transform', function (d, i) {
                    //calculate x and y pos
                    switch (chart.legend.position) {
                        case 'left':
                        case 'right':
                            {
                                xPos = xStartingPoint + singleRangedLegendWidth + legendIconOffset +1;
                                if (i === 0)
                                    yPos = yStartingPoint + (i * singleRangedLegendHeight) +chart.legend.fontSize;
                                else
                                    yPos = yStartingPoint + (i * singleRangedLegendHeight) + (chart.legend.fontSize / 2);
                        }
                            break;
                        default:
                            {
                                xPos = xStartingPoint + i * singleRangedLegendWidth;
                                yPos = yStartingPoint + singleRangedLegendHeight +tempTextSVGOffset.height +1;
                        }
                            break;
                }

                    //return translation
                    return 'translate(' + xPos + ',' + yPos + ')';
        });

            //append last range boundary text
            that.legendSVG.append('text')
                .style('font-size', chart.legend.fontSize)
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
                .text(function (d) { return chart.legend.rangeList[chart.legend.rangeList.length -1].maxValue; })
                .attr('transform', function () {
                    //calculate x and y pos
                    switch (chart.legend.position) {
                        case 'left':
                        case 'right':
                            {
                                xPos = xStartingPoint + singleRangedLegendWidth + legendIconOffset +1;
                                yPos = yStartingPoint + singleRangedLegendHeight * chart.legend.rangeList.length;
                        }
                            break;
                        default:
                            {
                                xPos = xStartingPoint + singleRangedLegendWidth * chart.legend.rangeList.length;
                                yPos = yStartingPoint + singleRangedLegendHeight +tempTextSVGOffset.height +1;
                        }
                            break;
                }
                    //return translation
                    return 'translate(' + xPos + ',' + yPos + ')';
        });
    }

        //create gradient legend svgs
        function createGradientSVGs(minMax) {

            //switch legend position to setup the min and max stops
            switch (chart.legend.position) {
                case 'left':
                case 'right':
                    {
                        legendMinStopX = '0%';
                        legendMaxStopX = '0%';
                        legendMinStopY = '0%';
                        legendMaxStopY = '100%';
                }
                    break;
                default:
                    {
                        legendMinStopX = '0%';
                        legendMaxStopX = '100%';
                        legendMinStopY = '0%';
                        legendMaxStopY = '0%';
                }
                    break;
        }

            //create legend gradient
            legendGradient = chart.svg.append('defs')
                .append('linearGradient')
                .attr('x1', legendMinStopX)
                .attr('y1', legendMinStopY)
                .attr('x2', legendMaxStopX)
                .attr('y2', legendMaxStopY)
                .attr('id', 'gradient' +chart.container);

            //add color stops to gradient
            legendGradient.selectAll('stop')
                .data(chart.legend.gradientColors)
                .enter().append('stop')
                .attr('offset', function (d, i) {
                    if (i === chart.legend.gradientColors.length -1)
                        return '100%';
                    else
                        return (i * gradientPercentage) + '%';
            })
                .attr('stop-color', function (d) { return d;
        });

            //append gradient rect
            that.legendSVG.append('rect')
                .attr('width', singleRangedLegendWidth)
                .attr('height', singleRangedLegendHeight)
                .style('fill', 'url(#gradient' +chart.container + ')')
                .attr('transform', function (d, i) {
                    xPos = xStartingPoint;
                    yPos = yStartingPoint;

                    //return translation
                    return 'translate(' + xPos + ',' + yPos + ')';
        });

            //add minimum text
            gradientMin = that.legendSVG.append('text')
                .style('font-size', chart.legend.fontSize)
                .style('fill', chart.legend.fontColor)
                .style('font-family', chart.legend.fontFamily + ', Arial, Helvetica, Ubuntu')
                .style('font-style', chart.legend.fontStyle == 'bold' ? 'normal' : chart.legend.fontStyle)
                .style('font-weight', chart.legend.fontStyle == 'bold' ? 'bold' : 'normal')
                .style('text-anchor', 'start')
                .text(chart.formatNumber(minMax[0]))
                .attr('transform', function (d, i) {
                    //calculate x and y pos
                    switch (chart.legend.position) {
                        case 'left':
                        case 'right':
                            {
                                xPos = xStartingPoint + singleRangedLegendWidth +legendIconOffset;
                                yPos = yStartingPoint +tempTextSVGOffset.height / 2;
                        }
                            break;
                        default:
                            {
                                xPos = xStartingPoint;
                                yPos = yStartingPoint + singleRangedLegendHeight +tempTextSVGOffset.height;
                        }
                            break;
                }

                    //return translation
                    return 'translate(' + xPos + ',' + yPos + ')';
        });

            //add maximum text
            gradientMax = that.legendSVG.append('text')
                .style('font-size', chart.legend.fontSize)
                .style('fill', chart.legend.fontColor)
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
                .text(chart.formatNumber(minMax[1]))
                .attr('transform', function (d, i) {
                    //calculate x and y pos
                    switch (chart.legend.position) {
                        case 'left':
                        case 'right':
                            {
                                xPos = xStartingPoint + singleRangedLegendWidth +legendIconOffset;
                                yPos = yStartingPoint +singleRangedLegendHeight;
                        }
                            break;
                        default:
                            {
                                xPos = xStartingPoint +singleRangedLegendWidth;
                                yPos = yStartingPoint + singleRangedLegendHeight +tempTextSVGOffset.height;
                        }
                            break;
                }

                    //return translation
                    return 'translate(' + xPos + ',' + yPos + ')';
        });
    }

        //helper function for getting text svg size
        function getTempOffset(text) {
            //attach the text svg
            tempTextSVG = chart.svg.append('text')
                .style('font-size', chart.legend.fontSize)
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

        //check whether the legend is enabled
        if (chart.legend.enabled) {
            //switch legend type to set it
            switch (chart.legend.type) {
                case 'default':
                    createDefaultLegend();
                    break;
                case 'ranged':
                    createRangedLegend();
                    break;
                case 'gradient':
                    createGradientLegend();
                    break;
                case 'scaled':
                    createScaledLegend();
                    break;
        }
    }

        //attach update method to legned
        that.update = function () {

            //check whether the legend is enabled
            if (chart.legend.enabled) {
                //switch legend type to set it
                switch (chart.legend.type) {
                    case 'default':
                        updateDefaultLegend();
                        break;
                    case 'ranged':
                        updateRangedLegend();
                        break;
                    case 'gradient':
                        updateGradientLegend();
                        break;
                    case 'scaled':
                        updateScaledLegend();
                        break;
            }
        }
    };
    }

    //attach create legend method into the eve charts
    e.base.createLegend = function(chart) {
        return new chartLegend(chart);
    };

})(eve);