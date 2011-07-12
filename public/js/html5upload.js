var numImages = 0;
var imagesLeft = 0;
var IMAGE_HTML = "<img id='tempPreview' />";
var dropLabelStartText = "";
var imageNames = {};
var uploading = false;
var imgCount = 0;

$(function() {
	dropLabelStartText = $("#droplabel").text();

	// init event handlers
	var dropbox = document.getElementById("dropbox");

	dropbox.addEventListener("dragenter", function(evt) {
		evt.stopPropagation();
		evt.preventDefault();
	}, false);

	dropbox.addEventListener("dragexit", function(evt) {
		evt.stopPropagation();
		evt.preventDefault();
	}, false);

	dropbox.addEventListener("dragover", function(evt) {
		evt.stopPropagation();
		evt.preventDefault();
	}, false);

	dropbox.addEventListener("drop", function(evt) {
		evt.stopPropagation();
		evt.preventDefault();

		var files = evt.dataTransfer.files;
		var count = files.length;

		// Only call the handler if 1 or more files was dropped.
		if (count > 0 && !uploading) {
			imagesLeft = count;
			imgCount += count;
			
			uploading = true;

			if(count == 1) {
				$("#droplabel").text("Uploading " + files[0].name);
			}
			else {
				$("#droplabel").text("Uploading files...");
			}

			$.each(files,function(index,file) {
				// begin the read operation
				var reader = new FileReader();

				// init the reader event handlers
				reader.onprogress = handleReaderProgress;
				reader.onloadend = handleReaderLoadEnd;
				
				imageNames[index] = file.name;
				reader.readAsDataURL(file);
			});
		}
	}, false);

	// init the widgets
	//$("#progressbar").progressbar();
});

function handleReaderProgress(evt) {
	if (evt.lengthComputable) {
		var loaded = (evt.loaded / evt.total);

		//$("#progressbar").progressbar({ value: loaded * 100 });
	}
}

function handleReaderLoadEnd(evt) {
	//$("#progressbar").progressbar({ value: 100 });
	
	/*
	 * Per the Data URI spec, the only comma that appears is right after
	 * 'base64' and before the encoded content.
	 */
	var imageData = evt.target.result.substring(evt.target.result.indexOf(',') + 1);
	
	// set image type to MIME type in data uri string	
	var imageType = evt.target.result.split(';',1);
	imageType = imageType[0].substring(5);

	var imageID = "picture"+(imgCount - imagesLeft);

	$.ajax({
   		type: "POST",
  		url: "/test-upload",
   		data: {
			imageData: imageData,
			imageName: imageNames[numImages],
			imageType: imageType,
			imageID: imageID		
		},
		error: function(msg) {
			alert('Error');
		},

   		success: function(msg) {
			json = jQuery.parseJSON(msg);

			if(json.error) {
				alert(json.error);
				$("#"+json.imageID).fadeOut('slow');
			}
			else {
				$("#"+json.imageID).addClass('done');			
			}
   		}
 	});

	numImages ++;

	$("#pictureholder").append(IMAGE_HTML);

	var img = $("#tempPreview");

	img.hide();
	img.attr("id",imageID);

	img.attr("src",evt.target.result);
	img.addClass('inprogress');

	img.fadeIn('slow');

	imagesLeft --;

	if(imagesLeft == 0)	
	{
		$("#droplabel").text(dropLabelStartText);
		uploading = false;
		imageNames = {};
		numImages = 0;
	}	
}
