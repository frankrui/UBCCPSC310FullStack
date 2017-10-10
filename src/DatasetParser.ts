/**
 * Util to parse the correct/relevant information for caching.
 *
 */
/* tslint:disable:no-console */
import CoursesConstants from "./CoursesConstants";
import HttpRequest from "./HttpRequest";
var parse5 = require("parse5");
var queryString = require("querystring");

export interface IDatasetCache {
    "datasetId": string,
    "data": any[]
};

export default class DatasetParser{

    private httpRequest: any;

    constructor() {
        this.httpRequest = new HttpRequest();
    }

    public parse(datasetId: string, zipResults: any): any {
        var resultDataset: IDatasetCache = {
            "datasetId": datasetId,
            "data": []
        };

        resultDataset.data = this.parseJSON(datasetId, zipResults);

        return resultDataset;
    }

    private parseJSON(datasetId: string, zipResults: any): any[] {
        var that = this;
        var results: any[] = [];
        zipResults.forEach(function (row: any) {
            if (row) {
                var datasetContent: any = JSON.parse(row);
                var datasetObjects = that.parseColumns(datasetId, datasetContent);
                datasetObjects.forEach(function (dataObj: any) {
                    results.push(dataObj);
                });
            }
        });
        return results;
    }
    /**
     * Goes through the course data and extracts the information that we need to cache.
     * @param id
     * @param name
     * @param rawData
     * @returns any[]
     */
    public parseColumns(id: string, rawData: any): any[] {
        var constants = new CoursesConstants();
        var datasetObjects: any[] = [];
        if (rawData && rawData.result && rawData.result.length > 0) {
            rawData.result.forEach(function(resultObject: any) {
                var datasetObject: any = {};
                var courseKeys = constants.getValidFields();
                courseKeys.forEach(function(key) {
                    var rawColumn = constants.getRawColumn(key);
                    var fieldType = constants.getFieldType(key);
                    // Special case for Year field
                    if (key === "year" && resultObject.Section === "overall") {
                        datasetObject[id + "_" + key] = 1900;
                    } else if (key === "size") {
                        datasetObject[id + "_" + key] = resultObject[rawColumn[0]] + resultObject[rawColumn[1]];
                    } else if (fieldType === "string") {
                        datasetObject[id + "_" + key] = resultObject[rawColumn].toString();
                    } else if (fieldType === "number") {
                        datasetObject[id + "_" + key] = parseFloat(resultObject[rawColumn]);
                    } else {
                        datasetObject[id + "_" + key] = resultObject[rawColumn];
                    }
                });
                datasetObjects.push(datasetObject);
            });
        } else if (!rawData.result && rawData.rank === undefined) {
            throw {
                message: "Error: Empty dataset"
            };
        }
        return datasetObjects;
    }

    private constructRows(id: string, data: any, document: any) : any[] {
        var that = this;
        var finalResults: any[] = [];
        var viewFooter = this.getElementByAttr("class", "view-footer", document);
        var view = this.getChild(2, viewFooter);
        var viewContent = this.getElementByAttr("class", "view-content", view);
        var table = this.getChildTags("table", viewContent);
        var tbody = this.getChildTags("tbody", table[0]);
        var trs = this.getChildTags("tr", tbody[0]);
        trs.forEach(function(tr: any) {
            var row: any = {};
            row[id + "_fullname"] = data.fullName;
            row[id + "_shortname"] = data.shortName;
            row[id + "_address"] = data.address;
            row[id + "_lat"] = data.lat;
            row[id + "_lon"] = data.lon;
            var roomNumberObject = that.getElementByAttr("class", "views-field views-field-field-room-number", tr);
            var hrefObject = that.getChildTags("a", roomNumberObject);
            if (hrefObject[0].attrs[0].name == "href") {
                row[id + "_href"] = hrefObject[0].attrs[0].value;
            }
            var number = that.getChild(1, hrefObject[0]).value;
            row[id + "_number"] = number;
            var roomCapacity = that.getElementByAttr("class", "views-field views-field-field-room-capacity", tr);
            var roomCapacityObject = that.getChild(1, roomCapacity);
            var seats = roomCapacityObject.value.split("\n")[1].trim();
            row[id + "_seats"] = parseInt(seats);
            var roomFurniture = that.getElementByAttr("class", "views-field views-field-field-room-furniture", tr);
            var roomFurnitureObject = that.getChild(1, roomFurniture);
            var furniture = roomFurnitureObject.value.split("\n")[1].trim();
            row[id + "_furniture"] = queryString.unescape(furniture);
            var roomType = that.getElementByAttr("class", "views-field views-field-field-room-type", tr);
            var roomTypeObject = that.getChild(1, roomType);
            var type = roomTypeObject.value.split("\n")[1].trim();
            row[id + "_type"] = type;
            row[id + "_name"] = data.shortName + "_" + number;
            finalResults.push(row);
        });
        return finalResults;
    }

    public parseHTML(id: string, buildingShortName: string, zipBuilding: any): Promise<any[]> {
        var that = this;
        return new Promise(function(fulfill, reject) {
            var results: any[] = [];
            var fullName: string = "";
            var address: string = "";
            var lat: number;
            var lon: number;

            try {
                var document = parse5.parse(zipBuilding);
                var viewFooter = that.getElementByAttr("class", "view-footer", document);
                var view = that.getChild(2, viewFooter);
                if (view.childNodes.length > 1) {
                    var buildingInfo = that.getElementByAttr("id", "building-info", document);
                    var h2 = that.getChildTags("h2", buildingInfo);
                    var span = that.getChildTags("span", h2[0]);
                    var fullNameObject = that.getChild(1, span[0]);
                    fullName = fullNameObject.value;
                    var buildingField = that.getElementByAttr("class", "building-field", buildingInfo);
                    var addressObject = that.getChild(1, buildingField);
                    address = that.getChild(1, addressObject).value;
                    that.httpRequest.sendGet(address).then(function (latLon: any) {
                        lat = latLon.lat;
                        lon = latLon.lon;
                        var data = {
                            shortName: buildingShortName,
                            fullName: fullName,
                            address: address,
                            lat: lat,
                            lon: lon,
                        };
                        results = that.constructRows(id, data, document);
                        fulfill(results);
                    }).catch(function(err: any) {
                        reject(err);
                    });
                } else {
                    fulfill(results);
                }
            } catch (err) {
                reject(err);
            }
        });
    }

    public getChild(child: number, document: any) {
        if(document && document.childNodes && document.childNodes.length > 0 && child > 0) {
            return document.childNodes[child - 1];
        }
        return null;
    }

    /**
     * Use DFS to traverse the document object and find the first occurence of matching attr. Typically used with id and class
     * @param id
     * @param document
     */
    public getElementByAttr(name: string, value: string, document: any) : any {
        var stack: any[] = [];
        stack.push(document);
        var currentNode: any;
        while(stack.length !== 0) {
            currentNode = stack.pop();
            if(currentNode.attrs) {
                var bFound = currentNode.attrs.some(function(attr: any) {
                    if (attr.name && attr.value && attr.name == name && attr.value == value) {
                        return true;
                    } else {
                        return false;
                    }
                });
                if (bFound) {
                    break;
                }
            }
            if(currentNode.childNodes && currentNode.childNodes.length > 0) {
                for (var i = currentNode.childNodes.length - 1; i >= 0; i--) {
                    stack.push(currentNode.childNodes[i]);
                }
            }
        }
        return currentNode;
    }

    private getChildTags(tagName: string, document: any) : any[] {
        var results: any[] = [];
        if (document && document.childNodes && document.childNodes.length > 0) {
            document.childNodes.forEach(function(child: any) {
                if (child.tagName == tagName) {
                    results.push(child);
                }
            });
        }
        return results;
    }

    /**
     * For parsing index.htm in rooms
     * @param result2
     * @returns {null}
     */
    public parseIndex(result2: any): any[] {
        var that = this;
        var document: any =parse5.parse(result2);
        var shortNames: any[] = [];
        var content: any = this.getElementByAttr("class","view-content", document);
        var table = this.getChildTags("table", content);
        if (table.length != 1) {
            throw new Error("Bad html");
        }
        var tbody = this.getChildTags("tbody", table[0]);
        if (tbody.length != 1) {
            throw new Error("Bad html");
        }
        var trs = this.getChildTags("tr", tbody[0]);

        trs.forEach(function(tr: any) {
            var td = that.getElementByAttr("class", "views-field views-field-field-building-code", tr);
            var textObject = that.getChild(1, td);
            var value = textObject.value;
            var shortName = value.split("\n")[1].trim();
            var href = that.getElementByAttr("class", "views-field views-field-title", tr);
            var hrefObject = that.getChild(2, href);
            var buildingHref;
            hrefObject.attrs.forEach(function(attr:any) {
                if (attr.name == "href") {
                    buildingHref = attr.value;
                }
            });
            var resultObject = {
                building: shortName,
                href: buildingHref
            };
            shortNames.push(resultObject);
        });
        return shortNames;
    }
};