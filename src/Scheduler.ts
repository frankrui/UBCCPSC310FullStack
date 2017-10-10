
export default class Scheduler {

    private ALLOWEDSTARTTIME: number = 8;
    private ALLOWEDENDTIME: number = 17;
    private MFWDURATION: number = 1;
    private TTDURATION: number = 1.5;

    constructor() {}

    public createSchedule(courses: any[], rooms: any[]) : any {
        var that = this;
        return new Promise(function(fulfill, reject) {
            if (courses && rooms) {
                var adaptedCourses = that.getCoursesToSchedule(courses);
                var schedule = that._createSchedule(adaptedCourses, rooms);
                var quality = that.calculateScheduleQuality(adaptedCourses, schedule);
                var finalResults = {
                    schedule: schedule,
                    quality: quality,
                    courses: adaptedCourses
                };
                fulfill(finalResults);
            } else {
                reject("Error in data provided");
            }
        });
    }

    private getCoursesToSchedule(rawCourses: any[]): any[] {
        var that = this;
        if (rawCourses.length > 0) {
            var finalCourses: any = [];
            var courseGroups = this.groupCourses(rawCourses);
            Object.keys(courseGroups).forEach(function(course: string) {
                var courseGroup: any[] = courseGroups[course];
                var size = that.getCourseSize(courseGroup);
                var sections = that.getNumSections(courseGroup);
                var courseDept = course.split("_")[0];
                var courseNum = course.split("_")[1];
                var adaptedCourse: any = {
                    courseDept: courseDept,
                    courseNum: courseNum,
                    size: size,
                    sections: sections
                };
                if (sections > 0) {
                    finalCourses.push(adaptedCourse);
                }
            });
            return finalCourses;
        } else {
            return [];
        }
    }

    private getCourseSize(courseGroup: any[]): number {
        var max = 0;
        courseGroup.forEach(function(course: any) {
            if (course.courses_size > max && course.courses_year !== 1900) {
                max = course.courses_size;
            }
        });
        return max;
    }

    private getNumSections(courseGroup: any[]): number {
        var filteredCourses = courseGroup.filter(function(course: any) {
            return course.courses_year === 2014;
        });
        var sectionCount = filteredCourses.length;
        return Math.ceil(sectionCount/3);
    }

    private groupCourses(rawCourses: any[]): any {
        var courseGroup: any = {};
        rawCourses.forEach(function(course: any) {
             var courseName = course.courses_dept + "_" + course.courses_id;
             if (!courseGroup[courseName]) {
                 courseGroup[courseName] = [];
             }
             courseGroup[courseName].push(course);
        });
        return courseGroup;
    }

    private calculateScheduleQuality(coursesToSchedule: any[], schedule: any): number {
        var insideOfHours = this.getNumInsideOfHours(schedule);
        var totalSections = this.calculateTotalNumSections(coursesToSchedule);
        return insideOfHours/totalSections;
    }

    private getNumInsideOfHours(schedule: any): number {
        var that = this;
        var runningSum = 0;
        runningSum += this.getNumInsideOfHoursHelper("MWF", schedule);
        runningSum += this.getNumInsideOfHoursHelper("TT", schedule);
        return runningSum;
    }

    private getNumInsideOfHoursHelper(dateString: string, schedule: any): number {
        var that = this;
        var runningSum = 0;
        var dateObj = schedule[dateString];
        Object.keys(dateObj).forEach(function(timeString: string) {
            var time = + timeString;
            if (time >= that.ALLOWEDSTARTTIME && time <= that.ALLOWEDENDTIME) {
                runningSum += Object.keys(dateObj[timeString]).length;
            }
        });
        return runningSum;
    }

    private calculateTotalNumSections(coursesToSchedule: any[]): number {
        var sum = 0;
        coursesToSchedule.forEach(function(course: any) {
            sum += course.sections;
        });
        return sum;
    }

    private _createSchedule(courseList: any[], roomsList: any[]): any {
        var that = this;
        var schedule: any = {
            "MWF": {},
            "TT": {}
        };
        var sortedRooms = roomsList.sort(function(first, second) {
            if (first.rooms_seats < second.rooms_seats) {
                return -1;
            } else if (first.rooms_seats > second.rooms_seats) {
                return 1;
            } else {
                return 0;
            }
        });
        courseList.forEach(function(course: any) {
            that.getTimeSlots(course, sortedRooms, schedule, false);
        });
        // Check unscheduled sections
        var remainingCourses = this.retrieveUnscheduledCourses(courseList, schedule);
        remainingCourses.forEach(function(course: any) {
            that.getTimeSlots(course, sortedRooms, schedule, true);
        });

        return schedule;
    }

    private retrieveUnscheduledCourses(courseList: any[], schedule: any): any[] {
        var that = this;
        var remainingCourses: any[] = [];
        courseList.forEach(function(course: any) {
            if (course.sections > 0) {
                var scheduledCourseTimes = that.getScheduledTimes(course, schedule);
                if (scheduledCourseTimes.length < course.sections) {
                    // clone course obj
                    var newCourse = JSON.parse(JSON.stringify(course));
                    newCourse.sections = course.sections - scheduledCourseTimes.length;
                    remainingCourses.push(newCourse);
                }
            }
        });
        return remainingCourses;
    }

    private getScheduledTimes(course: any, schedule: any): any[] {
        var times: any[] = [];
        this.getScheduledTimesHelper("MWF", course, schedule, times);
        this.getScheduledTimesHelper("TT", course, schedule, times);
        return times;
    }

    private getScheduledTimesHelper(dateString: string, course: any, schedule: any, times: any[]) {
        var dateObj = schedule[dateString];
        Object.keys(dateObj).forEach(function(timeString: string) {
            var timeSlot = dateObj[timeString];
            Object.keys(timeSlot).forEach(function(roomString: string) {
                var roomSlot = timeSlot[roomString];
                if (roomSlot.courseDept === course.courseDept && roomSlot.courseNum === course.courseNum) {
                    var time = {
                        day: dateString,
                        time: + timeString,
                        roomName: roomString
                    };
                    times.push(time);
                }
            });
        });
    }

    private getTimeSlots(course: any, roomsSorted: any[], currentSchedule: any, bAllowOvertime: boolean) {
        for (var i = 0; i < course.sections; i++) {
            var courseSize = course.size;
            var slot;
            for (var j = 0; j < roomsSorted.length; j++) {
                var room = roomsSorted[j];
                if (room.rooms_seats >= courseSize) {
                    var time = this.getTime(course, room, currentSchedule, bAllowOvertime);
                    if (time) {
                        if (!currentSchedule[time.day][time.time]) {
                            currentSchedule[time.day][time.time] = {};
                        }
                        currentSchedule[time.day][time.time][room.rooms_name] = {
                            courseDept: course.courseDept,
                            courseNum: course.courseNum
                        };
                        break;
                    }
                }
            }
        }
    }

    private getTimeHelper(startTime: number, endTime: number, date: string, schedule: any, room: any, course: any): any {
        var dateObj = schedule[date];
        var interval: number = date === "MWF" ? this.MFWDURATION : this.TTDURATION;
        for(var currentTime = startTime; currentTime <= endTime; currentTime += interval) {
            var timeString = currentTime.toString();
            var timeSlot = dateObj[timeString];
            if (timeSlot) {
                var bRoomBooked = this.isRoomBooked(room, timeSlot);
                var bExistsConcurrentSection = this.existsConcurrentSection(course, timeSlot);
                if (!bRoomBooked && !bExistsConcurrentSection) {
                    return {
                        day: date,
                        time: currentTime.toString()
                    };
                }
            } else {
                return {
                    day: date,
                    time: currentTime.toString()
                };
            }
        }
    }

    private getTime(course: any, room: any, currentSchedule: any, bAllowOvertime: boolean): any {
        var that = this;
        var time;
        var MWF = currentSchedule.MWF;
        var TT = currentSchedule.TT;
        var startTime = this.ALLOWEDSTARTTIME;
        var endTime = this.ALLOWEDENDTIME;

        if (bAllowOvertime) {
            startTime = 1;
            endTime = 24;
        }

        time = this.getTimeHelper(startTime, endTime, "MWF", currentSchedule, room, course);

        if (time) {
            return time;
        }

        if (bAllowOvertime) {
            startTime = 0.5;
            endTime = 23;
        }

        time = this.getTimeHelper(startTime, endTime, "TT", currentSchedule, room, course)

        return time;
    }

    private isRoomBooked(room: any, timeSlot: any) : boolean {
        return timeSlot[room.rooms_name] ? true : false;
    }

    private existsConcurrentSection(course: any, timeSlot: any): boolean {
        var exists: boolean = false;
        for (var i = 0; i < Object.keys(timeSlot).length; i++) {
            var roomString = Object.keys(timeSlot)[i];
            var roomSchedule = timeSlot[roomString];
            if (roomSchedule.courseDept == course.courseDept && roomSchedule.courseNum == course.courseNum) {
                exists = true;
                break;
            }
        }
        return exists;
    }
}