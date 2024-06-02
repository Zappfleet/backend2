const s = {
    _id: new ObjectId("63e636feb1d8ecd53295c31f"),
    created_by: {
        _id: new ObjectId("63baba6a7aece8a7256a4666"),
        role: [5],
        nat_num: '0',
        emp_num: '0',
        full_name: 'مدیر سیستم',
        phone_num: '0',
        permissions: {
            GET: [Array],
            POST: [Array],
            PUT: [Array],
            DELETE: [Array],
            _id: new ObjectId("63baba6a7aece8a7256a4667")
        },
        is_active: true,
        is_passenger: false,
        createdAt: "2023 - 01 - 08T12: 43: 22.208Z",
        updatedAt: "2023 - 02 - 10T12: 22: 03.382Z",
        __v: 0,
        last_login_date: "2023 - 02 - 10T12: 22: 03.375Z",
        id: '63baba6a7aece8a7256a4666'
    },
    gmt_for_date: "2023 - 02 - 10T12: 23: 55.000Z,",
    status: 'PUBLISHED',
    service_requests: [
        {
            status: 'PENDING',
            current_location_index: -1,
            _id: new ObjectId("63e63764b1d8ecd53295c370"),
            request: [Object]
        }
    ],
    createdAt: "2023 - 02 - 10T12: 22: 22.322Z,",
    updatedAt: "2023 - 02 - 10T16: 03: 19.308Z",
    __v: 0,
    assigned_by: {
        _id: new ObjectId("63baba6a7aece8a7256a4666"),
        role: [5],
        nat_num: '0',
        emp_num: '0',
        full_name: 'مدیر سیستم',
        phone_num: '0',
        permissions: {
            GET: [Array],
            POST: [Array],
            PUT: [Array],
            DELETE: [Array],
            _id: new ObjectId("63baba6a7aece8a7256a4667")
        },
        is_active: true,
        is_passenger: false,
        createdAt: "2023 - 01 - 08T12: 43: 22.208Z",
        updatedAt: "2023 - 02 - 10T12: 22: 03.382Z",
        __v: 0,
        last_login_date: "2023 - 02 - 10T12: 22: 03.375Z",
        id: '63baba6a7aece8a7256a4666'
    },
    area: new ObjectId("63cfa7847ed24b896bc6f08c"),
    id: '63e636feb1d8ecd53295c31f',
    vehicle: {
        _id: new ObjectId("63e638c6bd2b95441732859c"),
        group: 'TAXI',
        driver_user: {
            _id: new ObjectId("63e64ab94a693bbde66c08c8"),
            role: [Array],
            nat_num: '2457854446',
            full_name: 'راننده جدید',
            phone_num: '05124578455',
            permissions: [Object],
            is_active: true,
            is_passenger: false,
            createdAt: "2023 - 02 - 10T13: 46: 33.828Z",
            updatedAt: "2023 - 02 - 10T13: 46: 48.836Z",
            __v: 0,
            last_login_date: "2023 - 02 - 10T13: 46: 48.833Z",
            id: '63e64ab94a693bbde66c08c8'
        },
        status: 'IDLE',
        plaque: '15 ص 15 15',
        services: [[Object]],
        gps_uid: '',
        extra: { vehicle: 'TIBA', dateMade: '1401', color: 'WHITE' },
        createdAt: "2023 - 02 - 10T12: 29: 58.034Z",
        updatedAt: "2023 - 02 - 10T13: 55: 17.224Z",
        __v: 0,
        latest_location_info: {
            area: new ObjectId("63cfa7847ed24b896bc6f08c"),
            _id: new ObjectId("63e75f371915b47ddad09ece")
        },
        id: '63e638c6bd2b95441732859c'
    }
}