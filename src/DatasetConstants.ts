import Constants from "./Constants";
import CoursesConstants from "./CoursesConstants";
import RoomsConstants from "./RoomsConstants";

export default class {

    public static getConstants(datasetId: string) : Constants {
        switch (datasetId) {
            case "courses":
                return new CoursesConstants();
            case "rooms":
                return new RoomsConstants();
            default:
                return new CoursesConstants();
        }
    }
}