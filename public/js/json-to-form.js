var ondeSessions = {};

define(["jquery", "onde"], function($) {
    for(var i in JSON_TO_FORM_ELEMENTS) {
        var obj = JSON_TO_FORM_ELEMENTS[i];
        var element = $("#"+obj.name);
        
        if(element.length) {
            $("#"+obj.name+"-val").hide();
            
            if(typeof obj.defaultValue == "number" && obj.schema.type == "string") obj.defaultValue = ""+obj.defaultValue;

            ondeSessions[obj.name] = new onde.Onde(element);
            
            obj.schema = {
                type:'object',
                properties: {
                    value: obj.schema
                }
            };

            obj.defaultValue = {
                value: obj.defaultValue
            };
            
            ondeSessions[obj.name].render(obj.schema, obj.defaultValue, { collapsedCollapsibles: false });

            // Bind our form's submit event. We use this to get the data out from Onde
            $('#configForm').submit(function (evt) {
                changeRaw();
                return false;
            });
        }
    }
});

function changeRaw() {
    for(var id in ondeSessions) {
        var outData = ondeSessions[id].getData();
        console.log(outData);
        $("#"+id+"-val").val(outData.data.value);
    }
}

function showJSON(id) {
    var rawSwitch = $("#"+id+"-rawSwitch");

    if(rawSwitch.html() == "Show Form") {        
        $("#"+id+"-val").hide();
        $("#"+id).show();
        rawSwitch.html("Show Raw");
    }
    else {
        changeRaw();
        $("#"+id+"-val").show();
        $("#"+id).hide();
        rawSwitch.html("Show Form");
    }
}
