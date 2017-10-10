/*
Class for courses constants
 */
import Constants from "./Constants";

class CoursesConstants extends Constants {

    identifier: string = "uuid";
    types: any = {
        dept: {
            type: "string",
            rawColumn: "Subject"
        },
        id: {
            type: "string",
            rawColumn: "Course"
        },
        avg: {
            type: "number",
            rawColumn: "Avg"
        },
        instructor: {
            type: "string",
            rawColumn: "Professor"
        },
        title: {
            type: "string",
            rawColumn: "Title"
        },
        pass: {
            type: "number",
            rawColumn: "Pass"
        },
        fail: {
            type: "number",
            rawColumn: "Fail"
        },
        audit: {
            type: "number",
            rawColumn: "Audit"
        },
        uuid: {
            type: "string",
            rawColumn: "id"
        },
        year: {
            type: "number",
            rawColumn: "Year"
        },
        size: {
            type: "number",
            rawColumn: ["Pass", "Fail"]
        }
    };

    constructor() {
        super();
    }

    public getFieldType(field: string) : string {
        return this.types[field] ? this.types[field].type : null;
    }

    public getValidFields(): string[] {
        return Object.keys(this.types);
    }

    public getIdentifier(): string {
        return this.identifier;
    }

    public getRawColumn(field: string): string {
        return this.types[field].rawColumn;
    }
}
export default CoursesConstants;