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
        var diagram = eve.base.init(options),
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
            chordMatrix = null,
            currentGroupIndex = 0,
            chordGroups = null,
            chordPaths = null,
            marginOffset = 15,
            outerRadiusOffset = 15,
            rangeColors = [];

        //gets pivot value for given row and col
        function getPivotValue(row, col) {
            //declare needed variables
            var sum = 0,
                min = 0,
                max = 0,
                count = 0,
                pivotValue = 0;

            //iterate all datas to set values
            diagram.data.forEach(function (d) {
                //check conditions to get value
                if ((d[currentSerie.sourceField] == row && d[currentSerie.targetField] == col) || (d[currentSerie.sourceField] == col && d[currentSerie.targetField] == row)) {
                    //get measure value
                    var measureValue = parseFloat(d[currentSerie.measureField]);

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
                    var measureValue = parseFloat(d[currentSerie.measureField]);

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
                var rowMatrix = [];

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
            var totalMeasure = 0;

            //iterate all cols
            cols.forEach(function (col) {
                //get pivot value
                var pivotValue = getPivotValue(row, col.toString());

                //handle pivot value
                if (!isNaN(pivotValue))
                    totalMeasure += pivotValue;
            });

            //return total measure
            return isNaN(totalMeasure) ? 0 : totalMeasure;
        }

        //gets group index
        function getGroupIndex(key) {
            //declare needed variables
            var index = 0,
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
            sources.sort();
            targets.sort();
            slices = sources.concat(targets);
            maxTextLength = d3.max(slices, function (d) { return d.toString().length; });

            //generate data matrix
            generateDataMatrix();
            
            //iterate all slices as rows
            slices.forEach(function(row) {
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

            //get max value as text
            maxValueAsText = diagram.formatNumber(maxDataValue, diagram.xAxis.numberFormat);

            //check max text length and maxvaltext
            if (maxValueAsText.length > maxTextLength)
                maxTextLength = maxValueAsText.length + 1;

            //calculate auto margin
            margin = diagram.yAxis.labelFormat ? (maxTextLength * (diagram.yAxis.labelFontSize / 2)) : (diagram.xAxis.labelFormat ? ((maxValueAsText.length + 1) * (diagram.xAxis.labelFontSize / 2)) : marginOffset);

            //calculate dimensions and set environmental variables
            width = diagram.plot.width - margin;
            height = diagram.plot.height - margin;
            r1 = Math.min(width, height) / 2;
            r0 = r1 - margin;
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
                            toolTipContent = diagram.tooltip.format;
                            currentGroupIndex = getGroupIndex(slices[a.source.index]);

                            //replace keywords in bubble content 1
                            toolTipContent = toolTipContent.replaceAll('{source}', slices[a.source.index]);
                            toolTipContent = toolTipContent.replaceAll('{target}', slices[d.target.index]);
                            toolTipContent = toolTipContent.replaceAll('{measure}', diagram.formatNumber(d.source.value));
                            toolTipContent = toolTipContent.replaceAll('{group}', groups[currentGroupIndex]);

                            //show tooltip content
                            diagram.showTooltip(toolTipContent);

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

        //handles chord arcs hover event
        function fade(opacity) {
            return function (g, i) {
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
                .transition(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr('d', arc);

            //update chord paths
            chordPaths
                .style('fill', pathFiller)
                .style('fill-opacity', 1)
                .transition(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr('d', ribbon);
        }

        //initializes diagram
        function initDiagram() {
            //create chord paths
            chordGroups = diagramG.append('g')
                .selectAll('path')
                .data(function (chords) { return chords.groups; })
                .enter().append('path')
                .style('fill', groupFiller)
                .style('stroke', groupFiller)
                .on('mouseover', fade(0.1))
                .on('mouseout', fade(1))
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
                .attr('d', ribbon);
        }

        //calculate sectors
        calculateSectors();

        //create diagram g
        var foreignSVG = diagram.svg.append('foreignObject')
            .attr('width', diagram.plot.width)
            .attr('height', diagram.plot.height)
            .attr('x', 0)
            .attr('y', 0)
            .append('xhtml:div')
            .append('svg')
            .attr('width', diagram.plot.width)
            .attr('height', diagram.plot.height);

        //create diagram g
        var diagramG = foreignSVG.append('g')
            .attr('transform', 'translate(' + (diagram.plot.width / 2) + ',' + (diagram.plot.height / 2) + ')')
            .datum(chord(dataMatrix));

        //draw diagram
        initDiagram();
        animateChords();

        //update diagram
        diagram.update = function (data) {
            //set diagram data
            diagram.data = data;

            //re-calculte scales
            calculateSectors();

            //create diagram g
            diagramG
                .attr('transform', 'translate(' + (diagram.plot.width / 2) + ',' + (diagram.plot.height / 2) + ')')
                .datum(chord(dataMatrix));

            //remove groups and paths
            chordGroups.remove();
            chordPaths.remove();
            
            //initialize and re-animate chords
            initDiagram();
            animateChords();
        };

        //draws the chart into a canvas
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

        //returns the chart image 
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

        //return abacus diagram
        return diagram;
    }

    //attach timeline method into the eve
    e.chord = function (options) {
        return new chord(options);
    };
})(eve);