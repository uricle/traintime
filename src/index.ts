import Vue from 'vue';
import Component from 'vue-class-component';
declare var timetables: {
    timetable: number[][],
    name: string,
    shortname: string,
}[];
let thisapp: App;
function getTable() {
    return timetables;
}
document.addEventListener("DOMContentLoaded", function (event) {
    const app = new App({ el: '#app' });
    thisapp = app;
    app.times = timetables[0].timetable;
    app.name = timetables[0].name;
    document.title = timetables[0].name;
    const timer = setInterval(() => {
        app.now = new Date();
    }, 1000);
});
@Component({})
class App extends Vue {
    // data defines
    all: boolean;
    times: number[][];
    now: Date;
    timetables: any[];
    name: string;
    // initial data
    data(): {} {
        return {
            all: false,
            times: [],
            now: new Date(),
            timetables: timetables,
            name: ''
        }
    }
    get hours(): number[] {
        const h: number[] = Object.keys(this.times)
            .filter(key => key.match(/^\d+$/))
            .map(x => parseInt(x))
            .sort((a, b) => a - b);
        if (this.all) {
            return h;
        }
        if ( !this.now) {
            return h;
        }
        let nowhour = this.now.getHours();
        if ( nowhour < 6 ) { nowhour += 24; }
        return h.filter( x => x >= nowhour );
    }
    get nextTime(): {
        hour: number, min: number, depart: number,
        ahour: number, amin: number, adepart: number
    } {
        const now = this.now;
        if (!now) { return null; }
        const currentmin = now.getMinutes();
        const currenthour = now.getHours();
        const retvalue = {
            hour: 0, min: 0, depart: 0,
            ahour: 0, amin: 0, adepart: 0
        };
        const nextTimeInfo = this.getdepart(this.times, currenthour, currentmin);
        if ( nextTimeInfo ) {
            retvalue.hour = nextTimeInfo.hour;
            retvalue.min = nextTimeInfo.min;
            retvalue.depart = nextTimeInfo.depart;
            const afterTimeInfo = this.getdepart(this.times, retvalue.hour, retvalue.min);
            if ( afterTimeInfo ) {
                retvalue.ahour = afterTimeInfo.hour;
                retvalue.amin = afterTimeInfo.min;
                retvalue.adepart = nextTimeInfo.depart + afterTimeInfo.depart;
            }
        }
        if ( retvalue.hour === 0 ) {
            return null;
        }
        return retvalue;
    }
    get currenttime(): string {
        return this.now.toLocaleTimeString();
    }
    getdepart(table: number[][], hour: number, min: number) {
        if (!table || table.length < 1) {
            return null;
        }
        if (!(hour in table)) {
            return null;
        }
        let curTimeTable = table[hour];
        const index = curTimeTable.findIndex((value) => {
            return min < value;
        });
        if (index >= 0) {
            return { hour: hour, min: curTimeTable[index], depart: curTimeTable[index] - min };
        }
        if (hour + 1 in table) {
            const aftermin = table[hour + 1][0];
            return { hour: hour + 1, min: aftermin, depart: 60 + aftermin - min };
        }
        return null;
    }
    mins(hour: number): number[] {
        const times: { [key:number]: number[] } = this.times;
        return times[hour];
    }
    setTimetable(index:number){
        // console.log(index);
        this.times = timetables[index].timetable;
        this.name = timetables[index].name;
        document.title = this.name;
    }
}
