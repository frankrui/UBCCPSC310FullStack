$(function() {

	var coursesOrdering = [];

	var supportedOrderings = {
		most_failing: "courses_fail",
		most_passing: "courses_pass",
		average_grade: "courses_avg"
	};

	var supportedOrderingsReverse = {
		courses_fail: "most_failing",
		courses_pass: "most_passing",
		courses_avg: "average_grade"
	};

	var days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    var chart = new CanvasJS.Chart("chartContainer", {
        title: {
            text: "Course Analyzer"
        },
        data: [
            {
                type: "column",
                dataPoints: []
            }
        ]
    });
    chart.render();

	addDatasets();

	function addDatasets() {
		$.ajax({
			url:"http://localhost:4321/addDatasets",
		   	type:"PUT",
		   	processData: false,
	       	success: function() {
	       		console.log("Datasets Added");
	       	}
	    });
	}

	function showErrorPopup(errorMessage) {
		sweetAlert("Error!", errorMessage, "error");
	}

	function showMessage(message) {
		sweetAlert("Message:", message);
	}

	function getCoursesState() {
		var dept = {
			checked: $("#dept_checkbox").prop("checked"),
			value: $("#dept_input").val(),
			order: coursesOrdering
		};
		var number = {
			checked: $("#course_number_checkbox").prop("checked"),
			value: $("#course_number_input").val()
		};
		var instructor = {
			checked: $("#instructor_checkbox").prop("checked"),
			value: $("#instructor_input").val()
		};
		var title = {
			checked: $("#title_checkbox").prop("checked"),
			value: $("#title_input").val()
		};

		var numericOperator = "";
		if ($("#gt_courses").prop("checked")) {
			numericOperator = "GT";
		} else if ($("#lt_courses").prop("checked")) {
			numericOperator = "LT";
		} else if ($("#eq_courses").prop("checked")) {
			numericOperator = "EQ";
		}
		var size = {
			checked: $("#size_checkbox").prop("checked"),
			value: $("#size_input").val(),
			numericOperator: numericOperator
		};

		var logic = "";
		if ($("#and_courses").prop("checked")) {
			logic = "AND";
		} else if ($("#or_courses").prop("checked")) {
			logic = "OR";
		}
		var coursesState = {
			dept: dept,
			number: number,
			instructor: instructor,
			title: title,
			size: size,
			logic: logic
		};
		return coursesState;
	}

	function handleAdvancedOptions(option, bAdd) {
		var supported = Object.keys(supportedOrderings);
		if(supported.includes(option)) {
			var key = supportedOrderings[option];
			if (bAdd && !coursesOrdering.includes(key)) {
				coursesOrdering.push(key);
			} else if (!bAdd) {
				var index = coursesOrdering.indexOf(key);
				if (index > -1) {
					coursesOrdering.splice(index, 1);
				}
			}
			updateOrderLabel();
		}
	}

	function updateOrderLabel() {
		var orderLabel = $("#order");
		if (coursesOrdering.length > 0) {
			var orderString = "Order: ";
			for(var i = 0; i < coursesOrdering.length; i++) {
				if (i != coursesOrdering.length - 1) {
					orderString = orderString + supportedOrderingsReverse[coursesOrdering[i]] + ", ";
				} else {
					orderString = orderString + supportedOrderingsReverse[coursesOrdering[i]];
				}
			}
			orderLabel.html(orderString);
		} else {
			orderLabel.html("");
		}
	}

	function validateState(state) {
		var countChecked = 0;
		Object.keys(state).forEach(function(filterKey) {
			if (state[filterKey].checked) {
				countChecked++;
			}
		});
		if (countChecked > 1 && !state.logic) {
			return false;
		} else {
			return true;
		}
	}

	function constructCoursesQuery(state) {
		var bAllowMultiSelect = false;
		var query = {
			WHERE:{},
			OPTIONS: {
				COLUMNS: ["courses_dept", "courses_id", "courses_instructor", "courses_size", "courses_title"],
				FORM: "TABLE"
			}
		};
		if (state) {
			if (state.logic) {
				query.WHERE[state.logic] = [];
				bAllowMultiSelect = true;
			}

			if (state.number && state.number.checked) {
				var numberFilter = {
					"IS": {
						"courses_id": state.number.value
					}
				};
				if (bAllowMultiSelect) {
					query.WHERE[Object.keys(query.WHERE)[0]].push(numberFilter);
				} else if (Object.keys(query.WHERE).length == 0) {
					query.WHERE = numberFilter;
				}
			}

			if (state.instructor && state.instructor.checked) {
				var instructorFilter = {
					"IS": {
						"courses_instructor": state.instructor.value
					}
				};
				if (bAllowMultiSelect) {
					query.WHERE[Object.keys(query.WHERE)[0]].push(instructorFilter);
				} else if (Object.keys(query.WHERE).length == 0) {
					query.WHERE = instructorFilter;
				}
			}

			if (state.title && state.title.checked) {
				var titleFilter = {
					"IS": {
						"courses_title": state.title.value
					}
				};
				if (bAllowMultiSelect) {
					query.WHERE[Object.keys(query.WHERE)[0]].push(titleFilter);
				} else if (Object.keys(query.WHERE).length == 0) {
					query.WHERE = titleFilter;
				}
			}

			var sizeFilter = {};
			if (state.size && state.size.checked && state.size.numericOperator) {
				sizeFilter[state.size.numericOperator] = {
					"courses_size": + state.size.value			
				};
				if (bAllowMultiSelect) {
					query.WHERE[Object.keys(query.WHERE)[0]].push(sizeFilter);
				} else if (state.size.numericOperator && Object.keys(query.WHERE).length == 0) {
					query.WHERE = sizeFilter;
				}
			}

			if (state.dept && state.dept.checked) {
				var deptFilter = {
					"IS": {
						"courses_dept": state.dept.value
					}
				};
				if (bAllowMultiSelect) {
					query.WHERE[Object.keys(query.WHERE)[0]].push(deptFilter);
				} else if (Object.keys(query.WHERE).length == 0) {
					query.WHERE = deptFilter;
				}
			}

			if (state.dept && state.dept.order && state.dept.order.length > 0) {
				query["TRANSFORMATIONS"] = {
					GROUP: ["courses_dept", "courses_id"],
					APPLY: []
				}

				query.OPTIONS.ORDER = {
					"dir": "DOWN",
					"keys": []
				};
				state.dept.order.forEach(function(key) {
					if (key === "courses_fail") {
						query.TRANSFORMATIONS.APPLY.push({
							"maxFail" : {
								"MAX": "courses_fail"
							}
						});
						query.OPTIONS.ORDER.keys.push("maxFail");
					} else if (key === "courses_pass") {
						query.TRANSFORMATIONS.APPLY.push({
							"maxPass" : {
								"MAX": "courses_pass"
							}
						});
						query.OPTIONS.ORDER.keys.push("maxPass");
					} else {
						query.TRANSFORMATIONS.APPLY.push({
							"avgGrade" : {
								"AVG": "courses_avg"
							}
						});
						query.OPTIONS.ORDER.keys.push("avgGrade");
					}
				});

				var applyKeys = query.TRANSFORMATIONS.APPLY.map(function(applyObj) {
					return Object.keys(applyObj)[0];
				});
				var cols = query.TRANSFORMATIONS.GROUP.concat(applyKeys)
				query.OPTIONS.COLUMNS = cols;
			}
		}
		return query;
	}

	function getRoomsState() {
		var number = {
			checked: $("#room_number_checkbox").prop("checked"),
			value: $("#room_number_input").val()
		};
		var building = {
			checked: $("#building_checkbox").prop("checked"),
			value: $("#building_input").val()
		};
		var furniture = {
			checked: $("#furniture_checkbox").prop("checked"),
			value: $("#furniture_input").val()
		};
		var type = {
			checked: $("#type_checkbox").prop("checked"),
			value: $("#type_input").val()
		};
		var seats = {
			checked: $("#seats_checkbox").prop("checked"),
			value: $("#seats_input").val()
		};
		var logic = "";
		if ($("#and_rooms").prop("checked")) {
			logic = "AND";
		} else if ($("#or_rooms").prop("checked")) {
			logic = "OR";
		}
		var within = {
			checked: $("#within_checkbox").prop("checked"),
			meters: $("#meters_input").val(),
			building: $("#within_building_input").val()
		};

		var state = {
			number: number,
			building : building,
			furniture: furniture,
			type: type,
			seats: seats,
			logic: logic,
			within: within
		};
		return state;
	}



	function constructRoomsQuery(state) {
		var bAllowMultiSelect = false;
		var query = {
			WHERE:{},
			OPTIONS: {
				COLUMNS: ["rooms_shortname", "rooms_number", "rooms_furniture", "rooms_type", "rooms_seats"],
				FORM: "TABLE"
			}
		};
		if (state) {
			if (state.logic) {
				query.WHERE[state.logic] = [];
				bAllowMultiSelect = true;
			}

			if (state.number && state.number.checked) {
				var numberFilter = {
					"IS": {
						"rooms_number": state.number.value
					}
				};
				if (bAllowMultiSelect) {
					query.WHERE[Object.keys(query.WHERE)[0]].push(numberFilter);
				} else if (Object.keys(query.WHERE).length == 0) {
					query.WHERE = numberFilter;
				}
			}

			if (state.building && state.building.checked) {
				var buildingFilter = {
					"IS": {
						"rooms_shortname": state.building.value
					}
				};
				if (bAllowMultiSelect) {
					query.WHERE[Object.keys(query.WHERE)[0]].push(buildingFilter);
				} else if (Object.keys(query.WHERE).length == 0) {
					query.WHERE = buildingFilter;
				}
			}

			if (state.furniture && state.furniture.checked) {
				var furnitureFilter = {
					"IS": {
						"rooms_furniture": state.furniture.value
					}
				};
				if (bAllowMultiSelect) {
					query.WHERE[Object.keys(query.WHERE)[0]].push(furnitureFilter);
				} else if (Object.keys(query.WHERE).length == 0) {
					query.WHERE = furnitureFilter;
				}
			}

			if (state.type && state.type.checked) {
				var typeFilter = {
					"IS": {
						"rooms_type": state.type.value
					}
				};
				if (bAllowMultiSelect) {
					query.WHERE[Object.keys(query.WHERE)[0]].push(typeFilter);
				} else if (Object.keys(query.WHERE).length == 0) {
					query.WHERE = typeFilter;
				}
			}

			if (state.seats && state.seats.checked) {
				var seatsFilter = {
					"GT": {
						"rooms_seats": + state.seats.value
					}
				};
				if (bAllowMultiSelect) {
					query.WHERE[Object.keys(query.WHERE)[0]].push(seatsFilter);
				} else if (Object.keys(query.WHERE).length == 0) {
					query.WHERE = seatsFilter;
				}
			}

			if (state.within && state.within.checked && state.within.meters && state.within.building) {
				query.WITHIN = state.within;
				query.WITHIN.logic = state.logic;
				query.OPTIONS.COLUMNS.push("rooms_lat");
				query.OPTIONS.COLUMNS.push("rooms_lon");
				query.OPTIONS.COLUMNS.push("rooms_name");
			}
		}
		return query;
	}

	function generateTable(table, results) {
		if (results.length > 0) {
			var columns = Object.keys(results[0]);
			columns = columns.map(function(column) {
				return {
					title : column
				};
			});
			var data = results.map(function(row) {
				var tableRow = [];
				Object.keys(row).forEach(function(key) {
					tableRow.push(row[key]);
				});
				return tableRow;
			});
			table.DataTable({
				data: data,
				columns: columns
			});
		}
	}

	function getSchedulerState() {
		var coursesLogic = "";
		if ($("#and_schedule_courses").prop("checked")) {
			coursesLogic = "AND";
		} else if ($("#or_schedule_courses").prop("checked")) {
			coursesLogic = "OR";
		}
		var courses = {
			dept: $("#schedule_dept_input").val(),
			logic: coursesLogic,
			number: $("#schedule_number_input").val()
		};

		var roomsLogic = "";
		if ($("#and_schedule_rooms").prop("checked")) {
			roomsLogic = "AND";
		} else if ($("#or_schedule_rooms").prop("checked")) {
			roomsLogic = "OR";
		}
		var rooms = {
			building: $("#schedule_building_input").val(),
			logic: roomsLogic,
			meters: $("#schedule_meters_input").val(),
			withinBuilding: $("#schedule_building_within_input").val()
		};

		var fireQuery = (courses.dept || courses.number) && (rooms.building || (rooms.meters && rooms.withinBuilding)) ? true : false;
		var state = {
			courses: courses,
			rooms: rooms,
			fireQuery: fireQuery
		};
		return state;
	}

	function adaptCoursesState(coursesState) {
		var dept = {};
		if (coursesState.dept) {
			dept.checked = true;
			dept.value = coursesState.dept;
		}
		var number = {};
		if (coursesState.number) {
			number.checked = true;
			number.value = coursesState.number;
		}
		var logic = coursesState.logic;
		var finalState = {
			dept: dept,
			number: number,
			logic: logic
		};
		return finalState;
	}

	function adaptRoomsState(roomsState) {
		var building = {};
		if (roomsState.building) {
			building.checked = true;
			building.value = roomsState.building;
		}
		var within = {};
		if (roomsState.meters && roomsState.withinBuilding) {
			within.checked = true;
			within.meters = roomsState.meters;
			within.building = roomsState.withinBuilding;
		}
		var logic = roomsState.logic;
		var finalState = {
			building: building,
			within: within,
			logic: logic
		};
		return finalState;
	}

	function fireSchedulingQuery(coursesQuery, roomsQuery) {
		var promiseQueue = [];
		var coursesPromise = sendRequest("http://localhost:4321/query", coursesQuery);
		var roomsPromise =sendRequest("http://localhost:4321/roomsQuery", roomsQuery);
		promiseQueue.push(coursesPromise);
		promiseQueue.push(roomsPromise);

		Promise.all(promiseQueue).then(function(results) {
			var schedulingRequest = {
				courses: results[0].result,
				rooms: results[1].result
			};
			return sendRequest("http://localhost:4321/schedulingQuery", schedulingRequest);
		}).then(function(scheduleData) {
			displayCourseData(scheduleData);
			displaySchedule(scheduleData);
		}).catch(function(err) {
			showErrorPopup(JSON.stringify(err));
		});
	}

	function displayCourseData(scheduleData) {
		var table = $("#scheduling_courses_table");
		var courses = scheduleData.courses;
		var columns = getCourseColumns(courses[0]);
		table.bootstrapTable("destroy");
		table.empty();
		table.bootstrapTable({
			columns: columns,
			data: courses
		});

		var qualityLabel = $("#scheduling_quality_label");
		qualityLabel.html("Quality: " + scheduleData.quality.toString());
		qualityLabel.css("display", "inline");
	}

	function getCourseColumns(course) {
		return Object.keys(course).map(function(key) {
			return {
				field: key,
				title: key
			};
		});
	}

	function displaySchedule(scheduleData) {
		var table = $("#scheduling_table");
		var schedule = scheduleData.schedule;
		var columns = getColumns(schedule);
		var data = getDataRows(schedule);
		table.bootstrapTable("destroy");
		table.empty();
		table.bootstrapTable({
			columns: columns,
			data: data
		});
	}

	function getColumns(schedule) {
		var columns = [];
		var timeColumn = createColumn("time_column", "");
		columns.push(timeColumn);
		var bMWF = Object.keys(schedule.MWF).length > 0;
		var bTT = Object.keys(schedule.TT).length > 0;
		for (var i = 1; i <= 5; i++) {
			if ((i % 2 !== 0 && bMWF) || (i % 2 == 0 && bTT)) {
				var id = days[i-1] + "_" + "column";
				columns.push(createColumn(id, days[i-1]));
			}
		}
		return columns;
	}

	function createColumn(id, title) {
		return {
			field: id,
			title: title
		};
	}

	function getDataRows(schedule) {
		var rows = [];
		var scheduleCopy = jQuery.extend(true, {}, schedule);
		getDataRowsHelper("MWF", scheduleCopy);
		getDataRowsHelper("TT", scheduleCopy);
		var allDays = mergeDays(scheduleCopy);
		Object.keys(allDays).forEach(function(time) {
			var row = finalizeRow(time, allDays[time]);
			rows.push(row);
		});
		rows = sortByTime(rows);
		rows = rows.map(function(row) {
			row.time_column = convertTimeToHour(row.time_column);
			return row;
		});
		return rows;
	}

	function sortByTime(rows) {
		return rows.sort(function(a, b) {
			var aTime = parseFloat(a.time_column);
			var bTime = parseFloat(b.time_column);
			if (aTime < bTime) {
				return -1;
			} else if (aTime > bTime) {
				return 1;
			} else {
				return 0;
			}
		});
	}

	function getDataRowsHelper(dateString, scheduleCopy) {
		var schedule = scheduleCopy;
		var dateObj = schedule[dateString];
		Object.keys(dateObj).forEach(function(timeString) {
			var bookings = dateObj[timeString];
			var bookingsList = [];
			Object.keys(bookings).forEach(function(roomString) {
				var currentBooking = bookings[roomString];
				var newBooking = {
					room: roomString,
					course: currentBooking.courseDept.toUpperCase() + " " + currentBooking.courseNum
				};
				bookingsList.push(newBooking);
			});
			var newTimeSlot = {};
			if (dateString === "MWF") {
				newTimeSlot[days[0]] = bookingsList;
				newTimeSlot[days[2]] = bookingsList;
				newTimeSlot[days[4]] = bookingsList;
			} else if (dateString === "TT") {
				newTimeSlot[days[1]] = bookingsList;
				newTimeSlot[days[3]] = bookingsList;
			}
			dateObj[timeString] = newTimeSlot;
		});
		return schedule;
	}

	function mergeDays(schedule) {
		var allDays = {};
		mergeDaysHelper(schedule.MWF, allDays);
		mergeDaysHelper(schedule.TT, allDays);
		return allDays;
	}

	function mergeDaysHelper(dateObj, allDays) {
		Object.keys(dateObj).forEach(function(timeString) {
			var scheduleObj = dateObj[timeString];
			if (!allDays[timeString]) {
				allDays[timeString] = scheduleObj;
			} else {
				var timeObj = allDays[timeString];
				Object.keys(scheduleObj).forEach(function(dayString) {
					if (!timeObj[dayString]) {
						timeObj[dayString] = scheduleObj[dayString];
					}
				});
			}
		});
	}

	function finalizeRow(time, bookings) {
		var row = {};
		row["time_column"] = time;
		Object.keys(bookings).forEach(function(dayString) {
			var column = dayString + "_" + "column";
			row[column] = convertBookingToString(bookings[dayString]);
		});
		return row;
	}

	function convertTimeToHour(timeString) {
		var time = + timeString;
		var hour = Math.floor(time);
		var min = (time - hour) * 60;
		if (min == 0) {
			min = "00";
		}
		return hour + ":" + min;
	}

	function convertBookingToString(bookingArray) {
		var bookingString = "";
		for(var i = 0; i < bookingArray.length; i++) {
			var booking = bookingArray[i];
			if (i == bookingArray.length - 1) {
				bookingString = bookingString + booking.room + ": " + booking.course;
			} else {
				bookingString = bookingString + booking.room + ": " + booking.course + ", ";
			}
		}
		return bookingString;
	}

	function sendRequest(url, request) {
		return new Promise(function(fulfill, reject) {
			$.ajax({
				url: url,
				type: "POST", 
				data: JSON.stringify(request),
				contentType: "application/json",
				dataType: "json",
				success: function(data) {
					fulfill(data);
				},
				error: function(xhr, exception) {
					reject(exception);
				}
			});
		});
	}

	$("#most_failing_checkbox").change(function() {
		var checked = $(this).prop("checked");
		handleAdvancedOptions("most_failing", checked);
	});
	$("#most_passing_checkbox").change(function() {
		var checked = $(this).prop("checked");
		handleAdvancedOptions("most_passing", checked);
	});
	$("#average_grade_checkbox").change(function() {
		var checked = $(this).prop("checked");
		handleAdvancedOptions("average_grade", checked);
	});

	$("#courses_submit_button").on("click", function() {
		var state = getCoursesState();
		var bValidState = validateState(state);
		if (bValidState) {
			var query = constructCoursesQuery(state);
			sendRequest("http://localhost:4321/query", query).then(function(data) {
				if (data.result.length > 0) {
					var table = $("#courses_table");
					if ($.fn.dataTable.isDataTable("#courses_table")) {
						table.DataTable().destroy();
						table.empty();
					}
					generateTable(table, data.result);
				} else {
					showMessage("Your query returned no results");
				}
			}).catch(function(err) {
				showErrorPopup(JSON.stringify(err));
			});
		} else {
			showErrorPopup("Invalid Selections");
		}
	});

	$("#rooms_submit_button").on("click", function() {
		var state = getRoomsState();
		var bValidState = validateState(state);
		if (bValidState) {
			var query = constructRoomsQuery(state);
			sendRequest("http://localhost:4321/roomsQuery", query).then(function(data) {
				if (data.result.length > 0) {
					var table = $("#rooms_table");
					if ($.fn.dataTable.isDataTable("#rooms_table")) {
						table.DataTable().destroy();
						table.empty();
					}
					generateTable(table, data.result);
				} else {
					showMessage("Your query returned no results");
				}
			}).catch(function(err) {
				showErrorPopup(JSON.stringify(err));
			});
		} else {
			showErrorPopup("Invalid Selections")
		}
	});

	$("#schedule_submit_button").on("click", function() {
		var state = getSchedulerState();
		if (state.fireQuery) {
			var coursesState = adaptCoursesState(state.courses);
			var coursesQuery = constructCoursesQuery(coursesState);
			// We need to know the year
			coursesQuery.OPTIONS.COLUMNS.push("courses_year");

			var roomsState = adaptRoomsState(state.rooms);
			var roomsQuery = constructRoomsQuery(roomsState);

			// Would be useful here
			roomsQuery.OPTIONS.COLUMNS.push("rooms_name");

			fireSchedulingQuery(coursesQuery, roomsQuery);
		} else {
			showErrorPopup("Please select filters for courses and rooms");
		}
	});

	//novelty feature
    function getQuery(){
        var yAxis = "";
        var xAxis = {column: "", value: ""};
        var query = {"yAxis": "", "xAxis": {}};

        if ($("#radioPass").prop("checked")) {
            yAxis = "passRate";
        } else if ($("#radioFail").prop("checked")) {
            yAxis = "failRate";
        } else if ($("#radioAvg").prop("checked")) {
            yAxis = "average";
        }
        if ($("#radioDept").prop("checked")) {
            xAxis.column = "courses_dept";
        } else if ($("#radioInstructor").prop("checked")) {
            xAxis.column = "courses_instructor";
        } else if ($("#radioCourse").prop("checked")) {
            xAxis.column = "courses_id";
        }
		xAxis.value = $("#courseKeyInput").val();

        query.yAxis = yAxis;
        query.xAxis = xAxis;
		return query;
    }




	function renderChart(percentage, userSelections) {
        var dataPoint = {
        	label: userSelections,
			y: percentage
		};

        chart.options.data[0].dataPoints.push(dataPoint);
        chart.render();

	}

	function validateChartState() {
    	return ($("#radioPass").prop("checked") ||$("#radioAvg").prop("checked") ||$("#radioFail").prop("checked")) &&
			($("#radioDept").prop("checked") || $("#radioInstructor").prop("checked") || $("#radioCourse").prop("checked"));
    }

    $("#clear_input_to_graph").on("click", function() {
		chart.options.data[0].dataPoints = [];
		chart.render();
	});

    $("#add_input_to_graph").on("click", function() {
        var bValidState = validateChartState();
        if (bValidState) {
            var query = getQuery();
            $.ajax({
                url: "http://localhost:4321/analyze",
                type: "POST",
                data: JSON.stringify(query),
                contentType: "application/json",
                dataType: "json",
                success: function (data) {
                    renderChart(data.finalResult, data.userSelections);
                }
            });
        } else {
        	showErrorPopup("Please select y-axis and x-axis");
		}
	});

});