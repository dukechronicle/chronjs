var numImages = 0;
var imagesLeft = 0;
var IMAGE_HTML = "<img id='tempPreview' />";
var dropLabelStartText = "";

$(document).ready(function() {
	var dropbox = document.getElementById("dropbox")
	dropLabelStartText = $("#droplabel").text();

	// init event handlers
	dropbox.addEventListener("dragenter", dragEnter, false);
	dropbox.addEventListener("dragexit", dragExit, false);
	dropbox.addEventListener("dragover", dragOver, false);
	dropbox.addEventListener("drop", drop, false);

	// init the widgets
	//$("#progressbar").progressbar();
});

function dragEnter(evt) {
	evt.stopPropagation();
	evt.preventDefault();
}

function dragExit(evt) {
	evt.stopPropagation();
	evt.preventDefault();
}

function dragOver(evt) {
	evt.stopPropagation();
	evt.preventDefault();
}

function drop(evt) {
	evt.stopPropagation();
	evt.preventDefault();

	var files = evt.dataTransfer.files;
	var count = files.length;

	// Only call the handler if 1 or more files was dropped.
	if (count > 0)
		handleFiles(files);
}


function handleFiles(files) {
	imagesLeft = files.length;

	for(var i = 0; i < files.length; i ++)	
	{
		if(files.length == 1)
		{
			$("#droplabel").text("Processing " + files[0].name);
		}
		else
		{
			$("#droplabel").text("Processing files...");
		}

		var reader = new FileReader();

		// init the reader event handlers
		reader.onprogress = handleReaderProgress;
		reader.onloadend = handleReaderLoadEnd;

		// begin the read operation
		reader.readAsDataURL(files[i]);
	}
}

function handleReaderProgress(evt) {
	if (evt.lengthComputable) {
		var loaded = (evt.loaded / evt.total);

		//$("#progressbar").progressbar({ value: loaded * 100 });
	}
}

function handleReaderLoadEnd(evt) {
	//$("#progressbar").progressbar({ value: 100 });

	$("#pictureholder").append(IMAGE_HTML);

	var img = $("#tempPreview");
	img.attr("id","picture"+numImages);
	numImages++;

	img.attr("src",evt.target.result);
	img.attr("width","200");
	img.attr("height","200");
	
	imagesLeft --;

	if(imagesLeft == 0)
	{
		$("#droplabel").text(dropLabelStartText);
	}
}
