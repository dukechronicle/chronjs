define(["jquery", "onde"], function($) {
    var ondeSessions = {};

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
        }
    }

    $('#configForm').submit(function (evt) {
        changeRaw();
        
        for(var id in ondeSessions) {
            var value = $("#"+id+"-val").val();
            $("<input type='hidden' name='"+id+"'/>").val(value).appendTo($('#configForm'));
        }

        return true;
    });

    $(".rawSwitch").click(function(evt) {
        showJSON($(this).attr("id").split("-")[0]);
    });

    function changeRaw() {
        for(var id in ondeSessions) {
            var outData = ondeSessions[id].getData();
            if(!outData.noData) {
                if(typeof outData.data.value == "object") $("#"+id+"-val").val(JSON.stringify(outData.data.value,null,'\t'));
                else $("#"+id+"-val").val(outData.data.value);
            }
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
});
