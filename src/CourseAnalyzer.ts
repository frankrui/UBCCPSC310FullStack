
import InsightFacade from "./controller/InsightFacade";
import {InsightResponse} from "./controller/IInsightFacade";
import MathUtil from "./MathUtil"
import Constants from "./Constants";
import CoursesConstants from "./CoursesConstants";

export default class CourseAnalyzer{

    private insightFacade: InsightFacade = new InsightFacade();
    private coursesConstant: CoursesConstants = new CoursesConstants();

    constructor(){}

    public analyze(query: any): Promise<InsightResponse>{
        var that = this;
        return new Promise(function (fulfill, reject) {
            var queryToPerform = that.constructFilterQuery(query.xAxis);
            that.insightFacade.performQuery(queryToPerform).then(function (resp: InsightResponse){
               var finalResult;
               var results: any[] = resp.body.result;
               var yAxis: string = query.yAxis;
               if(yAxis == "passRate"){
                   finalResult = that.calculatePassRate(results);
               } else if (yAxis == "failRate"){
                   finalResult = that.calculateFailRate(results);
               } else if(yAxis == "average"){
                   finalResult = that.calculateAverage(results);
               }
               var columnName = query.xAxis.column.split("_")[1];
               if (typeof finalResult !== "undefined") {
                   var resp: InsightResponse = {
                       code: 200,
                       body: {
                           finalResult: finalResult,
                           userSelections: query.yAxis + " - " + columnName + ":" + query.xAxis.value
                       }
                   };
                   fulfill(resp);
               } else {
                   var response: InsightResponse = {
                       code: 400,
                       body: {
                           error:  "y-axis not recognized"
                       }
                   };
                   reject(response);
               }
            }).catch(function(resp: any){
                reject({
                    code: 400,
                    body: {
                        message : resp
                    }
                });
            });
        });
    }

    private constructFilterQuery(xAxis: any): any{
        var query: any = {
            WHERE:{},
            OPTIONS:{
                COLUMNS:["courses_pass", "courses_fail", "courses_size", "courses_avg"],
                FORM: "TABLE"
            }
        };
        var field = xAxis.column.split("_")[1];
        var type = this.coursesConstant.getFieldType(field);
        if (type === "string"){
            var is: any = {};
            is[xAxis.column] = xAxis.value;
            query.WHERE["IS"]= is;
        }

        return query;
    }

    private calculateAverage(results: any[]): number{
        var allAvg = results.map(function(course: any){
            return course.courses_avg;
        });
        var finalAvg = 0;
        if (allAvg.length > 0) {
            finalAvg = MathUtil.calculateAvg(allAvg);
        }
        return finalAvg;
    }

    private calculatePassRate(results: any[]): number{
        var allPassRate = results.map(function(course: any){
            return course.courses_pass/course.courses_size;
        });
        var finalPassRate = 0;
        if (allPassRate.length > 0) {
            finalPassRate = MathUtil.calculateAvg(allPassRate);
        }
        return finalPassRate*100;
    }

    private calculateFailRate(results: any[]): number{
        var allFailRate = results.map(function(course: any){
            return course.courses_fail/course.courses_size;
        });
        var finalFailRate = 0;
        if (allFailRate.length > 0) {
            finalFailRate = MathUtil.calculateAvg(allFailRate);
        }
        return finalFailRate*100;
    }
}