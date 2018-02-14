import Vue from 'vue';
import Component from 'vue-class-component';

type timetable = {
    timetable: number[][],
    name: string,
    shortname: string,
};
type transferInfo = {
    start: string,
    target: string,
    difftime: number,
    walktime: number,
};
type nextTrainInfo = {
    linename: string,
    arrivalHour: number,
    arrivalMin: number,
    rideHour: number,
    rideMin: number,
    waitMin: number
    minimum: boolean
};
declare var timetables: timetable[];
declare var transfertable: transferInfo[];
let thisapp: App;
function getTable() {
    return timetables;
}
document.addEventListener("DOMContentLoaded", function (event) {
    const app = new App({ el: '#app' });
    thisapp = app;
    app.times = timetables[0];
    document.title = timetables[0].name;
    const timer = setInterval(() => {
        if (app.debug) {
            app.now = new Date(2018, 1, 12, app.debug_hour, app.debug_min);
        } else {
            app.now = new Date();
        }
    }, 1000);
});
@Component({})
class App extends Vue {
    // data defines
    all: boolean;
    debug: boolean;
    debug_hour: number;
    debug_min: number;
    times: timetable;
    now: Date;
    timetables: any[];
    // initial data
    data(): {} {
        return {
            all: false,
            debug: false,
            debug_hour: 0,
            debug_min: 0,
            times: { timetable: [] },
            now: new Date(),
            timetables: timetables,
        }
    }
    get hours(): number[] {
        const h: number[] = Object.keys(this.times.timetable)
            .filter(key => key.match(/^\d+$/))
            .map(x => parseInt(x))
            .sort((a, b) => a - b);
        if (this.all) {
            return h;
        }
        if (!this.now) {
            return h;
        }
        let nowhour = this.now.getHours();
        if (nowhour < 6) { nowhour += 24; }
        return h.filter(x => x >= nowhour);
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
        const nextTimeInfo = this.getdepart(this.times.timetable, currenthour, currentmin);
        if (nextTimeInfo) {
            retvalue.hour = nextTimeInfo.hour;
            retvalue.min = nextTimeInfo.min;
            retvalue.depart = nextTimeInfo.depart;
            const afterTimeInfo = this.getdepart(this.times.timetable, retvalue.hour, retvalue.min);
            if (afterTimeInfo) {
                retvalue.ahour = afterTimeInfo.hour;
                retvalue.amin = afterTimeInfo.min;
                retvalue.adepart = nextTimeInfo.depart + afterTimeInfo.depart;
            }
        }
        if (retvalue.hour === 0) {
            return null;
        }
        return retvalue;
    }
    get currenttime(): string {
        return this.now.toLocaleTimeString();
    }
    // get transfers(): transferInfo[] {
    //     const transfer = this.getTransfer(this.times.shortname);
    //     if (!transfer) {
    //         return null;
    //     }
    //     return transfer;
    // }
    getdepart(table: number[][], hour: number, min: number) {
        if (!table || table.length < 1) {
            return null;
        }
        if (hour < 5) {
            hour += 24;
        }
        if (!(hour in table)) {
            return null;
        }
        let curTimeTable = table[hour];
        const index = curTimeTable.findIndex(value => min < value);
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
        const times: { [key: number]: number[] } = this.times.timetable;
        return times[hour];
    }
    setTimetable(index: number) {
        this.times = timetables[index];
        document.title = timetables[index].name;
    }
    getTimetableFromName(name: string): timetable {
        const index = timetables.findIndex(value => value.shortname === name);
        if (index < 0) {
            return null;
        }
        return timetables[index];
    }
    getTransferTime(name: string, hour: number, min: number): nextTrainInfo[] {
        if (!transfertable) {
            return null;
        }
        const transfers = transfertable.filter(value => value.start === name)
        if (transfers.length === 0) {
            return null;
        }
        if (hour >= 24) {
            hour -= 24;
        }
        const baseTime = new Date(this.now);
        baseTime.setHours(hour);
        baseTime.setMinutes(min);
        baseTime.setSeconds(0);
        const nextInfos: nextTrainInfo[] = [];
        // 到着時刻
        transfers.forEach((target) => {
            const nextInfo = {
                linename: target.target,
                arrivalHour: 0,
                arrivalMin: 0,
                rideHour: 0,
                rideMin: 0,
                waitMin: 0,
                minimum: false
            };
            // 到着時刻
            const arrivalTime = new Date(baseTime);
            arrivalTime.setMinutes(min + target.difftime);
            nextInfo.arrivalHour = arrivalTime.getHours();
            nextInfo.arrivalMin = arrivalTime.getMinutes();
            // 徒歩込みの乗り換え可能時間
            const rideTime = new Date(arrivalTime);
            rideTime.setMinutes(arrivalTime.getMinutes() + target.walktime);
            // 乗り換え先の時刻表取得
            const trasnferTimeTable = this.getTimetableFromName(target.target);
            if (!trasnferTimeTable) {
                return;
            }
            const transfer = this.getdepart(trasnferTimeTable.timetable, rideTime.getHours(), rideTime.getMinutes());
            if (!transfer) {
                return;
            }
            if (transfer.hour >= 24) {
                transfer.hour -= 24;
            }
            nextInfo.rideHour = transfer.hour;
            nextInfo.rideMin = transfer.min;
            // 待ち時間
            const nextTime = new Date(rideTime);
            nextTime.setHours(transfer.hour);
            nextTime.setMinutes(transfer.min);
            if (nextTime.getTime() < arrivalTime.getTime()) {
                nextTime.setDate(nextTime.getDate() + 1);
            }
            const waitMilliseconds = nextTime.getTime() - arrivalTime.getTime();
            nextInfo.waitMin = Math.floor(waitMilliseconds / 1000 / 60);
            nextInfos.push(nextInfo);
        });
        const minTime = Math.min( ...nextInfos.map( x => x.waitMin ) );
        nextInfos.forEach( m => {
            if (m.waitMin === minTime) {
                m.minimum = true;
            }
            console.log(`${m.waitMin} ${minTime} ${m.minimum}`);
        });
        return nextInfos;
    }
}
