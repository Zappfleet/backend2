const PermissionSet = {
    ONLYADMIN: null,
    RESTRICTION:null,
    DRIVER: null,
    SERVICE: {
        PERSONAL: {
            SUBMIT: null,
            EDIT: null,
            CANCEL: null,
            LIST: null,
        },
        ORG: {
            DIRECT_SUBMIT: null,
            DIRECT_EDIT: null,
            DIRECT_CANCEL: null,
            REQUEST_APPROVAL: null,
            DISPATCH: null,
            GET: {
                AREA_FULL: null,
                AREA_LIMITED: null,
                AGENCY_FULL: null,
                AGENCY_LIMITED: null,
            }
        }
    },
    LOCATION: {
        PERSONAL: {
            SUBMIT: null,
            EDIT: null,
            CANCEL: null,
            LIST: null,
        },
        ORG: {
            SUBMIT: null,
            EDIT: null,
            CANCEL: null,
            LIST: null,
        }
    },
    USERS: {
        PROFILE: null,
        CREATE: null,
        DELETE: null,
        EDIT: null,
        LIST: null,
    },
    VEHICLES: {
        CREATE: null,
        DELETE: null,
        EDIT: null,
        LIST: null,
    },
    AREAS: {
        CREATE: null,
        DELETE: null,
        EDIT: null,
        LIST: null,
    },
    DEFINITIONS: {
        CAR_COLORS: null,
        CAR_TYPES: null,
        CAR_NAME: null,
        SERVICE_TYPES: null
    },
    REPORTS: {
        STATS: null,
        DRIVERS_AGENCIES: null,
        DRIVER_BREAKS: null,
        SERVICE_PERIODS: null,
        SERVICE_COUNT: null,
        DRIVERLIST_LASTMISSION_DISTANCE:null,
        TRIP_FEEDBACKS: null,
    },
    RULES: null,
    DELEGATION: null,
}

const PermissionSetFlatValues = [];

function generateKeys(PermissionSet, base) {
    const result = Object.keys(PermissionSet).map((key) => {
        const chain = `${base != null ? `${base}.` : ""}${key}`;
        if (PermissionSet[key] == null) {
            PermissionSet[key] = chain;
            PermissionSetFlatValues.push(chain);
            return chain;
        } else {
            return generateKeys(PermissionSet[key], chain);
        }
    })
    return result;
}

generateKeys(PermissionSet);

module.exports = { PermissionSet, PermissionSetFlatValues };
