define(['jquery', 'libs/jquery-ui'], function ($) {

    var niceDateTextbox;
    var realDateTextbox;
    var dateForm;
    var niceDateChanged = false;

    return { "prettify-date": prettifyDate }


    // on load
    function prettifyDate() {
        setDateStuff("#nicedate","#date","#infoform");
        niceifyDate();

        $(dateForm).submit(function() {
            _setRealDate();
            return true;
        });
    };

    // set up variables / form elements to be used
    function setDateStuff(niceDateBox,realDateBox,dateFormTemp) {
        niceDateTextbox = niceDateBox;
        realDateTextbox = realDateBox;
        dateForm = dateFormTemp;
    }

    // make the date look nice for the user
    function niceifyDate() {
        $(niceDateTextbox).datepicker({
            onSelect: function(dateText, inst) {
                niceDateChanged = true;
            }
        });

        var dateInt = parseInt($(realDateTextbox).val());
        var date = new Date(dateInt);
        if(date.toDateString() != 'Invalid Date') {
            $(niceDateTextbox).val((1+date.getMonth()) + '/' + date.getDate() + '/' + date.getFullYear());       
        }
    }

    // convert the nice date visible to the user to a timestamp if the user changed the nice date
    function _setRealDate() {
        if(!niceDateChanged) return;

        var date = new Date($(niceDateTextbox).val());
        
        if(date.toDateString() != 'Invalid Date') {
            $(realDateTextbox).val(date.getTime());
        }
    }

});
