/**
 * IMPORTANT: declare this variable before each scripts
 * where you'll be using the 'perf' and 'perfLog' functions.
 * @type {object}
 */
let time = {};

/**
 * Saves performance into an object.
 * @param {string} message
 */
const perf = (message) => {
    time[Object.entries(time).length] = {
        message: message,
        timeAbs: performance.now()
    };
}

/**
 * Logs performance data into the browser's console.
 */
const perfLog = () => {
    // Calculates relative time.
    for (const key of Object.keys(time)) {
        if (key === "0") {
            time[key]["timeRel"] = 0;
        } else {
            time[key]["timeRel"] = Math.round(time[key]["timeAbs"] - time[key - 1]["timeAbs"]);
        }
        time[key]["timeAbs"] = Math.round(time[key]["timeAbs"]);
    }

    // Total time.
    time[Object.keys(time).length] = {
        timeAbs: "Total",
        timeRel: time[Object.keys(time).length - 1]["timeAbs"] - time[0]["timeAbs"]
    };

    // Logs the result as a table.
    console.table(time);

    // Resets the object.
    time = {};
}