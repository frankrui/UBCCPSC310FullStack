/*
 Class for rooms constants
 */
import Constants from "./Constants";

class RoomsConstants extends Constants {

    identifier: string = "name";
    types: any = {
        fullname: {
            type: "string"
        },
        shortname: {
            type: "string"
        },
        number: {
            type: "string"
        },
        name: {
            type: "string"
        },
        address: {
            type: "string"
        },
        lat: {
            type: "number"
        },
        lon: {
            type: "number"
        },
        seats: {
            type: "number"
        },
        type: {
            type: "string"
        },
        furniture: {
            type: "string"
        },
        href: {
            type: "string"
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
}
export default RoomsConstants;