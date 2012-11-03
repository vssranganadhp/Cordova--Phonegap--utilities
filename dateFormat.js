/*	dateFormat.js
 *	Created by Ranganadh Paramkusam on 03/11/2012
 *	Inspired by jquery.dateFormat.js
*/
/*													Examples
	*
	*		For "2012-11-03" 					$.format.date(d,"yyyy-PM-PD");					PM - '0' Padded month, PD - '0' padded date
	*		For "2012-11-03 11:40:10 AM"		$.format.date(d,"yyyy-PM-PD HH:ii:ss a")		used 'ii' - minutes
	*		For "November 03, 2012"				$.format.date(d,"MN PD, yyyy")
	*		For "Nov 03, 2012"					$.format.date(d,"MMM PD, yyyy")
	*		For "Nov 03 2012 11:40AM"			$.format.date(d,"MMM PD yyyy hh:iia")			sql date format
	*		For "03/11/2012"					$.format.date(d,"PD/PM/yyyy")
	*		For "2012-11-3"						$.format.date(d,"yyyy-MM-dd")					MM:month (1,2..9,10,11,12) , dd : date (1,2..10,11..29,30,31)
*/
(function ($) {
    $.format = (function () {
		function strMonth(value) {
			switch (value) {
                case 1:
                    return "January";
                case 2:
                    return "February";
                case 3:
                    return "March";
                case 4:
                    return "April";
                case 5:
                    return "May";
                case 6:
                    return "June";
                case 7:
                    return "July";
                case 8:
                    return "August";
                case 9:
                    return "September";
                case 10:
                    return "October";
                case 11:
                    return "November";
                case 12:
                    return "Decemeber";
                default:
                    return value;
			}
		}
	
        var parseMonth = function (value) {
            switch (value) {
                case "Jan":
                    return "01";
                case "Feb":
                    return "02";
                case "Mar":
                    return "03";
                case "Apr":
                    return "04";
                case "May":
                    return "05";
                case "Jun":
                    return "06";
                case "Jul":
                    return "07";
                case "Aug":
                    return "08";
                case "Sep":
                    return "09";
                case "Oct":
                    return "10";
                case "Nov":
                    return "11";
                case "Dec":
                    return "12";
                default:
                    return value;
            }
        };

        var parseTime = function (value) {
            var retValue = value;
            if (retValue.indexOf(".") !== -1) {
                retValue = retValue.substring(0, retValue.indexOf("."));
            }

            var values3 = retValue.split(":");

            if (values3.length === 3) {
                hour = values3[0];
                minute = values3[1];
                second = values3[2];

                return {
                    time: retValue,
                    hour: hour,
                    minute: minute,
                    second: second
                };
            } else {
                return {
                    time: "",
                    hour: "",
                    minute: "",
                    second: ""
                };
            }
        };

        return {
            date: function (value, format) {
                try {
                    var year = null;
                    var month = null;
                    var dayOfMonth = null;
                    var time = null;
                    if (typeof value.getFullYear === "function") {
                        year = value.getFullYear();
                        month = value.getMonth() + 1;
                        dayOfMonth = value.getDate();
                        time = parseTime(value.toTimeString());
                    } else if (value.search(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.?\d{0,3}\+\d{2}:\d{2}/) != -1) {
                        var values = value.split(/[T\+-]/);
                        year = values[0];
                        month = values[1];
                        dayOfMonth = values[2];
                        time = parseTime(values[3].split(".")[0]);
                    } else {
                        var values = value.split(" ");
                        switch (values.length) {
                            case 6:
                                year = values[5];
                                month = parseMonth(values[1]);
                                dayOfMonth = values[2];
                                time = parseTime(values[3]);
                                break;
                            case 2:
                                var values2 = values[0].split("-");
                                year = values2[0];
                                month = values2[1];
                                dayOfMonth = values2[2];
                                time = parseTime(values[1]);
                                break;
						    case 7:
	                            year = values[3];
	                            month = parseMonth(values[1]);
	                            dayOfMonth = values[2];
	                            time = parseTime(values[4]);
	                            break;
                            default:
                                return value;
                        }
                    }

                    var pattern = "";
                    var retValue = "";
                    for (var i = 0; i < format.length; i++) {
                        var currentPattern = format.charAt(i);
                        pattern += currentPattern;
                        switch (pattern) {
                            case "dd":
                                retValue += dayOfMonth;
                                pattern = "";
                                break;
                            case "MM":
                                if (format.charAt(i+1) == "M") {
                                    break;
                                }
                                retValue += month;
                                pattern = "";
                                break;
                            case "yyyy":
                                retValue += year;
                                pattern = "";
                                break;
							case "PD":                                                      //padded date - 08
								str = dayOfMonth < 10 ? "0"+dayOfMonth : dayOfMonth;
								retValue += str;
								pattern = "";
								break;
							case "PM":                                                      //padded month - 08
								str = month < 10 ? "0"+month : month;
								retValue += str;
								pattern = "";
								break;
                            case "MMM":                                                     //month name decreased to 3 characters
                                retValue += strMonth(month).substr(0,3);
                                pattern = "";
                                break;
                            case "MN":                                                    //month full name
                                retValue += strMonth(month);
                                pattern = "";
                                break;
                            case "HH":                                                      //hours in 24 hours format
                                retValue += time.hour;
                                pattern = "";
                                break;
                            case "hh":                                                      //hours in 12 hours format
                                retValue += (time.hour == 0 ? 12 : time.hour < 13 ? time.hour : time.hour - 12);
                                pattern = "";
                                break;
                            case "ii":                                                      //minutes			because for gettings minutes in php date is "ii"
                                retValue += time.minute;
                                pattern = "";
                                break;
                            case "ss":                                                      //seconds
                                retValue += time.second.substring(0, 2);
                                pattern = "";
                                break;
                            case "a":                                                       //meridian
                                retValue += time.hour >= 12 ? "PM" : "AM";
                                pattern = "";
                                break;
                            case " ":
                                retValue += currentPattern;
                                pattern = "";
                                break;
                            case "/":
                                retValue += currentPattern;
                                pattern = "";
                                break;
                            case ":":
                                retValue += currentPattern;
                                pattern = "";
                                break;
                            default:
                                if (pattern.length === 2 && pattern.indexOf("y") !== 0) {
                                    retValue += pattern.substring(0, 1);
                                    pattern = pattern.substring(1, 2);
                                } else if ((pattern.length === 3 && pattern.indexOf("yyy") === -1)) {
                                    pattern = "";
                                }
                        }
                    }
                    return retValue;
                } catch (e) {
                    console.log(e);
                    return value;
                }
            }
        };
    } ());
} (jQuery));
