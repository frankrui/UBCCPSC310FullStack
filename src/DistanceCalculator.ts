import InsightFacade from "../src/controller/InsightFacade";
import {InsightResponse} from "../src/controller/IInsightFacade";
import MathUtil from "../src/MathUtil";

export default class DistanceCalculator {

    private insightFacade = new InsightFacade();

    constructor() {}

    public handleDistanceWithin(query: any): Promise<InsightResponse> {
        var that = this;
        return new Promise(function(fulfill, reject) {
            var within = query.WITHIN;
            var meters = + within.meters;
            if (!isNaN(meters) && isNaN(within.building)) {
                if (within.logic == "" || within.logic == "AND") {
                    that.handleWithinAnd(query, within, meters).then(function(result: InsightResponse) {
                        fulfill(result);
                    }).catch(function(err: any) {
                        reject(err);
                    });
                } else if (within.logic == "OR") {
                    that.handleWithinOr(query, within, meters).then(function(result: InsightResponse) {
                        fulfill(result);
                    }).catch(function(err: InsightResponse) {
                        reject(err);
                    })
                }
            } else {
                reject({
                    code: 400,
                    body: {
                        error: "Invalid meters or building"
                    }
                });
            }
        });
    }

    private handleWithinAnd(query: any, within: any, meters: number): Promise<InsightResponse> {
        var that = this;
        return new Promise(function(fulfill, reject) {
            var adaptedQuery = {
                WHERE: query.WHERE,
                OPTIONS: query.OPTIONS
            };
            var buildingQuery: any = {
                WHERE: {
                    "IS": {
                        "rooms_shortname": within.building
                    }
                },
                OPTIONS: {
                    COLUMNS: ["rooms_lat", "rooms_lon"],
                    FORM: "TABLE"
                }
            };
            that.insightFacade.performQuery(buildingQuery).then(function(resp: InsightResponse) {
                if (resp.body.result.length > 0) {
                    var latlon: any = {
                        lat: resp.body.result[0].rooms_lat,
                        lon: resp.body.result[0].rooms_lon
                    };
                    that.insightFacade.performQuery(adaptedQuery).then(function(resp: InsightResponse) {
                        resp.body.result = that.filterWithinDistance(latlon.lat, latlon.lon, resp.body.result, meters);
                        fulfill(resp);
                    }).catch (function(err: InsightResponse) {
                        reject(err);
                    });
                } else {
                    reject({
                        code: 400,
                        body: {
                            error: "Invalid building"
                        }
                    });
                }
            }).catch(function(err: InsightResponse) {
                reject(err);
            });
        });
    }

    private handleWithinOr(query: any, within: any, meters: number): Promise<InsightResponse> {
        var that = this;
        return new Promise(function(fulfill, reject) {
            var adaptedQuery = {
                WHERE: query.WHERE,
                OPTIONS: query.OPTIONS
            };
            var buildingQuery: any = {
                WHERE: {
                    "IS": {
                        "rooms_shortname": within.building
                    }
                },
                OPTIONS: {
                    COLUMNS: ["rooms_lat", "rooms_lon"],
                    FORM: "TABLE"
                }
            };
            that.insightFacade.performQuery(buildingQuery).then(function(withinBuilding: InsightResponse) {
                if (withinBuilding.body.result.length > 0) {
                    var buildingLatLon: any = {
                        lat: withinBuilding.body.result[0].rooms_lat,
                        lon: withinBuilding.body.result[0].rooms_lon
                    };
                    that.insightFacade.performQuery(adaptedQuery).then(function(roomQuery: InsightResponse) {
                         var queryAll: any = {
                            WHERE: {},
                            OPTIONS: {
                                COLUMNS: ["rooms_shortname", "rooms_number", "rooms_furniture", "rooms_type", "rooms_seats", "rooms_lat", "rooms_lon", "rooms_name"],
                                FORM: "TABLE"
                            }
                         };
                         that.insightFacade.performQuery(queryAll).then(function(allBuildings: InsightResponse) {
                             var buildingsWithin: any[] = that.filterWithinDistance(buildingLatLon.lat, buildingLatLon.lon, allBuildings.body.result, meters);
                             var mergedResult = that.mergeResults(buildingsWithin, roomQuery.body.result);
                             allBuildings.body.result = mergedResult;
                             fulfill(allBuildings);
                         });
                    }).catch (function(err: InsightResponse) {
                        reject(err);
                    });
                } else {
                    reject({
                        code: 400,
                        body: {
                            error: "Invalid building"
                        }
                    });
                }
            }).catch(function(err: InsightResponse) {
                reject(err);
            });
        });
    }

    private mergeResults(buildingsWithinDist: any[], roomsQueryResults: any[]): any[] {
        // Use hashmap to remove dupes and merge
        var hashMap: any = {};
        roomsQueryResults.forEach(function(room: any) {
            if (!hashMap[room.rooms_name]) {
                hashMap[room.rooms_name] = room;
            }
        });
        buildingsWithinDist.forEach(function(room: any) {
            if (!hashMap[room.rooms_name]) {
                hashMap[room.rooms_name] = room;
            }
        });
        // convert hash back into array
        return Object.keys(hashMap).map(function(roomName: string) {
            return hashMap[roomName];
        });
    }

    private filterWithinDistance(lat1: number, lon1: number, data: any[], meters: number) : any[] {
        return data.filter(function (row: any) {
            var distance = MathUtil.getDistanceFromLatLonInKm(lat1, lon1, row.rooms_lat, row.rooms_lon);
            var distMeters = distance * 1000;
            return distMeters < meters;
        });
    }
}