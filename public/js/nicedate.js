var niceDateTextbox;
var realDateTextbox;
var dateForm;

// set up variables / form elements to be used
function setDateStuff(niceDateBox,realDateBox,dateFormTemp) {
    niceDateTextbox = niceDateBox;
    realDateTextbox = realDateBox;
    dateForm = dateFormTemp;
}

// on load
$(function() {
    niceifyDate();

    $(dateForm).submit(function() {
        _setRealDate();
        return true;
    });
});

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
