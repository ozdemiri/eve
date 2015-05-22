//Handle needed actions when document is ready.
$(document).ready(function () {
    //Set metis menu
    $('#side-menu').metisMenu();

    //Collapse ibox function
    $('.collapse-link').click(function () {
        var ibox = $(this).closest('div.ibox');
        var button = $(this).find('i');
        var content = ibox.find('div.ibox-content');
        content.slideToggle(200);
        button.toggleClass('fa-chevron-up').toggleClass('fa-chevron-down');
        ibox.toggleClass('').toggleClass('border-bottom');
        setTimeout(function () {
            ibox.resize();
            ibox.find('[id^=map-]').resize();
        }, 50);
    });

    //Close ibox function
    $('.close-link').click(function () { var content = $(this).closest('div.ibox'); content.remove(); });

    //minimalize menu
    $('.navbar-minimalize').click(function () { $("body").toggleClass("mini-navbar"); rearrangeMenu(); });

    //Fix Bootstrap backdrop issu with animation.css
    $('.modal').appendTo("body");
});

//Minimalize menu when screen is less than 768px
$(function () {
    $(window).bind("load resize", function () {
        if ($(this).width() < 769) {
            $('body').addClass('body-small')
        } else {
            $('body').removeClass('body-small')
        }
    })
})

//Rearranges menu
function rearrangeMenu() {
    /// <summary>
    /// Re-arranges menu by the browser size. Considers mobiles and other devices...
    /// </summary>
    if (!$('body').hasClass('mini-navbar') || $('body').hasClass('body-small')) {
        $('#side-menu').hide();
        setTimeout(
            function () {
                $('#side-menu').fadeIn(500);
            }, 100);
    } else if ($('body').hasClass('fixed-sidebar')) {
        $('#side-menu').hide();
        setTimeout(
            function () {
                $('#side-menu').fadeIn(500);
            }, 300);
    } else {
        $('#side-menu').removeAttr('style');
    }
};

//set active menu on click
$('#side-menu li').click(function () {
    $('#side-menu li').removeClass('active');
    $(this).addClass('active');
});

//set navigator affix
$('#eveNav').affix({
    offset: {
        top: 0
    }
});