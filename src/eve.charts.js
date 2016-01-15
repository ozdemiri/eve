/*!
 * eve.charts.js
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
(function(e) {
    //default chart properties
    var defaults = {
        animationDuration: 500,
        balloon: {
            backColor: '#ffffff',
            borderColor: '#61c9f6',
            borderRadius: 3,
            borderSize: 1,
            borderStyle: 'solid',
            enabled: true,
            fontColor: '#333333',
            fontFamily: 'Tahoma',
            fontSize: 12,
            fontStyle: 'normal',
            format: '',
            opacity: .9,
            padding: 10,
            dateFormat: '',
            numberFormat: ''
        },
        backColor: '#ffffff',
        container: null,
        data: null,
        legend: {
            enabled: true,
            fontColor: '#333333',
            fontFamily: 'Tahoma',
            fontSize: 12,
            fontStyle: 'normal',
            icon: 'square',
            position: 'right',
            auto: true,
            sectionCount: 5,
            sections: [],
			baseColor: e.colors[0]
        },
        series: [],
        title: {
            text: '',
            fontColor: '#333333',
            fontFamily: 'Tahoma',
            fontSize: 13,
            fontStyle: 'bold',
        },
        trends: [],
        width: 'auto',
        height: 'auto',
        xField: '',
        xAxis: {
            alpha: 1,
            color: '#cccccc',
            gridLineColor: '#cccccc',
            gridLineThickness: .5,
            gridLineAlpha: .5,
            labelAngle: 0,
            labelFontColor: '#999999',
            labelFontFamily: 'Tahoma',
            labelFontSize: 10,
            labelFontStyle: 'normal',
            labelFormat: '',
            startsFromZero: true,
            tickCount: 10,
            title: '',
            titleFontColor: '#666666',
            titleFontFamily: 'Tahoma',
            titleFontSize: 11,
            titleFontStyle: 'bold',
            thickness: 1
        },
        yAxis: {
            alpha: 1,
            color: '#cccccc',
            gridLineColor: '#cccccc',
            gridLineThickness: .5,
            gridLineAlpha: .5,
            labelAngle: 0,
            labelFontColor: '#999999',
            labelFontFamily: 'Tahoma',
            labelFontSize: 10,
            labelFontStyle: 'normal',
            labelFormat: '',
            startsFromZero: true,
            tickCount: 10,
            title: '',
            titleFontColor: '#666666',
            titleFontFamily: 'Tahoma',
            titleFontSize: 11,
            titleFontStyle: 'bold',
            thickness: 1,
            stacked: true
        },
        zoomable: false
    };

    //define chart base class
    function chart(options, type) {
        //declare members
        var members = options ? e.extend(options, defaults) : defaults,
            that = this,
            offset = null,
            parent = null,
            balloon = null,
            element = members.container;

        //set this members
        for(var key in members)
            that[key] = members[key];

        //handle container error
        if(that.container == null || that.container == '') {
            throw Error('Chart container could not found!');
        }

        //handle data error
        if(that.data == null) {
            throw new Error('Could not found chart data!');
        }

        //check if element is string
        if(e.getType(element) === 'string')
            element = document.getElementById(element);

        //clear element content
        element.innerHTML = '';

        //get element parent node
        parent = element.parentNode;
        offset = e.offset(parent);

        //set width
        if(that.width === 'auto')
            that.width = offset.width;

        //set height
        if(that.height === 'auto')
            that.height = offset.height;

        //set aspect ratio
        that.aspectRatio = that.width / that.height;

        //check whehter the balloon is enabled
        if(that.balloon.enabled) {
            //create balloon element
            eve.appendHTML(document.body, '<div id="' + that.container + '_balloon" style="position: absolute; display: none; z-index: 1000; box-shadow: 0 3px 6px rgba(0, 0, 0, .15)"></div>');

            //set balloon
            balloon = document.getElementById(that.container + '_balloon');
            balloon.style['backgroundColor'] = that.balloon.backColor;
            balloon.style['borderStyle'] = that.balloon.borderStyle;
            balloon.style['borderColor'] = that.balloon.borderColor;
            balloon.style['borderRadius'] = that.balloon.borderRadius + 'px';
            balloon.style['borderWidth'] = that.balloon.borderSize + 'px';
            balloon.style['color'] = that.balloon.fontColor;
            balloon.style['fontFamily'] = that.balloon.fontFamily;
            balloon.style['fontSize'] = that.balloon.fontSize + 'px';
            balloon.style['paddingLeft'] = that.balloon.padding + 'px';
            balloon.style['paddingTop'] = that.balloon.padding + 'px';
            balloon.style['paddingRight'] = that.balloon.padding + 'px';
            balloon.style['paddingBottom'] = that.balloon.padding + 'px';
            if (that.balloon.fontStyle == 'bold') {
                //update font weight
                balloon.style['fontWeight'] = 'bold';
                balloon.style['fontStyle'] = 'normal';
            } else {
                //update font weight
                balloon.style['fontWeight'] = 'normal';
                balloon.style['fontStyle'] = that.balloon.fontStyle;
            }
        }

        //create canvas
        that.svg = d3.select(element)
            .append('svg')
            .attr('id', that.container + '_svg')
            .attr('viewBox', '0 0 ' + that.width + ' ' + that.height)
            .attr('preserveAspectRatio', 'xMidYMid')
            .attr('width', that.width)
            .attr('height', that.height)
            .attr('fill', that.backColor)
            .append('g');

        //append rect
        if(chart.zoomable) {
            that.svg.append('rect')
                .attr('fill', that.backColor)
                .attr('width', that.width)
                .attr('height', that.height);
        }

        //shows balloon
        that.showBalloon = function(content, x, y) {
            if(content == null) return;
            if(e.getType(content) !== 'string')
                content = content.toString();

            //set x,y position
            if(x == null) x = parseInt(d3.event.pageX + 5);
            if(y == null) y = parseInt(d3.event.pageY + 5);

            if(that.balloon.enabled && content !== '' && balloon != null) {
                balloon.innerHTML = content;
                balloon.style['left'] = x + 'px';
                balloon.style['top'] = y + 'px';
                balloon.style['display'] = 'block';
            }
        };

        //hides balloon
        that.hideBalloon = function() {
            if(that.balloon.enabled && balloon != null)
                balloon.style['display'] = 'none';
        };

        //gets formatted content for sliced charts
        that.getSlicedFormat = function(dataIndex, serie, section) {
            var content = '',
                currentData = that.data[dataIndex],
                totalValue = d3.sum(that.data, function(d) { return d[serie.valueField]; }),
                currentValue = currentData[serie.valueField] == null ? 0 : currentData[serie.valueField],
                percentValue = (currentValue / totalValue * 100).toFixed(2),
                numberFormat = '',
                numberFormatPrefix = '',
                formatter = d3.format();

            //check section
            if(section == null)
                section = 'balloon';

            //switch section
            switch(section) {
                case 'label':
                    {
                        //split serie number format
                        var splitted = serie.numberFormat.split('|');

                        //check if number format contains prefix
                        if (splitted.length === 2) {
                            //set number format and its prefix
                            numberFormat = splitted[1];
                            numberFormatPrefix = splitted[0];
                        } else {
                            //set number format
                            numberFormat = serie.numberFormat;
                        }

                        //check serie number format
                        if(serie.numberFormat !== '')
                            formatter = d3.format(numberFormat);

                        //set content
                        content = serie.labelFormat;
                    }
                    break;
                case 'balloon':
                    {
                        //split serie number format
                        var splitted = that.balloon.numberFormat.split('|');

                        //check if number format contains prefix
                        if (splitted.length === 2) {
                            //set number format and its prefix
                            numberFormat = splitted[1];
                            numberFormatPrefix = splitted[0];
                        } else {
                            //set number format
                            numberFormat = that.balloon.numberFormat;
                        }

                        //check serie number format
                        if(that.balloon.numberFormat !== '')
                            formatter = d3.format(numberFormat);

                        //set content
                        content = that.balloon.format;
                    }
                    break;
            }

            //replace title
            if(serie.titleField)
                content = content.replaceAll('{title}', currentData[serie.titleField]);

            //replace label
            if(serie.labelField)
                content = content.replaceAll('{label}', currentData[serie.labelField]);

            //replace value
            if(serie.valueField)
                content = content.replaceAll('{value}', numberFormatPrefix + formatter(currentValue));

            //replace alpha
            if(serie.alphaField)
                content = content.replaceAll('{alpha}', currentData[serie.alphaField]);

            //replace color
            if(serie.colorField)
                content = content.replaceAll('{color}', currentData[serie.colorField]);

            //replace total value
            if(totalValue != null)
                content = content.replaceAll('{total}', numberFormatPrefix + formatter(totalValue));

            //replace percents
            if(percentValue != null)
                content = content.replaceAll('{percent}', percentValue + '%');

            return content;
        };

        //gets formatted content for maps
        that.getMapFormat = function(currentData, serie, section) {
            //handle Error
            if(currentData == null)
                return '';

            //declare variables
            var content = '',
                totalValue = d3.sum(that.data, function(d) { return d[serie.valueField]; }),
                currentValue = currentData[serie.valueField] == null ? 0 : currentData[serie.valueField],
                percentValue = (currentValue / totalValue * 100).toFixed(2),
                numberFormat = '',
                numberFormatPrefix = '',
                formatter = d3.format();

            //check section
            if(section == null)
                section = 'balloon';

            //switch section
            switch(section) {
                case 'label':
                    {
                        //split serie number format
                        var splitted = serie.numberFormat.split('|');

                        //check if number format contains prefix
                        if (splitted.length === 2) {
                            //set number format and its prefix
                            numberFormat = splitted[1];
                            numberFormatPrefix = splitted[0];
                        } else {
                            //set number format
                            numberFormat = serie.numberFormat;
                        }

                        //check serie number format
                        if (serie.numberFormat !== '')
                            formatter = d3.format(numberFormat);

                        //set content
                        content = serie.labelFormat;
                    }
                    break;
                case 'balloon':
                    {
                        //split serie number format
                        var splitted = that.balloon.numberFormat.split('|');

                        //check if number format contains prefix
                        if (splitted.length === 2) {
                            //set number format and its prefix
                            numberFormat = splitted[1];
                            numberFormatPrefix = splitted[0];
                        } else {
                            //set number format
                            numberFormat = that.balloon.numberFormat;
                        }

                        //check serie number format
                        if (that.balloon.numberFormat !== '')
                            formatter = d3.format(that.balloon.numberFormat);

                        //set content
                        content = that.balloon.format;
                    }
                    break;
            }

            //replace title
            if(serie.titleField)
                content = content.replaceAll('{title}', currentData[serie.titleField]);

            //replace label
            if(serie.labelField)
                content = content.replaceAll('{label}', currentData[serie.labelField]);

            //replace value
            if(serie.valueField)
                content = content.replaceAll('{value}', numberFormatPrefix + formatter(currentValue));

            //replace alpha
            if(serie.alphaField)
                content = content.replaceAll('{alpha}', currentData[serie.alphaField]);

            //replace color
            if(serie.colorField)
                content = content.replaceAll('{color}', currentData[serie.colorField]);

            //replace total value
            if(totalValue != null)
                content = content.replaceAll('{total}', numberFormatPrefix +formatter(totalValue));

            //replace percents
            if(percentValue != null)
                content = content.replaceAll('{percent}', percentValue + '%');

            return content;
        };

        //gets formatted content for sliced charts
        that.getXYFormat = function(data, serie, section) {
            var content = '',
                formatter = d3.format(),
                dateFormatter = d3.time.format('%m/%d/%Y'),
                xValue = data.xValue,
                yValue = data.yValue,
                numberFormat = '',
                numberFormatPrefix = '',
                sizeValue = data.sizeValue;

            //check section
            if(section == null)
                section = 'balloon';

            //switch section
            switch(section) {
                case 'label':
                    {
                        //split serie number format
                        var splitted = serie.numberFormat.split('|');

                        //check if number format contains prefix
                        if (splitted.length === 2) {
                            //set number format and its prefix
                            numberFormat = splitted[1];
                            numberFormatPrefix = splitted[0];
                        } else {
                            //set number format
                            numberFormat = serie.numberFormat;
                        }

                        //check serie number format
                        if (serie.numberFormat !== '')
                            formatter = d3.format(numberFormat);

                        //check serie date format
                        if(serie.dateFormat !== '')
                            dateFormatter = d3.format(serie.dateFormat);

                        //set content
                        content = serie.labelFormat;
                    }
                    break;
                case 'balloon':
                    {
                        //split serie number format
                        var splitted = that.balloon.numberFormat.split('|');

                        //check if number format contains prefix
                        if (splitted.length === 2) {
                            //set number format and its prefix
                            numberFormat = splitted[1];
                            numberFormatPrefix = splitted[0];
                        } else {
                            //set number format
                            numberFormat = that.balloon.numberFormat;
                        }

                        //check serie number format
                        if (that.balloon.numberFormat !== '')
                            formatter = d3.format(numberFormat);

                        //check serie date format
                        if(that.balloon.dateFormat !== '')
                            dateFormatter = d3.time.format(that.balloon.dateFormat);

                        //set content
                        content = that.balloon.format;
                    }
                    break;
            }

            //replace x value
            if(xValue != null) {
                if(e.getType(xValue) === 'date') {
                    content = content.replaceAll('{x}', dateFormatter(xValue));
                    content = content.replaceAll('{title}', dateFormatter(xValue));
                } else if(e.getType(xValue) === 'number') {
                    content = content.replaceAll('{x}', xValue);//numberFormatPrefix + formatter(xValue));
                    content = content.replaceAll('{title}', xValue);//numberFormatPrefix + formatter(xValue));
                } else {
                    content = content.replaceAll('{x}', xValue);
                    content = content.replaceAll('{title}', xValue);
                }
            }

            //replace y value
            if (!isNaN(parseFloat(yValue))) {
                content = content.replaceAll('{y}', numberFormatPrefix + formatter(yValue));
                content = content.replaceAll('{value}', numberFormatPrefix + formatter(yValue));
            }

            //replace size value
            if (!isNaN(parseFloat(sizeValue)))
                content = content.replaceAll('{size}', numberFormatPrefix + formatter(sizeValue));

            //replace serie
            if(data.name)
                content = content.replaceAll('{serie}', data.name);

            //replace serie group
            content = content.replaceAll('{group}', serie.yField);
            content = content.replaceAll('{serie}', serie.yField);

            return content;
        };
    }

    //define eve charts
    e.charts = {
        init: function(options, type) {
            return new chart(options, type);
        }
    };

})(eve);
