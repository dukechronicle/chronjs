
define(['jquery'], function ($) {
	$("#add").click(function() {
		addField();
	});
	
	$("#edit").click(function() {
		editField();
	});
	
	function addField() {
        fields = 0;
        for (fields=0;fields<5;fields++) {
            var fieldname = "#answer"+fields;
            var x= $(fieldname);
            if (x.length > 0) {
                continue;
            } else {
                break;
            }
        }
        if (fields < 5) {
            $('#answers').append($("<label></label><input id='answer"+fields+"' type='text' name='doc[answers]["+fields+"]' style='width:600px'/><br />"));
            fields += 1;
        } else {
            $('#answers').append($("<br /><label></label><p>Only 5 answer fields allowed.</p>"));
            $('#add').attr('disabled', 'true');
        }
    }
    
    function editField() {
        fields = 0;
        for (fields=0;fields<5;fields++) {
            var fieldname = "#answer"+fields;
            var x= $(fieldname);
            if (x.length > 0) {
                continue;
            } else {
                break;
            }
        }
        if (fields < 5) {
            $('#answers').append($("<label></label><input id='answer"+fields+"' type='text' name='doc[answers]["+fields+"]' style='width:600px'/><input id='answercount' type='text' name='doc[count]["+fields+"]' style='width:60px'/><br/>"));
            fields += 1;
        } else {
            $('#answers').append($("<br /><label></label><p>Only 5 answer fields allowed.</p>"));
            $('#edit').attr('disabled', 'true');
        }
    }
	
});