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
        var that = this,
            diagram = eve.base.init(options),
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
            root = null;

        //calculates scales and environment
        function calculateScales() {
            //create root
            root = d3.hierarchy(diagram.data)
                .each(function (d) { if (/^other[0-9]+$/.test(d.data[currentSerie.labelField])) d.data[currentSerie.labelField] = null; })
                .sum(function (d) { return +d[currentSerie.sizeField]; })
                .sort(function (a, b) { return b.value - a.value; });

            //get max text length
            maxTextLength = d3.max(root.descendants(), function (d) { return d.data[currentSerie.labelField].toString().length; });
            
            //calculate margins and dimensions
            autoMargin = currentSerie.labelFormat ? ((diagram.xAxis.labelFontSize * (maxTextLength)) + 1) : 10;
            autoMargin = ((diagram.xAxis.labelFontSize * (maxTextLength)) + 1);
            margin.left = diagram.margin.left + autoMargin;
            margin.right = diagram.margin.right + autoMargin;
            margin.top = diagram.margin.top;
            margin.bottom = diagram.margin.bottom;
            width = diagram.plot.width - margin.left - margin.right;
            height = diagram.plot.height - margin.top - margin.bottom;
            diameter = Math.min(diagram.plot.width - autoMargin, diagram.plot.height - autoMargin) / 2;

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
            diagramG.attr('transform', 'translate(' + ((diagram.plot.width / 2) - (diameter / 2)) + ',' + (height / 2) + ')');

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
            var angle = (x - 90) / 180 * Math.PI, radius = y;
            return [radius * Math.cos(angle), radius * Math.sin(angle)];
        }

        //updates radial nodes
        function updateRadialNodes(source) {
            //make cluster for root
            cluster = d3.tree().size([diameter, diameter]);
            cluster(root);

            //declare nodes and links
            var nodes = root.descendants(),
                links = nodes.slice(1);

            //clear everything
            diagramG.selectAll(".radialDendLink").remove();
            diagramG.selectAll(".radialDendNode").remove();
            diagramG.selectAll(".radialDendText").remove();

            //create the links
            var link = diagramG.selectAll("path.radialDendLink")
                .data(links, function (d) { return d.id; });

            //create projection for the each links.
            var linkEnter = link.enter().append('g').attr('class', 'radialDendLink')
                .insert('path')
                .style('stroke', function (d) { return e.colors[d.depth]; })
                .style('stroke-width', function (d) {
                    //declare stroke width
                    var sWidth = Math.round(Math.log(Math.abs(d.size))) / 2; if (sWidth < 1) sWidth = 1;

                    //return stroke width
                    return that.lineMeasures ? sWidth : 2;
                })
                .style('stroke-opacity', 0.5)
                .style('fill', 'none')
                .style('fill-opacity', 0);

            //create link transitions to draw
            linkEnter
                .transition(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr("d", function (d) {
                    return "M" + project(d.x, d.y) + "C" + project(d.x, (d.y + d.parent.y) / 2) + " " + project(d.parent.x, (d.y + d.parent.y) / 2) + " " + project(d.parent.x, d.parent.y);
                });

            //create node
            var node = diagramG.selectAll('g.radialDendNode')
                .data(nodes, function (d) { return d.id || (d.id = ++iteration); })
                .attr('fill', 'none');

            //enter node
            var nodeEnter = node.enter().append('g').attr('class', 'radialDendNode')
                .attr("transform", function (d) { return "translate(" + project(source.x, source.y) + ")"; })
                .on('click', nodeClick);

            //Append node circle
            nodeEnter.append("circle")
                .attr("r", function (d) {
                    //try to create diameter of the circle
                    try {
                        //declare size
                        var nodeSize = d.data.size;

                        //check first node
                        if (!nodeSize) {
                            //set size
                            nodeSize = 0;

                            //iterate all children to set size
                            if (d.children) {
                                for (var j = 0; j <= d.children.length - 1; j++)
                                    nodeSize += d.children[j].data.size;
                            } else if (d._children) {
                                for (var j = 0; j <= d._children.length - 1; j++)
                                    nodeSize += d._children[j].data.size;
                            }
                        }

                        //set diameter
                        var circleR = Math.round(Math.log(Math.abs(nodeSize))) / 2; if (circleR < 1) circleR = 1;

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
                .attr("x", function (d) { return d.children || d._children ? -10 : 10; })
                .attr("dy", 3)
                .attr('class', 'radialDendText')
                .attr("text-anchor", function (d) { return d.children || d._children ? "end" : "start"; })
                .text(function (d) { return d.data.name; })
                .style('fill', diagram.xAxis.labelFontColor)
                .style('font-size', diagram.xAxis.labelFontSize + 'px')
                .style('font-family', diagram.xAxis.labelFontFamily)
                .style('font-style', diagram.xAxis.labelFontStyle === 'bold' ? 'normal' : diagram.xAxis.labelFontStyle)
                .style('font-weight', diagram.xAxis.labelFontStyle === 'bold' ? 'bold' : 'normal')
                .style('pointer-events', 'none')
                .style('text-shadow', '0 1px 0 #fff, 1px 0 0 #fff, 0 -1px 0 #fff, -1px 0 0 #fff')
                .style("fill-opacity", 1);

            //set new positions of the nodes
            nodeEnter
                .transition(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
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
            cluster = d3.tree().size([height, width]);
            cluster(root);

            //declare nodes and links
            var nodes = root.descendants(),
                links = nodes.slice(1);

            //clear everything
            diagramG.selectAll(".dendLink").remove();
            diagramG.selectAll(".dendNode").remove();
            diagramG.selectAll(".dendText").remove();

            //create the links
            var link = diagramG.selectAll("path.dendLink")
                .data(links, function (d) { return d.id; });

            //create projection for the each links.
            var linkEnter = link.enter().append('g').attr('class', 'dendLink')
                .insert('path')
                .style('stroke', function (d) { return e.colors[d.depth]; })
                .style('stroke-width', function (d) {
                    //declare stroke width
                    var sWidth = Math.round(Math.log(Math.abs(d.size))) / 2; if (sWidth < 1) sWidth = 1;

                    //return stroke width
                    return currentSerie.lineMeasures ? sWidth : 2;
                })
                .style('stroke-opacity', 0.5)
                .style('fill', 'none')
                .style('fill-opacity', 0);

            //create link transitions to draw
            linkEnter
                .transition(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr("d", diagonal);

            //transition exiting nodes to the parent's new position.
            linkEnter.exit()
                .transition(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr("d", diagonal)
                .remove();

            //create node
            var node = diagramG.selectAll('g.dendNode')
                .data(nodes, function (d) { return d.id || (d.id = ++iteration); })
                .attr('fill', 'none');

            //enter node
            var nodeEnter = node.enter().append('g').attr('class', 'dendNode')
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
                .attr("x", function (d) { return d.children || d._children ? -10 : 10; })
                .attr("dy", 3)
                .attr('class', 'dendText')
                .attr("text-anchor", function (d) { return d.children || d._children ? "end" : "start"; })
                .text(function (d) { return d.data.name; })
                .style('fill', diagram.xAxis.labelFontColor)
                .style('font-size', diagram.xAxis.labelFontSize + 'px')
                .style('font-family', diagram.xAxis.labelFontFamily)
                .style('font-style', diagram.xAxis.labelFontStyle === 'bold' ? 'normal' : diagram.xAxis.labelFontStyle)
                .style('font-weight', diagram.xAxis.labelFontStyle === 'bold' ? 'bold' : 'normal')
                .style('pointer-events', 'none')
                .style('text-shadow', '0 1px 0 #fff, 1px 0 0 #fff, 0 -1px 0 #fff, -1px 0 0 #fff')
                .style("fill-opacity", 0);

            //create node update
            var nodeUpdate = nodeEnter
                .transition(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr('transform', function (d) { return 'translate(' + d.y + ',' + d.x + ')'; });

            //select circles
            nodeUpdate.select('circle')
                .style('stroke', function (d) { return e.colors[d.depth]; })
                .style("fill", function (d) { return e.colors[d.depth]; })
                .transition(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr("r", function (d) {
                    //try to create diameter of the circle
                    try {
                        //declare size
                        var nodeSize = d.data.size;

                        //check first node
                        if (!nodeSize) {
                            //set size
                            nodeSize = 0;

                            //iterate all children to set size
                            if (d.children) {
                                for (var j = 0; j <= d.children.length - 1; j++)
                                    nodeSize += d.children[j].data.size;
                            } else if (d._children) {
                                for (var j = 0; j <= d._children.length - 1; j++)
                                    nodeSize += d._children[j].data.size;
                            }
                        }

                        //set diameter
                        var circleR = Math.round(Math.log(Math.abs(nodeSize))) / 2; if (circleR < 1) circleR = 1;

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
                .transition(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr("x", function (d) { return d.children || d._children ? -10 : 10; });

            //transition exiting nodes to the parent's new position.
            var nodeExit = nodeEnter.exit()
                .transition(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr("transform", function (d) { return "translate(" + source.y + "," + source.x + ")"; })
                .remove();

            //select circles
            nodeExit.select("circle").attr("r", 0);

            //select texts
            nodeExit.select("text")
                .style("fill-opacity", 0)
                .transition(diagram.animation.duration)
                .ease(diagram.animation.easing.toEasing())
                .delay(function (d, i) { return i * diagram.animation.delay; })
                .attr("x", function (d) { return 0; });
        }

        //set scales and environment
        calculateScales();

        //create diagram g
        var diagramG = diagram.svg.append('g');

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
            calculateScales();

            //initialize diagram
            if (currentSerie.direction === 'linear')
                initLinear();
            else
                initRadial();
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
    e.dendrogram = function (options) {
        options.type = 'tree';
        return new dendrogram(options);
    };
})(eve);