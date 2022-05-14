import styles from 'ansi-styles';
import Color from 'color';
import * as process from 'process';
import { exit } from 'process';

const namedNotes = [{
    simpleName: "1",
    charName: "C", inputNames: ["C"],
}, {
    simpleName: "♯1",
    charName: "♯C", inputNames: ["#C"],
}, {
    simpleName: "2",
    charName: "D", inputNames: ["D"],
}, {
    simpleName: "♯2",
    charName: "♯D", inputNames: ["#D"],
}, {
    simpleName: "3",
    charName: "E", inputNames: ["E"],
}, {
    simpleName: "4",
    charName: "F", inputNames: ["F"],
}, {
    simpleName: "♯4",
    charName: "♯F", inputNames: ["#F"],
}, {
    simpleName: "5",
    charName: "G", inputNames: ["G"],
}, {
    simpleName: "♯5",
    charName: "♯G", inputNames: ["#G"],
}, {
    simpleName: "6",
    charName: "A", inputNames: ["A"],
}, {
    simpleName: "♯6",
    charName: "♯A", inputNames: ["#A"],
}, {
    simpleName: "7",
    charName: "B", inputNames: ["B"],
}];

const chordsLib: ChordInfo[] = [
    {
        name: "Major triad",
        zh: "大三和弦",
        semitones: [4, 7]
    },
    {
        name: "Augmented triad",
        zh: "增三和弦",
        semitones: [4, 8]
    },
    {
        name: "Augmented triad",
        zh: "减三和弦",
        semitones: [3, 6]
    },
    {
        name: "Minor triad",
        zh: "小三和弦",
        semitones: [3, 7]
    },
    {
        name: "Dominant seventh chord",
        zh: "属七和弦",
        semitones: [4, 7, 10]
    },
    {
        name: "Major seventh chord",
        zh: "大七和弦",
        semitones: [4, 7, 11]
    },
    {
        name: "Major seventh chord",
        zh: "小七和弦",
        semitones: [3, 7, 11]
    },
    {
        name: "Augmented seventh chord",
        zh: "增七和弦",
        semitones: [4, 8, 10]
    },

];

const guitarStrings = [
    {
        root: 4
    },
    {
        root: 9
    },
    {
        root: 2 + 12
    },
    {
        root: 7 + 12
    },
    {
        root: 11 + 12
    },
    {
        root: 4 + 24
    },
];

type ChordInfo = {
    name: string,
    zh: string,
    semitones: number[];
};
enum Align {
    Left, Center, Right
}
function padString(str: string, length: number, align: Align, inflate: string = " "): string {
    if (align == Align.Center) {
        let leftStr = "", rightStr = "";
        let lengthDiff = length - str.length;
        if (lengthDiff > 0) {
            leftStr = inflate.repeat(parseInt("" + (lengthDiff) / 2) + (lengthDiff % 2 == 0 ? 0 : 1));
            rightStr = inflate.repeat((lengthDiff) / 2);
        } else {
            return str.substring(0, length - 2) + "..";
        }
        return `${leftStr}${str}${rightStr}`;
    }
    return str;
}

function guitarBoards(shader: Shader, options: {
    dividers?: number[],
    frets: number;
}) {
    shader.beforeShade();
    guitarStrings.reverse().forEach((str, strIndex) => {
        let stringLine = "";
        for (let i = 0; i < options.frets; i++) {
            let pitch = str.root + i;
            stringLine += shader.shade(strIndex, i, options.frets, pitch);
            if (options.dividers?.includes(i)) {
                let bgColorStr = styles.bgColor.ansi256(styles.rgbToAnsi256(20, 20, 20));
                let fgColorStr = styles.color.ansi256(styles.rgbToAnsi256(240, 240, 240));
                stringLine += `${bgColorStr}${fgColorStr}|${styles.color.close}${styles.bgColor.close}`;
            }
        }
        console.log(stringLine);
    });
    shader.afterShade();
}

function getNotesName(semitone: number, needOct: boolean): string {
    let relativeSemitone = semitone % 12;
    if (needOct) {
        let oct = Math.floor(semitone / 12);
        let octStr = oct + 3;
        return namedNotes[relativeSemitone].charName + octStr;
    } else {
        return namedNotes[relativeSemitone].charName;
    }
}

interface Shader {
    beforeShade(): void;
    shade(stringIndex: number, i: number, length: number, pitch: number): string;
    afterShade(): void;
}
interface PitchFilter {
    filter(pitch: number): boolean;
}

class DefaultShader implements Shader {

    constructor(private hue: number) { }
    beforeShade(): void {
    }
    afterShade(): void {
    }

    shade(stringIndex: number, i: number, length: number, pitch: number): string {
        let notesName = getNotesName(pitch, true);
        let bgLightness = (i + 1) * 100.0 / length + 1;
        let bgColor = Color.hsl(this.hue, 100, bgLightness);
        let fgColor = Color.hsl(this.hue, 20, (bgLightness + 50) % 100);
        notesName = padString(notesName, 8, Align.Center);
        let bgColorStr = styles.bgColor.ansi256(styles.rgbToAnsi256(bgColor.red(), bgColor.green(), bgColor.blue()));
        let fgColorStr = styles.color.ansi256(styles.rgbToAnsi256(fgColor.red(), fgColor.green(), fgColor.blue()));
        return `${bgColorStr}${fgColorStr}${notesName}${styles.color.close}${styles.bgColor.close}`;
    }
}

abstract class HightLightShader implements Shader {

    constructor(public hue: number, public width: number = 8, public needOct: boolean = true) { }

    beforeShade(): void {
    }
    afterShade(): void {
    }
    abstract filter(pitch: number): boolean;
    getFgColor(stringIndex: number, i: number, length: number, pitch: number): Color {
        return Color.hsl(this.hue, 100, 20);
    }
    getBgColor(stringIndex: number, i: number, length: number, pitch: number): Color {
        return Color.hsl(this.hue, 100, 80);

    }
    getDefaultBgColor(stringIndex: number, i: number, length: number, pitch: number): Color {
        return Color.rgb(50, 50, 50)
    }

    shade(stringIndex: number, i: number, length: number, pitch: number): string {
        let notesName = getNotesName(pitch, this.needOct);
        notesName = padString(notesName, this.width, Align.Center);
        if (this.filter(pitch)) {
            let bgColor = this.getBgColor(stringIndex, i, length, pitch);
            let fgColor = this.getFgColor(stringIndex, i, length, pitch);
            let bgColorStr = styles.bgColor.ansi256(styles.rgbToAnsi256(bgColor.red(), bgColor.green(), bgColor.blue()));
            let fgColorStr = styles.color.ansi256(styles.rgbToAnsi256(fgColor.red(), fgColor.green(), fgColor.blue()));
            return `${bgColorStr}${fgColorStr}${notesName}${styles.color.close}${styles.bgColor.close}`;
        } else {
            let bgColor = this.getDefaultBgColor(stringIndex, i, length, pitch);
            let bgColorStr = styles.bgColor.ansi256(styles.rgbToAnsi256(bgColor.red(), bgColor.green(), bgColor.blue()));
            return `${bgColorStr}${padString("", this.width, Align.Center)}${styles.bgColor.close}`;
        }
    }
}

class MajorScaleShader extends HightLightShader {
    semitones = [0, 2, 4, 5, 7, 9, 11];
    constructor(hue: number, private root: number, fretWidth: number, needOct: boolean) {
        super(hue, fretWidth, needOct);
    }
    override filter(pitch: number): boolean {
        return this.semitones.includes((pitch + 12 - this.root) % 12);
    }

    override getFgColor(stringIndex: number, i: number, length: number, pitch: number): Color {
        return this.getBgColor(stringIndex, i, length, pitch).darken(1);
    }

    override getBgColor(stringIndex: number, i: number, length: number, pitch: number): Color {
        return Color.hsl(this.hue, 100, ((pitch + 12 - this.root) % 12) == 0 ? 100 : 50);
    }
}

class ChordsShader extends HightLightShader {
    constructor(hue: number, private root: number, fretWidth: number, private chordInfo: ChordInfo, needOct: boolean) {
        super(hue, fretWidth, needOct);
    }
    filter(pitch: number): boolean {
        let semitone = (pitch + 12 - this.root) % 12;
        return semitone == 0 || this.chordInfo.semitones.includes(semitone);
    }
    override getFgColor(stringIndex: number, i: number, length: number, pitch: number): Color {
        return this.getBgColor(stringIndex, i, length, pitch).darken(1);
    }
    override getBgColor(stringIndex: number, i: number, length: number, pitch: number): Color {
        return Color.hsl(this.hue, 100, ((pitch + 12 - this.root) % 12) == 0 ? 100 : 50);
    }
}
let hue = parseInt(Math.random() * 360 + "");
let scale: string | undefined = undefined;
let chord: string | undefined = undefined;
let showOct = true;
let frets = 18;
let fretWidth = 8;
let dividers: number[] = [0, 5, 10, 15];
process.argv.forEach(function (val) {
    if (val.startsWith("-scale=")) {
        scale = val.substring(val.indexOf('=') + 1).trim();
    } else if (val.startsWith("-chord=")) {
        chord = val.substring(val.indexOf('=') + 1).trim();
    } else if (val.startsWith("-root")) {
        let stringIndex = parseInt(val.substring(val.indexOf('=') - 1, val.indexOf('=')));
        let note = parseInt(val.substring(val.indexOf('=') + 1).trim());
        if (stringIndex >= 1 && stringIndex <= 6 && note >= 0) {
            guitarStrings[stringIndex - 1].root = note;
        } else {
            console.log(`Invalid root note setting.`);
            exit();
        }
    } else if (val.startsWith("-frets=")) {
        frets = parseInt(val.substring(val.indexOf('=') + 1).trim());
    } else if (val.startsWith("-fretWidth=")) {
        fretWidth = parseInt(val.substring(val.indexOf('=') + 1).trim());
    } else if (val.startsWith("-dividers=")) {
        let inputDividers = val.substring(val.indexOf('=') + 1).trim().split(",");
        dividers = [];
        inputDividers.forEach(it => {
            dividers.push(parseInt(it));
        });
    } else if (val.startsWith("-showOct=")) {
        showOct = val.substring(val.indexOf('=') + 1).trim().toLocaleLowerCase() == "true";
    } else if (val.startsWith("-hue=")) {
        hue = parseInt(val.substring(val.indexOf('=') + 1).trim());
    }
});

if (!scale && !chord) {
    console.log(`Please specific scale or chord. 
Usage:

fretboard [-scale=|-chord=][[#]A-G]
fretboard [-scale=|-chord=][[#]A-G]
          [-root1=${guitarStrings[0].root}] [-root2=${guitarStrings[1].root}] [-root3=${guitarStrings[2].root}] 
          [-root4=${guitarStrings[3].root}] [-root5=${guitarStrings[4].root}] [-root6=${guitarStrings[5].root}] 
          [-frets=${frets}] [-fretWidth=${fretWidth}] [-dividers=${dividers.join(",")}]
          [-showOct=${showOct}] [-hue=${hue}]
`);
    exit();
}
if (scale) {
    let parsedScale = namedNotes.findIndex(it => { return it.inputNames.includes(scale!); });
    if (parsedScale != -1) {
        guitarBoards(new MajorScaleShader(hue, parsedScale, fretWidth, showOct), {
            dividers,
            frets
        });
    } else {
        console.log("Invalid scale!");
        exit();
    }
}
if (chord) {
    let parsedRootNote = namedNotes.findIndex(it => { return it.inputNames.includes(chord!); });
    if (parsedRootNote != -1) {
        guitarBoards(new ChordsShader(hue, parsedRootNote, fretWidth, chordsLib[0], showOct), {
            dividers,
            frets
        });
    } else {
        console.log("Invalid chord!");
        exit();
    }
}