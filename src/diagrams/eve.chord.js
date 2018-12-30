/*!
 * eve.chord.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Base class for chord diagram.
 */
(function (e) {
    //define chord diagram class
    function chord(options) {
        //remove legend
        if (options.legend) {
            options.legend.enabled = false;
        } else {
            options.legend = {
                enabled: false
            };
        }

        //declare needed variables
        let diagram = eve.initVis(options),
            currentSerie = diagram.series[0],
            dataMatrix = [],
            groups = [],
            sources = [],
            targets = [],
            slices = [],
            maxTotalMeasure = 0,
            currentTotalMeasure = 0,
            maxDataValue = 0,
            diffValue = 0,
            maxTextLength = 0,
            maxText = '',
            tempOffset = null,
            currentMatrixMax = 0,
            maxValueAsText = '',
            margin = 0,
            width = 0,
            height = 0,
            r1 = 0,
            r0 = 0,
            outerRadius = 0,
            arc = null,
            fill = null,
            ribbon = null,
            chord = null,
            averages = {},
            chordMatrix = null,
            currentGroupIndex = 0,
            chordGroups = null,
            chordPaths = null,
            marginOffset = 15,
            groupColor = '',
            outerRadiusOffset = 15,
            rangeColors = [];

        //gets pivot value for given row and col
        function getPivotValue(row, col) {
            //declare needed variables
            let sum = 0,
                min = 0,
                max = 0,
                count = 0,
                pivotValue = 0;

            //iterate all datas to set values
            diagram.data.forEach(function (d) {
                //check conditions to get value
                if ((d[currentSerie.sourceField] == row && d[currentSerie.targetField] == col) || (d[currentSerie.sourceField] == col && d[currentSerie.targetField] == row)) {
                    //get measure value
                    let measureValue = parseFloat(d[currentSerie.measureField]);

                    //check whether the measure value is nan
                    if (isNaN(measureValue))
                        measureValue = 0;

                    //set summarize
                    sum += measureValue;

                    //set max
                    if (measureValue > max)
                        max = measureValue;

                    //set count
                    count++;
                }
            });

            //set min as max
            min = max;

            //iterate all datas to set values
            diagram.data.forEach(function (d) {
                //check conditions to get value
                if ((d[currentSerie.sourceField] == row && d[currentSerie.targetField] == col) || (d[currentSerie.sourceField] == col && d[currentSerie.targetField] == row)) {
                    //get measure value
                    let measureValue = parseFloat(d[currentSerie.measureField]);

                    //check whether the measure value is nan
                    if (isNaN(measureValue))
                        measureValue = 0;

                    //compare min to set it
                    if (measureValue < min)
                        min = measureValue;
                }
            });

            //switch expression
            switch (currentSerie.expression) {
                case 'avg':
                    pivotValue = sum / count;
                    break;
                case 'count':
                    pivotValue = count;
                    break;
                case 'max':
                    pivotValue = max;
                    break;
                case 'min':
                    pivotValue = min;
                    break;
                default:
                    pivotValue = sum;
                    break;
            }

            //return pivot value
            return isNaN(pivotValue) ? 0 : pivotValue;
        }

        //generates data matrix
        function generateDataMatrix() {
            //iterate all slices as rows
            slices.forEach(function (row) {
                //declare row matrix
                let rowMatrix = [];

                //iterate all slices as cols
                slices.forEach(function (col) {
                    //add column matrix to row matrix
                    rowMatrix.push(getPivotValue(row, col));
                });

                //push row matrix into the data matrix
                dataMatrix.push(rowMatrix);
            });
        }

        //gets total measure
        function getTotalMeasure(row, cols) {
            //declare variables
            let totalMeasure = 0;

            //iterate all cols
            cols.forEach(function (col) {
                //get pivot value
                if (col) {
                    let pivotValue = getPivotValue(row, col.toString());

                    //handle pivot value
                    if (!isNaN(pivotValue))
                        totalMeasure += pivotValue;
                }
            });

            //return total measure
            return isNaN(totalMeasure) ? 0 : totalMeasure;
        }

        //gets group index
        function getGroupIndex(key) {
            //declare needed variables
            let index = 0,
                group = '';

            //iterate all base data
            for (var i = 0; i <= diagram.data.length - 1; i++) {
                //declare inner variables
                var currentBaseData = diagram.data[i],
                    keyValue = currentBaseData[currentSerie.sourceField];

                //check whether the key value is given key
                if (keyValue == key) {
                    //set group
                    group = currentBaseData[currentSerie.groupField];

                    //break the loop
                    break;
                }
            }

            //set index
            index = groups.indexOf(group);

            //return found index
            return index == -1 ? 0 : index;
        }

        //calculates chord specific data sectors
        function calculateSectors() {
            //clear items
            dataMatrix = [];
            rangeColors = e.colors;

            //get unique values for souces
            sources = e.getUniqueValues(diagram.data, currentSerie.sourceField);
            targets = e.getUniqueValues(diagram.data, currentSerie.targetField);

            //check wheter the group field is not empty
            if (currentSerie.groupField)
                groups = e.getUniqueValues(diagram.data, currentSerie.groupField);

            //set slices
            sources.sort(function (a, b) {
                if (!isNaN(a) && !isNaN(b)) {
                    return a - b;
                } else {
                    if (a < b) { return -1; } if (a > b) { return 1; } return 0;
                }
            });
            targets.sort(function (a, b) {
                if (!isNaN(a) && !isNaN(b)) {
                    return a - b;
                } else {
                    if (a < b) { return -1; } if (a > b) { return 1; } return 0;
                }
            });
            slices = sources.concat(targets);
            
            //iterate all sources to set averages
            var filteredData = [];
            sources.forEach(function (d) {
                //get filtered data
                filteredData = diagram.data.filter(function (v) { return v[currentSerie.sourceField] === d; });

                //set average
                if (filteredData[0]["Row0AVG"] != null)
                    averages[d] = filteredData[0]["Row0AVG"];
            });

            targets.forEach(function (d) {
                //get filtered data
                filteredData = diagram.data.filter(function (v) { return v[currentSerie.targetField] === d; });

                //set average
                if (filteredData[0]["LastRowAVG"] != null)
                    averages[d] = filteredData[0]["LastRowAVG"];
            });

            //generate data matrix
            generateDataMatrix();

            //iterate all slices as rows
            slices.forEach(function (row) {
                //get current total measure
                currentTotalMeasure = getTotalMeasure(row, slices);

                //check if measure greater than the max
                if (currentTotalMeasure > maxTotalMeasure)
                    maxTotalMeasure = currentTotalMeasure;
            });

            //create range colors
            if (currentSerie.groupField) {
                //check groups
                if (groups.length > rangeColors.length) {
                    //get difference
                    diffValue = groups.length - rangeColors.length;

                    //iterate by diff to add remaining range colors
                    for (var i = 0; i <= diffValue; i++)
                        rangeColors.push(e.randColor());
                }
            } else {
                //check whether the rows length > range colors length
                if (slices.length > rangeColors.length) {
                    //get difference
                    diffValue = slices.length - rangeColors.length;

                    //iterate by diff to add remaining range colors
                    for (var i = 0; i <= diffValue; i++)
                        rangeColors.push(e.randColor());
                }
            }

            //iterate all data to set max value
            dataMatrix.forEach(function (currentMatrix) {
                //get max val
                currentMatrixMax = d3.max(currentMatrix);

                //check dmax > maxval
                if (currentMatrixMax > maxDataValue)
                    maxDataValue = currentMatrixMax;
            });

            //set chord and chord matrix
            chord = d3.chord().sortSubgroups(d3.descending).padAngle(0.05),
            chordMatrix = chord(dataMatrix);

            chordMatrix.groups.forEach(function (d, i) {
                //update group
                d.group = groups[getGroupIndex(slices[i])];

                let tempText = diagram.getContent(d, currentSerie, currentSerie.labelFormat);
                if (tempText.length > maxTextLength) {
                    maxText = tempText;
                    maxTextLength = tempText.length;
                }
            });

            //attach the text svg
            tempTextSVG = diagram.svg
                .append('text')
                .style('fill', currentSerie.labelFontColor)
                .style('font-size', currentSerie.labelFontSize === 'auto' ? '11px' : currentSerie.labelFontSize + 'px')
                .style('font-family', currentSerie.labelFontFamily)
                .style('font-style', currentSerie.labelFontStyle === 'bold' ? 'normal' : currentSerie.labelFontStyle)
                .style('font-weight', currentSerie.labelFontStyle === 'bold' ? 'bold' : 'normal')
                .text(maxText);

            //get bbox of the text svg
            tempOffset = tempTextSVG.node().getBoundingClientRect();

            //remove temp text svg
            tempTextSVG.remove();

            //get max value as text
            maxValueAsText = e.formatNumber(maxDataValue, diagram.xAxis.numberFormat);

            //calculate auto margin
            margin = currentSerie.labelFormat ? (Math.max(tempOffset.width, tempOffset.height) + marginOffset) : (diagram.xAxis.labelFormat ? ((maxValueAsText.length + 1) * (diagram.xAxis.labelFontSize / 2)) : marginOffset);

            //calculate dimensions and set environmental variables
            width = diagram.plot.width - margin;
            height = diagram.plot.height - margin;

            r1 = Math.min(width, height) / 2;
            r0 = Math.abs(r1 - margin);
            outerRadius = r0 + outerRadiusOffset;
            fill = d3.scaleOrdinal().domain(d3.range(slices.length)).range(rangeColors);
            arc = d3.arc().innerRadius(r0).outerRadius(0);
            ribbon = d3.ribbon().radius(r1);
        }

        //create internal group filler function
        function groupFiller(d, i) {
            //check whether the group is empty
            if (currentSerie.groupField) {
                //get group index
                currentGroupIndex = getGroupIndex(slices[d.index]);

                //return color at group index
                return fill(currentGroupIndex);

            } else {
                //return color
                return fill(d.index);
            }
        }

        //create internal path filler function
        function pathFiller(d, i) {
            //check whether the group is empty
            if (currentSerie.groupField) {
                //get group index
                currentGroupIndex = getGroupIndex(slices[d.target.index]);

                //return color at group index
                return fill(currentGroupIndex);

            } else {
                //return color
                return fill(d.target.index);
            }
        }

        //create internal function to use in label transformation
        function setLabelTransformation(d) {
            return 'rotate(' + (d.angle * 180 / Math.PI - 90) + ')translate(' + (r0 + 20) + ')' + (d.angle > Math.PI ? 'rotate(180)' : '');
        }

        //create internal function to use in label anchor
        function setLabelAnchor(d) {
            return d.angle > Math.PI ? 'end' : null;
        }

        //handles chord details hover event and bubbles
        function fadeDetail() {
            //return transition function
            return function (d, i) {
                diagramG.selectAll('.chord path').transition().style('fill-opacity', function (a, k) {
                    //check whether the target indexes are matching
                    if (d.target.index == a.target.index) {
                        //check whether the source indexes are matching
                        if (d.source.index == a.source.index) {
                            //get tooltip
                            currentGroupIndex = getGroupIndex(slices[a.source.index]);

                            //update data
                            d.group = groups[currentGroupIndex];
                            d.sourceValue = slices[a.source.index];
                            d.targetValue = slices[d.target.index];
                            d.measureValue = d.source.value;

                            //show tooltip content
                            diagram.showTooltip(diagram.getContent(d, currentSerie, diagram.tooltip.format));

                            //return full opacity
                            return 1;
                        } else {
                            //return full opacity
                            return 0.1;
                        }
                    } else {
                        //return full opacity
                        return 0.1;
                    }
                });
            };
        }

        //calculate the expression
        let getExpressionedValue = function (data) {
            let newData = eve.clone(data);
            let filteredSources = diagram.data.filter(function (d) { return d[currentSerie.sourceField] === data.sourceValue; });
            let filteredTargets = diagram.data.filter(function (d) { return d[currentSerie.targetField] === data.sourceValue; });
            let children = filteredSources;
            if (children.length === 0)
                children = filteredTargets;

            switch (currentSerie.expression) {
                case "avg":
                    {
                        newData.measureValue = data.measureValue / children.length;

                        if (averages[newData.sourceValue] != null)
                            newData.measureValue = +averages[newData.sourceValue];
                    }
                    break;
                case "min":
                    {
                        newData.measureValue = d3.min(children, function (d) { return d[currentSerie.measureField]; });
                        if (averages[newData.sourceValue] != null)
                            newData.measureValue = +averages[newData.sourceValue];
                    }
                    break;
                case "max":
                    {
                        newData.measureValue = d3.max(children, function (d) { return d[currentSerie.measureField]; });
                        if (averages[newData.sourceValue] != null)
                            newData.measureValue = +averages[newData.sourceValue];
                    }
                    break;
            }

            return newData;
        };

        //handles chord arcs hover event
        function fade(opacity, event) {
            return function (g, i) {
                if (event === 'mouseover') {
                    //set chord data
                    let chordData = {
                        group: groups[getGroupIndex(slices[g.index])],
                        sourceValue: slices[g.index],
                        measureValue: g.value
                    };

                    //get text content
                    let textContent = diagram.getContent(getExpressionedValue(chordData), currentSerie, diagram.tooltip.format);

                    //show tooltip content
                    diagram.showTooltip(textContent);
                } else if (event === 'mouseout') {
                    //hide popup
                    diagram.hideTooltip();
                }

                //gover event
                diagramG.selectAll('.chord path')
                    .filter(function (d) { return d.source.index != i && d.target.index != i; })
                    .transition()
                    .style('fill-opacity', opacity);
            };
        }

        //animate diagram
        function animateChords() {
            //update arc and ribbon
            arc = d3.arc().innerRadius(r0).outerRadius(outerRadius);
            ribbon = d3.ribbon().radius(r0);

            //update chord groups
            chordGroups
                .style('fill', groupFiller)
                .style('stroke', groupFiller)
                .attr('opacity', diagram.animation.effect === 'add' ? 0 : 1)
                .transition().duration(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr('opacity', 1)
                .attr('d', arc);

            //update chord paths
            chordPaths
                .style('fill', pathFiller)
                .style('fill-opacity', diagram.animation.effect === 'add' ? 0 : 1)
                .transition().duration(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .style('fill-opacity', 1)
                .attr('d', ribbon);
        }

        //initializes diagram
        function initDiagram() {
            //update arc and ribbon
            arc = d3.arc().innerRadius(r0).outerRadius(outerRadius);
            ribbon = d3.ribbon().radius(r0);

            //create chord groups
            chordGroups = diagramG.append('g')
                .selectAll('path')
                .data(function (chords) { return chords.groups; })
                .enter().append('path')
                .style('fill', groupFiller)
                .style('stroke', groupFiller)
                .on('mouseover', fade(0.1, 'mouseover'))
                .on('mouseout', fade(1, 'mouseout'))
                .transition().duration(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr('d', arc);

            //create chord paths
            chordPaths = diagramG.append('g')
                .attr('class', 'chord')
                .selectAll('path')
                .data(function (chords) { return chords; })
                .enter().append('path')
                .style('fill', pathFiller)
                .style('fill-opacity', 1)
                .on('mouseover', fadeDetail())
                .on('mouseout', function (d) {
                    //hide popup
                    diagram.hideTooltip();

                    //increase opacity of the node
                    diagramG.selectAll('.chord path').transition().style('fill-opacity', 1);
                })
                .transition().duration(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr('d', ribbon);

            //create labels
            chordLabels = diagramG.append('g')
                .selectAll('text')
                .data(function (chords) { return chords.groups; })
                .enter().append('text')
                .each(function (d) { d.angle = (d.startAngle + d.endAngle) / 2; })
                .attr('text-anchor', setLabelAnchor)
                .style('pointer-events', 'none')
                .style('fill', function (d, i) {
                    //return set color
                    return currentSerie.labelFontColor === 'auto' ? diagram.getAutoColor(groupFiller(d, i)) : currentSerie.labelFontColor;
                })
                .style('font-size', currentSerie.labelFontSize === 'auto' ? '11px' : currentSerie.labelFontSize + 'px')
                .style('font-family', currentSerie.labelFontFamily)
                .style('font-style', currentSerie.labelFontStyle === 'bold' ? 'normal' : currentSerie.labelFontStyle)
                .style('font-weight', currentSerie.labelFontStyle === 'bold' ? 'bold' : 'normal')
                .text(function (d, i) {
                    //get tooltip
                    currentGroupIndex = getGroupIndex(slices[i]);

                    //update group
                    d.group = groups[currentGroupIndex];

                    return diagram.getContent(d, currentSerie, currentSerie.labelFormat);
                })
                .transition().duration(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr('transform', setLabelTransformation);
        }

        //calculate sectors
        calculateSectors();

        //create diagram g
        let diagramG = diagram.svg.append('g')
            .attr('class', 'eve-vis-g')
            .attr('transform', 'translate(' + (diagram.plot.width / 2) + ',' + (diagram.plot.height / 2) + ')')
            .datum(chord(dataMatrix));

        //draw diagram
        initDiagram();
        //animateChords();

        //update diagram
        diagram.update = function (data) {
            //set diagram data
            diagram.data = data;

            //re-calculte scales
            diagram.calculateDomain();
            calculateSectors();

            //remove g
            if (diagram.animation.effect) {
                //check whether the effect is fade
                if (diagram.animation.effect === 'fade') {
                    //remove with transition
                    diagramG.transition().duration(1000).style('opacity', 0).remove();
                } else if (diagram.animation.effect === 'dim') {
                    //remove with transition
                    diagramG.style('opacity', 0.15);
                } else if (diagram.animation.effect === 'add') {
                    //remove with transition
                    diagramG.style('opacity', 1);
                } else {
                    //remove immediately
                    diagramG.remove();
                }
            } else {
                //remove immediately
                diagramG.remove();
            }

            //re-append g
            diagramG = diagram.svg.append('g')
                .attr('class', 'eve-vis-g')
                .attr('transform', 'translate(' + (diagram.plot.width / 2) + ',' + (diagram.plot.height / 2) + ')')
                .datum(chord(dataMatrix));

            //draw diagram
            initDiagram();
            animateChords();
        };

        //attach clear content method to chart
        diagram.clear = function () {
            //remove g from the content
            diagram.svg.selectAll('.eve-vis-g').remove();
        };

        //return abacus diagram
        return diagram;
    }

    //attach timeline method into the eve
    e.chord = function (options) {
        options.type = "chord";

        //remove stacked
        if (options.yAxis)
            options.yAxis.stacked = false;

        //stack the options to the visualizations stack
        e.visualizations.push(options);

        return new chord(options);
    };
})(eve);