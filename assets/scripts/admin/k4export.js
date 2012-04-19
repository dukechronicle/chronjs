var k4export;

define(['jquery', 'Article', 'libs/jquery.dd'], function ($, Article) {

    k4export = function () {

        $(".article-form").submit(function (e) {
            e.preventDefault();
            $form = $(this);
            $form.children(".btn").attr('disabled', 'disabled');
            editDocument($form, function (err) {
                if (err) {
                    alert(err);
                    $form.children(".btn").removeAttr('disabled');
                }
                else {
                    $form.fadeOut('slow', function () {
                        $form.remove();
                    });
                }
            });
        });

        try {
            $(".article-form .image").msDropDown({visibleRows:4, rowHeight:100});
        } catch(e) {
            alert(e.message);
        }
    };

    function editDocument($form, callback) {
        var article = new Article($form.data("article"));

        article.set({
            taxonomy: JSON.parse($form.children(".taxonomy").val())
        });
        if (!article.get('taxonomy'))
            return callback("Must select a section for article");

        try {
            var imageData = JSON.parse($form.find(".image").val());
            article.addImageVersions(imageData.originalId,
                                     imageData.imageVersions,
                                     imageData.imageVersionTypes);
        }
        catch (e) {
            return callback("Error getting image: " + e);
        }

        article.save(null, {
            url: '/api/article/' + id,
            success: function(data, status, jqXHR) {
                callback(null, data);
            },
            error: function (jqXHR, status, errorThrown) {
                callback(status.responseText);
            }
        });
    }

});
