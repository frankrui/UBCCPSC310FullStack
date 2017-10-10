/*
Abstract Constants class
 */

abstract class Constants {

    private TEAMNUMBER: number = 167;
    private AGGREGATIONS: any = {
        "MAX": {
            "fieldType": "number"
        },
        "MIN": {
            "fieldType": "number"
        },
        "SUM": {
            "fieldType": "number"
        },
        "AVG": {
            "fieldType": "number"
        },
        "COUNT": {
            "fieldType": "any"
        }
    };
    private SORTDIRECTIONS: string[] = ["UP", "DOWN"];

    constructor() {
    }

    abstract getValidFields(): string[];

    abstract getFieldType(field: string): string;

    abstract getIdentifier(): string;

    public getTeamNumber() {
        return this.TEAMNUMBER;
    }

    public getAggregations(): string[] {
        return Object.keys(this.AGGREGATIONS);
    }

    public getAggregationType(aggregation: string): string {
        if (aggregation) {
            return this.AGGREGATIONS[aggregation].fieldType;
        }
        return null;
    }

    public getSortDirections(): string[] {
        return this.SORTDIRECTIONS;
    }
}
export default Constants;