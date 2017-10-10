/**
 * This is the main programmatic entry point for the project.
 */
import {IInsightFacade, InsightResponse, QueryRequest} from "./IInsightFacade";
import FileManager from "../FileManager";
import CacheManager from "../CacheManager";
import DatasetParser from "../DatasetParser";
import QueryEngine from "../QueryEngine";

var jszip = require("jszip");
var queryEngine = new QueryEngine();
import Log from "../Util";
import DatasetConstants from "../DatasetConstants";

export default class InsightFacade implements IInsightFacade {

    constructor() {
        Log.trace('InsightFacadeImpl::init()');
    }

    generateInsightResponse(code: number, message: string) {
        var is: InsightResponse = {
            "code": code,
            "body": {}
        };
        if (message) {
            is.body.error = message;
        }
        return is;
    }


    /**
     * 1. Check if given dataset already exists
     * 2. If doesn't exist, convert content to string data and store into newly created file
     * 3. Record file name and datasetId in cache manager
     * 4. Return InsightResponse
     * @param id: the id of the dataset to add
     * @param content: the content of the dataset in 64bit encoding
     * @returns {Promise<InsightResponse>}
     */
    addDataset(id: string, content: string): Promise<InsightResponse> {
        var that = this;
        return new Promise(function(fulfill, reject) {
            if (!id || (id !== "courses" && id !== "rooms")) {
                reject(that.generateInsightResponse(400, "Bad datasetId"));
                return;
            }

            var decodedZip = Buffer.from(content, 'base64');

            jszip.loadAsync(decodedZip).then(function (zip: any) {

                var promises: any = [];

                if (Object.keys(zip.files).length == 0) {
                    var response: InsightResponse = that.generateInsightResponse(400, "No data in zip");
                    reject(response);
                    return;
                }

                var htmlIndex = Object.keys(zip.files).indexOf("index.htm");
                Object.keys(zip.files).forEach(function (key: any) {
                    promises.push(zip.files[key].async('string'));
                });

                Promise.all(promises).then(function (result: any) {
                    var parser = new DatasetParser();
                    var resultDataset:any = {
                        "datasetId": id,
                        "data": []
                    };
                    if ((htmlIndex !== -1 && id !== "rooms") || (htmlIndex == -1 && id !== "courses")) {
                        var resp: InsightResponse = that.generateInsightResponse(400, "cannot add this dataset");
                        reject(resp);
                        return;
                    } else if (htmlIndex !== -1 && id == "rooms") {
                        // Parse index.htm and return buildings
                        var buildings: any[] = parser.parseIndex(result[htmlIndex]);
                        var parsePromises: any[] = [];
                        buildings.forEach(function(building: any) {
                            Object.keys(zip.files).forEach(function(file, index) {
                                if (building.href.endsWith(file)) {
                                    parsePromises.push(parser.parseHTML(id, building.building, result[index]));
                                }
                            });
                        });
                        Promise.all(parsePromises).then(function(parseResults) {
                            parseResults.forEach(function(parseResult) {
                                parseResult.forEach(function(result: any) {
                                    resultDataset.data.push(result);
                                });
                            });
                            var response = that.cacheResults(id, resultDataset);
                            fulfill(response);
                        }).catch(function(err: any) {
                            var response: InsightResponse = that.generateInsightResponse(400, err.message);
                            reject(response);
                        });
                    } else {
                        resultDataset = parser.parse(id, result);
                        var response = that.cacheResults(id, resultDataset);
                        fulfill(response);
                    }
                }).catch (function(err: any) {
                    var response: InsightResponse = that.generateInsightResponse(400, err.message);
                    reject(response);
                });
            }).catch(function (err: any) {
                var response: InsightResponse = that.generateInsightResponse(400, err.message);
                reject(response);
            });
        });
    }

    cacheResults(id: string, dataset: any): any {
        var stringDataset = JSON.stringify(dataset);
        var path = "./cache/" + id + ".txt";
        var bExists = CacheManager.checkDatasetAdded(id);
        FileManager.writeTextFileSync(path, stringDataset);
        var response: InsightResponse = {
            "code": 204,
            "body": {}
        };
        if (bExists) {
            response.code = 201;
        }
        return response;
    }

    /**
     * Removes the given dataset with id param
     * 1. Check if datasetId exists in cache, if not return error 404
     * 2. if exists, remove the id from the cache and remove the file itself from the cache directory.
     * 3. return Insight response
     * @param id
     * @returns {Promise<T>}
     */
    removeDataset(id: string): Promise<InsightResponse> {
        var that = this;
        return new Promise(function (fulfill, reject){
            if (id && CacheManager.checkDatasetAdded(id)) {
                var path = "./cache/" + id + ".txt";
                FileManager.deleteFile(path);
                var response: InsightResponse = that.generateInsightResponse(204, null);
                fulfill(response);
            } else {
                var response: InsightResponse = that.generateInsightResponse(404, "The datasetId does not exist");
                reject(response);
            }
        });
    }

    /**
     *  Given a valid query, returns rows of data results
     *
     *  1. Check if the dataset in question has been added yet. If not, return error 424
     *  2. If dataset is added, check validity of query structure. If not valid, return error 400
     *  3. If dataset is added and query is valid, call helper in QueryEngine to return result set
     * @param query
     * @returns Promise<InsightResponse>
     */
    performQuery(query: QueryRequest): Promise <InsightResponse> {
        var that = this;
        return new Promise(function (fulfill, reject){
            try {
                var datasetId = queryEngine.getDatasetId(query);
                if (datasetId) {
                    if (!CacheManager.checkDatasetAdded(datasetId)) {
                        var response: InsightResponse = {
                            code: 424,
                            body: {
                                "missing": [datasetId]
                            }
                        };
                        reject(response);
                    }
                } else {
                    var error = that.generateInsightResponse(400, "Cannot detect datasetId");
                    reject(error);
                }
                queryEngine.setDatasetId(datasetId);
                queryEngine.setConstants(DatasetConstants.getConstants(datasetId));
                if(queryEngine.isValid(query)){
                    var resultRows = queryEngine.queryDataset(query);
                    var response: InsightResponse = that.generateInsightResponse(200, null);
                    response.body = {
                        "render": query.OPTIONS.FORM,
                        "result": resultRows
                    };
                    fulfill(response);
                } else {
                    reject(that.generateInsightResponse(400, "Invalid Query"));
                }
            } catch(err){
                var response: InsightResponse;
                if (err.message == "Dataset missing") {
                    response = {
                        code: 424,
                        body: {
                            missing: [err.id]
                        }
                    };
                } else {
                    response = that.generateInsightResponse(400, err.message);
                }
                reject(response);
            }
        });
    }
}
