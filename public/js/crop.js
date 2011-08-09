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

function updateCropSize() {
    var select = document.getElementById("sizes");
    var chosen = select.options[select.selectedIndex].value;
    var size = sizes[chosen];
    crop(size);
}

function showCoords(c) {
    $('#x1').val(c.x);
    $('#y1').val(c.y);
    $('#x2').val(c.x2);
    $('#y2').val(c.y2);
};
function clearCoords() {
    $('#coords input').val('');
};
