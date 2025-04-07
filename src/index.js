const wasm = await WebAssembly.instantiateStreaming(fetch('laghari.wasm'), {
    env: { print: (x) => console.log(x) },
});

const {
    laghariHekenicYearFromGregorian,
    laghariHekenicMonthFromGregorian,
    laghariHekenicDayFromGregorian,
    laghariHekenicMonthDayFromGregorian,
    laghariHekenicMonthFontNamePtr,
    laghariHekenicMonthFontNameLen,
    laghariHekenicToGregorianEpoch,
    laghariMartianYearFromGregorian,
    laghariMartianDayFromGregorian,
    laghariMartianToGregorianEpoch,
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

class Calendar {
    static hekenic = 0;
    static martian = 1;
}

class MartianCalendar {
    static title(language) {
        switch (language) {
            case Language.solar:
                return "nangka";
            case Language.martian:
                return "nakh";
            case Language.neptunian:
                return "NAGKW";
            case Language.future_solar:
                return "nangga";
            case Language.oeaiaa:
                throw new Error("no data available/todo");
            case Language.english:
                return "Martian Calendar";
            default:
                throw new Error("Invalid language passed");
        }
    }
}

class HekenicCalendar {
    static title(language) {
        switch (language) {
            case Language.solar:
                return "ranyar2";
            case Language.martian:
                return "ranyari";
            case Language.neptunian:
                return "DANYARI";
            case Language.future_solar:
                return "danyas2";
            case Language.oeaiaa:
                throw new Error("no data available/todo");
            case Language.english:
                return "Hekenic Calendar";
            default:
                throw new Error("Invalid language passed");
        }
    }

    static month_name(month, language) {
        let month_ptr = laghariHekenicMonthFontNamePtr(month, language);
        let month_len = laghariHekenicMonthFontNameLen(month, language);

        return decodeString(month_ptr, month_len);
    }

    static style_to_use(language) {
        // special handling so that the colour in use is the respective hekenic language's colour, but if not a hekenic language, just use the laghari colour
        let style_to_use = Language.style_class_name(language);

        if (language != Language.solar && language != Language.martian && language != Language.neptunian) {
            style_to_use = Language.style_class_name(Language.english);
        }

        return style_to_use;
    }
}

class Language {
    static solar = 0;
    static martian = 1;
    static neptunian = 2;
    static future_solar = 3;
    static oeaiaa = 4;
    static english = 5;

    static style_class_name(language) {
        switch (language) {
            case Language.solar:
                return "solar";
            case Language.martian:
                return "martian";
            case Language.neptunian:
                return "neptunian";
            case Language.future_solar:
                throw new Error("TODO: Future solar styling");
            case Language.oeaiaa:
                throw new Error("TODO: O'eaiaa styling");
            case Language.english:
                return "laghari";
            default:
                throw new Error("Invalid language passed");
        }
    }

    static font_class_name(language) {
        switch (language) {
            case Language.solar:
                return "solar-font";
            case Language.martian:
                return "martian-font";
            case Language.neptunian:
                return "neptunian-font";
            case Language.future_solar:
                throw new Error("TODO: Future solar font");
            case Language.oeaiaa:
                throw new Error("TODO: O'eaiaa font");
            case Language.english:
                return "lato-regular";
            default:
                throw new Error("Invalid language passed");
        }
    }
}

class HekenicDate {
    year;
    month;
    day;
    month_day;

    constructor(year, month, day, month_day) {
        this.year = year;
        this.month = month;
        this.day = day;
        this.month_day = month_day;
    }

    static from_gregorian(epoch_days) {
        let year = laghariHekenicYearFromGregorian(BigInt(epoch_days));
        let month = laghariHekenicMonthFromGregorian(BigInt(epoch_days));
        let day = laghariHekenicDayFromGregorian(BigInt(epoch_days));
        let month_day = laghariHekenicMonthDayFromGregorian(BigInt(epoch_days));

        return new HekenicDate(year, month, day, month_day);
    }

    to_gregorian() {
        return laghariHekenicToGregorianEpoch(BigInt(this.year), BigInt(this.month), BigInt(this.day));
    }
}

class MartianDate {
    year;
    day;

    constructor(year, day) {
        this.year = year;
        this.day = day;
    }

    static from_gregorian(epoch_days) {
        let year = laghariMartianYearFromGregorian(BigInt(epoch_days));
        let day = laghariMartianDayFromGregorian(BigInt(epoch_days));

        return new MartianDate(year, day);
    }

    to_gregorian() {
        return laghariMartianToGregorianEpoch(BigInt(this.year), BigInt(this.day));
    }
}

let scale_slider = document.getElementById("scale_slider");
let max_width_slider = document.getElementById("max_width_slider");

function generate_hekenic_table(table_element, hekenic_date, language) {
    let days_left = 116;
    let i = 0;

    let max_width = max_width_slider.value;

    let style_to_use = HekenicCalendar.style_to_use(language);

    while (days_left > 0) {
        let row = document.createElement('tr');
        row.classList.add(style_to_use);

        for (let day = 0; (day < max_width && days_left > 0); day++) {
            // always break on week restarts
            if (day > 0 && (i % 29) == 0)
                break;

            let column = document.createElement('td');
            column.classList.add(style_to_use);

            if ((hekenic_date.month_day - 1) == i) {
                column.classList.add("current-day");
            }

            let contents = document.createElement('div');
            contents.classList.add("day-contents");
            contents.classList.add(style_to_use);
            // TODO: serialize according to language
            contents.classList.add(Language.font_class_name(Language.english));
            contents.appendChild(document.createTextNode(((i + 1) + (116 * hekenic_date.month)).toString()));

            column.appendChild(contents);

            row.appendChild(column);

            i += 1;
            days_left -= 1;
        }

        table_element.appendChild(row);
    }
}

function generate_martian_table(table_element, martian_date, language) {
    let days_left = 780;
    let i = 0;

    let max_width = max_width_slider.value;

    while (days_left > 0) {
        let row = document.createElement('tr');
        row.classList.add("martian");

        for (let day = 0; (day < max_width && days_left > 0); day++) {
            let column = document.createElement('td');
            column.classList.add("martian");

            if ((martian_date.day - 1) == i) {
                column.classList.add("current-day");
            }

            let contents = document.createElement('div');
            contents.classList.add("day-contents");
            contents.classList.add("martian");
            // TODO: serialize according to language
            contents.classList.add(Language.font_class_name(Language.english));
            contents.appendChild(document.createTextNode((i + 1).toString()));

            column.appendChild(contents);

            row.appendChild(column);

            i += 1;
            days_left -= 1;
        }

        table_element.appendChild(row);
    }
}

function generate_table(calendar, language, date) {
    let container = document.getElementById("calendar-table");

    let table = document.createElement('table');

    switch (calendar) {
        case Calendar.hekenic:
            generate_hekenic_table(table, date, language);

            break;

        case Calendar.martian:
            generate_martian_table(table, date, language);

            break;

        default:
            throw new Error("Invalid calendar type passed!");
    }


    container.innerHTML = "";
    container.appendChild(table);
}

function current_day() {
    let now = new Date();
    let tz_epoch_ms = now.valueOf() - now.getTimezoneOffset() * 60 * 1000; // getTimezoneOffset returns minutes!

    return Math.floor(tz_epoch_ms / (24 * 60 * 60 * 1000));
}

let calendar = Calendar.hekenic;
let language = Language.solar;

let title_element = document.getElementById("calendar-title");

let now = current_day();
let date;
switch (calendar) {
    case Calendar.hekenic:
        date = HekenicDate.from_gregorian(now);

        title_element.textContent = HekenicCalendar.month_name(date.month, language);
        title_element.classList.add(HekenicCalendar.style_to_use(language));
        title_element.classList.add(Language.font_class_name(language));
        break;
    case Calendar.martian:
        date = MartianDate.from_gregorian(now);

        title_element.textContent = MartianCalendar.title(language);
        title_element.classList.add(Language.style_class_name(Language.martian));
        title_element.classList.add(Language.font_class_name(language));

        break;
    default:
        throw new Error("Unhandled calendar type");

}

// generate the table
generate_table(calendar, language, date);

scale_slider.oninput = function () {
    document.documentElement.style.setProperty('--table-scale', this.value);
};

max_width_slider.oninput = function () {
    generate_table(calendar, language, date);
};
