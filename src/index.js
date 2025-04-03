const wasm = await WebAssembly.instantiateStreaming(fetch('/laghari.wasm'), {
    env: { print: (x) => console.log(x) },
});

const {
    laghariHekenicYearFromGregorian,
    laghariHekenicMonthFromGregorian,
    laghariHekenicDayFromGregorian,
    laghariHekenicMonthDayFromGregorian,
    laghariHekenicMonthFontNamePtr,
    laghariHekenicMonthFontNameLen,
    memory
} = wasm.instance.exports;

const decodeString = (pointer, length) => {
    const slice = new Uint8Array(
        memory.buffer,
        pointer,
        length
    );
    return new TextDecoder().decode(slice);
};

const Language = {
    solar: 0,
    martian: 1,
    neptunian: 2,
    future_solar: 3,
    oeaiaa: 4,
}

function current_day() {
    let now = new Date();
    let tz_epoch_ms = now.valueOf() - now.getTimezoneOffset() * 60 * 1000; // getTimezoneOffset returns minutes!

    return Math.floor(tz_epoch_ms / (24 * 60 * 60 * 1000));
}

function hekenic_from_gregorian(epoch_days) {
    let year = laghariHekenicYearFromGregorian(BigInt(epoch_days));
    let month = laghariHekenicMonthFromGregorian(BigInt(epoch_days));
    let day = laghariHekenicDayFromGregorian(BigInt(epoch_days));
    let month_day = laghariHekenicMonthDayFromGregorian(BigInt(epoch_days));

    let month_ptr = laghariHekenicMonthFontNamePtr(month, Language.solar);
    let month_len = laghariHekenicMonthFontNameLen(month, Language.solar);

    return { year: year, month: month, month_name: decodeString(month_ptr, month_len), day: day, month_day: month_day };
}

let scale_slider = document.getElementById("scale_slider");
let max_width_slider = document.getElementById("max_width_slider");

function generate_table(hekenic_date) {
    let container = document.getElementById("calendar-table");

    let table = document.createElement('table');

    let max_width = max_width_slider.value;

    let days_left = 116;
    let i = 0;
    while (days_left > 0) {
        let row = document.createElement('tr');

        for (let day = 0; day < max_width; day++) {
            // always break on week restarts
            if (day > 0 && (i % 29) == 0)
                break;

            let column = document.createElement('td');
            column.classList.add("solar");

            if ((hekenic_date.month_day - 1) == i) {
                column.classList.add("current-day");
            }

            let contents = document.createElement('div');
            contents.classList.add("day-contents");
            contents.appendChild(document.createTextNode(((i + 1) + (116 * hekenic_date.month)).toString()));

            column.appendChild(contents);

            row.appendChild(column);

            i += 1;
            days_left -= 1;
        }

        table.appendChild(row);
    }

    container.innerHTML = "";
    container.appendChild(table);
}

// get the current time in the hekenic calendar
let hekenic_now = hekenic_from_gregorian(current_day());

// set the title to the current month
let title = document.getElementById("calendar-title");
title.textContent = hekenic_now.month_name;

// generate the table
generate_table(hekenic_now);

scale_slider.oninput = function () {
    document.documentElement.style.setProperty('--table-scale', this.value);
};

max_width_slider.oninput = function () {
    generate_table(hekenic_now);
};
