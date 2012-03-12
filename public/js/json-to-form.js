define(["jquery", "onde"], function($) {
    var ondeSessions = {};
    var objs = [];

    // construct the nice looking forms to edit json
    var rawElements = getAllRawJSONs();

    for(var i = 0; i < rawElements.length; i ++) {
        var obj = {
            name: $(rawElements[i]).attr("name"),
            schema: JSON.parse($(rawElements[i]).attr("schema")),
            defaultValue: $(rawElements[i]).val()
        };
        if(obj.schema.type == "object" || obj.schema.type == "array") obj.defaultValue = JSON.parse(obj.defaultValue);
        
        var $element = getForm(obj.name);
        
        // if this config element exists on the page, make a nice form for it
        if($element.length) {
            getRawJSON(obj.name).hide();
            
            // since all data is sent to the server as strings anyway, convert numbers to strings so it passes json validation
            if(typeof obj.defaultValue == "number" && obj.schema.type == "string") obj.defaultValue = ""+obj.defaultValue;

            //create the form
            ondeSessions[obj.name] = new onde.Onde($element);
            
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

            objs.push(obj);
            
            //show the form
            ondeSessions[obj.name].render(obj.encasedSchema, obj.encasedDefaultValue, { collapsedCollapsibles: false });

            var outData = ondeSessions[obj.name].getData();
            var $rawData = getRawJSON(obj.name);
            
            // if onde is not correctly able to parse the data, and there is some data to parse, only show the raw json view            
            if(outData.noData && $rawData.val().length > 0) {
                $rawData.show(); // show the raw json
                $element.hide(); // hide the form
                getRawToFormSwitch(obj.name).hide(); // hide the switch to raw/json button
            }
        }
    }

    // on form submit, add the json values of all forms as inputs to this form and then submit
    $('#configForm').submit(function (evt) {
        for(var id in ondeSessions) {
            // if the form for a json object is visible, update the raw json value for it
            if(getForm(id).is(":visible")) changeRaw(id);

            var value = getRawJSON(id).val();
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

    // update the textarea containing the raw json to contain the form data for that json object
    function changeRaw(id) {
        var outData = ondeSessions[id].getData();
        if(!outData.noData) {
           if(typeof outData.data.value == "object") getRawJSON(id).val(JSON.stringify(outData.data.value,null,'\t'));
           else getRawJSON(id).val(outData.data.value);
        }
    }

    // update the form for the json object to contain the textareas containg raw json
    function changeForm(id) {
        for(var i in objs) {
            var obj = objs[i];

            if(obj.name == id) {
                var json = getRawJSON(id).val();

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
        var $rawSwitch = getRawToFormSwitch(id);

        if($rawSwitch.val() == "Show Form") {        
            changeForm(id);
            getRawJSON(id).hide();
            getForm(id).show();
            $rawSwitch.val("Show Raw");
        }
        else {
            changeRaw(id);
            getRawJSON(id).show();
            getForm(id).hide();
            $rawSwitch.val("Show Form");
        }
    }

    function getForm(id) {
         return $("#"+id);
    }

    function getRawJSON(id) {
        return $("#"+id+"-val");
    }

    function getAllRawJSONs() {
        return $('[id$="-val"]');
    }

    function getRawToFormSwitch(id) {
        return $("#"+id+"-rawSwitch");
    }
});
