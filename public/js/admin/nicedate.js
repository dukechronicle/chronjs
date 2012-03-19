define(['jquery', 'libs/jquery-ui'], function ($) {

    var niceDateTextbox;
    var realDateTextbox;
    var dateForm;

    // on load
    $(function() {
        setDateStuff("#nicedate","#date","#infoform");
        niceifyDate();

        $(dateForm).submit(function() {
            _setRealDate();
            return true;
        });
    });

    // set up variables / form elements to be used
    function setDateStuff(niceDateBox,realDateBox,dateFormTemp) {
        niceDateTextbox = niceDateBox;
        realDateTextbox = realDateBox;
        dateForm = dateFormTemp;
    }

    // make the date look nice for the user
    function niceifyDate() {
        $(niceDateTextbox).datepicker();

        var dateInt = parseInt($(realDateTextbox).val());
        var date = new Date(dateInt);
        if(date.toDateString() != 'Invalid Date') {
            $(niceDateTextbox).val((1+date.getMonth()) + '/' + date.getDate() + '/' + date.getFullYear());       
        }
    }

    // convert the nice date visible to the user to a timestamp
    function _setRealDate() {
        var date = new Date($(niceDateTextbox).val());
        
        if(date.toDateString() != 'Invalid Date') {
            $(realDateTextbox).val(date.getTime());
        }
    }

});