var numImages = 0;
var IMAGE_HTML = "<img id='tempPreview' />";
var dropLabelStartText = "";

$(document).ready(function() {
	var dropbox = document.getElementById("dropbox")
	dropLabelStartText = document.getElementById("droplabel").innerHTML;

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
	for(var i = 0; i < files.length; i ++)	
	{
		document.getElementById("droplabel").innerHTML = "Processing " + files[i].name;

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

	var holder = document.getElementById("pictureholder");
	$(holder).append(IMAGE_HTML);

	var img = document.getElementById("tempPreview");
	img.id = "picture"+numImages;
	numImages++;

	img.src = evt.target.result;
	img.width = "200";
	img.height = "200";
	document.getElementById("droplabel").innerHTML = dropLabelStartText;
}
