const wasm = await WebAssembly.instantiateStreaming(fetch('/laghari.wasm'), {
    env: { print: (x) => console.log(x) },
});

const {
    laghariHekenicYearFromGregorian,
    laghariHekenicMonthFromGregorian,
    laghariHekenicDayFromGregorian,
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

    let month_ptr = laghariHekenicMonthFontNamePtr(month, Language.solar);
    let month_len = laghariHekenicMonthFontNameLen(month, Language.solar);

    return { year: year, month: decodeString(month_ptr, month_len), day: day };
}

let hekenic = hekenic_from_gregorian(current_day());
console.log(hekenic.year.toString(), hekenic.month, hekenic.day);