/**
 * Generate a date string for the current day in the format yyyy-mm-dd.
 * @return {string}
 */
const getCurrentDate = () => {
    const today = new Date();
    let dd = today.getDate();
    let mm = today.getMonth() + 1; // January is 0!

    const yyyy = today.getFullYear();

    if (dd < 10) {
        dd = '0' + dd;
    }

    if (mm < 10) {
        mm = '0' + mm;
    }

    return  `${yyyy}-${mm}-${dd}`;
};

/**
 * Returns the POST URL for saving and submitting a timesheet.
 * @return {string}
 */
const getPostURL = () => {
    const uid = getUid();
    const timeSheetId = getTimeSheetId();
    const token = getToken();
    return `https://www.openair.com/timesheet.pl?uid=${uid};app=ta;action=grid;r=${token};timesheet_id=${timeSheetId}`
};

/**
 * Gets the per-page token.
 * @return {string}
 */
const getToken = () => {
    return document.getElementsByTagName('form')[0].getAttribute('action').split(';').filter(a => a.includes('r='))[0].split('=')[1];
};

/**
 * Gets the user unique ID.
 * @return {string}
 */
const getUid = () => {
    return document.getElementsByTagName('form')[0].getAttribute('action').split(';').filter(a => a.includes('uid='))[0].split('=')[1];
};

/**
 * Gets the timesheet ID.
 * @return {string}
 */
const getTimeSheetId = () => {
    return document.getElementsByTagName('form')[0].getAttribute('action').split(';').filter(a => a.includes('timesheet_id='))[0].split('=')[1];
};

/**
 * Gets the page timestamp param.
 * @return {*}
 */
const getTimeStamp = () => {
    return document.querySelector('input[name="_ts"]').value;
};

/**
 * Generates the full request object.
 * @return {object} OpenAir timesheet request object
 */
const generateRequestObject = () => {

    // These need to be extracted from the project or the time sheet page.
    const timeSheetId = getTimeSheetId();
    const uid = getUid();
    const timeStamp = getTimeStamp();
    const date = getCurrentDate();

    const allocationObject = [
        {
            projectId: '88:223', // Internal US Operations
            taskId: 737, // Training
            hours: 8,
            comment: 'Training for next project'
        }
    ];

    const grid = generateGridFields(allocationObject);

    return  {
        _form_has_changed: 1,
        uid: uid,
        app: 'ta',
        action: 'grid',
        timesheet_id: timeSheetId,
        search_global_create: 'Search Global',
        _ts: timeStamp,
        _popups: 'cp_id', // Why is this duplicated in OpenAir's real form?
        // _popups: 'pt_id',
        _date: date,
        _pop_cols: 2,
        _grid_custom_fields: '',
        _left_grid_custom_fields: '',
        _dialog_fields: 'notes',
        _add_rows: 'BLANK',
        _save_grid: 'Save',
        ...grid
    };
};

/**
 * Returns the Project, task, Monday-Friday grid part of the request object.
 * @param {object} allocationObject
 */
const generateGridFields = (allocationObject) => {
    const numColumns = 10;
    const numRows = allocationObject.length; // 1
    const gridObj = {};

    for (let c = 1; c <= numColumns; c++) {
        for (let r = 1; r <= numRows; r++) {
            const projectRow = allocationObject[r] || allocationObject[0];
            const inputName = `_c${c}_r${r}`;
            let value = '';

            // Populate Project Id
            if (c === 1) {
                value = projectRow.projectId;
            } else if (c === 2) {
                value = projectRow.taskId;
            } else if (c <= 7) {
                const inputSelector = document.querySelector(`input[name="${inputName}"]`);
                if (inputSelector && !inputSelector.disabled) {
                    value = 8; // Monday-Friday enter 8 hours
                    gridObj[`_c${c}_r${r}_dialog_notes`] = projectRow.comment;
                }
            }

            gridObj[inputName] = value;
        }
    }

    gridObj._total_rows = numRows;

    // Add extra blank rows to match real form case
    gridObj[`_c1_r${numRows + 1}`] = ':';
    gridObj[`c2_r${numRows + 1}`] = 0;
    gridObj[`c3_r${numRows + 1}`] = '';
    gridObj[`c4_r${numRows + 1}`] = '';
    gridObj[`c5_r${numRows + 1}`] = '';
    gridObj[`c6_r${numRows + 1}`] = '';
    gridObj[`c10_r${numRows + 1}`] = '';
    gridObj[`c3_r${numRows + 2}`] = '';
    gridObj[`c4_r${numRows + 2}`] = '';
    gridObj[`c5_r${numRows + 2}`] = '';
    gridObj[`c6_r${numRows + 2}`] = '';
    gridObj[`c7_r${numRows + 2}`] = '';
    gridObj[`c8_r${numRows + 2}`] = '';
    gridObj[`c9_r${numRows + 2}`] = '';
    gridObj[`c10_r${numRows + 2}`] = '';

    return gridObj;
};

/**
 * Creates the form data and posts it to OpenAir.
 */
const postForm = () => {
    const params = generateRequestObject();
    const form = document.createElement("form");
    form.setAttribute("method", "post");
    form.setAttribute("action", getPostURL());

    for (let key in params) {
        if(params.hasOwnProperty(key)) {
            const hiddenField = document.createElement("input");
            hiddenField.setAttribute("type", "hidden");
            hiddenField.setAttribute("name", key);
            hiddenField.setAttribute("value", params[key]);

            form.appendChild(hiddenField);
        }
    }

    document.body.appendChild(form);
    form.submit();
};