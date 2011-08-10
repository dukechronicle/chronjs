var sizes;

var cropOptions = {
    onChange: showCoords,
    onSelect: showCoords,
    onRelease: clearCoords
};

function setSizes(s) {
    sizes = eval('(' + s + ')');
}

function crop(dim) {
    cropOptions.aspectRatio = dim.width / dim.height;
    cropOptions.minSize = [dim.width, dim.height];
    jQuery(function() {
        jQuery('#toCrop').Jcrop(cropOptions);
    });
}

function currentSize() {
    var select = document.getElementById("sizes");
    var chosen = select.options[select.selectedIndex].value;
    var size = sizes[chosen];
    return size;
}

function updateCropSize() {
    var size = currentSize();
    crop(size);
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
