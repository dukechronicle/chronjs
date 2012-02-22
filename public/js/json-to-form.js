define(["jquery", "onde"], function($) {
    var ondeSessions = {};

    // construct the nice looking forms to edit json
    for(var i in JSON_TO_FORM_ELEMENTS) {
        var obj = JSON_TO_FORM_ELEMENTS[i];
        var element = $("#"+obj.name);
        
        // if this config element exists on the page, make a nice form for it
        if(element.length) {
            $("#"+obj.name+"-val").hide();
            
            // since all data is sent to the server as strings anyway, convert numbers to strings so it passes json validation
            if(typeof obj.defaultValue == "number" && obj.schema.type == "string") obj.defaultValue = ""+obj.defaultValue;

            //create the form
            ondeSessions[obj.name] = new onde.Onde(element);
            
            //onde only works with objects, not strings, so we wrap the value in an object
            obj.encasedDefaultValue = {
                value: obj.defaultValue
            };

            //onde only works with objects, not strings, so we add an object as the top level of the schema
            obj.encasedSchema = {
                type:'object',
                properties: {
                    value: obj.schema
                }
            };
            
            //show the form
            ondeSessions[obj.name].render(obj.encasedSchema, obj.encasedDefaultValue, { collapsedCollapsibles: false });
        }
    }

    // on form submit, add the json values of all forms as inputs to this form and then submit
    $('#configForm').submit(function (evt) {
        changeRaw();
        
        for(var id in ondeSessions) {
            var value = $("#"+id+"-val").val();
            $("<input type='hidden' name='"+id+"'/>").val(value).appendTo($('#configForm'));
        }

        return true;
    });

    // when show form / show raw is clicked, switch whether the form or json is shown
    $(".rawSwitch").click(function(evt) {
        switchShow($(this).attr("id").split("-")[0]);
    });

    // if any of the other forms on the page for used for json editing are submitted, actually submit the real config form instead
    $('.fake-form').submit(function (evt) {
        $('#configForm').submit();
        return false;        
    });

    // update the textareas containing the raw json to contain the form data for that json object
    function changeRaw() {
        for(var id in ondeSessions) {
            var outData = ondeSessions[id].getData();
            if(!outData.noData) {
                if(typeof outData.data.value == "object") $("#"+id+"-val").val(JSON.stringify(outData.data.value,null,'\t'));
                else $("#"+id+"-val").val(outData.data.value);
            }
        }
    }

    // update the form for the json object to contain the textareas containg raw json
    function changeForm(id) {
        for(var i in JSON_TO_FORM_ELEMENTS) {
            var obj = JSON_TO_FORM_ELEMENTS[i];

            if(obj.name == id) {
                var json = $("#"+obj.name+"-val").val();

                if(obj.schema.type == "object" || obj.schema.type == "array") {
                    try {
                        json = JSON.parse(json);
                    }
                    catch(e) {
                        alert(obj.name + " raw json is not valid json. The form for " + obj.name + " was not updated");
                        json = null;
                    }
                }                
                
                if(json) {
                    //onde only works with objects, not strings, so we wrap the value in an object
                    obj.encasedDefaultValue = {
                        value: json
                    };

                    ondeSessions[obj.name].render(obj.encasedSchema, obj.encasedDefaultValue, { collapsedCollapsibles: false });
                }
            }
        }
    }

    // switch whether the form or json is shown for the given config param id
    function switchShow(id) {
        var rawSwitch = $("#"+id+"-rawSwitch");

        if(rawSwitch.html() == "Show Form") {        
            changeForm(id);
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
