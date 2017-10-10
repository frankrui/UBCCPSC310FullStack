/**
 * Created by Louis on 2/28/17.
 */

import InsightFacade from "../controller/InsightFacade";
import Scheduler from "../Scheduler";
import {InsightResponse} from "../controller/IInsightFacade";
import {QueryRequest} from "../controller/IInsightFacade";
import CourseAnalyzer from "../CourseAnalyzer";
import FileManager from "../FileManager";
import DistanceCalculator from "../DistanceCalculator";

import restify = require('restify');

var insightFacade: InsightFacade = new InsightFacade();
var coursesPath = "../dataset/courses.zip";
var roomsPath = "../dataset/rooms.zip";

export default class Rest {

    public static handleScheduling(req: restify.Request, res: restify.Response, next: restify.Next) {
        var query = req.body;
        var scheduler: Scheduler = new Scheduler();
        scheduler.createSchedule(query.courses, query.rooms).then(function(result: any) {
            res.json(200, result);
            return next();
        }).catch(function(err: any) {
            res.json(400, err);
            return next();
        });
    }

    public static handleAddDatasets(req: restify.Request, res: restify.Response, next: restify.Next) {
        if (!FileManager.fileExists("./cache/courses.txt") || !FileManager.fileExists("./cache/rooms.txt")) {
            var courses = FileManager.convertZipToBase64Sync(coursesPath);
            var rooms = FileManager.convertZipToBase64Sync(roomsPath);
            insightFacade.addDataset("courses", courses).then(function(resp: InsightResponse) {
                return insightFacade.addDataset("rooms", rooms);
            }).then(function(resp: InsightResponse) {
                res.json(200, resp.body);
                return next();
            }).catch(function(err: any) {
                res.json(err.code, err.body);
                return next();
            })
        } else {
            res.json(200, {});
            return next();
        }
    }

    public static handlePut(req: restify.Request, res: restify.Response, next: restify.Next) {
        var content: string = req.params.body;
        var base64: string = FileManager.toBase64(content);
        var id: string = req.params.id;
        Rest.performPut(id, base64).then(function (resp: InsightResponse) {
           res.json(resp.code, resp.body);
            return next();
        }).catch(function (ErrResp: InsightResponse) {
            res.json(ErrResp.code, ErrResp.body)
            return next();
        });
    }

    public static performPut(id: string, content: string): Promise<InsightResponse> {
        return new Promise(function(fulfill, reject){
            insightFacade.addDataset(id, content).then(function(resp: InsightResponse) {
                fulfill(resp);
            }).catch(function (ErrResp: InsightResponse) {
                reject(ErrResp);
            })
        });
    }

    public static handleDel(req: restify.Request, res: restify.Response, next: restify.Next) {
        var id: string = req.params.id;
        Rest.performDel(id).then(function (resp: InsightResponse) {
            res.json(resp.code, resp.body);
            return next();
        }).catch(function (ErrResp: InsightResponse) {
            res.json(ErrResp.code, ErrResp.body);
            return next();
        });
    }

    public static performDel(id: string): Promise<InsightResponse> {
        return new Promise(function(fulfill, reject){
            insightFacade.removeDataset(id).then(function(resp: InsightResponse) {
                fulfill(resp);
            }).catch(function (ErrResp: InsightResponse) {
                reject(ErrResp);
            });
        });
    }

    public static handleRoomsPost(req: restify.Request, res: restify.Response, next: restify.Next) {
        var query = req.body;
        var distanceCalc = new DistanceCalculator();
        if (query.WITHIN) {
            distanceCalc.handleDistanceWithin(query).then(function (resp: InsightResponse) {
                res.json(resp.code, resp.body);
                return next();
            }).catch(function(ErrResp: InsightResponse){
                res.json(ErrResp.code, ErrResp.body);
                return next();
            });
        } else {
            Rest.performPost(query).then(function (resp: InsightResponse) {
                res.json(resp.code, resp.body);
                return next();
            }).catch(function(ErrResp: InsightResponse){
                res.json(ErrResp.code, ErrResp.body);
                return next();
            });
        }
    }

    public static handlePost(req: restify.Request, res: restify.Response, next: restify.Next) {
        var query = req.body;
        Rest.performPost(query).then(function (resp: InsightResponse) {
            res.json(resp.code, resp.body);
            return next();
        }).catch(function(ErrResp: InsightResponse){
            res.json(ErrResp.code, ErrResp.body);
            return next();
        });
    }

    public static performPost(query: QueryRequest): Promise<InsightResponse> {
        return new Promise(function(fulfill, reject){
            insightFacade.performQuery(query).then(function(resp: InsightResponse) {
                fulfill(resp);
            }).catch(function(ErrResp: InsightResponse){
                reject(ErrResp);
            })
        });
    }

    public static handlePostAnalyze(req: restify.Request, res: restify.Response, next: restify.Next) {
        var query = req.body;
        var courseAnalyzer: CourseAnalyzer = new CourseAnalyzer();
        courseAnalyzer.analyze(query).then(function(resp: InsightResponse) {
            res.json(resp.code, resp.body);
            return next();
        }).catch(function(ErrResp: InsightResponse){
            res.json(ErrResp.code, ErrResp.body);
            return next();
        });
    }
}