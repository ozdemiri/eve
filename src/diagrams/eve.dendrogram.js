/*!
 * eve.dendrogram.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Base class for dendrogram diagram.
 */
(function (e) {
    //define dendrogram diagram class
    function dendrogram(options) {
        //remove legend
        if (options.legend) {
            options.legend.enabled = false;
        } else {
            options.legend = {
                enabled: false
            };
        }
        //declare needed variables
        let that = this,
            diagram = eve.initVis(options),
            currentSerie = diagram.series[0],
            maxTextLength = 0,
            autoMargin = 0,
            margin = { left: 0, top: 0, bottom: 0, right: 0 },
            width = 0,
            height = 0,
            diameter = 0,
            rootData = null,
            cluster = null,
            iteration = 0,
            tempTextSVG = null,
            tempTextSVGOffset = null,
            currentText = '',
            maxLengthText = '',
            root = null;

        //calculates scales and environment
        function calculateScales() {
            //create root
            root = d3.hierarchy(diagram.data)
                .each(function (d) { if (/^other[0-9]+$/.test(d.data[currentSerie.labelField])) d.data[currentSerie.labelField] = null; })
                .sum(function (d) { return +d[currentSerie.sizeField]; })
                .sort(function (a, b) { return b.value - a.value; });

            //check current serie font size
            if (currentSerie.labelFontSize === 'auto')
                currentSerie.labelFontSize = 11;

            //check current serie font color
            if (currentSerie.labelFontColor === 'auto')
                currentSerie.labelFontColor = '#333333';

            //iterate descendants
            root.descendants().forEach(function (d) {
                //get current text content
                currentText = diagram.getContent(d, currentSerie, currentSerie.labelFormat);

                //check length
                if (currentText.length > maxTextLength) {
                    //set max text
                    maxLengthText = currentText;

                    //set max text length
                    maxTextLength = currentText.length;
                }
            });

            //create temp text
            tempTextSVG = diagramG.append('text')
                .style('font-size', currentSerie.labelFontSize + 'px')
                .style('color', currentSerie.labelFontColor)
                .style('font-family', currentSerie.labelFontFamily + ', Arial, Helvetica, Ubuntu')
                .style('font-style', currentSerie.labelFontStyle == 'bold' ? 'normal' : currentSerie.labelFontStyle)
                .style('font-weight', currentSerie.labelFontStyle == 'bold' ? 'bold' : 'normal')
                .text(maxLengthText);

            //get offset
            tempTextSVGOffset = tempTextSVG.node().getBoundingClientRect();

            //remove temp text
            tempTextSVG.remove();

            //calculate margins and dimensions
            autoMargin = tempTextSVGOffset.width + 10;
            margin.left = diagram.margin.left + (currentSerie.direction === 'linear' ? 7 : autoMargin);
            margin.right = diagram.margin.right + autoMargin;
            margin.top = diagram.margin.top + (currentSerie.direction === 'linear' ? 0 : autoMargin);
            margin.bottom = diagram.margin.bottom + (currentSerie.direction === 'linear' ? 0 : autoMargin);
            width = diagram.plot.width - margin.left - margin.right;
            height = diagram.plot.height - margin.top - margin.bottom;
            diameter = Math.min(width, height) / 2;
            //set root data and scales
            rootData = diagram.data;
        }

        //initializes linear dendrogram
        function initLinear() {
            //translate g
            diagramG.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            //update nodes
            updateLinearNodes(root);
        }

        //initializes radial dendrogram
        function initRadial() {
            //translate g
            diagramG.attr('transform', 'translate(' + (margin.left + width / 2) + ',' + (margin.top + height / 2) + ')');

            //update nodes
            updateRadialNodes(root);
        }

        //returns diagonal line path
        function diagonal(d) {
            return "M" + d.y + "," + d.x + "C" + (d.parent.y + 100) + "," + d.x + " " + (d.parent.y + 100) + "," + d.parent.x + " " + d.parent.y + "," + d.parent.x;
        }

        //set node click event.
        function nodeClick(d) {
            if (d.children) {
                d._children = d.children;
                d.children = null;
            } else {
                d.children = d._children;
                d._children = null;
            }

            //initialize diagram
            if (currentSerie.direction === 'linear')
                updateLinearNodes(d);
            else
                updateRadialNodes(d);
        }

        //returns circular paths
        function project(x, y) {
            let angle = (x - 90) / 180 * Math.PI, radius = y;
            return [radius * Math.cos(angle), radius * Math.sin(angle)];
        }

        //updates radial nodes
        function updateRadialNodes(source) {
            //make cluster for root
            cluster = d3.cluster().size([360, diameter]);

            cluster(root);

            //declare nodes and links
            let nodes = root.descendants(),
                links = nodes.slice(1);

            //clear everything
            diagramG.selectAll(".radialDendLink").remove();
            diagramG.selectAll(".radialDendNode").remove();
            diagramG.selectAll(".radialDendText").remove();

            //create the links
            let link = diagramG.selectAll("path.radialDendLink")
                .data(links, function (d) { return d.id; });

            //create projection for the each links.
            let linkEnter = link.enter().append('g').attr('class', 'radialDendLink')
                .insert('path')
                .style('stroke', function (d) { return e.colors[d.depth]; })
                .style('stroke-width', function (d) {
                    //declare stroke width
                    let sWidth = Math.round(Math.log(Math.abs(d.size))) / 2; if (sWidth < 1) sWidth = 1;

                    //return stroke width
                    return that.lineMeasures ? sWidth : 2;
                })
                .style('stroke-opacity', 0.5)
                .style('fill', 'none')
                .style('fill-opacity', 0);

            //create link transitions to draw
            linkEnter
                .transition().duration(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr("d", function (d) {
                    return "M" + project(d.x, d.y) + "C" + project(d.x, (d.y + d.parent.y) / 2) + " " + project(d.parent.x, (d.y + d.parent.y) / 2) + " " + project(d.parent.x, d.parent.y);
                });

            //create node
            let node = diagramG.selectAll('g.radialDendNode')
                .data(nodes, function (d) { return d.id || (d.id = ++iteration); })
                .attr('fill', 'none');

            //enter node
            let nodeEnter = node.enter().append('g').attr('class', 'radialDendNode')
                .attr("transform", function (d) { return "translate(" + project(d.x, d.y) + ")"; })
                .on('click', nodeClick);

            //Append node circle
            nodeEnter.append("circle")
                .attr("r", function (d) {
                    //try to create diameter of the circle
                    try {
                        //declare size
                        let nodeSize = d.data.size;

                        //check first node
                        if (!nodeSize) {
                            //set size
                            nodeSize = 0;

                            //iterate all children to set size
                            if (d.children) {
                                for (let j = 0; j <= d.children.length - 1; j++)
                                    nodeSize += d.children[j].data.size;
                            } else if (d._children) {
                                for (let j = 0; j <= d._children.length - 1; j++)
                                    nodeSize += d._children[j].data.size;
                            }
                        }

                        //set diameter
                        let circleR = Math.round(Math.log(Math.abs(nodeSize))) / 2; if (circleR < 1) circleR = 1;

                        //return diameter
                        return circleR;
                    } catch (e) {
                        //return default value
                        return 5.5;
                    }
                })
                .style('stroke', function (d) { return e.colors[d.depth]; })
                .style("fill", function (d) { return e.colors[d.depth]; })
                .on('mousemove', function (d, i) {
                    //show tooltip
                    diagram.showTooltip(diagram.getContent(d, currentSerie, diagram.tooltip.format));
                })
                .on('mouseout', function (d, i) {
                    //hide tooltip
                    diagram.hideTooltip();
                });

            //append node text
            nodeEnter.append("text")
                .attr("x", function (d) { return d.x >= 180 || d.children || d._children ? -5 : 5; })
                .attr("dy", 3)
                .attr('class', 'radialDendText')
                .attr("text-anchor", function (d) { return d.x >= 180 || d.children || d._children ? "end" : "start"; })
                .attr("transform", function (d) {
                    if (d.parent)
                        return "rotate(" + (d.x < 180 ? d.x - 90 : d.x + 90) + ")";
                    else
                        return null;
                })
                .text(function (d) {
                    return diagram.getContent(d, currentSerie, currentSerie.labelFormat);
                })
                .style('fill', currentSerie.labelFontColor)
                .style('font-size', currentSerie.labelFontSize + 'px')
                .style('font-family', currentSerie.labelFontFamily)
                .style('font-style', currentSerie.labelFontStyle === 'bold' ? 'normal' : currentSerie.labelFontStyle)
                .style('font-weight', currentSerie.labelFontStyle === 'bold' ? 'bold' : 'normal')
                .style('pointer-events', 'none')
                .style('text-shadow', '0 1px 0 rgb(255,255,255), 1px 0 0 rgb(255,255,255), 0 -1px 0 rgb(255,255,255), -1px 0 0 rgb(255,255,255)')
                .style("fill-opacity", 1);

            //set new positions of the nodes
            nodeEnter
                .attr('opacity', diagram.animation.effect === 'add' ? 0 : 1)
                .transition().duration(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr('opacity', 1)
                .attr("transform", function (d) { return "translate(" + project(d.x, d.y) + ")"; });

            //stash the old positions for transition.
            nodes.forEach(function (d) {
                d.x0 = d.x;
                d.y0 = d.y;
            });
        }

        //updates linear nodes
        function updateLinearNodes(source) {
            //create clusters
            cluster = d3.cluster().size([height, width]);
            cluster(root);

            //declare nodes and links
            let nodes = root.descendants(),
                links = nodes.slice(1);

            //clear everything
            diagramG.selectAll(".dendLink").remove();
            diagramG.selectAll(".dendNode").remove();
            diagramG.selectAll(".dendText").remove();

            //create the links
            let link = diagramG.selectAll("path.dendLink")
                .data(links, function (d) { return d.id; });

            //create projection for the each links.
            let linkEnter = link.enter().append('g').attr('class', 'dendLink')
                .insert('path')
                .style('stroke', function (d) { return e.colors[d.depth]; })
                .style('stroke-width', function (d) {
                    //declare stroke width
                    let sWidth = Math.round(Math.log(Math.abs(d.size))) / 2; if (sWidth < 1) sWidth = 1;

                    //return stroke width
                    return currentSerie.lineMeasures ? sWidth : 2;
                })
                .style('stroke-opacity', 0.5)
                .style('fill', 'none')
                .style('fill-opacity', 0);

            //create link transitions to draw
            linkEnter
                .transition().duration(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr("d", diagonal);

            //transition exiting nodes to the parent's new position.
            linkEnter.exit()
                .transition().duration(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr("d", diagonal)
                .remove();

            //create node
            let node = diagramG.selectAll('g.dendNode')
                .data(nodes, function (d) { return d.id || (d.id = ++iteration); })
                .attr('fill', 'none');

            //enter node
            let nodeEnter = node.enter().append('g').attr('class', 'dendNode')
                .attr('transform', function (d) { return 'translate(' + d.y + ',' + d.x + ')'; })
                .on('click', nodeClick);

            //Append node circle
            nodeEnter.append("circle")
                .attr("r", 0)
                .style('stroke', function (d) { return e.colors[d.depth]; })
                .style("fill", function (d) { return e.colors[d.depth]; })
                .on('mousemove', function (d, i) {
                    //show tooltip
                    diagram.showTooltip(diagram.getContent(d, currentSerie, diagram.tooltip.format));
                })
                .on('mouseout', function (d, i) {
                    //hide tooltip
                    diagram.hideTooltip();
                });

            //append node text
            nodeEnter.append("text")
                .attr("x", 5)
                .attr("dy", 3)
                .attr('class', 'dendText')
                .attr("text-anchor", "start")
                .text(function (d) { return diagram.getContent(d, currentSerie, currentSerie.labelFormat); })
                .style('fill', currentSerie.labelFontColor)
                .style('font-size', currentSerie.labelFontSize + 'px')
                .style('font-family', currentSerie.labelFontFamily)
                .style('font-style', currentSerie.labelFontStyle === 'bold' ? 'normal' : currentSerie.labelFontStyle)
                .style('font-weight', currentSerie.labelFontStyle === 'bold' ? 'bold' : 'normal')
                .style('pointer-events', 'none')
                .style('text-shadow', '0 1px 0 rgb(255,255,255), 1px 0 0 rgb(255,255,255), 0 -1px 0 rgb(255,255,255), -1px 0 0 rgb(255,255,255)')
                .style("fill-opacity", 0);

            //create node update
            let nodeUpdate = nodeEnter
                .attr('opacity', diagram.animation.effect === 'add' ? 0 : 1)
                .transition().duration(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr('opacity', 1)
                .attr('transform', function (d) { return 'translate(' + d.y + ',' + d.x + ')'; });

            //select circles
            nodeUpdate.select('circle')
                .style('stroke', function (d) { return e.colors[d.depth]; })
                .style("fill", function (d) { return e.colors[d.depth]; })
                .attr('opacity', diagram.animation.effect === 'add' ? 0 : 1)
                .transition().duration(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr('opacity', 1)
                .attr("r", function (d) {
                    //try to create diameter of the circle
                    try {
                        //declare size
                        let nodeSize = d.data.size;

                        //check first node
                        if (!nodeSize) {
                            //set size
                            nodeSize = 0;

                            //iterate all children to set size
                            if (d.children) {
                                for (let j = 0; j <= d.children.length - 1; j++)
                                    nodeSize += d.children[j].data.size;
                            } else if (d._children) {
                                for (let j = 0; j <= d._children.length - 1; j++)
                                    nodeSize += d._children[j].data.size;
                            }
                        }

                        //set diameter
                        let circleR = Math.round(Math.log(Math.abs(nodeSize))) / 2; if (circleR < 1) circleR = 1;

                        //return diameter
                        return circleR;
                    } catch (e) {
                        //return default value
                        return 5.5;
                    }
                });

            //select texts
            nodeUpdate.select('text')
                .style("fill-opacity", 1)
                .transition().duration(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr("x", 5);

            //transition exiting nodes to the parent's new position.
            let nodeExit = nodeEnter.exit()
                .transition().duration(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr("transform", function (d) { return "translate(" + source.y + "," + source.x + ")"; })
                .remove();

            //select circles
            nodeExit.select("circle").attr("r", 0);

            //select texts
            nodeExit.select("text")
                .style("fill-opacity", 0)
                .transition().duration(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr("x", function (d) { return 0; });
        }

        //create diagram g
        let diagramG = diagram.svg.append('g').attr('class', 'eve-vis-g');

        //set scales and environment
        calculateScales();

        //initialize diagram
        if (currentSerie.direction === 'linear')
            initLinear();
        else
            initRadial();

        //update diagram
        diagram.update = function (data) {
            //set diagram data
            diagram.data = data;

            //recalculate scales
            //diagram.calculateDomain();

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
            diagramG = diagram.svg.append('g').attr('class', 'eve-vis-g');

            //calculate scales
            calculateScales();

            //initialize diagram
            if (currentSerie.direction === 'linear')
                initLinear();
            else
                initRadial();
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
    e.dendrogram = function (options) {
        options.masterType = 'tree';
        options.type = "dendrogram";

        //remove stacked
        if (options.yAxis)
            options.yAxis.stacked = false;

        //stack the options to the visualizations stack
        e.visualizations.push(options);

        return new dendrogram(options);
    };
})(eve);