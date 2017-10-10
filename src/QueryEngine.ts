/**
 * Collection of methods to handle the query request coming from the front-end.
 *
 */
/* tslint:disable:no-console */
import FileManager from "./FileManager";
import CacheManager from "./CacheManager";
import Constants from "./Constants";
import MathUtil from "./MathUtil";

var queryString = require("querystring");

export default class QueryEngine {

    dataset: any;
    datasetId: string;
    constants: Constants;

    constructor() {
        this.dataset = null;
    }

    public setConstants(constants: Constants) {
        this.constants = constants;
    }

    public setDataset(dataset: any) {
        this.dataset = dataset;
    }

    public setDatasetId(id: string) {
        this.datasetId = id;
    }

    public queryDataset(query: any) : any[] {
        var that = this;
        var augmentedQueryObject: any;
        var queryResult: any = {};
        var queryRecords: any[] = [];
        if (this.datasetId) {
            this.dataset = this.retrieveDatasetData(this.datasetId);
        }

        if (query.WHERE) {
            if (Object.keys(query.WHERE).length == 0) {
                queryResult = this.dataset;
            } else {
                augmentedQueryObject = this.augmentQuery(query.WHERE);
                queryResult = this._queryDataset(augmentedQueryObject);
            }
        }

        if (query.TRANSFORMATIONS) {
            queryRecords = this.performAggregations(query.TRANSFORMATIONS, queryResult);
        } else {
            // Push result rows into an array for sorting and column selection
            Object.keys(queryResult).forEach(function (uuid: string) {
                queryRecords.push(queryResult[uuid]);
            });
        }

        if (query.OPTIONS && query.OPTIONS.ORDER) {
            queryRecords = this.orderBy(queryRecords, query.OPTIONS);
        }
        if (query.OPTIONS && query.OPTIONS.COLUMNS && query.OPTIONS.COLUMNS.length > 0) {
            queryRecords = this.extractColumns(queryRecords, query.OPTIONS);
        }
        return queryRecords;
    }

    public orderBy(resultSet: any[], options: any): any[] {
        var order = options.ORDER;
        if (typeof order === "string") {
            return resultSet.sort(function (first, second) {
                if (first[order] < second[order]) {
                    return -1;
                } else if (first[order] > second[order]) {
                    return 1;
                } else {
                    return 0;
                }
            });
        } else {
            var dir = order.dir;
            var keys = order.keys;
            var ascending: boolean = dir === "UP";
            return this.multiSort(resultSet, keys, ascending);
        }
    }

    private multiSort(resultSet: any[], orderKeys: string[], ascending: boolean) : any[] {
        var that = this;
        return resultSet.sort(function(first, second) {
            var sortKey = that.getSortKey(first, second, orderKeys);
            if (first[sortKey] < second[sortKey]) {
                if (ascending) {
                    return -1;
                } else {
                    return 1;
                }
            } else if (first[sortKey] > second[sortKey]) {
                if (ascending) {
                    return 1;
                } else {
                    return -1;
                }
            } else {
                return 0;
            }
        });
    }

    private getSortKey(first: any, second: any, orderKeys: string[]) : string {
        for (var i = 0; i < orderKeys.length; i++) {
            var orderKey: string = orderKeys[i];
            if (i === orderKeys.length - 1) {
                return orderKey;
            } else if (first[orderKey] !== second[orderKey]) {
                return orderKey;
            }
        }
    }

    private extractColumns(resultSet: any[], options: any): any[] {
        var columnsToGet = options.COLUMNS;
        var input = resultSet;
        var mappedResult = input.map(function(row) {
            var mappedRow:any = {};
            columnsToGet.forEach(function(column: string) {
                mappedRow[column] = row[column];
            });
            return mappedRow;
        });
        return mappedResult;
    }

    // Group by first followed by applying aggregations. Finally rearrange the records and its columns.
    private performAggregations(transformations: any, queryResults: any) : any[] {
        var finalResult: any[] = [];
        var groupByResult: any = this.groupRows(transformations.GROUP, queryResults);
        finalResult = this.applyAggregations(transformations, groupByResult);
        return finalResult;
    }

    // Use hash map of groups and then nest hash map of rows inside
    private groupRows(group: string[], queryResults: any): any {
        var that = this;
        var groupHash: any = {};
        Object.keys(queryResults).forEach(function(id: string) {
            var row = queryResults[id];
            var hashString: string = queryString.escape(row[group[0]]);
            for (var i = 1; i < group.length; i++) {
                hashString = hashString + "_" + queryString.escape(row[group[i]]);
            }
            if (groupHash[hashString]) {
                groupHash[hashString][row[that.datasetId + "_" + that.constants.getIdentifier()]] = row;
            } else {
                var newHashMap: any = {};
                newHashMap[row[that.datasetId + "_" + that.constants.getIdentifier()]] = row;
                groupHash[hashString] = newHashMap;
            }
        });
        return groupHash;
    }

    private applyAggregations(transformations: any, groupByResults: any) : any[] {
        var that = this;
        var apply: any[] = transformations.APPLY;
        var group: any[] = transformations.GROUP;
        var applyResults: any[] = [];
        Object.keys(groupByResults).forEach(function(groupKey: string) {
            var rowObject: any = {};
            var groupObjects = groupByResults[groupKey];

            // Insert group by rows into row object
            group.forEach(function(key: string) {
                rowObject[key] = groupObjects[Object.keys(groupObjects)[0]][key];
            });

            // Insert aggregation results into row object
            apply.forEach(function(applyObject: any) {
                var applyKey: string = Object.keys(applyObject)[0];
                var applyKeyObject = applyObject[applyKey];
                var aggregation: string = Object.keys(applyKeyObject)[0];
                var column: string = applyKeyObject[aggregation];
                rowObject[applyKey] = that.applyAggregation(aggregation, column, groupObjects);
            });

            applyResults.push(rowObject);
        });
        return applyResults;
    }

    private applyAggregation(aggregation: string, column: string, groupObjects: any): number {
        var dataToAggregate = Object.keys(groupObjects).map(function(id: string) {
            return groupObjects[id][column];
        });
        switch(aggregation) {
            case "MAX":
                return MathUtil.calculateMaxMin(dataToAggregate, true);
            case "MIN":
                return MathUtil.calculateMaxMin(dataToAggregate, false);
            case "AVG":
                return MathUtil.calculateAvg(dataToAggregate);
            case "SUM":
                return MathUtil.calculateSum(dataToAggregate);
            case "COUNT":
                return MathUtil.calculateCount(dataToAggregate);
        }
    }

    private _queryDataset(query: any) : any {
        var that = this;
        if(query) {
            if (query.operator == "OR") {
                var temp: any = {};
                query.properties.forEach(function(item: any) {
                    var child = that._queryDataset(item);
                    Object.keys(child).forEach(function(uuid: string) {
                        if(!temp[uuid]) {
                            temp[uuid] = child[uuid];
                        }
                    });
                });
                return temp;
            } else if (query.operator == "AND") {
                var temp: any = {};
                for (var i = 0; i < query.properties.length; i++) {
                    var item = query.properties[i];
                    var child = that._queryDataset(item);
                    // IF ANY ONE OF THE CHILDREN RETURN EMPTY, WE IMMEDIATELY RETURN EMPTY
                    if (Object.keys(child).length == 0) {
                        temp = {};
                        break;
                    }
                    if(Object.keys(temp).length > 0) {
                        temp = that.intersect(child, temp);
                    } else {
                        temp = that._queryDataset(item);
                    }
                }
                return temp;
            } else if (query.operator == "NOT") {
                return this.negate(this._queryDataset(query.properties[0]));
            } else {
                return this.retrieveRows(query);
            }
        }
    }

    private negate(map: any) : any {
        var that = this;
        var result: any = {};
        Object.keys(this.dataset).forEach(function(uuid: string) {
            if(!map[uuid]) {
                result[uuid] = that.dataset[uuid];
            }
        });
        return result;
    }

    private intersect(map1: any, map2: any) : any {
        var that = this;
        var result: any = {};
        Object.keys(map1).forEach(function(uuid: string) {
            if(map2[uuid]) {
                result[uuid] = map1[uuid];
            }
        });
        return result;
    }

    public augmentQuery(query: any): any {
        var that = this;
        var operator: string = Object.keys(query)[0];
        var content: any = query[operator];
        var result: any = {
            "operator": operator,
        };
        switch(operator) {
            case "OR":
            case "AND":
                result.properties = [];
                content.forEach(function(item: any) {
                    result.properties.push(that.augmentQuery(item));
                });
                break;
            case "NOT":
                result.properties = [];
                result.properties.push(this.augmentQuery(content));
                break;
            case "GT":
            case "LT":
            case "EQ":
            case "IS":
                result.column = Object.keys(content)[0];
                result.value = content[result.column];
                break;
            default:
                throw {
                    message: "Error: Malformed Query"
                };
        }
        return result;
    }

    /**
     * We call this assuming we have already checked that the dataset is added
     * @param datasetId
     * @returns {any}
     */
    private retrieveDatasetData(datasetId: string): any {
        var that = this;
        var dataset: any = {};
        if (CacheManager.checkDatasetAdded(datasetId)) {
            var stringData = FileManager.readTextFileSync("./cache/" + datasetId + ".txt");
            var jsonData = JSON.parse(stringData);
            var data = jsonData.data;
            data.forEach(function(item: any) {
                var id = item[that.datasetId + "_" + that.constants.getIdentifier()];
                dataset[id] = item;
            });
            return dataset;
        } else {
            throw {
                message : "Dataset not added"
            };
        }
    }

    private handleBaseQueryObject(queryValue: any, datasetValue: any, operator: string) : boolean{
        switch(operator) {
            case "GT":
                return datasetValue > queryValue;
            case "LT":
                return datasetValue < queryValue;
            case "EQ":
                return datasetValue === queryValue;
            case "IS":
                if (queryValue.startsWith("*") && queryValue.endsWith("*")) {
                    var parts = queryValue.split("*");
                    return datasetValue.includes(parts[1]);
                } else if (queryValue.startsWith("*")) {
                    var parts = queryValue.split("*");
                    return datasetValue.endsWith(parts[1]);
                } else if (queryValue.endsWith("*")) {
                    var parts = queryValue.split("*");
                    return datasetValue.startsWith(parts[0]);
                } else {
                    return datasetValue === queryValue;
                }
        }
    }

    // private getRowObject(uuid: string): any {
    //     return this.dataset[this.uuidMap.indexOf(uuid)];
    // }

    /**
     * The handler for the leaf level query object in the query. Will retrieve rows of data for GT, LT, EQ, and IS
     * @param queryObject
     * @returns {IDatasetObject[]}
     */
    public retrieveRows(queryObject: any): any {
        var that = this;
        var result: any = {};
        if (this.dataset) {
            var results = Object.keys(this.dataset).forEach(function(key: string) {
                if(that.handleBaseQueryObject(queryObject.value, that.dataset[key][queryObject.column], queryObject.operator)) {
                    result[key] = that.dataset[key];
                }
            });
        }
        return result;
    }

    /**
     * Should check that the whole query request object is valid and syntactically well-formed.
     * @param query
     * @returns {boolean}
     */
    public isValid(query: any): boolean {
        if(query && query.WHERE && query.OPTIONS) {
            // For checking options we need to pass in the whole object since we need to check if transformations exist
            if (Object.keys(query.WHERE).length == 0) {
                return this.checkTransformation(query.TRANSFORMATIONS) && this.checkOptions(query);
            } else {
                return this.checkWhere(query.WHERE) && this.checkTransformation(query.TRANSFORMATIONS) && this.checkOptions(query);
            }
        }
        else{
            throw {
                message: "Error: query does not have correct format(should contain WHERE and OPTIONS)"
            };
        }
    }

    public getDatasetId(query: any) : string {
        var datasetId: string = "";
        // Check in columns first
        if (query && query.OPTIONS && query.OPTIONS.COLUMNS) {
            var columns = query.OPTIONS.COLUMNS;
            for (var i = 0; i < columns.length; i++) {
                if (columns[i].includes("_")) {
                    datasetId = columns[i].split("_")[0];
                    break;
                }
            }
        }

        // Check for datasetId in group if column doesn't show any standard keys
        if(!datasetId && query.TRANSFORMATIONS && query.TRANFORMATIONS.GROUP) {
            var group = query.TRANFORMATIONS.GROUP;
            for (var i = 0; i < group.length; i++) {
                if (group[i].includes("_")) {
                    datasetId = group[i].split("_")[0];
                    break;
                }
            }
        }

        return datasetId;
    }

    private checkWhere(whereObject: any): boolean {
        var that = this;
        if (Object.keys(whereObject).length == 1) {
            var operator = Object.keys(whereObject)[0];
            switch (operator) {
                case "AND":
                case "OR":
                    if (whereObject[operator] && Array.isArray(whereObject[operator]) && whereObject[operator].length > 0) {
                        return whereObject[operator].every(function(item: any) {
                            return that.checkWhere(item);
                        });
                    } else {
                        throw {
                            message: "Error: Malformed Query"
                        };
                    }
                case "NOT":
                    if (whereObject[operator] && typeof (whereObject[operator]) == "object" && Object.keys(whereObject[operator]).length == 1) {
                        return this.checkWhere(whereObject[operator]);
                    } else {
                        throw {
                            message: "Error: Malformed Query"
                        };
                    }
                case "LT":
                case "GT":
                case "EQ":
                case "IS":
                    try {
                        if (whereObject[operator] && this.validBaseQueryObject(operator, whereObject[operator])) {
                            return true;
                        } else {
                            throw {
                                message: "Error: Malformed Query"
                            };
                        }
                    } catch (err) {
                        throw err;
                    }
                default:
                    throw {
                        message: "Error: Malformed Query"
                    };
            }
        } else {
            throw {
                message: "Error: Malformed Query"
            }
        };
    }

    private checkTypes(field: string, operator: string, baseObject: any, column: string) {
        switch(operator) {
            case "GT":
            case "LT":
            case "EQ":
                return this.constants.getFieldType(field) == "number" && typeof baseObject[column] == "number";
            case "IS":
                return this.constants.getFieldType(field) == "string" && typeof baseObject[column] == "string";
        }
    }

    private validBaseQueryObject(operator: string, baseObject: any): boolean {
        if (Object.keys(baseObject).length == 1) {
            var column = Object.keys(baseObject)[0];
            var items = column.split("_");
            if (items[0] == this.datasetId &&
                this.constants.getValidFields().indexOf(items[1]) != -1 &&
                this.checkTypes(items[1], operator, baseObject, column)) {
                return true;
            } else if (items[0] != this.datasetId && !CacheManager.checkDatasetAdded(items[0])) {
                throw {
                    message: "Dataset missing",
                    id: items[0]
                };
            } else {
                throw {
                    message: "Error: Malformed Query"
                };
            }
        } else {
            throw {
                message: "Error: Malformed Query"
            };
        }
    }

    private checkOptions(query: any): boolean {
        var that = this;
        var optionObject = query.OPTIONS;
        if (optionObject.COLUMNS && optionObject.COLUMNS.length > 0 && optionObject.FORM && optionObject.FORM == "TABLE") {
            var selectedColumns = optionObject.COLUMNS;
            // Added case for if transformations is present
            if (query.TRANSFORMATIONS && query.TRANSFORMATIONS.GROUP && query.TRANSFORMATIONS.APPLY) {
                var group: string[] = query.TRANSFORMATIONS.GROUP;
                var apply = query.TRANSFORMATIONS.APPLY;
                var applyKeys: string[] = apply.map(function(applyObject: any) {
                    return Object.keys(applyObject)[0];
                });
                var validKeys = group.concat(applyKeys);
                var valid = selectedColumns.every(function(column: string) {
                    return validKeys.indexOf(column) != -1;
                });
                if (!valid) {
                    throw {
                        message: "Error: Malformed Query - OPTIONS"
                    };
                }
            } else {
                var filteredColumns = selectedColumns.filter(function (column: string) {
                    var datasetId = column.split("_")[0];
                    var field = column.split("_")[1];
                    return that.constants.getValidFields().indexOf(field) == -1 || that.datasetId !== datasetId;
                });
                if (filteredColumns.length > 0) {
                    throw {
                        message: "Error: Malformed Query - OPTIONS"
                    };
                }
            }

            // Support new EBNF syntax for sort
            if (optionObject.ORDER && optionObject.ORDER.dir && optionObject.ORDER.keys && Array.isArray(optionObject.ORDER.keys)) {
                var dir = optionObject.ORDER.dir;
                var sortKeys = optionObject.ORDER.keys;
                // Check valid sort direction
                if (this.constants.getSortDirections().indexOf(dir) == -1) {
                    throw {
                        message: "Error: Malformed Query - OPTIONS"
                    }
                }
                // Check valid keys for sorting
                var valid = sortKeys.every(function(sortKey: string) {
                    return selectedColumns.indexOf(sortKey) != -1;
                });
                if (valid && sortKeys.length != 0) {
                    return true;
                } else {
                    throw {
                        message: "Error: Malformed Query - OPTIONS"
                    }
                }
            } else if (optionObject.ORDER && typeof optionObject.ORDER === "string"){
                if (selectedColumns.indexOf(optionObject.ORDER) != -1) {
                    return true;
                } else {
                    throw {
                        message: "Error: Malformed Query - OPTIONS"
                    }
                }
            } else if (!optionObject.ORDER) {
                return true;
            } else {
                throw {
                    message: "Error: Malformed Query - OPTIONS"
                };
            }
        } else {
            throw {
                message: "Error: Malformed Query - OPTIONS"
            };
        }
    }

    private checkTransformation(transformation: any) : boolean {
        var that = this;
        if (transformation && transformation.GROUP && transformation.APPLY) {
            // Check Group
            var group = transformation.GROUP;
            var validGroup = group.every(function(column: string) {
                var parts = column.split("_");
                var datasetId = parts[0];
                var field = parts[1];
                return that.datasetId == datasetId && that.constants.getValidFields().indexOf(field) != -1;
            });
            if (!validGroup || group.length == 0) {
                throw {
                    message: "Error: Malformed Group Object"
                };
            }
            // Check Apply
            var apply = transformation.APPLY;
            if (apply &&  Array.isArray(apply) && apply.length > 0) {
                return that.checkApply(apply);
            } else if (apply && Array.isArray(apply) && apply.length == 0) {
                return true;
            } else {
                throw {
                    message: "Error: Malformed Apply Object"
                };
            }
        } else if (!transformation) {
            return true;
        } else {
            throw {
                message: "Error: Malformed Query"
            };
        }
    }

    private checkApply(apply: any[]): boolean {
        var that = this;
        // Check all the keys first
        var applyKeys = apply.map(function(applyObject: any) {
            return Object.keys(applyObject)[0];
        });
        if (this.checkApplyKeys(applyKeys)) {
            // Next check all the apply objects
            return apply.every(function(applyObject: any) {
                var applyKey = Object.keys(applyObject)[0];
                return that.checkApplyObject(applyObject[applyKey]);
            });
        } else {
            throw {
                message: "Error: Malformed Apply Object"
            }
        }
    }

    private checkApplyObject(applyObject: any) : boolean {
        // Check that the aggregation is one of the known aggregations AND that the column is one of the known columns AND that the types match AND that the datasetId is known
        if (applyObject && Object.keys(applyObject).length == 1) {
            var aggregation = Object.keys(applyObject)[0];
            var column = applyObject[aggregation];
            var datasetId = column.split("_")[0];
            var field = column.split("_")[1];
            if (this.datasetId === datasetId &&
                this.constants.getAggregations().indexOf(aggregation) != -1 &&
                this.constants.getValidFields().indexOf(field) != -1 &&
                (this.constants.getAggregationType(aggregation) === this.constants.getFieldType(field) ||
                this.constants.getAggregationType(aggregation) === "any")) {
                return true;
            } else {
                throw {
                    message: "Error: Malformed Apply Object"
                }
            }
        } else {
            throw {
                message: "Error: Malformed Apply Object"
            }
        }
    }

    private checkApplyKeys(applyKeys: string[]) : boolean {
        // Check all keys unique AND no underscore
        var hash: any = {};
        var unique: boolean = true;
        for (var i = 0; i < applyKeys.length; i++) {
            var applyKey = applyKeys[i];
            if (!hash[applyKey]) {
                hash[applyKey] = applyKey;
            } else {
                unique = false;
                break;
            }
        };
        return unique && applyKeys.every(function(key: string) {
            return !key.includes("_");
        });
    }
};