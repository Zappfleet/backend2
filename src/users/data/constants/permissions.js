const PermissionSet = {
    DASHBOARD: null,
    RESTRICTION: null,
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
    AGANCE: {
        AGANCE: {
            CREATE: null,
            EDIT: null,
            DELETE: null,
            LIST: null,
        },
        SODURE_PARVANE: {
            CREATE: null,
            EDIT: null,
            DELETE: null,
            LIST: null,
        },
        DRIVER: {
            CREATE: null,
            EDIT: null,
            DELETE: null,
            LIST: null,
        },
        CART_SALAHIYAT: {
            CREATE: null,
            EDIT: null,
            DELETE: null,
            LIST: null,
        },
        TAMDID_CART_SALAHIYAT: {
            CREATE: null,
            EDIT: null,
            DELETE: null,
            LIST: null,
        },
        ESTELAMHAYE_SE_GANE: {
            CREATE: null,
            EDIT: null,
            DELETE: null,
            LIST: null,
        },
        MOAREFI_NAME_TAMIN_EJTEMAEI: {
            CREATE: null,
            EDIT: null,
            DELETE: null,
            LIST: null,
        },
        MOAREFI_NAME_VAM: {
            CREATE: null,
            EDIT: null,
            DELETE: null,
            LIST: null,
        },
        FAALIYATE_DRIVER: {
            CREATE: null,
            EDIT: null,
            DELETE: null,
            LIST: null,
        },
        ESTELAM_AMAKEN: {
            CREATE: null,
            EDIT: null,
            DELETE: null,
            LIST: null,
        },
        MOAYENE_FANI: {
            CREATE: null,
            EDIT: null,
            DELETE: null,
            LIST: null,
        },
        TAREFE_AVAREZ: {
            CREATE: null,
            EDIT: null,
            DELETE: null,
            LIST: null,
        },
        DABIRKHANE: {
            CREATE: null,
            EDIT: null,
            DELETE: null,
            LIST: null,
        },
        PROFILE: {
            CREATE: null,
            EDIT: null,
            DELETE: null,
            LIST: null,
        },
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
        DRIVERLIST_LASTMISSION_DISTANCE: null,
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
