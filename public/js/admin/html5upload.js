define(['jquery', 'async'], function ($) {

    var IMAGE_HTML = "<img id='tempPreview' />";

    var imagesToProcess = 0;
    var dropLabelStartText = "";
    var isUploading = false;
    var totalImages = 0;

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

	    // Only call the handler if 1 or more files was dropped and files are not currently being uploaded
	    if (count > 0 && !isUploading) {
		imagesToProcess = count;
		totalImages += count;
		
		isUploading = true;

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
		    reader.onloadend = handleReaderLoadEnd(file);

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

    // Closure around event handler to capture the file information	
    function handleReaderLoadEnd(theFile) {
        return function(evt) {
	    //$("#progressbar").progressbar({ value: 100 });
	    
	    /*
	     * Per the Data URI spec, the only comma that appears is right after
	     * 'base64' and before the encoded content.
	     */
	    var imageData = evt.target.result.substring(evt.target.result.indexOf(',') + 1);
	    
	    // set image type to MIME type in data uri string	
	    var imageType = evt.target.result.split(';',1);
	    imageType = imageType[0].substring(5);

	    var imageID = "picture"+(totalImages - imagesToProcess);

	    // post image data to the server
	    $.ajax({
       		type: "POST",
      		url: "/admin/image/upload",
       		data: {
		    imageData: imageData,
		    imageName: theFile.name,
		    imageType: imageType,
		    imageID: imageID		
		},
		error: function(msg) {
		    alert('Error');
		},

       		success: function(msg) {
		    var json = jQuery.parseJSON(msg);

		    if(json.error) {
			alert(json.error);
			$("#"+json.imageID).fadeOut('slow'); // if error, remove image from the page
		    }
		    else {
                        console.log("success");
			$("#"+json.imageID).addClass('done'); // if sucess, set the image's styling as 'done' uploading	
			$("#"+json.imageID).wrap('<a href="/admin/image/' + json.imageName + '" />');
		    }
       		}
     	    });

	    imagesToProcess --;

	    // add the image to the page
	    $("#pictureholder").append(IMAGE_HTML);

	    var img = $("#tempPreview");
	    img.hide();
	    img.attr("id",imageID);
	    img.attr("src",evt.target.result);

	    img.addClass('inprogress'); // set the images styling as 'inprogress' uploading
	    img.fadeIn('slow');

	    if(imagesToProcess == 0)	
	    {
		$("#droplabel").text(dropLabelStartText);
		isUploading = false;
	    }
        }	
    }

});