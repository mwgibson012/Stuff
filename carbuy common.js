// ReSharper disable once UnusedParameter
(function (carBuy, $, undefined) {
    $(".maskedDate").mask("99/99/9999");
    $(".maskedPhone").mask("(999) 999-9999");
    $(".maskedPostalCode").mask("99999", { placeholder: " " });
    $(".maskedNumbers").mask("9999999999");

    $(".FormatMoneyForInputs").maskMoney();

    var mainDisplayMessage = $(".mainDisplayMessage");

    //forces integer only input for text boxes by css class.  if classSelector is null then it defaults to integer
    carBuy.initInteger = function (classSelector, placeholder) {
        if (classSelector === null || classSelector === undefined) {
            classSelector = ".integer";
        }
        if (classSelector[0] !== '.') {
            classSelector = "." + classSelector;
        }
        if (placeholder === null || placeholder === undefined) {
            placeholder = false;
        }

        $(document).off("keyup", classSelector).on("keyup", classSelector, function (e) {
            //ignore backspace and tab
            if (e.keyCode == '8') {
                return;
            } else if (e.keyCode == '9') {
                $(this).focus().select();
                return;
            }
            var text = $(this).val();
            var len = text.length;
            //is character entered a number?
            if (!carBuy.isNumber(text) || e.keyCode == "190") {
                $(this).val(text.substr(0, len - 1));
            }
            //defend against invalid paste
            //check to see if text is a number.
            text = $(this).val();
            if (!carBuy.isNumber(text)) {
                $(this).val('');
            }
            var trimmed = carBuy.trimLeadingZeros($(this).val());
            $(this).val(trimmed);
        });
        //set empty controls to zero
        if (!placeholder) {
            $(classSelector).each(function () {
                if ($(this).val().length < 1) {
                    $(this).val('0');
                }
            });
        }
    }
    //initalizes controls with class of classSelector to display currency
    //if classSelector is not provided then the class of 'currency' is used.
    carBuy.initCurrency = function (classSelector) {
        if (classSelector === null || classSelector === undefined) {
            classSelector = ".currency";
        }
        if (classSelector[0] !== '.') {
            classSelector = "." + classSelector;
        }
        //set cents on a textbox
        function setCentsOnCtrl(ctrl) {
            var text = ctrl.val();
            var idx = text.indexOf('.');
            var len = text.length;
            //hard code cents
            if (idx === -1) {
                text += "0.00";
            } else {
                var lenAfterDot = text.substr(idx + 1, len).length;
                if (lenAfterDot === 0) {
                    text += "00";
                } else if (lenAfterDot === 1) {
                    text += "0";
                }
            }
            ctrl.val(text);
        }
        //format money controls with cents
        $(classSelector).each(function () {
            setCentsOnCtrl($(this));
        });

        $(classSelector).maskMoney({ allowZero: true, allowNegative: true });
    };
    //manually set message display text from js.
    //message: text to display
    //issuccess:  set to true or null for a success message.  set to false for an error message
    //scrollToTop:  undefined/true=scroll viewport to top so message text is always visible to the user
    carBuy.setMainDisplay = function (message, issuccess, scrollToTop) {
        var msg = "A system error occurred. ";
        try {
            carBuy.clearMainDisplay();
            if (!carBuy.isEmpty(message)) {
                msg = message;
            }
            if (scrollToTop === undefined || scrollToTop === null) {
                scrollToTop = true;
            }
            //set class on message area
            if (!carBuy.isEmpty(issuccess) && !issuccess) {
                mainDisplayMessage.addClass("alert alert-danger ");
            } else {
                mainDisplayMessage.addClass("alert alert-success ");
            }
            mainDisplayMessage.html(msg);
            //should the screen scroll to the top to ensure the message area is visible to the user?
            if (scrollToTop) {
                window.scrollTo(0, 0);
            }
        } catch (ex) {
            //alert a failure to set main display message
            alert("Unable to complete operation.\n" + msg);
        }
    };
    //removes text from display message.  
    //Use if display message that has been set in js needs to be cleared.
    carBuy.clearMainDisplay = function () {
        mainDisplayMessage.removeClass();
        mainDisplayMessage.addClass('mainDisplayMessage');
        mainDisplayMessage.html('');
    };
    //for controller calls which return JsonResponseFactory as JsonResult.  
    //Set main display message for success or failure.
    //response: JSON returned from controller. Use when controller returns an JsonResponseFactory object.
    //successMessage:  use this to override default factory success message
    //errorMessage: use this to override default factory error message
    carBuy.responseFactoryMessage = function (response, successMessage, errorMessage) {
        var msg;
        var success = false;
        //trust no one.  check for bad response and message.
        if (carBuy.isEmpty(response)) {
            msg = "An error occurred. No response was returned.";
        } else if (carBuy.isEmpty(response.ResponseMessage)) {
            msg = "An error occurred. No response message.";
        } else {
            msg = response.ResponseMessage;
            success = response.ResponseSuccess;
        }
        if (success && !carBuy.isEmpty(successMessage)) {
            msg = successMessage;
        }
        if (!success && !carBuy.isEmpty(errorMessage)) {
            msg = errorMessage;
        }
        carBuy.setMainDisplay(msg, success);
    };

    carBuy.showJsException = function (ex, scrollToTop) {
        carBuy.setMainDisplay(ex.message, false, scrollToTop);
    };
    //catch unhandled js exceptions
    window.onerror = function (message, url, linenumber) {
        var msg = message + ' on line ' + linenumber + ' for ' + url;
        carBuy.setMainDisplay(msg, false, true);
    };
    //global error handler for ajax errors
    $(document).ajaxError(function (event, jqxhr, settings, exception) {
        var errTxt;
        if (jqxhr.status === 0) {
            errTxt = ('Not connected.\nPlease verify your network connection.');
        } else if (jqxhr.status === 404) {
            errTxt = ('The requested page not found. [404]');
        } else if (jqxhr.status === 500) {
            errTxt = ('Internal Server Error [500].');
        } else if (exception === 'parsererror') {
            errTxt = ('Requested JSON parse failed.');
        } else if (exception === 'timeout') {
            errTxt = ('Time out error.');
        } else if (exception === 'abort') {
            errTxt = ('Ajax request aborted.');
        } else {
            errTxt = (jqxhr.responseText);
        }
        carBuy.setMainDisplay(errTxt, false, true);
        carBuy.hideBusy();
    });

    $(document).ajaxStart(function () {
        carBuy.showBusy();
    });
    $(document).ajaxStop(function () {
        carBuy.hideBusy();
    });

    carBuy.NumbersOnly = function () {
        $(".NumbersOnly").keypress(function (e) {
            //if the letter is not digit then display error and don't type anything
            if (e.which !== 8 && e.which !== 0 && (e.which < 48 || e.which > 57)) {
                //display error message
                return false;
            }
            return true;
        });
    };
    //makes an ajax call 
    //url: /controller/method.  required.
    //isGetRequest:  boolean.  optional. if null it defaults to GET.  
    //jsonData: method arguments as json. optional.  if null it defaults to {}
    //isCache: set if the browser should cache the results.  optional. if null it defaults to true
    carBuy.getAjaxResponse = function (url, isGetRequest, jsonData, isCache) {
        //must receive url
        if (url === undefined || url === null || url.length < 1) {
            return "No url was provided.";
        }
        //construct controller method argument
        var jdata = jsonData === undefined || jsonData === null ? {} : jsonData;
        //set post or get. 
        var requestType = (!carBuy.isEmpty(isGetRequest) && !isGetRequest) ? "POST" : "GET";

        if (carBuy.isEmpty(isCache)) {
            isCache = false;
        }

        //make ajax call and return response
        return $.ajax({
            type: requestType,
            data: jdata,
            url: url,
            cache: isCache
        });
    };

    carBuy.postJson = function (url, jsonData) {
        //must receive url
        if (url === undefined || url === null || url.length < 1) {
            return "No url was provided.";
        }
        //construct controller method argument
        var jdata = jsonData === undefined || jsonData === null ? {} : jsonData;
        //make ajax call and return response
        return $.ajax({
            type: "POST",
            data: jdata,
            contentType: "application/json",
            url: url
        });
    };

    carBuy.showBusy = function () {
        $('#BusyContainerInactive').hide();
        $('#BusyContainer').show();
    };

    carBuy.hideBusy = function () {
        $('#BusyContainer').hide();
        $('#BusyContainerInactive').show();
    };

    carBuy.resetValidation = function () {
        //Removes validation from input-fields
        $('.input-validation-error').addClass('input-validation-valid');
        $('.input-validation-error').removeClass('input-validation-error');
        //Removes validation message after input-fields
        $('.field-validation-error').addClass('field-validation-valid');
        $('.field-validation-error').removeClass('field-validation-error');
        //Removes validation summary 
        $('.validation-summary-errors').addClass('validation-summary-valid');
        $('.validation-summary-errors').removeClass('validation-summary-errors');
        carBuy.clearMainDisplay();
    };

    carBuy.isEmpty = function (txt) {
        return txt === undefined || txt === null || txt.length < 1;
    };

    carBuy.valueOrDefault = function (val, defaultVal) {
        if (val === null || val === undefined || val.length < 1) {
            return defaultVal;
        }
        return val;
    };

    //may not be needed.  comment out for now.
    //also, comment out #divRelPath on layout view.
    //carBuy.relPath = function (path) {
    //    var ret = $("#divRelPath").attr("data-path");
    //    ret = ret + path;
    //    return ret;
    //};

    //polyfill for js trim
    if (!String.prototype.trim) {
        String.prototype.trim = function () {
            return this.replace(/^\s+|\s+$/g, '');
        };
    }
    carBuy.isNumber = function (n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    };
    //trims multiple leading zeros while ignoring a single zero
    carBuy.trimLeadingZeros = function (text) {
        var trimmed = text.replace(/\b(0(?!\b))+/g, "");
        return trimmed;
    };

    carBuy.formatCurrency = function (value, applyDollarSign, decimalPlaces) {
        if (carBuy.isEmpty(decimalPlaces)) {
            decimalPlaces = 2;
        }
        if (applyDollarSign === true) {
            return "$" + Number(value).formatMoney(decimalPlaces, ',', '.');
        } else {

            return Number(value).formatMoney(decimalPlaces, ',', '.');
        }
    };

    Number.prototype.formatMoney = function (decPlaces, thouSeparator, decSeparator) {
        decPlaces = isNaN(decPlaces = Math.abs(decPlaces)) ? 2 : decPlaces;
        thouSeparator = thouSeparator == undefined ? "," : thouSeparator;
        decSeparator = decSeparator == undefined ? "." : decSeparator;
        var n = this,
        sign = n < 0 ? "-" : "",
        i = parseInt(n = Math.abs(+n || 0).toFixed(decPlaces)) + "",
        j = (j = i.length) > 3 ? j % 3 : 0;
        return sign + (j ? i.substr(0, j) + thouSeparator : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thouSeparator) + (decPlaces ? decSeparator + Math.abs(n - i).toFixed(decPlaces).slice(2) : "");
    };

    $(document).ready(function () {
        $('textarea[maxlength]').bind("change keypress click", function (e) {
            //get the limit from maxlength attribute
            var limit = parseInt($(this).attr('maxlength'));
            //get the current text inside the textarea
            var text = $(this).val();
            //count the number of characters in the text
            var chars = text.length;

            var name = $(this).data("name");
            //check if there are more characters then allowed
            if (chars == limit) {
                e.preventDefault();
                carBuy.clearMainDisplay();
            }
            else if (chars > limit) {
                //and if there are use substr to get the text before the limit
                carBuy.setMainDisplay("Max Length of 1000 Exceeded for " + name + "! <br>Please review your entry, as it might of changed.", false);
                this.value = this.value.substring(0, limit);
            } else {
                carBuy.clearMainDisplay();
            }
        });
    });

    carBuy.militaryTimeDropdown = function (startTime, selector, endTime) {
        $(selector).append("<option>----</option>");
        if (!carBuy.isNumber(startTime)) {
            startTime = 0;
        }
        if (startTime >= 2400) {
            return;
        }
        if (!carBuy.isNumber(endTime)) {
            endTime = 2400;
        }
        if (startTime < 0) startTime = 0;
        var startInt = parseInt(startTime);
        for (var curTime = startInt; curTime <= endTime; curTime += 100) {
            var hourPadded = ("000" + curTime).slice(-4);
            var hrtText = carBuy.convert24HourTo12Hour(hourPadded);
            $(selector).append("<option value='" + hourPadded + "'>" + hrtText + "</option>");
            if (curTime < 2400) {
                var lastTwoOfCurrentTime = hourPadded.slice(-2);
                var halfHourPadded = lastTwoOfCurrentTime == "00" ? ("000" + (curTime + 30)).slice(-4) : ("000" + (curTime + 70)).slice(-4);
                var halfHrText = carBuy.convert24HourTo12Hour(halfHourPadded);
                $(selector).append("<option value='" + halfHourPadded + "'>" + halfHrText + "</option>");
            }
        }
    };

    //four character military time without semi-colon.  ex: 1830 or 0350
    carBuy.convert24HourTo12Hour = function (militaryTime) {
        var hr = parseInt(militaryTime.slice(0, 2));
        //hard code midnight for clarity
        if (hr >= 2400 || hr == 0) {
            return "12:00am";
        }
        var minutes = militaryTime.slice(2, 4);
        if (minutes.length < 1) minutes = 0;
        //fix for data issue in qc
        if (minutes == 60) minutes = 30;
        var sal = hr >= 12 ? " PM" : " AM";
        var hr12 = hr > 12 ? hr - 12 : hr;
        if (hr == 24) sal = " AM";
        var ret = hr12 + ":" + ("0" + minutes).slice(-2) + sal;
        return ret;
    };


    carBuy.printArray = function (printthis, returnoutput) {
        var output = '';

        if ($.isArray(printthis) || typeof (printthis) == 'object') {
            for (var i in printthis) {
                output += i + ' : ' + carBuy.printArray(printthis[i], true) + '\n';
            }
        } else {
            output += printthis;
        }
        if (returnoutput && returnoutput == true) {
            return output;
        } else {
            alert(output);
        }
    };

    carBuy.findAndRemove=function(array, property, value) {
        $.each(array, function (index, result) {
            if (result && result[property] == value) {
                //Remove from array
                array.splice(index, 1);
            }
        });
    }
}(window.carBuy = window.carBuy || {}, jQuery));
