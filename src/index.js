var wasm;
var laghariHekenicYearFromGregorian;
var laghariHekenicMonthFromGregorian;
var laghariHekenicDayFromGregorian;
var laghariHekenicMonthDayFromGregorian;
var laghariHekenicMonthFontNamePtr;
var laghariHekenicMonthFontNameLen;
var laghariHekenicToGregorianEpoch;
var laghariMartianYearFromGregorian;
var laghariMartianDayFromGregorian;
var laghariMartianToGregorianEpoch;
var laghariLanguageEndonymPtr;
var laghariLanguageEndonymLen;
var memory;

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
            style_to_use = Language.style_class_name(Language.solar);
        }

        return style_to_use;
    }
}

class Language {
    static solar = 0;
    static martian = 1;
    static neptunian = 2;
    static future_solar = 3;
    static informal_oeaiaa = 4;
    static formal_oeaiaa = 5;
    static english = 6;

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

    static endonym(language) {
        let ptr = laghariLanguageEndonymPtr(language);
        let len = laghariLanguageEndonymLen(language);

        return decodeString(ptr, len);
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
                return "lato-light";
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

function generate_hekenic_table(table_element, hekenic_date, language) {
    let days_left = 116;
    let i = 0;

    let max_width_slider = document.getElementById("max_width_slider");

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

    let max_width_slider = document.getElementById("max_width_slider");

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

var calendar = Calendar.hekenic;
var current_language = Language.solar;

var now;
var date;

function clear_style(element) {
    element.classList.remove(Language.font_class_name(Language.english));
    element.classList.remove(Language.font_class_name(Language.solar));
    element.classList.remove(Language.font_class_name(Language.martian));
    element.classList.remove(Language.font_class_name(Language.neptunian));
    // element.classList.remove(Language.font_class_name(Language.future_solar));
    // element.classList.remove(Language.font_class_name(Language.informal_oeaiaa));
    // element.classList.remove(Language.font_class_name(Language.formal_oeaiaa));

    element.classList.remove(Language.style_class_name(Language.english));
    element.classList.remove(Language.style_class_name(Language.solar));
    element.classList.remove(Language.style_class_name(Language.martian));
    element.classList.remove(Language.style_class_name(Language.neptunian));
    // element.classList.remove(Language.style_class_name(Language.future_solar));
    // element.classList.remove(Language.style_class_name(Language.informal_oeaiaa));
    // element.classList.remove(Language.style_class_name(Language.formal_oeaiaa));
}

function render() {
    now = current_day();

    let title_element = document.getElementById("calendar-title");

    clear_style(title_element);

    switch (calendar) {
        case Calendar.hekenic:
            date = HekenicDate.from_gregorian(now);

            title_element.textContent = HekenicCalendar.month_name(date.month, current_language);
            title_element.classList.add(HekenicCalendar.style_to_use(current_language));
            title_element.classList.add(Language.font_class_name(current_language));
            break;
        case Calendar.martian:
            date = MartianDate.from_gregorian(now);

            title_element.textContent = MartianCalendar.title(current_language);
            title_element.classList.add(Language.style_class_name(Language.martian));
            title_element.classList.add(Language.font_class_name(current_language));

            break;
        default:
            throw new Error("Unhandled calendar type");

    }

    // generate the table
    generate_table(calendar, current_language, date);
}

function update_language_dropdown() {
    let dropdown_button = document.getElementById("language-dropdown-button");

    clear_style(dropdown_button);

    dropdown_button.classList.add(Language.font_class_name(current_language));
    dropdown_button.classList.add(Language.style_class_name(current_language));

    dropdown_button.innerHTML = Language.endonym(current_language);
}

function set_language(language) {
    current_language = language;

    update_language_dropdown();
    render();
}

// setup initial

async function setup() {
    wasm = await WebAssembly.instantiateStreaming(fetch('laghari.wasm'), {
        env: { print: (x) => console.log(x) },
    });
    laghariHekenicYearFromGregorian = wasm.instance.exports.laghariHekenicYearFromGregorian;
    laghariHekenicMonthFromGregorian = wasm.instance.exports.laghariHekenicMonthFromGregorian;
    laghariHekenicDayFromGregorian = wasm.instance.exports.laghariHekenicDayFromGregorian;
    laghariHekenicMonthDayFromGregorian = wasm.instance.exports.laghariHekenicMonthDayFromGregorian;
    laghariHekenicMonthFontNamePtr = wasm.instance.exports.laghariHekenicMonthFontNamePtr;
    laghariHekenicMonthFontNameLen = wasm.instance.exports.laghariHekenicMonthFontNameLen;
    laghariHekenicToGregorianEpoch = wasm.instance.exports.laghariHekenicToGregorianEpoch;
    laghariMartianYearFromGregorian = wasm.instance.exports.laghariMartianYearFromGregorian;
    laghariMartianDayFromGregorian = wasm.instance.exports.laghariMartianDayFromGregorian;
    laghariMartianToGregorianEpoch = wasm.instance.exports.laghariMartianToGregorianEpoch;
    laghariLanguageEndonymPtr = wasm.instance.exports.laghariLanguageEndonymPtr;
    laghariLanguageEndonymLen = wasm.instance.exports.laghariLanguageEndonymLen;
    memory = wasm.instance.exports.memory;

    let scale_slider = document.getElementById("scale_slider");
    let max_width_slider = document.getElementById("max_width_slider");

    scale_slider.oninput = function () {
        document.documentElement.style.setProperty('--table-scale', this.value);
    };

    max_width_slider.oninput = function () {
        generate_table(calendar, current_language, date);
    };

    set_language(current_language);

    render();
}

setup();


