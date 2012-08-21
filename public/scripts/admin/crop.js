define(['jquery', 'lib/jquery.Jcrop'], function ($) {

    var sizes;

    var cropOptions = {
        onChange: showCoords,
        onSelect: showCoords,
        onRelease: clearCoords
    };

    return { "#crop": cropImage }

    function cropImage () {
        sizes = $("#sizes").data('sizes');
        updateCropSize();
        $("#sizes").change(updateCropSize);
        $("a.help").click(showDescriptions);
    };

    function crop(dim) {
        cropOptions.aspectRatio = dim.width / dim.height;
        cropOptions.minSize = [dim.width, dim.height];
        cropOptions.setSelect = [0, 0, dim.width, dim.height];
        $("#crop").Jcrop(cropOptions);
    }

    function currentSize() {
        var select = document.getElementById("sizes");
        var chosen = select.options[select.selectedIndex].value;
        var size = sizes[chosen];
        return size;
    }

    function updateCropSize() {
        crop(currentSize());
    }

    function showCoords(c) {
        $('#x1').val(c.x);
        $('#y1').val(c.y);
        $('#x2').val(c.x2);
        $('#y2').val(c.y2);
        $('#fWidth').val(currentSize().width);
        $('#fHeight').val(currentSize().height);
    };
    function clearCoords() {
        $('#coords input').val('');
    };

    function showDescriptions() {
        var desc = "What different image types are for:\n";
        for(var i in sizes) {
            desc += "\n" + i + " - " + sizes[i].description + "\n";
        }
        alert(desc);
    }

});