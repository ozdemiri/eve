/*!
 * eve.tooltip.js
 * https://github.com/eveui/eve
 *
 * Copyright 2015, Ismail Ozdemir
 * Released under the MIT license
 * https://github.com/eveui/eve/blob/master/LICENSE
 *
 * Date: 2015-04-09 09:15 AM (EST)
 *
 * DEFINITION
 * Base class for chart tooltip.
 */
(function(e) {
    //define default options
    function tooltip(base) {
        //get eve tooltip div
        var tooltipDiv = d3.select('#eveTooltip');

        //check whether the tooltip is null
        if (tooltipDiv.node() === null) {
            //create tooltip div
            tooltipDiv = d3.select('body')
                .append('div')
                .attr('id', 'eveTooltip')
                .style('position', 'absolute')
                .style('display', 'none')
                .style('z-index', 10000000)
                .style('box-shadow', '0 3px 6px rgba(0, 0, 0, .15)');
        }

        //updates tooltip style
        function updateTooltipStyle() {
            //set tooltip style
            tooltipDiv
                .style('background-color', base.tooltip.backColor)
                .style('border-style', base.tooltip.borderStyle)
                .style('border-color', base.tooltip.borderColor)
                .style('border-radius', base.tooltip.borderRadius + 'px')
                .style('border-width', base.tooltip.borderSize + 'px')
                .style('color', base.tooltip.fontColor)
                .style('font-family', base.tooltip.fontFamily)
                .style('font-size', base.tooltip.fontSize + 'px')
                .style('padding-left', base.tooltip.padding + 'px')
                .style('padding-top', base.tooltip.padding + 'px')
                .style('padding-right', base.tooltip.padding + 'px')
                .style('padding-bottom', base.tooltip.padding + 'px');

            if (base.tooltip.fontStyle == 'bold') {
                //update font weight
                tooltipDiv
                    .style('font-weight', 'bold')
                    .style('font-style', 'normal');
            } else {
                //update font weight
                tooltipDiv
                    .style('font-weight', 'normal')
                    .style('font-style', base.tooltip.fontStyle);
            }
        }

        //shows tooltip
        this.show = function () {
            //declare argument variables
            var content = null,
                x = parseInt(d3.event.pageX + 5);
                y = parseInt(d3.event.pageY + 5);

            //check arguments count to set variables
            switch(arguments.length) {
                case 0:
                    return;
                case 1:
                    {
                        content = arguments[0].toString().replaceAll('\n', '<br>');
                    }
                    break;
                case 2:
                    {
                        content = arguments[0];
                        x = arguments[1];
                    }
                    break;
                case 3:
                    {
                        content = arguments[0];
                        x = arguments[1];
                        y = arguments[2];
                    }
            }

            //replace line breaks with html break
            content = content.toString().replaceAll('\n', '<br>');

            //check whether the tooltip is enabled
            if (base.tooltip.enabled && content !== '' && tooltipDiv !== null) {
                updateTooltipStyle();
                tooltipDiv
                    .html(content)
                    .style('left', x + 'px')
                    .style('top', y + 'px')
                    .style('display', 'block');
            }
        };

        //hides tooltip
        this.hide = function () {
            tooltipDiv
                .html('')
                .style('display', 'none');
        };
    }

    e.base.createTooltip = function (base) {
        return new tooltip(base);
    };
})(eve);